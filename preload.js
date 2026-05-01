const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectImage: () => ipcRenderer.invoke('select-image'),
  getImageInfo: (filepath) => ipcRenderer.invoke('get-image-info', filepath),
  resizeImage: (data) => ipcRenderer.invoke('resize-image', data),
  getPreviewBase64: (filepath) => ipcRenderer.invoke('get-preview-base64', filepath)
});