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
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
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

const DEFAULT_OPTS = { stripDefiner: true, skipRoutines: false, skipUseCreateDb: true, fixMariaSandbox: true, fixCollation: false, disableFk: true, fastMode: true, skipBinlog: true, force: false };
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
    ['skipBinlog', 'Skip binary log', 'Doesn\'t write the restore to the binary log, so rows hit the disk once, not twice. Replicas won\'t receive it. Needs SESSION_VARIABLES_ADMIN; skipped if not allowed.', null],
    ['force', 'Continue on errors', 'Keep going past failed statements and collect every error.', null],
  ] },
];

const S = {
  view: 'home', conns: [], env: null, history: [],
  r: { file: null, info: null, inspecting: false, connId: store.get('r.connId', null), server: null, dbs: null, dbMode: 'existing', db: null, newDb: '', dbFilter: '', dropFirst: false, tables: null, scanPct: 0, tblFilter: '', noData: new Set(store.get('r.noData', [])), opts: { ...DEFAULT_OPTS, ...store.get('r.opts', {}) } },
  c: { file: null, preview: null, delimiter: null, header: true, connId: store.get('c.connId', null), dbs: null, db: null, tables: null, tableMode: 'new', table: '', newTable: '', mapping: [], opts: { mode: 'insert', emptyAsNull: true, truncate: false, force: false } },
  e: { connId: store.get('e.connId', null), server: null, dbs: null, db: null, dbFilter: '', objects: null, allTables: true, selected: new Set(), noData: new Set(), tFilter: '', file: null, opts: { gzip: true, content: 'both', routines: true, triggers: true, events: false, addDrop: true, createDb: false, ...store.get('e.opts', {}) } },
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
  const items = [['home', 'home', 'Home'], ...S.presets.map((p) => [`quick:${p.id}`, 'rocket', p.name]), ['restore', 'restore', 'Restore dump'], ['export', 'download', 'Export database'], ['csv', 'sheet', 'Import CSV'], ['data', 'table', 'Data & SQL'], ['history', 'history', 'History']];
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
        <span class="row-actions"><button class="icon-btn" data-act="tree-newdb" data-id="${c.id}" title="New database">${ic('plus')}</button><button class="icon-btn" data-act="tree-refresh" data-id="${c.id}" title="Refresh">${ic('refresh')}</button><button class="icon-btn" data-act="edit-conn" data-id="${c.id}" title="Edit connection">${ic('pencil')}</button></span>
      </div>
      ${t.open ? `<div class="tree-kids">${Array.isArray(t.dbs) && t.dbs.length > 6 ? `<div class="tree-filter">${ic('search')}<input placeholder="Filter databases…" value="${esc(t.filter)}" data-input="tree-filter" data-id="${c.id}" spellcheck="false"></div>` : ''}<div data-dbs="${c.id}">${treeDbsHtml(c.id)}</div></div>` : ''}
    </div>`;
  }).join('');
}

function treeDbsHtml(id) {
  const t = T(id);
  if (t.dbs === null) return '<div class="tree-msg">' + ic('loader', 'spin') + 'Loading databases…</div>';
  if (t.dbs.error) return `<div class="tree-msg bad" title="${esc(t.dbs.error)}">${ic('alert')}<span>${esc(t.dbs.error)}</span></div>`;
  if (!t.dbs.length) return `<div class="tree-msg">No databases yet · <a href="#" data-act="tree-newdb" data-id="${id}">Create one</a></div>`;
  const f = t.filter.toLowerCase();
  const list = t.dbs.filter((d) => d.name.toLowerCase().includes(f));
  if (!list.length) return '<div class="tree-msg">No match</div>';
  return list.map((d) => {
    const tables = t.openDbs[d.name];
    const open = tables !== undefined;
    const active = S.dv.connId === id && S.dv.db === d.name;
    return `<div class="tree-row db ${open ? 'open' : ''} ${active && !open ? 'active' : ''}" data-act="tree-db" data-id="${id}" data-db="${esc(d.name)}" title="${esc(d.name)} · ${d.tables} tables · ${fmtBytes(d.size)}">
        <span class="chev">${ic('chev')}</span>${ic('db')}<span class="name">${esc(d.name)}</span><small>${d.tables || ''}</small>
        <span class="row-actions"><button class="icon-btn" data-act="tree-newtable" data-id="${id}" data-db="${esc(d.name)}" title="New table in ${esc(d.name)}">${ic('plus')}</button><button class="icon-btn" data-act="tree-query" data-id="${id}" data-db="${esc(d.name)}" title="New SQL query on ${esc(d.name)}">${ic('code')}</button><button class="icon-btn" data-act="tree-restore" data-id="${id}" data-db="${esc(d.name)}" title="Restore a dump into ${esc(d.name)}">${ic('restore')}</button><button class="icon-btn" data-act="tree-export" data-id="${id}" data-db="${esc(d.name)}" title="Export ${esc(d.name)}">${ic('download')}</button></span>
      </div>
      ${open ? `${Array.isArray(tables) && tables.length > 1 ? `<div class="tree-filter l2">${ic('search')}<input placeholder="Search ${tables.length} tables…" value="${esc(t.tFilter[d.name] || '')}" data-input="tree-tfilter" data-id="${id}" data-db="${esc(d.name)}" spellcheck="false">${t.tFilter[d.name] ? `<button class="icon-btn" data-act="tree-tfilter-clear" data-id="${id}" data-db="${esc(d.name)}" title="Clear">${ic('x')}</button>` : ''}</div>` : ''}<div data-tbls="${id}" data-db="${esc(d.name)}">${treeTablesHtml(id, d.name, tables)}</div>` : ''}`;
  }).join('');
}

function treeTablesHtml(id, db, tables) {
  if (tables === null) return '<div class="tree-msg l2">' + ic('loader', 'spin') + 'Loading…</div>';
  if (tables.error) return `<div class="tree-msg l2 bad">${esc(tables.error)}</div>`;
  if (!tables.length) return `<div class="tree-msg l2">No tables · <a href="#" data-act="tree-newtable" data-id="${id}" data-db="${esc(db)}">Create one</a></div>`;
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
  store.set('view', view);
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
  renderNav();
  if (view === 'home') renderHome();
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

/* ================= HOME ================= */
const JOB_LABEL = { restore: 'SQL restore', export: 'SQL export', csv: 'CSV import', fetch: 'SCP fetch' };
const histIcon = (x) => (x.status === 'success' ? (x.kind === 'export' ? 'download' : 'check') : x.status === 'cancelled' ? 'ban' : x.status === 'failed' ? 'x' : 'alert');
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function homeJobHtml() {
  const j = S.job;
  if (!j || j.status !== 'running') return '';
  return `<div class="card home-job" data-act="nav" data-view="job">
    <div class="home-job-ico">${ic('loader', 'spin')}</div>
    <div class="home-job-txt"><b>${esc(JOB_LABEL[j.kind] || 'Job')} running · ${esc(j.title)}</b><small id="hj-sub">${esc(j.database || '')}</small></div>
    <div class="home-job-bar"><span id="hj-bar" style="width:${pct(j.progress)}%"></span></div>
    <b class="home-job-pct" id="hj-pct">${Math.floor(pct(j.progress))}%</b>
    <span class="btn sm">View ${ic('arrow')}</span>
  </div>`;
}
function updateHomeJob() {
  const j = S.job; if (!j) return;
  const P = pct(j.progress), p = j.progress || {};
  const bar = $('#hj-bar'); if (bar) bar.style.width = P + '%';
  const pe = $('#hj-pct'); if (pe) pe.textContent = Math.floor(P) + '%';
  const sub = $('#hj-sub'); if (sub) sub.textContent = [j.database, p.table && `table ${p.table}`, p.eta != null && `${fmtDur(p.eta)} left`].filter(Boolean).join(' · ');
}

function homeSetupHtml() {
  const env = S.env;
  const steps = [
    [S.conns.length > 0, 'Add a MySQL / MariaDB connection', 'Local or over an SSH tunnel. Passwords are encrypted with your OS keyring.', S.conns.length ? '' : `<button class="btn sm primary" data-act="add-conn">${ic('plus')}Add connection</button>`],
    [!!env?.mysql?.found, '<code>mysql</code> client installed', 'Needed to restore dumps. Install <b>mysql-client</b> or <b>mariadb-client</b>.', ''],
    [!!env?.dump?.found, '<code>mysqldump</code> installed', 'Needed to export databases. Comes with the same client package.', ''],
  ];
  if (!env || steps.every((x) => x[0])) return '';
  const done = steps.filter((x) => x[0]).length;
  return `<div class="card home-setup">
    <div class="card-head"><h3>Get set up</h3><span class="chip ${done === steps.length ? 'ok' : 'accent'}">${done} of ${steps.length} done</span></div>
    <div class="card-body">${steps.map(([ok, t, d, btn]) => `<div class="home-step ${ok ? 'done' : ''}"><span class="home-check">${ic(ok ? 'check' : 'info')}</span><div class="txt"><b>${t}</b>${ok ? '' : `<small>${d}</small>`}</div>${ok ? '' : btn}</div>`).join('')}</div>
  </div>`;
}

function homeStats() {
  const h = S.history, now = Date.now(), DAY = 86400000;
  const week = h.filter((x) => now - x.at < 7 * DAY);
  const recent = h.slice(0, 30).filter((x) => x.status !== 'cancelled');
  const ok = recent.filter((x) => x.status === 'success').length;
  const restored = h.filter((x) => x.kind === 'restore' && x.status !== 'failed' && x.status !== 'cancelled' && now - x.at < 30 * DAY).reduce((a, x) => a + (x.total || 0), 0);
  const last = h[0];
  return `<div class="stats home-stats">
    <div class="stat"><span>Connections</span><b>${fmtNum(S.conns.length)}</b></div>
    <div class="stat"><span>Jobs this week</span><b>${fmtNum(week.length)}</b></div>
    <div class="stat"><span>Success rate</span><b class="${recent.length && ok / recent.length < 0.7 ? 'err' : ''}">${recent.length ? Math.round((100 * ok) / recent.length) + '%' : '—'}</b></div>
    <div class="stat"><span>Restored · 30 days</span><b>${restored ? fmtBytes(restored) : '—'}</b></div>
  </div>${last ? `<div class="home-last muted">${ic('history')}<span>Last job ${timeAgo(last.at)}: ${esc(JOB_LABEL[last.kind] || last.kind)} of <code>${esc(last.fileName)}</code> → ${esc(last.connName)} / ${esc(last.database)}</span></div>` : ''}`;
}

function homeActionsHtml() {
  const tiles = [
    ['restore', 'restore', 'Restore dump', '.sql / .sql.gz with automatic fixes'],
    ['export', 'download', 'Export database', 'mysqldump to .sql or .sql.gz'],
    ['csv', 'sheet', 'Import CSV', 'Map columns into a new or existing table'],
    ['home-query', 'code', 'New SQL query', 'Ctrl+T · run with Ctrl+Enter'],
  ];
  const presets = S.presets.map((p) => `<button class="home-preset" data-act="nav" data-view="quick:${esc(p.id)}">${ic('rocket')}<span>${esc(p.name)}</span>${ic('chev')}</button>`).join('');
  return `<div class="home-actions" data-drop="home">
    ${tiles.map(([v, i, t, d]) => `<button class="home-tile" ${v === 'home-query' ? 'data-act="home-query"' : `data-act="nav" data-view="${v}"`}><span class="home-tile-ico">${ic(i)}</span><b>${t}</b><small>${d}</small></button>`).join('')}
  </div>
  <div class="home-drop muted">${ic('upload')}<span>Drop a <code>.sql</code>, <code>.sql.gz</code> or <code>.csv</code> file anywhere to start</span></div>
  ${presets ? `<div class="home-presets"><span class="opt-group-label" style="margin:0 6px 0 0">${ic('rocket')}Quick restore</span>${presets}</div>` : ''}`;
}

function homeActivityHtml() {
  const h = S.history.slice(0, 6);
  const body = !h.length
    ? `<div class="home-empty">${ic('history')}<div><b>No jobs yet</b><small>Restores, exports and imports show up here with timing and errors.</small></div></div>`
    : h.map((x) => `<div class="home-row" data-act="home-hist" data-id="${esc(x.id)}">
        <div class="hist-ico ${x.status}">${ic(histIcon(x))}</div>
        <div class="t"><b>${esc(x.fileName)}</b><small><span class="dot" style="color:${esc(x.connColor || '#888')};width:7px;height:7px"></span>${esc(JOB_LABEL[x.kind] || x.kind)} · ${esc(x.connName)} / ${esc(x.database)}${x.errorCount ? ` · <span style="color:var(--danger)">${x.errorCount} err</span>` : ''}</small></div>
        <div class="when">${timeAgo(x.at)}<small>${fmtDur(x.durationMs / 1000)}</small></div>
      </div>`).join('');
  return `<div class="card"><div class="card-head"><h3>Recent activity</h3>${S.history.length ? `<div class="right"><button class="btn sm ghost" data-act="nav" data-view="history">View all ${ic('arrow')}</button></div>` : ''}</div><div class="home-list">${body}</div></div>`;
}

function homeTabsHtml() {
  const tabs = S.tabs.slice(0, 6);
  if (!tabs.length) return '';
  return `<div class="card"><div class="card-head"><h3>Pick up where you left off</h3><div class="right"><span class="chip">${plural(S.tabs.length, 'tab')}</span></div></div><div class="home-list">
    ${tabs.map((t) => { const c = connById(t.connId); const q = t.kind === 'query'; return `<div class="home-row" data-act="home-tab" data-key="${esc(t.key)}">
      <span class="home-row-ico">${ic(q ? 'code' : 'table')}</span>
      <div class="t"><b>${esc(q ? t.title || 'Query' : t.table)}</b><small><span class="dot" style="color:${esc(c?.color || '#888')};width:7px;height:7px"></span>${esc(c?.name || '')}${t.db ? ' / ' + esc(t.db) : ''}</small></div>
      ${ic('chev')}
    </div>`; }).join('')}</div></div>`;
}

function homeConnsHtml() {
  if (!S.conns.length) return '';
  return `<div class="card"><div class="card-head"><h3>Connections</h3><div class="right"><button class="btn sm ghost" data-act="add-conn">${ic('plus')}Add</button></div></div><div class="home-list">
    ${S.conns.map((c) => `<div class="home-row" data-act="home-conn" data-id="${esc(c.id)}">
      <span class="dot" style="color:${esc(c.color)};margin:0 4px"></span>
      <div class="t"><b>${esc(c.name)}</b><small class="mono">${esc(c.user)}@${esc(c.host)}:${c.port}${c.ssh?.enabled ? ' · via SSH' : ''}</small></div>
      <span class="row-actions"><button class="icon-btn" data-act="tree-query" data-id="${esc(c.id)}" title="New SQL query">${ic('code')}</button><button class="icon-btn" data-act="home-restore" data-id="${esc(c.id)}" title="Restore a dump">${ic('restore')}</button><button class="icon-btn" data-act="home-export" data-id="${esc(c.id)}" title="Export">${ic('download')}</button><button class="icon-btn" data-act="edit-conn" data-id="${esc(c.id)}" title="Edit">${ic('pencil')}</button></span>
    </div>`).join('')}</div></div>`;
}

function renderHome() {
  const el = $('#view-home'); if (!el) return;
  el.innerHTML = `
    <div class="page-head"><div><h1>${greeting()}</h1><p>${S.conns.length ? `${plural(S.conns.length, 'connection')} ready. What would you like to do?` : 'Restore, export, import and browse MySQL / MariaDB databases.'}</p></div>
      <div style="display:flex;gap:8px"><button class="btn ghost" data-act="theme-open">${ic('palette')}Theme</button><button class="btn" data-act="upd-whatsnew">${ic('info')}What's new${S.env?.version ? ` · v${esc(S.env.version)}` : ''}</button></div></div>
    ${homeJobHtml()}
    ${homeSetupHtml()}
    ${homeActionsHtml()}
    ${homeStats()}
    <div class="home-cols">
      <div class="stack">${homeActivityHtml()}</div>
      <div class="stack">${homeTabsHtml()}${homeConnsHtml()}</div>
    </div>`;
  if (S.job?.status === 'running') updateHomeJob();
}

/* ================= RESTORE ================= */
function renderRestore() {
  const el = $('#view-restore');
  el.innerHTML = `
    <div class="page-head"><div><h1>Restore a database dump</h1><p>Stream .sql or .sql.gz dumps into MySQL or MariaDB, and fix the usual errors on the way in.</p></div></div>
    <div class="grid-2">
      <div class="stack">
        <div class="card" id="r-source"></div>
        <div class="card" id="r-tables" hidden></div>
        <div class="card" id="r-target"></div>
      </div>
      <div class="sticky"><div class="card" id="r-options"></div></div>
    </div>`;
  renderSource(); renderRestoreTables(); renderTarget(); renderOptions();
}

// Tables found in the dump whose rows will be left out (structure only).
// The choice is remembered by table name, so it carries over to the next dump of the same database.
function restoreNoData() {
  const r = S.r;
  if (!Array.isArray(r.tables)) return [];
  return r.tables.filter((t) => t.dataBytes && r.noData.has(t.name));
}

function renderRestoreTables() {
  const el = $('#r-tables'); if (!el) return;
  const r = S.r;
  el.hidden = !r.info;
  if (!r.info) return;
  let body, right = '';
  if (r.tables === null) body = `<div class="db-empty" style="padding:8px 0">Reading tables…</div>`;
  else if (r.tables.scanning) body = `<div class="scan-bar"><span id="r-scanbar" style="width:${r.scanPct}%"></span></div><small class="muted" style="display:block;margin-top:8px">Reading tables in the dump… <span id="r-scanpct">${r.scanPct}%</span></small>`;
  else if (r.tables.error) body = `<div class="callout danger">${ic('alert')}<div>Could not read the tables: ${esc(r.tables.error)}</div></div>`;
  else if (!r.tables.length) body = `<div class="callout info">${ic('info')}<div>No CREATE TABLE or INSERT statements found in this dump.</div></div>`;
  else {
    const total = r.tables.reduce((s, t) => s + t.dataBytes, 0);
    const off = restoreNoData(), offBytes = off.reduce((s, t) => s + t.dataBytes, 0);
    right = `<span class="chip">${plural(r.tables.length, 'table')} · ${fmtBytes(total)} of rows</span>`;
    const f = r.tblFilter.toLowerCase();
    const list = r.tables.filter((t) => t.name.toLowerCase().includes(f)).sort((a, b) => b.dataBytes - a.dataBytes || a.name.localeCompare(b.name));
    body = `<div style="display:flex;gap:8px;align-items:center">
        <div class="input-icon" style="flex:1">${ic('search')}<input class="input" placeholder="Filter tables…" value="${esc(r.tblFilter)}" data-input="r-tblfilter" spellcheck="false"></div>
        <button class="btn sm ghost" data-act="r-data-all" data-on="1">All data</button><button class="btn sm ghost" data-act="r-data-all" data-on="0">No data</button></div>
      <small class="muted" style="display:block;margin-top:8px">Every table is created. Switch a table to <b>No data</b> to skip its rows.${off.length ? ` Skipping <b>${fmtBytes(offBytes)}</b> in ${plural(off.length, 'table')}.` : ''}</small>
      <div class="db-list tbl-list" id="r-tlist">${list.map((t) => {
        const data = !r.noData.has(t.name);
        const tog = t.dataBytes ? `<button class="data-tog ${data ? 'on' : ''}" data-act="r-tdata" data-name="${esc(t.name)}" title="${data ? 'Rows will be restored. Click for structure only.' : 'Structure only. Click to restore rows too.'}">${data ? 'Data' : 'No data'}</button>` : '';
        return `<div class="db-row ${t.dataBytes && !data ? 'no-data' : ''}"><label>${ic('table')}<b>${esc(t.name)}</b><small>${t.dataBytes ? fmtBytes(t.dataBytes) : 'no rows'}</small></label>${tog}</div>`;
      }).join('') || '<div class="db-empty">No match</div>'}</div>`;
  }
  el.innerHTML = `<div class="card-head"><span class="step">${ic('table')}</span><h3>Tables</h3><div class="right">${right}</div></div><div class="card-body">${body}</div>`;
}

async function scanRestoreTables(path) {
  const r = S.r;
  r.tables = { scanning: true }; r.scanPct = 0; renderRestoreTables();
  let res;
  try { res = await api.dumpTables(path); } catch (e) { res = /cancelled/.test(e.message) ? null : { error: e.message }; }
  if (r.file !== path || !res) return;
  r.tables = res;
  renderRestoreTables(); renderOptions();
}
api.onDumpScan((m) => {
  if (m.path !== S.r.file || !S.r.tables?.scanning) return;
  S.r.scanPct = Math.min(100, Math.round((m.bytes / (m.total || 1)) * 100));
  const b = $('#r-scanbar'), p = $('#r-scanpct');
  if (b) b.style.width = S.r.scanPct + '%';
  if (p) p.textContent = S.r.scanPct + '%';
});

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
        ${restoreNoData().length ? `<div class="line"><span>No data</span><b>${plural(restoreNoData().length, 'table')}</b><b class="muted" style="font-weight:400">· ${fmtBytes(restoreNoData().reduce((s, t) => s + t.dataBytes, 0))}</b></div>` : ''}
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
    S.r.info = info; S.r.file = path; S.r.tblFilter = '';
    if (info.hasMariaSandbox) S.r.opts.fixMariaSandbox = true;
    if (info.hasUseOrCreateDb) S.r.opts.skipUseCreateDb = true;
    if (info.hasDefiner) S.r.opts.stripDefiner = true;
    if (info.has0900 && /maria|^5\./i.test(S.r.server?.version || '')) S.r.opts.fixCollation = true;
    if (!S.r.newDb && info.sourceDb) S.r.newDb = info.sourceDb;
  } catch (e) { toast('Could not read file: ' + e.message); }
  S.r.inspecting = false;
  renderSource(); renderOptions();
  if (S.r.file === path && S.r.info) scanRestoreTables(path); else renderRestoreTables();
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
  const payload = { file: r.file, connId: r.connId, database, createDb: r.dbMode === 'new', dropFirst: r.dbMode === 'existing' && r.dropFirst, ...r.opts, noData: restoreNoData().map((t) => t.name) };
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
  if (e.allTables) return e.objects;
  // Data-only dumps skip tables whose data was switched off: there would be nothing left of them.
  return e.objects.filter((o) => e.selected.has(o.name) && !(e.opts.content === 'data' && hasData(o) && e.noData.has(o.name)));
}
// Views carry no rows, so the per-table data toggle only applies to base tables.
const hasData = (o) => !o.view;
// Tables dumped with structure only (per-table data toggle, Choose tables mode only).
function exportNoData() {
  const e = S.e;
  if (e.allTables || e.opts.content !== 'both') return [];
  return exportTables().filter((o) => hasData(o) && e.noData.has(o.name)).map((o) => o.name);
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
    const dataToggles = e.opts.content !== 'schema';
    body = `<div style="display:flex;gap:8px;align-items:center">
        <div class="input-icon" style="flex:1">${ic('search')}<input class="input" placeholder="Filter tables…" value="${esc(e.tFilter)}" data-input="e-tfilter" spellcheck="false"></div>
        <button class="btn sm ghost" data-act="e-sel-all">Select all</button><button class="btn sm ghost" data-act="e-sel-none">None</button></div>
      ${dataToggles ? `<div class="tbl-data-head"><small class="muted">Data column: include rows, or dump the structure only.</small><span><button class="btn sm ghost" data-act="e-data-all" data-on="1">All data</button><button class="btn sm ghost" data-act="e-data-all" data-on="0">No data</button></span></div>` : ''}
      <div class="db-list tbl-list" id="e-tlist">${list.map((o) => {
        const sel = e.selected.has(o.name), data = !e.noData.has(o.name);
        const tog = dataToggles && hasData(o) ? `<button class="data-tog ${data ? 'on' : ''}" data-act="e-tdata" data-name="${esc(o.name)}" ${sel ? '' : 'disabled'} title="${data ? 'Rows included. Click for structure only.' : 'Structure only. Click to include rows.'}">${data ? 'Data' : 'No data'}</button>` : '';
        return `<div class="db-row ${sel && !data && dataToggles && hasData(o) ? 'no-data' : ''}"><label><input type="checkbox" class="check" data-change="e-tbl" data-name="${esc(o.name)}" ${sel ? 'checked' : ''}>
          ${ic(o.view ? 'eye' : 'table')}<b>${esc(o.name)}</b><small>${o.view ? 'view' : `~${fmtCompact(o.rows)} rows · ${fmtBytes(o.size)}`}</small></label>${tog}</div>`;
      }).join('') || '<div class="db-empty">No match</div>'}</div>`;
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
  const noData = new Set(exportNoData());
  const est = o.content === 'schema' ? 0 : tables.reduce((s, t) => s + (noData.has(t.name) ? 0 : t.data || 0), 0);
  const ready = conn && e.db && Array.isArray(e.objects) && (e.allTables || tables.length) && S.env?.dump?.found;
  const opt = (k, t, d, disabled) => `<label class="opt ${disabled ? 'off' : ''}"><div class="txt"><b>${t}</b><small>${d}</small></div>${sw(`data-change="e-opt" data-key="${k}" ${disabled ? 'disabled' : ''}`, o[k] && !disabled)}</label>`;
  const schemaOnlyOff = o.content === 'data';
  $('#e-options').innerHTML = `
    <div class="card-head"><span class="step ${ready ? 'done' : ''}">${ready ? ic('check') : '3'}</span><h3>Export</h3></div>
    <div class="card-body">
      <div class="summary">
        <div class="line"><span>From</span>${conn ? `<span class="dot" style="color:${esc(conn.color)};width:8px;height:8px"></span><b>${esc(conn.name)}</b>` : '<b class="muted">No server</b>'}${e.db ? `<b class="mono" style="color:var(--accent)">/ ${esc(e.db)}</b>` : ''}</div>
        <div class="line"><span>Tables</span><b class="${tables.length ? '' : 'muted'}">${Array.isArray(e.objects) ? (e.allTables ? `All (${e.objects.length})` : `${tables.length} selected`) : '—'}</b>${est ? `<b class="muted" style="font-weight:400">· ~${fmtBytes(est)} of data</b>` : ''}</div>
        ${noData.size ? `<div class="line"><span>Structure only</span><b>${plural(noData.size, 'table')}</b></div>` : ''}
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
  e.db = name; e.objects = null; e.selected = new Set(); e.noData = new Set(); e.tFilter = '';
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
  const noData = exportNoData();
  const weights = Object.fromEntries(tables.map((t) => [t.name, noData.includes(t.name) ? 0 : t.data]));
  const payload = { connId: e.connId, database: e.db, tables: tables.map((t) => t.name), noData, allTables: e.allTables, weights, file, ...o, createDb: o.createDb && e.allTables };
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
const newDv = (connId = null, db = null, table = null) => ({ key: JSON.stringify([connId, db, table]), connId, db, table, filters: {}, search: '', sort: [], offset: 0, limit: store.get('dv.limit', 200), data: null, loading: false, error: null, sel: null, range: null, ch: { edits: {}, deletes: {}, inserts: [], undo: [] }, saving: false, seq: 0, scroll: null, refs: null, colSearch: '', refSearch: '', hidden: new Set(table ? store.get(`hide.${connId}.${db}.${table}`, []) : []) });
const saveHidden = (d) => store.set(`hide.${d.connId}.${d.db}.${d.table}`, [...d.hidden]);
let panelOpen = store.get('dv.panel', true);
const fkOf = (d, col) => d.refs?.out.find((f) => f.columns.includes(col));
const EMPTY_DV = newDv();
S.dv = EMPTY_DV;
const saveTabs = () => store.set('tabs', { list: S.tabs.map(({ kind, key, title, sql, connId, db, table }) => (kind === 'query' ? { kind, key, title, sql, connId, db } : { connId, db, table })), active: S.dv.key });
let saveTabsTimer = null;
const saveTabsSoon = () => { clearTimeout(saveTabsTimer); saveTabsTimer = setTimeout(saveTabs, 400); };
// Flush pending SQL edits when the window closes, so the last keystrokes aren't lost.
window.addEventListener('beforeunload', () => { clearTimeout(saveTabsTimer); saveTabs(); });
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
async function closeTab(key) {
  const i = S.tabs.findIndex((t) => t.key === key); if (i < 0) return;
  if (S.tabs[i].kind !== 'query' && hasChanges(S.tabs[i]) && !(await api.confirm({ title: 'Unsaved changes', message: `Close ${S.tabs[i].table} without saving?`, detail: 'Your edits to this table have not been saved and will be lost.', ok: 'Discard changes' }))) return;
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
        ${t.loading ? ic('loader', 'spin') : ic(t.kind === 'query' ? 'code' : 'table')}<span>${esc(t.kind === 'query' ? t.title : t.table)}</span>${t.kind !== 'query' && hasChanges(t) ? '<span class="tab-unsaved" title="Unsaved changes">●</span>' : ''}${Object.values(t.filters).some((v) => String(v).trim()) || t.search.trim() ? '<span class="tab-dot" title="Filtered"></span>' : ''}
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
    <div class="dv-changes" id="dv-changes"></div>
    <div class="dv-grid ${d.loading ? 'loading' : ''}" id="dv-grid" tabindex="-1"><table class="grid"><thead id="dv-thead"></thead><tbody id="dv-tbody"></tbody></table><div id="dv-msg"></div></div>
    <div class="dv-status" id="dv-status"></div>
    </div></div>
  </div>`;
  renderTabs(); renderSide(); renderDataHead(); renderDataBody();
  if (d.scroll) { const g = $('#dv-grid'); g.scrollTop = d.scroll[0]; g.scrollLeft = d.scroll[1]; }
}

function filterInfo() {
  const d = S.dv;
  const n = Object.values(d.filters).filter((v) => String(v).trim()).length + (d.search.trim() ? 1 : 0);
  return `<span class="chip ${n ? 'accent' : ''}" title="Filter syntax: text = contains · =x exact · !x not containing · >5 <5 >=5 <=5 · a*b wildcards · IN a,b,c · NULL / NOT NULL · EMPTY">${ic('filter')}${n ? `${n} filter${n > 1 ? 's' : ''}` : 'No filters'}</span>${n ? `<button class="btn sm ghost" data-act="dv-clear">${ic('x')}Clear</button>` : ''}`;
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
  <tr class="frow"><th class="rn">${ic('filter')}</th>${vis.map((c) => `<th><div class="fcell"><input class="finput ${String(d.filters[c.name] || '').trim() ? 'on' : ''}" data-input="dv-filter" data-col="${esc(c.name)}" value="${esc(d.filters[c.name] || '')}" placeholder="Filter" spellcheck="false"><button class="fbtn" data-act="dv-fmenu" data-col="${esc(c.name)}" title="Filter options">${ic('sortDown')}</button></div></th>`).join('')}</tr>`;
}

const NUM_T = /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|year|bit)$/;
const EMPTY_NULL_T = /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|year|bit|date|datetime|timestamp|time)$/;
const UNSET = Symbol('unset');

/* ---- change tracking for the data grid ---- */
const pkCols = (d) => (d.data ? d.data.columns.filter((c) => c.pk) : []);
const canEdit = (d) => !!(d.data && d.kind !== 'query' && pkCols(d).length);
const rowKeyObj = (d, row) => Object.fromEntries(d.data.columns.map((c, i) => [c, i]).filter(([c]) => c.pk).map(([c, i]) => [c.name, row[i]]));
const rowKey = (d, row) => JSON.stringify(pkCols(d).map((c) => row[d.data.columns.indexOf(c)]));
const nRows = (d) => (d.data ? d.data.rows.length + d.ch.inserts.length : 0);
const isInsert = (d, r) => d.data && r >= d.data.rows.length;
const hasChanges = (d) => !!(d && d.ch && (Object.keys(d.ch.edits).length || Object.keys(d.ch.deletes).length || d.ch.inserts.length));
function changeCounts(d) {
  const cells = Object.values(d.ch.edits).reduce((s, e) => s + Object.keys(e.set).length, 0);
  return { cells, rows: Object.keys(d.ch.edits).length, deleted: Object.keys(d.ch.deletes).length, inserted: d.ch.inserts.length };
}
// Current value of a cell (edits applied). UNSET = new row cell left to its default.
function cellAt(d, r, ci) {
  const col = d.data.columns[ci];
  if (isInsert(d, r)) { const ins = d.ch.inserts[r - d.data.rows.length]; return col.name in ins.values ? ins.values[col.name] : UNSET; }
  const row = d.data.rows[r], e = d.ch.edits[rowKey(d, row)];
  return e && col.name in e.set ? e.set[col.name] : row[ci];
}
const isChanged = (d, r, ci) => { if (isInsert(d, r)) return false; const e = d.ch.edits[rowKey(d, d.data.rows[r])]; return !!(e && d.data.columns[ci].name in e.set); };
const isDeleted = (d, r) => !isInsert(d, r) && rowKey(d, d.data.rows[r]) in d.ch.deletes;
const rowValues = (d, r) => d.data.columns.map((_, ci) => { const v = cellAt(d, r, ci); return v === UNSET ? null : v; });
function snapshot(d) {
  d.ch.undo.push(JSON.stringify({ edits: d.ch.edits, deletes: d.ch.deletes, inserts: d.ch.inserts }));
  if (d.ch.undo.length > 200) d.ch.undo.shift();
}
function setCells(d, cells, value) {
  if (!canEdit(d)) return noEditToast(d);
  const ok = cells.filter(({ r, ci }) => { const v = isInsert(d, r) ? null : d.data.rows[r][ci]; return !(v && typeof v === 'object'); });
  if (ok.length < cells.length) toast('Binary and very long values can only be changed with SQL');
  if (!ok.length) return;
  snapshot(d);
  for (const { r, ci } of ok) {
    const col = d.data.columns[ci];
    if (isInsert(d, r)) { d.ch.inserts[r - d.data.rows.length].values[col.name] = value; continue; }
    const row = d.data.rows[r], k = rowKey(d, row);
    const e = d.ch.edits[k] || (d.ch.edits[k] = { key: rowKeyObj(d, row), set: {} });
    const orig = row[ci];
    if ((orig === null && value === null) || (orig !== null && value !== null && String(orig) === String(value))) delete e.set[col.name];
    else e.set[col.name] = value;
    if (!Object.keys(e.set).length) delete d.ch.edits[k];
  }
  afterChange(d);
}
function afterChange(d) { renderDataBody(); renderTabs(); renderChangesBar(); }
function noEditToast(d) {
  toast(d.data && !pkCols(d).length ? 'This table has no primary key, so its rows cannot be edited here. Use the SQL editor instead.' : 'This data cannot be edited');
}
const selRows = (d) => { if (!d.range) return d.sel ? [d.sel.r] : []; const out = []; for (let r = d.range.r1; r <= d.range.r2; r++) out.push(r); return out; };
function selCells(d) {
  if (!d.data) return [];
  const vis = visibleCols(d);
  if (!d.range) return d.sel ? [{ r: d.sel.r, ci: d.sel.c }] : [];
  const out = [];
  for (let r = d.range.r1; r <= d.range.r2; r++) for (let p = d.range.p1; p <= d.range.p2; p++) out.push({ r, ci: vis[p] });
  return out;
}
const visibleCols = (d) => d.data.columns.map((c, i) => i).filter((i) => !d.hidden.has(d.data.columns[i].name));

const gridOps = {
  setNull(d) { const cells = selCells(d).filter(({ r }) => !isDeleted(d, r)); if (cells.length) setCells(d, cells, null); },
  deleteRows(d) {
    if (!canEdit(d)) return noEditToast(d);
    const rows = [...new Set(selRows(d))]; if (!rows.length) return;
    snapshot(d);
    const insIdx = rows.filter((r) => isInsert(d, r)).map((r) => r - d.data.rows.length);
    for (const r of rows) if (!isInsert(d, r)) { const row = d.data.rows[r], k = rowKey(d, row); if (k in d.ch.deletes) delete d.ch.deletes[k]; else d.ch.deletes[k] = rowKeyObj(d, row); }
    d.ch.inserts = d.ch.inserts.filter((_, i) => !insIdx.includes(i));
    d.range = null; if (d.sel && d.sel.r >= nRows(d)) d.sel = null;
    afterChange(d);
  },
  newRow(d, clone = false) {
    if (!canEdit(d)) return noEditToast(d);
    snapshot(d);
    const rows = clone ? [...new Set(selRows(d))] : [null];
    for (const r of rows) {
      const values = {};
      if (r != null) d.data.columns.forEach((c, ci) => { if (c.auto) return; const v = cellAt(d, r, ci); if (v !== UNSET && !(v && typeof v === 'object')) values[c.name] = v; });
      d.ch.inserts.push({ id: Date.now() + Math.random(), values });
    }
    const vis = visibleCols(d), r = nRows(d) - 1;
    d.sel = { r, c: vis.find((ci) => !d.data.columns[ci].auto) ?? vis[0] }; d.range = null;
    afterChange(d);
    scrollToSel(d);
  },
  revertRows(d) {
    const rows = [...new Set(selRows(d))]; if (!rows.length) return;
    snapshot(d);
    const insIdx = rows.filter((r) => isInsert(d, r)).map((r) => r - d.data.rows.length);
    for (const r of rows) if (!isInsert(d, r)) { const k = rowKey(d, d.data.rows[r]); delete d.ch.edits[k]; delete d.ch.deletes[k]; }
    d.ch.inserts = d.ch.inserts.filter((_, i) => !insIdx.includes(i));
    if (d.sel && d.sel.r >= nRows(d)) d.sel = null;
    afterChange(d);
  },
  revertAll(d) { if (!hasChanges(d)) return; snapshot(d); d.ch.edits = {}; d.ch.deletes = {}; d.ch.inserts = []; if (d.sel && d.sel.r >= nRows(d)) d.sel = null; afterChange(d); },
  undo(d) {
    const last = d.ch.undo.pop(); if (!last) return toast('Nothing to undo', 'ok');
    Object.assign(d.ch, JSON.parse(last));
    if (d.sel && d.sel.r >= nRows(d)) d.sel = null;
    afterChange(d);
  },
  copy(d, headers = false) {
    if (!d.data) return;
    const vis = visibleCols(d);
    const rr = d.range || (d.sel && { r1: d.sel.r, r2: d.sel.r, p1: vis.indexOf(d.sel.c), p2: vis.indexOf(d.sel.c) });
    if (!rr) return;
    const cell = (v) => (v === null || v === UNSET ? (v === null ? 'NULL' : '') : cellText(v)).replace(/[\t\n\r]+/g, ' ');
    const lines = [];
    if (headers) lines.push(vis.slice(rr.p1, rr.p2 + 1).map((ci) => d.data.columns[ci].name).join('\t'));
    for (let r = rr.r1; r <= rr.r2; r++) lines.push(vis.slice(rr.p1, rr.p2 + 1).map((ci) => cell(cellAt(d, r, ci))).join('\t'));
    navigator.clipboard.writeText(lines.join('\n'));
    const n = (rr.r2 - rr.r1 + 1) * (rr.p2 - rr.p1 + 1);
    toast(n === 1 ? 'Copied value' : `Copied ${fmtNum(n)} cells`, 'ok');
  },
  filterValue(d) {
    if (!d.sel) return; const v = cellAt(d, d.sel.r, d.sel.c); const col = d.data.columns[d.sel.c];
    if (v && typeof v === 'object') return toast("Can't filter by binary or very long values");
    d.filters[col.name] = v === null || v === UNSET ? 'NULL' : '=' + v; d.offset = 0;
    renderData(); fetchData();
  },
  hideColumn(d) { if (!d.sel) return; const name = d.data.columns[d.sel.c].name; if (visibleCols(d).length < 2) return; d.hidden.add(name); saveHidden(d); d.sel = null; d.range = null; refreshCols(); },
  async showSql(d) {
    if (!hasChanges(d)) return toast('No pending changes', 'ok');
    let lines;
    try { lines = await api.previewEdits(d.connId, d.db, d.table, changesPayload(d)); } catch (e) { return toast(e.message); }
    showValue('Pending changes', `${lines.length} statement${lines.length === 1 ? '' : 's'} · run in one transaction on save`, lines.join(';\n') + ';');
  },
  async save(d) {
    if (!hasChanges(d) || d.saving) return;
    if (!canEdit(d)) return noEditToast(d);
    d.saving = true; renderChangesBar();
    try {
      const r = await api.saveEdits(d.connId, d.db, d.table, changesPayload(d));
      d.ch = { edits: {}, deletes: {}, inserts: [], undo: [] };
      toast(`Saved ${[r.updated && plural(r.updated, 'update'), r.deleted && plural(r.deleted, 'delete'), r.inserted && plural(r.inserted, 'insert')].filter(Boolean).join(', ')}`, 'ok');
      d.saving = false; renderTabs(); renderChangesBar();
      fetchData(d);
    } catch (e) {
      d.saving = false; renderChangesBar();
      showValue('Changes were not saved', 'Nothing was applied: the whole save was rolled back. Fix the value and press Ctrl+S again.', e.message);
    }
  },
};
const changesPayload = (d) => ({ updates: Object.values(d.ch.edits), deletes: Object.values(d.ch.deletes).map((key) => ({ key })), inserts: d.ch.inserts.map((i) => ({ values: i.values })) });

function renderChangesBar() {
  const d = S.dv, el = $('#dv-changes'); if (!el) return;
  if (!d.data || !hasChanges(d)) { el.innerHTML = ''; el.classList.remove('on'); return; }
  const n = changeCounts(d);
  el.classList.add('on');
  el.innerHTML = `${ic('pencil')}<span class="dvc-text"><b>Unsaved</b> ${[n.cells && plural(n.cells, 'edit'), n.inserted && `${fmtNum(n.inserted)} new`, n.deleted && `${fmtNum(n.deleted)} deleted`].filter(Boolean).join(' · ')}</span>
    <div class="spacer"></div>
    <button class="btn sm ghost" data-act="g-sql">${ic('code')}Show SQL</button>
    <button class="btn sm ghost" data-act="g-undo" title="Ctrl+Z">${ic('retry')}Undo</button>
    <button class="btn sm ghost" data-act="g-revert-all">${ic('x')}Revert all</button>
    <button class="btn sm primary" data-act="g-save" ${d.saving ? 'disabled' : ''}>${d.saving ? ic('loader', 'spin') + 'Saving…' : ic('check') + 'Save <kbd>Ctrl+S</kbd>'}</button>`;
}

function cellHtml(v, c, r, ci, flags = {}) {
  const d = S.dv;
  const cls = [flags.changed && 'chg', d.sel && d.sel.r === r && d.sel.c === ci && 'sel', inRange(d, r, ci) && 'in-range'].filter(Boolean).join(' ');
  const attrs = `data-r="${r}" data-c="${ci}"`;
  if (v === UNSET) return `<td class="unset ${cls}" ${attrs}>${c.auto ? '(auto)' : '(default)'}</td>`;
  if (v === null) return `<td class="null ${cls}" ${attrs}>NULL</td>`;
  if (typeof v === 'object' && v.bin != null) return `<td class="bin ${cls}" ${attrs}>(${fmtBytes(v.bin)} binary)</td>`;
  const s = typeof v === 'object' ? v.text + '…' : String(v);
  const short = s.length > 200 ? s.slice(0, 200) + '…' : s;
  const fk = fkOf(d, c.name);
  const go = fk && fk.columns.length === 1 && !flags.insert ? `<button class="fk-go" data-act="dv-follow" data-r="${r}" data-c="${ci}" title="Open the ${esc(fk.refTable)} row with ${esc(fk.refColumns[0])} = ${esc(short)}">${ic('arrowUpRight')}</button>` : '';
  return `<td class="${NUM_T.test(c.dataType) ? 'num' : ''}${fk ? ' fkc' : ''} ${cls}" ${attrs}>${go}${esc(short.replace(/\s+/g, ' '))}</td>`;
}
function inRange(d, r, ci) {
  const g = d.range; if (!g) return false;
  if (r < g.r1 || r > g.r2) return false;
  const p = visibleCols(d).indexOf(ci);
  return p >= g.p1 && p <= g.p2;
}

/* ---- virtual scrolling: only rows near the viewport are in the DOM ---- */
const VIRT_MIN = 150, VIRT_OVER = 40, VIRT_CHUNK = 20;
let rowH = 27; // measured from a rendered row
// Which rows [start, end) to render for a scroller whose table has n body rows.
function virtWindow(scroller, n) {
  if (n <= VIRT_MIN || !scroller) return [0, n];
  const headH = scroller.querySelector('thead')?.offsetHeight || 0;
  const first = Math.floor(Math.max(0, scroller.scrollTop - headH) / rowH);
  const shown = Math.ceil(scroller.clientHeight / rowH);
  const start = Math.max(0, Math.floor((first - VIRT_OVER) / VIRT_CHUNK) * VIRT_CHUNK);
  const end = Math.min(n, Math.ceil((first + shown + VIRT_OVER) / VIRT_CHUNK) * VIRT_CHUNK);
  return [start, Math.max(end, Math.min(n, start + VIRT_CHUNK))];
}
const vpad = (rows, cols) => (rows > 0 ? `<tr class="vpad"><td colspan="${cols}" style="height:${rows * rowH}px"></td></tr>` : '');
// Re-measure the row height; true if it changed (the caller should re-render).
function measureRowH(tbody) {
  const tr = tbody.querySelector('tr:not(.vpad)'); if (!tr) return false;
  const h = tr.getBoundingClientRect().height;
  if (h > 0 && Math.abs(h - rowH) > 0.5) { rowH = h; return true; }
  return false;
}
// Keep columns from shrinking when other rows scroll into view (widths only grow).
function lockColWidths(thead, store) {
  for (const th of thead?.rows[0]?.cells || []) {
    const k = th.dataset.col ?? th.dataset.c; if (k == null) continue;
    const w = th.offsetWidth; if (w > (store[k] || 0)) store[k] = w;
    th.style.minWidth = store[k] + 'px';
  }
}

function renderDataBody() {
  const d = S.dv;
  if (gridEditor) { const ed = gridEditor; gridEditor = null; ed.inp.remove(); }
  const grid = $('#dv-grid'); if (!grid) return;
  grid.classList.toggle('loading', d.loading);
  const msg = $('#dv-msg');
  if (d.error) {
    $('#dv-tbody').innerHTML = ''; d.vwin = null;
    msg.innerHTML = `<div class="callout danger" style="margin:16px">${ic('alert')}<div>${esc(d.error)}</div></div>`;
  } else if (!d.data) {
    msg.innerHTML = '<div style="padding:12px">' + '<div class="skeleton"></div>'.repeat(8) + '</div>';
  } else {
    paintDataRows(true);
    msg.innerHTML = nRows(d) ? '' : `<div class="dv-none">${ic('search')}<b>No rows</b><span>${Object.values(d.filters).some((v) => String(v).trim()) || d.search.trim() ? 'Nothing matches your filters.' : 'This table is empty.'}${canEdit(d) ? ' Press <kbd>Insert</kbd> to add a row.' : ''}</span></div>`;
  }
  renderPager(); renderDataStatus(); renderChangesBar();
}
// Renders the rows of the data grid that are near the viewport. Without force it
// does nothing when the visible window has not changed (used while scrolling).
function paintDataRows(force = false) {
  const d = S.dv, grid = $('#dv-grid'), tb = $('#dv-tbody'); if (!grid || !tb || !d.data) return;
  const n = nRows(d), [start, end] = virtWindow(grid, n);
  if (!force && d.vwin && d.vwin[0] === start && d.vwin[1] === end && d.vwin[2] === n) return;
  d.vwin = [start, end, n];
  const { columns, offset } = d.data;
  const vis = visibleCols(d);
  const rowHtml = (r) => {
    const ins = isInsert(d, r), del = !ins && isDeleted(d, r);
    const rowSel = d.range && r >= d.range.r1 && r <= d.range.r2 && d.range.p1 === 0 && d.range.p2 === vis.length - 1;
    return `<tr class="${ins ? 'ins' : ''}${del ? ' del' : ''}${rowSel ? ' row-sel' : ''}"><td class="rn" data-rn="${r}">${ins ? '+' : fmtNum(offset + r + 1)}</td>${vis.map((ci) => cellHtml(cellAt(d, r, ci), columns[ci], r, ci, { changed: isChanged(d, r, ci), insert: ins })).join('')}</tr>`;
  };
  const out = [vpad(start, vis.length + 1)];
  for (let r = start; r < end; r++) out.push(rowHtml(r));
  out.push(vpad(n - end, vis.length + 1));
  tb.innerHTML = out.join('');
  if (n > VIRT_MIN) {
    if (measureRowH(tb)) return paintDataRows(true);
    if (!d.colW || d.colW.data !== d.data) d.colW = { data: d.data, w: {} };
    lockColWidths($('#dv-thead'), d.colW.w);
  }
}

// Update selection classes without re-rendering the grid.
function paintSelection() {
  const d = S.dv, tb = $('#dv-tbody'); if (!tb || !d.data) return;
  const vis = visibleCols(d);
  for (const tr of tb.rows) {
    if (tr.classList.contains('vpad')) continue;
    const r = Number(tr.cells[0]?.dataset.rn);
    tr.classList.toggle('row-sel', !!(d.range && r >= d.range.r1 && r <= d.range.r2 && d.range.p1 === 0 && d.range.p2 === vis.length - 1));
    for (let k = 1; k < tr.cells.length; k++) {
      const td = tr.cells[k], ci = Number(td.dataset.c);
      td.classList.toggle('sel', !!(d.sel && d.sel.r === r && d.sel.c === ci));
      td.classList.toggle('in-range', inRange(d, r, ci));
    }
  }
  renderDataStatus();
  const rl = $('#dv-reflist'); if (rl) rl.innerHTML = refListHtml();
}
function scrollToSel(d) {
  if (!d.sel) return;
  const find = () => $(`#dv-tbody td[data-r="${d.sel.r}"][data-c="${d.sel.c}"]`);
  let td = find();
  if (!td) { // row is outside the rendered window: scroll to where it sits, then render it
    const g = $('#dv-grid'); if (!g) return;
    const headH = $('#dv-thead')?.offsetHeight || 0, y = d.sel.r * rowH;
    g.scrollTop = y < g.scrollTop ? y : y + rowH + headH - g.clientHeight;
    paintDataRows(); td = find();
  }
  td?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ---- selection + inline editing ---- */
let gridDrag = null, gridEditor = null;
function selectTo(d, r, ci, extend) {
  const vis = visibleCols(d);
  if (!extend || !d.anchor) { d.anchor = { r, p: vis.indexOf(ci) }; d.range = null; }
  else {
    const p = vis.indexOf(ci);
    d.range = { r1: Math.min(d.anchor.r, r), r2: Math.max(d.anchor.r, r), p1: Math.min(d.anchor.p, p), p2: Math.max(d.anchor.p, p) };
    if (d.range.r1 === d.range.r2 && d.range.p1 === d.range.p2) d.range = null;
  }
  d.sel = { r, c: ci };
  paintSelection();
}
function selectRows(d, r1, r2) {
  const vis = visibleCols(d);
  d.range = { r1: Math.min(r1, r2), r2: Math.max(r1, r2), p1: 0, p2: vis.length - 1 };
  d.sel = { r: r2, c: vis[0] };
  paintSelection();
}
function startEdit(d, initial) {
  if (!d.sel || !d.data) return;
  if (!canEdit(d)) return noEditToast(d);
  const { r, c: ci } = d.sel;
  if (isDeleted(d, r)) return toast('This row is marked for deletion. Revert it first (Ctrl+U).');
  const cur = cellAt(d, r, ci);
  if (cur && typeof cur === 'object') return toast('Binary and very long values can only be changed with SQL');
  if (initial == null && isJsonCell(d.data.columns[ci], cur)) return openJsonEdit(d, r, ci, cur);
  if (!$(`#dv-tbody td[data-r="${r}"][data-c="${ci}"]`)) scrollToSel(d);
  const td = $(`#dv-tbody td[data-r="${r}"][data-c="${ci}"]`); if (!td) return;
  closeEditor(false);
  const box = td.getBoundingClientRect(), grid = $('#dv-grid'), gb = grid.getBoundingClientRect();
  const inp = document.createElement('input');
  inp.className = 'cell-editor mono';
  inp.value = initial != null ? initial : cur === null || cur === UNSET ? '' : String(cur);
  inp.placeholder = cur === null ? 'NULL' : '';
  Object.assign(inp.style, { left: box.left - gb.left + grid.scrollLeft + 'px', top: box.top - gb.top + grid.scrollTop + 'px', width: Math.max(box.width, 140) + 'px', height: box.height + 'px' });
  grid.appendChild(inp);
  gridEditor = { d, r, ci, inp, orig: cur };
  inp.focus();
  if (initial == null) inp.select(); else inp.setSelectionRange(inp.value.length, inp.value.length);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeEditor(false); $('#dv-grid').focus(); }
    else if (e.key === 'Enter') { e.preventDefault(); closeEditor(true); moveSel(d, 1, 0); }
    else if (e.key === 'Tab') { e.preventDefault(); closeEditor(true); moveSel(d, 0, e.shiftKey ? -1 : 1); }
    else if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); closeEditor(false); setCells(d, [{ r, ci }], null); $('#dv-grid').focus(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); closeEditor(true); gridOps.save(d); }
    e.stopPropagation();
  });
  inp.addEventListener('blur', () => { if (gridEditor && gridEditor.inp === inp) closeEditor(true); });
}
function closeEditor(commit) {
  const ed = gridEditor; if (!ed) return;
  gridEditor = null;
  const { d, r, ci, inp, orig } = ed;
  const col = d.data.columns[ci];
  let v = inp.value;
  inp.remove();
  if (!commit) return;
  if (v === '' && (orig === null || orig === UNSET) ) return; // left empty: keep NULL / default
  if (v === '' && EMPTY_NULL_T.test(col.dataType) && col.nullable) v = null;
  if (orig !== UNSET && ((orig === null && v === null) || (orig !== null && v !== null && String(orig) === v))) return;
  setCells(d, [{ r, ci }], v);
  $('#dv-grid')?.focus();
}
/* ---- JSON cell editor (modal) ---- */
// JSON columns, plus MariaDB's JSON alias (longtext) when the value parses as an object/array.
const parseJson = (s) => { try { return { ok: true, v: JSON.parse(s) }; } catch (err) { return { ok: false, err }; } };
function isJsonCell(col, v) {
  if (col.dataType === 'json') return true;
  if (!/text$/.test(col.dataType) || typeof v !== 'string' || !/^\s*[\[{]/.test(v)) return false;
  return parseJson(v).ok;
}
let jsonEd = null;
const fmtJson = (s, pretty) => { const p = parseJson(s); return p.ok ? JSON.stringify(p.v, null, pretty ? 2 : 0) : s; };
function openJsonEdit(d, r, ci, cur) {
  const col = d.data.columns[ci], pretty = store.get('json.pretty', true);
  const raw = cur === null || cur === UNSET ? '' : String(cur);
  jsonEd = { d, r, ci, orig: cur };
  const el = $('#jsonDialog');
  el.innerHTML = `<div class="modal val-modal json-modal">
    <div class="modal-head"><div><h3 class="mono">${esc(col.name)}</h3><p>${esc(col.type || col.dataType)} · row ${fmtNum(d.data.offset + r + 1)}${cur === null ? ' · currently NULL' : ''}</p></div>
      <button class="icon-btn" data-act="json-close">${ic('x')}</button></div>
    <div class="modal-body">
      <label class="check-inline json-pretty">${sw('data-change="json-pretty"', pretty)}Pretty print</label>
      <textarea class="input mono val-text json-text" spellcheck="false">${esc(fmtJson(raw, pretty))}</textarea>
      <div class="json-err"></div>
    </div>
    <div class="modal-foot">${col.nullable ? `<button class="btn ghost" data-act="json-null">Set NULL</button>` : ''}<span class="muted" style="font-size:12px">Ctrl+Enter to apply</span><div class="spacer"></div><button class="btn" data-act="json-close">Cancel</button><button class="btn primary" data-act="json-apply">${ic('check')}Apply</button></div></div>`;
  el.showModal();
  const ta = el.querySelector('.json-text');
  ta.focus(); ta.setSelectionRange(0, 0); ta.scrollTop = 0;
  ta.addEventListener('input', () => jsonValidate());
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); jsonApply(); }
    else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); }
  });
  jsonValidate();
}
function jsonValidate() {
  const ta = $('#jsonDialog .json-text'), out = $('#jsonDialog .json-err'); if (!ta) return true;
  const s = ta.value.trim(), p = s ? parseJson(s) : { ok: true };
  out.textContent = p.ok ? '' : 'Invalid JSON: ' + p.err.message;
  ta.classList.toggle('invalid', !p.ok);
  return p.ok;
}
function jsonPretty(on) {
  store.set('json.pretty', on);
  const ta = $('#jsonDialog .json-text'); if (!ta) return;
  if (!jsonValidate()) return toast('Fix the JSON first to reformat it');
  ta.value = fmtJson(ta.value, on);
}
function jsonClose() { jsonEd = null; $('#jsonDialog').close(); $('#dv-grid')?.focus(); }
function jsonApply(setNull = false) {
  const ed = jsonEd; if (!ed) return;
  const { d, r, ci, orig } = ed, col = d.data.columns[ci];
  let v = setNull ? null : $('#jsonDialog .json-text').value.trim();
  if (v === '') v = col.nullable ? null : (toast('This column cannot be NULL'), undefined);
  if (v === undefined) return;
  if (v !== null) {
    if (!jsonValidate()) return toast('Invalid JSON. Fix it before applying.');
    // Same data as before (only formatting changed): keep the stored value as-is.
    if (typeof orig === 'string' && fmtJson(orig, false) === fmtJson(v, false)) return jsonClose();
    v = fmtJson(v, false);
  }
  if (orig !== UNSET && orig === null && v === null) return jsonClose();
  jsonClose();
  setCells(d, [{ r, ci }], v);
}
function moveSel(d, dr, dp, extend = false) {
  if (!d.data) return;
  const vis = visibleCols(d);
  if (!d.sel) { selectTo(d, 0, vis[0], false); return; }
  const base = extend && d.range ? { r: d.sel.r, p: vis.indexOf(d.sel.c) } : { r: d.sel.r, p: vis.indexOf(d.sel.c) };
  const r = Math.max(0, Math.min(nRows(d) - 1, base.r + dr)), p = Math.max(0, Math.min(vis.length - 1, base.p + dp));
  selectTo(d, r, vis[p], extend);
  scrollToSel(d);
}

/* ---- right-click menu ---- */
function gridMenu(x, y) {
  const d = S.dv, ed = canEdit(d), sel = !!d.sel, rows = selRows(d).length;
  const item = (act, label, keys, enabled = true) => `<button class="cm-item" data-act="${act}" ${enabled ? '' : 'disabled'}><span>${label}</span><kbd>${keys}</kbd></button>`;
  const m = $('#ctxMenu');
  m.innerHTML = [
    item('g-copy', 'Copy', 'Ctrl+C', sel), item('g-copy-h', 'Copy with headers', 'Ctrl+Shift+H', sel),
    '<hr>',
    item('g-edit', 'Edit cell', 'F2', ed && sel), item('g-null', 'Set NULL', 'Ctrl+0', ed && sel),
    item('g-new', 'New row', 'Insert', ed), item('g-clone', `Clone ${rows > 1 ? plural(rows, 'row') : 'row'}`, 'Ctrl+Shift+C', ed && sel), item('g-del', `Delete ${rows > 1 ? plural(rows, 'row') : 'row'}`, 'Ctrl+Delete', ed && sel),
    '<hr>',
    item('g-revert-row', 'Revert row changes', 'Ctrl+U', sel && hasChanges(d)), item('g-revert-all', 'Revert all', '', hasChanges(d)), item('g-undo', 'Undo', 'Ctrl+Z', d.ch.undo.length > 0),
    item('g-save', 'Save changes', 'Ctrl+S', hasChanges(d)), item('g-sql', 'Show SQL', '', hasChanges(d)),
    '<hr>',
    item('g-filter', 'Filter by this value', 'Ctrl+Shift+F', sel), item('g-hide', 'Hide column', 'Ctrl+H', sel), item('dv-expand', 'Open value', 'F3', sel),
  ].join('') + (ed ? '' : `<div class="cm-note">${ic('info')}${d.data && !pkCols(d).length ? 'Read-only: this table has no primary key' : 'Read-only'}</div>`);
  m.style.display = 'block';
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.min(x, innerWidth - w - 8) + 'px';
  m.style.top = Math.min(y, innerHeight - h - 8) + 'px';
}
/* ---- per-column filter operator menu ---- */
const FILTER_OPS = [
  ['clear', 'Clear filter'], '-',
  ['in', 'Filter multiple values…'], ['eq', 'Equals…'], ['ne', 'Does not equal…'], ['null', 'Is NULL'], ['notnull', 'Is not NULL'], '-',
  ['gt', 'Greater than…'], ['ge', 'Greater than or equal to…'], ['lt', 'Less than…'], ['le', 'Less than or equal to…'], '-',
  ['contains', 'Contains…'], ['ncontains', 'Does not contain…'], ['begins', 'Begins with…'], ['ends', 'Ends with…'], ['empty', 'Is empty'], ['nempty', 'Is not empty'],
];
const FILTER_FMT = { in: (v) => 'IN ' + v, eq: (v) => '=' + v, ne: (v) => '<>' + v, gt: (v) => '>' + v, ge: (v) => '>=' + v, lt: (v) => '<' + v, le: (v) => '<=' + v, contains: (v) => v, ncontains: (v) => '!' + v, begins: (v) => v + '*', ends: (v) => '*' + v };
// The bare value of a filter expression, without its operator.
function filterBareValue(expr) {
  const s = String(expr || '').trim(), up = s.toUpperCase();
  if (/^(NOT NULL|IS NOT NULL|!NULL|NULL|IS NULL|EMPTY|!EMPTY)$/.test(up)) return '';
  const m = s.match(/^(?:NOT IN\s+|IN\s+|>=|<=|<>|!=|>|<|=|!)\s*([\s\S]*)$/);
  return (m ? m[1] : s).replace(/^\*+|\*+$/g, '');
}
function filterMenu(btn) {
  const d = S.dv, col = btn.dataset.col, cur = String(d.filters[col] || '').trim();
  const m = $('#ctxMenu');
  m.innerHTML = FILTER_OPS.map((o) => (o === '-' ? '<hr>' : `<button class="cm-item" data-act="dv-fop" data-op="${o[0]}" data-col="${esc(col)}" ${o[0] === 'clear' && !cur ? 'disabled' : ''}><span>${o[1]}</span><kbd></kbd></button>`)).join('');
  m.style.display = 'block';
  const r = btn.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
  m.style.top = (r.bottom + h + 8 > innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
}
function applyFilterOp(col, op) {
  const d = S.dv, input = $(`#dv-thead input[data-input="dv-filter"][data-col="${CSS.escape(col)}"]`);
  const fixed = { clear: '', null: 'NULL', notnull: 'NOT NULL', empty: 'EMPTY', nempty: '!EMPTY' };
  const v = filterBareValue(d.filters[col]);
  const expr = op in fixed ? fixed[op] : FILTER_FMT[op](v);
  d.filters[col] = expr;
  if (input) { input.value = expr; input.classList.toggle('on', !!expr.trim()); }
  if (!(op in fixed) && !v && input) { // needs a value: let the user type it
    input.focus();
    const pos = op === 'begins' ? 0 : expr.length; input.setSelectionRange(pos, pos);
    return;
  }
  clearTimeout(dvTimer); d.offset = 0; fetchData(d);
}
const closeMenu = () => { const m = $('#ctxMenu'); if (m) m.style.display = 'none'; };

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
  if (x && canEdit(d) && !d.sel) left = '<span class="muted">Double-click or type to edit · Ctrl+0 NULL · Insert new row · Ctrl+Delete delete · Ctrl+S save · right-click for more</span>';
  if (x && d.sel && d.sel.r < nRows(d)) {
    const c = x.columns[d.sel.c], v0 = cellAt(d, d.sel.r, d.sel.c), v = v0 === UNSET ? null : v0;
    const nSel = d.range ? (d.range.r2 - d.range.r1 + 1) * (d.range.p2 - d.range.p1 + 1) : 1;
    left = `${nSel > 1 ? `<span class="chip accent">${fmtNum(nSel)} cells</span>` : ''}<b class="mono">${esc(c.name)}</b><span class="val mono">${v0 === UNSET ? '<i>default</i>' : v === null ? '<i>NULL</i>' : esc(cellText(v).slice(0, 300))}</span><button class="btn sm ghost" data-act="dv-copy">${ic('copy')}Copy</button><button class="btn sm ghost" data-act="dv-expand">${ic('maximize')}Open</button>`;
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
    d.data = res; d.sel = null; d.range = null; d.anchor = null; d.scroll = null;
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
  const d = S.dv, x = d.data; if (!x || !d.sel || d.sel.r >= nRows(d)) return;
  const c = x.columns[d.sel.c], v0 = cellAt(d, d.sel.r, d.sel.c), v = v0 === UNSET ? null : v0;
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
  if (!s || d.resTab === 'msg') d.qview = null;
  else paintQueryRows(true);
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
  d.qview = { set, order: sortedRows(d, set), win: null, colW: d.qview?.set.rows === set.rows ? d.qview.colW : {} };
  const head = set.columns.map((c, i) => `<th class="h ${d.qsort?.c === i ? 'sorted' : ''}" data-act="q-sort" data-c="${i}" title="${esc(c.table ? c.table + '.' : '')}${esc(c.name)} · ${esc(c.dataType)}"><div class="th"><span class="cn">${esc(c.name)}</span><span class="si">${d.qsort?.c === i ? ic(d.qsort.dir === 'desc' ? 'sortDown' : 'sortUp') : ''}</span></div><small>${esc(c.dataType)}</small></th>`).join('');
  return `<table class="grid"><thead><tr><th class="rn"></th>${head}</tr></thead><tbody id="q-tbody"></tbody></table>${set.total > set.rows.length ? `<div class="q-capped">${ic('info')}Showing the first ${fmtNum(set.rows.length)} of ${fmtNum(set.total)} rows. Add a LIMIT or a WHERE to narrow it down.</div>` : ''}`;
}
// Renders the query result rows near the viewport (see virtWindow).
function paintQueryRows(force = false) {
  const d = S.dv, q = d.qview, sc = $('#q-rbody'), tb = $('#q-tbody'); if (!q || !sc || !tb) return;
  const { set, order } = q, n = order.length, [start, end] = virtWindow(sc, n);
  if (!force && q.win && q.win[0] === start && q.win[1] === end) return;
  q.win = [start, end];
  const out = [vpad(start, set.columns.length + 1)];
  for (let k = start; k < end; k++) {
    const ri = order[k];
    out.push(`<tr><td class="rn">${k + 1}</td>${set.rows[ri].map((v, ci) => {
      const sel = d.sel && d.sel.r === ri && d.sel.c === ci ? ' sel' : '';
      if (v === null) return `<td class="null${sel}" data-qr="${ri}" data-qc="${ci}">NULL</td>`;
      if (typeof v === 'object' && v.bin != null) return `<td class="bin${sel}" data-qr="${ri}" data-qc="${ci}">(${fmtBytes(v.bin)} binary)</td>`;
      const s = typeof v === 'object' ? v.text + '…' : String(v);
      return `<td class="${set.columns[ci].num ? 'num' : ''}${sel}" data-qr="${ri}" data-qc="${ci}">${esc((s.length > 200 ? s.slice(0, 200) + '…' : s).replace(/\s+/g, ' '))}</td>`;
    }).join('')}</tr>`);
  }
  out.push(vpad(n - end, set.columns.length + 1));
  tb.innerHTML = out.join('');
  if (n > VIRT_MIN) {
    if (measureRowH(tb)) return paintQueryRows(true);
    lockColWidths(sc.querySelector('thead'), q.colW);
  }
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

/* ================= UPDATES ================= */
const RELEASES_URL = 'https://github.com/rabbitz215/restora/releases';
const U = { supported: false, current: '', state: 'idle', info: null, progress: null, error: null, checkedAt: null, auto: store.get('update.auto', true), manual: false };
function onUpdate(m) {
  const d = m.data || {};
  if (m.type === 'checking') { U.state = 'checking'; U.error = null; }
  else if (m.type === 'available') { U.state = 'available'; U.info = d; U.checkedAt = m.at; }
  else if (m.type === 'none') { U.state = 'none'; U.info = d; U.checkedAt = m.at; }
  else if (m.type === 'progress') { U.state = 'downloading'; U.progress = d; }
  else if (m.type === 'downloaded') { U.state = 'downloaded'; U.info = d; }
  else if (m.type === 'error') { U.state = U.state === 'downloading' ? 'available' : U.state === 'downloaded' ? 'downloaded' : 'error'; U.error = d.message; U.checkedAt = m.at; }
  renderUpdBadge();
  if ($('#updDialog').open) renderUpdDialog();
  if (m.type === 'available' && !U.manual) toast(`Restora ${d.version} is available. Click "Update" at the bottom of the sidebar.`, 'ok');
  if (m.type !== 'checking') U.manual = false;
}
function renderUpdBadge() {
  const el = $('#updInfo'); if (!el) return;
  const v = U.info?.version;
  if (U.state === 'available') el.innerHTML = `<button class="upd-pill" data-act="upd-open">${ic('download')}Update to v${esc(v)}</button>`;
  else if (U.state === 'downloading') el.innerHTML = `<button class="upd-pill" data-act="upd-open">${ic('loader', 'spin')}Downloading… ${Math.floor(U.progress?.percent || 0)}%</button>`;
  else if (U.state === 'downloaded') el.innerHTML = `<button class="upd-pill ready" data-act="upd-open">${ic('refresh')}Restart to update to v${esc(v)}</button>`;
  else el.innerHTML = U.current ? `<button class="ver-link" data-act="upd-open" title="Check for updates">Restora v${esc(U.current)}${U.state === 'checking' ? ic('loader', 'spin') : ''}</button>` : '';
}
const notesText = (html) => {
  if (!html) return '';
  const txt = new DOMParser().parseFromString(String(html).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<\/(p|li|h\d|tr|div)>|<br\s*\/?>/gi, '\n'), 'text/html').body.textContent || '';
  return txt.replace(/\n{3,}/g, '\n\n').trim();
};
function renderUpdDialog() {
  const v = U.info?.version;
  let body, foot = '';
  if (!U.supported) {
    body = `<div class="upd-hero">${ic('info')}<div><b>Updates are installed from GitHub Releases</b><span>In-app updates work in the installed app (Windows installer, AppImage or .deb). You're running Restora from source.</span></div></div>`;
    foot = `<button class="btn ghost" data-act="news-open">${ic('rocket')}What's new</button><a class="btn" href="${RELEASES_URL}" target="_blank">${ic('arrowUpRight')}Open releases</a>`;
  } else if (U.state === 'checking') {
    body = `<div class="upd-hero">${ic('loader', 'spin')}<div><b>Checking for updates…</b><span>Looking at the latest release on GitHub.</span></div></div>`;
  } else if (U.state === 'available' || U.state === 'downloading' || U.state === 'downloaded') {
    const p = U.progress;
    const notes = notesText(U.info?.notes);
    body = `<div class="upd-hero ok">${ic(U.state === 'downloaded' ? 'check' : 'download')}<div><b>${U.state === 'downloaded' ? `v${esc(v)} is ready to install` : `Restora v${esc(v)} is available`}</b><span>You have v${esc(U.current)}${U.info?.releaseDate ? ` · released ${fmtDay(new Date(U.info.releaseDate).getTime())}` : ''}</span></div></div>
      ${U.state === 'downloading' ? `<div class="upd-bar"><i style="width:${Math.max(2, p?.percent || 0)}%"></i></div><div class="upd-sub">${fmtBytes(p?.transferred)} of ${fmtBytes(p?.total)} · ${fmtBytes(p?.bytesPerSecond)}/s</div>` : ''}
      ${U.state === 'downloaded' ? `<div class="callout info">${ic('info')}<div>Restora will close, install the update and start again.${S.env?.platform === 'linux' && !U.appImage ? ' Your system will ask for your password to install the package.' : ''}</div></div>` : ''}
      ${U.error ? `<div class="callout danger">${ic('alert')}<div>${esc(U.error)}</div></div>` : ''}
      ${notes ? `<div class="upd-notes-label">What's new</div><div class="upd-notes">${esc(notes)}</div>` : ''}`;
    foot = U.state === 'available' ? `<a class="btn ghost" href="${RELEASES_URL}/tag/v${esc(v)}" target="_blank">Release page</a><button class="btn primary" data-act="upd-download">${ic('download')}Download update</button>`
      : U.state === 'downloaded' ? `<button class="btn" data-act="upd-close">Later</button><button class="btn primary" data-act="upd-install">${ic('refresh')}Restart &amp; update</button>` : '';
  } else if (U.state === 'error') {
    body = `<div class="upd-hero bad">${ic('alert')}<div><b>Couldn't check for updates</b><span>${esc(U.error || 'Unknown error')}</span></div></div>`;
    foot = `<a class="btn ghost" href="${RELEASES_URL}" target="_blank">Open releases</a><button class="btn primary" data-act="upd-check">${ic('refresh')}Try again</button>`;
  } else {
    body = `<div class="upd-hero ok">${ic('check')}<div><b>You're up to date</b><span>Restora v${esc(U.current)}${U.checkedAt ? ` · checked ${timeAgo(U.checkedAt)}` : ''}</span></div></div>`;
    foot = `<button class="btn ghost" data-act="news-open">${ic('rocket')}What's new</button><button class="btn primary" data-act="upd-check">${ic('refresh')}Check now</button>`;
  }
  $('#updDialog').innerHTML = `<div class="modal upd-modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px">${ic('download')}</div><div><h3>Updates</h3><p>Restora v${esc(U.current || '?')}</p></div><button class="icon-btn" data-act="upd-close">${ic('x')}</button></div>
    <div class="modal-body">${body}
      ${U.supported ? `<label class="check-inline" style="font-size:12.5px">${sw('data-change="upd-auto"', U.auto)}<span>Check for updates automatically</span></label>` : ''}</div>
    <div class="modal-foot"><div class="spacer"></div>${foot}</div></div>`;
}
/* ---- What's new (changelog after an update) ---- */
const vcmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
async function showWhatsNew(force = false) {
  const cur = S.env?.version; if (!cur) return;
  const last = store.get('lastVersion', null);
  store.set('lastVersion', cur);
  let log = [];
  try { log = await api.changelog(); } catch {}
  let entries, upgraded = false;
  if (force) entries = log.slice(0, 8);
  else if (last && vcmp(cur, last) > 0) { entries = log.filter((e) => vcmp(e.version, last) > 0 && vcmp(e.version, cur) <= 0); upgraded = true; }
  else if (!last && (S.conns.length || S.history.length)) { entries = log.filter((e) => e.version === cur); upgraded = true; } // updated from a version without this feature
  else return;
  if (!entries.length) return;
  $('#newsDialog').innerHTML = `<div class="modal news-modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px">${ic('rocket')}</div>
      <div><h3>What's new</h3><p>${upgraded ? `Restora was updated${last ? ` from v${esc(last)}` : ''} to v${esc(cur)}` : `Restora v${esc(cur)}`}</p></div>
      <button class="icon-btn" data-act="news-close">${ic('x')}</button></div>
    <div class="modal-body news-body">${entries.map((e) => `
      <section class="news-ver"><div class="news-head"><span class="chip ${e.version === cur ? 'accent' : ''}">v${esc(e.version)}</span>${e.date ? `<small>${esc(e.date)}</small>` : ''}${e.version === cur ? '<small class="news-now">installed</small>' : ''}</div>
        <ul>${e.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></section>`).join('')}</div>
    <div class="modal-foot"><a class="btn ghost" href="${RELEASES_URL}" target="_blank">All releases</a><div class="spacer"></div><button class="btn primary" data-act="news-close">${ic('check')}Got it</button></div></div>`;
  if ($('#updDialog').open) $('#updDialog').close();
  $('#newsDialog').showModal();
}

async function checkUpdates(manual) {
  if (!U.supported) return;
  U.manual = !!manual;
  try { await api.update.check(); } catch (e) { onUpdate({ type: 'error', data: { message: e.message }, at: Date.now() }); }
}
async function initUpdates() {
  try { const st = await api.update.state(); Object.assign(U, { supported: st.supported, current: st.current, appImage: st.appImage }); if (st.last) onUpdate(st.last); } catch {}
  api.update.on(onUpdate);
  renderUpdBadge();
  if (U.supported && U.auto) { setTimeout(() => checkUpdates(false), 4000); setInterval(() => { if (U.auto && (U.state === 'none' || U.state === 'error' || U.state === 'idle')) checkUpdates(false); }, 6 * 3600 * 1000); }
}

/* ================= CREATE DATABASE / TABLE ================= */
const CT_TYPES = ['INT', 'INT UNSIGNED', 'BIGINT', 'BIGINT UNSIGNED', 'TINYINT(1)', 'SMALLINT', 'DECIMAL(10,2)', 'DOUBLE', 'VARCHAR(255)', 'VARCHAR(100)', 'CHAR(36)', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR', 'JSON', 'BOOLEAN', "ENUM('a','b')", 'BLOB'];
let CT = null;
const ctCol = (o = {}) => ({ name: '', type: 'VARCHAR(255)', nullable: true, default: '', pk: false, ai: false, ...o });

async function openNewDatabase(connId) {
  const conn = connById(connId);
  CT = { mode: 'db', connId, name: '', collation: null, colls: null, busy: false, error: null };
  renderCreate(); $('#createDialog').showModal(); setTimeout(() => $('#ct-name')?.focus(), 30);
  try { const r = await api.create.collations(connId); if (CT?.mode === 'db') { CT.colls = r.collations; CT.collation = r.default; renderCreate(true); } }
  catch (e) { if (CT) { CT.error = e.message; renderCreate(true); } }
}
function openNewTable(connId, db) {
  CT = { mode: 'table', connId, db, name: '', busy: false, error: null, sql: '', columns: [
    ctCol({ name: 'id', type: 'BIGINT UNSIGNED', nullable: false, pk: true, ai: true }),
    ctCol({ name: 'name', type: 'VARCHAR(255)', nullable: false }),
    ctCol({ name: 'created_at', type: 'DATETIME', nullable: false, default: 'CURRENT_TIMESTAMP' }),
  ] };
  renderCreate(); $('#createDialog').showModal(); setTimeout(() => $('#ct-name')?.focus(), 30);
  refreshCtSql();
}
function ctRowsHtml() {
  return CT.columns.map((c, i) => `<tr>
    <td><input class="input sm mono" value="${esc(c.name)}" placeholder="column_name" data-input="ct-col" data-i="${i}" data-k="name" spellcheck="false"></td>
    <td><input class="input sm mono" value="${esc(c.type)}" list="ct-types" data-input="ct-col" data-i="${i}" data-k="type" spellcheck="false"></td>
    <td class="c"><input type="checkbox" class="check" data-change="ct-chk" data-i="${i}" data-k="nullable" ${c.nullable && !c.ai ? 'checked' : ''} ${c.ai ? 'disabled' : ''}></td>
    <td><input class="input sm mono" value="${esc(c.default)}" placeholder="${c.ai ? 'auto' : 'none'}" data-input="ct-col" data-i="${i}" data-k="default" spellcheck="false" ${c.ai ? 'disabled' : ''}></td>
    <td class="c"><input type="checkbox" class="check" data-change="ct-chk" data-i="${i}" data-k="pk" ${c.pk || c.ai ? 'checked' : ''} ${c.ai ? 'disabled' : ''}></td>
    <td class="c"><input type="checkbox" class="check" data-change="ct-chk" data-i="${i}" data-k="ai" ${c.ai ? 'checked' : ''}></td>
    <td class="c"><button class="icon-btn" data-act="ct-del" data-i="${i}" title="Remove column" ${CT.columns.length < 2 ? 'disabled' : ''}>${ic('trash')}</button></td>
  </tr>`).join('');
}
function renderCreate(partial) {
  const el = $('#createDialog'), conn = connById(CT.connId);
  if (CT.mode === 'db') {
    if (partial && $('#ct-coll')) {
      $('#ct-coll').innerHTML = CT.colls ? CT.colls.map((c) => `<option ${c === CT.collation ? 'selected' : ''}>${esc(c)}</option>`).join('') : '<option>Loading…</option>';
      $('#ct-err').innerHTML = CT.error ? `<div class="callout danger">${ic('alert')}<div>${esc(CT.error)}</div></div>` : '';
      return;
    }
    el.innerHTML = `<div class="modal">
      <div class="modal-head"><div class="logo" style="width:36px;height:36px">${ic('db')}</div><div><h3>New database</h3><p>On ${esc(conn?.name || '?')} · ${esc(conn?.user || '')}@${esc(conn?.host || '')}</p></div><button class="icon-btn" data-act="ct-close">${ic('x')}</button></div>
      <div class="modal-body">
        <div class="field"><label>Name</label><input class="input mono" id="ct-name" value="${esc(CT.name)}" placeholder="my_database" data-input="ct-name" spellcheck="false"></div>
        <div class="field"><label>Collation <span class="muted" style="font-weight:400">(character set utf8mb4)</span></label><select class="select mono" id="ct-coll" data-change="ct-coll"><option>Loading…</option></select></div>
        <div id="ct-err"></div>
      </div>
      <div class="modal-foot"><div class="spacer"></div><button class="btn" data-act="ct-close">Cancel</button><button class="btn primary" data-act="ct-create" id="ct-go">${ic('plus')}Create database</button></div></div>`;
    renderCreate(true);
    return;
  }
  el.innerHTML = `<div class="modal ct-modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px">${ic('table')}</div><div><h3>New table</h3><p>In <span class="mono">${esc(CT.db)}</span> on ${esc(conn?.name || '?')}</p></div><button class="icon-btn" data-act="ct-close">${ic('x')}</button></div>
    <div class="modal-body">
      <div class="field"><label>Table name</label><input class="input mono" id="ct-name" value="${esc(CT.name)}" placeholder="orders" data-input="ct-name" spellcheck="false"></div>
      <div class="ct-cols"><table class="ct-table"><thead><tr><th>Column</th><th>Type</th><th class="c">Null</th><th>Default</th><th class="c" title="Primary key">PK</th><th class="c" title="Auto increment">AI</th><th></th></tr></thead><tbody id="ct-rows">${ctRowsHtml()}</tbody></table>
        <datalist id="ct-types">${CT_TYPES.map((t) => `<option value="${esc(t)}">`).join('')}</datalist>
        <button class="btn sm ghost" data-act="ct-add">${ic('plus')}Add column</button></div>
      <div class="field"><label>SQL</label><pre class="ct-sql" id="ct-sql"></pre></div>
    </div>
    <div class="modal-foot"><span class="muted" style="font-size:12px">Defaults: text is quoted for you; NULL and CURRENT_TIMESTAMP are kept as-is.</span><div class="spacer"></div><button class="btn" data-act="ct-close">Cancel</button><button class="btn primary" data-act="ct-create" id="ct-go">${ic('plus')}Create table</button></div></div>`;
  renderCtSql();
}
let ctTimer = null;
function refreshCtSql() {
  clearTimeout(ctTimer);
  ctTimer = setTimeout(async () => {
    if (!CT || CT.mode !== 'table') return;
    try { CT.sql = await api.create.tableSql(CT.db, { name: CT.name || 'new_table', columns: CT.columns }); CT.error = null; }
    catch (e) { CT.sql = ''; CT.error = e.message; }
    renderCtSql();
  }, 120);
}
function renderCtSql() {
  const el = $('#ct-sql'); if (!el || !CT) return;
  el.innerHTML = CT.error ? `<span class="ct-sql-err">${ic('alert')}${esc(CT.error)}</span>` : hlSql(CT.sql || '').replace(/\n $/, '');
  $('#ct-go')?.toggleAttribute('disabled', !!CT.error || CT.busy || !CT.name.trim());
}
async function createIt() {
  if (!CT || CT.busy) return;
  const { connId } = CT;
  CT.busy = true; $('#ct-go')?.setAttribute('disabled', '');
  try {
    if (CT.mode === 'db') {
      const name = CT.name.trim();
      await api.create.database(connId, name, CT.collation);
      $('#createDialog').close(); toast(`Created database ${name}`, 'ok');
      const t = T(connId); t.open = true; saveTreeOpen();
      await loadTreeDbs(connId); loadTreeTables(connId, name);
    } else {
      const { db } = CT;
      const r = await api.create.table(connId, db, { name: CT.name, columns: CT.columns });
      $('#createDialog').close(); toast(`Created table ${db}.${r.name}`, 'ok');
      await loadTreeTables(connId, db);
      openTable(connId, db, r.name);
    }
    CT = null;
  } catch (e) {
    CT.busy = false; CT.error = e.message;
    if (CT.mode === 'db') renderCreate(true); else renderCtSql();
    toast(e.message);
  }
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
    if (S.view === 'home') updateHomeJob();
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
    if (S.view === 'home') renderHome();
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
async function loadHistoryCount() { try { S.history = await api.history.list(); renderNav(); if (S.view === 'history') renderHistory(); if (S.view === 'home') renderHome(); } catch {} }
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
  const sh = c?.ssh || {};
  dlg = { id: c?.id, tab: 'general', name: c?.name || '', color: c?.color || COLORS[S.conns.length % COLORS.length], host: c?.host || '127.0.0.1', port: c?.port || 3306, user: c?.user || 'root', password: '', ssl: !!c?.ssl, hasPassword: !!c?.hasPassword, test: null,
    ssh: { enabled: !!sh.enabled, host: sh.host || '', port: sh.port || 22, jump: sh.jump || '', auth: sh.auth || 'password', user: sh.user || '', keyFile: sh.keyFile || '', password: '', passphrase: '', hasPassword: !!sh.hasPassword, hasPassphrase: !!sh.hasPassphrase }, agent: null };
  renderDlg();
  $('#connDialog').showModal();
}
function sshTabHtml() {
  const d = dlg, h = d.ssh, off = h.enabled ? '' : 'disabled';
  const unchanged = (has) => (d.id && has ? '•••••• (unchanged)' : '');
  const agent = d.agent === null ? `<div class="ssh-agent">${ic('loader', 'spin')}Looking for SSH agent…</div>`
    : d.agent.found ? `<div class="ssh-agent ok">${ic('check')}SSH agent found</div>`
    : `<div class="ssh-agent bad">${ic('alert')}No SSH agent found (SSH_AUTH_SOCK is not set)</div>`;
  return `
      <label class="check-inline">${sw('data-change="dlg-ssh-on"', h.enabled)}<span>Use SSH tunnel</span></label>
      <fieldset class="ssh-fields" ${off}>
      <div class="row"><div class="field" style="flex:3"><label>SSH host</label><input class="input mono" data-dlg="ssh.host" value="${esc(h.host)}" placeholder="bastion.example.com" spellcheck="false"></div>
        <div class="field" style="flex:1"><label>Port</label><input class="input mono" data-dlg="ssh.port" value="${esc(h.port)}" inputmode="numeric"></div></div>
      <div class="field"><label>Bastion host (jump host) <span class="lbl-note">optional</span></label><input class="input mono" data-dlg="ssh.jump" value="${esc(h.jump)}" placeholder="user@jump.example.com:22" spellcheck="false"></div>
      <div class="field"><label>SSH authentication</label><select class="select" data-change="dlg-ssh-auth">
        ${[['password', 'Username & password'], ['key', 'Key file'], ['agent', 'SSH agent']].map(([v, l]) => `<option value="${v}" ${h.auth === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${h.auth === 'password' ? `<div class="row"><div class="field"><label>Login</label><input class="input mono" data-dlg="ssh.user" value="${esc(h.user)}" spellcheck="false"></div>
        <div class="field"><label>Password</label><input class="input mono" type="password" data-dlg="ssh.password" value="${esc(h.password)}" placeholder="${unchanged(h.hasPassword)}"></div></div>`
      : h.auth === 'key' ? `<div class="field"><label>Login</label><input class="input mono" data-dlg="ssh.user" value="${esc(h.user)}" spellcheck="false"></div>
        <div class="field"><label>Private key file</label><div class="input-btn"><input class="input mono" data-dlg="ssh.keyFile" value="${esc(h.keyFile)}" placeholder="~/.ssh/id_ed25519" spellcheck="false"><button class="btn" data-act="dlg-ssh-key">${ic('folder')}Browse</button></div></div>
        <div class="field"><label>Key passphrase <span class="lbl-note">if the key is encrypted</span></label><input class="input mono" type="password" data-dlg="ssh.passphrase" value="${esc(h.passphrase)}" placeholder="${unchanged(h.hasPassphrase)}"></div>`
      : `<div class="field"><label>Login</label><input class="input mono" data-dlg="ssh.user" value="${esc(h.user)}" spellcheck="false"></div>${agent}`}
      </fieldset>
      <p class="hint">With a tunnel, the Host on the General tab is resolved by the SSH server, so <code>localhost</code> means MySQL on that machine.</p>`;
}
function renderDlg() {
  const d = dlg;
  if (d.tab === 'ssh' && d.ssh.auth === 'agent' && d.agent === null) api.connections.sshAgent().then((a) => { dlg.agent = a; if (dlg.tab === 'ssh') renderDlg(); }).catch(() => { dlg.agent = { found: false }; });
  $('#connDialog').innerHTML = `<div class="modal">
    <div class="modal-head"><div class="logo" style="width:36px;height:36px;background:${esc(d.color)};box-shadow:none">${ic('server')}</div>
      <div><h3>${d.id ? 'Edit connection' : 'New connection'}</h3><p>MySQL or MariaDB over ${d.ssh.enabled ? 'an SSH tunnel' : 'TCP'}</p></div>
      <button class="icon-btn" data-act="dlg-close">${ic('x')}</button></div>
    <div class="modal-tabs"><div class="seg">
      <button class="${d.tab === 'general' ? 'on' : ''}" data-act="dlg-tab" data-tab="general">General</button>
      <button class="${d.tab === 'ssh' ? 'on' : ''}" data-act="dlg-tab" data-tab="ssh">SSH Tunnel${d.ssh.enabled ? '<i class="tab-dot"></i>' : ''}</button></div></div>
    <div class="modal-body">${d.tab === 'ssh' ? sshTabHtml() : `
      <div class="field"><label>Name</label><input class="input" data-dlg="name" value="${esc(d.name)}" placeholder="Local dev, Staging…"></div>
      <div class="field"><label>Color</label><div class="swatches">${COLORS.map((c) => `<span class="swatch ${c === d.color ? 'on' : ''}" style="background:${c}" data-act="dlg-color" data-color="${c}"></span>`).join('')}</div></div>
      <div class="row"><div class="field" style="flex:3"><label>Host${d.ssh.enabled ? ' <span class="lbl-note">as seen from the SSH server</span>' : ''}</label><input class="input mono" data-dlg="host" value="${esc(d.host)}" spellcheck="false"></div>
        <div class="field" style="flex:1"><label>Port</label><input class="input mono" data-dlg="port" value="${esc(d.port)}" inputmode="numeric"></div></div>
      <div class="row"><div class="field"><label>User</label><input class="input mono" data-dlg="user" value="${esc(d.user)}" spellcheck="false"></div>
        <div class="field"><label>Password</label><input class="input mono" type="password" data-dlg="password" value="${esc(d.password)}" placeholder="${d.id && d.hasPassword ? '•••••• (unchanged)' : ''}"></div></div>
      <label class="check-inline">${sw('data-dlg-check="ssl"', d.ssl)}<span>Require SSL/TLS</span></label>`}
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
  if (t.ok) return `<div class="test-result ok">${ic('check')}Connected to ${esc(t.version)}${t.ssh ? ' through the SSH tunnel' : ''} in ${t.ms} ms</div>`;
  return `<div class="test-result bad">${ic('alert')}${esc(t.error)}</div>`;
}
function dlgPayload() {
  const d = dlg;
  const h = d.ssh, keep = (v, has) => (v === '' && d.id && has ? undefined : v);
  const ssh = { enabled: h.enabled, host: h.host.trim(), port: Number(h.port) || 22, jump: h.jump.trim(), auth: h.auth, user: h.user.trim(), keyFile: h.keyFile.trim(), password: keep(h.password, h.hasPassword), passphrase: keep(h.passphrase, h.hasPassphrase) };
  return { id: d.id, name: d.name.trim(), color: d.color, host: d.host.trim(), port: Number(d.port) || 3306, user: d.user.trim(), ssl: d.ssl, password: keep(d.password, d.hasPassword), ssh };
}

/* ================= EVENTS ================= */
const actions = {
  nav: (el) => go(el.dataset.view),
  'home-query': () => openQuery(null, null),
  'home-hist': (el) => { S.histOpen = el.dataset.id; go('history'); },
  'home-tab': (el) => { const t = S.tabs.find((x) => x.key === el.dataset.key); if (t) activateTab(t); },
  'home-conn': (el) => { const t = T(el.dataset.id); if (!t.open) { t.open = true; saveTreeOpen(); loadTreeDbs(el.dataset.id); } renderConns(); document.querySelector(`.tree-row.conn[data-id="${CSS.escape(el.dataset.id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
  'home-restore': (el) => { Object.assign(S.r, { dbMode: 'existing', dbFilter: '' }); go('restore'); selectRestoreConn(el.dataset.id); },
  'home-export': (el) => { S.e.allTables = true; go('export'); selectExportConn(el.dataset.id); },
  'upd-whatsnew': () => showWhatsNew(true),
  'add-conn': () => openConn(null),
  'edit-conn': (el) => openConn(el.dataset.id),
  'pick-dump': async () => { const p = await guard(() => api.pickFile('dump')); if (p) loadDump(p); },
  'clear-dump': () => { Object.assign(S.r, { file: null, info: null, tables: null }); api.cancelDumpTables().catch(() => {}); renderSource(); renderRestoreTables(); renderOptions(); },
  'r-tdata': (el) => { const n = el.dataset.name, s = S.r.noData; if (s.has(n)) s.delete(n); else s.add(n); store.set('r.noData', [...s]); renderRestoreTables(); renderOptions(); },
  'r-data-all': (el) => { const f = S.r.tblFilter.toLowerCase(); (Array.isArray(S.r.tables) ? S.r.tables : []).filter((t) => t.dataBytes && t.name.toLowerCase().includes(f)).forEach((t) => (el.dataset.on === '1' ? S.r.noData.delete(t.name) : S.r.noData.add(t.name))); store.set('r.noData', [...S.r.noData]); renderRestoreTables(); renderOptions(); },
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
  'tree-newdb': (el) => openNewDatabase(el.dataset.id),
  'tree-newtable': (el) => openNewTable(el.dataset.id, el.dataset.db),
  'ct-close': () => { $('#createDialog').close(); CT = null; },
  'ct-create': () => createIt(),
  'ct-add': () => { CT.columns.push(ctCol()); $('#ct-rows').innerHTML = ctRowsHtml(); refreshCtSql(); const ins = document.querySelectorAll('#ct-rows input[data-k="name"]'); ins[ins.length - 1]?.focus(); },
  'ct-del': (el) => { CT.columns.splice(Number(el.dataset.i), 1); $('#ct-rows').innerHTML = ctRowsHtml(); refreshCtSql(); },
  'tree-table': (el) => openTable(el.dataset.id, el.dataset.db, el.dataset.table),
  'tree-restore': (el) => { Object.assign(S.r, { dbMode: 'existing', dbFilter: '' }); go('restore'); selectRestoreConn(el.dataset.id, el.dataset.db); },
  'tree-export': (el) => { S.e.allTables = true; go('export'); selectExportConn(el.dataset.id, el.dataset.db); },

  // export
  'e-pickdb': (el) => selectExportDb(el.dataset.name),
  'e-refresh': () => S.e.connId && selectExportConn(S.e.connId, S.e.db),
  'e-tmode': (el) => { S.e.allTables = el.dataset.mode === 'all'; renderExportTables(); renderExportOptions(); },
  'e-sel-all': () => { const f = S.e.tFilter.toLowerCase(); (S.e.objects || []).filter((o) => o.name.toLowerCase().includes(f)).forEach((o) => S.e.selected.add(o.name)); renderExportTables(); renderExportOptions(); },
  'e-tdata': (el) => { const n = el.dataset.name, s = S.e.noData; if (s.has(n)) s.delete(n); else s.add(n); renderExportTables(); renderExportOptions(); },
  'e-data-all': (el) => { const f = S.e.tFilter.toLowerCase(); (S.e.objects || []).filter((o) => hasData(o) && o.name.toLowerCase().includes(f)).forEach((o) => (el.dataset.on === '1' ? S.e.noData.delete(o.name) : S.e.noData.add(o.name))); renderExportTables(); renderExportOptions(); },
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
  'dv-copy': () => { const d = S.dv; if (!d.data || !d.sel) return; if (d.kind !== 'query') return gridOps.copy(d); navigator.clipboard.writeText(cellText(d.data.rows[d.sel.r][d.sel.c])); toast('Copied value', 'ok'); },
  'dv-expand': () => openValue(),
  'dv-panel': () => { rememberScroll(); panelOpen = !panelOpen; store.set('dv.panel', panelOpen); renderData(); },
  'dv-cols': (el) => { const d = S.dv; for (const c of colMatches(d)) { if (el.dataset.show === '1') d.hidden.delete(c.name); else d.hidden.add(c.name); } if (d.data && d.hidden.size >= d.data.columns.length) { d.hidden.delete(d.data.columns[0].name); toast('Kept one column visible', 'ok'); } saveHidden(d); refreshCols(); },
  'dv-gocol': (el) => {
    const d = S.dv, col = el.dataset.col;
    if (d.hidden.has(col)) { d.hidden.delete(col); saveHidden(d); refreshCols(); }
    const th = [...document.querySelectorAll('#dv-thead th.h')].find((x) => x.dataset.col === col);
    if (th) { th.scrollIntoView({ inline: 'center', block: 'nearest' }); th.classList.remove('flash'); void th.offsetWidth; th.classList.add('flash'); }
  },
  'dv-ref': (el) => { const d = S.dv; const fk = d.refs[el.dataset.dir][Number(el.dataset.i)]; followRef(el.dataset.dir, fk, d.sel && d.sel.r < nRows(d) ? rowValues(d, d.sel.r) : null); },
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
  'upd-open': () => { renderUpdDialog(); $('#updDialog').showModal(); if (U.supported && (U.state === 'idle' || U.state === 'error' || (U.state === 'none' && Date.now() - (U.checkedAt || 0) > 60000))) checkUpdates(true); },
  'upd-close': () => $('#updDialog').close(),
  'news-open': () => showWhatsNew(true),
  'news-close': () => $('#newsDialog').close(),
  'upd-check': () => checkUpdates(true),
  'upd-download': async () => { U.state = 'downloading'; U.error = null; U.progress = { percent: 0 }; renderUpdBadge(); renderUpdDialog(); try { await api.update.download(); } catch (e) { onUpdate({ type: 'error', data: { message: e.message }, at: Date.now() }); } },
  'upd-install': async () => {
    U.error = null; renderUpdDialog();
    if (S.job?.status === 'running' && !(await api.confirm({ title: 'Restart & update', message: 'A job is still running. Stop it and update now?', detail: 'The running restore, export or import will be cancelled.', ok: 'Stop & update' }))) return;
    await api.update.install();
  },
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
  'g-copy': () => { closeMenu(); gridOps.copy(S.dv); },
  'g-copy-h': () => { closeMenu(); gridOps.copy(S.dv, true); },
  'g-edit': () => { closeMenu(); startEdit(S.dv); },
  'g-null': () => { closeMenu(); gridOps.setNull(S.dv); },
  'g-new': () => { closeMenu(); gridOps.newRow(S.dv); },
  'g-clone': () => { closeMenu(); gridOps.newRow(S.dv, true); },
  'g-del': () => { closeMenu(); gridOps.deleteRows(S.dv); },
  'g-revert-row': () => { closeMenu(); gridOps.revertRows(S.dv); },
  'g-revert-all': async () => { closeMenu(); const d = S.dv; if (await api.confirm({ title: 'Revert all', message: 'Discard all unsaved changes in this table?', detail: 'Edited cells, new rows and rows marked for deletion go back to how they are in the database.', ok: 'Revert all' })) gridOps.revertAll(d); },
  'g-undo': () => { closeMenu(); gridOps.undo(S.dv); },
  'g-save': () => { closeMenu(); gridOps.save(S.dv); },
  'g-sql': () => { closeMenu(); gridOps.showSql(S.dv); },
  'g-filter': () => { closeMenu(); gridOps.filterValue(S.dv); },
  'dv-fmenu': (el, ev) => { ev.stopPropagation(); filterMenu(el); },
  'dv-fop': (el) => { closeMenu(); applyFilterOp(el.dataset.col, el.dataset.op); },
  'g-hide': () => { closeMenu(); gridOps.hideColumn(S.dv); },
  'tab-open': (el) => { const t = S.tabs.find((x) => x.key === el.dataset.key); if (t && t !== S.dv) activateTab(t); },
  'tab-close': (el, ev) => { ev.stopPropagation(); closeTab(el.dataset.key); },
  'tab-close-group': (el, ev) => { ev.stopPropagation(); const g = S.tabs.find((x) => x.key === el.dataset.key); if (g) closeTabs((t) => sameGroup(t, g)); },
  'tree-tfilter-clear': (el, ev) => { ev.stopPropagation(); T(el.dataset.id).tFilter[el.dataset.db] = ''; renderConns(); },
  'dv-copysql': () => { if (S.dv.data) { navigator.clipboard.writeText(S.dv.data.sql); toast('SQL copied', 'ok'); } },
  'val-close': () => $('#valDialog').close(),
  'json-close': () => jsonClose(),
  'json-apply': () => jsonApply(),
  'json-null': () => jsonApply(true),
  'show-file': () => S.job && api.showInFolder(S.job.file),
  'copy-log': () => { navigator.clipboard.writeText(S.job.logs.map((l) => `[${clock(l.t)}] ${l.level.toUpperCase()} ${l.message}`).join('\n')); toast('Log copied', 'ok'); },
  'c-tmode': (el) => { S.c.tableMode = el.dataset.mode; if (S.c.tableMode === 'new') S.c.mapping.forEach((m, i) => { m.column = S.c.preview.columns[i].name; }); else automap(); renderCsvMap(); renderCsvTarget(); },
  'start-csv': () => startCsv(),
  'hist-toggle': (el) => { S.histOpen = S.histOpen === el.dataset.id ? null : el.dataset.id; renderHistory(); },
  'hist-clear': async () => { if (await api.confirm({ title: 'Clear history', message: 'Clear all job history?', detail: 'This only removes the list. Your databases are not affected.', ok: 'Clear' })) { await api.history.clear(); loadHistory(); } },
  noop: () => {},
  'dlg-close': () => $('#connDialog').close(),
  'dlg-color': (el) => { dlg.color = el.dataset.color; renderDlg(); },
  'dlg-tab': (el) => { dlg.tab = el.dataset.tab; renderDlg(); ($('#connDialog .modal-body input:not([type=checkbox])') || {}).focus?.(); },
  'dlg-ssh-key': async () => { const p = await guard(() => api.pickFile('sshkey')); if (p) { dlg.ssh.keyFile = p; renderDlg(); } },
  'dlg-test': async () => {
    dlg.test = { loading: true }; $('#dlg-test').innerHTML = testHtml();
    try { dlg.test = { ok: true, ...(await api.connections.test(dlgPayload())) }; } catch (e) { dlg.test = { ok: false, error: e.message }; }
    $('#dlg-test').innerHTML = testHtml();
  },
  'dlg-save': async () => {
    const p = dlgPayload();
    if (!p.host || !p.user) return toast('Host and user are required');
    if (p.ssh.enabled && !p.ssh.host) { dlg.tab = 'ssh'; renderDlg(); return toast('Enter the SSH host, or turn the SSH tunnel off'); }
    await guard(async () => {
      const saved = await api.connections.save(p);
      S.conns = await api.connections.list();
      $('#connDialog').close();
      if (S.view === 'home') renderHome();
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
    renderConns(); if (S.view === 'home') renderHome(); if (S.view === 'restore') renderRestore(); if (S.view === 'csv') renderCsv(); if (S.view === 'export') renderExport(); if (S.view === 'data') renderData();
  },
};

const changes = {
  'json-pretty': (el) => jsonPretty(el.checked),
  'dlg-ssh-on': (el) => { dlg.ssh.enabled = el.checked; renderDlg(); },
  'dlg-ssh-auth': (el) => { dlg.ssh.auth = el.value; renderDlg(); },
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
  'e-content': (el) => { S.e.opts.content = el.value; store.set('e.opts', S.e.opts); renderExportTables(); renderExportOptions(); },
  'e-tbl': (el) => { if (el.checked) S.e.selected.add(el.dataset.name); else S.e.selected.delete(el.dataset.name); const n = $('#e-selcount'); if (n) n.textContent = `${exportTables().length} of ${S.e.objects.length} selected`; const row = el.closest('.db-row'), tog = row?.querySelector('.data-tog'); if (tog) { tog.disabled = !el.checked; row.classList.toggle('no-data', el.checked && !tog.classList.contains('on')); } renderExportOptions(); },
  'q-db': (el) => { S.dv.db = el.value || null; saveTabs(); renderTabs(); },
  'q-coe': (el) => { S.dv.coe = el.checked; },
  'upd-auto': (el) => { U.auto = el.checked; store.set('update.auto', el.checked); if (el.checked && U.state === 'idle') checkUpdates(false); },
  'ct-coll': (el) => { CT.collation = el.value; },
  'ct-chk': (el) => {
    const c = CT.columns[Number(el.dataset.i)], k = el.dataset.k;
    c[k] = el.checked;
    if (k === 'ai' && el.checked) { c.pk = true; c.nullable = false; if (!/int/i.test(c.type)) c.type = 'BIGINT UNSIGNED'; CT.columns.forEach((o, j) => { if (j !== Number(el.dataset.i)) o.ai = false; }); }
    $('#ct-rows').innerHTML = ctRowsHtml(); refreshCtSql();
  },
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
  'r-tblfilter': (el) => { S.r.tblFilter = el.value; const pos = el.selectionStart; renderRestoreTables(); const i = $('[data-input="r-tblfilter"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } },
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
  'ct-name': (el) => { CT.name = el.value; if (CT.mode === 'table') refreshCtSql(); else $('#ct-go')?.toggleAttribute('disabled', !el.value.trim()); },
  'ct-col': (el) => { CT.columns[Number(el.dataset.i)][el.dataset.k] = el.value; refreshCtSql(); },
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

let virtRaf = 0;
document.addEventListener('scroll', (e) => {
  const id = e.target?.id;
  if ((id !== 'dv-grid' && id !== 'q-rbody') || virtRaf) return;
  virtRaf = requestAnimationFrame(() => { virtRaf = 0; if (id === 'dv-grid') paintDataRows(); else paintQueryRows(); });
}, true);
window.addEventListener('resize', () => { paintDataRows(); paintQueryRows(); });

document.addEventListener('click', (e) => {
  const qtd = e.target.closest('#q-tbody td[data-qr]');
  if (qtd) {
    $('#q-tbody td.sel')?.classList.remove('sel'); qtd.classList.add('sel');
    S.dv.sel = { r: Number(qtd.dataset.qr), c: Number(qtd.dataset.qc) };
    $('#q-status').innerHTML = qStatusHtml(S.dv);
    return;
  }
  if (!e.target.closest('#ctxMenu')) closeMenu();
  if (!e.target.closest('.fk-go') && e.target.closest('#dv-tbody td')) return; // handled by mousedown
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
  if (el.dataset.dlg) { const [a, b] = el.dataset.dlg.split('.'); if (b) dlg[a][b] = el.value; else dlg[a] = el.value; }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && $('#connDialog').open && e.target.tagName === 'INPUT') actions['dlg-save']();
  if (e.key === 'Enter' && /^dv-(filter|search)$/.test(e.target.dataset?.input || '')) { clearTimeout(dvTimer); S.dv.offset = 0; fetchData(); }

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
// Data grid: drag to select cells, drag row numbers to select rows.
document.addEventListener('mousedown', (e) => {
  const d = S.dv;
  if (e.button === 2 || !d.data || S.view !== 'data' || d.kind === 'query') return;
  if (e.target.closest('.fk-go') || e.target.closest('.cell-editor')) return;
  const rn = e.target.closest('#dv-tbody td.rn');
  const td = !rn && e.target.closest('#dv-tbody td[data-r]');
  if (!rn && !td) return;
  if (gridEditor) closeEditor(true);
  e.preventDefault();
  $('#dv-grid').focus({ preventScroll: true });
  if (rn) {
    const r = Number(rn.dataset.rn);
    const from = e.shiftKey && d.range ? (d.range.r1 === r ? d.range.r2 : d.range.r1) : r;
    selectRows(d, from, r);
    gridDrag = { rows: true, from };
  } else {
    selectTo(d, Number(td.dataset.r), Number(td.dataset.c), e.shiftKey);
    gridDrag = { rows: false };
  }
});
document.addEventListener('mouseover', (e) => {
  if (!gridDrag || !(e.buttons & 1)) { gridDrag = null; return; }
  const d = S.dv;
  if (gridDrag.rows) { const rn = e.target.closest('#dv-tbody tr:not(.vpad)'); if (rn) selectRows(d, gridDrag.from, Number(rn.cells[0].dataset.rn)); return; }
  const td = e.target.closest('#dv-tbody td[data-r]');
  if (td) selectTo(d, Number(td.dataset.r), Number(td.dataset.c), true);
});
document.addEventListener('mouseup', () => { gridDrag = null; });
document.addEventListener('contextmenu', (e) => {
  const d = S.dv;
  const td = e.target.closest('#dv-tbody td[data-r]'), rn = e.target.closest('#dv-tbody td.rn');
  if ((!td && !rn) || !d.data || d.kind === 'query') { closeMenu(); return; }
  e.preventDefault();
  if (rn) { const r = Number(rn.dataset.rn); if (!d.range || r < d.range.r1 || r > d.range.r2) selectRows(d, r, r); }
  else { const r = Number(td.dataset.r), ci = Number(td.dataset.c); if (!inRange(d, r, ci) && !(d.sel && d.sel.r === r && d.sel.c === ci)) selectTo(d, r, ci, false); }
  gridMenu(e.clientX, e.clientY);
});
document.addEventListener('scroll', closeMenu, true);
// Data grid keyboard: editing, NULL, rows, save, undo, copy, navigation.
document.addEventListener('keydown', (e) => {
  const d = S.dv;
  if (e.key === 'Escape') closeMenu();
  if (S.view !== 'data' || !d.data || d.kind === 'query' || gridEditor) return;
  if (document.querySelector('dialog[open]')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  const take = (fn) => { e.preventDefault(); e.stopPropagation(); fn(); };
  if (mod && k === 's') return take(() => gridOps.save(d));
  const tag = document.activeElement?.tagName;
  if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  if (mod && k === 'z') return take(() => gridOps.undo(d));
  if (mod && e.key === '0') return take(() => gridOps.setNull(d));
  if (mod && (e.key === 'Delete' || e.key === 'Backspace')) return take(() => gridOps.deleteRows(d));
  if (e.key === 'Insert') return take(() => gridOps.newRow(d));
  if (mod && e.shiftKey && k === 'c') return take(() => gridOps.newRow(d, true));
  if (mod && e.shiftKey && k === 'h') return take(() => gridOps.copy(d, true));
  if (mod && e.shiftKey && k === 'f') return take(() => gridOps.filterValue(d));
  if (mod && k === 'u') return take(() => gridOps.revertRows(d));
  if (mod && k === 'h') return take(() => gridOps.hideColumn(d));
  if (mod && k === 'c' && !String(window.getSelection())) return take(() => gridOps.copy(d));
  if (mod && k === 'a') return take(() => { const vis = visibleCols(d); if (!nRows(d)) return; d.range = { r1: 0, r2: nRows(d) - 1, p1: 0, p2: vis.length - 1 }; d.sel = d.sel || { r: 0, c: vis[0] }; paintSelection(); });
  if (e.key === 'F3') return take(() => openValue());
  if (!d.sel) { if (/^Arrow/.test(e.key)) take(() => moveSel(d, 0, 0)); return; }
  const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (arrows[e.key]) return take(() => moveSel(d, arrows[e.key][0], arrows[e.key][1], e.shiftKey));
  if (e.key === 'Tab') return take(() => moveSel(d, 0, e.shiftKey ? -1 : 1));
  if (e.key === 'Enter' || e.key === 'F2') return take(() => startEdit(d));
  if (e.key === 'Escape' && d.range) return take(() => { d.range = null; paintSelection(); });
  if (!mod && !e.altKey && e.key.length === 1) return take(() => startEdit(d, e.key));
}, true);
document.addEventListener('dblclick', (e) => { const td = e.target.closest('#dv-tbody td[data-r]'); if (td) { if (canEdit(S.dv)) startEdit(S.dv); else openValue(); } if (e.target.closest('#q-tbody td[data-qr]')) actions['q-expand'](); });
$('#newsDialog').addEventListener('click', (e) => { if (e.target.id === 'newsDialog') e.target.close(); });
$('#createDialog').addEventListener('click', (e) => { if (e.target.id === 'createDialog') { e.target.close(); CT = null; } });
$('#createDialog').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'ct-name') { e.preventDefault(); createIt(); } });
$('#updDialog').addEventListener('click', (e) => { if (e.target.id === 'updDialog') e.target.close(); });
$('#themeDialog').addEventListener('click', (e) => { if (e.target.id === 'themeDialog') e.target.close(); });
$('#scpDialog').addEventListener('click', (e) => { if (e.target.id === 'scpDialog') e.target.close(); });
$('#valDialog').addEventListener('click', (e) => { if (e.target.id === 'valDialog') e.target.close(); });
$('#jsonDialog').addEventListener('close', () => { jsonEd = null; });
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
  initUpdates();
  setTimeout(() => showWhatsNew(false), 600);
  // Reopen the tabs from last time before the first render, so Home and the tree see them.
  const savedTabs = store.get('tabs', null);
  if (savedTabs?.list?.length) {
    for (const t of savedTabs.list) if (connById(t.connId)) S.tabs.push(t.kind === 'query' ? newQuery(t.connId, t.db, t.sql || '', t.title, t.key) : newDv(t.connId, t.db, t.table));
    S.dv = S.tabs.find((t) => t.key === savedTabs.active) || S.tabs[0] || EMPTY_DV;
  }
  // Land back in Data & SQL if that's where the app was closed and there are tabs to show.
  renderEnv(); renderConns(); go(store.get('view') === 'data' && S.tabs.length ? 'data' : 'home');
  for (const id of openIds) if (connById(id)) loadTreeDbs(id);
  if (S.e.connId) selectExportConn(S.e.connId);
  if (S.r.connId) selectRestoreConn(S.r.connId);
  if (S.c.connId) selectCsvConn(S.c.connId);
})();
