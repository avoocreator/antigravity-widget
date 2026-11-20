// Diagnosis: node electron/inspect.mjs   (atau: npm run inspect)
// Menampilkan struktur database Antigravity + nilai status yang dipakai, TANPA isi chat
// (judul dipotong 24 huruf). Aman ditempel ke issue / chat kalau status sesi tidak terbaca benar.

import fs from 'node:fs';
import path from 'node:path';
import { GEMINI_DIR, AUTOMATION_DIRS, toMs } from './reader.mjs';

const dbPath = path.join(GEMINI_DIR, 'antigravity', 'conversation_summaries.db');
const line = (s = '') => console.log(s);

line(`Folder Gemini : ${GEMINI_DIR}`);
line(`Database      : ${dbPath} ${fs.existsSync(dbPath) ? '(ada)' : '(TIDAK ADA)'}`);
line(`Node          : ${process.version}`);
line();

if (fs.existsSync(dbPath)) {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    line(`Tabel: ${tables.map((t) => t.name).join(', ')}`);
    const cols = db.prepare('PRAGMA table_info(conversation_summaries)').all();
    line(`Kolom conversation_summaries: ${cols.map((c) => `${c.name}:${c.type || '?'}`).join(', ')}`);
    line();

    const dist = (col) => {
      if (!cols.some((c) => c.name === col)) return;
      const rows = db
        .prepare(`SELECT ${col} AS v, COUNT(*) AS n FROM conversation_summaries GROUP BY ${col} ORDER BY n DESC LIMIT 15`)
        .all();
      line(`${col}:`);
      for (const r of rows) line(`  ${String(r.v).padEnd(44)} ${r.n}`);
    };
    for (const c of ['status', 'source', 'not_fully_idle', 'killed']) dist(c);
    line();

    const rows = db.prepare('SELECT * FROM conversation_summaries ORDER BY last_modified_time DESC LIMIT 5').all();
    line('5 sesi terbaru:');
    for (const r of rows) {
      const ago = Math.round((Date.now() - toMs(r.last_modified_time)) / 60000);
      line(
        `  ${String(r.title ?? '').slice(0, 24).padEnd(25)} status=${r.status} idle=${r.not_fully_idle} killed=${r.killed} ` +
          `(${ago} menit lalu, raw="${r.last_modified_time}")`,
      );
    }
  } finally {
    db.close();
  }
}

line();
line('Folder otomasi (cron):');
for (const dir of AUTOMATION_DIRS) {
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    line(`  ${dir}  (tidak ada)`);
    continue;
  }
  line(`  ${dir}  (${files.length} file json)`);
  for (const f of files.slice(0, 3)) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      line(`    ${f}: kunci = ${Object.keys(j).join(', ')}`);
    } catch {
      line(`    ${f}: bukan JSON valid`);
    }
  }
}
