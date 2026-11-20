import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ActionList, RunningList, Recent, Schedule } from './components/Sections';
import { HistoryModal } from './components/HistoryModal';
import { buildModel } from './model';
import type { Geom, Payload, Session } from './types';

export function App() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [backdrop, setBackdrop] = useState<string | null>(null);
  const [geom, setGeom] = useState<Geom | null>(null);
  const [pinned, setPinned] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    api.getState().then((s) => {
      setPayload(s.payload);
      setBackdrop(s.backdrop);
      setGeom(s.geom);
      setPinned(s.pinned);
    });
    const off = [api.onData(setPayload), api.onBackdrop(setBackdrop), api.onGeom(setGeom), api.onPinned(setPinned)];
    return () => off.forEach((f) => f());
  }, []);

  // Satu timer ringan untuk jam & waktu relatif; berhenti saat window tersembunyi.
  useEffect(() => {
    let t: number | undefined;
    const start = () => {
      setNow(Date.now());
      t = window.setInterval(() => setNow(Date.now()), 20_000);
    };
    const onVis = () => {
      window.clearInterval(t);
      if (!document.hidden) start();
    };
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const m = useMemo(() => buildModel(payload, now), [payload, now]);

  const open = useCallback(async (s: Session) => {
    const r = await window.electronAPI?.openSession(s.id, s.title);
    if (r && !r.ok && r.copied) {
      setToast('Judul sesi disalin. Buka Antigravity lalu cari di riwayat.');
      window.setTimeout(() => setToast(''), 3200);
    }
  }, []);

  const hero = m.running[0] ?? m.action[0];
  const style = {
    '--ox': `${geom?.ox ?? 0}px`,
    '--oy': `${geom?.oy ?? 0}px`,
    '--dw': `${geom?.dw ?? 1920}px`,
    '--dh': `${geom?.dh ?? 1080}px`,
    '--wall': backdrop ? `url(${backdrop})` : 'none',
  } as CSSProperties;

  return (
    <div className="frame" style={style}>
      <main className={`panel ${backdrop ? 'has-wall' : ''}`}>
        <div className="glass" aria-hidden />
        <div className="content">
          <Header now={now} active={m.running.length} needs={m.action.length} pinned={pinned}
            onPin={() => window.electronAPI?.togglePin()} onHide={() => window.electronAPI?.hide()} />

          <div className="scroll">
            {m.error ? (
              <div className="card notice">
                <b>{m.error.code === 'NO_SQLITE' ? 'Node.js terlalu lama' : m.error.code === 'NO_NODE' ? 'Node.js tidak ditemukan' : 'Gagal membaca data Antigravity'}</b>
                <small>{m.error.code === 'NO_SQLITE' ? 'Widget butuh Node.js 22.5 atau lebih baru di PATH (jalankan "node -v" untuk cek).' : m.error.message}</small>
              </div>
            ) : !m.dbFound ? (
              <div className="card notice">
                <b>Database Antigravity belum ditemukan</b>
                <small>Mencari di ~/.gemini/antigravity. Buka Antigravity dan mulai satu chat, lalu widget ini terisi sendiri.</small>
              </div>
            ) : (
              <>
                <Hero session={hero} next={m.automations[0]} now={now} onOpen={open} />
                <ActionList sessions={hero && hero.state === 'needs_action' ? m.action.slice(1) : m.action} now={now} onOpen={open} />
                <RunningList sessions={m.running.slice(1)} now={now} onOpen={open} />
                <Recent sessions={m.recent} total={m.history.length} now={now} onOpen={open} onHistory={() => setHistory(true)} />
                <Schedule items={m.automations} now={now} />
              </>
            )}
          </div>
        </div>
        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
      {history && <HistoryModal sessions={m.history} now={now} onOpen={open} onClose={() => setHistory(false)} />}
    </div>
  );
}
