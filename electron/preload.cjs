'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const on = (channel, cb) => {
  const handler = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('electronAPI', {
  getState: () => ipcRenderer.invoke('widget:get-state'),
  onData: (cb) => on('data', cb),
  onBackdrop: (cb) => on('backdrop', cb),
  onGeom: (cb) => on('geom', cb),
  onPinned: (cb) => on('pinned', cb),
  openSession: (id, title) => ipcRenderer.invoke('widget:open-session', id, title),
  hide: () => ipcRenderer.invoke('widget:hide'),
  togglePin: () => ipcRenderer.invoke('widget:toggle-pin'),
});
