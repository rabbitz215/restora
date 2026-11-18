// SSH tunnels: forwards a random local port through an SSH server (optionally via a
// jump host) to the MySQL server, so mysql2 and the mysql / mysqldump CLIs can all
// connect to 127.0.0.1:<port> without knowing about SSH.
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { Client } = require('ssh2');

const tunnels = new Map(); // key -> Promise<{ port, close }>

function agentSocket() {
  if (process.env.SSH_AUTH_SOCK) return process.env.SSH_AUTH_SOCK;
  if (process.platform === 'win32') return '\\\\.\\pipe\\openssh-ssh-agent';
  return null;
}

function agentInfo() {
  const sock = agentSocket();
  if (!sock) return { found: false };
  if (process.platform === 'win32') return { found: true, sock };
  try { return { found: fs.statSync(sock).isSocket(), sock }; } catch { return { found: false, sock }; }
}

const expandHome = (p) => (p && /^~(?=$|[\\/])/.test(p) ? path.join(os.homedir(), p.slice(1)) : p);

// "user@host:port", "host:port", "host" -> { user, host, port }
function parseHostSpec(spec, defUser) {
  let s = String(spec || '').trim(), user = defUser;
  const at = s.lastIndexOf('@');
  if (at > 0) { user = s.slice(0, at); s = s.slice(at + 1); }
  let port = 22;
  const m = s.match(/^\[(.+)\](?::(\d+))?$/) || s.match(/^([^:]+)(?::(\d+))?$/);
  if (m) { s = m[1]; if (m[2]) port = Number(m[2]); }
  return { user, host: s, port };
}

function authConfig(ssh) {
  const auth = ssh.auth || 'password';
  if (auth === 'agent') {
    const a = agentInfo();
    if (!a.found) throw new Error('SSH agent not found (SSH_AUTH_SOCK is not set). Start ssh-agent and add your key, or use a key file.');
    return { agent: a.sock };
  }
  if (auth === 'key') {
    const file = expandHome(String(ssh.keyFile || '').trim());
    if (!file) throw new Error('Choose a private key file for the SSH tunnel');
    let privateKey;
    try { privateKey = fs.readFileSync(file); } catch (e) { throw new Error(`Cannot read SSH key file ${file}: ${e.code === 'ENOENT' ? 'file not found' : e.message}`); }
    return { privateKey, passphrase: ssh.passphrase || undefined };
  }
  return { password: ssh.password || '', tryKeyboard: true };
}

function friendly(err, where) {
  const m = err && (err.message || String(err));
  if (err?.level === 'client-authentication') return new Error(`SSH authentication failed on ${where}. Check the login and password / key.`);
  if (/passphrase/i.test(m) || /Encrypted private/i.test(m)) return new Error(/no passphrase/i.test(m) ? 'The SSH key is encrypted: enter its passphrase' : `Wrong passphrase for the SSH key (${m})`);
  if (/Cannot parse privateKey/i.test(m)) return new Error(`Unsupported or invalid SSH private key: ${m}`);
  if (err?.code === 'ENOTFOUND' || err?.code === 'EAI_AGAIN') return new Error(`SSH host not found: ${where}`);
  if (err?.code === 'ECONNREFUSED') return new Error(`SSH connection refused by ${where}`);
  if (/Timed out/i.test(m) || err?.code === 'ETIMEDOUT') return new Error(`SSH connection to ${where} timed out`);
  return new Error(`SSH (${where}): ${m}`);
}

function sshConnect(cfg, where) {
  return new Promise((resolve, reject) => {
    const c = new Client();
    let done = false;
    c.on('keyboard-interactive', (_n, _i, _l, prompts, finish) => finish(prompts.map(() => cfg.password || '')));
    c.once('ready', () => { done = true; resolve(c); });
    c.once('error', (e) => { if (!done) { done = true; reject(friendly(e, where)); } });
    try { c.connect({ readyTimeout: 15000, keepaliveInterval: 15000, keepaliveCountMax: 3, ...cfg }); }
    catch (e) { done = true; reject(friendly(e, where)); }
  });
}

const forwardOut = (client, host, port) => new Promise((resolve, reject) =>
  client.forwardOut('127.0.0.1', 0, host, port, (err, stream) => (err ? reject(err) : resolve(stream))));

async function openTunnel(conn) {
  const ssh = conn.ssh;
  const { host, port } = parseHostSpec(`${ssh.host}:${Number(ssh.port) || 22}`);
  if (!host) throw new Error('Enter the SSH tunnel host');
  const user = String(ssh.user || '').trim() || os.userInfo().username;
  const auth = authConfig(ssh);
  const clients = [];
  const closeAll = () => { for (const c of clients) { try { c.end(); } catch {} } };

  try {
    let sock;
    if (String(ssh.jump || '').trim()) {
      const j = parseHostSpec(ssh.jump, user);
      const jump = await sshConnect({ host: j.host, port: j.port, username: j.user, ...auth }, `jump host ${j.host}:${j.port}`);
      clients.push(jump);
      try { sock = await forwardOut(jump, host, port); }
      catch (e) { throw new Error(`Jump host ${j.host} could not reach ${host}:${port}: ${e.message}`); }
    }
    const client = await sshConnect({ host, port, username: user, sock, ...auth }, `${host}:${port}`);
    clients.push(client);

    const dbHost = String(conn.host || '').trim() || '127.0.0.1';
    const dbPort = Number(conn.port) || 3306;
    // Fail fast if the SSH server cannot reach MySQL (wrong host/port, AllowTcpForwarding no…).
    try { (await forwardOut(client, dbHost, dbPort)).end(); }
    catch (e) { throw new Error(`SSH server ${host} could not reach MySQL at ${dbHost}:${dbPort}: ${e.message}`); }

    const server = net.createServer((local) => {
      client.forwardOut('127.0.0.1', local.remotePort || 0, dbHost, dbPort, (err, stream) => {
        if (err) { local.destroy(); return; }
        local.pipe(stream).pipe(local);
        local.on('error', () => stream.destroy());
        stream.on('error', () => local.destroy());
        stream.on('close', () => local.destroy());
      });
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    server.on('error', () => {});
    const close = () => { try { server.close(); } catch {} closeAll(); };
    return { port: server.address().port, close, client };
  } catch (e) { closeAll(); throw e; }
}

const keyOf = (conn) => JSON.stringify([conn.ssh.host, conn.ssh.port, conn.ssh.jump, conn.ssh.auth, conn.ssh.user, conn.ssh.password, conn.ssh.keyFile, conn.ssh.passphrase, conn.host, conn.port]);

// Returns the connection rewritten to go through its SSH tunnel (or unchanged if it has none).
async function route(conn, { fresh = false } = {}) {
  if (!conn?.ssh?.enabled) return conn;
  const via = (t) => ({ ...conn, host: '127.0.0.1', port: t.port, tunnel: { host: conn.ssh.host, dbHost: conn.host, dbPort: conn.port } });
  if (fresh) {
    const t = await openTunnel(conn);
    return { ...via(t), closeTunnel: t.close };
  }
  const key = keyOf(conn);
  let p = tunnels.get(key);
  if (!p) {
    p = openTunnel(conn).then((t) => {
      const drop = () => { if (tunnels.get(key) === p) tunnels.delete(key); t.close(); };
      t.client.on('close', drop);
      t.client.on('error', drop);
      return t;
    });
    tunnels.set(key, p);
    p.catch(() => { if (tunnels.get(key) === p) tunnels.delete(key); });
  }
  return via(await p);
}

function closeAllTunnels() {
  for (const p of tunnels.values()) p.then((t) => t.close(), () => {});
  tunnels.clear();
}

module.exports = { route, closeAllTunnels, agentInfo, parseHostSpec };
