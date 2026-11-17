// Persists connections (passwords encrypted with the OS keyring when available) and job history.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Store {
  constructor(dir, safeStorage) {
    this.dir = dir;
    this.safe = safeStorage;
    fs.mkdirSync(dir, { recursive: true });
    this.connFile = path.join(dir, 'connections.json');
    this.histFile = path.join(dir, 'history.json');
  }
  read(file, def) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; } }
  write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), { mode: 0o600 }); }

  enc(pw) {
    if (!pw) return { v: '' };
    if (this.safe && this.safe.isEncryptionAvailable()) return { e: this.safe.encryptString(pw).toString('base64') };
    return { p: Buffer.from(pw).toString('base64') };
  }
  dec(o) {
    if (!o) return '';
    if (o.e) { try { return this.safe.decryptString(Buffer.from(o.e, 'base64')); } catch { return ''; } }
    if (o.p) return Buffer.from(o.p, 'base64').toString();
    return '';
  }

  listConnections() {
    return this.read(this.connFile, []).map(({ password, ...c }) => ({ ...c, hasPassword: !!(password && (password.e || password.p)) }));
  }
  getConnection(id) {
    const c = this.read(this.connFile, []).find((x) => x.id === id);
    if (!c) throw new Error('Connection not found');
    return { ...c, password: this.dec(c.password) };
  }
  saveConnection(input) {
    const list = this.read(this.connFile, []);
    const id = input.id || crypto.randomUUID();
    const prev = list.find((x) => x.id === id);
    const rec = {
      id, name: input.name || `${input.user}@${input.host}`, color: input.color || '#7c5cff',
      host: input.host || '127.0.0.1', port: Number(input.port) || 3306, user: input.user || 'root', ssl: !!input.ssl,
      password: input.password !== undefined && input.password !== null ? this.enc(input.password) : prev ? prev.password : { v: '' },
    };
    const next = prev ? list.map((x) => (x.id === id ? rec : x)) : [...list, rec];
    this.write(this.connFile, next);
    return { ...rec, password: undefined };
  }
  deleteConnection(id) { this.write(this.connFile, this.read(this.connFile, []).filter((x) => x.id !== id)); }

  history() { return this.read(this.histFile, []); }
  addHistory(item) { this.write(this.histFile, [item, ...this.history()].slice(0, 100)); }
  clearHistory() { this.write(this.histFile, []); }
}

module.exports = { Store };
