const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const db = require('./db');

function detectDelimiter(sample) {
  const line = sample.split(/\r?\n/).find((l) => l.trim()) || '';
  const cands = [',', ';', '\t', '|'];
  let best = ',', bestN = 0;
  for (const d of cands) {
    const n = line.split(d).length - 1;
    if (n > bestN) { best = d; bestN = n; }
  }
  return best;
}

function sanitizeName(s, i) {
  let n = String(s || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!n) n = `column_${i + 1}`;
  if (/^\d/.test(n)) n = 'c_' + n;
  return n.slice(0, 64);
}

function inferType(values) {
  const v = values.filter((x) => x !== '' && x != null);
  if (!v.length) return 'VARCHAR(255)';
  if (v.every((x) => /^-?\d{1,18}$/.test(x))) return v.every((x) => Math.abs(Number(x)) < 2147483647) ? 'INT' : 'BIGINT';
  if (v.every((x) => /^-?\d+(\.\d+)?$/.test(x))) return 'DECIMAL(20,6)';
  if (v.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x))) return 'DATE';
  if (v.every((x) => /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(x))) return 'DATETIME';
  if (v.every((x) => /^(true|false)$/i.test(x))) return 'TINYINT(1)';
  const max = Math.max(...v.map((x) => x.length));
  return max <= 191 ? 'VARCHAR(255)' : 'TEXT';
}

async function preview(file, { delimiter, header = true } = {}) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(256 * 1024);
  const n = fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  let sample = buf.slice(0, n).toString('utf8');
  if (n === buf.length) sample = sample.slice(0, sample.lastIndexOf('\n') + 1);
  const delim = delimiter || detectDelimiter(sample);
  const records = await new Promise((resolve, reject) => {
    parse(sample, { delimiter: delim, bom: true, relax_column_count: true, relax_quotes: true, skip_empty_lines: true, to: 201 }, (err, out) => (err ? reject(err) : resolve(out)));
  });
  const width = Math.max(0, ...records.map((r) => r.length));
  const head = header && records.length ? records[0] : Array.from({ length: width }, (_, i) => `column_${i + 1}`);
  const rows = header ? records.slice(1) : records;
  const columns = Array.from({ length: width }, (_, i) => {
    const vals = rows.map((r) => r[i] ?? '');
    return { index: i, header: head[i] ?? `column_${i + 1}`, name: sanitizeName(head[i], i), type: inferType(vals) };
  });
  return { path: file, name: path.basename(file), size: fs.statSync(file).size, delimiter: delim, header, columns, rows: rows.slice(0, 50) };
}

class CsvJob {
  constructor(id, opts, emit) {
    this.id = id; this.opts = opts; this.emit = emit;
    this.cancelled = false; this.errors = []; this.rows = 0; this.bytes = 0; this.startedAt = Date.now();
  }
  log(level, message) { this.emit('log', { level, message, t: Date.now() }); }
  progress() {
    const elapsed = (Date.now() - this.startedAt) / 1000;
    const rate = elapsed > 0 ? this.bytes / elapsed : 0;
    this.emit('progress', { bytes: this.bytes, total: this.total, rate, eta: rate > 0 ? (this.total - this.bytes) / rate : null, elapsed, rows: this.rows, table: this.opts.table, errorCount: this.errors.length });
  }
  cancel() { this.cancelled = true; try { this.src && this.src.destroy(); } catch {} }

  async run() {
    const o = this.opts; // { conn, database, table, createTable, truncate, mode, emptyAsNull, delimiter, header, mapping:[{index, column, type}] , file }
    this.total = fs.statSync(o.file).size;
    const mapping = o.mapping.filter((m) => m.column);
    const timer = setInterval(() => this.progress(), 200);
    let c;
    try {
      c = await db.connect(o.conn, o.database);
      await c.query('SET NAMES utf8mb4');
      if (o.createTable) {
        const cols = mapping.map((m) => `${db.qi(m.column)} ${m.type || 'TEXT'} NULL`).join(',\n  ');
        await c.query(`CREATE TABLE IF NOT EXISTS ${db.qi(o.table)} (\n  ${cols}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        this.log('info', `Created table \`${o.table}\``);
      }
      if (o.truncate) { await c.query(`DELETE FROM ${db.qi(o.table)}`); this.log('info', `Emptied \`${o.table}\``); }
      const verb = o.mode === 'replace' ? 'REPLACE' : o.mode === 'ignore' ? 'INSERT IGNORE' : 'INSERT';
      const sqlHead = `${verb} INTO ${db.qi(o.table)} (${mapping.map((m) => db.qi(m.column)).join(', ')}) VALUES ?`;

      this.src = fs.createReadStream(o.file);
      this.src.on('data', (d) => { this.bytes += d.length; });
      const parser = this.src.pipe(parse({ delimiter: o.delimiter, bom: true, relax_column_count: true, relax_quotes: true, skip_empty_lines: true, from_line: o.header ? 2 : 1 }));
      this.log('info', `Importing into \`${o.database}\`.\`${o.table}\` (${verb})`);
      await c.beginTransaction();
      let batch = [];
      const flush = async () => {
        if (!batch.length) return;
        try {
          await c.query(sqlHead, [batch]);
        } catch (e) {
          this.errors.push({ code: e.errno, message: e.sqlMessage || e.message, line: this.rows + 1 });
          this.log('error', `Rows ${this.rows + 1}–${this.rows + batch.length}: ${e.sqlMessage || e.message}`);
          if (!o.force) throw e;
        }
        this.rows += batch.length;
        batch = [];
      };
      for await (const rec of parser) {
        if (this.cancelled) break;
        batch.push(mapping.map((m) => {
          const v = rec[m.index];
          if (v === undefined) return null;
          if (o.emptyAsNull && v === '') return null;
          return v;
        }));
        if (batch.length >= 1000) await flush();
      }
      if (!this.cancelled) await flush();
      if (this.cancelled) { await c.rollback(); this.log('warn', 'Cancelled — changes rolled back'); }
      else { await c.commit(); this.log('success', `Imported ${this.rows.toLocaleString()} rows`); }
      return this.finish(this.cancelled ? 'cancelled' : this.errors.length ? 'warning' : 'success', timer, c);
    } catch (e) {
      if (!this.errors.length || this.errors[this.errors.length - 1].message !== (e.sqlMessage || e.message)) {
        this.errors.push({ code: e.errno, message: e.sqlMessage || e.message });
        this.log('error', e.sqlMessage || e.message);
      }
      try { await c.rollback(); } catch {}
      return this.finish(this.cancelled ? 'cancelled' : 'failed', timer, c);
    }
  }
  finish(status, timer, c) {
    clearInterval(timer);
    this.progress();
    if (c) c.end().catch(() => {});
    return { status, rows: this.rows, errors: this.errors, bytes: this.bytes, total: this.total, durationMs: Date.now() - this.startedAt };
  }
}

module.exports = { preview, CsvJob };
