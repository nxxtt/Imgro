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
    const fs = require('fs');
    const data = fs.readFileSync(filepath);
    const ext = path.extname(filepath).toLowerCase();
    let format = 'JPEG';
    if (ext === '.png') format = 'PNG';
    else if (ext === '.bmp') format = 'BMP';
    else if (ext === '.gif') format = 'GIF';
    else if (ext === '.webp') format = 'WEBP';
    
    const base64 = data.toString('base64');
    const mime = ext === '.png' ? 'image/png' : 
                 ext === '.gif' ? 'image/gif' : 
                 ext === '.bmp' ? 'image/bmp' : 'image/jpeg';
    
    return {
      width: 0,
      height: 0,
      format: format,
      dataUrl: `data:${mime};base64,${base64}`
    };
  } catch (error) {
    return null;
  }
});

ipcMain.handle('resize-image', async (event, { filepath, width, height, base64Data, format }) => {
  try {
    const dir = path.dirname(filepath);
    const basename = path.basename(filepath);
    const ext = path.extname(basename).toLowerCase();
    const name = path.basename(basename, ext);

    const baseFilename = `${name}_modificado`;
    let newFilename = `${baseFilename}${ext}`;
    let newFilepath = path.join(dir, newFilename);

    let counter = 2;
    while (fs.existsSync(newFilepath)) {
      newFilename = `${baseFilename}${counter}${ext}`;
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

ipcMain.handle('get-preview-base64', async (event, filepath) => {
  try {
    const data = fs.readFileSync(filepath);
    const ext = path.extname(filepath).toLowerCase().slice(1);
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch (error) {
    return null;
  }
});