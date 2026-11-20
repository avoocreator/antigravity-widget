import { contextBridge, ipcRenderer } from 'electron';
import type { WidgetData } from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getWidgetData: (): Promise<WidgetData> => ipcRenderer.invoke('get-widget-data'),
  onDataUpdate: (callback: (data: WidgetData) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: WidgetData) => callback(data);
    ipcRenderer.on('data-update', handler);
    return () => {
      ipcRenderer.removeListener('data-update', handler);
    };
  },
  openConversation: (id: string) => ipcRenderer.invoke('open-conversation', id),
  resolveAction: (id: string, action: 'approve' | 'reject') => ipcRenderer.invoke('resolve-action', id, action),
  minimizeWidget: () => ipcRenderer.invoke('minimize-widget'),
  closeWidget: () => ipcRenderer.invoke('close-widget')
});
