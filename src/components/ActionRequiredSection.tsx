import React from 'react';
import { AlertCircle, Check, X, ExternalLink } from 'lucide-react';
import type { TaskItem } from '../types';

interface ActionRequiredProps {
  tasks: TaskItem[];
  onResolve: (id: string, action: 'approve' | 'reject') => void;
  onOpen: (id: string) => void;
}

export const ActionRequiredSection: React.FC<ActionRequiredProps> = ({
  tasks,
  onResolve,
  onOpen
}) => {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-accent-amber animate-pulse" />
          <h2 className="text-xs font-semibold tracking-wider uppercase text-amber-300">
            Perlu Tindakan
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-md shadow-card transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
                <h3 className="text-sm font-medium text-slate-100 leading-snug">
                  {task.title}
                </h3>
              </div>
              <button
                onClick={() => onOpen(task.id)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-colors"
                title="Buka percakapan"
                aria-label="Buka percakapan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {task.actionText && (
              <p className="text-xs text-slate-300 mb-3 pl-6 leading-relaxed">
                {task.actionText}
              </p>
            )}

            {/* Tombol Aksi Cepat */}
            <div className="flex items-center gap-2 pl-6">
              <button
                onClick={() => onResolve(task.id, 'approve')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-emerald/20 hover:bg-accent-emerald/30 text-emerald-300 border border-accent-emerald/40 text-xs font-medium transition-all shadow-sm active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Setujui</span>
              </button>

              <button
                onClick={() => onResolve(task.id, 'reject')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tolak</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
