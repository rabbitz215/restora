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

module.exports = { connect, withConn, test, listDatabases, listTables, listObjects, browse, prepareDatabase, dbStats, qi, pool, closePools, cellValue };
