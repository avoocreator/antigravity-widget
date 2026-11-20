export type SessionState = 'running' | 'needs_action' | 'idle';

export interface Session {
  id: string;
  title: string;
  state: SessionState;
  statusRaw: string;
  source?: string;
  updatedAt: number;
  progress?: { done: number; total: number; current?: string };
}

export interface Automation {
  id: string;
  name: string;
  cron: string;
  nextRun: number;
  repeat: string;
}

export type Payload =
  | { type: 'data'; dbFound: boolean; sessions: Session[]; automations: Automation[]; generatedAt: number }
  | { type: 'error'; code: 'NO_SQLITE' | 'NO_NODE' | 'SPAWN' | 'READ_FAILED'; message: string; generatedAt: number };

export interface Geom {
  dw: number;
  dh: number;
  ox: number;
  oy: number;
}

export interface WidgetState {
  payload: Payload | null;
  backdrop: string | null;
  geom: Geom | null;
  pinned: boolean;
}

export interface ElectronAPI {
  getState: () => Promise<WidgetState>;
  onData: (cb: (p: Payload) => void) => () => void;
  onBackdrop: (cb: (url: string | null) => void) => () => void;
  onGeom: (cb: (g: Geom) => void) => () => void;
  onPinned: (cb: (on: boolean) => void) => () => void;
  openSession: (id: string, title: string) => Promise<{ ok: boolean; copied?: boolean }>;
  hide: () => Promise<void>;
  togglePin: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
