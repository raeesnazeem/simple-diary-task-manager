const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (buffer, extension) => ipcRenderer.invoke('save-image', buffer, extension)
})
