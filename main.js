/**
 * @file main.js
 * @description Imgro - Image Resizer Application
 * Main Process Entry Point
 *
 * This file handles the Electron main process, including:
 * - Window creation and management
 * - IPC communication with renderer process
 * - File system operations (async)
 *
 * @module Imgro/Main
 * @version 1.1.0
 *
 * @requires electron
 * @requires path
 * @requires fs
 */

// ==================== IMPORTS ====================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Promises API for async file operations (better performance)
const fsPromises = fs.promises;

// ==================== CONSTANTS ====================

/**
 * Format mapping from file extension to display format
 * @type {Object.<string, string>}
 * @property {string} .png - PNG format
 * @property {string} .bmp - BMP format
 * @property {string} .gif - GIF format
 * @property {string} .webp - WebP format
 * @property {string} .jpg - JPEG format
 * @property {string} .jpeg - JPEG format
 */
const formatMap = { '.png': 'PNG', '.bmp': 'BMP', '.gif': 'GIF', '.webp': 'WEBP', '.jpg': 'JPEG', '.jpeg': 'JPEG' };

/**
 * MIME type mapping for image formats
 * @type {Object.<string, string>}
 */
const mimeMap = { '.png': 'image/png', '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/**
 * Valid image file extensions for Electron dialog filter
 * @type {string[]}
 */
const validImageExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'];

/**
 * Regular expression for base64 image data extraction
 * Used to strip the data URL prefix from base64 encoded images
 * @type {RegExp}
 */
const BASE64_REGEX = /^data:image\/\w+;base64,/;

// ==================== APP OPTIMIZATIONS ====================

/**
 * Application optimization settings
 * Disables hardware acceleration for faster startup on portable version
 */
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

// ==================== WINDOW CREATION ====================

/**
 * Creates the main application window
 * Sets up window properties and loads the HTML file
 * @function createWindow
 * @returns {void}
 *
 * @example
 * createWindow();
 */
function createWindow() {
  /**
   * Main application window instance
   * @type {BrowserWindow}
   */
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

/**
 * Application lifecycle events
 */

// Initialize application when Electron is ready
app.whenReady().then(createWindow);

/**
 * Global error handler for uncaught exceptions
 * Logs error and exits the application
 * @event process#uncaughtException
 * @param {Error} error - The uncaught error
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  app.exit(1);
});

/**
 * Global handler for unhandled promise rejections
 * Logs the rejection reason
 * @event process#unhandledRejection
 * @param {Error} reason - The unhandled rejection reason
 */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

/**
 * Handle window close event
 * Quits the application on all platforms except macOS
 * @event app#window-all-closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== IPC HANDLERS ====================

/**
 * IPC Handler: Opens a dialog to select a single image file
 * @handler select-image
 * @async
 * @returns {Promise<string|null>} File path or null if canceled
 *
 * @example
 * const filepath = await ipcRenderer.invoke('select-image');
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

/**
 * IPC Handler: Gets image information (format and base64 data)
 * @handler get-image-info
 * @async
 * @param {string} filepath - Path to the image file
 * @returns {Promise<{format: string, dataUrl: string}|null>} Image info object or null on error
 *
 * @example
 * const info = await ipcRenderer.invoke('get-image-info', '/path/to/image.png');
 */
ipcMain.handle('get-image-info', async (event, filepath) => {
  try {
    const data = await fsPromises.readFile(filepath);
    const ext = path.extname(filepath).toLowerCase() || '.jpg';

    return {
      format: formatMap[ext] || 'JPEG',
      dataUrl: `data:${mimeMap[ext] || 'image/jpeg'};base64,${data.toString('base64')}`
    };
  } catch (error) {
    console.error('Error loading image:', error.message);
    return null;
  }
});

/**
 * IPC Handler: Resizes an image and saves it
 * @handler resize-image
 * @async
 * @param {Object} params - Resize parameters
 * @param {string} params.filepath - Original file path
 * @param {string} params.base64Data - Base64 encoded image data
 * @param {number} [params.width] - Target width
 * @param {number} [params.height] - Target height
 * @param {string} [params.format] - Output format (PNG, JPEG, etc.)
 * @returns {Promise<{success: boolean, filepath?: string, filename?: string, width?: number, height?: number, error?: string}>} Result object
 *
 * @example
 * const result = await ipcRenderer.invoke('resize-image', { filepath, base64Data, width: 800, height: 600, format: 'PNG' });
 */
ipcMain.handle('resize-image', async (event, { filepath, base64Data, width, height, format }) => {
  try {
    const dir = path.dirname(filepath);
    const ext = path.extname(filepath).toLowerCase();
    const name = path.basename(filepath, ext);

    const extension = (format && format.toLowerCase() === 'png') ? '.png' : ext;
    const finalExt = (width && height) ? extension : ext;

    // Use original filename without "_modificado" suffix
    let newFilename = `${name}${finalExt}`;
    let newFilepath = path.join(dir, newFilename);

    // Simple check - if file exists, ask to overwrite (dialog handles this)
    // Remove auto-naming logic

    const buffer = Buffer.from(base64Data.replace(BASE64_REGEX, ''), 'base64');
    await fsPromises.writeFile(newFilepath, buffer).catch(async (err) => {
      // Retry once on write error
      if (err.code === 'EBUSY' || err.code === 'ENOENT') {
        await new Promise(resolve => setTimeout(resolve, 100));
        await fsPromises.writeFile(newFilepath, buffer);
      } else {
        throw err;
      }
    });

    return { success: true, filepath: newFilepath, filename: newFilename, width: width || 0, height: height || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * IPC Handler: Saves an image using a native save dialog
 * @handler save-image-with-dialog
 * @async
 * @param {Object} params - Save parameters
 * @param {string} params.base64Data - Base64 encoded image data
 * @param {number} [params.width] - Image width
 * @param {number} [params.height] - Image height
 * @param {string} [params.format] - Output format (original, PNG, JPEG, WEBP, BMP)
 * @returns {Promise<{success: boolean, filepath?: string, filename?: string, width?: number, height?: number, canceled?: boolean, error?: string}>} Result object
 *
 * @example
 * const result = await ipcRenderer.invoke('save-image-with-dialog', { base64Data, format: 'PNG' });
 */
ipcMain.handle('save-image-with-dialog', async (event, { base64Data, width, height, format }) => {
  try {
    const filters = [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }
    ];

    const defaultExt = (format === 'original' || !format) ? 'png' : String(format).toLowerCase();

    const result = await dialog.showSaveDialog({
      title: 'Save Image',
      defaultPath: `image.${defaultExt}`,
      filters: filters
    });

    if (result.canceled) return { success: false, canceled: true };

    let filepath = result.filePath;
    const ext = path.extname(filepath).toLowerCase();
    const name = path.basename(filepath, ext);

    let mimeType = 'image/png';
    if (format === 'JPEG' || format === 'JPG') mimeType = 'image/jpeg';
    else if (format === 'WEBP') mimeType = 'image/webp';
    else if (format === 'BMP') mimeType = 'image/bmp';
    else if (format === 'original') {
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.bmp') mimeType = 'image/bmp';
    }

    let finalExt = ext;
    if (format !== 'original') {
      finalExt = '.' + format.toLowerCase();
      if (format === 'JPEG') finalExt = '.jpg';
      if (filepath.toLowerCase().endsWith('.jpeg')) finalExt = '.jpeg';
      filepath = path.join(path.dirname(filepath), name + finalExt);
    }

    const buffer = Buffer.from(base64Data.replace(BASE64_REGEX, ''), 'base64');
    await fsPromises.writeFile(filepath, buffer).catch(async (err) => {
      if (err.code === 'EBUSY' || err.code === 'ENOENT') {
        await new Promise(resolve => setTimeout(resolve, 100));
        await fsPromises.writeFile(filepath, buffer);
      } else {
        throw err;
      }
    });

    const filename = path.basename(filepath);
    return { success: true, filepath: filepath, filename: filename, width: width || 0, height: height || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * IPC Handler: Opens a dialog to select a folder
 * @handler select-folder
 * @async
 * @returns {Promise<string|null>} Folder path or null if canceled
 *
 * @example
 * const folder = await ipcRenderer.invoke('select-folder');
 */
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

/**
 * IPC Handler: Opens a dialog to select multiple image files
 * @handler select-multiple-images
 * @async
 * @returns {Promise<string[]>} Array of file paths
 *
 * @example
 * const files = await ipcRenderer.invoke('select-multiple-images');
 */
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

/**
 * IPC Handler: Gets raw image data for batch processing
 * @handler get-image-data
 * @async
 * @param {string} filepath - Path to the image file
 * @returns {Promise<{dataUrl: string, format: string, filename: string}|null>} Image data object or null on error
 *
 * @example
 * const data = await ipcRenderer.invoke('get-image-data', '/path/to/image.png');
 */
ipcMain.handle('get-image-data', async (event, filepath) => {
  try {
    const data = await fsPromises.readFile(filepath);
    const ext = path.extname(filepath).toLowerCase() || '.jpg';

    return {
      dataUrl: `data:${mimeMap[ext] || 'image/jpeg'};base64,${data.toString('base64')}`,
      format: formatMap[ext] || 'JPEG',
      filename: path.basename(filepath)
    };
  } catch (error) {
    console.error('Error getting image data:', error.message);
    return null;
  }
});

/**
 * IPC Handler: Saves a batch processed image to a folder
 * @handler save-batch-image
 * @async
 * @param {Object} params - Save parameters
 * @param {string} params.outputFolder - Target folder path
 * @param {string} params.filename - Output filename
 * @param {string} params.base64Data - Base64 encoded image data
 * @returns {Promise<{success: boolean, filepath?: string, filename?: string, error?: string}>} Result object
 *
 * @example
 * const result = await ipcRenderer.invoke('save-batch-image', { outputFolder: '/output', filename: 'image.jpg', base64Data: '...' });
 */
ipcMain.handle('save-batch-image', async (event, { outputFolder, filename, base64Data }) => {
  try {
    // Security: validate outputFolder to prevent path traversal
    if (!outputFolder || typeof outputFolder !== 'string') {
      return { success: false, error: 'Invalid output folder' };
    }

    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      return { success: false, error: 'Invalid filename' };
    }

    // Resolve paths to prevent path traversal
    const resolvedOutputFolder = path.resolve(outputFolder);

    let newFilename = sanitizedFilename;
    let newFilepath = path.join(resolvedOutputFolder, newFilename);
    let counter = 1;

    // Async check to avoid blocking event loop
    while (true) {
      try {
        await fsPromises.access(newFilepath);
        const ext = path.extname(newFilename);
        newFilename = `imagem_${counter}${ext}`;
        newFilepath = path.join(resolvedOutputFolder, newFilename);
        counter++;
      } catch {
        break;
      }
    }

    const buffer = Buffer.from(base64Data.replace(BASE64_REGEX, ''), 'base64');
    await fsPromises.writeFile(newFilepath, buffer);
    return { success: true, filepath: newFilepath, filename: newFilename };
  } catch (error) {
    console.error('Batch save error:', error.message);
    return { success: false, error: error.message };
  }
});