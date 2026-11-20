import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Minus, X, Activity } from 'lucide-react';

interface HeaderProps {
  agentStatus: 'active' | 'idle';
  runningCount: number;
  onRefresh: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  agentStatus,
  runningCount,
  onRefresh,
  onMinimize,
  onClose
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="titlebar-drag flex items-center justify-between px-4 py-3 rounded-2xl glass-pill shadow-card mb-4 select-none">
      {/* Kiri: Avatar & Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-white/15 shadow-inner">
          <Bot className="w-5 h-5 text-indigo-300" />
          {agentStatus === 'active' && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-emerald"></span>
            </span>
          )}
        </div>

        <div>
          <h1 className="text-sm font-semibold text-white tracking-wide leading-tight">
            Antigravity Hub
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                agentStatus === 'active' ? 'bg-accent-emerald animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300">
              {agentStatus === 'active' ? `${runningCount} task aktif` : 'Standby / Idle'}
            </span>
          </div>
        </div>
      </div>

      {/* Kanan: Clock Pill & Window Controls */}
      <div className="no-drag flex items-center gap-2">
        {/* Digital Clock Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/25 border border-white/5 text-xs font-mono font-medium text-slate-200">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>{time || '--:--'}</span>
        </div>

        {/* Action Controls */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Segarkan data"
          aria-label="Segarkan data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onMinimize}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Minimize ke taskbar"
          aria-label="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Tutup widget"
          aria-label="Tutup widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
