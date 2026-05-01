const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'] }
    ]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-image-info', async (event, filepath) => {
  try {
    const data = fs.readFileSync(filepath);
    const ext = path.extname(filepath).toLowerCase();
    const formatMap = { '.png': 'PNG', '.bmp': 'BMP', '.gif': 'GIF', '.webp': 'WEBP' };
    const mimeMap = { '.png': 'image/png', '.gif': 'image/gif', '.bmp': 'image/bmp' };
    
    return {
      format: formatMap[ext] || 'JPEG',
      dataUrl: `data:${mimeMap[ext] || 'image/jpeg'};base64,${data.toString('base64')}`
    };
  } catch {
    return null;
  }
});

ipcMain.handle('resize-image', async (event, { filepath, base64Data }) => {
  try {
    const dir = path.dirname(filepath);
    const ext = path.extname(filepath).toLowerCase();
    const name = path.basename(filepath, ext);

    let newFilename = `${name}_modificado${ext}`;
    let newFilepath = path.join(dir, newFilename);
    let counter = 2;

    while (fs.existsSync(newFilepath)) {
      newFilename = `${name}_modificado${counter}${ext}`;
      newFilepath = path.join(dir, newFilename);
      counter++;
    }

    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    fs.writeFileSync(newFilepath, buffer);

    return { success: true, filepath: newFilepath, filename: newFilename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});