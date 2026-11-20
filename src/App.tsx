import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ActionRequiredSection } from './components/ActionRequiredSection';
import { RunningSection } from './components/RunningSection';
import { ScheduledSection } from './components/ScheduledSection';
import { CompletedSection } from './components/CompletedSection';
import { HistoryModal } from './components/HistoryModal';
import type { WidgetData } from './types';

// Fallback data untuk mode browser preview
const initialData: WidgetData = {
  agentStatus: 'idle',
  runningTasks: [],
  actionRequiredTasks: [],
  scheduledTasks: [
    {
      id: 'sched-1',
      title: 'Daily Codebase & Git Sync',
      status: 'scheduled',
      category: 'scheduled',
      cronExpr: '0 17 * * 1-5',
      scheduledTime: 'Hari ini, 17:00 WIB',
      relativeSchedule: 'dalam 6 jam',
      lastModified: Date.now()
    }
  ],
  completedRecentTasks: [],
  allHistoryTasks: [],
  summary: {
    runningCount: 0,
    actionCount: 0,
    scheduledCount: 1,
    completedRecentCount: 0,
    totalHistoryCount: 0
  }
};

export const App: React.FC = () => {
  const [data, setData] = useState<WidgetData>(initialData);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.getWidgetData();
        setData(res);
      } catch (err) {
        console.error('Failed to get widget data:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onDataUpdate((updatedData) => {
        setData(updatedData);
      });
      return () => unsubscribe();
    }
  }, [loadData]);

  const handleResolveAction = async (id: string, action: 'approve' | 'reject') => {
    if (window.electronAPI) {
      await window.electronAPI.resolveAction(id, action);
    } else {
      // Local preview fallback
      setData((prev) => ({
        ...prev,
        actionRequiredTasks: prev.actionRequiredTasks.filter((t) => t.id !== id),
        summary: {
          ...prev.summary,
          actionCount: prev.summary.actionCount - 1
        }
      }));
    }
  };

  const handleOpenConversation = (id: string) => {
    if (window.electronAPI) {
      window.electronAPI.openConversation(id);
    } else {
      console.log('Open conversation:', id);
    }
  };

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWidget();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWidget();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col p-3 box-border">
      {/* Container Frosted Glass Utama sesuai Foto 2 */}
      <main className="w-full flex-1 flex flex-col p-4 rounded-3xl glass-container overflow-hidden">
        {/* Header Pill */}
        <Header
          agentStatus={data.agentStatus}
          runningCount={data.summary.runningCount}
          onRefresh={loadData}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />

        {/* Body Scrollable Sections */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat data Antigravity...
            </div>
          ) : (
            <>
              {/* Section 1: Perlu Tindakan */}
              <ActionRequiredSection
                tasks={data.actionRequiredTasks}
                onResolve={handleResolveAction}
                onOpen={handleOpenConversation}
              />

              {/* Section 2: Sedang Berjalan */}
              <RunningSection
                tasks={data.runningTasks}
                onOpen={handleOpenConversation}
              />

              {/* Section 3: Jadwal Berikutnya */}
              <ScheduledSection tasks={data.scheduledTasks} />

              {/* Section 4: Selesai 24 Jam Terakhir */}
              <CompletedSection
                tasks={data.completedRecentTasks}
                totalHistoryCount={data.summary.totalHistoryCount}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenTask={handleOpenConversation}
              />
            </>
          )}
        </div>
      </main>

      {/* Modal History Lengkap */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tasks={data.allHistoryTasks}
        onOpenTask={handleOpenConversation}
      />
    </div>
  );
};
export default App;
