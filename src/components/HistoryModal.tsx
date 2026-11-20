import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, Calendar } from 'lucide-react';
import type { TaskItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onOpenTask: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onOpenTask
}) => {
  const [search, setSearch] = useState('');

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-h-[85vh] flex flex-col rounded-2xl glass-container border border-white/15 shadow-glass overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Riwayat Task Selesai</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup riwayat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari riwayat task..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada task yang cocok dengan pencarian.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className="p-2.5 px-3 rounded-xl glass-card border border-white/5 hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="overflow-hidden">
                  <h3 className="text-xs font-medium text-slate-200 truncate hover:text-white">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.lastModified).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {task.completedAt || 'Selesai'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 px-4 bg-black/20 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Total {filteredTasks.length} task</span>
          <span className="font-mono text-[10px] text-slate-500">Tekan ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
};
