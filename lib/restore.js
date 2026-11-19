// Streams a .sql / .sql.gz dump into the official `mysql` client, applying
// compatibility fixes on the fly and reporting progress.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { Transform, pipeline } = require('stream');
const { StringDecoder } = require('string_decoder');
const { resolveTool } = require('./tools');

const RE_DEFINER = /DEFINER\s*=\s*(`[^`]*`|'[^']*'|"[^"]*"|[^\s@]+)\s*@\s*(`[^`]*`|'[^']*'|"[^"]*"|[^\s*]+)\s*/gi;
const RE_USE = /^\s*USE\s+[`"]?[^`";]+[`"]?\s*;\s*$/i;
const RE_CREATE_DB = /^\s*CREATE\s+(DATABASE|SCHEMA)\b/i;
const RE_0900 = /utf8mb4_0900_\w+/g;
const RE_CREATE_TABLE = /^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?[`"]?([^`"\s(]+)/i;
const RE_INSERT = /^(?:INSERT|REPLACE)\s+(?:IGNORE\s+)?INTO\s+[`"]?([^`"\s(]+)/i;

function mysqlClientInfo() {
  return new Promise((resolve) => {
    execFile(resolveTool('mysql'), ['--version'], (err, stdout) => {
      if (err) return resolve({ found: false });
      resolve({ found: true, version: stdout.trim() });
    });
  });
}

function writeDefaultsFile(conn) {
  const file = path.join(os.tmpdir(), `restora-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.cnf`);
  const q = (s) => '"' + String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const lines = ['[client]', `host=${q(conn.host || '127.0.0.1')}`, `port=${Number(conn.port) || 3306}`, `user=${q(conn.user)}`, `password=${q(conn.password)}`, 'protocol=TCP'];
  if (conn.ssl) lines.push('ssl-mode=REQUIRED');
  fs.writeFileSync(file, lines.join('\n') + '\n', { mode: 0o600 });
  return file;
}

// Line-based transform. Dropped lines become empty lines so that the line
// numbers mysql reports in errors still match the original file.
class SqlFixer extends Transform {
  constructor(opts, hooks) {
    super();
    this.o = opts;
    this.hooks = hooks;
    this.dec = new StringDecoder('utf8');
    this.rest = [];
    this.first = true;
    this.lastTable = null;
    this.noData = new Set(opts.noData || []);
    this.dropping = false; // inside a multi-line INSERT whose rows are being left out
    this.inDelim = false; // inside a DELIMITER ;; block (trigger / routine bodies)
  }
  fixLine(line) {
    const o = this.o;
    if (this.dropping) {
      if (/;\s*$/.test(line)) this.dropping = false;
      return '';
    }
    if (this.noData.size && line.charCodeAt(0) === 68 /* D */ && /^DELIMITER\s+\S+/i.test(line)) this.inDelim = !/^DELIMITER\s+;\s*$/i.test(line);
    if (o.skipRoutines) {
      if (this.inBlock) {
        if (/^\s*DELIMITER\s+;\s*$/i.test(line)) this.inBlock = false;
        return '';
      }
      if (/^\s*DELIMITER\s+(?!;\s*$)\S+/i.test(line)) {
        this.inBlock = true;
        if (!this.skippedNoted) { this.skippedNoted = true; this.hooks.onSkip(); }
        return '';
      }
    }
    if (o.fixMariaSandbox && line.startsWith('/*M!999999')) return '';
    if (o.skipUseCreateDb && (RE_USE.test(line) || RE_CREATE_DB.test(line))) return '';
    if (o.stripDefiner && line.indexOf('DEFINER') !== -1) line = line.replace(RE_DEFINER, '');
    if (o.fixCollation && line.indexOf('_0900_') !== -1) line = line.replace(RE_0900, 'utf8mb4_unicode_ci');
    const c = line.charCodeAt(0);
    if (c === 67 /* C */ || c === 73 /* I */ || c === 82 /* R */) {
      let m = c === 67 ? RE_CREATE_TABLE.exec(line) : RE_INSERT.exec(line.slice(0, 200));
      // Structure-only table: drop its INSERT statements (but never lines of a trigger body).
      if (m && c !== 67 && !this.inDelim && this.noData.has(m[1])) {
        if (!/;\s*$/.test(line)) this.dropping = true;
        return '';
      }
      if (m && m[1] !== this.lastTable) {
        this.lastTable = m[1];
        this.hooks.onTable(m[1]);
      }
    }
    return line;
  }
  // Dumps often have multi-megabyte INSERT lines. The unfinished line is kept
  // as a list of pieces and only the new chunk is scanned for '\n', so each
  // byte is searched once instead of once per chunk (which was quadratic).
  _transform(chunk, _enc, cb) {
    let data = this.dec.write(chunk);
    if (this.first) {
      data = data.replace(/^\uFEFF/, '');
      if (data) { this.first = false; this.push(this.o.prefix + ' '); }
    }
    let idx = data.indexOf('\n');
    if (idx === -1) { if (data) this.rest.push(data); return cb(); }
    const parts = [];
    let start = 0;
    if (this.rest.length) {
      this.rest.push(data.slice(0, idx));
      parts.push(this.fixLine(this.rest.join('')));
      this.rest = [];
      start = idx + 1;
      idx = data.indexOf('\n', start);
    }
    while (idx !== -1) {
      parts.push(this.fixLine(data.slice(start, idx)));
      start = idx + 1;
      idx = data.indexOf('\n', start);
    }
    if (start < data.length) this.rest.push(data.slice(start));
    this.push(parts.join('\n') + '\n');
    cb();
  }
  _flush(cb) {
    let out = this.first ? this.o.prefix : '';
    const tail = this.rest.join('') + this.dec.end();
    if (tail) out += this.fixLine(tail) + '\n';
    out += this.o.suffix;
    this.push(out);
    cb();
  }
}

function gzipUncompressedSize(file, size) {
  try {
    const fd = fs.openSync(file, 'r');
    const b = Buffer.alloc(4);
    fs.readSync(fd, b, 0, 4, size - 4);
    fs.closeSync(fd);
    return b.readUInt32LE(0); // modulo 4 GiB
  } catch { return null; }
}

// Read the head of a dump and describe it.
async function inspectDump(file) {
  const st = fs.statSync(file);
  const gz = /\.gz$/i.test(file);
  const head = await new Promise((resolve, reject) => {
    let src = fs.createReadStream(file, { start: 0, end: gz ? 1024 * 1024 : 256 * 1024 });
    let s = src;
    if (gz) s = src.pipe(zlib.createGunzip());
    let buf = '';
    s.on('data', (d) => {
      buf += d.toString('utf8');
      if (buf.length > 256 * 1024) { src.destroy(); resolve(buf); }
    });
    s.on('end', () => resolve(buf));
    s.on('error', (e) => (buf ? resolve(buf) : reject(e)));
    src.on('close', () => resolve(buf));
  });
  const info = {
    path: file, name: path.basename(file), size: st.size, gz,
    uncompressedSize: gz ? gzipUncompressedSize(file, st.size) : st.size,
    tool: 'Unknown SQL', serverVersion: null, sourceDb: null,
    hasMariaSandbox: /^\/\*M!999999/m.test(head),
    hasUseOrCreateDb: /^\s*(USE\s|CREATE\s+(DATABASE|SCHEMA)\b)/im.test(head),
    hasDefiner: /DEFINER\s*=/i.test(head),
    has0900: /utf8mb4_0900_/i.test(head),
    tablesInHead: (head.match(/^CREATE TABLE/gim) || []).length,
  };
  let m;
  if ((m = head.match(/^-- (MariaDB dump|MySQL dump)\s+([\d.]+)/m))) info.tool = `${m[1].replace(' dump', '')}dump ${m[2]}`.replace('MySQLdump', 'mysqldump').replace('MariaDBdump', 'mariadb-dump');
  else if (/phpMyAdmin SQL Dump/i.test(head)) info.tool = 'phpMyAdmin';
  else if (/TablePlus/i.test(head)) info.tool = 'TablePlus';
  else if (/DbGate/i.test(head)) info.tool = 'DbGate';
  else if (/HeidiSQL/i.test(head)) info.tool = 'HeidiSQL';
  else if (/Navicat/i.test(head)) info.tool = 'Navicat';
  else if (/Adminer/i.test(head)) info.tool = 'Adminer';
  if ((m = head.match(/Server version\s*[:\t ]+\s*([^\s]+)/i))) info.serverVersion = m[1];
  if ((m = head.match(/Database:\s*[`"]?([^\s`"]+)/i))) info.sourceDb = m[1];
  else if ((m = head.match(/^\s*USE\s+[`"]?([^`";\s]+)/im))) info.sourceDb = m[1];
  return info;
}

// Reads the whole dump once and lists its tables with how many bytes of
// INSERT data each one has. Works on raw bytes (only line heads are decoded),
// so it runs about as fast as gunzip itself.
function scanDumpTables(file, onProgress) {
  const HEAD = 256;
  let src;
  const promise = new Promise((resolve, reject) => {
    const total = fs.statSync(file).size;
    src = fs.createReadStream(file, { highWaterMark: 1024 * 1024 });
    let read = 0, lastEmit = 0;
    src.on('data', (d) => {
      read += d.length;
      const now = Date.now();
      if (onProgress && now - lastEmit > 150) { lastEmit = now; onProgress(read, total); }
    });
    const tables = new Map();
    const get = (name) => { let t = tables.get(name); if (!t) tables.set(name, (t = { name, dataBytes: 0, inserts: 0, structure: false })); return t; };
    let head = Buffer.allocUnsafe(HEAD), headLen = 0, lineLen = 0, lastByte = 0;
    let cont = null, inDelim = false; // table of a multi-line INSERT still being read
    const endLine = () => {
      const h = head.toString('utf8', 0, headLen);
      const semi = lastByte === 59;
      if (cont) { cont.dataBytes += lineLen + 1; if (semi) cont = null; }
      else if (/^DELIMITER\s+\S+/i.test(h)) inDelim = !/^DELIMITER\s+;\s*$/i.test(h);
      else if (!inDelim) {
        const c = h.charCodeAt(0);
        let m;
        if (c === 67 && (m = RE_CREATE_TABLE.exec(h))) get(m[1]).structure = true;
        else if ((c === 73 || c === 82) && (m = RE_INSERT.exec(h))) {
          const t = get(m[1]); t.dataBytes += lineLen + 1; t.inserts++;
          if (!semi) cont = t;
        }
      }
      headLen = 0; lineLen = 0; lastByte = 0;
    };
    const scan = new Transform({
      transform(chunk, _e, cb) {
        let pos = 0;
        while (pos < chunk.length) {
          const nl = chunk.indexOf(10, pos);
          const end = nl === -1 ? chunk.length : nl;
          if (headLen < HEAD && end > pos) headLen += chunk.copy(head, headLen, pos, Math.min(end, pos + HEAD - headLen));
          if (end > pos) {
            lineLen += end - pos;
            let k = end - 1;
            while (k >= pos && (chunk[k] === 32 || chunk[k] === 13 || chunk[k] === 9)) k--;
            if (k >= pos) lastByte = chunk[k];
          }
          if (nl === -1) break;
          endLine();
          pos = nl + 1;
        }
        cb();
      },
      flush(cb) { if (lineLen) endLine(); cb(); },
    });
    const stages = [src];
    if (/\.gz$/i.test(file)) stages.push(zlib.createGunzip({ chunkSize: 1024 * 1024 }));
    stages.push(scan);
    pipeline(...stages, (err) => {
      if (err) return reject(err);
      if (onProgress) onProgress(total, total);
      resolve([...tables.values()].filter((t) => t.structure || t.dataBytes));
    });
    scan.resume();
  });
  return { promise, cancel: () => src && src.destroy(new Error('cancelled')) };
}

class RestoreJob {
  constructor(id, opts, emit) {
    this.id = id;
    this.opts = opts;
    this.emit = emit;
    this.cancelled = false;
    this.errors = [];
    this.tables = [];
    this.bytes = 0;
    this.startedAt = Date.now();
  }

  run() {
    return new Promise((resolve) => {
      const o = this.opts;
      const total = fs.statSync(o.file).size;
      this.total = total;
      const cnf = writeDefaultsFile(o.conn);
      const args = [`--defaults-extra-file=${cnf}`, '--default-character-set=utf8mb4', '--max-allowed-packet=1073741824', '--batch', '--silent'];
      if (o.force) args.push('--force');
      args.push(o.database);

      const pre = ['SET NAMES utf8mb4;'];
      const post = [];
      if (o.disableFk) { pre.push('SET FOREIGN_KEY_CHECKS=0;', 'SET UNIQUE_CHECKS=0;'); post.push('SET FOREIGN_KEY_CHECKS=1;', 'SET UNIQUE_CHECKS=1;'); }
      if (o.fastMode) { pre.push('SET autocommit=0;'); post.unshift('COMMIT;'); }
      if (o.binlog?.canSkip) pre.push('SET SESSION sql_log_bin=0;');
      // Prefix shares line 1 with the dump so mysql's error line numbers stay accurate.
      const fixer = new SqlFixer({ ...o, prefix: pre.join(' '), suffix: '\n' + post.join('\n') + '\n' }, {
        onTable: (t) => {
          if (!this.tables.includes(t)) this.tables.push(t);
          this.currentTable = t;
          this.log('info', `Restoring \`${t}\``);
        },
        onSkip: () => this.log('warn', 'Skipping triggers, procedures, functions and events (DELIMITER blocks)'),
      });

      const child = spawn(resolveTool('mysql'), args, { stdio: ['pipe', 'pipe', 'pipe'] });
      this.child = child;
      let stderrBuf = '';
      child.stderr.on('data', (d) => {
        stderrBuf += d.toString();
        let i;
        while ((i = stderrBuf.indexOf('\n')) !== -1) {
          const line = stderrBuf.slice(0, i).trim();
          stderrBuf = stderrBuf.slice(i + 1);
          this.handleStderr(line);
        }
      });
      child.stdout.on('data', () => {});

      const src = fs.createReadStream(o.file, { highWaterMark: 1024 * 1024 });
      this.src = src;
      src.on('data', (d) => { this.bytes += d.length; });
      const stages = [src];
      if (/\.gz$/i.test(o.file)) stages.push(zlib.createGunzip({ chunkSize: 1024 * 1024 }));
      stages.push(fixer, child.stdin);

      this.log('info', `Connecting to ${o.conn.tunnel ? `${o.conn.tunnel.dbHost}:${o.conn.tunnel.dbPort} via SSH ${o.conn.tunnel.host}` : `${o.conn.host}:${o.conn.port}`} → \`${o.database}\``);
      if (o.noData?.length) this.log('info', `Structure only, rows left out: ${o.noData.map((t) => '`' + t + '`').join(', ')}`);
      if (o.binlog?.canSkip) this.log('info', 'Binary log skipped for this restore: rows are written to disk once instead of twice');
      else if (o.binlog?.on) this.log('warn', 'Binary logging is on and this user may not skip it (needs SESSION_VARIABLES_ADMIN). The restore writes everything twice. Turn off log_bin on the server for faster restores.');
      const timer = setInterval(() => this.progress(), 200);

      let pipeErr = null;
      pipeline(...stages, (err) => { if (err && err.code !== 'EPIPE') pipeErr = err; });

      child.on('error', (e) => { pipeErr = e; });
      child.on('close', (code) => {
        clearInterval(timer);
        if (stderrBuf.trim()) this.handleStderr(stderrBuf.trim());
        fs.rm(cnf, { force: true }, () => {});
        this.progress();
        let status;
        if (this.cancelled) status = 'cancelled';
        else if (code === 0 && !pipeErr) status = this.errors.length ? 'warning' : 'success';
        else status = 'failed';
        if (pipeErr && !this.cancelled && !this.errors.length) this.errors.push({ message: pipeErr.message });
        resolve({ status, code, errors: this.errors, tables: this.tables, bytes: this.bytes, total, durationMs: Date.now() - this.startedAt });
      });
    });
  }

  handleStderr(line) {
    if (!line) return;
    if (/Using a password on the command line/i.test(line)) return;
    const m = line.match(/^ERROR\s+(\d+)\s*\(([^)]*)\)(?:\s+at line\s+(\d+))?:\s*(.*)$/);
    if (m) {
      const err = { code: Number(m[1]), state: m[2], line: m[3] ? Number(m[3]) : null, message: m[4], hint: hintFor(Number(m[1]), m[4]) };
      this.errors.push(err);
      this.log('error', line, err);
    } else {
      this.log('warn', line);
    }
  }

  progress() {
    const elapsed = (Date.now() - this.startedAt) / 1000;
    const rate = elapsed > 0 ? this.bytes / elapsed : 0;
    const eta = rate > 0 ? (this.total - this.bytes) / rate : null;
    this.emit('progress', { bytes: this.bytes, total: this.total, rate, eta, elapsed, table: this.currentTable, tableCount: this.tables.length, errorCount: this.errors.length });
  }

  log(level, message, extra) { this.emit('log', { level, message, t: Date.now(), ...(extra ? { extra } : {}) }); }

  cancel() {
    this.cancelled = true;
    try { this.src && this.src.destroy(); } catch {}
    try { this.child && this.child.kill('SIGTERM'); } catch {}
  }
}

function hintFor(code, msg) {
  if (code === 1419 || /log_bin_trust_function_creators/i.test(msg)) return 'Binary logging is on and your user lacks SUPER. Either turn on "Skip triggers & routines", or have an admin run SET GLOBAL log_bin_trust_function_creators = 1.';
  if (code === 1227 || /SUPER|SYSTEM_USER|SET_USER_ID/i.test(msg)) return 'Turn on "Strip DEFINER clauses". Views, triggers and routines in the dump are owned by a user you don\'t have.';
  if (code === 1273 && /0900/.test(msg)) return 'Turn on "Convert MySQL 8 collations". The target server (probably MariaDB) doesn\'t know utf8mb4_0900_*.';
  if (code === 1064 && /999999|enable the sandbox/i.test(msg)) return 'Turn on "Remove MariaDB sandbox header".';
  if (code === 1050) return 'The table already exists. Use "Drop & recreate database" or restore into a new database.';
  if (code === 1062) return 'Duplicate key. The target already has rows. Restore into an empty database, or use "Continue on errors".';
  if (code === 1044 || code === 1142) return 'Your user lacks privileges on the target database.';
  if (code === 2006 || code === 2013) return 'Server closed the connection. The packet may be too large. Raise max_allowed_packet on the server.';
  if (code === 1215 || code === 1216 || code === 1452) return 'Foreign key failure. Keep "Disable foreign key checks" on.';
  if (code === 1049) return 'The database doesn\'t exist. Choose "New database".';
  return null;
}

module.exports = { RestoreJob, inspectDump, scanDumpTables, mysqlClientInfo, SqlFixer, writeDefaultsFile, hintFor };
