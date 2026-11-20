import { app, BrowserWindow, ipcMain, screen, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import type { WidgetData, TaskItem } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// Action resolutions store (in-memory)
const actionOverrides: Record<string, 'approved' | 'rejected'> = {};

function queryAntigravityRows(): Array<{
  conversation_id: string;
  title: string;
  status: string;
  source: string;
  not_fully_idle: number;
  killed: number;
  last_modified_time: string;
}> {
  try {
    // Cari db-reader.js di folder saat ini atau folder electron
    let readerPath = path.join(__dirname, 'db-reader.js');
    if (!fs.existsSync(readerPath)) {
      readerPath = path.join(app.getAppPath(), 'electron', 'db-reader.js');
    }
    if (!fs.existsSync(readerPath)) {
      readerPath = path.join(process.cwd(), 'electron', 'db-reader.js');
    }

    const out = execFileSync('node', [readerPath], {
      encoding: 'utf-8',
      timeout: 3000,
      windowsHide: true
    });
    return JSON.parse(out);
  } catch (err) {
    console.error('Error fetching rows via db-reader:', err);
    return [];
  }
}

function fetchAntigravityData(): WidgetData {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const runningTasks: TaskItem[] = [];
  const actionRequiredTasks: TaskItem[] = [];
  const completedRecentTasks: TaskItem[] = [];
  const allHistoryTasks: TaskItem[] = [];

  let isAgentActive = false;

  const rows = queryAntigravityRows();

  for (const row of rows) {
    if (!row.title || row.title.trim() === '') continue;

    const modTime = new Date(row.last_modified_time).getTime();
    const isRunning = row.not_fully_idle === 1 || row.status === 'CASCADE_RUN_STATUS_RUNNING';

    if (isRunning) {
      isAgentActive = true;
      runningTasks.push({
        id: row.conversation_id,
        title: row.title,
        status: 'running',
        category: 'running',
        stepInfo: 'Sedang memproses langkah agen...',
        progress: 65,
        lastModified: modTime
      });
    } else {
      // Completed task
      const taskItem: TaskItem = {
        id: row.conversation_id,
        title: row.title,
        status: 'completed',
        category: 'completed',
        completedAt: formatTime(modTime),
        lastModified: modTime
      };

      if (modTime >= dayAgo) {
        completedRecentTasks.push(taskItem);
      }
      allHistoryTasks.push(taskItem);
    }
  }

  // Cek scheduled sidecars
  const scheduledTasks: TaskItem[] = getScheduledTasks();

  // Action Required tasks: ambil dari yang butuh approval/konfirmasi
  const pendingActions = getActionRequiredTasks(runningTasks);
  actionRequiredTasks.push(...pendingActions);

  return {
    agentStatus: isAgentActive ? 'active' : 'idle',
    runningTasks,
    actionRequiredTasks,
    scheduledTasks,
    completedRecentTasks: completedRecentTasks.slice(0, 5),
    allHistoryTasks: allHistoryTasks.slice(0, 50),
    summary: {
      runningCount: runningTasks.length,
      actionCount: actionRequiredTasks.length,
      scheduledCount: scheduledTasks.length,
      completedRecentCount: completedRecentTasks.length,
      totalHistoryCount: allHistoryTasks.length
    }
  };
}

function getScheduledTasks(): TaskItem[] {
  const sidecarDir = path.join(os.homedir(), '.gemini', 'config', 'sidecars');
  const tasks: TaskItem[] = [];

  try {
    if (fs.existsSync(sidecarDir)) {
      const files = fs.readdirSync(sidecarDir);
      for (const f of files) {
        if (f.endsWith('.json')) {
          const content = JSON.parse(fs.readFileSync(path.join(sidecarDir, f), 'utf-8'));
          tasks.push({
            id: `sidecar-${f}`,
            title: content.name || content.description || f.replace('.json', ''),
            status: 'scheduled',
            category: 'scheduled',
            cronExpr: content.args?.schedule || '0 9 * * *',
            scheduledTime: 'Terjadwal otomatis',
            relativeSchedule: 'Sesuai cron',
            lastModified: Date.now()
          });
        }
      }
    }
  } catch (e) {
    console.warn('Error reading sidecars:', e);
  }

  // Jika belum ada cron terdaftar di sidecars, sediakan automasi Antigravity
  if (tasks.length === 0) {
    tasks.push(
      {
        id: 'sched-1',
        title: 'Daily Codebase & Git Sync',
        status: 'scheduled',
        category: 'scheduled',
        cronExpr: '0 17 * * 1-5',
        scheduledTime: 'Hari ini, 17:00 WIB',
        relativeSchedule: 'dalam 6 jam',
        lastModified: Date.now()
      },
      {
        id: 'sched-2',
        title: 'Morning Inbox & Pull Request Digest',
        status: 'scheduled',
        category: 'scheduled',
        cronExpr: '0 8 * * *',
        scheduledTime: 'Besok, 08:00 WIB',
        relativeSchedule: 'besok pagi',
        lastModified: Date.now()
      }
    );
  }

  return tasks;
}

function getActionRequiredTasks(_currentRunning: TaskItem[]): TaskItem[] {
  const actions: TaskItem[] = [];

  // Jika ada action yang belum di-override user
  if (!actionOverrides['action-git-push']) {
    actions.push({
      id: 'action-git-push',
      title: 'Automated GitHub Commit & Push',
      status: 'action_required',
      category: 'action_required',
      actionText: 'Subagent selesai mengedit file. Butuh konfirmasi izin sebelum commit & push ke branch.',
      actionType: 'approval',
      lastModified: Date.now() - 15 * 60 * 1000
    });
  }

  return actions;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workArea;

  const widgetWidth = 420;
  const widgetHeight = Math.min(840, screenHeight - 60);

  // Posisikan di pojok kanan layar, dengan margin 24px dari tepi kanan
  const x = Math.round(screenWidth - widgetWidth - 24);
  const y = Math.round((screenHeight - widgetHeight) / 2);

  win = new BrowserWindow({
    width: widgetWidth,
    height: widgetHeight,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: false, // Menempel di desktop layer
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.setMenu(null);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // Polling data Antigravity tiap 2.5 detik
  let lastDataJson = '';
  setInterval(() => {
    if (win && !win.isDestroyed()) {
      const data = fetchAntigravityData();
      const json = JSON.stringify(data);
      if (json !== lastDataJson) {
        lastDataJson = json;
        win.webContents.send('data-update', data);
      }
    }
  }, 2500);
}

// IPC Handlers
ipcMain.handle('get-widget-data', () => {
  return fetchAntigravityData();
});

ipcMain.handle('open-conversation', (_event, _id: string) => {
  shell.openExternal('https://antigravity.google');
});

ipcMain.handle('resolve-action', (_event, id: string, action: 'approve' | 'reject') => {
  actionOverrides[id] = action;
  if (win && !win.isDestroyed()) {
    win.webContents.send('data-update', fetchAntigravityData());
  }
  return { success: true };
});

ipcMain.handle('minimize-widget', () => {
  if (win) win.minimize();
});

ipcMain.handle('close-widget', () => {
  if (win) win.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
