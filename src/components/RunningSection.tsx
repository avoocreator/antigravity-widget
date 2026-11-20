import React from 'react';
import { Loader2, ExternalLink, PlayCircle } from 'lucide-react';
import type { TaskItem } from '../types';

interface RunningProps {
  tasks: TaskItem[];
  onOpen: (id: string) => void;
}

export const RunningSection: React.FC<RunningProps> = ({ tasks, onOpen }) => {
  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5 text-accent-cyan" />
          <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Sedang Berjalan
          </h2>
        </div>
        {tasks.length > 0 && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
            {tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="p-3.5 rounded-2xl glass-card text-center text-xs text-slate-400">
          Tidak ada task aktif yang sedang berjalan.
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-2xl glass-card border border-cyan-500/20 shadow-card transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-accent-cyan animate-spin shrink-0" />
                  <h3 className="text-sm font-medium text-slate-100 leading-snug">
                    {task.title}
                  </h3>
                </div>
                <button
                  onClick={() => onOpen(task.id)}
                  className="text-slate-400 hover:text-cyan-300 p-1 rounded-md hover:bg-white/5 transition-colors"
                  title="Buka di Antigravity"
                  aria-label="Buka di Antigravity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {task.stepInfo && (
                <p className="text-xs text-slate-300 mb-2 pl-6">
                  {task.stepInfo}
                </p>
              )}

              {/* Progress Bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-accent-cyan to-accent-emerald h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${task.progress ?? 50}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
