export type TaskCategory = 'running' | 'action_required' | 'scheduled' | 'completed';

export interface TaskItem {
  id: string;
  title: string;
  status: 'running' | 'action_required' | 'scheduled' | 'completed' | 'idle';
  category: TaskCategory;
  stepInfo?: string;
  progress?: number;
  actionText?: string;
  actionType?: 'approval' | 'input' | 'retry';
  scheduledTime?: string;
  cronExpr?: string;
  relativeSchedule?: string;
  completedAt?: string;
  lastModified: number;
  workspace?: string;
}

export interface WidgetData {
  agentStatus: 'active' | 'idle';
  runningTasks: TaskItem[];
  actionRequiredTasks: TaskItem[];
  scheduledTasks: TaskItem[];
  completedRecentTasks: TaskItem[];
  allHistoryTasks: TaskItem[];
  summary: {
    runningCount: number;
    actionCount: number;
    scheduledCount: number;
    completedRecentCount: number;
    totalHistoryCount: number;
  };
}

export interface ElectronAPI {
  getWidgetData: () => Promise<WidgetData>;
  onDataUpdate: (callback: (data: WidgetData) => void) => () => void;
  openConversation: (id: string) => Promise<void>;
  resolveAction: (id: string, action: 'approve' | 'reject') => Promise<void>;
  minimizeWidget: () => Promise<void>;
  closeWidget: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
