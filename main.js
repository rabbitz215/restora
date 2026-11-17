const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell, nativeTheme } = require('electron');
const path = require('path');
const crypto = require('crypto');
const { Store } = require('./lib/store');
const db = require('./lib/db');
const { RestoreJob, inspectDump, mysqlClientInfo } = require('./lib/restore');
const csv = require('./lib/csv');
const { ExportJob, dumpToolInfo } = require('./lib/export');
const presets = require('./lib/presets');
const { FetchJob, remoteList } = require('./lib/fetch');
const query = require('./lib/query');
const fs = require('fs');

let win, store;
const jobs = new Map();

function createWindow() {
  let savedBg = null;
  try { savedBg = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'ui.json'), 'utf8')).bg; } catch {}
  win = new BrowserWindow({
    width: 1280, height: 840, minWidth: 980, minHeight: 640,
    backgroundColor: /^#[0-9a-f]{6}$/i.test(savedBg || '') ? savedBg : '#0a0b0f',
    title: 'Restora',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'renderer', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });

  // Dev helper: RESTORA_SHOT=/path.png captures the window after load then quits.
  if (process.env.RESTORA_SHOT) {
    win.webContents.on('console-message', (e) => console.log('[renderer]', e.level, e.message, e.sourceId?.split('/').pop() + ':' + e.lineNumber));
    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        if (process.env.RESTORA_SCRIPT) await win.webContents.executeJavaScript(require('fs').readFileSync(process.env.RESTORA_SCRIPT, 'utf8'));
        setTimeout(async () => {
          const img = await win.webContents.capturePage();
          require('fs').writeFileSync(process.env.RESTORA_SHOT, img.toPNG());
          app.quit();
        }, Number(process.env.RESTORA_WAIT || 1500));
      }, 600);
    });
  }
}

const send = (ch, payload) => { if (win && !win.isDestroyed()) win.webContents.send(ch, payload); };
const handle = (ch, fn) => ipcMain.handle(ch, async (_e, ...args) => {
  try { return { ok: true, data: await fn(...args) }; } catch (err) { return { ok: false, error: err.sqlMessage || err.message || String(err) }; }
});

function resolveConn(c) {
  if (typeof c === 'string') return store.getConnection(c);
  if (c.id && (c.password === undefined || c.password === null)) return { ...store.getConnection(c.id), ...c, password: store.getConnection(c.id).password };
  return c;
}

if (process.env.RESTORA_PROFILE) app.setPath('userData', process.env.RESTORA_PROFILE);

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'), safeStorage);

  handle('env:info', async () => {
    const [mysqlInfo, dump] = await Promise.all([mysqlClientInfo(), dumpToolInfo()]);
    return { mysql: mysqlInfo, dump: { found: !!dump.bin, bin: dump.bin, version: dump.version }, version: app.getVersion(), platform: process.platform, downloads: app.getPath('downloads'), sep: path.sep };
  });
  handle('conn:list', () => store.listConnections());
  handle('conn:save', (c) => store.saveConnection(c));
  handle('conn:delete', (id) => store.deleteConnection(id));
  handle('conn:test', (c) => db.test(resolveConn(c)));
  handle('db:list', (id) => db.listDatabases(resolveConn(id)));
  handle('db:tables', (id, name) => db.listTables(resolveConn(id), name));
  handle('db:stats', (id, name) => db.dbStats(resolveConn(id), name));
  handle('db:objects', (id, name) => db.listObjects(resolveConn(id), name));
  handle('data:browse', (id, name, table, q) => db.browse(resolveConn(id), name, table, q));
  handle('file:save', async ({ defaultPath, gzip }) => {
    const r = await dialog.showSaveDialog(win, { defaultPath, filters: [gzip ? { name: 'Compressed SQL', extensions: ['gz'] } : { name: 'SQL', extensions: ['sql'] }], properties: ['showOverwriteConfirmation', 'createDirectory'] });
    return r.canceled ? null : r.filePath;
  });
  handle('file:exists', (p) => fs.existsSync(p));
  handle('history:list', () => store.history());
  handle('history:clear', () => store.clearHistory());

  handle('file:pick', async (kind) => {
    const filters = kind === 'csv'
      ? [{ name: 'CSV / TSV', extensions: ['csv', 'tsv', 'txt'] }]
      : [{ name: 'SQL dumps', extensions: ['sql', 'gz'] }];
    const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [...filters, { name: 'All files', extensions: ['*'] }] });
    return r.canceled ? null : r.filePaths[0];
  });
  handle('dump:inspect', (p) => inspectDump(p));
  handle('csv:preview', (p, opts) => csv.preview(p, opts));
  handle('confirm', async ({ title, message, detail, ok }) => {
    if (process.env.RESTORA_AUTOCONFIRM && process.env.RESTORA_SHOT) return true; // automated UI tests only
    const r = await dialog.showMessageBox(win, { type: 'warning', buttons: ['Cancel', ok || 'Continue'], defaultId: 0, cancelId: 0, title, message, detail });
    return r.response === 1;
  });

  handle('restore:start', async (opts) => {
    const conn = resolveConn(opts.connId);
    const id = crypto.randomUUID();
    const emit = (type, data) => send('job:event', { id, type, data });
    await db.prepareDatabase(conn, opts.database, { create: opts.createDb, dropFirst: opts.dropFirst });
    const job = new RestoreJob(id, { ...opts, conn }, emit);
    jobs.set(id, job);
    job.run().then(async (result) => {
      jobs.delete(id);
      let stats = null;
      try { stats = await db.dbStats(conn, opts.database, { analyze: result.status !== 'cancelled' }); } catch {}
      const rec = { id, kind: 'restore', file: opts.file, fileName: path.basename(opts.file), connName: conn.name, connColor: conn.color, database: opts.database, at: job.startedAt, ...result, errors: result.errors.slice(0, 50), errorCount: result.errors.length, tables: result.tables.length, stats };
      store.addHistory(rec);
      emit('done', rec);
    });
    return { id };
  });

  handle('csv:start', async (opts) => {
    const conn = resolveConn(opts.connId);
    const id = crypto.randomUUID();
    const emit = (type, data) => send('job:event', { id, type, data });
    const job = new csv.CsvJob(id, { ...opts, conn }, emit);
    jobs.set(id, job);
    job.run().then((result) => {
      jobs.delete(id);
      const rec = { id, kind: 'csv', file: opts.file, fileName: path.basename(opts.file), connName: conn.name, connColor: conn.color, database: opts.database, table: opts.table, at: job.startedAt, ...result, errors: result.errors.slice(0, 50), errorCount: result.errors.length };
      store.addHistory(rec);
      emit('done', rec);
    });
    return { id };
  });

  handle('export:start', async (opts) => {
    const conn = resolveConn(opts.connId);
    const id = crypto.randomUUID();
    const emit = (type, data) => send('job:event', { id, type, data });
    if (!fs.existsSync(path.dirname(opts.file))) throw new Error('Folder does not exist: ' + path.dirname(opts.file));
    const job = new ExportJob(id, { ...opts, conn }, emit);
    jobs.set(id, job);
    job.run().then((result) => {
      jobs.delete(id);
      const rec = { id, kind: 'export', file: opts.file, fileName: path.basename(opts.file), connName: conn.name, connColor: conn.color, database: opts.database, at: job.startedAt, ...result, errors: result.errors.slice(0, 50), errorCount: result.errors.length };
      store.addHistory(rec);
      emit('done', rec);
    });
    return { id };
  });

  // Quick Restore presets (from <userData>/presets.json; none = feature hidden).
  const getPreset = (id) => { const p = presets.readPresets(app.getPath('userData')).find((x) => x.id === id); if (!p) throw new Error('Preset not found: ' + id); return p; };
  handle('presets:list', () => presets.readPresets(app.getPath('userData')).map(presets.publicPreset));
  handle('preset:ensureConn', (id) => {
    const p = getPreset(id), c = p.connection;
    if (!c || !c.user) return null;
    const local = (h) => ['127.0.0.1', 'localhost', '::1'].includes(String(h || '127.0.0.1').trim());
    const hit = store.listConnections().find((x) => (local(c.host) ? local(x.host) : x.host === c.host) && Number(x.port) === (Number(c.port) || 3306) && x.user === c.user);
    if (hit) return hit.id;
    return store.saveConnection({ name: `${p.name} (local)`, color: '#fb923c', host: c.host || '127.0.0.1', port: Number(c.port) || 3306, user: c.user, password: c.password || '' }).id;
  });
  handle('preset:status', async (id, { connId, folder, database } = {}) => {
    const p = getPreset(id);
    folder = folder || p.folder; database = database || p.database;
    const dumps = folder ? presets.listDumps(folder, p.filePattern) : [];
    let local = null, localError = null;
    if (connId && database) { try { local = await presets.localState(resolveConn(connId), database); } catch (e) { localError = e.sqlMessage || e.message; } }
    const current = local ? presets.matchCurrent(dumps, local, store.history(), database) : null;
    return { preset: presets.publicPreset(p), folder, folderExists: !!folder && fs.existsSync(folder), database, dumps, local, localError, current };
  });
  handle('scp:list', (o) => remoteList(o));
  handle('scp:start', async (opts) => {
    if (!fs.existsSync(opts.folder)) throw new Error('Folder does not exist: ' + opts.folder);
    const id = crypto.randomUUID();
    const emit = (type, data) => send('job:event', { id, type, data });
    const job = new FetchJob(id, opts, emit);
    jobs.set(id, job);
    job.run().catch((e) => ({ status: 'failed', errors: [{ message: e.message }], bytes: 0, total: 0, durationMs: 0 })).then((result) => {
      jobs.delete(id);
      const rec = { id, kind: 'fetch', file: path.join(opts.folder, opts.name), fileName: opts.name, connName: opts.host, connColor: '#fb923c', database: opts.dir, at: job.startedAt, ...result, errors: result.errors.slice(0, 50), errorCount: result.errors.length };
      store.addHistory(rec);
      emit('done', rec);
    });
    return { id };
  });
  handle('sql:run', (tabId, connId, dbName, sql, opts) => query.run(tabId, resolveConn(connId), dbName, sql, opts));
  handle('sql:cancel', (tabId, connId) => query.cancel(tabId, resolveConn(connId)));
  handle('sql:close', (tabId) => query.close(tabId));
  handle('sql:risky', (sql) => query.riskyStatements(sql));
  ipcMain.handle('theme:bg', (_e, c) => {
    if (!/^#[0-9a-f]{6}$/i.test(c || '')) return;
    if (win && !win.isDestroyed()) win.setBackgroundColor(c);
    try { fs.writeFileSync(path.join(app.getPath('userData'), 'ui.json'), JSON.stringify({ bg: c })); } catch {}
  });
  handle('dir:pick', async (def) => {
    const r = await dialog.showOpenDialog(win, { defaultPath: def, properties: ['openDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  });

  handle('job:cancel', (id) => { const j = jobs.get(id); if (j) j.cancel(); return !!j; });
  handle('shell:show', (p) => shell.showItemInFolder(p));

  createWindow();
});

app.on('window-all-closed', () => {
  for (const j of jobs.values()) j.cancel();
  db.closePools();
  query.closeAll();
  app.quit();
});
