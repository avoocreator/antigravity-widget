import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';
import type { TaskItem } from '../types';

interface ScheduledProps {
  tasks: TaskItem[];
}

export const ScheduledSection: React.FC<ScheduledProps> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-accent-indigo" />
          <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Jadwal Berikutnya
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 rounded-2xl glass-card border border-white/5 shadow-card transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-medium text-slate-200 leading-snug">
                {task.title}
              </h3>
              {task.relativeSchedule && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 shrink-0">
                  {task.relativeSchedule}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.scheduledTime || 'Terjadwal'}</span>
              </div>
              {task.cronExpr && (
                <span className="font-mono text-[11px] text-slate-500 px-1.5 py-0.2 rounded bg-black/20">
                  {task.cronExpr}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
