import { Play, Spark } from '../icons';
import { artStyle } from '../art';
import { ago, until, clock, dayLabel } from '../format';
import { pct } from '../model';
import type { Automation, Session } from '../types';

interface Props {
  session: Session | undefined;
  next: Automation | undefined;
  now: number;
  onOpen: (s: Session) => void;
}

export function Hero({ session, next, now, onOpen }: Props) {
  if (!session) {
    return (
      <section className="hero idle" style={artStyle(next?.id ?? 'idle')}>
        <div className="shade" />
        <div className="hero-body">
          <span className="chip"><Spark width={12} height={12} /> Standby</span>
          <h2>Tidak ada sesi yang berjalan</h2>
          <p>{next ? `Otomasi berikutnya: ${next.name}, ${dayLabel(next.nextRun, now).toLowerCase()} ${clock(next.nextRun)} (${until(next.nextRun, now)} lagi).` : 'Mulai chat baru di Antigravity, statusnya muncul di sini otomatis.'}</p>
        </div>
      </section>
    );
  }
  const p = pct(session);
  return (
    <section className="hero" style={artStyle(session.id)}>
      <div className="shade" />
      <div className="hero-body">
        <div className="chips">
          {session.state === 'needs_action'
            ? <span className="chip warn"><i className="dot" /> Perlu tindakan</span>
            : <span className="chip live"><i className="dot" /> Sedang berjalan</span>}
          {session.source && <span className="chip">{session.source}</span>}
        </div>
        <h2 title={session.title}>{session.title}</h2>
        <p className="step">{session.progress?.current ?? (session.state === 'needs_action' ? 'Agen menunggu persetujuan atau jawabanmu.' : 'Agen sedang bekerja…')}</p>
        <div className={`bar ${p === null ? 'indet' : ''}`} role="progressbar" aria-valuenow={p ?? undefined} aria-valuemin={0} aria-valuemax={100}>
          <i style={p === null ? undefined : { width: `${Math.max(4, p)}%` }} />
        </div>
        <div className="hero-foot">
          <button className="btn white" onClick={() => onOpen(session)}><Play width={13} height={13} /> Buka sesi</button>
          <span className="meta">{p !== null ? `${session.progress!.done}/${session.progress!.total} langkah · ` : ''}diperbarui {ago(session.updatedAt, now)}</span>
        </div>
      </div>
    </section>
  );
}
