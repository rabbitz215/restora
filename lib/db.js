const mysql = require('mysql2/promise');

const SYSTEM_DBS = new Set(['information_schema', 'mysql', 'performance_schema', 'sys']);

function connect(conn, database) {
  return mysql.createConnection({
    host: conn.host || '127.0.0.1',
    port: Number(conn.port) || 3306,
    user: conn.user,
    password: conn.password || '',
    database: database || undefined,
    ssl: conn.ssl ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 8000,
    multipleStatements: false,
    charset: 'utf8mb4',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });
}

// Small pools for the data viewer and sidebar so paging doesn't reconnect.
const pools = new Map();
function pool(conn) {
  const key = JSON.stringify([conn.host, conn.port, conn.user, conn.password, !!conn.ssl]);
  let p = pools.get(key);
  if (!p) {
    p = mysql.createPool({
      host: conn.host || '127.0.0.1', port: Number(conn.port) || 3306, user: conn.user, password: conn.password || '',
      ssl: conn.ssl ? { rejectUnauthorized: false } : undefined, connectTimeout: 8000, charset: 'utf8mb4',
      dateStrings: true, supportBigNumbers: true, bigNumberStrings: true, connectionLimit: 3, maxIdle: 1, idleTimeout: 60000,
    });
    // MySQL 8 caches TABLE_ROWS / DATA_LENGTH for a day by default.
    p.on('connection', (c) => c.query('SET SESSION information_schema_stats_expiry = 0', () => {}));
    pools.set(key, p);
  }
  return p;
}
function closePools() { for (const p of pools.values()) p.end().catch(() => {}); pools.clear(); }

async function withConn(conn, database, fn) {
  const c = await connect(conn, database);
  try { return await fn(c); } finally { c.end().catch(() => {}); }
}

// Is binary logging on, and may this user turn it off for its own session?
// Skipping it means a restore isn't written to disk a second time.
async function binlogProbe(conn) {
  return withConn(conn, null, async (c) => {
    const [[row]] = await c.query('SELECT @@log_bin AS on_');
    if (!Number(row.on_)) return { on: false, canSkip: false };
    try { await c.query('SET SESSION sql_log_bin = 0'); return { on: true, canSkip: true }; } catch { return { on: true, canSkip: false }; }
  });
}

const qi = (s) => '`' + String(s).replace(/`/g, '``') + '`';

async function test(conn) {
  const t = Date.now();
  return withConn(conn, null, async (c) => {
    const [[row]] = await c.query('SELECT VERSION() AS v');
    return { ok: true, version: row.v, ms: Date.now() - t };
  });
}

async function listDatabases(conn) {
  return withConn(conn, null, async (c) => {
    const [rows] = await c.query(
      `SELECT s.SCHEMA_NAME AS name, COUNT(t.TABLE_NAME) AS tables, COALESCE(SUM(t.DATA_LENGTH + t.INDEX_LENGTH),0) AS size
       FROM information_schema.SCHEMATA s LEFT JOIN information_schema.TABLES t ON t.TABLE_SCHEMA = s.SCHEMA_NAME
       GROUP BY s.SCHEMA_NAME ORDER BY s.SCHEMA_NAME`);
    return rows.filter((r) => !SYSTEM_DBS.has(r.name)).map((r) => ({ name: r.name, tables: Number(r.tables), size: Number(r.size) }));
  });
}

async function listTables(conn, db) {
  return withConn(conn, db, async (c) => {
    const [rows] = await c.query(
      `SELECT TABLE_NAME AS t, COLUMN_NAME AS c, COLUMN_TYPE AS type, EXTRA AS extra
       FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, ORDINAL_POSITION`, [db]);
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.t)) map.set(r.t, []);
      map.get(r.t).push({ name: r.c, type: r.type, auto: /auto_increment/i.test(r.extra) });
    }
    return [...map.entries()].map(([name, columns]) => ({ name, columns }));
  });
}

async function prepareDatabase(conn, db, { create, dropFirst }) {
  return withConn(conn, null, async (c) => {
    if (dropFirst) await c.query(`DROP DATABASE IF EXISTS ${qi(db)}`);
    if (create || dropFirst) await c.query(`CREATE DATABASE IF NOT EXISTS ${qi(db)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  });
}

async function dbStats(conn, db, { analyze = false } = {}) {
  return withConn(conn, null, async (c) => {
    if (analyze) {
      // Freshly loaded tables report stale TABLE_ROWS until analyzed.
      const [tbls] = await c.query(`SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' LIMIT 500`, [db]);
      for (let i = 0; i < tbls.length; i += 50) {
        const list = tbls.slice(i, i + 50).map((r) => `${qi(db)}.${qi(r.t)}`).join(', ');
        try { await c.query(`ANALYZE NO_WRITE_TO_BINLOG TABLE ${list}`); } catch {}
      }
    }
    try { await c.query('SET SESSION information_schema_stats_expiry = 0'); } catch {} // MySQL 8 caches TABLE_ROWS
    const [[r]] = await c.query(
      `SELECT COUNT(*) AS tables, COALESCE(SUM(TABLE_ROWS),0) AS rows_, COALESCE(SUM(DATA_LENGTH+INDEX_LENGTH),0) AS size,
              SUM(TABLE_TYPE='VIEW') AS views FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`, [db]);
    const [[rt]] = await c.query(`SELECT COUNT(*) AS n FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?`, [db]);
    const [[tr]] = await c.query(`SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?`, [db]);
    return { tables: Number(r.tables), rows: Number(r.rows_), size: Number(r.size), views: Number(r.views || 0), routines: Number(rt.n), triggers: Number(tr.n) };
  });
}

async function listObjects(conn, db) {
  const [rows] = await pool(conn).query(
    `SELECT TABLE_NAME AS name, TABLE_TYPE AS type, TABLE_ROWS AS rows_, DATA_LENGTH AS data, INDEX_LENGTH AS idx
     FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`, [db]);
  return rows.map((r) => ({ name: r.name, view: r.type === 'VIEW', rows: r.rows_ == null ? null : Number(r.rows_), size: Number(r.data || 0) + Number(r.idx || 0), data: Number(r.data || 0) }));
}

/* ---------- data viewer ---------- */
const NUMERIC = /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|year)$/;
const BINARY = /^(binary|varbinary|tinyblob|blob|mediumblob|longblob|geometry|point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)$/;
const likeEsc = (s) => s.replace(/[\\%_]/g, (m) => '\\' + m);
const likeVal = (s) => (s.includes('*') ? likeEsc(s).replace(/\*/g, '%') : `%${likeEsc(s)}%`);

// DbGate-style filter expressions for one column.
function filterSql(col, expr) {
  const c = qi(col.name);
  const s = String(expr ?? '').trim();
  if (!s) return null;
  const up = s.toUpperCase();
  if (up === 'NULL' || up === 'IS NULL') return [`${c} IS NULL`, []];
  if (up === 'NOT NULL' || up === '!NULL' || up === 'IS NOT NULL') return [`${c} IS NOT NULL`, []];
  if (up === 'EMPTY' || s === "''" || s === '""') return [`${c} = ''`, []];
  if (up === '!EMPTY') return [`${c} <> ''`, []];
  const inm = s.match(/^(NOT\s+)?IN\s+([\s\S]+)$/); // uppercase only, so "in progress" stays a text search
  if (inm) {
    const vals = inm[2].split(',').map((v) => v.trim()).filter((v) => v !== '');
    if (vals.length) return [inm[1] ? `(${c} IS NULL OR ${c} NOT IN (${vals.map(() => '?').join(', ')}))` : `${c} IN (${vals.map(() => '?').join(', ')})`, vals];
  }
  const m = s.match(/^(>=|<=|<>|!=|>|<|=)\s*([\s\S]*)$/);
  if (m) return [`${c} ${m[1] === '!=' ? '<>' : m[1]} ?`, [m[2]]];
  if (s.startsWith('!')) return [`(${c} IS NULL OR ${c} NOT LIKE ?)`, [likeVal(s.slice(1))]];
  if (NUMERIC.test(col.dataType) && /^-?\d+(\.\d+)?$/.test(s)) return [`${c} = ?`, [s]];
  return [`${c} LIKE ?`, [likeVal(s)]];
}

function cellValue(v, col) {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) {
    if (col.dataType === 'bit') return v.length <= 6 ? v.readUIntBE(0, v.length) : '0x' + v.toString('hex');
    return { bin: v.length, hex: v.subarray(0, 48).toString('hex') };
  }
  if (typeof v === 'object') v = JSON.stringify(v);
  if (typeof v === 'string' && v.length > 5000) return { text: v.slice(0, 5000), len: v.length };
  return v;
}

// Foreign keys in both directions, grouped per constraint (multi-column FKs supported).
async function tableRefs(p, db, table) {
  const [rows] = await p.query(
    `SELECT CONSTRAINT_NAME AS name, TABLE_SCHEMA AS db, TABLE_NAME AS t, COLUMN_NAME AS col,
            REFERENCED_TABLE_SCHEMA AS rdb, REFERENCED_TABLE_NAME AS rt, REFERENCED_COLUMN_NAME AS rcol
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE REFERENCED_TABLE_NAME IS NOT NULL
       AND ((TABLE_SCHEMA = ? AND TABLE_NAME = ?) OR (REFERENCED_TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME = ?))
     ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION`, [db, table, db, table]);
  const group = (list) => {
    const m = new Map();
    for (const r of list) {
      const k = `${r.db}.${r.t}.${r.name}`;
      if (!m.has(k)) m.set(k, { name: r.name, db: r.db, table: r.t, columns: [], refDb: r.rdb, refTable: r.rt, refColumns: [] });
      const g = m.get(k); g.columns.push(r.col); g.refColumns.push(r.rcol);
    }
    return [...m.values()];
  };
  return {
    out: group(rows.filter((r) => r.db === db && r.t === table)),
    in: group(rows.filter((r) => r.rdb === db && r.rt === table)),
  };
}

async function browse(conn, db, table, { filters = {}, search = '', sort = [], offset = 0, limit = 200, meta = false } = {}) {
  const p = pool(conn);
  const t0 = Date.now();
  const [colRows] = await p.query(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, COLUMN_TYPE AS type, COLUMN_KEY AS ckey, IS_NULLABLE AS nullable, EXTRA AS extra
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`, [db, table]);
  if (!colRows.length) throw new Error(`Table ${db}.${table} not found`);
  const columns = colRows.map((c) => ({ name: c.name, dataType: String(c.dataType).toLowerCase(), type: c.type, pk: c.ckey === 'PRI', nullable: c.nullable === 'YES', auto: /auto_increment/i.test(c.extra) }));
  const byName = new Map(columns.map((c) => [c.name, c]));

  const where = [], params = [];
  for (const [name, expr] of Object.entries(filters)) {
    const col = byName.get(name); if (!col) continue;
    const f = filterSql(col, expr); if (!f) continue;
    where.push(f[0]); params.push(...f[1]);
  }
  const q = String(search || '').trim();
  if (q) {
    const cols = columns.filter((c) => !BINARY.test(c.dataType));
    if (cols.length) { where.push('(' + cols.map((c) => `${qi(c.name)} LIKE ?`).join(' OR ') + ')'); params.push(...cols.map(() => likeVal(q))); }
  }
  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const order = sort.filter((s) => byName.has(s.column)).map((s) => `${qi(s.column)} ${s.dir === 'desc' ? 'DESC' : 'ASC'}`);
  const from = `${qi(db)}.${qi(table)}`;
  const lim = Math.min(Math.max(1, Number(limit) || 200), 5000), off = Math.max(0, Number(offset) || 0);
  const sql = `SELECT * FROM ${from}${whereSql}${order.length ? ' ORDER BY ' + order.join(', ') : ''} LIMIT ${lim} OFFSET ${off}`;

  const c = await p.getConnection();
  try {
    const [rows] = await c.query({ sql, rowsAsArray: true }, params);
    const ms = Date.now() - t0;
    // Counting can be slow on huge tables; cap it and fall back to the estimate.
    let total = null, approx = false;
    try { await c.query('SET SESSION max_execution_time = 4000'); } catch { try { await c.query('SET SESSION max_statement_time = 4'); } catch {} }
    try { const [[r]] = await c.query(`SELECT COUNT(*) AS n FROM ${from}${whereSql}`, params); total = Number(r.n); }
    catch {
      approx = true;
      if (!where.length) { const [[r]] = await c.query('SELECT TABLE_ROWS AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [db, table]); total = Number(r?.n) || null; }
    }
    try { await c.query('SET SESSION max_execution_time = 0'); } catch { try { await c.query('SET SESSION max_statement_time = 0'); } catch {} }
    const refs = meta ? await tableRefs(p, db, table).catch(() => ({ out: [], in: [] })) : undefined;
    return { refs, columns, rows: rows.map((r) => r.map((v, i) => cellValue(v, columns[i]))), total, approx, offset: off, limit: lim, ms, sql: mysql.format(sql, params) };
  } finally { c.release(); }
}

/* ---------- table structure ---------- */
// Everything the Structure view shows: properties, columns, keys, indexes, foreign keys both ways, triggers and the DDL.
async function tableStructure(conn, db, table) {
  const p = pool(conn);
  const [[ver]] = await p.query('SELECT VERSION() AS v');
  const maria = /mariadb/i.test(ver.v);
  const [[info]] = await p.query(
    `SELECT TABLE_TYPE AS type, ENGINE AS engine, ROW_FORMAT AS rowFormat, TABLE_ROWS AS rowCount, AVG_ROW_LENGTH AS avgRow, DATA_LENGTH AS dataBytes,
            INDEX_LENGTH AS indexBytes, AUTO_INCREMENT AS autoInc, CREATE_TIME AS created, UPDATE_TIME AS updated, TABLE_COLLATION AS collation, TABLE_COMMENT AS comment
     FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [db, table]);
  if (!info) throw new Error(`Table ${db}.${table} not found`);
  const colSql = (gen) => `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, DATA_TYPE AS dataType, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS def, EXTRA AS extra,
            COLUMN_KEY AS ckey, CHARACTER_SET_NAME AS charset, COLLATION_NAME AS collation, COLUMN_COMMENT AS comment${gen ? ', GENERATION_EXPRESSION AS expr' : ''}
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`;
  let colRows;
  try { [colRows] = await p.query(colSql(true), [db, table]); } catch { [colRows] = await p.query(colSql(false), [db, table]); } // servers older than MySQL 5.7 / MariaDB 10.2
  const columns = colRows.map((c) => ({
    name: c.name, type: c.type, dataType: String(c.dataType).toLowerCase(), nullable: c.nullable === 'YES', default: c.def,
    extra: c.extra || '', auto: /auto_increment/i.test(c.extra), pk: c.ckey === 'PRI', unsigned: /\bunsigned\b/i.test(c.type), zerofill: /\bzerofill\b/i.test(c.type),
    charset: c.charset, collation: c.collation, comment: c.comment || '', expr: c.expr || '', generated: !!c.expr,
    // Editable form: base type, default as SQL, ON UPDATE and STORED split out (see alterTableSql).
    base: String(c.type).replace(/\s+(unsigned|zerofill)\b/gi, '').trim(), defaultSql: defaultSql(c, maria),
    onUpdate: ((c.extra || '').match(/on update (\w+(\(\d*\))?)/i) || [])[1] || '', stored: /STORED|PERSISTENT/i.test(c.extra || ''),
  }));

  const [idxRows] = await p.query(
    `SELECT INDEX_NAME AS name, NON_UNIQUE AS nonUnique, COLUMN_NAME AS col, SUB_PART AS sub, INDEX_TYPE AS type, INDEX_COMMENT AS comment
     FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY INDEX_NAME = 'PRIMARY' DESC, INDEX_NAME, SEQ_IN_INDEX`, [db, table]);
  const idx = new Map();
  for (const r of idxRows) {
    if (!idx.has(r.name)) idx.set(r.name, { name: r.name, unique: !Number(r.nonUnique), type: r.type, comment: r.comment || '', columns: [] });
    idx.get(r.name).columns.push(r.col == null ? '(expression)' : r.sub ? `${r.col}(${r.sub})` : r.col);
  }
  const allIdx = [...idx.values()];
  const primaryKey = allIdx.find((i) => i.name === 'PRIMARY') || null;

  const [fkRows] = await p.query(
    `SELECT k.CONSTRAINT_NAME AS name, k.TABLE_SCHEMA AS db, k.TABLE_NAME AS t, k.COLUMN_NAME AS col,
            k.REFERENCED_TABLE_SCHEMA AS rdb, k.REFERENCED_TABLE_NAME AS rt, k.REFERENCED_COLUMN_NAME AS rcol, rc.UPDATE_RULE AS onUpdate, rc.DELETE_RULE AS onDelete
     FROM information_schema.KEY_COLUMN_USAGE k
     LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME AND rc.TABLE_NAME = k.TABLE_NAME
     WHERE k.REFERENCED_TABLE_NAME IS NOT NULL
       AND ((k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ?) OR (k.REFERENCED_TABLE_SCHEMA = ? AND k.REFERENCED_TABLE_NAME = ?))
     ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`, [db, table, db, table]);
  const group = (list) => {
    const m = new Map();
    for (const r of list) {
      const k = `${r.db}.${r.t}.${r.name}`;
      if (!m.has(k)) m.set(k, { name: r.name, db: r.db, table: r.t, columns: [], refDb: r.rdb, refTable: r.rt, refColumns: [], onUpdate: r.onUpdate || '', onDelete: r.onDelete || '' });
      const g = m.get(k); g.columns.push(r.col); g.refColumns.push(r.rcol);
    }
    return [...m.values()];
  };

  let triggers = [];
  try {
    [triggers] = await p.query(
      `SELECT TRIGGER_NAME AS name, ACTION_TIMING AS timing, EVENT_MANIPULATION AS event FROM information_schema.TRIGGERS
       WHERE EVENT_OBJECT_SCHEMA = ? AND EVENT_OBJECT_TABLE = ? ORDER BY ACTION_TIMING, EVENT_MANIPULATION, ACTION_ORDER`, [db, table]);
  } catch {}

  let ddl = '';
  try { const [[r]] = await p.query(`SHOW CREATE TABLE ${qi(db)}.${qi(table)}`); ddl = r['Create Table'] || r['Create View'] || ''; } catch (e) { ddl = `-- Could not read the definition: ${e.message}`; }

  return {
    maria, version: ver.v,
    view: /VIEW/i.test(info.type),
    info: { engine: info.engine, rowFormat: info.rowFormat, rows: info.rowCount == null ? null : Number(info.rowCount), avgRow: Number(info.avgRow) || 0, dataBytes: Number(info.dataBytes) || 0,
      indexBytes: Number(info.indexBytes) || 0, autoInc: info.autoInc == null ? null : Number(info.autoInc), created: info.created, updated: info.updated, collation: info.collation, comment: info.comment || '' },
    columns, primaryKey,
    indexes: allIdx.filter((i) => i.name !== 'PRIMARY' && !i.unique),
    uniques: allIdx.filter((i) => i.name !== 'PRIMARY' && i.unique),
    foreignKeys: group(fkRows.filter((r) => r.db === db && r.t === table)),
    dependencies: group(fkRows.filter((r) => r.rdb === db && r.rt === table)),
    triggers, ddl,
  };
}

/* ---------- table structure editing ---------- */
const DATE_FN = /^(CURRENT_TIMESTAMP|NOW|LOCALTIME|LOCALTIMESTAMP|CURRENT_DATE|CURDATE|CURRENT_TIME|CURTIME|UTC_TIMESTAMP)\b/i;
// information_schema's COLUMN_DEFAULT as an SQL expression: MariaDB already returns one, MySQL returns the bare value.
function defaultSql(c, maria) {
  const d = c.def;
  if (d == null) return '';
  if (maria) return d === 'NULL' ? '' : String(d);
  if (/DEFAULT_GENERATED/i.test(c.extra || '')) return DATE_FN.test(d) ? d : `(${d})`;
  if (DATE_FN.test(d) && /date|time/i.test(c.dataType)) return d;
  if (/^b'[01]*'$/i.test(d)) return d;
  if (/^-?\d+(\.\d+)?$/.test(d) && /int|dec|num|float|double|bit|year|real/i.test(c.dataType)) return d;
  return mysql.escape(String(d));
}
// What the user typed as a default, as SQL: literals and functions stay, other text gets quoted.
function normDefault(v) {
  const d = String(v ?? '').trim();
  if (!d) return '';
  if (/^'(?:[^'\\]|\\.|'')*'$/s.test(d) || /^\(.*\)$/s.test(d) || /^-?\d+(\.\d+)?$/.test(d) || /^(b'[01]*'|0x[0-9a-f]+)$/i.test(d)) return d;
  if (/^(NULL|TRUE|FALSE)$/i.test(d)) return d.toUpperCase();
  if (/^(CURRENT_TIMESTAMP|NOW|LOCALTIME|LOCALTIMESTAMP|CURRENT_DATE|CURDATE|CURRENT_TIME|CURTIME|UTC_TIMESTAMP)(\s*\(\s*\d?\s*\))?$/i.test(d)) return d.toUpperCase().replace(/\s+/g, '');
  return mysql.escape(d);
}
const EDIT_TYPE = /^[a-z][a-z0-9_ ]*(\(\s*[^;]*\))?$/i;
const FK_RULES = new Set(['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT']);
const TEXTY = /char|text|enum|set/i;
// One canonical shape for a column, so the original and the edited version can be compared.
function colShape(c) {
  return {
    name: String(c.name || '').trim(), type: [String(c.base || '').trim().replace(/\s+/g, ' '), c.unsigned ? 'unsigned' : '', c.zerofill ? 'zerofill' : ''].filter(Boolean).join(' '),
    nullable: !!c.nullable && !c.auto, default: c.auto || c.expr ? '' : normDefault(c.defaultSql ?? c.default), auto: !!c.auto,
    onUpdate: String(c.onUpdate || '').trim(), comment: String(c.comment || ''), expr: String(c.expr || '').trim(), stored: !!c.stored,
  };
}
const sameCol = (a, b) => JSON.stringify({ ...a, type: a.type.toLowerCase(), onUpdate: a.onUpdate.toUpperCase() }) === JSON.stringify({ ...b, type: b.type.toLowerCase(), onUpdate: b.onUpdate.toUpperCase() });
function colDef(c, keep) {
  let s = `${qi(c.name)} ${c.type}`;
  // Keep a text column's own charset/collation when it is redefined, so CHANGE doesn't silently convert it.
  if (keep?.collation && /^\w+$/.test(keep.collation) && /^\w+$/.test(keep.charset || '') && TEXTY.test(c.type)) s += ` CHARACTER SET ${keep.charset} COLLATE ${keep.collation}`;
  if (c.expr) s += ` GENERATED ALWAYS AS (${c.expr}) ${c.stored ? 'STORED' : 'VIRTUAL'}`;
  s += c.nullable ? ' NULL' : ' NOT NULL';
  if (!c.expr && c.default) s += ' DEFAULT ' + c.default;
  if (c.auto) s += ' AUTO_INCREMENT';
  if (c.onUpdate) s += ' ON UPDATE ' + c.onUpdate;
  if (c.comment) s += ' COMMENT ' + mysql.escape(c.comment);
  return s;
}
const idxCol = (c) => { const m = String(c).trim().match(/^(.+?)\s*\(\s*(\d+)\s*\)$/); return m ? `${qi(m[1])}(${m[2]})` : qi(String(c).trim()); };
const list = (a) => (a || []).map((x) => String(x).trim()).filter(Boolean);

// Turns an edited structure into ALTER TABLE statements, diffed against the table as it is now.
// Order: drop foreign keys, one ALTER for columns/keys/indexes/options, then add foreign keys.
function alterTableSql(db, table, cur, draft) {
  if (cur.view) throw new Error('Views can\'t be edited here');
  const from = `${qi(db)}.${qi(table)}`;
  const curCols = new Map(cur.columns.map((c) => [c.name, c]));
  const cols = (draft.columns || []).map((c) => ({ orig: c.orig || null, ...colShape(c) }));
  if (!cols.length) throw new Error('A table needs at least one column');
  const seen = new Set();
  for (const c of cols) {
    if (!NAME_OK(c.name)) throw new Error(`Invalid column name "${c.name}"`);
    if (seen.has(c.name.toLowerCase())) throw new Error(`Column "${c.name}" is listed twice`);
    seen.add(c.name.toLowerCase());
    if (c.orig && !curCols.has(c.orig)) throw new Error(`Column ${c.orig} no longer exists. Refresh the structure and try again`);
    if (!EDIT_TYPE.test(c.type)) throw new Error(`"${c.type || '(empty)'}" is not a valid type for ${c.name}`);
    if (c.auto && !/int/i.test(c.type)) throw new Error(`Auto increment needs an integer type (${c.name})`);
  }
  if (cols.filter((c) => c.auto).length > 1) throw new Error('Only one column can auto increment');
  const rename = new Map(cols.filter((c) => c.orig).map((c) => [c.orig, c.name]));
  const dropped = cur.columns.filter((c) => !rename.has(c.name)).map((c) => c.name);

  // Primary key, compared after renames.
  const curPk = (cur.primaryKey?.columns || []).map((n) => rename.get(n) ?? `\0${n}`);
  const pk = list(draft.primaryKey);
  for (const n of pk) if (!seen.has(n.toLowerCase())) throw new Error(`Primary key column ${n} doesn't exist`);
  const autoCol = cols.find((c) => c.auto);
  if (autoCol && !pk.includes(autoCol.name) && !(draft.indexes || []).some((i) => list(i.columns)[0] === autoCol.name)) throw new Error(`${autoCol.name} auto increments, so it must be in the primary key or first in an index`);
  const pkChanged = curPk.join('\0') !== pk.join('\0');

  // Indexes (unique and non-unique; the primary key is handled above).
  const curIdx = new Map([...cur.indexes, ...cur.uniques].map((i) => [i.name, i]));
  const idxDraft = (draft.indexes || []).map((i) => ({ orig: i.orig || null, name: String(i.name || '').trim(), columns: list(i.columns), unique: !!i.unique, kind: /FULLTEXT|SPATIAL/i.test(i.kind || '') ? i.kind.toUpperCase() : '', comment: i.comment || '' }));
  const idxNames = new Set();
  const idxSig = (i, map) => JSON.stringify([i.name, i.columns.map((c) => { const m = c.match(/^(.+?)(\(\d+\))?$/); return (map ? map.get(m[1]) ?? `\0${m[1]}` : m[1]) + (m[2] || ''); }), i.unique, i.kind]);
  const dropIdx = [], addIdx = [];
  for (const i of idxDraft) {
    if (!i.columns.length) throw new Error(`Index ${i.name || '(unnamed)'} needs at least one column`);
    if (i.name && (!NAME_OK(i.name) || /^primary$/i.test(i.name))) throw new Error(`Invalid index name "${i.name}"`);
    if (i.name && idxNames.has(i.name.toLowerCase())) throw new Error(`Index name "${i.name}" is used twice`);
    if (i.name) idxNames.add(i.name.toLowerCase());
    for (const c of i.columns) { const n = c.replace(/\s*\(\d+\)$/, ''); if (n !== '(expression)' && !seen.has(n.toLowerCase())) throw new Error(`Index ${i.name || '(unnamed)'}: column ${n} doesn't exist`); }
    const o = i.orig && curIdx.get(i.orig);
    if (o) {
      const before = { name: o.name, columns: o.columns, unique: o.unique, kind: /FULLTEXT|SPATIAL/i.test(o.type) ? o.type.toUpperCase() : '' };
      if (idxSig(before, rename) === idxSig(i)) continue;
      if (i.columns.includes('(expression)')) throw new Error(`Index ${o.name} is on an expression and can only be removed here, not changed`);
      dropIdx.push(o.name);
    }
    addIdx.push(i);
  }
  for (const o of curIdx.values()) if (!idxDraft.some((i) => i.orig === o.name)) dropIdx.push(o.name);

  // Foreign keys.
  const curFk = new Map(cur.foreignKeys.map((f) => [f.name, f]));
  const fkDraft = (draft.foreignKeys || []).map((f) => ({ orig: f.orig || null, name: String(f.name || '').trim(), columns: list(f.columns), refDb: String(f.refDb || db).trim(), refTable: String(f.refTable || '').trim(), refColumns: list(f.refColumns), onUpdate: String(f.onUpdate || 'NO ACTION').toUpperCase(), onDelete: String(f.onDelete || 'RESTRICT').toUpperCase() }));
  const dropFk = [], addFk = [];
  const rule = (r) => (r === 'NO ACTION' || r === 'RESTRICT' ? 'RESTRICT' : r); // InnoDB treats them the same
  for (const f of fkDraft) {
    if (f.name && !NAME_OK(f.name)) throw new Error(`Invalid foreign key name "${f.name}"`);
    if (!f.columns.length || f.columns.length !== f.refColumns.length) throw new Error(`Foreign key ${f.name || '(unnamed)'}: pick the same number of columns on both sides`);
    if (!NAME_OK(f.refTable)) throw new Error(`Foreign key ${f.name || '(unnamed)'}: pick the referenced table`);
    for (const c of f.columns) if (!seen.has(c.toLowerCase())) throw new Error(`Foreign key ${f.name || '(unnamed)'}: column ${c} doesn't exist`);
    if (!FK_RULES.has(f.onUpdate) || !FK_RULES.has(f.onDelete)) throw new Error(`Foreign key ${f.name || '(unnamed)'}: unknown ON UPDATE / ON DELETE rule`);
    const o = f.orig && curFk.get(f.orig);
    if (o) {
      const a = JSON.stringify([o.name, o.columns.map((c) => rename.get(c) ?? `\0${c}`), o.refDb, o.refTable, o.refColumns, rule(o.onUpdate), rule(o.onDelete)]);
      const b = JSON.stringify([f.name, f.columns, f.refDb, f.refTable, f.refColumns, rule(f.onUpdate), rule(f.onDelete)]);
      if (a === b) continue;
      dropFk.push(o.name);
    }
    addFk.push(f);
  }
  for (const o of curFk.values()) if (!fkDraft.some((f) => f.orig === o.name)) dropFk.push(o.name);

  // Columns: changed ones, moved ones and new ones, in the new order.
  // A column counts as moved only if it falls outside the longest run that kept its relative order.
  const order = cur.columns.map((c) => c.name);
  const seq = cols.filter((c) => c.orig).map((c) => c.orig);
  const idx = seq.map((n) => order.indexOf(n));
  const len = idx.map(() => 1), prev = idx.map(() => -1);
  idx.forEach((v, i) => { for (let j = 0; j < i; j++) if (idx[j] < v && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; } });
  const keep = new Set();
  for (let i = len.length ? len.indexOf(Math.max(...len)) : -1; i >= 0; i = prev[i]) keep.add(seq[i]);
  const colClauses = [];
  cols.forEach((c, i) => {
    const pos = i === 0 ? ' FIRST' : ` AFTER ${qi(cols[i - 1].name)}`;
    if (!c.orig) { colClauses.push(`ADD COLUMN ${colDef(c)}${pos}`); return; }
    const o = curCols.get(c.orig);
    const moved = !keep.has(c.orig);
    const { orig: _o, ...shape } = c;
    const changed = !sameCol(colShape(o), shape);
    if (changed || moved) colClauses.push(`${c.name === c.orig ? `MODIFY COLUMN` : `CHANGE COLUMN ${qi(c.orig)}`} ${colDef(c, o)}${moved ? pos : ''}`);
  });

  const main = [
    ...dropIdx.filter((n, i, a) => a.indexOf(n) === i).map((n) => `DROP INDEX ${qi(n)}`),
    ...(pkChanged && cur.primaryKey ? ['DROP PRIMARY KEY'] : []),
    ...dropped.map((n) => `DROP COLUMN ${qi(n)}`),
    ...colClauses,
    ...(pkChanged && pk.length ? [`ADD PRIMARY KEY (${pk.map(qi).join(', ')})`] : []),
    ...addIdx.map((i) => `ADD ${i.kind ? i.kind + ' ' : i.unique ? 'UNIQUE ' : ''}INDEX ${i.name ? qi(i.name) + ' ' : ''}(${i.columns.map(idxCol).join(', ')})${i.comment ? ' COMMENT ' + mysql.escape(i.comment) : ''}`),
  ];
  const engine = String(draft.engine ?? cur.info.engine ?? '').trim();
  if (engine && engine.toLowerCase() !== String(cur.info.engine || '').toLowerCase()) { if (!/^\w+$/.test(engine)) throw new Error('Invalid engine'); main.push(`ENGINE = ${engine}`); }
  const comment = String(draft.comment ?? cur.info.comment ?? '');
  if (comment !== (cur.info.comment || '')) main.push(`COMMENT = ${mysql.escape(comment)}`);

  const out = [];
  const fkDrops = [...new Set(dropFk)];
  if (fkDrops.length) out.push(`ALTER TABLE ${from}\n  ${fkDrops.map((n) => `DROP FOREIGN KEY ${qi(n)}`).join(',\n  ')}`);
  if (main.length) out.push(`ALTER TABLE ${from}\n  ${main.join(',\n  ')}`);
  if (addFk.length) out.push(`ALTER TABLE ${from}\n  ${addFk.map((f) => `ADD ${f.name ? `CONSTRAINT ${qi(f.name)} ` : ''}FOREIGN KEY (${f.columns.map(qi).join(', ')}) REFERENCES ${f.refDb === db ? '' : qi(f.refDb) + '.'}${qi(f.refTable)} (${f.refColumns.map(qi).join(', ')}) ON UPDATE ${f.onUpdate} ON DELETE ${f.onDelete}`).join(',\n  ')}`);
  return out;
}

async function previewAlter(conn, db, table, draft) {
  return alterTableSql(db, table, await tableStructure(conn, db, table), draft);
}
// DDL commits on its own, so a failure part-way leaves the earlier statements applied; the error says so.
async function applyAlter(conn, db, table, draft) {
  const stmts = alterTableSql(db, table, await tableStructure(conn, db, table), draft);
  if (!stmts.length) return { statements: 0 };
  await withConn(conn, null, async (c) => {
    for (let i = 0; i < stmts.length; i++) {
      try { await c.query(stmts[i]); }
      catch (e) { throw new Error(stmts.length > 1 ? `Statement ${i + 1} of ${stmts.length} failed: ${e.message}${i ? '. The statements before it were already applied (ALTER TABLE can\'t be rolled back).' : ''}` : e.message); }
    }
  });
  return { statements: stmts.length };
}

/* ---------- data grid edits ---------- */
async function tableColumns(c, db, table) {
  const [rows] = await c.query(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, COLUMN_KEY AS ckey FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`, [db, table]);
  if (!rows.length) throw new Error(`Table ${db}.${table} not found`);
  return rows.map((r) => ({ name: r.name, dataType: String(r.dataType).toLowerCase(), pk: r.ckey === 'PRI' }));
}

// Turns pending grid edits into parameterized statements, matched by primary key.
function editStatements(cols, db, table, { updates = [], deletes = [], inserts = [] } = {}) {
  const byName = new Map(cols.map((c) => [c.name, c]));
  const pk = cols.filter((c) => c.pk);
  if (!pk.length) throw new Error('This table has no primary key, so rows cannot be edited safely');
  const from = `${qi(db)}.${qi(table)}`;
  const val = (col, v) => (v === null || v === undefined ? null : byName.get(col)?.dataType === 'bit' && /^\d+$/.test(String(v)) ? Number(v) : v);
  const where = (key) => {
    const parts = [], params = [];
    for (const c of pk) {
      if (!(c.name in (key || {}))) throw new Error(`Missing primary key value for ${c.name}`);
      parts.push(`${qi(c.name)} <=> ?`); params.push(val(c.name, key[c.name]));
    }
    return { sql: parts.join(' AND '), params };
  };
  const check = (col) => { if (!byName.has(col)) throw new Error(`Unknown column ${col}`); return col; };
  const out = [];
  for (const u of updates) {
    const sets = Object.entries(u.set || {}).map(([k, v]) => [check(k), v]);
    if (!sets.length) continue;
    const w = where(u.key);
    out.push({ kind: 'update', key: u.key, sql: `UPDATE ${from} SET ${sets.map(([k]) => `${qi(k)} = ?`).join(', ')} WHERE ${w.sql} LIMIT 1`, params: [...sets.map(([k, v]) => val(k, v)), ...w.params] });
  }
  for (const dl of deletes) {
    const w = where(dl.key);
    out.push({ kind: 'delete', key: dl.key, sql: `DELETE FROM ${from} WHERE ${w.sql} LIMIT 1`, params: w.params });
  }
  for (const ins of inserts) {
    const vals = Object.entries(ins.values || {}).map(([k, v]) => [check(k), v]);
    out.push({ kind: 'insert', sql: vals.length ? `INSERT INTO ${from} (${vals.map(([k]) => qi(k)).join(', ')}) VALUES (${vals.map(() => '?').join(', ')})` : `INSERT INTO ${from} () VALUES ()`, params: vals.map(([k, v]) => val(k, v)) });
  }
  return out;
}

async function previewEdits(conn, db, table, changes) {
  const c = await pool(conn).getConnection();
  try { return editStatements(await tableColumns(c, db, table), db, table, changes).map((s) => mysql.format(s.sql, s.params)); }
  finally { c.release(); }
}

async function saveEdits(conn, db, table, changes) {
  const c = await pool(conn).getConnection();
  try {
    const stmts = editStatements(await tableColumns(c, db, table), db, table, changes);
    await c.beginTransaction();
    const done = { updated: 0, deleted: 0, inserted: 0, sql: [] };
    try {
      for (const st of stmts) {
        const text = mysql.format(st.sql, st.params);
        let r;
        try { [r] = await c.query(st.sql, st.params); }
        catch (e) { throw Object.assign(new Error(`${e.sqlMessage || e.message}\n\nWhile running:\n${text}`), { sqlMessage: `${e.sqlMessage || e.message} (while running: ${text})` }); }
        if (st.kind !== 'insert' && r.affectedRows !== 1) {
          const k = Object.entries(st.key || {}).map(([a, b]) => `${a} = ${b}`).join(', ');
          throw new Error(`The row with ${k} no longer exists (deleted or its key was changed elsewhere). Nothing was saved.`);
        }
        done[{ update: 'updated', delete: 'deleted', insert: 'inserted' }[st.kind]]++;
        done.sql.push(text);
      }
      await c.commit();
      return done;
    } catch (e) { try { await c.rollback(); } catch {} throw e; }
  } finally { c.release(); }
}

/* ---------- create database / table ---------- */
const NAME_OK = (n) => typeof n === 'string' && n.trim().length > 0 && n.length <= 64 && !/[\/\\.`]|^\s|\s$/.test(n);

async function serverCollations(conn) {
  return withConn(conn, null, async (c) => {
    const [rows] = await c.query(`SELECT COLLATION_NAME AS name, IS_DEFAULT AS def FROM information_schema.COLLATIONS WHERE CHARACTER_SET_NAME = 'utf8mb4' ORDER BY COLLATION_NAME`);
    const [[v]] = await c.query('SELECT @@collation_server AS server, VERSION() AS version');
    const names = rows.map((r) => r.name);
    const preferred = ['utf8mb4_unicode_ci', 'utf8mb4_0900_ai_ci', 'utf8mb4_general_ci'];
    const def = String(v.server).startsWith('utf8mb4_') ? v.server : preferred.find((x) => names.includes(x)) || names[0];
    return { collations: names, default: def, version: v.version };
  });
}

async function createDatabase(conn, name, collation) {
  if (!NAME_OK(name)) throw new Error('Database names can be up to 64 characters and cannot contain / \\ . or `');
  if (collation && !/^utf8mb4_[a-z0-9_]+$/i.test(collation)) throw new Error('Invalid collation');
  return withConn(conn, null, async (c) => {
    await c.query(`CREATE DATABASE ${qi(name)} CHARACTER SET utf8mb4${collation ? ' COLLATE ' + collation : ''}`);
    return { name };
  });
}

function guardDb(name) {
  if (typeof name !== 'string' || !name || name.length > 64) throw new Error('Invalid database name');
  if (SYSTEM_DBS.has(String(name).toLowerCase())) throw new Error(`${name} is a system database and cannot be changed here`);
}

async function dropDatabase(conn, name) {
  guardDb(name);
  return withConn(conn, null, async (c) => {
    await c.query(`DROP DATABASE ${qi(name)}`);
    return { name };
  });
}

// Empties a database but keeps it: drops every view, table (with its triggers), routine and event.
async function purgeDatabase(conn, name) {
  guardDb(name);
  return withConn(conn, null, async (c) => {
    const [objs] = await c.query(`SELECT TABLE_NAME AS n, TABLE_TYPE AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`, [name]);
    const [routines] = await c.query(`SELECT ROUTINE_NAME AS n, ROUTINE_TYPE AS t FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?`, [name]);
    let events = [];
    try { [events] = await c.query(`SELECT EVENT_NAME AS n FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ?`, [name]); } catch {}
    const views = objs.filter((o) => o.t === 'VIEW').map((o) => o.n), tables = objs.filter((o) => o.t !== 'VIEW').map((o) => o.n);
    const list = (names) => names.map((n) => `${qi(name)}.${qi(n)}`).join(', ');
    await c.query('SET SESSION FOREIGN_KEY_CHECKS = 0');
    try {
      for (let i = 0; i < views.length; i += 100) await c.query(`DROP VIEW IF EXISTS ${list(views.slice(i, i + 100))}`);
      for (let i = 0; i < tables.length; i += 100) await c.query(`DROP TABLE IF EXISTS ${list(tables.slice(i, i + 100))}`);
      for (const r of routines) await c.query(`DROP ${r.t === 'FUNCTION' ? 'FUNCTION' : 'PROCEDURE'} IF EXISTS ${qi(name)}.${qi(r.n)}`);
      for (const e of events) await c.query(`DROP EVENT IF EXISTS ${qi(name)}.${qi(e.n)}`);
    } finally { await c.query('SET SESSION FOREIGN_KEY_CHECKS = 1').catch(() => {}); }
    return { name, tables: tables.length, views: views.length, routines: routines.length, events: events.length };
  });
}

// Column types the table designer accepts, e.g. VARCHAR(255), DECIMAL(10,2), INT UNSIGNED, ENUM('a','b').
const TYPE_RE = /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|bit|bool|boolean|char|varchar|binary|varbinary|tinytext|text|mediumtext|longtext|tinyblob|blob|mediumblob|longblob|date|datetime|timestamp|time|year|json|enum|set|geometry|point)(\s*\(\s*(\d+(\s*,\s*\d+)?|('([^'\\]|\\.|'')*'\s*,\s*)*'([^'\\]|\\.|'')*')\s*\))?(\s+unsigned)?(\s+zerofill)?$/i;
const RAW_DEFAULTS = /^(NULL|CURRENT_TIMESTAMP(\(\d?\))?|NOW\(\)|TRUE|FALSE)$/i;

function createTableSql(db, def) {
  const t = String(def.name || '').trim();
  if (!NAME_OK(t)) throw new Error('Enter a table name (up to 64 characters, no / \\ . or `)');
  const cols = (def.columns || []).filter((c) => String(c.name || '').trim());
  if (!cols.length) throw new Error('Add at least one column');
  const seen = new Set();
  const lines = cols.map((c) => {
    const n = String(c.name).trim();
    if (!NAME_OK(n)) throw new Error(`Invalid column name "${n}"`);
    if (seen.has(n.toLowerCase())) throw new Error(`Column "${n}" is listed twice`);
    seen.add(n.toLowerCase());
    const type = String(c.type || '').trim().replace(/\s+/g, ' ');
    if (!TYPE_RE.test(type)) throw new Error(`"${type || '(empty)'}" is not a valid type for ${n}. Examples: INT, VARCHAR(255), DECIMAL(10,2), DATETIME, TEXT`);
    const tm = type.match(/^(\w+)\s*(\(.*\))?(.*)$/s);
    const rest = tm[3].trim().toUpperCase();
    let sql = `${qi(n)} ${tm[1].toUpperCase()}${tm[2] || ''}${rest ? ' ' + rest : ''}`;
    if (c.ai) {
      if (!/int/i.test(type)) throw new Error(`Auto increment needs an integer type (${n})`);
      sql += ' NOT NULL AUTO_INCREMENT';
    } else {
      sql += c.nullable ? ' NULL' : ' NOT NULL';
      const d = c.default == null ? '' : String(c.default).trim();
      if (d !== '') sql += ' DEFAULT ' + (RAW_DEFAULTS.test(d) ? d.toUpperCase() : mysql.escape(d.replace(/^'(.*)'$/s, '$1')));
    }
    if (c.comment && String(c.comment).trim()) sql += ' COMMENT ' + mysql.escape(String(c.comment).trim());
    return '  ' + sql;
  });
  const pk = cols.filter((c) => c.pk || c.ai).map((c) => qi(String(c.name).trim()));
  if (cols.filter((c) => c.ai).length > 1) throw new Error('Only one column can auto increment');
  if (pk.length) lines.push(`  PRIMARY KEY (${[...new Set(pk)].join(', ')})`);
  const coll = def.collation && /^utf8mb4_[a-z0-9_]+$/i.test(def.collation) ? ` COLLATE=${def.collation}` : '';
  return `CREATE TABLE ${qi(db)}.${qi(t)} (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4${coll}`;
}

async function createTable(conn, db, def) {
  const sql = createTableSql(db, def);
  await withConn(conn, null, (c) => c.query(sql));
  return { name: String(def.name).trim(), sql };
}

module.exports = { connect, withConn, test, binlogProbe, listDatabases, listTables, listObjects, browse, prepareDatabase, dbStats, qi, pool, closePools, cellValue, serverCollations, createDatabase, dropDatabase, purgeDatabase, createTableSql, createTable, previewEdits, saveEdits, tableStructure, alterTableSql, previewAlter, applyAlter };
