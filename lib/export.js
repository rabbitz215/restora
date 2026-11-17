// Exports a database to .sql or .sql.gz by streaming `mysqldump` (or
// `mariadb-dump`) stdout through optional gzip into a .part file, which is
// renamed into place only when the dump succeeds.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const zlib = require('zlib');
const { Transform, pipeline } = require('stream');
const { writeDefaultsFile, hintFor } = require('./restore');
const { resolveTool } = require('./tools');

let toolCache = null;
function dumpToolInfo() {
  if (toolCache) return toolCache;
  const probe = (bin) => new Promise((resolve) => {
    execFile(bin, ['--version'], (err, out) => {
      if (err) return resolve(null);
      execFile(bin, ['--help'], { maxBuffer: 4 << 20 }, (_e, help = '') => resolve({
        bin, version: out.trim(),
        columnStats: help.includes('--column-statistics'),
        gtid: help.includes('--set-gtid-purged'),
      }));
    });
  });
  toolCache = (async () => (await probe(resolveTool('mysqldump'))) || (await probe(resolveTool('mariadb-dump'))) || { bin: null })();
  return toolCache;
}

const MARKER = /-- (?:Table structure|Dumping data|Temporary view structure) for (?:table|view) `((?:[^`]|``)+)`/g;

class ExportJob {
  constructor(id, opts, emit) {
    this.id = id;
    this.opts = opts; // { conn, database, tables[], allTables, file, gzip, content, routines, triggers, events, addDrop, createDb, weights{} }
    this.emit = emit;
    this.cancelled = false;
    this.errors = [];
    this.done = new Set();
    this.written = 0; // uncompressed dump bytes
    this.fileBytes = 0;
    this.startedAt = Date.now();
  }

  async run() {
    const o = this.opts;
    const tool = await dumpToolInfo();
    if (!tool.bin) {
      this.errors.push({ message: 'mysqldump was not found. Install the mysql-client package.' });
      return this.result('failed');
    }
    const cnf = writeDefaultsFile(o.conn);
    const args = [`--defaults-extra-file=${cnf}`, '--default-character-set=utf8mb4', '--max-allowed-packet=1073741824',
      '--single-transaction', '--quick', '--hex-blob', '--no-tablespaces'];
    if (tool.columnStats) args.push('--column-statistics=0');
    if (tool.gtid) args.push('--set-gtid-purged=OFF');
    if (o.content === 'schema') args.push('--no-data');
    if (o.content === 'data') args.push('--no-create-info', '--skip-triggers');
    else if (!o.triggers) args.push('--skip-triggers');
    if (o.routines && o.content !== 'data') args.push('--routines');
    if (o.events && o.content !== 'data') args.push('--events');
    if (!o.addDrop) args.push('--skip-add-drop-table');
    if (o.createDb && o.allTables) args.push('--databases', o.database);
    else args.push(o.database, ...(o.allTables ? [] : o.tables));

    // Progress is weighted by table size so big tables move the ring proportionally.
    this.weights = o.weights || {};
    this.list = o.tables;
    this.totalWeight = this.list.reduce((s, t) => s + this.weight(t), 0) || 1;

    const part = o.file + '.part';
    this.log('info', `Running ${tool.bin} on ${o.conn.host}:${o.conn.port} / \`${o.database}\` (${this.list.length} table${this.list.length === 1 ? '' : 's'})`);
    return new Promise((resolve) => {
      const child = spawn(tool.bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      this.child = child;
      let stderrBuf = '';
      child.stderr.on('data', (d) => {
        stderrBuf += d.toString();
        let i;
        while ((i = stderrBuf.indexOf('\n')) !== -1) { this.handleStderr(stderrBuf.slice(0, i).trim()); stderrBuf = stderrBuf.slice(i + 1); }
      });

      let tail = '';
      const self = this;
      const scan = new Transform({
        transform(chunk, _enc, cb) {
          self.written += chunk.length;
          const s = tail + chunk.toString('latin1');
          MARKER.lastIndex = 0;
          let m;
          while ((m = MARKER.exec(s))) self.onTable(Buffer.from(m[1], 'latin1').toString('utf8').replace(/``/g, '`'));
          tail = s.slice(-300);
          cb(null, chunk);
        },
      });
      const out = fs.createWriteStream(part);
      out.on('open', () => {});
      const stages = [child.stdout, scan];
      if (o.gzip) stages.push(zlib.createGzip({ level: 6 }));
      const counter = new Transform({ transform(chunk, _e, cb) { self.fileBytes += chunk.length; cb(null, chunk); } });
      stages.push(counter, out);

      const timer = setInterval(() => this.progress(), 200);
      let pipeErr = null, exitCode = null, pending = 2;
      const finish = () => {
        if (--pending) return;
        clearInterval(timer);
        if (stderrBuf.trim()) this.handleStderr(stderrBuf.trim());
        fs.rm(cnf, { force: true }, () => {});
        let status;
        if (this.cancelled) status = 'cancelled';
        else if (exitCode === 0 && !pipeErr) status = 'success';
        else status = 'failed';
        if (pipeErr && !this.cancelled && !this.errors.length) this.errors.push({ message: pipeErr.message });
        if (status === 'success') {
          try { fs.renameSync(part, o.file); } catch (e) { status = 'failed'; this.errors.push({ message: 'Could not save file: ' + e.message }); }
        }
        if (status !== 'success') { try { fs.rmSync(part, { force: true }); } catch {} }
        else { for (const t of this.list) this.done.add(t); this.current = null; }
        this.progress();
        resolve(this.result(status, exitCode));
      };
      pipeline(...stages, (err) => { if (err && !this.cancelled) pipeErr = err; finish(); });
      child.on('error', (e) => { pipeErr = e; });
      child.on('close', (code) => { exitCode = code; finish(); });
    });
  }

  weight(t) { return Math.max(16384, Number(this.weights[t]) || 0); }

  onTable(t) {
    if (t === this.current) return;
    if (this.current) this.done.add(this.current);
    this.current = t;
    this.tableStartBytes = this.written;
    this.log('info', `Exporting \`${t}\``);
  }

  handleStderr(line) {
    if (!line) return;
    if (/\[Warning\]/i.test(line)) return this.log('warn', line.replace(/^\S*(mysqldump|mariadb-dump):\s*/, ''));
    const code = Number((line.match(/(?:error:?\s*|\()(\d{4})\)?/i) || [])[1]) || null;
    const message = line.replace(/^\S*(mysqldump|mariadb-dump):\s*/, '');
    const err = { code, message, hint: code ? hintFor(code, message) : null };
    this.errors.push(err);
    this.log('error', message, err);
  }

  log(level, message, extra) { this.emit('log', { level, message, extra, t: Date.now() }); }

  progress() {
    const elapsed = (Date.now() - this.startedAt) / 1000;
    let doneW = 0;
    for (const t of this.done) doneW += this.weight(t);
    if (this.current && !this.done.has(this.current)) doneW += Math.min(this.weight(this.current) * 0.97, this.written - (this.tableStartBytes || 0));
    const frac = Math.min(1, doneW / this.totalWeight);
    const eta = frac > 0.01 ? (elapsed * (1 - frac)) / frac : null;
    this.emit('progress', {
      bytes: doneW, total: this.totalWeight, written: this.written, fileBytes: this.fileBytes,
      rate: elapsed > 0 ? this.written / elapsed : 0, eta, elapsed,
      table: this.current, tableCount: this.done.size, tablesTotal: this.list.length, errorCount: this.errors.length,
    });
  }

  result(status, code = null) {
    return { status, code, errors: this.errors, tables: this.done.size, tablesTotal: this.list?.length || 0, bytes: this.written, total: this.fileBytes, fileSize: this.fileBytes, durationMs: Date.now() - this.startedAt };
  }

  cancel() {
    this.cancelled = true;
    if (this.child) this.child.kill('SIGTERM');
  }
}

module.exports = { ExportJob, dumpToolInfo };
