import React from 'react';
import { CheckCircle2, ChevronRight, History } from 'lucide-react';
import type { TaskItem } from '../types';

interface CompletedProps {
  tasks: TaskItem[];
  totalHistoryCount: number;
  onOpenHistory: () => void;
  onOpenTask: (id: string) => void;
}

export const CompletedSection: React.FC<CompletedProps> = ({
  tasks,
  totalHistoryCount,
  onOpenHistory,
  onOpenTask
}) => {
  return (
    <section className="mb-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
          <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Selesai (24 Jam Terakhir)
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="p-3 rounded-2xl glass-card text-center text-xs text-slate-400 mb-2">
          Belum ada task selesai dalam 24 jam terakhir.
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onOpenTask(task.id)}
              className="p-2.5 px-3 rounded-xl glass-card border border-white/5 flex items-center justify-between gap-2 cursor-pointer hover:border-white/15 transition-all group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                  {task.title}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {task.completedAt || 'Baru saja'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tombol Lihat Semua History */}
      <button
        onClick={onOpenHistory}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl glass-pill text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all group active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          <span>Lihat Riwayat Lengkap</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 group-hover:text-white">
          <span className="text-[11px] font-mono">{totalHistoryCount} task</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </section>
  );
};
