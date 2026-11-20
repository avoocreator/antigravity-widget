import { Pin, Close } from '../icons';
import { clock } from '../format';

interface Props {
  now: number;
  active: number;
  needs: number;
  pinned: boolean;
  onPin: () => void;
  onHide: () => void;
}

export function Header({ now, active, needs, pinned, onPin, onHide }: Props) {
  const status = needs ? `${needs} butuh tindakan` : active ? `${active} sesi berjalan` : 'Semua tenang';
  return (
    <header className="pill header drag">
      <div className={`logo ${active || needs ? 'live' : ''}`}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 19 12 6l6 13" /><circle cx="12" cy="15" r="1.3" fill="#fff" /></svg>
      </div>
      <div className="titles">
        <b>Antigravity</b>
        <span className={needs ? 'warn' : ''}>{status}</span>
      </div>
      <time className="clock">{clock(now)}</time>
      <button className={`icon nodrag ${pinned ? 'on' : ''}`} onClick={onPin} title={pinned ? 'Lepas dari atas' : 'Selalu di atas'} aria-pressed={pinned}><Pin width={15} height={15} /></button>
      <button className="icon nodrag" onClick={onHide} title="Sembunyikan ke tray" aria-label="Sembunyikan"><Close width={15} height={15} /></button>
    </header>
  );
}
