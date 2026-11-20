// Pembaca data Antigravity. Jalan di Node sistem (butuh >= 22.5 untuk node:sqlite),
// BUKAN di dalam Electron (Electron 33 membawa Node 20 tanpa node:sqlite).
//
//   node reader.mjs            -> cetak satu snapshot JSON lalu keluar
//   node reader.mjs --watch    -> proses hidup terus, cetak satu baris JSON setiap ada perubahan
//
// Sumber data (semua read-only):
//   ~/.gemini/antigravity/conversation_summaries.db   sesi chat (conversation_summaries)
//   ~/.gemini/antigravity/brain/<id>/task.md          checklist progress sesi (opsional)
//   ~/.gemini/config/sidecars/*.json (dan folder sejenis)   otomasi terjadwal (cron)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GEMINI_DIR = process.env.AG_GEMINI_DIR || path.join(os.homedir(), '.gemini');
const DB_PATH = path.join(GEMINI_DIR, 'antigravity', 'conversation_summaries.db');
const BRAIN_DIR = path.join(GEMINI_DIR, 'antigravity', 'brain');
export const AUTOMATION_DIRS = [
  path.join(GEMINI_DIR, 'config', 'sidecars'),
  path.join(GEMINI_DIR, 'antigravity', 'automations'),
  path.join(GEMINI_DIR, 'antigravity', 'scheduled_tasks'),
];

const POLL_MS = 1500; // cek mtime file (murah); query SQLite hanya kalau ada perubahan
const FORCE_MS = 60_000; // paksa baca ulang tiap 60 dtk supaya jadwal berikutnya tetap segar
const MAX_SESSIONS = 300;
const STALE_MS = 6 * 3600_000; // "sedang berjalan" yang tak update > 6 jam dianggap macet/idle
// Status yang berarti agen menunggu respons kamu. Nilai asli bisa dicek dengan `npm run inspect`.
const ACTION_RE = /WAIT|BLOCK|APPROV|PERMISSION|CONFIRM|USER_INPUT|AWAITING|PAUSE/i;

// ---------------------------------------------------------------- util kecil

export function toMs(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    return n < 1e12 ? n * 1000 : n;
  }
  // 'YYYY-MM-DD HH:MM:SS' (format SQLite) tanpa zona = UTC
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)
    ? s.replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')
    : s;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function statMs(p) {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function humanize(raw) {
  if (!raw) return undefined;
  const s = String(raw)
    .replace(/^[A-Z]+_SOURCE_/, '')
    .replace(/^CONVERSATION_/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  if (!s) return undefined;
  const out = s.replace(/\b\w/g, (c) => c.toUpperCase());
  return out.length > 22 ? out.slice(0, 21) + '…' : out;
}

function cleanMd(s) {
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

// ---------------------------------------------------------------- sesi chat

function readProgress(id) {
  const file = path.join(BRAIN_DIR, id, 'task.md');
  let text;
  try {
    if (fs.statSync(file).size > 256 * 1024) return undefined;
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
  let done = 0;
  let total = 0;
  let active;
  let firstOpen;
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*[-*]\s+\[([ xX/])\]\s+(.*)$/.exec(line);
    if (!m) continue;
    total++;
    const mark = m[1];
    if (mark === 'x' || mark === 'X') done++;
    else if (mark === '/' && !active) active = cleanMd(m[2]);
    else if (mark === ' ' && !firstOpen) firstOpen = cleanMd(m[2]);
  }
  if (!total) return undefined;
  return { done, total, current: active || firstOpen };
}

function toSession(row, now) {
  const id = String(row.conversation_id ?? row.id ?? '');
  const title = String(row.title ?? '').trim();
  if (!id || !title) return null;

  const updatedAt = toMs(row.last_modified_time ?? row.updated_at);
  const statusRaw = String(row.status ?? '');
  const killed = Number(row.killed) === 1;
  const busy = Number(row.not_fully_idle) === 1 || /RUNNING/i.test(statusRaw);
  const fresh = now - updatedAt < STALE_MS;

  let state = 'idle';
  if (!killed && fresh) {
    if (ACTION_RE.test(statusRaw)) state = 'needs_action';
    else if (busy) state = 'running';
  }

  const s = {
    id,
    title: title.slice(0, 200),
    state,
    statusRaw,
    source: humanize(row.source),
    updatedAt,
  };
  if (state !== 'idle') {
    const progress = readProgress(id);
    if (progress) s.progress = progress;
  }
  return s;
}

async function readSessions(now) {
  if (!fs.existsSync(DB_PATH)) return { dbFound: false, sessions: [] };

  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import('node:sqlite'));
  } catch (e) {
    const err = new Error('Node.js di PATH belum mendukung node:sqlite (butuh >= 22.5).');
    err.code = 'NO_SQLITE';
    throw err;
  }

  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  try {
    try {
      db.exec('PRAGMA busy_timeout = 1500');
    } catch {
      /* tidak fatal */
    }
    const rows = db
      .prepare('SELECT * FROM conversation_summaries ORDER BY last_modified_time DESC LIMIT ?')
      .all(MAX_SESSIONS);
    const sessions = [];
    for (const r of rows) {
      const s = toSession(r, now);
      if (s) sessions.push(s);
    }
    return { dbFound: true, sessions };
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------- cron

const NAMES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function parseField(tok, min, max) {
  const out = new Set();
  const val = (x) => {
    if (/^\d+$/.test(x)) return Number(x);
    return NAMES[String(x).toLowerCase()];
  };
  for (const part of tok.split(',')) {
    const [range, stepStr] = part.split('/');
    const step = stepStr === undefined ? 1 : Number(stepStr);
    if (!Number.isInteger(step) || step < 1) return null;
    let lo;
    let hi;
    if (range === '*' || range === '?') {
      lo = min;
      hi = max;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      lo = val(a);
      hi = val(b);
    } else {
      lo = val(range);
      hi = stepStr === undefined ? lo : max;
    }
    if (lo == null || hi == null || lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out.size ? out : null;
}

export function parseCron(expr) {
  const t = String(expr).trim().split(/\s+/);
  if (t.length !== 5) return null;
  const minute = parseField(t[0], 0, 59);
  const hour = parseField(t[1], 0, 23);
  const dom = parseField(t[2], 1, 31);
  const month = parseField(t[3], 1, 12);
  const dowRaw = parseField(t[4], 0, 7);
  if (!minute || !hour || !dom || !month || !dowRaw) return null;
  const dow = new Set([...dowRaw].map((d) => d % 7));
  return {
    minute: [...minute].sort((a, b) => a - b),
    hour: [...hour].sort((a, b) => a - b),
    dom,
    month,
    dow,
    domStar: t[2].startsWith('*') || t[2] === '?',
    dowStar: t[4].startsWith('*') || t[4] === '?',
    dowText: t[4],
    domText: t[2],
    monthText: t[3],
  };
}

function dayMatches(c, d) {
  if (!c.month.has(d.getMonth() + 1)) return false;
  const domOk = c.dom.has(d.getDate());
  const dowOk = c.dow.has(d.getDay());
  if (c.domStar && c.dowStar) return true;
  if (c.domStar) return dowOk;
  if (c.dowStar) return domOk;
  return domOk || dowOk; // semantik cron standar bila keduanya dibatasi
}

// Waktu lokal, cari maksimal 45 hari ke depan.
export function nextRun(expr, from = Date.now()) {
  const c = typeof expr === 'string' ? parseCron(expr) : expr;
  if (!c) return null;
  for (let add = 0; add <= 45; add++) {
    const day = new Date(from);
    day.setDate(day.getDate() + add);
    day.setHours(0, 0, 0, 0);
    if (!dayMatches(c, day)) continue;
    for (const h of c.hour) {
      for (const m of c.minute) {
        const t = new Date(day);
        t.setHours(h, m, 0, 0);
        if (t.getTime() > from) return t.getTime();
      }
    }
  }
  return null;
}

const DOW_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function describeRepeat(c) {
  if (c.monthText !== '*' || !c.domStar) return 'Terjadwal';
  if (c.dowStar) return 'Setiap hari';
  const days = [...c.dow].sort((a, b) => a - b);
  if (days.join() === '1,2,3,4,5') return 'Hari kerja';
  if (days.join() === '0,6') return 'Akhir pekan';
  return days.map((d) => DOW_NAMES[d]).join(', ');
}

// ---------------------------------------------------------------- otomasi

function findCron(obj, depth = 0) {
  if (obj == null || depth > 4) return null;
  if (typeof obj === 'string') return parseCron(obj) ? obj.trim() : null;
  if (typeof obj !== 'object') return null;
  for (const k of ['schedule', 'cron', 'cronExpr', 'cron_expression', 'cronExpression']) {
    if (typeof obj[k] === 'string' && parseCron(obj[k])) return obj[k].trim();
  }
  for (const v of Object.values(obj)) {
    const hit = findCron(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}

function prettyName(file) {
  return path
    .basename(file, path.extname(file))
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readAutomations(now) {
  const out = [];
  for (const dir of AUTOMATION_DIRS) {
    let files;
    try {
      files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json'));
    } catch {
      continue;
    }
    for (const f of files) {
      try {
        const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (json?.enabled === false || json?.disabled === true || json?.paused === true) continue;
        const cron = findCron(json);
        if (!cron) continue;
        const parsed = parseCron(cron);
        const next = nextRun(parsed, now);
        if (!next) continue;
        const name = String(json.name || json.title || json.args?.name || json.description || prettyName(f)).trim();
        out.push({
          id: `${path.basename(dir)}/${f}`,
          name: name.slice(0, 120),
          cron,
          nextRun: next,
          repeat: describeRepeat(parsed),
        });
      } catch {
        /* file rusak / bukan otomasi: lewati */
      }
    }
  }
  return out.sort((a, b) => a.nextRun - b.nextRun);
}

// ---------------------------------------------------------------- snapshot & watch

export async function snapshot() {
  const now = Date.now();
  const { dbFound, sessions } = await readSessions(now);
  return { type: 'data', dbFound, sessions, automations: readAutomations(now) };
}

function signature(watchIds) {
  const parts = [statMs(DB_PATH), statMs(DB_PATH + '-wal')];
  for (const id of watchIds) parts.push(statMs(path.join(BRAIN_DIR, id, 'task.md')));
  for (const dir of AUTOMATION_DIRS) {
    try {
      for (const f of fs.readdirSync(dir)) parts.push(statMs(path.join(dir, f)));
    } catch {
      /* folder tidak ada */
    }
  }
  return parts.join('|');
}

function emit(obj) {
  process.stdout.write(JSON.stringify({ ...obj, generatedAt: Date.now() }) + '\n');
}

function errorPayload(e) {
  const code = e?.code === 'NO_SQLITE' ? 'NO_SQLITE' : 'READ_FAILED';
  return { type: 'error', code, message: String(e?.message || e).slice(0, 300) };
}

async function watch() {
  // Mati otomatis kalau Electron (parent) mati: stdin pipe tertutup.
  process.stdin.resume();
  process.stdin.on('end', () => process.exit(0));
  process.stdin.on('error', () => process.exit(0));
  process.stdout.on('error', () => process.exit(0));

  let lastSig = '';
  let lastBody = '';
  let lastForce = 0;
  let watchIds = [];
  let busy = false;

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const now = Date.now();
      const sig = signature(watchIds);
      if (sig === lastSig && now - lastForce < FORCE_MS) return;
      lastSig = sig;
      lastForce = now;
      let snap;
      try {
        snap = await snapshot();
      } catch (e) {
        const body = JSON.stringify(errorPayload(e));
        if (body !== lastBody) {
          lastBody = body;
          emit(errorPayload(e));
        }
        return;
      }
      watchIds = snap.sessions.filter((s) => s.state !== 'idle').map((s) => s.id);
      const body = JSON.stringify(snap);
      if (body !== lastBody) {
        lastBody = body;
        emit(snap);
      }
    } finally {
      busy = false;
    }
  };

  await tick();
  setInterval(tick, POLL_MS);
}

const isMain = !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  if (process.argv.includes('--watch')) {
    watch();
  } else {
    snapshot()
      .then((s) => process.stdout.write(JSON.stringify(s, null, 2) + '\n'))
      .catch((e) => {
        process.stderr.write(String(e?.stack || e) + '\n');
        process.exit(1);
      });
  }
}
