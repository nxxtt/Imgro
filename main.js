/**
 * Imgro - Image Resizer Application
 * Main Process Entry Point
 * 
 * This file handles the Electron main process, including:
 * - Window creation and management
 * - IPC communication with renderer process
 * - File system operations (async)
 */

// ==================== IMPORTS ====================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Promises API for async file operations (better performance)
const fsPromises = fs.promises;

// ==================== CONSTANTS ====================

// MIME type mapping for image formats
const formatMap = { '.png': 'PNG', '.bmp': 'BMP', '.gif': 'GIF', '.webp': 'WEBP' };
const mimeMap = { '.png': 'image/png', '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

// Valid image file extensions
const validImageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'];

// ==================== APP OPTIMIZATIONS ====================

// Disable hardware acceleration for faster startup on portable version
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

// ==================== WINDOW CREATION ====================

/**
 * Creates the main application window
 * Sets up window properties and loads the HTML file
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
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

  // Remove default menu for cleaner UI
  mainWindow.setMenu(null);
}

// ==================== APP LIFECYCLE ====================

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== IPC HANDLERS ====================

/**
 * Opens a dialog to select a single image file
 * @returns {string|null} File path or null if canceled
 */
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Imagens', extensions: validImageExtensions }
    ]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-image-info', async (event, filepath) => {
  try {
    const data = await fsPromises.readFile(filepath);
    const ext = path.extname(filepath).toLowerCase();
    
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
    await fsPromises.writeFile(newFilepath, buffer);

    return { success: true, filepath: newFilepath, filename: newFilename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('select-multiple-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Imagens', extensions: validImageExtensions }
    ]
  });

  if (result.canceled) return [];
  return result.filePaths;
});

ipcMain.handle('get-image-data', async (event, filepath) => {
  try {
    const data = await fsPromises.readFile(filepath);
    const ext = path.extname(filepath).toLowerCase();
    
    return {
      dataUrl: `data:${mimeMap[ext] || 'image/jpeg'};base64,${data.toString('base64')}`,
      format: formatMap[ext] || 'JPEG',
      filename: path.basename(filepath)
    };
  } catch {
    return null;
  }
});

ipcMain.handle('save-batch-image', async (event, { outputFolder, filename, base64Data }) => {
  try {
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      return { success: false, error: 'Invalid filename' };
    }
    
    let newFilename = sanitizedFilename;
    let newFilepath = path.join(outputFolder, newFilename);
    let counter = 1;
    
    while (fs.existsSync(newFilepath)) {
      const ext = path.extname(newFilename);
      const base = path.basename(newFilename, ext);
      newFilename = `imagem_${counter}${ext}`;
      newFilepath = path.join(outputFolder, newFilename);
      counter++;
    }
    
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    await fsPromises.writeFile(newFilepath, buffer);
    return { success: true, filepath: newFilepath, filename: newFilename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});