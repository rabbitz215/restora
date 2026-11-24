const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell, nativeTheme, Menu } = require('electron');
const path = require('path');
const crypto = require('crypto');
const { Store } = require('./lib/store');
const db = require('./lib/db');
const { RestoreJob, inspectDump, scanDumpTables, mysqlClientInfo } = require('./lib/restore');
const csv = require('./lib/csv');
const { ExportJob, dumpToolInfo } = require('./lib/export');
const presets = require('./lib/presets');
const { FetchJob, remoteList } = require('./lib/fetch');
const query = require('./lib/query');
const tunnel = require('./lib/tunnel');
const { autoUpdater } = require('electron-updater');
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
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: !app.isPackaged },
  });
  win.removeMenu();
  // Installed builds: no dev console and no reload shortcuts.
  if (app.isPackaged) {
    win.webContents.on('before-input-event', (e, input) => {
      const k = String(input.key || '').toLowerCase(), mod = input.control || input.meta;
      if (k === 'f12' || (mod && input.shift && (k === 'i' || k === 'j')) || (mod && k === 'r')) e.preventDefault();
    });
    win.webContents.on('devtools-opened', () => win.webContents.closeDevTools());
  }
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

// Fills in saved secrets for a connection id / dialog payload (blank = unchanged).
function savedConn(c) {
  if (typeof c === 'string') return store.getConnection(c);
  if (!c.id) return c;
  let saved = null;
  try { saved = store.getConnection(c.id); } catch { return c; }
  const out = { ...saved, ...c, password: c.password ?? saved.password };
  if (c.ssh) out.ssh = { ...c.ssh, password: c.ssh.password ?? saved.ssh?.password ?? '', passphrase: c.ssh.passphrase ?? saved.ssh?.passphrase ?? '' };
  return out;
}
// Same, routed through the connection's SSH tunnel when it has one.
const resolveConn = (c) => tunnel.route(savedConn(c));

if (process.env.RESTORA_PROFILE) app.setPath('userData', process.env.RESTORA_PROFILE);

Menu.setApplicationMenu(null); // no File / Edit / View / Window menu (Alt does nothing)

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'), safeStorage);

  handle('env:info', async () => {
    const [mysqlInfo, dump] = await Promise.all([mysqlClientInfo(), dumpToolInfo()]);
    return { mysql: mysqlInfo, dump: { found: !!dump.bin, bin: dump.bin, version: dump.version }, version: app.getVersion(), platform: process.platform, downloads: app.getPath('downloads'), sep: path.sep };
  });
  handle('conn:list', () => store.listConnections());
  handle('conn:save', (c) => store.saveConnection(c));
  handle('conn:delete', (id) => store.deleteConnection(id));
  handle('conn:test', async (c) => {
    const conn = await tunnel.route(savedConn(c), { fresh: true });
    try { return { ...(await db.test(conn)), ssh: !!conn.tunnel }; } finally { conn.closeTunnel?.(); }
  });
  handle('ssh:agent', () => tunnel.agentInfo());
  handle('db:list', async (id) => db.listDatabases(await resolveConn(id)));
  handle('db:tables', async (id, name) => db.listTables(await resolveConn(id), name));
  handle('db:stats', async (id, name) => db.dbStats(await resolveConn(id), name));
  handle('db:collations', async (id) => db.serverCollations(await resolveConn(id)));
  handle('db:create', async (id, name, collation) => db.createDatabase(await resolveConn(id), name, collation));
  handle('db:drop', async (id, name) => db.dropDatabase(await resolveConn(id), name));
  handle('db:purge', async (id, name) => db.purgeDatabase(await resolveConn(id), name));
  handle('table:sql', (dbName, def) => db.createTableSql(dbName, def));
  handle('table:create', async (id, dbName, def) => db.createTable(await resolveConn(id), dbName, def));
  handle('db:objects', async (id, name) => db.listObjects(await resolveConn(id), name));
  handle('data:preview', async (id, dbName, table, changes) => db.previewEdits(await resolveConn(id), dbName, table, changes));
  handle('data:save', async (id, dbName, table, changes) => db.saveEdits(await resolveConn(id), dbName, table, changes));
  handle('table:structure', async (id, dbName, table) => db.tableStructure(await resolveConn(id), dbName, table));
  handle('table:alterSql', async (id, dbName, table, draft) => db.previewAlter(await resolveConn(id), dbName, table, draft));
  handle('table:alter', async (id, dbName, table, draft) => db.applyAlter(await resolveConn(id), dbName, table, draft));
  handle('data:browse', async (id, name, table, q) => db.browse(await resolveConn(id), name, table, q));
  handle('file:save', async ({ defaultPath, gzip }) => {
    const r = await dialog.showSaveDialog(win, { defaultPath, filters: [gzip ? { name: 'Compressed SQL', extensions: ['gz'] } : { name: 'SQL', extensions: ['sql'] }], properties: ['showOverwriteConfirmation', 'createDirectory'] });
    return r.canceled ? null : r.filePath;
  });
  handle('file:exists', (p) => fs.existsSync(p));
  handle('history:list', () => store.history());
  handle('history:clear', () => store.clearHistory());

  handle('file:pick', async (kind) => {
    if (kind === 'sshkey') {
      const r = await dialog.showOpenDialog(win, { title: 'Choose SSH private key', defaultPath: path.join(require('os').homedir(), '.ssh'), properties: ['openFile', 'showHiddenFiles'] });
      return r.canceled ? null : r.filePaths[0];
    }
    const filters = kind === 'csv'
      ? [{ name: 'CSV / TSV', extensions: ['csv', 'tsv', 'txt'] }]
      : [{ name: 'SQL dumps', extensions: ['sql', 'gz'] }];
    const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [...filters, { name: 'All files', extensions: ['*'] }] });
    return r.canceled ? null : r.filePaths[0];
  });
  handle('dump:inspect', (p) => inspectDump(p));
  // One table scan at a time: picking another file cancels the previous scan.
  let scan = null;
  handle('dump:tables', async (p) => {
    if (scan) scan.cancel();
    const mine = (scan = scanDumpTables(p, (bytes, total) => send('dump:scan', { path: p, bytes, total })));
    try { return await mine.promise; } finally { if (scan === mine) scan = null; }
  });
  handle('dump:tables-cancel', () => { if (scan) scan.cancel(); scan = null; });
  handle('csv:preview', (p, opts) => csv.preview(p, opts));
  handle('confirm', async ({ title, message, detail, ok }) => {
    if (process.env.RESTORA_AUTOCONFIRM && process.env.RESTORA_SHOT) return true; // automated UI tests only
    const r = await dialog.showMessageBox(win, { type: 'warning', buttons: ['Cancel', ok || 'Continue'], defaultId: 0, cancelId: 0, title, message, detail });
    return r.response === 1;
  });

  handle('restore:start', async (opts) => {
    const conn = await resolveConn(opts.connId);
    const id = crypto.randomUUID();
    const emit = (type, data) => send('job:event', { id, type, data });
    await db.prepareDatabase(conn, opts.database, { create: opts.createDb, dropFirst: opts.dropFirst });
    const binlog = opts.skipBinlog ? await db.binlogProbe(conn).catch(() => null) : null;
    const job = new RestoreJob(id, { ...opts, conn, binlog }, emit);
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
    const conn = await resolveConn(opts.connId);
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
    const conn = await resolveConn(opts.connId);
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
    const hit = store.listConnections().find((x) => !x.ssh?.enabled && (local(c.host) ? local(x.host) : x.host === c.host) && Number(x.port) === (Number(c.port) || 3306) && x.user === c.user);
    if (hit) return hit.id;
    return store.saveConnection({ name: `${p.name} (local)`, color: '#fb923c', host: c.host || '127.0.0.1', port: Number(c.port) || 3306, user: c.user, password: c.password || '' }).id;
  });
  handle('preset:status', async (id, { connId, folder, database } = {}) => {
    const p = getPreset(id);
    folder = folder || p.folder; database = database || p.database;
    const dumps = folder ? presets.listDumps(folder, p.filePattern) : [];
    let local = null, localError = null;
    if (connId && database) { try { local = await presets.localState(await resolveConn(connId), database); } catch (e) { localError = e.sqlMessage || e.message; } }
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
  handle('sql:run', async (tabId, connId, dbName, sql, opts) => query.run(tabId, await resolveConn(connId), dbName, sql, opts));
  handle('sql:cancel', async (tabId, connId) => query.cancel(tabId, await resolveConn(connId)));
  handle('sql:close', (tabId) => query.close(tabId));
  handle('sql:risky', (sql) => query.riskyStatements(sql));
  ipcMain.handle('theme:bg', (_e, c) => {
    if (!/^#[0-9a-f]{6}$/i.test(c || '')) return;
    if (win && !win.isDestroyed()) win.setBackgroundColor(c);
    try { fs.writeFileSync(path.join(app.getPath('userData'), 'ui.json'), JSON.stringify({ bg: c })); } catch {}
  });
  // In-app updates from GitHub Releases (installer, AppImage and .deb builds).
  const updatesSupported = () => app.isPackaged || !!process.env.RESTORA_UPDATE_DEV;
  let lastUpdate = null;
  const updEvent = (type, data) => { lastUpdate = { type, data, at: Date.now() }; send('update:event', lastUpdate); };
  const updInfo = (i) => ({
    version: i?.version, releaseDate: i?.releaseDate,
    notes: Array.isArray(i?.releaseNotes) ? i.releaseNotes.map((n) => n.note || '').join('\n') : i?.releaseNotes || '',
  });
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  // Write updater activity (incl. pkexec / dpkg output) to <userData>/updater.log for troubleshooting.
  const updLogFile = path.join(app.getPath('userData'), 'updater.log');
  const updLog = (lvl) => (...a) => {
    try {
      if (fs.existsSync(updLogFile) && fs.statSync(updLogFile).size > 512 * 1024) fs.renameSync(updLogFile, updLogFile + '.1');
      fs.appendFileSync(updLogFile, `${new Date().toISOString()} [${lvl}] ${a.map((x) => (x instanceof Error ? x.stack || x.message : typeof x === 'string' ? x : JSON.stringify(x))).join(' ')}\n`);
    } catch {}
  };
  autoUpdater.logger = { info: updLog('info'), warn: updLog('warn'), error: updLog('error'), debug: () => {} };
  let downloadedFile = null;
  if (process.env.RESTORA_UPDATE_DEV) { autoUpdater.forceDevUpdateConfig = true; if (process.env.RESTORA_FAKE_VERSION) autoUpdater.currentVersion = new (require(require.resolve('semver', { paths: [path.dirname(require.resolve('electron-updater'))] })).SemVer)(process.env.RESTORA_FAKE_VERSION); }
  autoUpdater.on('checking-for-update', () => updEvent('checking'));
  autoUpdater.on('update-available', (i) => updEvent('available', updInfo(i)));
  autoUpdater.on('update-not-available', (i) => updEvent('none', updInfo(i)));
  autoUpdater.on('download-progress', (p) => updEvent('progress', { percent: p.percent, transferred: p.transferred, total: p.total, bytesPerSecond: p.bytesPerSecond }));
  autoUpdater.on('update-downloaded', (i) => { downloadedFile = i?.downloadedFile || null; updEvent('downloaded', updInfo(i)); });
  const friendlyUpdateError = (e) => {
    const m = String(e?.message || e);
    if (/latest(-linux|-mac)?\.yml/i.test(m) && /404/.test(m)) return "The latest release doesn't support in-app updates yet. Download it once from the releases page.";
    if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|ECONNRESET|net::ERR_/i.test(m)) return "Couldn't reach GitHub. Check your internet connection and try again.";
    if (/APPIMAGE env is not defined/i.test(m)) return 'In-app updates for Linux work with the AppImage or .deb build.';
    if (/403|rate limit/i.test(m)) return 'GitHub is limiting requests right now. Try again in a few minutes.';
    if (/pkexec exited with code 126/i.test(m)) return 'Update cancelled: the password prompt was closed. Click Restart & update to try again.';
    if (/pkexec exited with code 127/i.test(m)) return `Linux refused the install without showing a password prompt. Close Restora, open it again from your app menu and click Restart & update, or install it yourself:  sudo apt install "${downloadedFile || 'the downloaded .deb'}"  (details: updater.log in Restora's settings folder)`;
    if (/(pkexec|sudo|dpkg|apt).*exited with code/i.test(m)) return `Couldn't install the update automatically. You can install it yourself with:  sudo apt install "${downloadedFile || 'the downloaded .deb'}"`;
    return m.split(/\r?\n|\\n| Headers:/)[0].slice(0, 220);
  };
  autoUpdater.on('error', (e) => updEvent('error', { message: friendlyUpdateError(e) }));
  handle('update:state', () => ({ supported: updatesSupported(), current: process.env.RESTORA_FAKE_VERSION || app.getVersion(), last: lastUpdate, platform: process.platform, appImage: !!process.env.APPIMAGE }));
  handle('update:check', async () => { if (!updatesSupported()) return null; try { await autoUpdater.checkForUpdates(); } catch (e) { throw new Error(friendlyUpdateError(e)); } return true; });
  handle('update:download', async () => { try { await autoUpdater.downloadUpdate(); } catch (e) { throw new Error(friendlyUpdateError(e)); } return true; });
  handle('update:install', () => {
    for (const j of jobs.values()) j.cancel();
    // Silent: on Windows this skips the setup wizard (reuses the install folder) and reopens Restora.
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return true;
  });

  // CHANGELOG.md shipped with the app -> [{ version, date, items }]
  handle('app:changelog', () => {
    let md = '';
    try { md = fs.readFileSync(path.join(__dirname, 'CHANGELOG.md'), 'utf8'); } catch { return []; }
    const out = [];
    for (const block of md.split(/^## /m).slice(1)) {
      const [head, ...rest] = block.split('\n');
      const m = head.match(/^v?(\d+\.\d+\.\d+)\s*(?:[—–-]\s*(.+))?$/);
      if (!m) continue;
      out.push({ version: m[1], date: (m[2] || '').trim(), items: rest.map((l) => l.trim()).filter((l) => /^[-*] /.test(l)).map((l) => l.slice(2).trim()) });
    }
    return out;
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
  tunnel.closeAllTunnels();
  query.closeAll();
  app.quit();
});
