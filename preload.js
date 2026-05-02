const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectImage: () => ipcRenderer.invoke('select-image'),
  getImageInfo: (filepath) => ipcRenderer.invoke('get-image-info', filepath),
  resizeImage: (data) => ipcRenderer.invoke('resize-image', data),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectMultipleImages: () => ipcRenderer.invoke('select-multiple-images'),
  getImageData: (filepath) => ipcRenderer.invoke('get-image-data', filepath),
  saveBatchImage: (data) => ipcRenderer.invoke('save-batch-image', data)
});