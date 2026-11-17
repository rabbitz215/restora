// Downloads a file over scp into a .part file, renamed into place on success.
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const SSH_OPTS = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15'];
const okHost = (h) => /^[\w.@-]+$/.test(h || '');
const okDir = (d) => /^[~\w./ -]+$/.test(d || '') && !d.includes('..');
const okName = (n) => /^[\w.()-]+\.sql(\.gz)?$/.test(n || '');

function check({ host, dir, name }) {
  if (!okHost(host)) throw new Error('Invalid host. Use a host name from ~/.ssh/config, or user@host.');
  if (!okDir(dir)) throw new Error('Invalid remote folder.');
  if (name !== undefined && !okName(name)) throw new Error('File name must end in .sql or .sql.gz');
}

function hintFor(msg, host = 'host') {
  if (/No such file/i.test(msg)) return 'That file is not on the server. Pick one from the "On the server" list, or change the date.';
  if (/Permission denied|publickey/i.test(msg)) return `SSH key login failed. Run \`ssh ${host}\` in a terminal once (unlock your key / add it to ssh-agent), then try again.`;
  if (/Could not resolve|Name or service not known/i.test(msg)) return 'Host not found. Check the Host entry in ~/.ssh/config.';
  if (/timed out|Connection refused|No route/i.test(msg)) return 'Could not reach the server. Check your network / VPN.';
  if (/Host key verification failed/i.test(msg)) return `The server is not in known_hosts yet. Connect once with \`ssh ${host}\` in a terminal to accept its key.`;
  return null;
}

// Lists dumps on the server: [{ name, size, mtime }]
function remoteList({ host, dir, glob = '*.sql.gz' }) {
  check({ host, dir });
  const d = dir.replace(/\/+$/, '').replace(/ /g, '\\ ');
  const cmd = `ls -l --time-style=+%s ${d}/${glob} 2>/dev/null || true`;
  return new Promise((resolve, reject) => {
    execFile('ssh', [...SSH_OPTS, host, cmd], { timeout: 30000, maxBuffer: 4 << 20 }, (err, stdout, stderr) => {
      if (err) { const m = (stderr || err.message).trim().split('\n').pop(); const e = new Error(m); e.hint = hintFor(m, host); return reject(Object.assign(e, { message: m + (e.hint ? ` — ${e.hint}` : '') })); }
      const files = [];
      for (const line of stdout.split('\n')) {
        const m = line.match(/^\S+\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d+)\s+(.+)$/);
        if (m) files.push({ size: Number(m[1]), mtime: Number(m[2]) * 1000, name: path.posix.basename(m[3]) });
      }
      resolve(files.sort((a, b) => b.mtime - a.mtime));
    });
  });
}

class FetchJob {
  constructor(id, opts, emit) {
    this.id = id;
    this.opts = opts; // { host, dir, name, folder, size? }
    this.emit = emit;
    this.errors = [];
    this.cancelled = false;
    this.startedAt = Date.now();
    this.bytes = 0;
  }

  log(level, message, extra) { this.emit('log', { level, message, extra, t: Date.now() }); }

  async run() {
    const o = this.opts;
    check(o);
    const dest = path.join(o.folder, o.name);
    const part = dest + '.part';
    this.dest = dest;
    if (!o.size) {
      try { const f = (await remoteList({ host: o.host, dir: o.dir, glob: o.name })).find((x) => x.name === o.name); if (f) o.size = f.size; } catch {}
    }
    this.total = o.size || 0;
    const remote = `${o.host}:${o.dir.replace(/\/+$/, '')}/${o.name}`;
    this.log('info', `scp ${remote} → ${dest}${this.total ? ` (${(this.total / 1048576).toFixed(0)} MB)` : ''}`);
    return new Promise((resolve) => {
      const child = spawn('scp', [...SSH_OPTS, '-q', remote, part], { stdio: ['ignore', 'pipe', 'pipe'] });
      this.child = child;
      let errBuf = '';
      child.stderr.on('data', (d) => { errBuf += d.toString(); });
      const timer = setInterval(() => this.progress(part), 300);
      child.on('error', (e) => { errBuf += e.message; });
      child.on('close', (code) => {
        clearInterval(timer);
        this.progress(part);
        let status = this.cancelled ? 'cancelled' : code === 0 ? 'success' : 'failed';
        for (const line of errBuf.split('\n').map((l) => l.trim()).filter(Boolean)) {
          if (this.cancelled) break;
          const err = { message: line, hint: hintFor(line, o.host) };
          this.errors.push(err);
          this.log('error', line, err);
        }
        if (status === 'success') {
          try { fs.renameSync(part, dest); } catch (e) { status = 'failed'; this.errors.push({ message: e.message }); }
        }
        if (status !== 'success') { try { fs.rmSync(part, { force: true }); } catch {} }
        if (status === 'failed' && !this.errors.length) this.errors.push({ message: `scp exited with code ${code}` });
        resolve({ status, code, errors: this.errors, file: dest, bytes: this.bytes, total: this.bytes, fileSize: this.bytes, durationMs: Date.now() - this.startedAt });
      });
    });
  }

  progress(part) {
    try { this.bytes = fs.statSync(part).size; } catch {}
    const elapsed = (Date.now() - this.startedAt) / 1000;
    const rate = elapsed > 0 ? this.bytes / elapsed : 0;
    const total = this.total || Math.max(this.bytes, 1);
    this.emit('progress', { bytes: this.bytes, total, rate, elapsed, eta: rate > 0 && this.total ? (this.total - this.bytes) / rate : null, written: this.bytes });
  }

  cancel() { this.cancelled = true; if (this.child) this.child.kill('SIGTERM'); }
}

module.exports = { FetchJob, remoteList };
