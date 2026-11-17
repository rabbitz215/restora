// Optional local presets, read from the user's settings folder. Nothing is shown when there are none.
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('./db');

const home = (p) => (p ? String(p).replace(/^(\$HOME|\$\{HOME\}|~)(?=\/|\\|$)/, os.homedir()) : p);

function readPresets(userData) {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(path.join(userData, 'presets.json'), 'utf8')); } catch { return []; }
  const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.presets) ? raw.presets : [];
  return list.filter((p) => p && p.name).map((p, i) => resolve({ ...p, id: String(p.id || `preset${i + 1}`) }));
}

// Pull KEY=value assignments out of a shell script (used to stay in sync with an existing restore script).
function scriptVars(file) {
  let src;
  try { src = fs.readFileSync(home(file), 'utf8'); } catch { return null; }
  const out = {};
  for (const m of src.matchAll(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)=(?:"([^"]*)"|'([^']*)'|(\S*))/gm)) out[m[1]] = m[2] ?? m[3] ?? m[4];
  return out;
}

function resolve(p) {
  const r = { ...p, scriptFound: false };
  if (p.fromScript) {
    const v = scriptVars(p.fromScript);
    if (v) {
      r.scriptFound = true;
      r.folder = r.folder || v.DUMP_DIR;
      r.database = r.database || v.DB_NAME;
      r.connection = { host: '127.0.0.1', port: 3306, ...(p.connection || {}) };
      if (!r.connection.user && v.DB_USER) r.connection.user = v.DB_USER;
      if (r.connection.password === undefined && v.DB_PASS !== undefined) r.connection.password = v.DB_PASS;
    }
  }
  r.folder = home(r.folder || '');
  r.filePattern = r.filePattern || '*_DD_MM_YYYY.sql.gz';
  return r;
}

// Public view of a preset (no password).
const publicPreset = (p) => ({ id: p.id, name: p.name, folder: p.folder, database: p.database, filePattern: p.filePattern, scp: p.scp || null, script: p.fromScript || null, scriptFound: p.scriptFound, user: p.connection?.user || null });

/* ---- file name patterns: DD D MM M YYYY YY ---- */
const TOKENS = /YYYY|YY|DD|MM|D|M/g;
function nameFor(pattern, d) {
  const map = { YYYY: String(d.getFullYear()), YY: String(d.getFullYear()).slice(2), DD: String(d.getDate()).padStart(2, '0'), D: String(d.getDate()), MM: String(d.getMonth() + 1).padStart(2, '0'), M: String(d.getMonth() + 1) };
  return pattern.replace(TOKENS, (t) => map[t]).replace(/\*/g, '');
}
function patternRegex(pattern) {
  const base = pattern.replace(/\.sql(\.gz)?$/i, '');
  const esc = (x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const order = [];
  let src = '', last = 0, m;
  TOKENS.lastIndex = 0;
  while ((m = TOKENS.exec(base))) {
    src += esc(base.slice(last, m.index)) + '(\\d{' + (m[0] === 'YYYY' ? 4 : m[0] === 'YY' ? 2 : '1,2') + '})';
    order.push(m[0]); last = TOKENS.lastIndex;
  }
  // Anchored at the start; anything may follow (e.g. " (1).sql.gz").
  return { re: new RegExp('^' + src + esc(base.slice(last)), 'i'), order };
}
function dateFromName(pattern, name) {
  const { re, order } = patternRegex(pattern);
  const m = name.match(re);
  if (m && order.length) {
    const v = {}; order.forEach((t, i) => { v[t] = Number(m[i + 1]); });
    const y = v.YYYY ?? (v.YY != null ? 2000 + v.YY : null), mo = v.MM ?? v.M, d = v.DD ?? v.D;
    if (y && mo && d) { const t = new Date(y, mo - 1, d); if (!isNaN(t)) return t.getTime(); }
  }
  return null;
}
const globFor = (pattern) => pattern.replace(TOKENS, '*').replace(/\*+/g, '*');

function listDumps(folder, pattern) {
  const out = [];
  const scan = (dir, sub) => {
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && !sub) scan(p, e.name);
      else if (e.isFile() && /\.sql(\.gz)?$/i.test(e.name)) {
        const st = fs.statSync(p);
        out.push({ path: p, name: e.name, folder: sub || null, size: st.size, mtime: st.mtimeMs, date: dateFromName(pattern, e.name) });
      }
    }
  };
  scan(folder, null);
  // Newest modified .sql.gz in the top folder (same as `ls -t *.sql.gz | head -1`).
  const latest = out.filter((f) => !f.folder && /\.sql\.gz$/i.test(f.name)).sort((a, b) => b.mtime - a.mtime)[0];
  if (latest) latest.latest = true;
  return out.sort((a, b) => (b.date ?? b.mtime) - (a.date ?? a.mtime) || b.mtime - a.mtime);
}

async function localState(conn, database) {
  return db.withConn(conn, null, async (c) => {
    try { await c.query('SET SESSION information_schema_stats_expiry = 0'); } catch {}
    const [[s]] = await c.query('SELECT COUNT(*) AS n FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
    if (!s.n) return { exists: false };
    const [[r]] = await c.query(
      `SELECT COUNT(*) AS tables, MIN(CREATE_TIME) AS firstCreated, MAX(CREATE_TIME) AS lastCreated,
              COALESCE(SUM(DATA_LENGTH + INDEX_LENGTH), 0) AS size, COALESCE(SUM(TABLE_ROWS), 0) AS rows_
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`, [database]);
    // CREATE_TIME is in the server's time zone; shift it by the server-vs-local clock difference.
    const [[n]] = await c.query('SELECT NOW() AS now');
    const parse = (x) => new Date(String(x).replace(' ', 'T')).getTime();
    const skew = Math.round((Date.now() - parse(n.now)) / 60000) * 60000;
    const t = (x) => (x ? parse(x) + skew : null);
    return { exists: true, tables: Number(r.tables), size: Number(r.size), rows: Number(r.rows_), restoredAt: t(r.firstCreated), finishedAt: t(r.lastCreated) };
  });
}

// Which dump is on the local DB right now? Prefer Restora's own history (exact), else
// infer: the newest dump that had been downloaded before the tables were created.
function matchCurrent(dumps, local, history, database) {
  if (!local.exists || !local.restoredAt) return null;
  const rec = history.find((h) => h.kind === 'restore' && h.database === database && (h.status === 'success' || h.status === 'warning'));
  if (rec && Math.abs(rec.at - local.restoredAt) < 10 * 60 * 1000 && dumps.some((d) => d.path === rec.file)) return { path: rec.file, how: 'history' };
  const before = dumps.filter((d) => /\.sql\.gz$/i.test(d.name) && d.mtime <= local.restoredAt + 60 * 1000).sort((a, b) => b.mtime - a.mtime)[0];
  return before ? { path: before.path, how: 'inferred' } : null;
}

module.exports = { readPresets, publicPreset, listDumps, localState, matchCurrent, nameFor, dateFromName, globFor };
