const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (buffer, extension) => ipcRenderer.invoke('save-image', buffer, extension),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadDataSync: () => ipcRenderer.sendSync('load-data-sync'),
  syncToDrive: () => ipcRenderer.invoke('sync-to-drive'),
  onExternalDataChanged: (callback) => ipcRenderer.on('external-data-changed', (_event, ...args) => callback(...args))
})
