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

module.exports = { connect, withConn, test, listDatabases, listTables, listObjects, browse, prepareDatabase, dbStats, qi, pool, closePools, cellValue, serverCollations, createDatabase, createTableSql, createTable, previewEdits, saveEdits };
