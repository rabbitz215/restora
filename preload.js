const { contextBridge, ipcRenderer, webUtils } = require('electron');

const call = async (ch, ...args) => {
  const r = await ipcRenderer.invoke(ch, ...args);
  if (!r.ok) throw new Error(r.error);
  return r.data;
};

contextBridge.exposeInMainWorld('api', {
  env: () => call('env:info'),
  connections: { list: () => call('conn:list'), save: (c) => call('conn:save', c), remove: (id) => call('conn:delete', id), test: (c) => call('conn:test', c) },
  databases: (id) => call('db:list', id),
  tables: (id, db) => call('db:tables', id, db),
  stats: (id, db) => call('db:stats', id, db),
  objects: (id, db) => call('db:objects', id, db),
  browse: (id, db, table, q) => call('data:browse', id, db, table, q),
  saveFile: (o) => call('file:save', o),
  exists: (p) => call('file:exists', p),
  startExport: (o) => call('export:start', o),
  presets: { list: () => call('presets:list'), status: (id, o) => call('preset:status', id, o), ensureConn: (id) => call('preset:ensureConn', id) },
  scp: { list: (o) => call('scp:list', o), fetch: (o) => call('scp:start', o) },
  pickDir: (d) => call('dir:pick', d),
  setWindowBg: (c) => ipcRenderer.invoke('theme:bg', c),
  sql: { run: (tab, conn, db, sql, o) => call('sql:run', tab, conn, db, sql, o), cancel: (tab, conn) => call('sql:cancel', tab, conn), close: (tab) => call('sql:close', tab), risky: (sql) => call('sql:risky', sql) },
  history: { list: () => call('history:list'), clear: () => call('history:clear') },
  pickFile: (kind) => call('file:pick', kind),
  pathForFile: (file) => webUtils.getPathForFile(file),
  inspectDump: (p) => call('dump:inspect', p),
  csvPreview: (p, o) => call('csv:preview', p, o),
  confirm: (o) => call('confirm', o),
  startRestore: (o) => call('restore:start', o),
  startCsv: (o) => call('csv:start', o),
  cancelJob: (id) => call('job:cancel', id),
  showInFolder: (p) => call('shell:show', p),
  onJob: (fn) => { const h = (_e, m) => fn(m); ipcRenderer.on('job:event', h); return () => ipcRenderer.removeListener('job:event', h); },
});
