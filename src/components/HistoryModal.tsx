import { useEffect, useMemo, useState } from 'react';
import { Search, Close } from '../icons';
import { artStyle } from '../art';
import { ago, fullDate } from '../format';
import type { Session } from '../types';

interface Props { sessions: Session[]; now: number; onOpen: (s: Session) => void; onClose: () => void }

export function HistoryModal({ sessions, now, onOpen, onClose }: Props) {
  const [q, setQ] = useState('');
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? sessions.filter((s) => s.title.toLowerCase().includes(t)) : sessions;
  }, [q, sessions]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label="Riwayat sesi">
        <div className="sheet-head">
          <h3>Riwayat sesi</h3>
          <button className="icon" onClick={onClose} aria-label="Tutup"><Close width={15} height={15} /></button>
        </div>
        <label className="search"><Search width={15} height={15} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari sesi…" /></label>
        <div className="sheet-list">
          {list.length === 0 ? <div className="empty">Tidak ada yang cocok.</div> : list.map((s) => (
            <button key={s.id} className="row" onClick={() => onOpen(s)}>
              <span className="thumb sm" style={artStyle(s.id)} />
              <span className="grow"><b>{s.title}</b><small>{fullDate(s.updatedAt)}</small></span>
              <small className="ago">{ago(s.updatedAt, now)}</small>
            </button>
          ))}
        </div>
        <div className="sheet-foot">{list.length} sesi · ESC untuk menutup</div>
      </div>
    </div>
  );
}
