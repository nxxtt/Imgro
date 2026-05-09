/**
 * @file preload.js
 * @description Imgro - Image Resizer Application
 * Preload Script (Bridge between main and renderer)
 *
 * This file provides a secure bridge between the renderer process
 * and the main process using Electron's contextBridge API.
 * Exposes IPC handlers as a simple API for the renderer.
 *
 * @module Imgro/Preload
 * @version 1.1.0
 *
 * @requires electron
 */

/**
 * Electron IPC modules
 * @type {Object}
 */
const { contextBridge, ipcRenderer } = require('electron');

/**
 * API exposed to the renderer process
 * Provides secure access to main process functionality
 * @namespace electronAPI
 * @global
 *
 * @example
 * // Usage in renderer.js
 * const filepath = await window.electronAPI.selectImage();
 * const info = await window.electronAPI.getImageInfo(filepath);
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Opens a dialog to select a single image file
   * @function selectImage
   * @memberof electronAPI
   * @returns {Promise<string|null>} File path or null if canceled
   */
  selectImage: () => ipcRenderer.invoke('select-image'),

  /**
   * Gets image information including format and base64 data
   * @function getImageInfo
   * @memberof electronAPI
   * @param {string} filepath - Path to the image file
   * @returns {Promise<{format: string, dataUrl: string}|null>}
   */
  getImageInfo: (filepath) => ipcRenderer.invoke('get-image-info', filepath),

  /**
   * Resizes an image and saves it to disk
   * @function resizeImage
   * @memberof electronAPI
   * @param {Object} data - Resize parameters
   * @param {string} data.filepath - Original file path
   * @param {string} data.base64Data - Base64 encoded image
   * @param {number} [data.width] - Target width
   * @param {number} [data.height] - Target height
   * @param {string} [data.format] - Output format
   * @returns {Promise<{success: boolean, filepath?: string, filename?: string, error?: string}>}
   */
  resizeImage: (data) => ipcRenderer.invoke('resize-image', data),

  /**
   * Opens a dialog to select a folder
   * @function selectFolder
   * @memberof electronAPI
   * @returns {Promise<string|null>} Folder path or null if canceled
   */
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  /**
   * Opens a dialog to select multiple image files
   * @function selectMultipleImages
   * @memberof electronAPI
   * @returns {Promise<string[]>} Array of file paths
   */
  selectMultipleImages: () => ipcRenderer.invoke('select-multiple-images'),

  /**
   * Gets raw image data for batch processing
   * @function getImageData
   * @memberof electronAPI
   * @param {string} filepath - Path to the image file
   * @returns {Promise<{dataUrl: string, format: string, filename: string}|null>}
   */
  getImageData: (filepath) => ipcRenderer.invoke('get-image-data', filepath),

  /**
   * Saves a batch processed image to a folder
   * @function saveBatchImage
   * @memberof electronAPI
   * @param {Object} data - Save parameters
   * @param {string} data.outputFolder - Target folder path
   * @param {string} data.filename - Output filename
   * @param {string} data.base64Data - Base64 encoded image
   * @returns {Promise<{success: boolean, filepath?: string, filename?: string, error?: string}>}
   */
  saveBatchImage: (data) => ipcRenderer.invoke('save-batch-image', data),

  /**
   * Saves an image using a native save dialog
   * @function saveImageWithDialog
   * @memberof electronAPI
   * @param {Object} data - Save parameters
   * @param {string} data.base64Data - Base64 encoded image
   * @param {number} [data.width] - Image width
   * @param {number} [data.height] - Image height
   * @param {string} [data.format] - Output format
   * @returns {Promise<{success: boolean, filepath?: string, filename?: string, canceled?: boolean, error?: string}>}
   */
  saveImageWithDialog: (data) => ipcRenderer.invoke('save-image-with-dialog', data)
});