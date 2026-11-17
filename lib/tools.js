// Finds the MySQL / MariaDB command-line tools. Uses PATH first; on Windows it
// also looks in the usual install folders, since installers rarely add them to PATH.
const fs = require('fs');
const path = require('path');

const cache = new Map();

function windowsCandidates(name) {
  const exe = name + '.exe';
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], 'C:\\xampp', 'C:\\laragon\\bin\\mysql'].filter(Boolean);
  const out = [];
  for (const root of roots) {
    for (const vendor of ['MySQL', 'MariaDB', '']) {
      const base = vendor ? path.join(root, vendor) : root;
      let dirs = [];
      try { dirs = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { continue; }
      // Newest version first (e.g. "MySQL Server 8.4" before "MySQL Server 8.0").
      dirs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      for (const d of dirs) out.push(path.join(base, d, 'bin', exe));
    }
  }
  out.push(path.join('C:\\xampp', 'mysql', 'bin', exe));
  return out;
}

// Returns the command to spawn: the bare name (found on PATH) or a full path.
function resolveTool(name) {
  if (cache.has(name)) return cache.get(name);
  let found = name;
  if (process.platform === 'win32') {
    const onPath = (process.env.PATH || '').split(path.delimiter).some((d) => d && fs.existsSync(path.join(d, name + '.exe')));
    if (!onPath) found = windowsCandidates(name).find((p) => fs.existsSync(p)) || name;
  }
  cache.set(name, found);
  return found;
}

module.exports = { resolveTool };
