const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aliasist', {
  getDlDir:      ()          => ipcRenderer.invoke('get-dl-dir'),
  browseSave:    (name)      => ipcRenderer.invoke('browse-save', name),
  downloadFile:  (url, save) => ipcRenderer.invoke('download-file', url, save),
  abortDownload: ()          => ipcRenderer.send('abort-download'),
  winMinimize:   ()          => ipcRenderer.send('win-minimize'),
  winMaximize:   ()          => ipcRenderer.send('win-maximize'),
  winClose:      ()          => ipcRenderer.send('win-close'),
  onProgress:   (cb)         => ipcRenderer.on('dl-progress', (_, d) => cb(d)),
  onStatus:     (cb)         => ipcRenderer.on('dl-status', (_, d) => cb(d)),
  onMeta:       (cb)         => ipcRenderer.on('dl-meta', (_, d) => cb(d)),
});