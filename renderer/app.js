/* Restora renderer — vanilla JS, no build step. */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  restore: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/>',
  history: '<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  sheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  retry: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  chevsLeft: '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
  chevsRight: '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  sortUp: '<path d="m18 15-6-6-6 6"/>',
  sortDown: '<path d="m6 9 6 6 6-6"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  arrowDownLeft: '<path d="M17 7 7 17"/><path d="M17 17H7V7"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  maximize: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;
const COLORS = ['#8b6cff', '#5b8cff', '#22d3ee', '#34d399', '#a3e635', '#fbbf24', '#fb923c', '#f87171', '#f472b6'];

const fmtBytes = (b) => {
  if (b == null || isNaN(b)) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let n = Number(b);
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
};
const fmtDur = (s) => {
  if (s == null || !isFinite(s)) return '—';
  if (s < 1) return `${Math.max(0, Math.round(s * 1000))} ms`;
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  if (m < 60) return `${m}m ${sec}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
const plural = (n, w) => `${fmtNum(n)} ${w}${Number(n) === 1 ? '' : 's'}`;
const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString());
const fmtCompact = (n) => (n == null ? '—' : Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n));
const timeAgo = (ts) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(ts).toLocaleDateString();
};
const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour12: false });

const store = {
  get(k, d) { try { const v = localStorage.getItem('restora.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('restora.' + k, JSON.stringify(v)); } catch {} },
};

const DEFAULT_OPTS = { stripDefiner: true, skipRoutines: false, skipUseCreateDb: true, fixMariaSandbox: true, fixCollation: false, disableFk: true, fastMode: true, force: false };
const OPT_DEFS = [
  { group: 'Compatibility fixes', icon: 'wand', items: [
    ['stripDefiner', 'Strip DEFINER clauses', 'Views, triggers and routines get owned by your user. Prevents "Access denied; you need SUPER privilege".', 'hasDefiner'],
    ['skipUseCreateDb', 'Ignore USE / CREATE DATABASE', 'Always restore into the database you picked, even if the dump names a different one.', 'hasUseOrCreateDb'],
    ['fixMariaSandbox', 'Remove MariaDB sandbox header', 'New mariadb-dump files start with /*M!999999 …*/, which breaks the MySQL client.', 'hasMariaSandbox'],
    ['fixCollation', 'Convert MySQL 8 collations', 'Rewrites utf8mb4_0900_* to utf8mb4_unicode_ci so the dump loads on MariaDB or MySQL 5.7.', 'has0900'],
    ['skipRoutines', 'Skip triggers & routines', 'Leaves out procedures, functions, triggers and events. Use this when error 1419 or SUPER-privilege errors block you.', null],
  ] },
  { group: 'Performance & safety', icon: 'zap', items: [
    ['disableFk', 'Disable foreign key checks', 'Load tables in any order without constraint failures.', null],
    ['fastMode', 'Fast mode', 'Turns off autocommit and commits once at the end. Much faster on InnoDB.', null],
    ['force', 'Continue on errors', 'Keep going past failed statements and collect every error.', null],
  ] },
];

const S = {
  view: 'restore', conns: [], env: null, history: [],
  r: { file: null, info: null, inspecting: false, connId: store.get('r.connId', null), server: null, dbs: null, dbMode: 'existing', db: null, newDb: '', dbFilter: '', dropFirst: false, opts: { ...DEFAULT_OPTS, ...store.get('r.opts', {}) } },
  c: { file: null, preview: null, delimiter: null, header: true, connId: store.get('c.connId', null), dbs: null, db: null, tables: null, tableMode: 'new', table: '', newTable: '', mapping: [], opts: { mode: 'insert', emptyAsNull: true, truncate: false, force: false } },
  e: { connId: store.get('e.connId', null), server: null, dbs: null, db: null, dbFilter: '', objects: null, allTables: true, selected: new Set(), tFilter: '', file: null, opts: { gzip: true, content: 'both', routines: true, triggers: true, events: false, addDrop: true, createDb: false, ...store.get('e.opts', {}) } },
  dv: null, tabs: [],
  tree: {},
  job: null, histOpen: null,
};

/* ---------------- toasts ---------------- */
function toast(msg, kind = 'bad') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `${ic(kind === 'ok' ? 'check' : 'alert')}<div>${esc(msg)}</div>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, kind === 'ok' ? 2600 : 5200);
}
async function guard(fn) { try { return await fn(); } catch (e) { toast(e.message || String(e)); } }

/* ---------------- shell ---------------- */
function renderNav() {
  const items = [...S.presets.map((p) => [`quick:${p.id}`, 'rocket', p.name]), ['restore', 'restore', 'Restore dump'], ['export', 'download', 'Export database'], ['csv', 'sheet', 'Import CSV'], ['data', 'table', 'Data & SQL'], ['history', 'history', 'History']];
  const cur = S.view === 'quick' ? `quick:${S.a.id}` : S.view;
  let html = items.map(([v, i, l]) => `<button class="nav-item ${cur === v ? 'active' : ''}" data-act="nav" data-view="${v}">${ic(i)}${l}${v === 'history' && S.history.length ? `<span class="count">${S.history.length}</span>` : ''}</button>`).join('');
  if (S.job) {
    const st = S.job.status;
    html += `<button class="nav-item ${S.view === 'job' ? 'active' : ''}" data-act="nav" data-view="job">${st === 'running' ? ic('loader', 'spin') : ic(st === 'success' ? 'check' : st === 'failed' ? 'x' : 'alert')}${st === 'running' ? 'Running…' : 'Last job'}<span class="count">${st === 'running' ? Math.floor(pct(S.job.progress)) + '%' : esc(st)}</span></button>`;
  }
  $('#nav').innerHTML = html;
}
/* ---------------- connection tree ---------------- */
const T = (id) => S.tree[id] || (S.tree[id] = { open: false, dbs: null, filter: '', openDbs: {}, tFilter: {} });
const saveTreeOpen = () => store.set('tree.open', Object.entries(S.tree).filter(([, t]) => t.open).map(([id]) => id));

async function loadTreeDbs(id) {
  const t = T(id);
  t.dbs = null; renderConns();
  try { t.dbs = await api.databases(id); } catch (e) { t.dbs = { error: e.message }; }
  renderConns();
  for (const db of Object.keys(t.openDbs)) if (Array.isArray(t.dbs) && t.dbs.some((d) => d.name === db)) loadTreeTables(id, db); else delete t.openDbs[db];
}
async function loadTreeTables(id, db) {
  const t = T(id);
  t.openDbs[db] = null; renderConns();
  try { t.openDbs[db] = await api.objects(id, db); } catch (e) { t.openDbs[db] = { error: e.message }; }
  renderConns();
}

function renderConns() {
  $('#addConn').innerHTML = `${ic('plus')}Add connection`;
  $('#refreshConns').innerHTML = ic('refresh');
  $('#refreshConns').classList.toggle('hidden', !S.conns.length);
  const el = $('#connList');
  if (!S.conns.length) {
    el.innerHTML = `<div class="conn-empty">No connections yet. Add your MySQL or MariaDB server to see its databases here.</div>`;
    return;
  }
  el.innerHTML = S.conns.map((c) => {
    const t = T(c.id);
    return `<div class="tree-conn">
      <div class="tree-row conn ${t.open ? 'open' : ''}" data-act="tree-conn" data-id="${c.id}" title="${esc(c.user)}@${esc(c.host)}:${c.port}">
        <span class="chev">${ic('chev')}</span><span class="dot" style="color:${esc(c.color)}"></span>
        <div class="meta"><b>${esc(c.name)}</b><small>${esc(c.user)}@${esc(c.host)}:${c.port}</small></div>
        <span class="row-actions"><button class="icon-btn" data-act="tree-refresh" data-id="${c.id}" title="Refresh">${ic('refresh')}</button><button class="icon-btn" data-act="edit-conn" data-id="${c.id}" title="Edit connection">${ic('pencil')}</button></span>
      </div>
      ${t.open ? `<div class="tree-kids">${Array.isArray(t.dbs) && t.dbs.length > 6 ? `<div class="tree-filter">${ic('search')}<input placeholder="Filter databases…" value="${esc(t.filter)}" data-input="tree-filter" data-id="${c.id}" spellcheck="false"></div>` : ''}<div data-dbs="${c.id}">${treeDbsHtml(c.id)}</div></div>` : ''}
    </div>`;
  }).join('');
}

function treeDbsHtml(id) {
  const t = T(id);
  if (t.dbs === null) return '<div class="tree-msg">' + ic('loader', 'spin') + 'Loading databases…</div>';
  if (t.dbs.error) return `<div class="tree-msg bad" title="${esc(t.dbs.error)}">${ic('alert')}<span>${esc(t.dbs.error)}</span></div>`;
  if (!t.dbs.length) return '<div class="tree-msg">No databases yet</div>';
  const f = t.filter.toLowerCase();
  const list = t.dbs.filter((d) => d.name.toLowerCase().includes(f));
  if (!list.length) return '<div class="tree-msg">No match</div>';
  return list.map((d) => {
    const tables = t.openDbs[d.name];
    const open = tables !== undefined;
    const active = S.dv.connId === id && S.dv.db === d.name;
    return `<div class="tree-row db ${open ? 'open' : ''} ${active && !open ? 'active' : ''}" data-act="tree-db" data-id="${id}" data-db="${esc(d.name)}" title="${esc(d.name)} · ${d.tables} tables · ${fmtBytes(d.size)}">
        <span class="chev">${ic('chev')}</span>${ic('db')}<span class="name">${esc(d.name)}</span><small>${d.tables || ''}</small>
        <span class="row-actions"><button class="icon-btn" data-act="tree-query" data-id="${id}" data-db="${esc(d.name)}" title="New SQL query on ${esc(d.name)}">${ic('code')}</button><button class="icon-btn" data-act="tree-restore" data-id="${id}" data-db="${esc(d.name)}" title="Restore a dump into ${esc(d.name)}">${ic('restore')}</button><button class="icon-btn" data-act="tree-export" data-id="${id}" data-db="${esc(d.name)}" title="Export ${esc(d.name)}">${ic('download')}</button></span>
      </div>
      ${open ? `${Array.isArray(tables) && tables.length > 1 ? `<div class="tree-filter l2">${ic('search')}<input placeholder="Search ${tables.length} tables…" value="${esc(t.tFilter[d.name] || '')}" data-input="tree-tfilter" data-id="${id}" data-db="${esc(d.name)}" spellcheck="false">${t.tFilter[d.name] ? `<button class="icon-btn" data-act="tree-tfilter-clear" data-id="${id}" data-db="${esc(d.name)}" title="Clear">${ic('x')}</button>` : ''}</div>` : ''}<div data-tbls="${id}" data-db="${esc(d.name)}">${treeTablesHtml(id, d.name, tables)}</div>` : ''}`;
  }).join('');
}

function treeTablesHtml(id, db, tables) {
  if (tables === null) return '<div class="tree-msg l2">' + ic('loader', 'spin') + 'Loading…</div>';
  if (tables.error) return `<div class="tree-msg l2 bad">${esc(tables.error)}</div>`;
  if (!tables.length) return '<div class="tree-msg l2">No tables</div>';
  const q = (T(id).tFilter[db] || '').trim().toLowerCase();
  const list = q ? tables.filter((x) => x.name.toLowerCase().includes(q)) : tables;
  if (!list.length) return '<div class="tree-msg l2">No table matches</div>';
  return list.map((x) => {
    const active = S.view === 'data' && S.dv.connId === id && S.dv.db === db && S.dv.table === x.name;
    const tabbed = S.tabs.some((tb) => tb.connId === id && tb.db === db && tb.table === x.name);
    const at = q ? x.name.toLowerCase().indexOf(q) : -1;
    const hl = at < 0 ? esc(x.name) : esc(x.name.slice(0, at)) + '<mark>' + esc(x.name.slice(at, at + q.length)) + '</mark>' + esc(x.name.slice(at + q.length));
    return `<div class="tree-row tbl ${active ? 'active' : ''} ${tabbed ? 'tabbed' : ''}" data-act="tree-table" data-id="${id}" data-db="${esc(db)}" data-table="${esc(x.name)}" title="${esc(x.name)}${x.view ? ' (view)' : ` · ~${fmtNum(x.rows)} rows · ${fmtBytes(x.size)}`}">
      ${ic(x.view ? 'eye' : 'table')}<span class="name">${hl}</span><small>${x.view ? 'view' : x.rows ? fmtCompact(x.rows) : ''}</small></div>`;
  }).join('');
}
function renderEnv() {
  const el = $('#envInfo');
  if (!S.env) return;
  if (S.env.mysql.found) {
    el.className = 'sidebar-foot';
    const v = (S.env.mysql.version.match(/Ver\s+([\d.]+)/) || [])[1] || '';
    el.innerHTML = `${ic('terminal')}<span>mysql client ${esc(v)}</span>`;
  } else {
    el.className = 'sidebar-foot bad';
    el.innerHTML = `${ic('alert')}<span>mysql client not found. Install <b>mysql-client</b> to restore dumps.</span>`;
  }
}
function go(view) {
  if (view.startsWith('quick:')) { const id = view.slice(6); if (presetById(id)) { S.a = QS(id); view = 'quick'; } else view = 'restore'; }
  if (S.view === 'data' && view !== 'data') rememberScroll();
  S.view = view;
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
  renderNav();
  if (view === 'restore') renderRestore();
  if (view === 'quick') { renderQuick(); loadQuick(); }
  if (view === 'export') renderExport();
  if (view === 'csv') renderCsv();
  if (view === 'data') { renderData(); if (S.dv.table && !S.dv.data && !S.dv.loading) fetchData(S.dv); }
  if (view === 'history') loadHistory();
  if (view === 'job') renderJob();
  $('#main').classList.toggle('flush', view === 'data');
  $('#main').scrollTop = 0;
  renderConns();
}

/* ---------------- shared bits ---------------- */
const connById = (id) => S.conns.find((c) => c.id === id);
function connSelect(scope, value) {
  return `<select class="select" data-change="${scope}-conn">
    <option value="" ${!value ? 'selected' : ''} disabled>Choose a connection…</option>
    ${S.conns.map((c) => `<option value="${c.id}" ${c.id === value ? 'selected' : ''}>${esc(c.name)} · ${esc(c.host)}:${c.port}</option>`).join('')}
  </select>`;
}
function dropzone(kind) {
  const isCsv = kind === 'csv';
  return `<div class="dropzone" data-act="pick-${kind}" data-drop="${kind}">
    <div class="dz-icon">${ic('upload')}</div>
    <b>${isCsv ? 'Drop a CSV file here' : 'Drop a database dump here'}</b>
    <span>or click to browse your files</span>
    <div class="formats">${(isCsv ? ['.csv', '.tsv', '.txt'] : ['.sql', '.sql.gz']).map((f) => `<span class="chip mono">${f}</span>`).join('')}</div>
  </div>`;
}
const sw = (attrs, checked, cls = '') => `<div class="switch ${cls}"><input type="checkbox" ${attrs} ${checked ? 'checked' : ''}><span></span></div>`;

/* ================= RESTORE ================= */
function renderRestore() {
  const el = $('#view-restore');
  el.innerHTML = `
    <div class="page-head"><div><h1>Restore a database dump</h1><p>Stream .sql or .sql.gz dumps into MySQL or MariaDB, and fix the usual errors on the way in.</p></div></div>
    <div class="grid-2">
      <div class="stack">
        <div class="card" id="r-source"></div>
        <div class="card" id="r-target"></div>
      </div>
      <div class="sticky"><div class="card" id="r-options"></div></div>
    </div>`;
  renderSource(); renderTarget(); renderOptions();
}

function renderSource() {
  if (!$('#r-source')) return;
  const r = S.r, i = r.info;
  let body;
  if (r.inspecting) body = `<div class="skeleton" style="height:78px"></div>`;
  else if (!i) body = dropzone('dump');
  else {
    const issues = [];
    if (i.hasMariaSandbox) issues.push('MariaDB sandbox header');
    if (i.has0900) issues.push('MySQL 8 collations');
    if (i.hasUseOrCreateDb) issues.push(`USE / CREATE DATABASE${i.sourceDb ? ' `' + esc(i.sourceDb) + '`' : ''}`);
    if (i.hasDefiner) issues.push('DEFINER clauses');
    body = `
      <div class="file-card">
        <div class="file-ico">${i.gz ? 'GZ' : 'SQL'}</div>
        <div class="file-meta"><b title="${esc(i.path)}">${esc(i.name)}</b>
          <small>${fmtBytes(i.size)}${i.gz && i.uncompressedSize ? ` compressed · ~${fmtBytes(i.uncompressedSize)} SQL` : ''}</small></div>
        <button class="btn sm ghost" data-act="pick-dump">${ic('folder')}Change</button>
        <button class="icon-btn" data-act="clear-dump" title="Remove">${ic('x')}</button>
      </div>
      <div class="chips">
        <span class="chip accent">${ic('file')}${esc(i.tool)}</span>
        ${i.serverVersion ? `<span class="chip">${ic('server')}from server ${esc(i.serverVersion)}</span>` : ''}
        ${i.sourceDb ? `<span class="chip mono">${ic('db')}${esc(i.sourceDb)}</span>` : ''}
        ${issues.map((x) => `<span class="chip warn">${ic('wand')}${x}</span>`).join('')}
      </div>
      ${issues.length ? `<div class="callout info mt">${ic('info')}<div>Found ${issues.length} thing${issues.length > 1 ? 's' : ''} that commonly break restores. The fixes they need are <b>switched on automatically</b> for your target server.</div></div>` : ''}`;
  }
  $('#r-source').innerHTML = `<div class="card-head"><span class="step ${i ? 'done' : ''}">${i ? ic('check') : '1'}</span><h3>Source dump</h3></div><div class="card-body">${body}</div>`;
}

function targetName() { return S.r.dbMode === 'new' ? S.r.newDb.trim() : S.r.db; }

function renderTarget() {
  if (!$('#r-target')) return;
  const r = S.r;
  const done = r.connId && targetName();
  let body;
  if (!S.conns.length) {
    body = `<div class="callout info">${ic('info')}<div>Add a MySQL or MariaDB server to restore into.</div></div>
      <button class="btn primary mt" data-act="add-conn">${ic('plus')}Add connection</button>`;
  } else {
    const srv = r.server;
    body = `
      <div class="field"><label>Server</label>${connSelect('r', r.connId)}</div>
      ${srv ? `<div class="chips" style="margin-top:8px">${srv.error ? `<span class="chip danger">${ic('alert')}${esc(srv.error)}</span>` : srv.loading ? `<span class="chip">${ic('loader', 'spin')}Connecting…</span>` : `<span class="chip ok">${ic('check')}Connected</span><span class="chip">${ic('server')}${/maria/i.test(srv.version) ? 'MariaDB' : 'MySQL'} ${esc(srv.version.split('-')[0])}</span><span class="chip">${srv.ms} ms</span>`}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px">
        <span class="label">Target database</span>
        <div class="seg"><button class="${r.dbMode === 'existing' ? 'on' : ''}" data-act="r-dbmode" data-mode="existing">Existing</button><button class="${r.dbMode === 'new' ? 'on' : ''}" data-act="r-dbmode" data-mode="new">New database</button></div>
      </div>
      ${r.dbMode === 'new' ? `
        <div class="field" style="margin-top:10px"><input class="input mono" placeholder="e.g. ${esc(r.info?.sourceDb || 'myapp_restored')}" value="${esc(r.newDb)}" data-input="r-newdb" spellcheck="false"></div>
        <small class="muted" style="display:block;margin-top:6px">Created with utf8mb4 / utf8mb4_unicode_ci if it doesn't exist.</small>` : `
        <div style="display:flex;gap:8px;margin-top:10px">
          <div class="input-icon" style="flex:1">${ic('search')}<input class="input" placeholder="Filter databases…" value="${esc(r.dbFilter)}" data-input="r-dbfilter" spellcheck="false"></div>
          <button class="btn" data-act="r-refresh" title="Reload list">${ic('refresh')}</button>
        </div>
        <div class="db-list" id="r-dblist"></div>
        <label class="opt" style="margin-top:6px;border-top:none">
          <div class="txt"><b>Drop &amp; recreate before restore</b><small>Deletes everything in <code>${esc(r.db || 'the database')}</code> first, for a clean restore.</small></div>
          ${sw('data-change="r-drop"', r.dropFirst, 'danger')}
        </label>`}`;
  }
  $('#r-target').innerHTML = `<div class="card-head"><span class="step ${done ? 'done' : ''}">${done ? ic('check') : '2'}</span><h3>Target</h3></div><div class="card-body">${body}</div>`;
  if (r.dbMode === 'existing' && S.conns.length) renderDbList();
}

function renderDbList(scope = 'r') {
  const el = $(`#${scope}-dblist`); if (!el) return;
  const r = S[scope];
  if (!r.connId) { el.innerHTML = `<div class="db-empty">Choose a server first</div>`; return; }
  if (r.dbs === null) { el.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>'; return; }
  if (r.dbs.error) { el.innerHTML = `<div class="db-empty" style="color:var(--danger)">${esc(r.dbs.error)}</div>`; return; }
  const f = r.dbFilter.toLowerCase();
  const list = r.dbs.filter((d) => d.name.toLowerCase().includes(f));
  if (!list.length) { el.innerHTML = `<div class="db-empty">${r.dbs.length ? 'No match.' : 'No user databases on this server.'} ${scope === 'r' ? '<a href="#" data-act="r-dbmode" data-mode="new" style="color:var(--accent)">Create a new one →</a>' : ''}</div>`; return; }
  el.innerHTML = list.map((d) => `
    <div class="db-row ${d.name === r.db ? 'sel' : ''}" data-act="${scope}-pickdb" data-name="${esc(d.name)}">
      <span class="radio"></span><b>${esc(d.name)}</b>
      <small>${d.tables ? `${d.tables} table${d.tables > 1 ? 's' : ''} · ${fmtBytes(d.size)}` : 'empty'}</small>
    </div>`).join('');
  const sel = el.querySelector('.db-row.sel');
  if (sel && !el.dataset.scrolled) { el.dataset.scrolled = '1'; sel.scrollIntoView({ block: 'nearest' }); }
}

function renderOptions() {
  if (!$('#r-options')) return;
  const r = S.r, i = r.info || {};
  const conn = connById(r.connId);
  const name = targetName();
  const ready = r.info && conn && name && S.env?.mysql.found;
  const groups = OPT_DEFS.map((g) => `
    <div class="opt-group-label">${ic(g.icon)}${g.group}</div>
    ${g.items.map(([k, t, d, det]) => `
      <label class="opt">
        <div class="txt"><b>${t}${det && i[det] ? '<span class="tag">DETECTED</span>' : ''}</b><small>${d}</small></div>
        ${sw(`data-change="r-opt" data-key="${k}"`, r.opts[k])}
      </label>`).join('')}`).join('');
  $('#r-options').innerHTML = `
    <div class="card-head"><span class="step ${ready ? 'done' : ''}">${ready ? ic('check') : '3'}</span><h3>Restore</h3></div>
    <div class="card-body">
      <div class="summary">
        <div class="line"><span>From</span><b class="${r.info ? '' : 'muted'}">${r.info ? esc(r.info.name) : 'No file selected'}</b></div>
        <div class="line"><span>Into</span>${conn ? `<span class="dot" style="color:${esc(conn.color)};width:8px;height:8px"></span><b>${esc(conn.name)}</b>` : '<b class="muted">No server</b>'}${name ? `<b class="mono" style="color:var(--accent)">/ ${esc(name)}</b>` : ''}</div>
        ${r.dropFirst && r.dbMode === 'existing' && r.db ? `<div class="line" style="color:var(--danger)">${ic('alert')}<b>Existing data will be dropped first</b></div>` : ''}
      </div>
      ${groups}
      <button class="btn primary block mt" data-act="start-restore" ${ready ? '' : 'disabled'}>${ic('play')}Start restore</button>
    </div>`;
}

async function loadDump(path) {
  S.r.inspecting = true; renderSource();
  try {
    const info = await api.inspectDump(path);
    S.r.info = info; S.r.file = path;
    if (info.hasMariaSandbox) S.r.opts.fixMariaSandbox = true;
    if (info.hasUseOrCreateDb) S.r.opts.skipUseCreateDb = true;
    if (info.hasDefiner) S.r.opts.stripDefiner = true;
    if (info.has0900 && /maria|^5\./i.test(S.r.server?.version || '')) S.r.opts.fixCollation = true;
    if (!S.r.newDb && info.sourceDb) S.r.newDb = info.sourceDb;
  } catch (e) { toast('Could not read file: ' + e.message); }
  S.r.inspecting = false;
  renderSource(); renderOptions();
}

async function selectRestoreConn(id, preferDb = null) {
  const r = S.r;
  r.connId = id; store.set('r.connId', id);
  r.dbs = null; r.db = preferDb; r.server = { loading: true };
  renderTarget(); renderOptions();
  const [t, d] = await Promise.allSettled([api.connections.test(id), api.databases(id)]);
  if (r.connId !== id) return;
  r.server = t.status === 'fulfilled' ? t.value : { error: t.reason.message };
  r.dbs = d.status === 'fulfilled' ? d.value : { error: d.reason.message };
  if (r.info?.has0900 && /maria/i.test(r.server.version || '')) r.opts.fixCollation = true;
  if (Array.isArray(r.dbs) && r.info?.sourceDb && r.dbs.some((x) => x.name === r.info.sourceDb) && !r.db) r.db = r.info.sourceDb;
  renderTarget(); renderOptions();
}

async function startRestore() {
  const r = S.r;
  const database = targetName();
  if (!/^[^\/\\.`]{1,64}$/.test(database)) return toast('Invalid database name');
  const conn = connById(r.connId);
  if (r.dbMode === 'existing' && r.dropFirst) {
    const ok = await api.confirm({ title: 'Drop database', message: `Drop and recreate "${database}"?`, detail: `Every table, view and routine in ${database} on ${conn.name} will be permanently deleted before the restore. This can't be undone.`, ok: 'Drop & restore' });
    if (!ok) return;
  }
  store.set('r.opts', r.opts);
  const payload = { file: r.file, connId: r.connId, database, createDb: r.dbMode === 'new', dropFirst: r.dbMode === 'existing' && r.dropFirst, ...r.opts };
  await guard(async () => {
    const { id } = await api.startRestore(payload);
    S.job = { id, kind: 'restore', status: 'running', title: r.info.name, file: r.file, conn, database, progress: { bytes: 0, total: r.info.size }, logs: [], errors: [], payload, startedAt: Date.now() };
    go('job');
    replayEarly(id);
  });
}

/* ================= QUICK RESTORE (presets) ================= */
// Presets come from <userData>/presets.json; with none, this feature is invisible.
S.presets = [];
const qstate = {};
const QS = (id) => qstate[id] || (qstate[id] = { id, st: null, loading: false, error: null, connId: store.get(`q.${id}.connId`, null), database: store.get(`q.${id}.database`, ''), folder: store.get(`q.${id}.folder`, ''), q: '', archive: false });
const presetById = (id) => S.presets.find((p) => p.id === id);
S.a = QS('_none');
const fmtDay = (ts) => (ts ? new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtWhen = (ts) => (ts ? new Date(ts).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
const dumpDay = (d) => d.date ?? d.mtime;
const tilde = (p) => String(p || '').replace(/^\/home\/[^/]+|^\/Users\/[^/]+|^[A-Z]:\\Users\\[^\\]+/, '~');
const baseName = (p) => String(p || '').split(/[\\/]/).filter(Boolean).pop() || p;

// File name patterns: DD D MM M YYYY YY (e.g. app_dump_DD_M_YYYY.sql.gz)
const PTOK = /YYYY|YY|DD|MM|D|M/g;
function patternName(pattern, iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const map = { YYYY: String(y), YY: String(y).slice(2), DD: String(d).padStart(2, '0'), D: String(d), MM: String(m).padStart(2, '0'), M: String(m) };
  return pattern.replace(PTOK, (t) => map[t]).replace(/\*/g, '');
}
function patternDate(pattern, name) {
  const base = pattern.replace(/\.sql(\.gz)?$/i, ''), order = [];
  const esc_ = (x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  let src = '', last = 0, m;
  PTOK.lastIndex = 0;
  while ((m = PTOK.exec(base))) { src += esc_(base.slice(last, m.index)) + '(\\d{' + (m[0] === 'YYYY' ? 4 : m[0] === 'YY' ? 2 : '1,2') + '})'; order.push(m[0]); last = PTOK.lastIndex; }
  const hit = name.match(new RegExp('^' + src + esc_(base.slice(last)), 'i'));
  if (!hit || !order.length) return null;
  const v = {}; order.forEach((t, k) => { v[t] = Number(hit[k + 1]); });
  const y = v.YYYY ?? (v.YY != null ? 2000 + v.YY : null), mo = v.MM ?? v.M, d = v.DD ?? v.D;
  return y && mo && d ? `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
}
const patternGlob = (pattern) => pattern.replace(PTOK, '*').replace(/\*+/g, '*');

async function loadQuick(a = S.a) {
  const p = presetById(a.id); if (!p || a.loading) return;
  a.loading = true; a.error = null; if (S.a === a) renderQuick();
  try {
    if (!a.connId || !connById(a.connId)) {
      const id = await api.presets.ensureConn(a.id);
      if (id) { a.connId = id; store.set(`q.${a.id}.connId`, id); S.conns = await api.connections.list(); renderConns(); }
    }
    a.st = await api.presets.status(a.id, { connId: a.connId, folder: a.folder || undefined, database: a.database || undefined });
  } catch (e) { a.error = e.message; }
  a.loading = false;
  if (S.a === a) renderQuick();
}

function renderQuick() {
  const el = $('#view-quick'); if (!el) return;
  const a = S.a, st = a.st, p = presetById(a.id);
  if (!p) { el.innerHTML = ''; return; }
  const folder = st?.folder || p.folder, database = st?.database || p.database;
  const head = `<div class="page-head"><div><h1>${esc(p.name)}</h1><p>Restore the newest dump from <code>${esc(tilde(folder) || '(no folder)')}</code> into <code>${esc(database || '(no database)')}</code>${p.script ? `, using the settings in <code>${esc(tilde(p.script))}</code>` : ''}.</p></div>
    <div style="display:flex;gap:8px">${p.scp ? `<button class="btn primary" data-act="scp-open" title="Download a dump from the server with scp">${ic('download')}SCP Fetch</button>` : ''}
    <button class="btn" data-act="a-refresh" ${a.loading ? 'disabled' : ''}>${ic(a.loading ? 'loader' : 'refresh', a.loading ? 'spin' : '')}Refresh</button></div></div>`;
  if (!st) {
    el.innerHTML = head + (a.error ? `<div class="callout danger">${ic('alert')}<div>${esc(a.error)}</div></div>` : `<div class="art-hero"><div class="card skeleton" style="height:210px;margin:0"></div><div class="card skeleton" style="height:210px;margin:0"></div></div>`);
    return;
  }
  const conn = connById(a.connId);
  const dumps = st.dumps;
  const latest = dumps.find((d) => d.latest);
  const cur = st.current && dumps.find((d) => d.path === st.current.path);
  const upToDate = cur && latest && cur.path === latest.path;
  const newer = cur ? dumps.filter((d) => !d.folder && /\.sql\.gz$/i.test(d.name) && d.mtime > cur.mtime).length : null;
  const L = st.local;

  let localCard;
  if (st.localError) localCard = `<div class="callout danger">${ic('alert')}<div><b>Can't reach the local server.</b><br>${esc(st.localError)}</div></div>`;
  else if (!L) localCard = `<div class="callout info">${ic('info')}<div>Pick the local server and database below.</div></div>`;
  else if (!L.exists) localCard = `<div class="art-big muted">Not restored yet</div><p class="muted">The <code>${esc(st.database)}</code> database doesn't exist on ${esc(conn?.name || 'this server')}.</p>`;
  else localCard = `
      <div class="art-big">${cur ? fmtDay(dumpDay(cur)) : 'Unknown dump'}</div>
      <div class="art-file mono">${cur ? esc(cur.name) : 'Could not match a file in the folder'}</div>
      <div class="art-meta">${ic('history')}Restored ${fmtWhen(L.restoredAt)} · ${timeAgo(L.restoredAt)}</div>
      <div class="chips"><span class="chip">${ic('table')}${plural(L.tables, 'table')}</span><span class="chip">~${fmtCompact(L.rows)} rows</span><span class="chip">${fmtBytes(L.size)}</span></div>
      ${cur && st.current.how === 'inferred' ? `<small class="muted art-note">Matched by restore time: newest dump downloaded before the tables were created.</small>` : ''}`;

  const latestCard = latest ? `
      <div class="art-big">${fmtDay(dumpDay(latest))}</div>
      <div class="art-file mono">${esc(latest.name)}</div>
      <div class="art-meta">${ic('download')}Downloaded ${fmtWhen(latest.mtime)} · ${fmtBytes(latest.size)}</div>
      <div class="chips">${L?.exists && cur ? (upToDate ? `<span class="chip ok">${ic('check')}Your local is up to date</span>` : `<span class="chip warn">${ic('alert')}${newer > 0 ? `${plural(newer, 'newer dump')} than your local` : 'Differs from your local'}</span>`) : ''}</div>
      <button class="btn ${upToDate ? '' : 'primary'} block mt" data-act="a-restore" data-path="${esc(latest.path)}" ${conn && S.env?.mysql.found ? '' : 'disabled'}>${ic('rocket')}${upToDate ? 'Restore latest again' : 'Restore latest'}</button>`
    : `<div class="callout warn">${ic('alert')}<div>No .sql.gz dumps in ${esc(tilde(st.folder))}${st.folderExists ? '' : ' (folder not found)'}.</div></div>`;

  const archived = dumps.filter((d) => d.folder).length;
  const q = a.q.trim().toLowerCase();
  const list = dumps.filter((d) => (a.archive || !d.folder) && (!q || d.name.toLowerCase().includes(q) || fmtDay(dumpDay(d)).toLowerCase().includes(q)));
  let lastMonth = null;
  const rows = list.map((d) => {
    const mk = new Date(dumpDay(d)).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const sep = mk !== lastMonth ? `<tr class="month"><td colspan="6">${esc(mk)}</td></tr>` : '';
    lastMonth = mk;
    const isCur = cur && d.path === cur.path;
    return `${sep}<tr class="${isCur ? 'cur' : ''}">
      <td><div class="art-day">${ic('calendar')}<b>${d.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</b></div></td>
      <td class="mono name" title="${esc(d.path)}">${d.folder ? `<span class="muted">${esc(d.folder)}/</span>` : ''}${esc(d.name)}</td>
      <td class="tags">${d.latest ? `<span class="chip accent">Latest</span>` : ''}${isCur ? `<span class="chip ok">${ic('check')}On local</span>` : ''}</td>
      <td class="num">${fmtBytes(d.size)}</td>
      <td class="muted when" title="${esc(new Date(d.mtime).toString())}">${new Date(d.mtime).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
      <td class="acts"><button class="btn sm ghost" data-act="a-show" data-path="${esc(d.path)}" title="Show in folder">${ic('folder')}</button><button class="btn sm" data-act="a-restore" data-path="${esc(d.path)}" ${conn ? '' : 'disabled'}>${ic('restore')}Restore</button></td>
    </tr>`;
  }).join('');

  el.innerHTML = head + `
    <div class="art-hero">
      <div class="card art-card"><div class="art-label"><span class="dot" style="color:${esc(conn?.color || '#888')};width:8px;height:8px"></span>On your local now<span class="mono muted">${esc(st.database || '')}</span></div>${localCard}</div>
      <div class="card art-card latest"><div class="art-label">${ic('rocket')}Latest in ${esc(baseName(st.folder) || 'folder')}</div>${latestCard}</div>
    </div>
    <div class="art-cfg">
      <label>Server ${S.conns.length ? `<select class="select sm" data-change="a-conn"><option value="" ${!a.connId ? 'selected' : ''} disabled>Choose…</option>${S.conns.map((c) => `<option value="${c.id}" ${c.id === a.connId ? 'selected' : ''}>${esc(c.name)} · ${esc(c.user)}@${esc(c.host)}</option>`).join('')}</select>` : ''}</label>
      <label>Database <input class="input sm mono" value="${esc(a.database || st.database || '')}" data-change="a-db" spellcheck="false"></label>
      <label>Folder <span class="mono path" title="${esc(st.folder)}">${esc(tilde(st.folder))}</span><button class="btn sm ghost" data-act="a-folder">Change…</button></label>
      ${a.folder || a.database ? `<button class="btn sm ghost" data-act="a-reset" title="Go back to the values in presets.json">Reset</button>` : p.script && p.scriptFound ? `<span class="muted" style="font-size:11.5px">From ${esc(tilde(p.script))}</span>` : ''}
    </div>
    <div class="card">
      <div class="card-head"><h3>Dumps</h3><span class="chip">${dumps.length - archived} in folder${archived ? ` · ${archived} in subfolders` : ''}</span>
        <div class="right">
          ${archived ? `<label class="check-inline" style="font-size:12.5px">${sw('data-change="a-archive"', a.archive)}<span>Show subfolders</span></label>` : ''}
          <div class="input-icon" style="width:220px">${ic('search')}<input class="input" style="height:32px" placeholder="Search dumps…" value="${esc(a.q)}" data-input="a-q" spellcheck="false"></div>
        </div></div>
      <div class="card-body" style="padding-top:12px"><div class="art-table-wrap"><table class="art-table"><colgroup><col style="width:150px"><col><col style="width:168px"><col style="width:72px"><col style="width:100px"><col style="width:156px"></colgroup>
        <thead><tr><th>Dump date</th><th>File</th><th></th><th class="num">Size</th><th>Downloaded</th><th></th></tr></thead>
        <tbody id="a-rows">${rows || `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">No dumps match</td></tr>`}</tbody></table></div></div>
    </div>`;
}

/* ---- SCP Fetch ---- */
const isoDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
S.scp = null;
function openScp() {
  const p = presetById(S.a.id); if (!p?.scp) return;
  const pid = p.id;
  S.scp = { pid, pattern: p.filePattern, host: store.get(`q.${pid}.scpHost`, p.scp.host), dir: store.get(`q.${pid}.scpDir`, p.scp.dir || '~'), date: isoDay(), name: patternName(p.filePattern, isoDay()), remote: null, restoreAfter: store.get(`q.${pid}.restoreAfter`, false) };
  renderScp(); $('#scpDialog').showModal();
  loadRemote();
}
async function loadRemote() {
  const c = S.scp;
  c.remote = null; renderScpRemote();
  try { c.remote = await api.scp.list({ host: c.host, dir: c.dir, glob: patternGlob(c.pattern) }); } catch (e) { c.remote = { error: e.message }; }
  renderScpRemote(); renderScpStatus();
}
const localDump = (name) => S.a.st?.dumps.find((d) => d.name === name && !d.folder);
const scpFolderName = () => tilde(S.a.st?.folder || presetById(S.a.id)?.folder || '');

function renderScp() {
  const c = S.scp;
  $('#scpDialog').innerHTML = `<div class="modal scp-modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px">${ic('download')}</div>
      <div><h3>SCP Fetch</h3><p>Download a dump from ${esc(c.host)} into ${esc(scpFolderName())}</p></div>
      <button class="icon-btn" data-act="scp-close">${ic('x')}</button></div>
    <div class="modal-body">
      <div class="row">
        <div class="field" style="flex:0 0 170px"><label>Dump date</label><input type="date" class="input" value="${esc(c.date)}" data-change="scp-date" max="${isoDay()}"></div>
        <div class="field"><label>File name</label><input class="input mono" value="${esc(c.name)}" data-input="scp-name" spellcheck="false"></div>
      </div>
      <div class="row">
        <div class="field" style="flex:0 0 170px"><label>SSH host</label><input class="input mono" value="${esc(c.host)}" data-change="scp-host" spellcheck="false"></div>
        <div class="field"><label>Remote folder</label><input class="input mono" value="${esc(c.dir)}" data-change="scp-dir" spellcheck="false"></div>
      </div>
      <div class="scp-cmd mono" id="scp-cmd"></div>
      <div id="scp-status"></div>
      <div class="field"><label style="display:flex;align-items:center;gap:8px">On the server <button class="icon-btn" data-act="scp-reload" title="Reload list">${ic('refresh')}</button></label><div class="scp-remote" id="scp-remote"></div></div>
      <label class="check-inline">${sw('data-change="scp-restore"', c.restoreAfter)}<span>Restore into ${esc(S.a.st?.database || 'the database')} right after downloading</span></label>
    </div>
    <div class="modal-foot"><div class="spacer"></div><button class="btn" data-act="scp-close">Cancel</button><button class="btn primary" data-act="scp-go" id="scp-go">${ic('download')}Fetch</button></div></div>`;
  renderScpCmd(); renderScpRemote(); renderScpStatus();
}
function renderScpCmd() {
  const c = S.scp, el = $('#scp-cmd'); if (!el) return;
  el.innerHTML = `<span class="muted">$</span> scp ${esc(c.host)}:${esc(c.dir.replace(/\/+$/, ''))}/<b>${esc(c.name)}</b> ${esc(scpFolderName())}/`;
}
function renderScpStatus() {
  const c = S.scp, el = $('#scp-status'); if (!el) return;
  const r = Array.isArray(c.remote) ? c.remote.find((f) => f.name === c.name) : null;
  const loc = localDump(c.name);
  let html = '';
  if (Array.isArray(c.remote)) {
    if (r) html = `<div class="callout ok-call">${ic('check')}<div>On the server · <b>${fmtBytes(r.size)}</b> · uploaded ${fmtWhen(r.mtime)}</div></div>`;
    else { const newest = c.remote[0]; html = `<div class="callout warn">${ic('alert')}<div><b>${esc(c.name)}</b> is not on the server${c.date === isoDay() ? ' yet (today’s dump hasn’t been made)' : ''}.${newest ? ` Newest there: <a href="#" data-act="scp-pick" data-name="${esc(newest.name)}">${esc(newest.name)}</a>` : ''}</div></div>`; }
  }
  if (loc) html += `<div class="callout info" style="margin-top:8px">${ic('info')}<div>Already downloaded (${fmtBytes(loc.size)}${r && r.size === loc.size ? ', same size' : r ? `, server copy is ${fmtBytes(r.size)}` : ''}). Fetching again replaces it.</div></div>`;
  el.innerHTML = html;
  const go_ = $('#scp-go'); if (go_) go_.toggleAttribute('disabled', !/^[\w.()-]+\.sql(\.gz)?$/.test(c.name) || (Array.isArray(c.remote) && !r));
}
function renderScpRemote() {
  const c = S.scp, el = $('#scp-remote'); if (!el) return;
  if (c.remote === null) { el.innerHTML = `<div class="scp-msg">${ic('loader', 'spin')}Connecting to ${esc(c.host)}…</div>`; return; }
  if (c.remote.error) { el.innerHTML = `<div class="scp-msg bad">${ic('alert')}<span>${esc(c.remote.error)}</span></div>`; return; }
  if (!c.remote.length) { el.innerHTML = `<div class="scp-msg">No ${esc(patternGlob(c.pattern))} files in ${esc(c.dir)}</div>`; return; }
  el.innerHTML = c.remote.map((f) => {
    const loc = localDump(f.name), iso = patternDate(c.pattern, f.name);
    return `<div class="scp-row ${f.name === c.name ? 'sel' : ''}" data-act="scp-pick" data-name="${esc(f.name)}">
      <span class="radio"></span><b>${iso ? new Date(iso + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</b>
      <span class="mono muted nm">${esc(f.name)}</span><span class="sz">${fmtBytes(f.size)}</span>
      ${loc ? `<span class="chip ${loc.size === f.size ? 'ok' : 'warn'}">${loc.size === f.size ? 'Downloaded' : 'Local differs'}</span>` : `<span class="chip accent">New</span>`}</div>`;
  }).join('');
}
async function startScp() {
  const c = S.scp, st = S.a.st;
  if (!st) return toast('The dump folder is not loaded yet');
  const r = Array.isArray(c.remote) ? c.remote.find((f) => f.name === c.name) : null;
  if (localDump(c.name) && !(await api.confirm({ title: 'Replace file', message: `${c.name} is already downloaded. Download it again?`, detail: 'The existing file is replaced only after the new download finishes.', ok: 'Download again' }))) return;
  const payload = { host: c.host, dir: c.dir, name: c.name, folder: st.folder, size: r?.size };
  await guard(async () => {
    const { id } = await api.scp.fetch(payload);
    $('#scpDialog').close();
    S.job = { id, kind: 'fetch', quick: c.pid, status: 'running', title: c.name, file: `${st.folder}${S.env?.sep || '/'}${c.name}`, folder: st.folder, remote: `${c.host}:${c.dir.replace(/\/+$/, '')}/${c.name}`, restoreAfter: c.restoreAfter, conn: { name: c.host, color: '#fb923c' }, database: st.database, progress: { bytes: 0, total: r?.size || 1 }, logs: [], errors: [], payload, startedAt: Date.now() };
    go('job');
    replayEarly(id);
  });
}

async function quickRestore(file, a = S.a) {
  if (!a.st) await loadQuick(a);
  const st = a.st, p = presetById(a.id); if (!st || !p) return toast(a.error || 'Could not load the preset');
  const conn = connById(a.connId); if (!conn) return toast('Pick the local server first');
  const database = a.database || st.database; if (!database) return toast('Set the database first');
  const name = baseName(file);
  const ok = await api.confirm({ title: p.name, message: `Replace ${database} with ${name}?`, detail: `${database} on ${conn.name} will be dropped and recreated, then restored from:\n${file}\n\nEverything currently in ${database} is deleted. This can't be undone.`, ok: 'Drop & restore' });
  if (!ok) return;
  const payload = { file, connId: a.connId, database, createDb: false, dropFirst: true, ...DEFAULT_OPTS };
  await guard(async () => {
    const { id } = await api.startRestore(payload);
    S.job = { id, kind: 'restore', quick: a.id, status: 'running', title: name, file, conn, database, progress: { bytes: 0, total: st.dumps.find((d) => d.path === file)?.size || 1 }, logs: [], errors: [], payload, startedAt: Date.now() };
    go('job');
    replayEarly(id);
  });
}

/* ================= EXPORT ================= */
const stamp = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };
function exportFile() {
  const e = S.e, ext = e.opts.gzip ? '.sql.gz' : '.sql';
  if (e.file) return e.file.replace(/\.sql(\.gz)?$|\.gz$/i, '') + ext;
  if (!e.db || !S.env) return null;
  return `${S.env.downloads}${S.env.sep}${e.db.replace(/[\\/:*?"<>|]/g, '_')}_${stamp()}${ext}`;
}
function exportTables() {
  const e = S.e;
  if (!Array.isArray(e.objects)) return [];
  return e.allTables ? e.objects : e.objects.filter((o) => e.selected.has(o.name));
}

function renderExport() {
  $('#view-export').innerHTML = `
    <div class="page-head"><div><h1>Export a database</h1><p>Dump a whole database or a few tables to .sql, or gzip it to .sql.gz to save space.</p></div></div>
    <div class="grid-2">
      <div class="stack">
        <div class="card" id="e-source"></div>
        <div class="card" id="e-tables"></div>
      </div>
      <div class="sticky"><div class="card" id="e-options"></div></div>
    </div>`;
  renderExportSource(); renderExportTables(); renderExportOptions();
}

function renderExportSource() {
  if (!$('#e-source')) return;
  const e = S.e;
  let body;
  if (!S.conns.length) body = `<div class="callout info">${ic('info')}<div>Add a MySQL or MariaDB server to export from.</div></div><button class="btn primary mt" data-act="add-conn">${ic('plus')}Add connection</button>`;
  else body = `
      <div class="field"><label>Server</label>${connSelect('e', e.connId)}</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <div class="input-icon" style="flex:1">${ic('search')}<input class="input" placeholder="Filter databases…" value="${esc(e.dbFilter)}" data-input="e-dbfilter" spellcheck="false"></div>
        <button class="btn" data-act="e-refresh" title="Reload list">${ic('refresh')}</button>
      </div>
      <div class="db-list" id="e-dblist"></div>`;
  $('#e-source').innerHTML = `<div class="card-head"><span class="step ${e.db ? 'done' : ''}">${e.db ? ic('check') : '1'}</span><h3>Database</h3></div><div class="card-body">${body}</div>`;
  if (S.conns.length) renderDbList('e');
}

function renderExportTables() {
  if (!$('#e-tables')) return;
  const e = S.e;
  let body;
  if (!e.db) body = `<div class="db-empty" style="padding:8px 0">Pick a database first</div>`;
  else if (e.objects === null) body = '<div class="skeleton"></div><div class="skeleton"></div>';
  else if (e.objects.error) body = `<div class="callout danger">${ic('alert')}<div>${esc(e.objects.error)}</div></div>`;
  else if (!e.objects.length) body = `<div class="callout info">${ic('info')}<div><b>${esc(e.db)}</b> has no tables. The export will contain only routines and events, if any.</div></div>`;
  else if (e.allTables) {
    const tbl = e.objects.filter((o) => !o.view), views = e.objects.length - tbl.length;
    const size = tbl.reduce((s, o) => s + o.size, 0), rows = tbl.reduce((s, o) => s + (o.rows || 0), 0);
    body = `<div class="chips" style="margin-top:0"><span class="chip accent">${ic('table')}${plural(tbl.length, 'table')}</span>${views ? `<span class="chip">${ic('eye')}${plural(views, 'view')}</span>` : ''}<span class="chip">~${fmtCompact(rows)} rows</span><span class="chip">${fmtBytes(size)} on disk</span></div>`;
  } else {
    const f = e.tFilter.toLowerCase();
    const list = e.objects.filter((o) => o.name.toLowerCase().includes(f));
    body = `<div style="display:flex;gap:8px;align-items:center">
        <div class="input-icon" style="flex:1">${ic('search')}<input class="input" placeholder="Filter tables…" value="${esc(e.tFilter)}" data-input="e-tfilter" spellcheck="false"></div>
        <button class="btn sm ghost" data-act="e-sel-all">Select all</button><button class="btn sm ghost" data-act="e-sel-none">None</button></div>
      <div class="db-list tbl-list" id="e-tlist">${list.map((o) => `
        <label class="db-row"><input type="checkbox" class="check" data-change="e-tbl" data-name="${esc(o.name)}" ${e.selected.has(o.name) ? 'checked' : ''}>
          ${ic(o.view ? 'eye' : 'table')}<b>${esc(o.name)}</b><small>${o.view ? 'view' : `~${fmtCompact(o.rows)} rows · ${fmtBytes(o.size)}`}</small></label>`).join('') || '<div class="db-empty">No match</div>'}</div>`;
  }
  const n = exportTables().length;
  $('#e-tables').innerHTML = `<div class="card-head"><span class="step ${e.db && Array.isArray(e.objects) && (e.allTables || n) ? 'done' : ''}">${e.db && Array.isArray(e.objects) && (e.allTables || n) ? ic('check') : '2'}</span><h3>Tables</h3>
      <div class="right">${!e.allTables && Array.isArray(e.objects) ? `<span class="chip" id="e-selcount">${n} of ${e.objects.length} selected</span>` : ''}
      <div class="seg"><button class="${e.allTables ? 'on' : ''}" data-act="e-tmode" data-mode="all">Everything</button><button class="${!e.allTables ? 'on' : ''}" data-act="e-tmode" data-mode="pick">Choose tables</button></div></div></div>
    <div class="card-body">${body}</div>`;
}

function renderExportOptions() {
  if (!$('#e-options')) return;
  const e = S.e, o = e.opts;
  const conn = connById(e.connId);
  const file = exportFile();
  const tables = exportTables();
  const est = tables.reduce((s, t) => s + (t.data || 0), 0);
  const ready = conn && e.db && Array.isArray(e.objects) && (e.allTables || tables.length) && S.env?.dump?.found;
  const opt = (k, t, d, disabled) => `<label class="opt ${disabled ? 'off' : ''}"><div class="txt"><b>${t}</b><small>${d}</small></div>${sw(`data-change="e-opt" data-key="${k}" ${disabled ? 'disabled' : ''}`, o[k] && !disabled)}</label>`;
  const schemaOnlyOff = o.content === 'data';
  $('#e-options').innerHTML = `
    <div class="card-head"><span class="step ${ready ? 'done' : ''}">${ready ? ic('check') : '3'}</span><h3>Export</h3></div>
    <div class="card-body">
      <div class="summary">
        <div class="line"><span>From</span>${conn ? `<span class="dot" style="color:${esc(conn.color)};width:8px;height:8px"></span><b>${esc(conn.name)}</b>` : '<b class="muted">No server</b>'}${e.db ? `<b class="mono" style="color:var(--accent)">/ ${esc(e.db)}</b>` : ''}</div>
        <div class="line"><span>Tables</span><b class="${tables.length ? '' : 'muted'}">${Array.isArray(e.objects) ? (e.allTables ? `All (${e.objects.length})` : `${tables.length} selected`) : '—'}</b>${est ? `<b class="muted" style="font-weight:400">· ~${fmtBytes(est)} of data</b>` : ''}</div>
      </div>
      <div class="opt-group-label">${ic('file')}Format</div>
      <div class="fmt-pick">
        <button class="fmt ${o.gzip ? 'on' : ''}" data-act="e-fmt" data-gz="1"><b>.sql.gz</b><small>Compressed, usually 5–10× smaller</small></button>
        <button class="fmt ${!o.gzip ? 'on' : ''}" data-act="e-fmt" data-gz="0"><b>.sql</b><small>Plain text, readable in any editor</small></button>
      </div>
      <div class="field mt"><label>Content</label><select class="select" data-change="e-content">
        <option value="both" ${o.content === 'both' ? 'selected' : ''}>Structure and data</option>
        <option value="schema" ${o.content === 'schema' ? 'selected' : ''}>Structure only (no rows)</option>
        <option value="data" ${o.content === 'data' ? 'selected' : ''}>Data only (INSERT statements)</option></select></div>
      <div class="opt-group-label" style="margin-top:16px">${ic('wand')}Include</div>
      ${opt('routines', 'Procedures & functions', 'Stored routines of this database.', schemaOnlyOff)}
      ${opt('triggers', 'Triggers', 'Table triggers, dumped right after each table.', schemaOnlyOff)}
      ${opt('events', 'Events', 'Scheduled events. Needs the EVENT privilege.', schemaOnlyOff)}
      ${opt('addDrop', 'DROP TABLE before CREATE', 'Lets the dump overwrite existing tables when restored.', o.content === 'data')}
      ${opt('createDb', 'CREATE DATABASE & USE', 'Ties the dump to this database name. Leave off to restore it under any name.', !e.allTables)}
      <div class="opt-group-label" style="margin-top:16px">${ic('folder')}Save to</div>
      <div class="save-path"><span class="mono" title="${esc(file || '')}">${file ? esc(file) : '<span class="muted">Pick a database first</span>'}</span><button class="btn sm" data-act="e-saveas" ${e.db ? '' : 'disabled'}>Change…</button></div>
      ${S.env && !S.env.dump?.found ? `<div class="callout danger mt">${ic('alert')}<div><b>mysqldump not found.</b> Install the mysql-client package to export.</div></div>` : ''}
      <button class="btn primary block mt" data-act="start-export" ${ready ? '' : 'disabled'}>${ic('download')}Export ${e.db ? esc(e.db) : ''}</button>
    </div>`;
}

async function selectExportConn(id, preferDb = null) {
  const e = S.e;
  e.connId = id; store.set('e.connId', id);
  e.dbs = null; e.db = null; e.objects = null; e.file = null;
  renderExportSource(); renderExportTables(); renderExportOptions();
  try { e.dbs = await api.databases(id); } catch (err) { e.dbs = { error: err.message }; }
  if (e.connId !== id) return;
  renderExportSource();
  if (preferDb && Array.isArray(e.dbs) && e.dbs.some((d) => d.name === preferDb)) await selectExportDb(preferDb);
}
async function selectExportDb(name) {
  const e = S.e;
  e.db = name; e.objects = null; e.selected = new Set(); e.tFilter = '';
  renderExportSource(); renderExportTables(); renderExportOptions();
  try { e.objects = await api.objects(e.connId, name); } catch (err) { e.objects = { error: err.message }; }
  if (e.db !== name) return;
  if (Array.isArray(e.objects)) e.selected = new Set(e.objects.map((o) => o.name));
  renderExportSource(); renderExportTables(); renderExportOptions();
}

async function startExport() {
  const e = S.e, o = e.opts;
  const file = exportFile();
  const tables = exportTables();
  if (!e.allTables && !tables.length) return toast('Select at least one table');
  if (await api.exists(file).catch(() => false)) {
    if (!(await api.confirm({ title: 'Replace file', message: `${file.split(/[\\/]/).pop()} already exists. Replace it?`, detail: file, ok: 'Replace' }))) return;
  }
  store.set('e.opts', o);
  const conn = connById(e.connId);
  const weights = Object.fromEntries(tables.map((t) => [t.name, t.data]));
  const payload = { connId: e.connId, database: e.db, tables: tables.map((t) => t.name), allTables: e.allTables, weights, file, ...o, createDb: o.createDb && e.allTables };
  await guard(async () => {
    const { id } = await api.startExport(payload);
    S.job = { id, kind: 'export', status: 'running', title: file.split(/[\\/]/).pop(), file, conn, database: e.db, progress: { bytes: 0, total: 1, written: 0 }, logs: [], errors: [], payload, startedAt: Date.now() };
    e.file = null;
    go('job');
    replayEarly(id);
  });
}

/* ================= DATA VIEWER ================= */
let dvTimer = null;
const newDv = (connId = null, db = null, table = null) => ({ key: JSON.stringify([connId, db, table]), connId, db, table, filters: {}, search: '', sort: [], offset: 0, limit: store.get('dv.limit', 200), data: null, loading: false, error: null, sel: null, seq: 0, scroll: null, refs: null, colSearch: '', refSearch: '', hidden: new Set(table ? store.get(`hide.${connId}.${db}.${table}`, []) : []) });
const saveHidden = (d) => store.set(`hide.${d.connId}.${d.db}.${d.table}`, [...d.hidden]);
let panelOpen = store.get('dv.panel', true);
const fkOf = (d, col) => d.refs?.out.find((f) => f.columns.includes(col));
const EMPTY_DV = newDv();
S.dv = EMPTY_DV;
const saveTabs = () => store.set('tabs', { list: S.tabs.map(({ kind, key, title, sql, connId, db, table }) => (kind === 'query' ? { kind, key, title, sql, connId, db } : { connId, db, table })), active: S.dv.key });
let saveTabsTimer = null;
const saveTabsSoon = () => { clearTimeout(saveTabsTimer); saveTabsTimer = setTimeout(saveTabs, 400); };
const sameGroup = (a, b) => a.connId === b.connId && a.db === b.db;

function rememberScroll() {
  const g = $('#dv-grid');
  if (g && S.dv !== EMPTY_DV && S.view === 'data') S.dv.scroll = [g.scrollTop, g.scrollLeft];
}
function activateTab(tab, { show = true } = {}) {
  rememberScroll();
  S.dv = tab || EMPTY_DV;
  saveTabs();
  if (show) go('data'); else if (S.view === 'data') { renderData(); renderConns(); }
  if (tab && !tab.data && !tab.loading) fetchData(tab);
}
function openTable(connId, db, table, filters = null) {
  let tab = S.tabs.find((t) => t.connId === connId && t.db === db && t.table === table);
  if (tab && filters) { rememberScroll(); Object.assign(tab, { filters: { ...filters }, search: '', offset: 0, data: null, sel: null, scroll: null }); if (S.dv === tab) S.dv = EMPTY_DV; }
  if (!tab) {
    tab = newDv(connId, db, table);
    // Keep tabs of the same database next to each other.
    let at = -1;
    S.tabs.forEach((t, i) => { if (sameGroup(t, tab)) at = i; });
    if (at < 0) S.tabs.push(tab); else S.tabs.splice(at + 1, 0, tab);
    if (filters) tab.filters = { ...filters };
  }
  activateTab(tab);
}
function closeTab(key) {
  const i = S.tabs.findIndex((t) => t.key === key); if (i < 0) return;
  const [tab] = S.tabs.splice(i, 1);
  if (tab.kind === 'query') api.sql.close(tab.key).catch(() => {});
  if (S.dv === tab) {
    // Prefer a neighbour from the same database, then any neighbour.
    const next = S.tabs.find((t, j) => sameGroup(t, tab) && j >= i) || [...S.tabs].reverse().find((t) => sameGroup(t, tab)) || S.tabs[i] || S.tabs[i - 1];
    S.dv = EMPTY_DV;
    activateTab(next, { show: false });
  } else { saveTabs(); if (S.view === 'data') { renderTabs(); renderConns(); } }
}
function closeTabs(pred) {
  const keep = S.tabs.filter((t) => !pred(t));
  if (keep.length === S.tabs.length) return;
  for (const t of S.tabs) if (!keep.includes(t) && t.kind === 'query') api.sql.close(t.key).catch(() => {});
  S.tabs = keep;
  if (!S.tabs.includes(S.dv)) { S.dv = EMPTY_DV; activateTab(S.tabs[S.tabs.length - 1], { show: false }); }
  else { saveTabs(); if (S.view === 'data') { renderTabs(); renderConns(); } }
}

function renderTabs() {
  const el = $('#dv-tabs'); if (!el) return;
  const groups = [];
  for (const t of S.tabs) { const g = groups[groups.length - 1]; if (g && sameGroup(g[0], t)) g.push(t); else groups.push([t]); }
  const multiConn = new Set(S.tabs.map((t) => t.connId)).size > 1;
  el.innerHTML = groups.map((g) => {
    const c = connById(g[0].connId);
    const act = g.includes(S.dv);
    return `<div class="tab-group ${act ? 'act' : ''}" style="--gc:${esc(c?.color || '#888')}">
      <span class="tg-label" title="${esc(c?.name || '')} / ${esc(g[0].db)}">${ic('db')}${multiConn ? `<span class="tg-conn">${esc(c?.name || '?')} /</span>` : ''}${esc(g[0].db)}${g.length > 1 ? `<button class="tg-x" data-act="tab-close-group" data-key="${esc(g[0].key)}" title="Close all ${g.length} tabs of ${esc(g[0].db)}">${ic('x')}</button>` : ''}</span>
      ${g.map((t) => `<div class="tab ${t === S.dv ? 'on' : ''} ${t.kind === 'query' ? 'qtab' : ''}" data-act="tab-open" data-key="${esc(t.key)}" title="${t.kind === 'query' ? `SQL query on ${esc(t.db || 'no database')}` : `${esc(t.db)}.${esc(t.table)}`}">
        ${t.loading ? ic('loader', 'spin') : ic(t.kind === 'query' ? 'code' : 'table')}<span>${esc(t.kind === 'query' ? t.title : t.table)}</span>${Object.values(t.filters).some((v) => String(v).trim()) || t.search.trim() ? '<span class="tab-dot" title="Filtered"></span>' : ''}
        <button class="tab-x" data-act="tab-close" data-key="${esc(t.key)}" title="Close (Ctrl+W)">${ic('x')}</button></div>`).join('')}
    </div>`;
  }).join('') + `<button class="tab-new" data-act="q-new" title="New SQL query (Ctrl+T)">${ic('plus')}<span>SQL</span></button>`;
  el.querySelector('.tab.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function renderData() {
  const d = S.dv, el = $('#view-data');
  if (d.kind === 'query') return renderQuery();
  if (!d.table) {
    el.innerHTML = `<div class="dv-empty"><div class="dz-icon">${ic('table')}</div><b>Browse your data</b><span>${S.conns.length ? 'Open a connection in the sidebar, expand a database and click a table.' : 'Add a connection first, then pick a table in the sidebar.'}</span>
      ${S.conns.length ? `<button class="btn primary mt" data-act="q-new">${ic('code')}New SQL query</button>` : `<button class="btn primary mt" data-act="add-conn">${ic('plus')}Add connection</button>`}</div>`;
    return;
  }
  const conn = connById(d.connId);
  const nf = Object.values(d.filters).filter((v) => String(v).trim()).length;
  el.innerHTML = `<div class="dv">
    <div class="dv-tabs" id="dv-tabs"></div>
    <div class="dv-body">
    ${panelOpen ? '<aside class="dv-side" id="dv-side"></aside>' : ''}
    <div class="dv-main">
    <div class="dv-head">
      <button class="icon-btn ${panelOpen ? 'on' : ''}" data-act="dv-panel" title="${panelOpen ? 'Hide' : 'Show'} columns &amp; relationships panel">${ic('panel')}</button>
      <div class="crumbs"><span class="dot" style="color:${esc(conn?.color || '#888')};width:8px;height:8px"></span><span>${esc(conn?.name || '?')}</span><span class="sep">/</span><span class="mono">${esc(d.db)}</span><span class="sep">/</span><b class="mono">${esc(d.table)}</b></div>
      <div class="right">
        <button class="btn sm ghost" data-act="dv-export" title="Export this table to .sql.gz">${ic('download')}Export table</button>
        <button class="btn sm" data-act="dv-refresh">${ic('refresh')}Refresh</button>
      </div>
    </div>
    <div class="dv-toolbar">
      <div class="input-icon dv-search">${ic('search')}<input class="input" id="dv-search" placeholder="Search all columns…" value="${esc(d.search)}" data-input="dv-search" spellcheck="false"></div>
      <div id="dv-finfo">${filterInfo()}</div>
      <div class="spacer"></div>
      <div class="pager" id="dv-pager"></div>
    </div>
    <div class="dv-grid ${d.loading ? 'loading' : ''}" id="dv-grid"><table class="grid"><thead id="dv-thead"></thead><tbody id="dv-tbody"></tbody></table><div id="dv-msg"></div></div>
    <div class="dv-status" id="dv-status"></div>
    </div></div>
  </div>`;
  renderTabs(); renderSide(); renderDataHead(); renderDataBody();
  if (d.scroll) { const g = $('#dv-grid'); g.scrollTop = d.scroll[0]; g.scrollLeft = d.scroll[1]; }
}

function filterInfo() {
  const d = S.dv;
  const n = Object.values(d.filters).filter((v) => String(v).trim()).length + (d.search.trim() ? 1 : 0);
  return `<span class="chip ${n ? 'accent' : ''}" title="Filter syntax: text = contains · =x exact · !x not containing · >5 <5 >=5 <=5 · a*b wildcards · NULL / NOT NULL · EMPTY">${ic('filter')}${n ? `${n} filter${n > 1 ? 's' : ''}` : 'No filters'}</span>${n ? `<button class="btn sm ghost" data-act="dv-clear">${ic('x')}Clear</button>` : ''}`;
}

/* ---- side panel: columns + relationships ---- */
function renderSide() {
  const el = $('#dv-side'); if (!el) return;
  const d = S.dv;
  const nCols = d.data?.columns.length || 0;
  el.innerHTML = `
    <section class="side-sec cols">
      <div class="side-title">Columns<span class="cnt">${nCols ? `${nCols - [...d.hidden].filter((h) => d.data.columns.some((c) => c.name === h)).length} / ${nCols}` : ''}</span></div>
      <div class="side-tools">
        <div class="side-search">${ic('search')}<input placeholder="Search columns" value="${esc(d.colSearch)}" data-input="dv-colsearch" spellcheck="false"></div>
        <button class="btn sm ghost" data-act="dv-cols" data-show="0" title="Hide the columns in this list">Hide</button><button class="btn sm ghost" data-act="dv-cols" data-show="1" title="Show the columns in this list">Show</button>
      </div>
      <div class="side-list" id="dv-colist">${colListHtml()}</div>
    </section>
    <section class="side-sec refs">
      <div class="side-title">Relationships</div>
      <div class="side-tools"><div class="side-search">${ic('search')}<input placeholder="Search relationships" value="${esc(d.refSearch)}" data-input="dv-refsearch" spellcheck="false"></div></div>
      <div class="side-list" id="dv-reflist">${refListHtml()}</div>
    </section>`;
}
const colMatches = (d) => (d.data?.columns || []).filter((c) => !d.colSearch.trim() || c.name.toLowerCase().includes(d.colSearch.trim().toLowerCase()));
function colListHtml() {
  const d = S.dv;
  if (!d.data) return '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  const list = colMatches(d);
  if (!list.length) return '<div class="side-empty">No column matches</div>';
  return list.map((c) => {
    const fk = fkOf(d, c.name);
    const f = String(d.filters[c.name] || '').trim();
    return `<div class="col-item ${d.hidden.has(c.name) ? 'off' : ''}">
      <input type="checkbox" class="check" data-change="dv-colvis" data-col="${esc(c.name)}" ${d.hidden.has(c.name) ? '' : 'checked'} title="Show / hide">
      <span class="col-name" data-act="dv-gocol" data-col="${esc(c.name)}" title="${esc(c.name)} · ${esc(c.type)}${c.nullable ? '' : ' · NOT NULL'} (click to jump to it)">
        ${c.pk ? ic('key', 'pk') : fk ? ic('link', 'fk') : ''}<b class="${c.nullable ? '' : 'nn'}">${esc(c.name)}</b><small>${esc(c.type)}</small>
        ${fk ? `<span class="fk-to" title="References ${esc(fk.refDb)}.${esc(fk.refTable)}(${esc(fk.refColumns.join(', '))})">→ ${esc(fk.refTable)}</span>` : ''}
        ${f ? `<span class="tab-dot" title="Filtered: ${esc(f)}"></span>` : ''}
      </span></div>`;
  }).join('');
}
function refListHtml() {
  const d = S.dv;
  if (!d.refs) return '<div class="skeleton"></div>';
  const q = d.refSearch.trim().toLowerCase();
  const m = (r, t) => !q || t.toLowerCase().includes(q) || r.columns.join(' ').toLowerCase().includes(q);
  const out = d.refs.out.map((r, i) => [r, i]).filter(([r]) => m(r, r.refTable));
  const inn = d.refs.in.map((r, i) => [r, i]).filter(([r]) => m(r, r.table));
  const hint = d.sel ? 'the selected row' : 'all rows (select a row to follow it)';
  const item = (dir, r, i) => {
    const tbl = dir === 'out' ? r.refTable : r.table, tdb = dir === 'out' ? r.refDb : r.db;
    const cols = dir === 'out' ? r.columns : r.columns;
    return `<div class="ref-item" data-act="dv-ref" data-dir="${dir}" data-i="${i}" title="${esc(tdb)}.${esc(tbl)} · ${esc(r.columns.join(', '))} → ${esc(r.refColumns.join(', '))}\nOpens ${esc(tbl)} for ${hint}">
      ${ic(dir === 'out' ? 'arrowUpRight' : 'arrowDownLeft')}<b>${tdb !== d.db ? `${esc(tdb)}.` : ''}${esc(tbl)}</b><small>(${esc(cols.join(', '))})</small></div>`;
  };
  if (!d.refs.out.length && !d.refs.in.length) return '<div class="side-empty">This table has no foreign keys and nothing references it.</div>';
  return `<div class="ref-head">References <span class="cnt">${d.refs.out.length}</span></div>
    ${out.map(([r, i]) => item('out', r, i)).join('') || `<div class="side-empty">${d.refs.out.length ? 'No match' : 'None'}</div>`}
    <div class="ref-head">Referenced by <span class="cnt">${d.refs.in.length}</span></div>
    ${inn.map(([r, i]) => item('in', r, i)).join('') || `<div class="side-empty">${d.refs.in.length ? 'No match' : 'None'}</div>`}`;
}
function refreshCols() {
  renderDataHead(); renderDataBody();
  const l = $('#dv-colist'); if (l) l.innerHTML = colListHtml();
  const t = $('#dv-side .cols .cnt'); const d = S.dv;
  if (t && d.data) t.textContent = `${d.data.columns.filter((c) => !d.hidden.has(c.name)).length} / ${d.data.columns.length}`;
}
// Follow a foreign key: open the other table filtered to the related rows.
function followRef(dir, fk, row) {
  const d = S.dv, cols = d.data.columns;
  const val = (name) => { const v = row[cols.findIndex((c) => c.name === name)]; return v === null ? null : cellText(v); };
  const filters = {};
  if (row) {
    const src = dir === 'out' ? fk.columns : fk.refColumns, dst = dir === 'out' ? fk.refColumns : fk.columns;
    for (let k = 0; k < src.length; k++) { const v = val(src[k]); filters[dst[k]] = v === null ? 'NULL' : '=' + v; }
  }
  openTable(d.connId, dir === 'out' ? fk.refDb : fk.db, dir === 'out' ? fk.refTable : fk.table, row ? filters : null);
}

function renderDataHead() {
  const d = S.dv, th = $('#dv-thead'); if (!th || !d.data) return;
  const cols = d.data.columns;
  const sortOf = (n) => { const i = d.sort.findIndex((s) => s.column === n); return i < 0 ? null : { ...d.sort[i], i }; };
  const vis = cols.filter((c) => !d.hidden.has(c.name));
  th.innerHTML = `<tr><th class="rn"></th>${vis.map((c) => {
    const s = sortOf(c.name), fk = fkOf(d, c.name);
    return `<th class="h ${s ? 'sorted' : ''}" data-act="dv-sort" data-col="${esc(c.name)}" title="${esc(c.name)} · ${esc(c.type)}${c.nullable ? '' : ' · NOT NULL'}${c.pk ? ' · primary key' : ''}${fk ? ` · references ${esc(fk.refTable)}(${esc(fk.refColumns.join(', '))})` : ''}\nClick to sort, Shift+click to add a sort column">
      <div class="th"><span class="cn">${c.pk ? ic('key', 'pk') : ''}${fk ? ic('link', 'fk') : ''}${esc(c.name)}</span><span class="si">${s ? ic(s.dir === 'desc' ? 'sortDown' : 'sortUp') + (d.sort.length > 1 ? `<sup>${s.i + 1}</sup>` : '') : ''}</span></div>
      <small>${esc(c.type)}</small></th>`;
  }).join('')}</tr>
  <tr class="frow"><th class="rn">${ic('filter')}</th>${vis.map((c) => `<th><input class="finput ${String(d.filters[c.name] || '').trim() ? 'on' : ''}" data-input="dv-filter" data-col="${esc(c.name)}" value="${esc(d.filters[c.name] || '')}" placeholder="Filter" spellcheck="false"></th>`).join('')}</tr>`;
}

const NUM_T = /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|year|bit)$/;
function cellHtml(v, c, r, ci) {
  const sel = S.dv.sel && S.dv.sel.r === r && S.dv.sel.c === ci ? ' sel' : '';
  if (v === null) return `<td class="null${sel}" data-r="${r}" data-c="${ci}">NULL</td>`;
  if (typeof v === 'object' && v.bin != null) return `<td class="bin${sel}" data-r="${r}" data-c="${ci}">(${fmtBytes(v.bin)} binary)</td>`;
  const s = typeof v === 'object' ? v.text + '…' : String(v);
  const short = s.length > 200 ? s.slice(0, 200) + '…' : s;
  const fk = fkOf(S.dv, c.name);
  const go = fk && fk.columns.length === 1 ? `<button class="fk-go" data-act="dv-follow" data-r="${r}" data-c="${ci}" title="Open the ${esc(fk.refTable)} row with ${esc(fk.refColumns[0])} = ${esc(short)}">${ic('arrowUpRight')}</button>` : '';
  return `<td class="${NUM_T.test(c.dataType) ? 'num' : ''}${fk ? ' fkc' : ''}${sel}" data-r="${r}" data-c="${ci}">${go}${esc(short.replace(/\s+/g, ' '))}</td>`;
}

function renderDataBody() {
  const d = S.dv;
  const grid = $('#dv-grid'); if (!grid) return;
  grid.classList.toggle('loading', d.loading);
  const msg = $('#dv-msg');
  if (d.error) {
    $('#dv-tbody').innerHTML = '';
    msg.innerHTML = `<div class="callout danger" style="margin:16px">${ic('alert')}<div>${esc(d.error)}</div></div>`;
  } else if (!d.data) {
    msg.innerHTML = '<div style="padding:12px">' + '<div class="skeleton"></div>'.repeat(8) + '</div>';
  } else {
    const { columns, rows, offset } = d.data;
    $('#dv-tbody').innerHTML = rows.map((row, ri) => `<tr><td class="rn">${fmtNum(offset + ri + 1)}</td>${row.map((v, ci) => (d.hidden.has(columns[ci].name) ? '' : cellHtml(v, columns[ci], ri, ci))).join('')}</tr>`).join('');
    msg.innerHTML = rows.length ? '' : `<div class="dv-none">${ic('search')}<b>No rows</b><span>${Object.values(d.filters).some((v) => String(v).trim()) || d.search.trim() ? 'Nothing matches your filters.' : 'This table is empty.'}</span></div>`;
  }
  renderPager(); renderDataStatus();
}

function renderPager() {
  const d = S.dv, el = $('#dv-pager'); if (!el) return;
  const x = d.data;
  const from = x && x.rows.length ? x.offset + 1 : 0, to = x ? x.offset + x.rows.length : 0;
  const total = x?.total;
  const atEnd = !x || (total != null ? to >= total : x.rows.length < x.limit);
  el.innerHTML = `
    <span class="range">${x ? `${fmtNum(from)}–${fmtNum(to)} of ${total == null ? 'many' : (x.approx ? '~' : '') + fmtNum(total)}` : '…'}</span>
    <button class="icon-btn" data-act="dv-page" data-to="first" title="First page" ${d.offset ? '' : 'disabled'}>${ic('chevsLeft')}</button>
    <button class="icon-btn" data-act="dv-page" data-to="prev" title="Previous page" ${d.offset ? '' : 'disabled'}>${ic('chevLeft')}</button>
    <button class="icon-btn" data-act="dv-page" data-to="next" title="Next page" ${atEnd ? 'disabled' : ''}>${ic('chev')}</button>
    <button class="icon-btn" data-act="dv-page" data-to="last" title="Last page" ${atEnd || total == null || x.approx ? 'disabled' : ''}>${ic('chevsRight')}</button>
    <select class="select sm" data-change="dv-limit" title="Rows per page">${[50, 100, 200, 500, 1000].map((n) => `<option value="${n}" ${n === d.limit ? 'selected' : ''}>${n} / page</option>`).join('')}</select>`;
}

function renderDataStatus() {
  const d = S.dv, el = $('#dv-status'); if (!el) return;
  const x = d.data;
  let left = '<span class="muted">Click a cell to inspect it, double-click to open the full value</span>';
  if (x && d.sel && x.rows[d.sel.r]) {
    const c = x.columns[d.sel.c], v = x.rows[d.sel.r][d.sel.c];
    left = `<b class="mono">${esc(c.name)}</b><span class="val mono">${v === null ? '<i>NULL</i>' : esc(cellText(v).slice(0, 300))}</span><button class="btn sm ghost" data-act="dv-copy">${ic('copy')}Copy</button><button class="btn sm ghost" data-act="dv-expand">${ic('maximize')}Open</button>`;
  }
  el.innerHTML = `<div class="left">${left}</div>${x ? `<div class="right"><span class="sql mono" title="${esc(x.sql)}" data-act="dv-copysql">${ic('code')}${esc(x.sql)}</span><span class="muted">${x.ms} ms</span></div>` : ''}`;
}

const cellText = (v) => (v === null ? 'NULL' : typeof v === 'object' ? (v.bin != null ? '0x' + v.hex + (v.bin > 48 ? '…' : '') : v.text) : String(v));

async function fetchData(d = S.dv) {
  if (!d.table) return;
  const seq = ++d.seq;
  const isActive = () => S.dv === d;
  d.loading = true; d.error = null;
  if (isActive()) { renderDataBody(); renderTabs(); }
  try {
    const res = await api.browse(d.connId, d.db, d.table, { filters: d.filters, search: d.search, sort: d.sort, offset: d.offset, limit: d.limit, meta: !d.refs });
    if (seq !== d.seq) return;
    const colsChanged = !d.data || d.data.columns.map((c) => c.name).join('\0') !== res.columns.map((c) => c.name).join('\0');
    const gotRefs = res.refs && !d.refs;
    if (res.refs) d.refs = res.refs;
    d.data = res; d.sel = null; d.scroll = null;
    if ((colsChanged || gotRefs) && isActive()) { renderDataHead(); renderSide(); }
    const g = $('#dv-grid'); if (g && isActive()) g.scrollTop = 0;
  } catch (e) {
    if (seq !== d.seq) return;
    d.error = e.message;
  }
  d.loading = false;
  if (!isActive()) return;
  renderDataBody(); renderTabs();
  const fi = $('#dv-finfo'); if (fi) fi.innerHTML = filterInfo();
}
const fetchDataSoon = () => { const d = S.dv; clearTimeout(dvTimer); dvTimer = setTimeout(() => { d.offset = 0; fetchData(d); }, 380); };

function openValue() {
  const d = S.dv, x = d.data; if (!x || !d.sel) return;
  const c = x.columns[d.sel.c], v = x.rows[d.sel.r][d.sel.c];
  showValue(c.name, `${c.type} · row ${fmtNum(x.offset + d.sel.r + 1)}`, v);
}
function showValue(name, sub, v) {
  let text = cellText(v);
  if (typeof text === 'string' && /^[\[{]/.test(text.trim())) { try { text = JSON.stringify(JSON.parse(text), null, 2); } catch {} }
  const dlgEl = $('#valDialog');
  dlgEl.innerHTML = `<div class="modal val-modal">
    <div class="modal-head"><div><h3 class="mono">${esc(name)}</h3><p>${esc(sub)}${v && typeof v === 'object' && v.len ? ` · showing first 5,000 of ${fmtNum(v.len)} characters` : ''}${v && typeof v === 'object' && v.bin > 48 ? ` · first 48 of ${fmtNum(v.bin)} bytes` : ''}</p></div>
      <button class="icon-btn" data-act="val-close">${ic('x')}</button></div>
    <div class="modal-body"><textarea class="input mono val-text" readonly>${esc(text)}</textarea></div>
    <div class="modal-foot"><div class="spacer"></div><button class="btn" data-act="val-copy">${ic('copy')}Copy</button><button class="btn primary" data-act="val-close">Close</button></div></div>`;
  dlgEl.showModal();
}

/* ================= SQL EDITOR ================= */
const SQL_KW = new Set('SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN EXISTS AS ON JOIN LEFT RIGHT INNER OUTER CROSS FULL NATURAL USING GROUP BY ORDER HAVING LIMIT OFFSET UNION ALL DISTINCT INSERT INTO VALUES VALUE UPDATE SET DELETE REPLACE IGNORE CREATE ALTER DROP TRUNCATE RENAME TABLE TABLES DATABASE DATABASES SCHEMA INDEX VIEW TRIGGER PROCEDURE FUNCTION EVENT IF THEN ELSE ELSEIF END CASE WHEN BEGIN DECLARE RETURN RETURNS PRIMARY KEY FOREIGN REFERENCES UNIQUE DEFAULT AUTO_INCREMENT CONSTRAINT CHECK COLUMN ADD MODIFY CHANGE AFTER FIRST ASC DESC SHOW DESCRIBE EXPLAIN USE WITH RECURSIVE WINDOW OVER PARTITION ROWS RANGE LOCK UNLOCK GRANT REVOKE START TRANSACTION COMMIT ROLLBACK SAVEPOINT CALL DO DUPLICATE TRUE FALSE INTERVAL CHARACTER COLLATE ENGINE CHARSET UNSIGNED ZEROFILL COMMENT PROCESSLIST STATUS VARIABLES GLOBAL SESSION LOCAL DELIMITER FOR EACH ROW NEW OLD SQL_CALC_FOUND_ROWS STRAIGHT_JOIN HIGH_PRIORITY LOW_PRIORITY SEPARATOR INT INTEGER BIGINT SMALLINT TINYINT MEDIUMINT DECIMAL NUMERIC FLOAT DOUBLE CHAR VARCHAR TEXT MEDIUMTEXT LONGTEXT TINYTEXT BLOB LONGBLOB DATE DATETIME TIMESTAMP TIME YEAR JSON ENUM BOOLEAN BOOL BIT BINARY VARBINARY'.split(' '));
function hlSql(src) {
  const re = /(--[^\n]*|#[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|('(?:[^'\\]|\\.|'')*'?|"(?:[^"\\]|\\.|"")*"?)|(`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_$]*)(\s*\()?|(@@?[\w.$]+)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    if (m[1]) out += `<span class="h-c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="h-s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="h-i">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="h-n">${esc(m[4])}</span>`;
    else if (m[5]) {
      const up = m[5].toUpperCase();
      out += SQL_KW.has(up) ? `<span class="h-k">${esc(m[5])}</span>` : m[6] ? `<span class="h-f">${esc(m[5])}</span>` : esc(m[5]);
      if (m[6]) out += esc(m[6]);
    } else if (m[7]) out += `<span class="h-v">${esc(m[7])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last)) + '\n ';
}

const uid = () => 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function newQuery(connId, db, sql = '', title = null, key = null) {
  const n = Math.max(0, ...S.tabs.filter((t) => t.kind === 'query').map((t) => Number((t.title.match(/\d+$/) || [0])[0]))) + 1;
  return { kind: 'query', key: key || uid(), title: title || `Query ${n}`, sql, connId, db, table: null, filters: {}, search: '', sort: [], data: null, loading: false, res: null, resTab: 0, coe: false, split: store.get('q.split', 46), sel: null, qsort: null, dbList: null, seq: 0 };
}
function openQuery(connId, db, sql = '') {
  if (!connId) { const c = S.conns.find((x) => T(x.id).open) || S.conns[0]; if (!c) return toast('Add a connection first'); connId = c.id; }
  const tab = newQuery(connId, db || null, sql || (db ? '' : ''));
  let at = -1;
  S.tabs.forEach((t, i) => { if (sameGroup(t, tab)) at = i; });
  if (at < 0) S.tabs.push(tab); else S.tabs.splice(at + 1, 0, tab);
  activateTab(tab);
  setTimeout(() => $('#q-ta')?.focus(), 30);
}

function renderQuery() {
  const d = S.dv, el = $('#view-data');
  const conn = connById(d.connId);
  el.innerHTML = `<div class="dv">
    <div class="dv-tabs" id="dv-tabs"></div>
    <div class="q-toolbar" id="q-toolbar"></div>
    <div class="q-split" id="q-split">
      <div class="q-editor" id="q-editor" style="height:${d.split}%">
        <div class="q-gutter" id="q-gutter"></div>
        <pre class="q-hl" id="q-hl" aria-hidden="true"></pre>
        <textarea class="q-ta" id="q-ta" spellcheck="false" autocomplete="off" placeholder="Write SQL here.  Ctrl+Enter runs it (or just the selected part).\n\nSELECT * FROM ${esc(d.db ? 'your_table' : 'db.your_table')} LIMIT 100;"></textarea>
      </div>
      <div class="q-resizer" id="q-resizer" title="Drag to resize"></div>
      <div class="q-results" id="q-results"></div>
    </div>
  </div>`;
  const ta = $('#q-ta');
  ta.value = d.sql;
  syncEditor();
  ta.addEventListener('input', () => { d.sql = ta.value; syncEditor(); saveTabsSoon(); });
  ta.addEventListener('scroll', () => { $('#q-hl').scrollTop = ta.scrollTop; $('#q-hl').scrollLeft = ta.scrollLeft; $('#q-gutter').scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', editorKeys);
  ['keyup', 'click', 'select'].forEach((ev) => ta.addEventListener(ev, () => renderQueryToolbar(true)));
  $('#q-resizer').addEventListener('mousedown', startResize);
  renderTabs(); renderQueryToolbar(); renderQueryResults();
  if (!d.dbList) loadQueryDbs(d);
  if (d.caret) { ta.focus(); ta.setSelectionRange(d.caret[0], d.caret[1]); ta.scrollTop = d.caret[2] || 0; }
}

async function loadQueryDbs(d) {
  const t = S.tree[d.connId];
  if (Array.isArray(t?.dbs)) d.dbList = t.dbs.map((x) => x.name);
  else { try { d.dbList = (await api.databases(d.connId)).map((x) => x.name); } catch { d.dbList = []; } }
  if (S.dv === d) renderQueryToolbar();
}

function syncEditor() {
  const ta = $('#q-ta'); if (!ta) return;
  $('#q-hl').innerHTML = hlSql(ta.value);
  const lines = ta.value.split('\n').length;
  const g = $('#q-gutter');
  if (g.childElementCount !== lines + 1) g.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('') + '<div>&nbsp;</div>';
  g.scrollTop = ta.scrollTop;
}

function renderQueryToolbar(selOnly) {
  const d = S.dv, el = $('#q-toolbar'); if (!el || d.kind !== 'query') return;
  const ta = $('#q-ta');
  const hasSel = ta && ta.selectionEnd > ta.selectionStart && ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
  if (selOnly) { const b = $('#q-run-label'); if (b) b.textContent = hasSel ? 'Run selection' : 'Run'; return; }
  const conn = connById(d.connId);
  const dbs = d.dbList || [];
  el.innerHTML = `
    ${d.loading ? `<button class="btn danger sm" data-act="q-stop">${ic('ban')}Stop</button><span class="q-running">${ic('loader', 'spin')}Running…</span>`
      : `<button class="btn primary sm" data-act="q-run" title="Ctrl+Enter or F5">${ic('play')}<span id="q-run-label">${hasSel ? 'Run selection' : 'Run'}</span></button>`}
    <div class="q-ctx"><span class="dot" style="color:${esc(conn?.color || '#888')};width:8px;height:8px"></span><span>${esc(conn?.name || '?')}</span>
      <select class="select sm" data-change="q-db" title="Database the query runs in"><option value="" ${!d.db ? 'selected' : ''}>(no database)</option>${dbs.map((n) => `<option ${n === d.db ? 'selected' : ''}>${esc(n)}</option>`).join('')}${d.db && !dbs.includes(d.db) ? `<option selected>${esc(d.db)}</option>` : ''}</select></div>
    <div class="spacer"></div>
    <label class="check-inline" style="font-size:12px" title="Run the remaining statements after an error">${sw('data-change="q-coe"', d.coe)}<span>Continue on error</span></label>
    <span class="q-keys"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> run · <kbd>Ctrl</kbd>+<kbd>/</kbd> comment</span>`;
}

function editorKeys(e) {
  const ta = e.target, d = S.dv;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' || e.key === 'F5') { e.preventDefault(); runQuery(); return; }
  if (e.key === 'Tab' && !e.ctrlKey) {
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b, value: v } = ta;
    if (a === b && !e.shiftKey) { document.execCommand('insertText', false, '  '); return; }
    const ls = v.lastIndexOf('\n', a - 1) + 1, le = b > a && v[b - 1] === '\n' ? b - 1 : b;
    const block = v.slice(ls, le);
    const next = e.shiftKey ? block.replace(/^ {1,2}/gm, '') : block.replace(/^/gm, '  ');
    ta.setSelectionRange(ls, le); document.execCommand('insertText', false, next); ta.setSelectionRange(ls, ls + next.length);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b, value: v } = ta;
    const ls = v.lastIndexOf('\n', a - 1) + 1; let le = v.indexOf('\n', b > a && v[b - 1] === '\n' ? b - 1 : b); if (le < 0) le = v.length;
    const block = v.slice(ls, le);
    const allC = block.split('\n').every((l) => !l.trim() || /^\s*-- ?/.test(l));
    const next = allC ? block.replace(/^(\s*)-- ?/gm, '$1') : block.replace(/^(?=.)/gm, '-- ');
    ta.setSelectionRange(ls, le); document.execCommand('insertText', false, next); ta.setSelectionRange(ls, ls + next.length);
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    const { selectionStart: a, value: v } = ta;
    const ls = v.lastIndexOf('\n', a - 1) + 1;
    const indent = (v.slice(ls, a).match(/^\s*/) || [''])[0];
    if (indent) { e.preventDefault(); document.execCommand('insertText', false, '\n' + indent); }
  }
}

function startResize(e) {
  e.preventDefault();
  const box = $('#q-split').getBoundingClientRect(), d = S.dv;
  const move = (ev) => { d.split = Math.min(85, Math.max(12, ((ev.clientY - box.top) / box.height) * 100)); $('#q-editor').style.height = d.split + '%'; };
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); store.set('q.split', d.split); document.body.classList.remove('resizing'); };
  document.body.classList.add('resizing');
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
}

async function runQuery() {
  const d = S.dv; if (d.kind !== 'query' || d.loading) return;
  const ta = $('#q-ta');
  const a = ta.selectionStart, b = ta.selectionEnd;
  const useSel = b > a && ta.value.slice(a, b).trim();
  const text = useSel ? ta.value.slice(a, b) : ta.value;
  if (!text.trim()) return toast('Nothing to run');
  const lineOffset = useSel ? ta.value.slice(0, a).split('\n').length - 1 : 0;
  const risky = await api.sql.risky(text).catch(() => []);
  if (risky.length) {
    const conn = connById(d.connId);
    const ok = await api.confirm({ title: 'Run SQL', message: `This changes or deletes data on ${conn?.name || 'the server'}${d.db ? ` / ${d.db}` : ''}. Run it?`, detail: risky.slice(0, 6).join('\n') + (risky.length > 6 ? `\n…and ${risky.length - 6} more` : ''), ok: 'Run' });
    if (!ok) return;
  }
  d.caret = [a, b, ta.scrollTop];
  const seq = ++d.seq;
  d.loading = true; d.lineOffset = lineOffset; d.startedAt = Date.now();
  renderQueryToolbar(); renderTabs(); renderQueryResults();
  try {
    const res = await api.sql.run(d.key, d.connId, d.db, text, { continueOnError: d.coe });
    if (seq !== d.seq) return;
    d.res = res; d.sel = null; d.qsort = null;
    if (res.db !== undefined && res.db !== d.db) { d.db = res.db; saveTabs(); }
    const sets = resultSets(d), err = res.results.some((r) => r.error);
    d.resTab = err || !sets.length ? 'msg' : 0;
  } catch (e) {
    if (seq !== d.seq) return;
    d.res = { fatal: e.message, results: [] }; d.resTab = 'msg';
  }
  d.loading = false;
  if (S.dv !== d) { renderTabs(); return; }
  renderQueryToolbar(); renderTabs(); renderQueryResults();
  if (d.res.results?.some((r) => r.error)) { const r = d.res.results.find((x) => x.error); toast(`Error on line ${r.line + d.lineOffset}: ${r.error.message}`); }
}
const resultSets = (d) => (d.res?.results || []).flatMap((r) => (r.sets || []).map((set) => ({ ...set, stmt: r })));

function renderQueryResults() {
  const d = S.dv, el = $('#q-results'); if (!el || d.kind !== 'query') return;
  if (d.loading) { el.innerHTML = `<div class="q-wait">${ic('loader', 'spin')}<span>Running… <span id="q-elapsed"></span></span></div>`; tickElapsed(d); return; }
  if (!d.res) { el.innerHTML = `<div class="q-wait muted">${ic('play')}<span>Run a query to see results here</span></div>`; return; }
  const sets = resultSets(d), res = d.res;
  const nErr = res.results.filter((r) => r.error).length;
  const tabs = sets.map((s, i) => `<button class="rtab ${d.resTab === i ? 'on' : ''}" data-act="q-rtab" data-i="${i}">${ic('table')}Result ${i + 1} <small>${fmtNum(s.total)} row${s.total === 1 ? '' : 's'}</small></button>`).join('')
    + `<button class="rtab ${d.resTab === 'msg' ? 'on' : ''} ${nErr ? 'bad' : ''}" data-act="q-rtab" data-i="msg">${ic(nErr ? 'alert' : 'terminal')}Messages <small>${res.results.length}</small></button>`;
  let body;
  if (d.resTab === 'msg' || !sets[d.resTab]) body = messagesHtml(d);
  else body = resultGridHtml(d, sets[d.resTab]);
  const s = sets[d.resTab];
  el.innerHTML = `<div class="rtabs">${tabs}<div class="spacer"></div><span class="muted rt-meta">${res.fatal ? '' : `${fmtDur((res.ms || 0) / 1000)}${res.cancelled ? ' · stopped' : ''}`}</span>
      ${s ? `<button class="btn sm ghost" data-act="q-copy-tsv" title="Copy this result as tab-separated text (paste into a spreadsheet)">${ic('copy')}Copy all</button>` : ''}</div>
    <div class="rbody" id="q-rbody">${body}</div>
    <div class="dv-status q-status" id="q-status">${qStatusHtml(d)}</div>`;
}
function tickElapsed(d) {
  const t = () => { const e = $('#q-elapsed'); if (!e || !d.loading || S.dv !== d) return; e.textContent = fmtDur((Date.now() - d.startedAt) / 1000); setTimeout(t, 200); };
  t();
}

function messagesHtml(d) {
  const res = d.res;
  if (res.fatal) return `<div class="callout danger" style="margin:14px">${ic('alert')}<div>${esc(res.fatal)}</div></div>`;
  if (!res.results.length) return `<div class="q-wait muted">No statements found</div>`;
  return `<div class="msgs">${res.results.map((r) => {
    const line = r.line + (d.lineOffset || 0);
    let state, text;
    if (r.skipped) { state = 'skip'; text = res.cancelled ? 'Not run (stopped)' : 'Not run (an earlier statement failed)'; }
    else if (r.error) { state = 'err'; text = `<b>ERROR ${r.error.code || ''}</b> ${esc(r.error.message)}`; }
    else if (r.sets?.length) { state = 'ok'; text = r.sets.map((s) => `${fmtNum(s.total)} row${s.total === 1 ? '' : 's'} returned${s.total > s.rows.length ? ` (showing first ${fmtNum(s.rows.length)})` : ''}`).join(', '); }
    else { state = 'ok'; text = r.ok ? `${fmtNum(r.ok.affectedRows)} row${r.ok.affectedRows === 1 ? '' : 's'} affected${r.ok.insertId ? ` · insert id ${r.ok.insertId}` : ''}${r.ok.warnings ? ` · ${r.ok.warnings} warning(s)` : ''}` : 'OK'; }
    return `<div class="msg ${state}" data-act="q-goline" data-line="${line}" title="Jump to line ${line}">
      <span class="mi">${ic(state === 'ok' ? 'check' : state === 'err' ? 'x' : 'ban')}</span><span class="ml">line ${line}</span>
      <div class="mt-sql"><code>${esc(r.sql.replace(/\s+/g, ' ').slice(0, 160))}</code><div class="mt-res">${text}</div></div>
      <span class="ms">${r.ms != null ? fmtDur(r.ms / 1000) : ''}</span></div>`;
  }).join('')}</div>`;
}

function sortedRows(d, set) {
  const idx = set.rows.map((_, i) => i);
  if (!d.qsort) return idx;
  const { c, dir } = d.qsort, num = set.columns[c]?.num;
  const key = (v) => (v === null ? null : typeof v === 'object' ? cellText(v) : v);
  return idx.sort((x, y) => {
    const a = key(set.rows[x][c]), b = key(set.rows[y][c]);
    if (a === null) return b === null ? 0 : 1; if (b === null) return -1;
    const r = num ? Number(a) - Number(b) : String(a).localeCompare(String(b), undefined, { numeric: true });
    return dir === 'desc' ? -r : r;
  });
}
function resultGridHtml(d, set) {
  if (!set.columns.length) return '<div class="q-wait muted">No columns</div>';
  const order = sortedRows(d, set);
  const head = set.columns.map((c, i) => `<th class="h ${d.qsort?.c === i ? 'sorted' : ''}" data-act="q-sort" data-c="${i}" title="${esc(c.table ? c.table + '.' : '')}${esc(c.name)} · ${esc(c.dataType)}"><div class="th"><span class="cn">${esc(c.name)}</span><span class="si">${d.qsort?.c === i ? ic(d.qsort.dir === 'desc' ? 'sortDown' : 'sortUp') : ''}</span></div><small>${esc(c.dataType)}</small></th>`).join('');
  const rows = order.map((ri, k) => `<tr><td class="rn">${k + 1}</td>${set.rows[ri].map((v, ci) => {
    const sel = d.sel && d.sel.r === ri && d.sel.c === ci ? ' sel' : '';
    if (v === null) return `<td class="null${sel}" data-qr="${ri}" data-qc="${ci}">NULL</td>`;
    if (typeof v === 'object' && v.bin != null) return `<td class="bin${sel}" data-qr="${ri}" data-qc="${ci}">(${fmtBytes(v.bin)} binary)</td>`;
    const s = typeof v === 'object' ? v.text + '…' : String(v);
    return `<td class="${set.columns[ci].num ? 'num' : ''}${sel}" data-qr="${ri}" data-qc="${ci}">${esc((s.length > 200 ? s.slice(0, 200) + '…' : s).replace(/\s+/g, ' '))}</td>`;
  }).join('')}</tr>`).join('');
  return `<table class="grid"><thead><tr><th class="rn"></th>${head}</tr></thead><tbody id="q-tbody">${rows}</tbody></table>${set.total > set.rows.length ? `<div class="q-capped">${ic('info')}Showing the first ${fmtNum(set.rows.length)} of ${fmtNum(set.total)} rows. Add a LIMIT or a WHERE to narrow it down.</div>` : ''}`;
}
function qStatusHtml(d) {
  const sets = resultSets(d), set = typeof d.resTab === 'number' ? sets[d.resTab] : null;
  if (set && d.sel && set.rows[d.sel.r]) {
    const c = set.columns[d.sel.c], v = set.rows[d.sel.r][d.sel.c];
    return `<div class="left"><b class="mono">${esc(c.name)}</b><span class="val mono">${v === null ? '<i>NULL</i>' : esc(cellText(v).slice(0, 300))}</span><button class="btn sm ghost" data-act="q-copy">${ic('copy')}Copy</button><button class="btn sm ghost" data-act="q-expand">${ic('maximize')}Open</button></div>`;
  }
  return `<div class="left"><span class="muted">${set ? 'Click a cell to inspect it, double-click to open the full value, click a header to sort' : d.res ? 'Click a message to jump to its line' : ''}</span></div>`;
}

/* ================= THEMES ================= */
const TH_GROUPS = [['all', 'All'], ['gradient', 'Gradient'], ['solid', 'Solid'], ['mixed', 'Mixed'], ['light', 'Light'], ['neon', 'Neon'], ['pastel', 'Pastel'], ['mono', 'Mono'], ['custom', 'My themes']];
const TH = { group: 'all', name: '' };
const customThemes = () => store.get('themes.custom', []);
const allThemes = () => [...Theme.PRESETS, ...customThemes()];
let thRaf = 0;
function applyTheme(t, save = true) { Theme.apply(t, save); }

function openTheme() {
  TH.name = '';
  $('#themeDialog').innerHTML = `<div class="modal theme-modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px">${ic('palette')}</div>
      <div><h3>Theme</h3><p>Pick a preset or build your own palette. Changes apply instantly to the whole app.</p></div>
      <button class="icon-btn" data-act="th-close">${ic('x')}</button></div>
    <div class="theme-body">
      <div class="theme-presets"><div class="th-groups" id="th-groups"></div><div class="th-grid" id="th-grid"></div></div>
      <aside class="theme-edit" id="th-edit"></aside>
    </div></div>`;
  renderThemeGroups(); renderThemeGrid(); renderThemeEditor();
  $('#themeDialog').showModal();
}
function renderThemeGroups() {
  const n = customThemes().length;
  $('#th-groups').innerHTML = TH_GROUPS.map(([g, l]) => `<button class="th-chip ${TH.group === g ? 'on' : ''}" data-act="th-group" data-g="${g}">${l}${g === 'custom' && n ? ` <small>${n}</small>` : g !== 'all' && g !== 'custom' ? ` <small>${Theme.PRESETS.filter((t) => t.group === g).length}</small>` : ''}</button>`).join('');
}
function themeCard(t) {
  const v = Theme.derive(t), cur = Theme.current;
  const on = cur && cur.id === t.id;
  return `<div class="th-card ${on ? 'on' : ''}" data-act="th-pick" data-id="${esc(t.id)}" title="${esc(t.name)}">
    <div class="th-prev" style="background:${v['--bg']};${t.glow ? `background-image:${v['--bg-grad']};` : ''}color:${v['--text']}">
      <div class="tp-side" style="background:${v['--sidebar']};border-right:1px solid ${v['--border']}"><i style="background:${v['--accent-grad']}"></i><b style="background:${v['--surface-3']}"></b><b style="background:${v['--surface-2']}"></b><b style="background:${v['--surface-2']}"></b></div>
      <div class="tp-main"><div class="tp-card" style="background:${v['--surface']};border:1px solid ${v['--border']}"><span style="background:${v['--text']}"></span><span style="background:${v['--muted']};width:60%"></span><em style="background:${v['--accent-grad']}"></em></div>
        <div class="tp-dots"><i style="background:${v['--accent']}"></i><i style="background:${v['--accent-2']}"></i><i style="background:${v['--success']}"></i></div></div>
    </div>
    <div class="th-name"><span>${esc(t.name)}</span>${t.group === 'custom' ? `<button class="icon-btn" data-act="th-del" data-id="${esc(t.id)}" title="Delete">${ic('trash')}</button>` : `<small>${t.accent2 ? 'gradient' : 'solid'} · ${t.mode}</small>`}</div>
  </div>`;
}
function renderThemeGrid() {
  const list = TH.group === 'all' ? allThemes() : TH.group === 'custom' ? customThemes() : Theme.PRESETS.filter((t) => t.group === TH.group);
  $('#th-grid').innerHTML = list.length ? list.map(themeCard).join('') : `<div class="th-empty">${ic('palette')}<b>No custom themes yet</b><span>Tweak the colors on the right, name it, and press Save.</span></div>`;
}
const TH_FIELDS = [['bg', 'Background'], ['text', 'Text'], ['accent', 'Accent'], ['accent2', 'Second accent'], ['mid', 'Middle color']];
function renderThemeEditor() {
  const t = Theme.current, v = Theme.derive(t);
  const val = (k) => (k === 'text' ? t.text || v['--text'] : k === 'mid' ? t.mid || Theme.mix(t.accent, t.accent2 || t.accent, 0.5) : t[k]) || '#000000';
  const row = (k, label, extra = '') => `<div class="th-row ${extra}"><label>${label}</label><div class="th-color"><input type="color" value="${esc(val(k))}" data-input="th-color" data-k="${k}"><input class="input mono" value="${esc(val(k))}" data-change="th-hex" data-k="${k}" spellcheck="false" maxlength="7"></div></div>`;
  $('#th-edit').innerHTML = `
    <div class="th-edit-head">Customize <span class="muted">${esc(t.name || 'Custom')}</span></div>
    <div class="seg th-mode"><button class="${t.mode !== 'light' ? 'on' : ''}" data-act="th-mode" data-m="dark">${ic('moon')}Dark</button><button class="${t.mode === 'light' ? 'on' : ''}" data-act="th-mode" data-m="light">${ic('sun')}Light</button></div>
    <div class="th-swatch" style="background:${v['--accent-grad']};color:${v['--on-accent']}">${ic('palette')}Button preview</div>
    ${row('bg', 'Background')}
    ${row('text', 'Text')}
    ${row('accent', 'Accent')}
    <label class="opt th-opt"><div class="txt"><b>Gradient accent</b><small>Blend the accent into a second color</small></div>${sw('data-change="th-grad"', !!t.accent2)}</label>
    ${t.accent2 ? row('accent2', 'Second accent') + `<label class="opt th-opt"><div class="txt"><b>Three-color gradient</b><small>Pick the middle color yourself</small></div>${sw('data-change="th-mid"', !!t.mid)}</label>` + (t.mid ? row('mid', 'Middle color') : '') : ''}
    <label class="opt th-opt"><div class="txt"><b>Background glow</b><small>Soft accent light in the corners</small></div>${sw('data-change="th-glow"', !!t.glow)}</label>
    <div class="th-save"><input class="input" placeholder="Name your theme" value="${esc(TH.name)}" data-input="th-name" spellcheck="false"><button class="btn primary sm" data-act="th-save">${ic('check')}Save</button></div>
    <div class="th-foot"><button class="btn sm ghost" data-act="th-random" title="Random palette">${ic('wand')}Surprise me</button><button class="btn sm ghost" data-act="th-reset">${ic('refresh')}Default</button></div>`;
}
function editTheme(patch, rerender = true) {
  const t = { ...Theme.current, ...patch };
  if (!String(t.id).startsWith('c-')) { t.id = 'live'; t.name = 'Custom'; t.group = 'custom'; }
  applyTheme(t);
  if (rerender) { renderThemeEditor(); renderThemeGrid(); }
}

/* ================= JOB ================= */
const pct = (p) => (p && p.total ? Math.min(100, (100 * p.bytes) / p.total) : 0);
const RING_C = 2 * Math.PI * 88;

function renderJob() {
  const j = S.job, el = $('#view-job');
  if (!j) { el.innerHTML = `<div class="empty-state"><div class="dz-icon">${ic('zap')}</div><b>No job yet</b>Start a restore or CSV import.</div>`; return; }
  const running = j.status === 'running';
  const statusLabel = { running: 'Running', success: 'Completed', warning: 'Completed with errors', failed: 'Failed', cancelled: 'Cancelled' }[j.status];
  const isCsv = j.kind === 'csv', isExport = j.kind === 'export', isFetch = j.kind === 'fetch';
  const res = j.result;
  let resultChips = '';
  if (res && !running) {
    if (isFetch) {
      resultChips = j.status === 'success' ? `<span class="chip ok">${ic('check')}${fmtBytes(res.fileSize)} saved</span><span class="chip mono" title="${esc(j.file)}">${esc(j.file.replace(/^\/home\/[^/]+/, '~'))}</span>` : `<span class="chip warn">Nothing was saved. The partial download was removed.</span>`;
    } else if (isExport) {
      if (j.status === 'success') resultChips = [`${ic('file')}${fmtBytes(res.fileSize)} file`, `${ic('table')}${plural(res.tables, 'table')}`, j.payload.gzip && res.fileSize ? `${ic('zap')}${(res.bytes / res.fileSize).toFixed(1)}× smaller than raw SQL (${fmtBytes(res.bytes)})` : ''].filter(Boolean).map((x) => `<span class="chip">${x}</span>`).join('');
      else resultChips = `<span class="chip warn">No file was written. The partial dump was removed.</span>`;
    } else if (isCsv) resultChips = `<span class="chip ok">${ic('check')}${fmtNum(res.rows)} rows imported</span>`;
    else if (res.stats) {
      const s = res.stats;
      resultChips = (j.status === 'success' ? '' : `<span class="chip warn">Partial result in ${esc(j.database)}</span>`) + [`${ic('table')}${plural(s.tables - s.views, 'table')}`, `${ic('db')}~${fmtCompact(s.rows)} rows`, `${fmtBytes(s.size)} on disk`, s.views && plural(s.views, 'view'), s.routines && plural(s.routines, 'routine'), s.triggers && plural(s.triggers, 'trigger')].filter(Boolean).map((x) => `<span class="chip">${x}</span>`).join('');
    }
  }
  el.innerHTML = `
    <div class="job-wrap">
      <div class="card">
        <div class="job-hero">
          <div class="ring ${running ? '' : j.status}" id="j-ring">
            <svg viewBox="0 0 200 200"><circle class="track" cx="100" cy="100" r="88"/><circle class="bar" id="j-bar" cx="100" cy="100" r="88" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - (running ? pct(j.progress) : j.status === 'success' || j.status === 'warning' ? 100 : pct(j.progress)) / 100)}"/></svg>
            <div class="center">${running
              ? `<div><div class="pct" id="j-pct">0<small>%</small></div><div class="sub" id="j-sub"></div></div>`
              : `<div class="big-ico">${ic(j.status === 'success' ? 'check' : j.status === 'warning' ? 'alert' : j.status === 'cancelled' ? 'ban' : 'x')}</div>`}</div>
          </div>
          <div style="min-width:0">
            <div class="job-title"><h2>${isFetch ? 'Fetching from production' : isExport ? 'Exporting database' : isCsv ? 'Importing CSV' : 'Restoring dump'}</h2><span class="status-pill ${j.status}">${running ? '<span class="pulse"></span>' : ''}${statusLabel}</span></div>
            ${isFetch ? `<div class="job-route">${ic('server')}<span class="mono">${esc(j.remote)}</span>${ic('arrow')}${ic('folder')}<span class="mono">${esc(j.folder.replace(/^\/home\/[^/]+/, '~'))}</span></div>` : isExport ? `<div class="job-route"><span class="dot" style="color:${esc(j.conn.color)};width:8px;height:8px"></span>${esc(j.conn.name)}<span class="mono" style="color:var(--accent)">/ ${esc(j.database)}</span>${ic('arrow')}${ic('file')}<span class="mono">${esc(j.title)}</span></div>` : `<div class="job-route">${ic(isCsv ? 'sheet' : 'file')}<span class="mono">${esc(j.title)}</span>${ic('arrow')}<span class="dot" style="color:${esc(j.conn.color)};width:8px;height:8px"></span>${esc(j.conn.name)}<span class="mono" style="color:var(--accent)">/ ${esc(j.database)}${isCsv ? '.' + esc(j.table) : ''}</span></div>`}
            <div class="stats">
              <div class="stat"><span>Speed</span><b id="j-rate">—</b></div>
              <div class="stat"><span>Elapsed</span><b id="j-elapsed">—</b></div>
              <div class="stat"><span>${running ? 'Remaining' : isExport || isFetch ? 'File size' : 'Processed'}</span><b id="j-eta">—</b></div>
              <div class="stat"><span>${isFetch ? 'Downloaded' : isCsv ? 'Rows' : 'Tables'}</span><b id="j-count">—</b></div>
            </div>
            ${running ? `<div class="now" id="j-now"></div>` : resultChips ? `<div class="result-grid mt">${resultChips}</div>` : ''}
            <div class="job-actions">
              ${running ? `<button class="btn danger" data-act="cancel-job">${ic('ban')}Cancel</button>` : isFetch ? (j.status === 'success'
                ? `<button class="btn primary" data-act="job-quick-restore">${ic('rocket')}Restore it now</button><button class="btn" data-act="nav" data-view="quick:${esc(j.quick)}">Back to ${esc(presetById(j.quick)?.name || 'Quick Restore')}</button><button class="btn ghost" data-act="show-file">${ic('folder')}Show in folder</button>`
                : `<button class="btn primary" data-act="job-scp-retry">${ic('retry')}Change &amp; retry</button><button class="btn" data-act="nav" data-view="quick:${esc(j.quick)}">Back to ${esc(presetById(j.quick)?.name || 'Quick Restore')}</button>`) : `
                ${j.status !== 'success' ? `<button class="btn primary" data-act="job-adjust">${ic('wand')}Adjust options &amp; retry</button>` : `<button class="btn primary" data-act="job-new">${ic(j.quick ? 'rocket' : 'plus')}${j.quick ? `Back to ${esc(presetById(j.quick)?.name || 'Quick Restore')}` : isExport ? 'Export another' : isCsv ? 'Import another' : 'Restore another'}</button>`}
                ${isExport && j.status === 'success' ? `<button class="btn" data-act="show-file">${ic('folder')}Show in folder</button><button class="btn ghost" data-act="job-restore-file" title="Load this dump in the Restore screen">${ic('restore')}Restore it somewhere</button>` : `<button class="btn" data-act="nav" data-view="history">${ic('history')}History</button>
                ${isExport ? '' : `<button class="btn ghost" data-act="show-file">${ic('folder')}Show file</button>`}`}`}
            </div>
          </div>
        </div>
      </div>
      <div id="j-errors"></div>
      <div class="card console">
        <div class="console-head"><h4>${ic('terminal')}Activity log</h4><span class="chip ${j.errors.length ? 'danger' : ''}" id="j-errcount">${j.errors.length} error${j.errors.length === 1 ? '' : 's'}</span>
          <div class="right"><button class="btn sm ghost" data-act="copy-log">${ic('copy')}Copy</button></div></div>
        <div class="log" id="j-log"></div>
      </div>
    </div>`;
  const log = $('#j-log');
  log.innerHTML = j.logs.map(logHtml).join('');
  log.scrollTop = log.scrollHeight;
  renderJobErrors();
  updateJob();
}

function logHtml(l) {
  const hint = l.extra?.hint ? `<div class="log-hint">${ic('wand')}<span>${esc(l.extra.hint)}</span></div>` : '';
  return `<div class="log-line ${l.level}"><time>${clock(l.t)}</time><span class="lvl">${l.level === 'success' ? 'done' : l.level}</span><span class="msg">${esc(l.message)}</span></div>${hint}`;
}

function renderJobErrors() {
  const j = S.job, el = $('#j-errors'); if (!el) return;
  if (j.status === 'running' || !j.errors.length) { el.innerHTML = ''; return; }
  const top = j.errors.slice(0, 8);
  el.innerHTML = `<div class="card errors-card">
    <div class="console-head"><h4 style="color:var(--danger)">${ic('alert')}${j.errors.length} error${j.errors.length > 1 ? 's' : ''}${j.errors.length > 8 ? ' (showing first 8)' : ''}</h4></div>
    ${top.map((e) => `<div class="err-item"><div class="top">${e.code ? `<code>ERROR ${e.code}</code>` : ''}${e.line ? `<small>line ${fmtNum(e.line)}</small>` : ''}</div><p>${esc(e.message)}</p>
      ${e.hint ? `<div class="callout warn" style="margin-top:8px">${ic('wand')}<div>${esc(e.hint)}</div></div>` : ''}</div>`).join('')}
  </div>`;
}

function updateJob() {
  const j = S.job; if (!j || S.view !== 'job') return;
  const p = j.progress || {};
  const running = j.status === 'running';
  const P = pct(p);
  if (running) {
    const bar = $('#j-bar'); if (bar) bar.style.strokeDashoffset = RING_C * (1 - P / 100);
    const pe = $('#j-pct'); if (pe) pe.innerHTML = `${Math.floor(P)}<small>%</small>`;
    const sub = $('#j-sub'); if (sub) sub.textContent = j.kind === 'export' ? `${fmtBytes(p.written)} written` : `${fmtBytes(p.bytes)} of ${fmtBytes(p.total)}`;
    const now = $('#j-now');
    if (now) now.innerHTML = j.kind === 'fetch'
      ? `<span class="pulse-dot"></span>Downloading <code>${esc(j.title)}</code>${p.total <= 1 ? ' (size unknown)' : ''}`
      : j.kind === 'export'
      ? (p.table ? `<span class="pulse-dot"></span>Exporting <code>${esc(p.table)}</code>` : `<span class="pulse-dot"></span>Starting mysqldump…`)
      : j.kind === 'csv'
      ? `<span class="pulse-dot"></span>Inserting rows into <code>${esc(j.table)}</code>`
      : p.table ? `<span class="pulse-dot"></span>Restoring <code>${esc(p.table)}</code>` : `<span class="pulse-dot"></span>Reading dump…`;
  }
  const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  set('#j-rate', p.rate != null ? (j.kind === 'csv' && p.elapsed ? `${fmtCompact(p.rows / p.elapsed)} rows/s` : `${fmtBytes(p.rate)}/s`) : '—');
  set('#j-elapsed', fmtDur(p.elapsed));
  set('#j-eta', running ? fmtDur(p.eta) : j.kind === 'export' || j.kind === 'fetch' ? fmtBytes(j.result?.fileSize ?? p.fileBytes) : fmtBytes(p.bytes));
  set('#j-count', j.kind === 'fetch' ? fmtBytes(p.bytes) : j.kind === 'csv' ? fmtNum(p.rows) : j.kind === 'export' ? `${fmtNum(p.tableCount)} / ${fmtNum(p.tablesTotal)}` : fmtNum(p.tableCount));
  const ec = $('#j-errcount');
  if (ec) { ec.textContent = `${j.errors.length} error${j.errors.length === 1 ? '' : 's'}`; ec.className = `chip ${j.errors.length ? 'danger' : ''}`; }
}

let navTick = 0;
// Events can arrive before startX() returns the job id, so keep them until the job is known.
const early = new Map();
function replayEarly(id) { const q = early.get(id) || []; early.delete(id); q.forEach(onJobEvent); }
api.onJob(onJobEvent);
function onJobEvent(m) {
  const j = S.job;
  if (!j || m.id !== j.id) {
    if (!early.has(m.id)) early.set(m.id, []);
    const q = early.get(m.id); if (q.length < 500) q.push(m);
    if (early.size > 20) early.delete(early.keys().next().value);
    return;
  }
  if (m.type === 'progress') {
    j.progress = m.data;
    updateJob();
    if (Date.now() - navTick > 1000) { navTick = Date.now(); renderNav(); }
  } else if (m.type === 'log') {
    j.logs.push(m.data);
    if (j.logs.length > 3000) j.logs.splice(0, 500);
    if (m.data.level === 'error') j.errors.push({ message: m.data.message, ...(m.data.extra || {}) });
    const log = $('#j-log');
    if (log && S.view === 'job') {
      const stick = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
      log.insertAdjacentHTML('beforeend', logHtml(m.data));
      if (stick) log.scrollTop = log.scrollHeight;
    }
  } else if (m.type === 'done') {
    j.status = m.data.status;
    j.result = m.data;
    if (m.data.errors?.length) j.errors = m.data.errors;
    const msg = { success: 'Finished successfully', warning: 'Finished with errors', failed: 'Stopped on error', cancelled: 'Cancelled by you' }[j.status];
    j.logs.push({ level: j.status === 'success' ? 'success' : j.status === 'failed' ? 'error' : 'warn', message: `${msg} in ${fmtDur(m.data.durationMs / 1000)}`, t: Date.now() });
    renderNav();
    if (S.view === 'job') renderJob();
    if (j.kind === 'fetch') {
      if (j.status === 'success') toast(`Downloaded ${j.title} (${fmtBytes(m.data.fileSize)})`, 'ok');
      const qa = QS(j.quick); loadQuick(qa).then(() => { if (j.status === 'success' && j.restoreAfter && S.job === j) quickRestore(j.file, qa); });
    }
    else if (j.status === 'success') toast(j.kind === 'export' ? `Exported ${j.database} → ${j.title} (${fmtBytes(m.data.fileSize)})` : `${j.title} → ${j.database}: done in ${fmtDur(m.data.durationMs / 1000)}`, 'ok');
    loadHistoryCount();
    if (j.kind === 'restore' && S.r.connId === j.payload.connId) api.databases(j.payload.connId).then((d) => { S.r.dbs = d; }).catch(() => {});
    if (j.kind !== 'export' && S.tree[j.payload.connId]?.open) loadTreeDbs(j.payload.connId);
    if (j.kind === 'restore') for (const p of S.presets) if (qstate[p.id]?.st) loadQuick(qstate[p.id]);
    if (j.kind !== 'export') for (const t of S.tabs) if (t.connId === j.payload.connId && t.db === j.database) t.data = null;
  }
}

/* ================= CSV ================= */
function renderCsv() {
  const c = S.c, el = $('#view-csv');
  if (!c.preview) {
    el.innerHTML = `
      <div class="page-head"><div><h1>Import CSV into a table</h1><p>Preview the data, map columns, and bulk-insert into a new or existing table.</p></div></div>
      <div class="card"><div class="card-body">${c.loading ? '<div class="skeleton" style="height:160px"></div>' : dropzone('csv')}</div></div>`;
    return;
  }
  el.innerHTML = `
    <div class="page-head"><div><h1>Import CSV into a table</h1><p>Preview the data, map columns, and bulk-insert into a new or existing table.</p></div></div>
    <div class="grid-2">
      <div class="stack">
        <div class="card" id="c-file"></div>
        <div class="card" id="c-map"></div>
      </div>
      <div class="sticky"><div class="card" id="c-target"></div></div>
    </div>`;
  renderCsvFile(); renderCsvMap(); renderCsvTarget();
}

function renderCsvFile() {
  if (!$('#c-file')) return;
  const p = S.c.preview;
  const delims = [[',', 'Comma ,'], [';', 'Semicolon ;'], ['\t', 'Tab ⇥'], ['|', 'Pipe |']];
  $('#c-file').innerHTML = `<div class="card-head"><span class="step done">${ic('check')}</span><h3>Source file</h3></div>
    <div class="card-body">
      <div class="file-card">
        <div class="file-ico csv">CSV</div>
        <div class="file-meta"><b title="${esc(p.path)}">${esc(p.name)}</b><small>${fmtBytes(p.size)} · ${p.columns.length} columns detected</small></div>
        <button class="btn sm ghost" data-act="pick-csv">${ic('folder')}Change</button>
        <button class="icon-btn" data-act="clear-csv" title="Remove">${ic('x')}</button>
      </div>
      <div class="row mt">
        <div class="field"><label>Delimiter</label><select class="select" data-change="c-delim">${delims.map(([v, l]) => `<option value="${esc(v)}" ${p.delimiter === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <label class="field" style="cursor:pointer"><span class="label">First row</span>
          <div class="check-inline" style="height:36px">${sw('data-change="c-header"', S.c.header)}<span>Contains column names</span></div></label>
      </div>
    </div>`;
}

function tableCols() {
  const c = S.c;
  return c.tableMode === 'existing' && Array.isArray(c.tables) ? (c.tables.find((t) => t.name === c.table)?.columns || []) : [];
}

const TYPES = ['VARCHAR(255)', 'TEXT', 'INT', 'BIGINT', 'DECIMAL(20,6)', 'DOUBLE', 'TINYINT(1)', 'DATE', 'DATETIME', 'JSON'];
function renderCsvMap() {
  if (!$('#c-map')) return;
  const c = S.c, p = c.preview;
  const existing = c.tableMode === 'existing';
  const cols = tableCols();
  const head = c.mapping.map((m) => {
    const skip = existing ? !m.column : m.skip;
    let ctl;
    if (existing) {
      ctl = c.table
        ? `<select class="select" data-change="map-col" data-index="${m.index}"><option value="">— skip —</option>${cols.map((col) => `<option value="${esc(col.name)}" ${col.name === m.column ? 'selected' : ''}>${esc(col.name)}</option>`).join('')}</select>`
        : `<select class="select" disabled><option>Pick a table</option></select>`;
    } else {
      ctl = `<input class="input mono" value="${esc(m.column)}" data-input="map-name" data-index="${m.index}" spellcheck="false" ${m.skip ? 'disabled' : ''}>
        <select class="select" data-change="map-type" data-index="${m.index}"><option value="__skip" ${m.skip ? 'selected' : ''}>— skip column —</option>${TYPES.map((t) => `<option ${!m.skip && t === m.type ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    }
    return `<th><div class="map-cell ${skip ? 'skip' : ''}"><div class="src">${ic('sheet')}<b title="${esc(m.header)}">${esc(m.header)}</b></div>${ic('arrowDown')}${ctl}</div></th>`;
  }).join('');
  const rows = p.rows.slice(0, 30).map((r, ri) => `<tr><td class="rn">${ri + 1}</td>${c.mapping.map((m) => {
    const v = r[m.index];
    const isNull = v === undefined || (c.opts.emptyAsNull && v === '');
    return `<td class="${isNull ? 'null' : ''}" title="${esc(v)}">${isNull ? 'NULL' : esc(v)}</td>`;
  }).join('')}</tr>`).join('');
  const mapped = c.mapping.filter((m) => (existing ? m.column : !m.skip)).length;
  $('#c-map').innerHTML = `<div class="card-head"><span class="step ${mapped ? 'done' : ''}">${mapped ? ic('check') : '2'}</span><h3>Preview &amp; column mapping</h3>
      <div class="right"><span class="chip">${mapped} of ${c.mapping.length} columns mapped</span></div></div>
    <div class="card-body"><div class="preview-wrap"><table class="preview"><thead><tr><th class="rn">#</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <small class="muted" style="display:block;margin-top:8px">Showing the first ${Math.min(30, p.rows.length)} rows. Column types were guessed from a sample of the data.</small></div>`;
}

function renderCsvTarget() {
  if (!$('#c-target')) return;
  const c = S.c;
  const conn = connById(c.connId);
  const tableName = c.tableMode === 'new' ? c.newTable.trim() : c.table;
  const mapped = c.mapping.filter((m) => (c.tableMode === 'existing' ? m.column : !m.skip && m.column)).length;
  const ready = conn && c.db && tableName && mapped;
  let dbSel;
  if (!c.connId) dbSel = `<select class="select" disabled><option>Choose a server first</option></select>`;
  else if (c.dbs === null) dbSel = `<div class="skeleton" style="margin:0;height:36px"></div>`;
  else if (c.dbs.error) dbSel = `<div class="callout danger">${ic('alert')}<div>${esc(c.dbs.error)}</div></div>`;
  else dbSel = `<select class="select" data-change="c-db"><option value="" disabled ${!c.db ? 'selected' : ''}>Choose database…</option>${c.dbs.map((d) => `<option ${d.name === c.db ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`;
  let tableCtl;
  if (c.tableMode === 'new') tableCtl = `<input class="input mono" placeholder="table_name" value="${esc(c.newTable)}" data-input="c-newtable" spellcheck="false">`;
  else if (!c.db) tableCtl = `<select class="select" disabled><option>Choose a database first</option></select>`;
  else if (c.tables === null) tableCtl = `<div class="skeleton" style="margin:0;height:36px"></div>`;
  else tableCtl = `<select class="select" data-change="c-table"><option value="" disabled ${!c.table ? 'selected' : ''}>Choose table…</option>${(c.tables || []).map((t) => `<option ${t.name === c.table ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`;
  const o = c.opts;
  $('#c-target').innerHTML = `<div class="card-head"><span class="step ${ready ? 'done' : ''}">${ready ? ic('check') : '3'}</span><h3>Target</h3></div>
    <div class="card-body">
      ${S.conns.length ? `
      <div class="field"><label>Server</label>${connSelect('c', c.connId)}</div>
      <div class="field mt"><label>Database</label>${dbSel}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px"><span class="label">Table</span>
        <div class="seg"><button class="${c.tableMode === 'new' ? 'on' : ''}" data-act="c-tmode" data-mode="new">New table</button><button class="${c.tableMode === 'existing' ? 'on' : ''}" data-act="c-tmode" data-mode="existing">Existing</button></div></div>
      <div class="field" style="margin-top:8px">${tableCtl}</div>
      <div class="opt-group-label" style="margin-top:18px">${ic('zap')}Options</div>
      <div class="field" style="margin-bottom:6px"><select class="select" data-change="c-mode">
        <option value="insert" ${o.mode === 'insert' ? 'selected' : ''}>INSERT: fail on duplicate keys</option>
        <option value="ignore" ${o.mode === 'ignore' ? 'selected' : ''}>INSERT IGNORE: skip duplicate rows</option>
        <option value="replace" ${o.mode === 'replace' ? 'selected' : ''}>REPLACE: overwrite duplicate rows</option></select></div>
      <label class="opt"><div class="txt"><b>Empty values as NULL</b><small>Blank cells are stored as NULL instead of an empty string.</small></div>${sw('data-change="c-opt" data-key="emptyAsNull"', o.emptyAsNull)}</label>
      ${c.tableMode === 'existing' ? `<label class="opt"><div class="txt"><b>Empty the table first</b><small>Deletes the existing rows. Rolled back if the import fails.</small></div>${sw('data-change="c-opt" data-key="truncate"', o.truncate, 'danger')}</label>` : ''}
      <label class="opt"><div class="txt"><b>Continue on errors</b><small>Skip batches that fail instead of rolling everything back.</small></div>${sw('data-change="c-opt" data-key="force"', o.force)}</label>
      <button class="btn primary block mt" data-act="start-csv" ${ready ? '' : 'disabled'}>${ic('play')}Import ${mapped ? mapped + ' columns' : ''}</button>`
      : `<div class="callout info">${ic('info')}<div>Add a MySQL or MariaDB server first.</div></div><button class="btn primary mt" data-act="add-conn">${ic('plus')}Add connection</button>`}
    </div>`;
}

async function loadCsv(path, opts = {}) {
  S.c.loading = true; if (!S.c.preview) renderCsv();
  try {
    const p = await api.csvPreview(path, { delimiter: opts.delimiter, header: S.c.header });
    S.c.preview = p; S.c.file = path;
    S.c.mapping = p.columns.map((col) => ({ index: col.index, header: col.header, column: col.name, type: col.type, skip: false }));
    if (!S.c.newTable || !opts.keepTable) S.c.newTable = p.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64) || 'imported';
    if (S.c.tableMode === 'existing') automap();
  } catch (e) { toast('Could not parse CSV: ' + e.message); }
  S.c.loading = false;
  renderCsv();
}

function automap() {
  const cols = tableCols();
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const m of S.c.mapping) {
    const hit = cols.find((c) => norm(c.name) === norm(m.header)) || cols.find((c) => norm(c.name) === norm(m.column));
    m.column = hit ? hit.name : '';
  }
}

async function selectCsvConn(id) {
  const c = S.c; c.connId = id; store.set('c.connId', id); c.dbs = null; c.db = null; c.tables = null; c.table = '';
  renderCsvTarget();
  try { c.dbs = await api.databases(id); } catch (e) { c.dbs = { error: e.message }; }
  renderCsvTarget();
}
async function selectCsvDb(name) {
  const c = S.c; c.db = name; c.tables = null; c.table = '';
  renderCsvTarget();
  try { c.tables = await api.tables(c.connId, name); } catch (e) { c.tables = []; toast(e.message); }
  renderCsvTarget();
}

async function startCsv() {
  const c = S.c;
  const existing = c.tableMode === 'existing';
  const table = existing ? c.table : c.newTable.trim();
  if (!existing) {
    const names = c.mapping.filter((m) => !m.skip).map((m) => m.column.trim());
    if (names.some((n) => !n)) return toast('Every mapped column needs a name');
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return toast('Column names must be unique');
    if (Array.isArray(c.tables) && c.tables.some((t) => t.name.toLowerCase() === table.toLowerCase())) return toast(`Table "${table}" already exists. Choose "Existing" to append to it.`);
  }
  if (existing && c.opts.truncate) {
    const ok = await api.confirm({ title: 'Empty table', message: `Delete all rows in "${table}" before importing?`, detail: 'Rows are deleted inside the import transaction and restored if the import fails.', ok: 'Empty & import' });
    if (!ok) return;
  }
  const mapping = c.mapping.filter((m) => (existing ? m.column : !m.skip)).map((m) => ({ index: m.index, column: m.column.trim(), type: m.type }));
  const payload = { file: c.file, connId: c.connId, database: c.db, table, createTable: !existing, truncate: existing && c.opts.truncate, mode: c.opts.mode, emptyAsNull: c.opts.emptyAsNull, force: c.opts.force, delimiter: c.preview.delimiter, header: c.header, mapping };
  await guard(async () => {
    const { id } = await api.startCsv(payload);
    S.job = { id, kind: 'csv', status: 'running', title: c.preview.name, file: c.file, conn: connById(c.connId), database: c.db, table, progress: { bytes: 0, total: c.preview.size, rows: 0 }, logs: [], errors: [], payload, startedAt: Date.now() };
    go('job');
    replayEarly(id);
  });
}

/* ================= HISTORY ================= */
async function loadHistoryCount() { try { S.history = await api.history.list(); renderNav(); if (S.view === 'history') renderHistory(); } catch {} }
async function loadHistory() { renderHistory(); await loadHistoryCount(); }
function renderHistory() {
  const el = $('#view-history');
  const h = S.history;
  el.innerHTML = `
    <div class="page-head"><div><h1>History</h1><p>Your last ${h.length || ''} restores, exports and imports.</p></div>
      ${h.length ? `<button class="btn ghost" data-act="hist-clear">${ic('trash')}Clear history</button>` : ''}</div>
    ${!h.length ? `<div class="card"><div class="empty-state"><div class="dz-icon">${ic('history')}</div><b>Nothing here yet</b>Finished jobs show up here with their timing and errors.</div></div>` : `
    <div class="card"><div class="hist-list">${h.map((x) => `
      <div class="hist-item" data-act="hist-toggle" data-id="${x.id}">
        <div class="hist-ico ${x.status}">${ic(x.status === 'success' ? (x.kind === 'export' ? 'download' : 'check') : x.status === 'cancelled' ? 'ban' : x.status === 'failed' ? 'x' : 'alert')}</div>
        <div class="t"><b>${esc(x.fileName)}</b><small>${x.kind === 'csv' ? 'CSV import' : x.kind === 'export' ? 'SQL export' : x.kind === 'fetch' ? 'SCP fetch' : 'SQL restore'} · ${fmtBytes(x.total)}</small></div>
        <div class="target"><span class="dot" style="color:${esc(x.connColor || '#888')};width:8px;height:8px"></span><span>${esc(x.connName)} / ${esc(x.database)}${x.table ? '.' + esc(x.table) : ''}</span></div>
        <div class="num">${x.kind === 'csv' ? `${fmtCompact(x.rows)} rows` : x.kind === 'fetch' ? fmtBytes(x.fileSize) : x.kind === 'export' ? plural(x.tables, 'table') : x.stats ? plural(x.stats.tables - x.stats.views, 'table') : `${fmtNum(x.tables)} tables`}${x.errorCount ? ` · <span style="color:var(--danger)">${x.errorCount} err</span>` : ''}</div>
        <div class="num">${fmtDur(x.durationMs / 1000)}</div>
        <div class="when">${timeAgo(x.at)}</div>
        ${S.histOpen === x.id ? `<div class="hist-detail" data-act="noop">
          <div class="chips" style="margin-top:0"><span class="chip mono" title="${esc(x.file)}">${esc(x.file)}</span>${x.stats ? `<span class="chip">~${fmtCompact(x.stats.rows)} rows</span><span class="chip">${fmtBytes(x.stats.size)}</span>` : ''}<span class="chip">${new Date(x.at).toLocaleString()}</span></div>
          ${(x.errors || []).slice(0, 5).map((e) => `<div class="callout danger mt">${ic('alert')}<div>${e.code ? `<b>ERROR ${e.code}</b>${e.line ? ` at line ${e.line}` : ''}: ` : ''}${esc(e.message)}${e.hint ? `<div style="color:var(--warn);margin-top:4px">${esc(e.hint)}</div>` : ''}</div></div>`).join('')}
        </div>` : ''}
      </div>`).join('')}</div></div>`}`;
}

/* ================= CONNECTION DIALOG ================= */
let dlg = null;
function openConn(id) {
  const c = id ? connById(id) : null;
  dlg = { id: c?.id, name: c?.name || '', color: c?.color || COLORS[S.conns.length % COLORS.length], host: c?.host || '127.0.0.1', port: c?.port || 3306, user: c?.user || 'root', password: '', ssl: !!c?.ssl, hasPassword: !!c?.hasPassword, test: null };
  renderDlg();
  $('#connDialog').showModal();
}
function renderDlg() {
  const d = dlg;
  $('#connDialog').innerHTML = `<div class="modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px;background:${esc(d.color)};box-shadow:none">${ic('server')}</div>
      <div><h3>${d.id ? 'Edit connection' : 'New connection'}</h3><p>MySQL or MariaDB over TCP</p></div>
      <button class="icon-btn" data-act="dlg-close">${ic('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Name</label><input class="input" data-dlg="name" value="${esc(d.name)}" placeholder="Local dev, Staging…"></div>
      <div class="field"><label>Color</label><div class="swatches">${COLORS.map((c) => `<span class="swatch ${c === d.color ? 'on' : ''}" style="background:${c}" data-act="dlg-color" data-color="${c}"></span>`).join('')}</div></div>
      <div class="row"><div class="field" style="flex:3"><label>Host</label><input class="input mono" data-dlg="host" value="${esc(d.host)}" spellcheck="false"></div>
        <div class="field" style="flex:1"><label>Port</label><input class="input mono" data-dlg="port" value="${esc(d.port)}" inputmode="numeric"></div></div>
      <div class="row"><div class="field"><label>User</label><input class="input mono" data-dlg="user" value="${esc(d.user)}" spellcheck="false"></div>
        <div class="field"><label>Password</label><input class="input mono" type="password" data-dlg="password" value="${esc(d.password)}" placeholder="${d.id && d.hasPassword ? '•••••• (unchanged)' : ''}"></div></div>
      <label class="check-inline">${sw('data-dlg-check="ssl"', d.ssl)}<span>Require SSL/TLS</span></label>
      <div id="dlg-test">${testHtml()}</div>
    </div>
    <div class="modal-foot">
      ${d.id ? `<button class="btn ghost" data-act="dlg-delete" style="color:var(--danger)">${ic('trash')}Delete</button>` : ''}
      <div class="spacer"></div>
      <button class="btn" data-act="dlg-test">${ic('zap')}Test</button>
      <button class="btn primary" data-act="dlg-save">${ic('check')}Save</button>
    </div></div>`;
}
function testHtml() {
  const t = dlg.test;
  if (!t) return '';
  if (t.loading) return `<div class="test-result">${ic('loader', 'spin')}Connecting…</div>`;
  if (t.ok) return `<div class="test-result ok">${ic('check')}Connected to ${esc(t.version)} in ${t.ms} ms</div>`;
  return `<div class="test-result bad">${ic('alert')}${esc(t.error)}</div>`;
}
function dlgPayload() {
  const d = dlg;
  return { id: d.id, name: d.name.trim(), color: d.color, host: d.host.trim(), port: Number(d.port) || 3306, user: d.user.trim(), ssl: d.ssl, password: d.password === '' && d.id && d.hasPassword ? undefined : d.password };
}

/* ================= EVENTS ================= */
const actions = {
  nav: (el) => go(el.dataset.view),
  'add-conn': () => openConn(null),
  'edit-conn': (el) => openConn(el.dataset.id),
  'pick-dump': async () => { const p = await guard(() => api.pickFile('dump')); if (p) loadDump(p); },
  'clear-dump': () => { Object.assign(S.r, { file: null, info: null }); renderSource(); renderOptions(); },
  'pick-csv': async () => { const p = await guard(() => api.pickFile('csv')); if (p) loadCsv(p); },
  'clear-csv': () => { Object.assign(S.c, { file: null, preview: null, mapping: [] }); renderCsv(); },
  'r-dbmode': (el) => { S.r.dbMode = el.dataset.mode; renderTarget(); renderOptions(); },
  'r-pickdb': (el) => { S.r.db = el.dataset.name; renderTarget(); renderOptions(); },
  'r-refresh': () => S.r.connId && selectRestoreConn(S.r.connId),
  'start-restore': () => startRestore(),
  'cancel-job': () => S.job && guard(() => api.cancelJob(S.job.id)),
  'job-new': () => { const k = S.job.kind; if (S.job.quick) go(`quick:${S.job.quick}`); else if (k === 'export') go('export'); else if (k === 'csv') { Object.assign(S.c, { file: null, preview: null, mapping: [] }); go('csv'); } else { Object.assign(S.r, { file: null, info: null, dropFirst: false }); go('restore'); } },
  'job-adjust': () => {
    const j = S.job;
    if (j.quick) { Object.assign(S.r, { dbMode: 'existing', dropFirst: true, opts: { ...S.r.opts, ...Object.fromEntries(Object.keys(DEFAULT_OPTS).map((k) => [k, j.payload[k]])) } }); go('restore'); loadDump(j.file); selectRestoreConn(j.payload.connId, j.database); return; }
    go({ csv: 'csv', export: 'export' }[j.kind] || 'restore');
  },
  'a-refresh': () => loadQuick(),
  'scp-open': () => openScp(),
  'scp-close': () => $('#scpDialog').close(),
  'scp-reload': () => loadRemote(),
  'scp-pick': (el) => { const c = S.scp; c.name = el.dataset.name; c.date = patternDate(c.pattern, c.name) || c.date; const d = $('[data-change="scp-date"]'); if (d) d.value = c.date; const n = $('[data-input="scp-name"]'); if (n) n.value = c.name; renderScpCmd(); renderScpRemote(); renderScpStatus(); },
  'scp-go': () => startScp(),
  'job-quick-restore': () => quickRestore(S.job.file, QS(S.job.quick)),
  'job-scp-retry': async () => { const t = S.job.title; go(`quick:${S.job.quick}`); if (!S.a.st) await loadQuick(); openScp(); if (!S.scp) return; S.scp.name = t; S.scp.date = patternDate(S.scp.pattern, t) || S.scp.date; renderScp(); },
  'a-restore': (el) => quickRestore(el.dataset.path),
  'a-show': (el) => api.showInFolder(el.dataset.path),
  'a-folder': async () => { const p = await guard(() => api.pickDir(S.a.st?.folder)); if (p) { S.a.folder = p; store.set(`q.${S.a.id}.folder`, p); loadQuick(); } },
  'a-reset': () => { Object.assign(S.a, { folder: '', database: '' }); store.set(`q.${S.a.id}.folder`, ''); store.set(`q.${S.a.id}.database`, ''); loadQuick(); },
  'job-restore-file': () => { const f = S.job.file; go('restore'); loadDump(f); },

  // sidebar tree
  'tree-conn': (el) => { const t = T(el.dataset.id); t.open = !t.open; saveTreeOpen(); if (t.open && (t.dbs === null || t.dbs.error)) loadTreeDbs(el.dataset.id); else renderConns(); },
  'tree-refresh': (el) => { const t = T(el.dataset.id); t.open = true; saveTreeOpen(); loadTreeDbs(el.dataset.id); },
  'tree-refresh-all': () => { for (const c of S.conns) if (T(c.id).open) loadTreeDbs(c.id); },
  'tree-db': (el) => { const t = T(el.dataset.id), db = el.dataset.db; if (t.openDbs[db] !== undefined) { delete t.openDbs[db]; renderConns(); } else loadTreeTables(el.dataset.id, db); },
  'tree-table': (el) => openTable(el.dataset.id, el.dataset.db, el.dataset.table),
  'tree-restore': (el) => { Object.assign(S.r, { dbMode: 'existing', dbFilter: '' }); go('restore'); selectRestoreConn(el.dataset.id, el.dataset.db); },
  'tree-export': (el) => { S.e.allTables = true; go('export'); selectExportConn(el.dataset.id, el.dataset.db); },

  // export
  'e-pickdb': (el) => selectExportDb(el.dataset.name),
  'e-refresh': () => S.e.connId && selectExportConn(S.e.connId, S.e.db),
  'e-tmode': (el) => { S.e.allTables = el.dataset.mode === 'all'; renderExportTables(); renderExportOptions(); },
  'e-sel-all': () => { const f = S.e.tFilter.toLowerCase(); (S.e.objects || []).filter((o) => o.name.toLowerCase().includes(f)).forEach((o) => S.e.selected.add(o.name)); renderExportTables(); renderExportOptions(); },
  'e-sel-none': () => { const f = S.e.tFilter.toLowerCase(); (S.e.objects || []).filter((o) => o.name.toLowerCase().includes(f)).forEach((o) => S.e.selected.delete(o.name)); renderExportTables(); renderExportOptions(); },
  'e-fmt': (el) => { S.e.opts.gzip = el.dataset.gz === '1'; store.set('e.opts', S.e.opts); renderExportOptions(); },
  'e-saveas': async () => { const p = await guard(() => api.saveFile({ defaultPath: exportFile(), gzip: S.e.opts.gzip })); if (p) { S.e.file = p; if (/\.sql$/i.test(p)) S.e.opts.gzip = false; else if (/\.gz$/i.test(p)) S.e.opts.gzip = true; renderExportOptions(); } },
  'start-export': () => startExport(),

  // data viewer
  'dv-sort': (el, ev) => {
    const d = S.dv, col = el.dataset.col, i = d.sort.findIndex((x) => x.column === col);
    const cur = i >= 0 ? d.sort[i].dir : null, next = cur === null ? 'asc' : cur === 'asc' ? 'desc' : null;
    if (ev.shiftKey) { if (i >= 0) { if (next) d.sort[i].dir = next; else d.sort.splice(i, 1); } else d.sort.push({ column: col, dir: 'asc' }); }
    else d.sort = next ? [{ column: col, dir: next }] : [];
    d.offset = 0; renderDataHead(); fetchData();
  },
  'dv-page': (el) => {
    const d = S.dv, x = d.data; if (!x) return;
    const to = el.dataset.to;
    if (to === 'first') d.offset = 0;
    else if (to === 'prev') d.offset = Math.max(0, d.offset - d.limit);
    else if (to === 'next') d.offset += d.limit;
    else if (to === 'last' && x.total != null) d.offset = Math.max(0, Math.floor((x.total - 1) / d.limit) * d.limit);
    fetchData();
  },
  'dv-clear': () => { Object.assign(S.dv, { filters: {}, search: '', offset: 0 }); renderData(); fetchData(); },
  'dv-refresh': () => { S.dv.refs = null; fetchData(); },
  'dv-export': async () => {
    const { connId, db, table } = S.dv;
    S.e.allTables = false; go('export');
    await selectExportConn(connId, db);
    if (S.e.db === db && Array.isArray(S.e.objects)) { S.e.selected = new Set([table]); renderExportTables(); renderExportOptions(); }
  },
  'dv-copy': () => { const d = S.dv; if (!d.data || !d.sel) return; navigator.clipboard.writeText(cellText(d.data.rows[d.sel.r][d.sel.c])); toast('Copied value', 'ok'); },
  'dv-expand': () => openValue(),
  'dv-panel': () => { rememberScroll(); panelOpen = !panelOpen; store.set('dv.panel', panelOpen); renderData(); },
  'dv-cols': (el) => { const d = S.dv; for (const c of colMatches(d)) { if (el.dataset.show === '1') d.hidden.delete(c.name); else d.hidden.add(c.name); } if (d.data && d.hidden.size >= d.data.columns.length) { d.hidden.delete(d.data.columns[0].name); toast('Kept one column visible', 'ok'); } saveHidden(d); refreshCols(); },
  'dv-gocol': (el) => {
    const d = S.dv, col = el.dataset.col;
    if (d.hidden.has(col)) { d.hidden.delete(col); saveHidden(d); refreshCols(); }
    const th = [...document.querySelectorAll('#dv-thead th.h')].find((x) => x.dataset.col === col);
    if (th) { th.scrollIntoView({ inline: 'center', block: 'nearest' }); th.classList.remove('flash'); void th.offsetWidth; th.classList.add('flash'); }
  },
  'dv-ref': (el) => { const d = S.dv; const fk = d.refs[el.dataset.dir][Number(el.dataset.i)]; followRef(el.dataset.dir, fk, d.sel ? d.data.rows[d.sel.r] : null); },
  'dv-follow': (el) => { const d = S.dv; const c = d.data.columns[Number(el.dataset.c)]; followRef('out', fkOf(d, c.name), d.data.rows[Number(el.dataset.r)]); },
  'q-new': () => { const d = S.dv; openQuery(d.connId || null, d.db || null); },
  'tree-query': (el) => openQuery(el.dataset.id, el.dataset.db),
  'q-run': () => runQuery(),
  'q-stop': () => { const d = S.dv; guard(() => api.sql.cancel(d.key, d.connId)); },
  'q-rtab': (el) => { const d = S.dv; d.resTab = el.dataset.i === 'msg' ? 'msg' : Number(el.dataset.i); d.sel = null; d.qsort = null; renderQueryResults(); },
  'q-sort': (el) => { const d = S.dv, c = Number(el.dataset.c); d.qsort = d.qsort?.c !== c ? { c, dir: 'asc' } : d.qsort.dir === 'asc' ? { c, dir: 'desc' } : null; const sc = $('#q-rbody')?.scrollLeft; renderQueryResults(); if (sc) $('#q-rbody').scrollLeft = sc; },
  'q-goline': (el) => { const ta = $('#q-ta'); if (!ta) return; const ln = Number(el.dataset.line); const lines = ta.value.split('\n'); let pos = 0; for (let i = 0; i < ln - 1 && i < lines.length; i++) pos += lines[i].length + 1; ta.focus(); ta.setSelectionRange(pos, pos + (lines[ln - 1] || '').length); const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20; ta.scrollTop = Math.max(0, (ln - 3) * lh); },
  'q-copy': () => { const d = S.dv, set = resultSets(d)[d.resTab]; if (set && d.sel) { navigator.clipboard.writeText(cellText(set.rows[d.sel.r][d.sel.c])); toast('Copied value', 'ok'); } },
  'q-expand': () => { const d = S.dv, set = resultSets(d)[d.resTab]; if (set && d.sel) { const c = set.columns[d.sel.c]; showValue(c.name, `${c.dataType} · row ${d.sel.r + 1}`, set.rows[d.sel.r][d.sel.c]); } },
  'q-copy-tsv': () => { const d = S.dv, set = resultSets(d)[d.resTab]; if (!set) return; const cell = (v) => (v === null ? '' : cellText(v)).replace(/[\t\n\r]+/g, ' '); navigator.clipboard.writeText([set.columns.map((c) => c.name).join('\t'), ...sortedRows(d, set).map((i) => set.rows[i].map(cell).join('\t'))].join('\n')); toast(`Copied ${fmtNum(set.rows.length)} rows`, 'ok'); },
  'val-copy': () => { const t = $('#valDialog .val-text'); if (t) { navigator.clipboard.writeText(t.value); toast('Copied value', 'ok'); } },
  'theme-open': () => openTheme(),
  'th-close': () => $('#themeDialog').close(),
  'th-group': (el) => { TH.group = el.dataset.g; renderThemeGroups(); renderThemeGrid(); },
  'th-pick': (el) => { const t = allThemes().find((x) => x.id === el.dataset.id); if (t) { applyTheme(t); renderThemeGrid(); renderThemeEditor(); } },
  'th-del': (el, ev) => { ev.stopPropagation(); store.set('themes.custom', customThemes().filter((t) => t.id !== el.dataset.id)); renderThemeGroups(); renderThemeGrid(); },
  'th-mode': (el) => {
    const m = el.dataset.m, t = Theme.current; if ((t.mode === 'light') === (m === 'light')) return;
    // Flip background/text lightness so the palette stays usable.
    editTheme(m === 'light' ? { mode: 'light', bg: Theme.mix(t.accent, '#ffffff', 0.95), text: '#161925' } : { mode: 'dark', bg: Theme.mix(t.accent, '#07080b', 0.94), text: '#e9ebf2' });
  },
  'th-save': () => {
    const name = TH.name.trim() || `My theme ${customThemes().length + 1}`;
    const t = { ...Theme.current, id: 'c-' + Date.now().toString(36), name, group: 'custom' };
    store.set('themes.custom', [...customThemes(), t]);
    applyTheme(t); TH.name = ''; TH.group = 'custom';
    renderThemeGroups(); renderThemeGrid(); renderThemeEditor(); toast(`Saved theme "${name}"`, 'ok');
  },
  'th-reset': () => { applyTheme(Theme.PRESETS[0]); renderThemeGrid(); renderThemeEditor(); },
  'th-random': () => {
    const h = Math.random() * 360, hsl = (hh, s, l) => { const k = (n) => (n + hh / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return Theme.toHex([f(0) * 255, f(8) * 255, f(4) * 255]); };
    const dark = Theme.current.mode !== 'light', grad = Math.random() > 0.3;
    editTheme({ accent: hsl(h, 0.85, 0.62), accent2: grad ? hsl((h + 40 + Math.random() * 120) % 360, 0.85, 0.6) : null, mid: null, bg: dark ? hsl(h, 0.35, 0.05) : hsl(h, 0.5, 0.97), text: dark ? hsl(h, 0.2, 0.92) : hsl(h, 0.25, 0.12), glow: dark && Math.random() > 0.3 });
  },
  'tab-open': (el) => { const t = S.tabs.find((x) => x.key === el.dataset.key); if (t && t !== S.dv) activateTab(t); },
  'tab-close': (el, ev) => { ev.stopPropagation(); closeTab(el.dataset.key); },
  'tab-close-group': (el, ev) => { ev.stopPropagation(); const g = S.tabs.find((x) => x.key === el.dataset.key); if (g) closeTabs((t) => sameGroup(t, g)); },
  'tree-tfilter-clear': (el, ev) => { ev.stopPropagation(); T(el.dataset.id).tFilter[el.dataset.db] = ''; renderConns(); },
  'dv-copysql': () => { if (S.dv.data) { navigator.clipboard.writeText(S.dv.data.sql); toast('SQL copied', 'ok'); } },
  'val-close': () => $('#valDialog').close(),
  'show-file': () => S.job && api.showInFolder(S.job.file),
  'copy-log': () => { navigator.clipboard.writeText(S.job.logs.map((l) => `[${clock(l.t)}] ${l.level.toUpperCase()} ${l.message}`).join('\n')); toast('Log copied', 'ok'); },
  'c-tmode': (el) => { S.c.tableMode = el.dataset.mode; if (S.c.tableMode === 'new') S.c.mapping.forEach((m, i) => { m.column = S.c.preview.columns[i].name; }); else automap(); renderCsvMap(); renderCsvTarget(); },
  'start-csv': () => startCsv(),
  'hist-toggle': (el) => { S.histOpen = S.histOpen === el.dataset.id ? null : el.dataset.id; renderHistory(); },
  'hist-clear': async () => { if (await api.confirm({ title: 'Clear history', message: 'Clear all job history?', detail: 'This only removes the list. Your databases are not affected.', ok: 'Clear' })) { await api.history.clear(); loadHistory(); } },
  noop: () => {},
  'dlg-close': () => $('#connDialog').close(),
  'dlg-color': (el) => { dlg.color = el.dataset.color; renderDlg(); },
  'dlg-test': async () => {
    dlg.test = { loading: true }; $('#dlg-test').innerHTML = testHtml();
    try { dlg.test = { ok: true, ...(await api.connections.test(dlgPayload())) }; } catch (e) { dlg.test = { ok: false, error: e.message }; }
    $('#dlg-test').innerHTML = testHtml();
  },
  'dlg-save': async () => {
    const p = dlgPayload();
    if (!p.host || !p.user) return toast('Host and user are required');
    await guard(async () => {
      const saved = await api.connections.save(p);
      S.conns = await api.connections.list();
      $('#connDialog').close();
      const t = T(saved.id); t.open = true; saveTreeOpen();
      loadTreeDbs(saved.id);
      toast(`Saved "${saved.name}"`, 'ok');
      if (S.view === 'export') { if (!S.e.connId || S.e.connId === saved.id) selectExportConn(saved.id); else renderExportSource(); }
      if (S.view === 'data') renderData();
      if (!S.r.connId || S.r.connId === saved.id) selectRestoreConn(saved.id).catch(() => {}); else renderTarget();
      if (S.view === 'csv') { if (!S.c.connId) selectCsvConn(saved.id); else renderCsvTarget(); }
      renderOptions();
    });
  },
  'dlg-delete': async () => {
    if (!(await api.confirm({ title: 'Delete connection', message: `Delete "${dlg.name}"?`, detail: 'Only the saved connection is removed. No data on the server is touched.', ok: 'Delete' }))) return;
    await api.connections.remove(dlg.id);
    if (S.r.connId === dlg.id) Object.assign(S.r, { connId: null, dbs: null, db: null, server: null });
    if (S.c.connId === dlg.id) Object.assign(S.c, { connId: null, dbs: null, db: null, tables: null });
    if (S.e.connId === dlg.id) Object.assign(S.e, { connId: null, dbs: null, db: null, objects: null });
    closeTabs((t) => t.connId === dlg.id);
    delete S.tree[dlg.id]; saveTreeOpen();
    S.conns = await api.connections.list();
    $('#connDialog').close();
    renderConns(); if (S.view === 'restore') renderRestore(); if (S.view === 'csv') renderCsv(); if (S.view === 'export') renderExport(); if (S.view === 'data') renderData();
  },
};

const changes = {
  'r-conn': (el) => selectRestoreConn(el.value),
  'scp-date': (el) => { const c = S.scp; if (!el.value) return; c.date = el.value; c.name = patternName(c.pattern, el.value); const n = $('[data-input="scp-name"]'); if (n) n.value = c.name; renderScpCmd(); renderScpRemote(); renderScpStatus(); },
  'scp-host': (el) => { const c = S.scp; c.host = el.value.trim() || presetById(c.pid)?.scp?.host || ''; store.set(`q.${c.pid}.scpHost`, c.host); renderScpCmd(); loadRemote(); },
  'scp-dir': (el) => { const c = S.scp; c.dir = el.value.trim() || presetById(c.pid)?.scp?.dir || '~'; store.set(`q.${c.pid}.scpDir`, c.dir); renderScpCmd(); loadRemote(); },
  'scp-restore': (el) => { S.scp.restoreAfter = el.checked; store.set(`q.${S.scp.pid}.restoreAfter`, el.checked); },
  'a-conn': (el) => { S.a.connId = el.value; store.set(`q.${S.a.id}.connId`, el.value); loadQuick(); },
  'a-db': (el) => { S.a.database = el.value.trim(); store.set(`q.${S.a.id}.database`, S.a.database); loadQuick(); },
  'a-archive': (el) => { S.a.archive = el.checked; renderQuick(); },
  'e-conn': (el) => selectExportConn(el.value),
  'e-opt': (el) => { S.e.opts[el.dataset.key] = el.checked; store.set('e.opts', S.e.opts); },
  'e-content': (el) => { S.e.opts.content = el.value; store.set('e.opts', S.e.opts); renderExportOptions(); },
  'e-tbl': (el) => { if (el.checked) S.e.selected.add(el.dataset.name); else S.e.selected.delete(el.dataset.name); const n = $('#e-selcount'); if (n) n.textContent = `${exportTables().length} of ${S.e.objects.length} selected`; renderExportOptions(); },
  'q-db': (el) => { S.dv.db = el.value || null; saveTabs(); renderTabs(); },
  'q-coe': (el) => { S.dv.coe = el.checked; },
  'th-hex': (el) => { const v = el.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) editTheme({ [el.dataset.k]: v.startsWith('#') ? v : '#' + v }); else renderThemeEditor(); },
  'th-grad': (el) => { const t = Theme.current; editTheme(el.checked ? { accent2: Theme.mix(t.accent, '#22d3ee', 0.6) } : { accent2: null, mid: null }); },
  'th-mid': (el) => { const t = Theme.current; editTheme({ mid: el.checked ? Theme.mix(t.accent, t.accent2, 0.5) : null }); },
  'th-glow': (el) => editTheme({ glow: el.checked }),
  'dv-colvis': (el) => { const d = S.dv; if (el.checked) d.hidden.delete(el.dataset.col); else if (d.data.columns.length - d.hidden.size <= 1) { el.checked = true; return toast('At least one column must stay visible'); } else d.hidden.add(el.dataset.col); saveHidden(d); refreshCols(); },
  'dv-limit': (el) => { S.dv.limit = Number(el.value); store.set('dv.limit', S.dv.limit); S.dv.offset = 0; fetchData(); },
  'r-opt': (el) => { S.r.opts[el.dataset.key] = el.checked; store.set('r.opts', S.r.opts); },
  'r-drop': (el) => { S.r.dropFirst = el.checked; renderOptions(); },
  'c-conn': (el) => selectCsvConn(el.value),
  'c-db': (el) => selectCsvDb(el.value),
  'c-table': (el) => { S.c.table = el.value; automap(); renderCsvMap(); renderCsvTarget(); },
  'c-delim': (el) => loadCsv(S.c.file, { delimiter: el.value, keepTable: true }),
  'c-header': (el) => { S.c.header = el.checked; loadCsv(S.c.file, { delimiter: S.c.preview.delimiter, keepTable: true }); },
  'c-mode': (el) => { S.c.opts.mode = el.value; },
  'c-opt': (el) => { S.c.opts[el.dataset.key] = el.checked; if (el.dataset.key === 'emptyAsNull') renderCsvMap(); },
  'map-col': (el) => { S.c.mapping[el.dataset.index].column = el.value; renderCsvMap(); renderCsvTarget(); },
  'map-type': (el) => { const m = S.c.mapping[el.dataset.index]; if (el.value === '__skip') m.skip = true; else { m.skip = false; m.type = el.value; } renderCsvMap(); renderCsvTarget(); },
};
const inputs = {
  'r-dbfilter': (el) => { S.r.dbFilter = el.value; renderDbList(); },
  'scp-name': (el) => { S.scp.name = el.value.trim(); const d = patternDate(S.scp.pattern, S.scp.name); if (d) { S.scp.date = d; const i = $('[data-change="scp-date"]'); if (i) i.value = d; } renderScpCmd(); renderScpRemote(); renderScpStatus(); },
  'a-q': (el) => { S.a.q = el.value; const pos = el.selectionStart; renderQuick(); const i = $('[data-input="a-q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } },
  'e-dbfilter': (el) => { S.e.dbFilter = el.value; renderDbList('e'); },
  'e-tfilter': (el) => { S.e.tFilter = el.value; const pos = el.selectionStart; renderExportTables(); const i = $('[data-input="e-tfilter"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } },
  'tree-filter': (el) => { T(el.dataset.id).filter = el.value; const box = $(`[data-dbs="${el.dataset.id}"]`); if (box) box.innerHTML = treeDbsHtml(el.dataset.id); },
  'tree-tfilter': (el) => {
    T(el.dataset.id).tFilter[el.dataset.db] = el.value;
    const box = [...document.querySelectorAll('[data-tbls]')].find((b) => b.dataset.tbls === el.dataset.id && b.dataset.db === el.dataset.db);
    if (box) box.innerHTML = treeTablesHtml(el.dataset.id, el.dataset.db, T(el.dataset.id).openDbs[el.dataset.db]);
  },
  'dv-colsearch': (el) => { S.dv.colSearch = el.value; $('#dv-colist').innerHTML = colListHtml(); },
  'dv-refsearch': (el) => { S.dv.refSearch = el.value; $('#dv-reflist').innerHTML = refListHtml(); },
  'th-color': (el) => {
    const k = el.dataset.k, v = el.value;
    const hx = el.parentElement.querySelector('[data-change="th-hex"]'); if (hx) hx.value = v;
    cancelAnimationFrame(thRaf);
    thRaf = requestAnimationFrame(() => { editTheme({ [k]: v }, false); const sw_ = $('#th-edit .th-swatch'); if (sw_) { const d = Theme.derive(Theme.current); sw_.style.background = d['--accent-grad']; sw_.style.color = d['--on-accent']; } });
  },
  'th-name': (el) => { TH.name = el.value; },
  'dv-search': (el) => { S.dv.search = el.value; fetchDataSoon(); },
  'dv-filter': (el) => { S.dv.filters[el.dataset.col] = el.value; el.classList.toggle('on', !!el.value.trim()); fetchDataSoon(); },
  'r-newdb': (el) => { S.r.newDb = el.value; renderOptions(); refreshStep('#r-target', !!(S.r.connId && targetName())); },
  'c-newtable': (el) => { S.c.newTable = el.value; refreshCsvButton(); },
  'map-name': (el) => { S.c.mapping[el.dataset.index].column = el.value; },
};
function refreshStep(card, done) { const s = $(`${card} .step`); if (s) { s.classList.toggle('done', done); s.innerHTML = done ? ic('check') : '2'; } }
function refreshCsvButton() {
  const c = S.c, b = $('[data-act="start-csv"]'); if (!b) return;
  const ok = c.connId && c.db && (c.tableMode === 'new' ? c.newTable.trim() : c.table);
  b.toggleAttribute('disabled', !ok);
}

document.addEventListener('click', (e) => {
  const qtd = e.target.closest('#q-tbody td[data-qr]');
  if (qtd) {
    $('#q-tbody td.sel')?.classList.remove('sel'); qtd.classList.add('sel');
    S.dv.sel = { r: Number(qtd.dataset.qr), c: Number(qtd.dataset.qc) };
    $('#q-status').innerHTML = qStatusHtml(S.dv);
    return;
  }
  const td = !e.target.closest('.fk-go') && e.target.closest('#dv-tbody td[data-r]');
  if (td) {
    $('#dv-tbody td.sel')?.classList.remove('sel');
    td.classList.add('sel');
    S.dv.sel = { r: Number(td.dataset.r), c: Number(td.dataset.c) };
    renderDataStatus();
    const rl = $('#dv-reflist'); if (rl) rl.innerHTML = refListHtml();
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el || el.hasAttribute('disabled')) return;
  if (el.tagName === 'A') e.preventDefault();
  if (el.dataset.act === 'noop') { e.stopPropagation(); return; }
  actions[el.dataset.act]?.(el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.change) changes[el.dataset.change]?.(el, e);
  if (el.dataset.dlgCheck) dlg[el.dataset.dlgCheck] = el.checked;
});
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.input) inputs[el.dataset.input]?.(el, e);
  if (el.dataset.dlg) { dlg[el.dataset.dlg] = el.value; }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && $('#connDialog').open && e.target.tagName === 'INPUT') actions['dlg-save']();
  if (e.key === 'Enter' && /^dv-(filter|search)$/.test(e.target.dataset?.input || '')) { clearTimeout(dvTimer); S.dv.offset = 0; fetchData(); }
  if (S.view === 'data' && S.dv.sel && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && !String(window.getSelection())) { e.preventDefault(); actions['dv-copy'](); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset?.input === 'tree-tfilter') {
    const box = e.target.closest('.tree-filter')?.nextElementSibling;
    const first = box?.querySelector('.tree-row.tbl'); if (first) first.click();
  }
  if (e.key === 'Escape' && e.target.dataset?.input === 'tree-tfilter' && e.target.value) { e.target.value = ''; e.target.dispatchEvent(new Event('input', { bubbles: true })); }
  if (S.view === 'data' && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') { e.preventDefault(); actions['q-new'](); return; }
  if (S.view === 'data' && S.dv.kind === 'query' && S.dv.sel && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && !String(window.getSelection())) { e.preventDefault(); actions['q-copy'](); return; }
  if (S.view === 'data' && S.dv.kind === 'query' && e.key === 'F5') { e.preventDefault(); runQuery(); return; }
  if (S.view !== 'data' || !S.tabs.length) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') { e.preventDefault(); if (S.dv !== EMPTY_DV) closeTab(S.dv.key); }
  if (e.ctrlKey && e.key === 'Tab') { e.preventDefault(); const i = S.tabs.indexOf(S.dv); activateTab(S.tabs[(i + (e.shiftKey ? -1 : 1) + S.tabs.length) % S.tabs.length]); }
});
// Middle-click closes a tab.
document.addEventListener('auxclick', (e) => { const t = e.button === 1 && e.target.closest('.tab[data-key]'); if (t) { e.preventDefault(); closeTab(t.dataset.key); } });
document.addEventListener('dblclick', (e) => { if (e.target.closest('#dv-tbody td[data-r]')) openValue(); if (e.target.closest('#q-tbody td[data-qr]')) actions['q-expand'](); });
$('#themeDialog').addEventListener('click', (e) => { if (e.target.id === 'themeDialog') e.target.close(); });
$('#scpDialog').addEventListener('click', (e) => { if (e.target.id === 'scpDialog') e.target.close(); });
$('#valDialog').addEventListener('click', (e) => { if (e.target.id === 'valDialog') e.target.close(); });
$('#connDialog').addEventListener('click', (e) => { if (e.target.id === 'connDialog') e.target.close(); });

// Drag & drop anywhere on the restore / CSV views.
let dragDepth = 0;
const dz = () => document.querySelector(`.view.active [data-drop]`);
document.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; dz()?.classList.add('over'); });
document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; dz()?.classList.remove('over'); } });
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault(); dragDepth = 0; dz()?.classList.remove('over');
  const f = e.dataTransfer.files[0]; if (!f) return;
  const p = api.pathForFile(f);
  if (/\.(csv|tsv|txt)$/i.test(p)) { go('csv'); loadCsv(p); }
  else if (/\.(sql|gz)$/i.test(p)) { go('restore'); loadDump(p); }
  else toast('Drop a .sql, .sql.gz or .csv file');
});

/* ================= BOOT ================= */
(async function boot() {
  [S.env, S.conns, S.history, S.presets] = await Promise.all([api.env().catch(() => null), api.connections.list().catch(() => []), api.history.list().catch(() => []), api.presets.list().catch(() => [])]);
  if (S.r.connId && !connById(S.r.connId)) S.r.connId = null;
  if (S.c.connId && !connById(S.c.connId)) S.c.connId = null;
  if (S.e.connId && !connById(S.e.connId)) S.e.connId = null;
  if (!S.r.connId && S.conns.length === 1) S.r.connId = S.conns[0].id;
  if (!S.e.connId && S.conns.length === 1) S.e.connId = S.conns[0].id;
  const openIds = store.get('tree.open', null) ?? (S.conns.length === 1 ? [S.conns[0].id] : []);
  for (const id of openIds) if (connById(id)) T(id).open = true;
  $('#themeBtn').innerHTML = ic('palette');
  renderEnv(); renderConns(); go('restore');
  for (const id of openIds) if (connById(id)) loadTreeDbs(id);
  if (S.e.connId) selectExportConn(S.e.connId);
  const savedTabs = store.get('tabs', null);
  if (savedTabs?.list?.length) {
    S.tabs = savedTabs.list.filter((t) => connById(t.connId)).map((t) => (t.kind === 'query' ? newQuery(t.connId, t.db, t.sql || '', t.title, t.key) : newDv(t.connId, t.db, t.table)));
    S.dv = S.tabs.find((t) => t.key === savedTabs.active) || S.tabs[0] || EMPTY_DV;
  }
  if (S.r.connId) selectRestoreConn(S.r.connId);
  if (S.c.connId) selectCsvConn(S.c.connId);
})();
