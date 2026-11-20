import type { Automation, Payload, Session } from './types';

const DAY = 24 * 3600_000;

export interface Model {
  running: Session[];
  action: Session[];
  recent: Session[]; // selesai/idle dalam 24 jam terakhir
  history: Session[]; // semua sesi idle (untuk riwayat)
  automations: Automation[];
  error: Extract<Payload, { type: 'error' }> | null;
  dbFound: boolean;
}

export function buildModel(p: Payload | null, now: number): Model {
  const m: Model = { running: [], action: [], recent: [], history: [], automations: [], error: null, dbFound: true };
  if (!p) return m;
  if (p.type === 'error') {
    m.error = p;
    return m;
  }
  m.dbFound = p.dbFound;
  for (const s of p.sessions) {
    if (s.state === 'running') m.running.push(s);
    else if (s.state === 'needs_action') m.action.push(s);
    else {
      m.history.push(s);
      if (now - s.updatedAt < DAY) m.recent.push(s);
    }
  }
  m.automations = p.automations.filter((a) => a.nextRun > now - 60_000).slice(0, 4);
  return m;
}

export const pct = (s: Session) =>
  s.progress && s.progress.total ? Math.round((s.progress.done / s.progress.total) * 100) : null;
