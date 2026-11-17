// SQL editor backend: one persistent MySQL session per query tab (so USE,
// variables and temp tables carry over between runs), statement splitting,
// row-capped streaming results, and KILL QUERY for cancelling.
const mysql = require('mysql2');
const { cellValue, qi } = require('./db');

const sessions = new Map(); // tabId -> { c, key, threadId, busy }
const MAX_ROWS = 5000;

// Splits a script into statements, honouring quotes, comments and DELIMITER.
function splitSql(src) {
  const out = [];
  let delim = ';', buf = '', start = -1, line = 1, startLine = 1, i = 0;
  const n = src.length;
  const push = () => {
    const sql = buf.trim();
    if (sql && !/^(--[^\n]*\n?|#[^\n]*\n?|\/\*[\s\S]*?\*\/|\s)*$/.test(sql)) out.push({ sql, line: startLine });
    buf = ''; start = -1;
  };
  while (i < n) {
    // DELIMITER command at the start of a line
    if ((i === 0 || src[i - 1] === '\n') && /^delimiter\s/i.test(src.slice(i, i + 10)) && !buf.trim()) {
      const end = src.indexOf('\n', i);
      const lineStr = src.slice(i, end < 0 ? n : end);
      delim = lineStr.replace(/^delimiter\s+/i, '').trim() || ';';
      i = end < 0 ? n : end + 1; line++;
      continue;
    }
    const ch = src[i];
    if (start < 0 && !/\s/.test(ch)) { start = i; startLine = line; }
    if (ch === '\n') line++;
    // comments
    if ((ch === '-' && src[i + 1] === '-' && /\s/.test(src[i + 2] || ' ')) || ch === '#') {
      const end = src.indexOf('\n', i);
      buf += src.slice(i, end < 0 ? n : end);
      i = end < 0 ? n : end;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const chunk = src.slice(i, end < 0 ? n : end + 2);
      line += (chunk.match(/\n/g) || []).length;
      buf += chunk; i += chunk.length;
      continue;
    }
    // quoted strings / identifiers
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\' && ch !== '`') { j += 2; continue; }
        if (src[j] === ch) { if (src[j + 1] === ch) { j += 2; continue; } break; }
        j++;
      }
      const chunk = src.slice(i, j + 1);
      line += (chunk.match(/\n/g) || []).length;
      buf += chunk; i = j + 1;
      continue;
    }
    if (src.startsWith(delim, i)) { push(); i += delim.length; continue; }
    buf += ch; i++;
  }
  push();
  return out;
}

const NUM_TYPES = new Set([0, 1, 2, 3, 4, 5, 8, 9, 13, 16, 246]);
const TYPE_NAMES = { 0: 'decimal', 1: 'tinyint', 2: 'smallint', 3: 'int', 4: 'float', 5: 'double', 7: 'timestamp', 8: 'bigint', 9: 'mediumint', 10: 'date', 11: 'time', 12: 'datetime', 13: 'year', 15: 'varchar', 16: 'bit', 245: 'json', 246: 'decimal', 247: 'enum', 248: 'set', 249: 'tinyblob', 250: 'mediumblob', 251: 'longblob', 252: 'blob', 253: 'varchar', 254: 'char', 255: 'geometry' };

function connOpts(conn) {
  return {
    host: conn.host || '127.0.0.1', port: Number(conn.port) || 3306, user: conn.user, password: conn.password || '',
    ssl: conn.ssl ? { rejectUnauthorized: false } : undefined, connectTimeout: 8000, charset: 'utf8mb4',
    dateStrings: true, supportBigNumbers: true, bigNumberStrings: true, multipleStatements: false,
  };
}

async function session(tabId, conn) {
  const key = JSON.stringify([conn.host, conn.port, conn.user, conn.password, !!conn.ssl]);
  let s = sessions.get(tabId);
  if (s && (s.key !== key || s.dead)) { try { s.c.destroy(); } catch {} sessions.delete(tabId); s = null; }
  if (s) return s;
  const c = mysql.createConnection(connOpts(conn));
  await new Promise((res, rej) => c.connect((e) => (e ? rej(e) : res())));
  s = { c, key, threadId: c.threadId, db: null, dead: false };
  c.on('error', () => { s.dead = true; });
  c.on('end', () => { s.dead = true; });
  sessions.set(tabId, s);
  return s;
}

// Runs one statement, streaming rows and keeping at most MAX_ROWS.
function runOne(c, sql) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const sets = []; let cur = null; let ok = null;
    const q = c.query({ sql, rowsAsArray: true });
    q.on('fields', (fields) => {
      if (!fields || !fields.length) return; // OK packets (UPDATE, USE, ...) carry no columns
      cur = { columns: (fields || []).map((f) => ({ name: f.name, table: f.orgTable || f.table || '', dataType: TYPE_NAMES[f.columnType] || 'text', num: NUM_TYPES.has(f.columnType), bit: f.columnType === 16 })), rows: [], total: 0 };
      sets.push(cur);
    });
    q.on('result', (row) => {
      if (Array.isArray(row)) {
        if (!cur) return;
        cur.total++;
        if (cur.rows.length < MAX_ROWS) cur.rows.push(row.map((v, i) => cellValue(v, { dataType: cur.columns[i]?.bit ? 'bit' : cur.columns[i]?.dataType })));
      } else if (row && typeof row === 'object' && 'affectedRows' in row) {
        ok = { affectedRows: row.affectedRows, insertId: row.insertId, changedRows: row.changedRows, info: row.info, warnings: row.warningStatus };
        cur = null;
      }
    });
    q.on('error', (err) => resolve({ error: { code: err.errno, state: err.sqlState, message: err.sqlMessage || err.message }, ms: Date.now() - t0 }));
    q.on('end', () => resolve({ sets, ok, ms: Date.now() - t0 }));
  });
}

async function run(tabId, conn, db, sqlText, { continueOnError = false } = {}) {
  const s = await session(tabId, conn);
  if (s.busy) throw new Error('A query is already running in this tab');
  s.busy = true;
  s.cancelled = false;
  try {
    if (db && s.db !== db) {
      const r = await runOne(s.c, `USE ${qi(db)}`);
      if (r.error) throw new Error(r.error.message);
      s.db = db;
    }
    const stmts = splitSql(sqlText);
    const results = [];
    const t0 = Date.now();
    for (let i = 0; i < stmts.length; i++) {
      if (s.cancelled) { results.push({ index: i, line: stmts[i].line, sql: stmts[i].sql, skipped: true }); continue; }
      const r = await runOne(s.c, stmts[i].sql);
      results.push({ index: i, line: stmts[i].line, sql: stmts[i].sql.slice(0, 2000), ...r });
      if (r.error && !continueOnError) {
        for (let k = i + 1; k < stmts.length; k++) results.push({ index: k, line: stmts[k].line, sql: stmts[k].sql.slice(0, 2000), skipped: true });
        break;
      }
    }
    // The script may have switched databases (USE ...).
    const cur = await runOne(s.c, 'SELECT DATABASE()');
    const nowDb = cur.sets?.[0]?.rows?.[0]?.[0] ?? null;
    s.db = nowDb;
    return { results, db: nowDb, ms: Date.now() - t0, maxRows: MAX_ROWS, cancelled: s.cancelled };
  } finally { s.busy = false; }
}

async function cancel(tabId, conn) {
  const s = sessions.get(tabId);
  if (!s || !s.busy) return false;
  s.cancelled = true;
  const k = mysql.createConnection(connOpts(conn));
  await new Promise((res) => k.query(`KILL QUERY ${Number(s.threadId)}`, () => res()));
  k.end(() => {});
  return true;
}

function close(tabId) {
  const s = sessions.get(tabId);
  if (s) { try { s.c.end(() => {}); } catch {} sessions.delete(tabId); }
}
function closeAll() { for (const id of [...sessions.keys()]) close(id); }

// Flags statements that change or destroy a lot of data, so the UI can confirm first.
function riskyStatements(sqlText) {
  return splitSql(sqlText).map((s) => s.sql.replace(/^(\s|--[^\n]*\n|#[^\n]*\n|\/\*[\s\S]*?\*\/)+/, '')).filter((q) => {
    const u = q.replace(/\s+/g, ' ').toUpperCase();
    if (/^(DROP|TRUNCATE)\b/.test(u)) return true;
    if (/^(DELETE|UPDATE)\b/.test(u) && !/\bWHERE\b/.test(u)) return true;
    return false;
  }).map((q) => q.replace(/\s+/g, ' ').slice(0, 120));
}

module.exports = { run, cancel, close, closeAll, splitSql, riskyStatements };
