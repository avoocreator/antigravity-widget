import { useRef } from 'react';
import { Alert, Play, Clock, History } from '../icons';
import { artStyle } from '../art';
import { ago, until, clock, dayLabel } from '../format';
import type { Automation, Session } from '../types';

export function Heading({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="heading">
      <h3>{title}{count ? <em>{count}</em> : null}</h3>
      {action}
    </div>
  );
}

export function RunningList({ sessions, now, onOpen }: { sessions: Session[]; now: number; onOpen: (s: Session) => void }) {
  if (!sessions.length) return null;
  return (
    <section>
      <Heading title="Berjalan juga" count={sessions.length} />
      <div className="stack">
        {sessions.map((s) => (
          <button key={s.id} className="row card" onClick={() => onOpen(s)}>
            <span className="thumb" style={artStyle(s.id)} />
            <span className="grow"><b>{s.title}</b><small>{s.progress?.current ?? 'Sedang memproses…'} · {ago(s.updatedAt, now)}</small></span>
            <span className="spin" aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
}

export function ActionList({ sessions, now, onOpen }: { sessions: Session[]; now: number; onOpen: (s: Session) => void }) {
  if (!sessions.length) return null;
  return (
    <section>
      <Heading title="Perlu tindakan" count={sessions.length} />
      <div className="stack">
        {sessions.map((s) => (
          <button key={s.id} className="row card amber" onClick={() => onOpen(s)}>
            <span className="badge"><Alert width={16} height={16} /></span>
            <span className="grow"><b>{s.title}</b><small>Menunggu kamu di Antigravity · {ago(s.updatedAt, now)}</small></span>
            <span className="btn amberbtn">Buka</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Recent({ sessions, total, now, onOpen, onHistory }: { sessions: Session[]; total: number; now: number; onOpen: (s: Session) => void; onHistory: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section>
      <Heading
        title="Selesai 24 jam terakhir"
        count={sessions.length}
        action={total > 0 && <button className="link" onClick={onHistory}><History width={12} height={12} /> Riwayat</button>}
      />
      {sessions.length === 0 ? (
        <div className="empty card">Belum ada sesi selesai dalam 24 jam terakhir.</div>
      ) : (
        <div
          className="rail"
          ref={ref}
          onWheel={(e) => {
            if (ref.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) ref.current.scrollLeft += e.deltaY;
          }}
        >
          {sessions.slice(0, 12).map((s) => (
            <button key={s.id} className="tile" style={artStyle(s.id)} onClick={() => onOpen(s)} title={s.title}>
              <span className="shade" />
              <span className="tile-body">
                <small>{ago(s.updatedAt, now)}</small>
                <b>{s.title}</b>
              </span>
              <span className="go"><Play width={12} height={12} /></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function Schedule({ items, now }: { items: Automation[]; now: number }) {
  return (
    <section>
      <Heading title="Jadwal otomasi" count={items.length} />
      {items.length === 0 ? (
        <div className="empty card">Belum ada otomasi terjadwal.</div>
      ) : (
        <div className="stack">
          {items.map((a, i) => (
            <div key={a.id} className={`row card sched ${i === 0 ? 'first' : ''}`}>
              <span className="when">{clock(a.nextRun)}</span>
              <span className="grow"><b>{a.name}</b><small>{dayLabel(a.nextRun, now)} · {a.repeat}</small></span>
              <span className="count"><Clock width={11} height={11} /> {until(a.nextRun, now)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
