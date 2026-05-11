/**
 * Imgro - Image Resizer Application
 * Renderer Process (Frontend)
 * 
 * This file handles all UI logic, including:
 * - Image loading and preview
 * - Resize operations (single and batch)
 * - User interface interactions
 * - Translation system
 * - Drag & drop functionality
 * - Keyboard shortcuts
 * - Panel accordion functionality
 */

/**
 * @file renderer.js
 * @description Imgro - Image Resizer Application
 * Renderer Process (Frontend)
 *
 * This file handles all UI logic, including:
 * - Image loading and preview
 * - Resize operations (single and batch)
 * - User interface interactions
 * - Translation system
 * - Drag & drop functionality
 * - Keyboard shortcuts
 * - Panel accordion functionality
 *
 * @module Imgro/Renderer
 * @version 1.1.0
 */

// ==================== STATE MANAGEMENT ====================

/**
 * Centralized application state
 * Replaces ~30 global variables
 * @type {Object}
 */
const appState = {
  translations: {},

  lang: 'en',

  image: {
    path: null,
    dataUrl: null,
    format: '',
    dimensions: { width: 0, height: 0 }
  },

  cachedImage: null,

  loadId: 0,

  transform: {
    rotation: 0,
    flip: 'none'
  },

  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0
  },

  output: {
    format: 'original',
    quality: 90
  },

  cachedExt: null,
  cachedMime: null,

  zoom: {
    current: 100,
    min: 25,
    max: 400,
    step: 25
  },

  MAX_CANVAS_SIZE: 65535,

  ui: {
    isLoading: false,
    statusMessage: '',
    statusType: ''
  },

  batch: {
    files: [],
    outputFolder: null
  }
};

try {
  appState.lang = localStorage.getItem('lang') || 'en';
} catch (e) {
  console.warn('localStorage not available:', e.message);
}

const previewCanvas = document.createElement('canvas');

function getState(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], appState);
}

function setState(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => {
    if (!obj[key]) obj[key] = {};
    return obj[key];
  }, appState);
  target[lastKey] = value;
}

function validateDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height)) return false;
  if (width < 1 || height < 1) return false;
  if (!isFinite(width) || !isFinite(height)) return false;
  if (width > appState.MAX_CANVAS_SIZE || height > appState.MAX_CANVAS_SIZE) return false;
  return true;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Extracts the file extension from a file path
 * @function getFileExtension
 * @param {string} filepath - The file path to extract extension from
 * @returns {string} Lowercase file extension without dot
 * @example
 * const ext = getFileExtension('/path/to/image.png'); // returns 'png'
 */
function getFileExtension(filepath) {
  return filepath.split('.').pop().toLowerCase();
}

/**
 * Checks if the given format is JPEG (case insensitive)
 * @function isJpegFormat
 * @param {string} format - The format to check
 * @returns {boolean} True if format is JPEG or JPG
 * @example
 * isJpegFormat('JPEG'); // returns true
 * isJpegFormat('jpg');  // returns true
 */
function isJpegFormat(format) {
  if (!format) return false;
  const f = String(format).toUpperCase();
  return f === 'JPEG' || f === 'JPG';
}

// ==================== DOM ELEMENTS ====================

/**
 * DOM Element References
 * Cached references to frequently used DOM elements for performance
 */

const btnSelect = document.getElementById('btn-select');
const btnResize = document.getElementById('btn-resize');
const btnClear = document.getElementById('btn-clear');
const inputWidth = document.getElementById('new-width');
const inputHeight = document.getElementById('new-height');
const originalDims = document.getElementById('original-dims');
const formatInfo = document.getElementById('format-info');
const fileInfo = document.getElementById('file-info');
const statusText = document.getElementById('status-text');
const previewImage = document.getElementById('preview-image');
const emptyState = document.getElementById('empty-state');
const langSelect = document.getElementById('lang-select');
const canvasArea = document.getElementById('canvas-area');
const workspace = document.querySelector('.workspace');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const qualityRow = document.getElementById('quality-row');
const qualityLabel = document.getElementById('quality-label');
const ratioLabel = document.getElementById('ratio-label');
const ratioButtons = document.querySelectorAll('.ratio-btn');

const btnRotateLeft = document.getElementById('btn-rotate-left');
const btnRotateRight = document.getElementById('btn-rotate-right');
const btnFlipH = document.getElementById('btn-flip-h');
const btnFlipV = document.getElementById('btn-flip-v');
const btnResetTransform = document.getElementById('btn-reset-transform');
const transformHeader = document.getElementById('transform-header');

const filterBrightnessSlider = document.getElementById('filter-brightness');
const filterContrastSlider = document.getElementById('filter-contrast');
const filterSaturationSlider = document.getElementById('filter-saturation');
const filterGrayscaleSlider = document.getElementById('filter-grayscale');
const brightnessValue = document.getElementById('brightness-value');
const contrastValue = document.getElementById('contrast-value');
const saturationValue = document.getElementById('saturation-value');
const grayscaleValue = document.getElementById('grayscale-value');
const btnResetFilters = document.getElementById('btn-reset-filters');
const filtersHeader = document.getElementById('filters-header');
const brightnessLabel = document.getElementById('brightness-label');
const contrastLabel = document.getElementById('contrast-label');
const saturationLabel = document.getElementById('saturation-label');
const grayscaleLabel = document.getElementById('grayscale-label');
const outputFormatSelect = document.getElementById('output-format');

const btnAddFiles = document.getElementById('btn-add-files');
const btnSelectFolder = document.getElementById('btn-select-folder');
const btnClearBatch = document.getElementById('btn-clear-batch');
const btnProcessBatch = document.getElementById('btn-process-batch');
const batchFilesList = document.getElementById('batch-files-list');
const batchFilesInfo = document.getElementById('batch-files-info');
const batchFolder = document.getElementById('batch-folder');
const batchWidth = document.getElementById('batch-width');
const batchHeight = document.getElementById('batch-height');
const batchQuality = document.getElementById('batch-quality');
const batchQualityValue = document.getElementById('batch-quality-value');
const batchProgress = document.getElementById('batch-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomFit = document.getElementById('btn-zoom-fit');
const zoomLevelDisplay = document.getElementById('zoom-level');
const loadingSpinner = document.getElementById('loading-spinner');

const validExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'];

/**
 * MIME type mapping for image formats
 * @type {Object.<string, string>}
 */
const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', bmp: 'image/bmp', gif: 'image/gif', webp: 'image/webp' };

/**
 * Gets the MIME type for a given file extension
 * @function getMimeType
 * @param {string} ext - File extension (e.g., 'png', 'jpg')
 * @returns {string} MIME type string
 * @example
 * const mime = getMimeType('png'); // returns 'image/png'
 */
function getMimeType(ext) {
  return mimeTypes[ext] || 'image/jpeg';
}

// ==================== TRANSFORM FUNCTIONS ====================

/**
 * Transform Functions
 * Handle image rotation and flip operations
 */

function applyTransform() {
  if (!appState.cachedImage || !appState.image.path) return;
  updatePreview();
}

/**
 * Rotates the image 90 degrees to the left
 * @function rotateLeft
 * @returns {void}
 */
function rotateLeft() {
  if (!appState.cachedImage) return;
  appState.transform.rotation = (appState.transform.rotation - 90 + 360) % 360;
  applyTransform();
}

/**
 * Rotates the image 90 degrees to the right
 * @function rotateRight
 * @returns {void}
 */
function rotateRight() {
  if (!appState.cachedImage) return;
  appState.transform.rotation = (appState.transform.rotation + 90) % 360;
  applyTransform();
}

/**
 * Toggles horizontal flip of the image
 * @function flipHorizontal
 * @returns {void}
 */
function flipHorizontal() {
  if (!appState.cachedImage) return;
  appState.transform.flip = appState.transform.flip === 'horizontal' ? 'none' : 'horizontal';
  applyTransform();
}

/**
 * Toggles vertical flip of the image
 * @function flipVertical
 * @returns {void}
 */
function flipVertical() {
  if (!appState.cachedImage) return;
  appState.transform.flip = appState.transform.flip === 'vertical' ? 'none' : 'vertical';
  applyTransform();
}

/**
 * Resets all transform settings to default
 * @function resetTransform
 * @returns {void}
 */
function resetTransform() {
  appState.transform.rotation = 0;
  appState.transform.flip = 'none';
  applyTransform();
}

function setupTransformHandlers() {
  btnRotateLeft.addEventListener('click', rotateLeft);
  btnRotateRight.addEventListener('click', rotateRight);
  btnFlipH.addEventListener('click', flipHorizontal);
  btnFlipV.addEventListener('click', flipVertical);
  btnResetTransform.addEventListener('click', resetTransform);
}

function applyFiltersToContext(ctx) {
  const filterString = `brightness(${appState.filters.brightness}%) contrast(${appState.filters.contrast}%) saturate(${appState.filters.saturation}%) grayscale(${appState.filters.grayscale}%)`;
  ctx.filter = filterString;
}

/**
 * Sets up event handlers for filter sliders
 * Includes debounced preview updates for performance
 * @function setupFilterHandlers
 * @returns {void}
 */
function setupFilterHandlers() {
  filterBrightnessSlider.addEventListener('input', () => {
    appState.filters.brightness = parseInt(filterBrightnessSlider.value);
    brightnessValue.textContent = appState.filters.brightness + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  filterContrastSlider.addEventListener('input', () => {
    appState.filters.contrast = parseInt(filterContrastSlider.value);
    contrastValue.textContent = appState.filters.contrast + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  filterSaturationSlider.addEventListener('input', () => {
    appState.filters.saturation = parseInt(filterSaturationSlider.value);
    saturationValue.textContent = appState.filters.saturation + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  filterGrayscaleSlider.addEventListener('input', () => {
    appState.filters.grayscale = parseInt(filterGrayscaleSlider.value);
    grayscaleValue.textContent = appState.filters.grayscale + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });
  
  btnResetFilters.addEventListener('click', resetFilters);
  
  outputFormatSelect.addEventListener('change', () => {
    appState.output.format = outputFormatSelect.value;
  });
}

function resetFilters() {
  appState.filters.brightness = 100;
  appState.filters.contrast = 100;
  appState.filters.saturation = 100;
  appState.filters.grayscale = 0;
  filterBrightnessSlider.value = 100;
  filterContrastSlider.value = 100;
  filterSaturationSlider.value = 100;
  filterGrayscaleSlider.value = 0;
  brightnessValue.textContent = '100%';
  contrastValue.textContent = '100%';
  saturationValue.textContent = '100%';
  grayscaleValue.textContent = '0%';
  updatePreview();
}

const ratios = {
  '16:9': 16/9,
  '4:3': 4/3,
  '1:1': 1,
  '3:2': 3/2,
  '9:16': 9/16,
  '21:9': 21/9
};

function setupRatioButtons() {
  ratioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const ratio = btn.dataset.ratio;
      const currentHeight = parseInt(inputHeight.value);
      
      ratioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (ratio === 'original') {
        if (appState.image.dataUrl) {
          const img = new Image();
          img.onload = function() {
            inputWidth.value = this.width;
            inputHeight.value = this.height;
            updatePreview();
            this.onload = null;
            this.src = '';
          };
          img.src = appState.image.dataUrl;
        }
      } else if (currentHeight && ratios[ratio]) {
        inputWidth.value = Math.round(currentHeight * ratios[ratio]);
        updatePreview();
      }
    });
  });
}

// ==================== BATCH PROCESSING ====================

/**
 * Sets up event handlers for batch processing functionality
 * Includes: add files, select folder, clear batch, process all buttons
 */
function setupBatchHandlers() {
  btnAddFiles.addEventListener('click', async () => {
    const files = await window.electronAPI.selectMultipleImages();
    if (files && files.length > 0) {
      files.forEach(filepath => {
        const ext = getFileExtension(filepath);
        if (validExtensions.includes(ext)) {
          const filename = filepath.split(/[/\\]/).pop();
          if (!appState.batch.files.find(f => f.path === filepath)) {
            appState.batch.files.push({ path: filepath, name: filename });
          }
        }
      });
      updateBatchUI();
    }
  });

  btnSelectFolder.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      appState.batch.outputFolder = folder;
      batchFolder.textContent = folder;
      updateBatchButtonState();
    }
  });

  btnClearBatch.addEventListener('click', () => {
    appState.batch.files = [];
    appState.batch.outputFolder = null;
    batchFolder.textContent = t('noFolderSelected');
    updateBatchUI();
  });

  btnProcessBatch.addEventListener('click', async () => {
    if (!appState.batch.outputFolder || appState.batch.files.length === 0) return;

    const width = parseInt(batchWidth.value) || 800;
    const height = parseInt(batchHeight.value) || 600;
    const quality = parseInt(batchQuality.value) || 90;

    btnProcessBatch.disabled = true;
    batchProgress.style.display = 'block';
    
    let successCount = 0;
    const total = appState.batch.files.length;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < total; i++) {
      const file = appState.batch.files[i];
      const progress = i + 1;
      progressText.textContent = `${progress}/${total}`;
      progressFill.style.width = `${(progress / total) * 100}%`;
      
      const info = await window.electronAPI.getImageData(file.path);
      if (!info || !info.dataUrl) continue;

      const img = new Image();
      let retries = 0;
      const maxRetries = 3;
      const timeout = 30000; // 30 seconds
      
      while (retries <= maxRetries) {
        try {
          // Load image with timeout
          const loadPromise = new Promise((resolve, reject) => {
            img.onload = () => resolve(true);
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = info.dataUrl;
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          );
          
          await Promise.race([loadPromise, timeoutPromise]);
          break; // Success, exit retry loop
          
        } catch (error) {
          retries++;
          if (retries > maxRetries) {
            console.error(`Failed to load image after ${maxRetries} attempts:`, file.path, error);
            break;
          }
          console.warn(`Retry ${retries}/${maxRetries} for image:`, file.path);
        }
      }
      
      if (retries > maxRetries) {
        showStatus(`Failed to load: ${file.name}`, 'error');
        continue;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Use outputFormatSelect instead of input extension
      const outputFormatVal = outputFormatSelect.value || 'original';
      let outputMimeType = 'image/png';
      let outputExt = '.png';

      if (outputFormatVal === 'original') {
        const ext = getFileExtension(file.path).toLowerCase();
        outputMimeType = getMimeType(ext);
        outputExt = (ext === 'png') ? '.png' : '.jpg';
      } else if (outputFormatVal === 'JPEG' || outputFormatVal === 'JPG') {
        outputMimeType = 'image/jpeg';
        outputExt = '.jpg';
      } else if (outputFormatVal === 'WEBP') {
        outputMimeType = 'image/webp';
        outputExt = '.webp';
      } else if (outputFormatVal === 'BMP') {
        outputMimeType = 'image/bmp';
        outputExt = '.bmp';
      }

      const imgQuality = (['.png'].includes(outputExt)) ? 1.0 : quality / 100;

      const base64 = canvas.toDataURL(outputMimeType, imgQuality);
      // Fix: Use performance.now() + index to prevent filename collision
      const timestamp = Math.floor(performance.now() * 1000);
      const filename = `imagem_${timestamp}_${i + 1}${outputExt}`;

      const result = await window.electronAPI.saveBatchImage({
        outputFolder: appState.batch.outputFolder,
        filename: filename,
        base64Data: base64
      });

      if (result.success) {
        successCount++;
      } else {
        showStatus(`Failed to save: ${file.name}`, 'error');
      }

      // Memory cleanup: clear image after each iteration
      img.src = '';
      img.onload = null;
      img.onerror = null;
    }

    canvas.width = 0;
    canvas.height = 0;
    
    progressText.textContent = `${t('batchComplete').replace('{0}', successCount)}`;
    btnProcessBatch.disabled = false;
    showStatus(`${t('batchComplete').replace('{0}', successCount)}`, 'success');
  });

  batchQuality.addEventListener('input', () => {
    batchQualityValue.textContent = batchQuality.value + '%';
  });
}

function updateBatchUI() {
  batchFilesInfo.textContent = t('filesCount').replace('{0}', appState.batch.files.length);

  const fragment = document.createDocumentFragment();
  appState.batch.files.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'batch-file-item';
    div.dataset.index = index;
    const span = document.createElement('span');
    span.className = 'batch-file-name';
    span.textContent = file.name;
    const btn = document.createElement('button');
    btn.className = 'batch-remove-btn';
    btn.dataset.index = index;
    btn.textContent = '×';
    div.appendChild(span);
    div.appendChild(btn);
    fragment.appendChild(div);
  });
  batchFilesList.innerHTML = '';
  batchFilesList.appendChild(fragment);

  updateBatchButtonState();
}

batchFilesList.addEventListener('click', (e) => {
  if (e.target.classList.contains('batch-remove-btn')) {
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index) && index >= 0 && index < appState.batch.files.length) {
      appState.batch.files.splice(index, 1);
      updateBatchUI();
    }
  }
});

function updateBatchButtonState() {
  btnProcessBatch.disabled = !appState.batch.outputFolder || appState.batch.files.length === 0;
}

function setupDragAndDrop() {
  workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    workspace.classList.add('drag-over');
  });

  workspace.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    workspace.classList.remove('drag-over');
  });

  workspace.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    workspace.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Security: validate file exists and has path
    const firstFile = files[0];
    if (!firstFile || !firstFile.path) {
      showStatus(t('errorLoadingImage') + ': Invalid file', 'error');
      return;
    }

    const filepath = firstFile.path;
    const ext = getFileExtension(filepath).toLowerCase();

    if (!validExtensions.includes(ext)) {
      showStatus(t('errorLoadingImage') + ': Invalid format', 'error');
      return;
    }

    await loadImage(filepath);
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      btnSelect.click();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      if (!btnResize.disabled) btnResize.click();
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      btnClear.click();
    } else if (e.key === 'Escape') {
      btnClear.click();
    }
  });
}

async function loadTranslations() {
  try {
    const response = await fetch('translations.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    appState.translations = await response.json();
    applyTranslations();
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
}

function t(key) {
  const langObj = appState.translations[appState.lang];
  if (langObj && langObj[key]) return langObj[key];
  const ptObj = appState.translations['pt-BR'];
  if (ptObj && ptObj[key]) return ptObj[key];
  const enObj = appState.translations['en'];
  if (enObj && enObj[key]) return enObj[key];
  return key;
}

const panelHeaders = document.querySelectorAll('.panel-header');
const sidebarHeader = document.querySelector('.sidebar-header h1');
const emptyStateText = document.querySelector('.empty-state p');
const dimensionLabels = document.querySelectorAll('.dimension-row label');
const batchHeader = document.getElementById('batch-header');
const batchWidthLabel = document.getElementById('batch-width-label');
const batchHeightLabel = document.getElementById('batch-height-label');
const batchQualityLabel = document.getElementById('batch-quality-label');

function applyTranslations() {
  btnSelect.innerHTML = `<span class="icon">📂</span> ${t('openImage')}<span class="shortcut">Ctrl+O</span>`;
  btnResize.innerHTML = `<span class="icon">✓</span> ${t('resize')}<span class="shortcut">Ctrl+Shift+S</span>`;
  btnClear.innerHTML = `<span class="icon">↺</span> ${t('clear')}<span class="shortcut">Ctrl+L</span>`;
  
  if (panelHeaders[0]) panelHeaders[0].textContent = t('file');
  if (panelHeaders[1]) panelHeaders[1].textContent = t('dimensions');
  if (panelHeaders[2]) panelHeaders[2].textContent = t('info');
  if (panelHeaders[3]) panelHeaders[3].textContent = t('transform');
  if (sidebarHeader) sidebarHeader.textContent = t('appTitle');
  
  if (emptyStateText) emptyStateText.textContent = t('dragOrClick');
  
  if (dimensionLabels[0]) dimensionLabels[0].textContent = t('original') + ':';
  if (dimensionLabels[1]) dimensionLabels[1].textContent = t('newWidth') + ':';
  if (dimensionLabels[2]) dimensionLabels[2].textContent = t('newHeight') + ':';
  if (dimensionLabels[3]) dimensionLabels[3].textContent = t('format') + ':';
  if (qualityLabel) qualityLabel.textContent = t('quality') + ':';
  if (ratioLabel) ratioLabel.textContent = t('ratio') + ':';
  
  if (qualitySlider) {
    qualitySlider.title = t('qualityHint');
  }
  
  const labelEl = fileInfo.querySelector('.label');
  const filenameEl = fileInfo.querySelector('.filename');
  
  if (appState.image.path) {
    const filename = appState.image.path.split(/[/\\]/).pop();
    fileInfo.innerHTML = `<span class="filename">${filename}</span>`;
  } else if (labelEl) {
    labelEl.textContent = t('noFileSelected');
  } else {
    fileInfo.innerHTML = `<span class="label">${t('noFileSelected')}</span>`;
  }

  if (batchHeader) batchHeader.textContent = t('batch');
  if (btnAddFiles) btnAddFiles.textContent = t('addFiles');
  if (btnSelectFolder) btnSelectFolder.textContent = t('selectFolder');
  if (btnClearBatch) btnClearBatch.textContent = t('clearBatch');
  if (btnProcessBatch) btnProcessBatch.innerHTML = t('processAll');
  if (batchFolder && !appState.batch.outputFolder) batchFolder.textContent = t('noFolderSelected');
  if (batchFilesInfo) batchFilesInfo.textContent = t('filesCount').replace('{0}', appState.batch.files.length);
  if (batchQuality) batchQuality.title = t('qualityHint');
  if (batchWidthLabel) batchWidthLabel.textContent = t('newWidth') + ':';
  if (batchHeightLabel) batchHeightLabel.textContent = t('newHeight') + ':';
  if (batchQualityLabel) batchQualityLabel.textContent = t('quality') + ':';
  
  if (btnRotateLeft) btnRotateLeft.title = t('rotateLeft');
  if (btnRotateRight) btnRotateRight.title = t('rotateRight');
  if (btnFlipH) btnFlipH.title = t('flipHorizontal');
  if (btnFlipV) btnFlipV.title = t('flipVertical');
  if (btnResetTransform) btnResetTransform.title = t('resetTransform');
  if (filtersHeader) filtersHeader.textContent = t('filters');
  if (brightnessLabel) brightnessLabel.textContent = t('brightness');
  if (contrastLabel) contrastLabel.textContent = t('contrast');
  if (saturationLabel) saturationLabel.textContent = t('saturation');
  if (grayscaleLabel) grayscaleLabel.textContent = t('grayscale');
  if (btnResetFilters) btnResetFilters.textContent = t('resetFilters');
}

langSelect.addEventListener('change', (e) => {
  appState.lang = e.target.value;
  try {
    localStorage.setItem('lang', appState.lang);
  } catch (err) {
    console.warn('Cannot save language preference:', err.message);
  }
  applyTranslations();
});

btnSelect.addEventListener('click', async () => {
  const filepath = await window.electronAPI.selectImage();
  if (filepath) {
    await loadImage(filepath);
  }
});

btnResize.addEventListener('click', async () => {
  if (!appState.image.path || !appState.image.dataUrl || !appState.cachedImage) return;

  let width = parseInt(inputWidth.value);
  let height = parseInt(inputHeight.value);

  if (!validateDimensions(width, height)) {
    showStatus(t('errorResize'), 'error');
    return;
  }

  const isRotated90or270 = (appState.transform.rotation === 90 || appState.transform.rotation === 270);
  let finalWidth = isRotated90or270 ? height : width;
  let finalHeight = isRotated90or270 ? width : height;

  if (!validateDimensions(finalWidth, finalHeight)) {
    showStatus(t('errorResize') + ': Dimensions too large for canvas', 'error');
    return;
  }

  btnResize.disabled = true;
  btnResize.innerHTML = `<span class="icon">⏳</span> ${t('processing')}`;

  previewCanvas.width = finalWidth;
  previewCanvas.height = finalHeight;
  const ctx = previewCanvas.getContext('2d');
  
  ctx.clearRect(0, 0, finalWidth, finalHeight);
  ctx.save();

  const centerX = finalWidth / 2;
  const centerY = finalHeight / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate((appState.transform.rotation * Math.PI) / 180);

  if (appState.transform.flip === 'horizontal') {
    ctx.scale(-1, 1);
  } else if (appState.transform.flip === 'vertical') {
    ctx.scale(1, -1);
  }

  applyFiltersToContext(ctx);
  ctx.drawImage(appState.cachedImage, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
  ctx.filter = 'none';
  ctx.restore();
  
  let outputMimeType = 'image/png';
  let outputExt = getFileExtension(appState.image.path);
  
  if (appState.output.format === 'PNG') {
    outputMimeType = 'image/png';
    outputExt = 'png';
  } else if (appState.output.format === 'JPEG') {
    outputMimeType = 'image/jpeg';
    outputExt = 'jpg';
  } else if (appState.output.format === 'WEBP') {
    outputMimeType = 'image/webp';
    outputExt = 'webp';
  } else if (appState.output.format === 'BMP') {
    outputMimeType = 'image/bmp';
    outputExt = 'bmp';
  }
  
  const quality = outputMimeType === 'image/png' ? 1.0 : (qualitySlider ? qualitySlider.value / 100 : 0.9);
  const resizedBase64 = previewCanvas.toDataURL(outputMimeType, quality);

  showLoading();
  const result = await window.electronAPI.saveImageWithDialog({
    base64Data: resizedBase64,
    width: finalWidth,
    height: finalHeight,
    format: appState.output.format
  });

  if (result.success) {
    showStatus(`${t('saved')}: ${result.filename}`, 'success');
    previewImage.src = resizedBase64;
  } else if (result.canceled) {
    showStatus(t('resize'), 'info');
  } else {
    showStatus(`${t('errorProcessingImage')}: ${result.error}`, 'error');
  }

  hideLoading();

  // Memory cleanup - release canvas after save
  previewCanvas.width = 0;
  previewCanvas.height = 0;

  btnResize.disabled = false;
  btnResize.innerHTML = `<span class="icon">✓</span> ${t('resize')}`;
});

btnClear.addEventListener('click', () => {
  appState.image.path = null;
  appState.image.dataUrl = null;
  appState.image.format = '';
  appState.cachedImage = null;
  appState.loadId++;
  resetTransform();
  resetFilters();
  appState.output.format = 'original';
  outputFormatSelect.value = 'original';

  inputWidth.value = '';
  inputHeight.value = '';
  originalDims.textContent = '-';
  formatInfo.textContent = '-';
  fileInfo.innerHTML = `<span class="label">${t('noFileSelected')}</span>`;
  previewImage.classList.add('hidden');
  previewImage.src = '';
  emptyState.style.display = 'flex';
  btnResize.disabled = true;
  qualityRow.style.display = 'none';
  ratioButtons.forEach(b => b.classList.remove('active'));
  showStatus('', '');
  
  previewCanvas.width = 0;
  previewCanvas.height = 0;
});

// ==================== IMAGE LOADING ====================

/**
 * Loads an image file and displays it in the preview area
 * Uses currentLoadId to prevent race conditions when loading multiple images quickly
 * @param {string} filepath - Path to the image file
 */
async function loadImage(filepath) {
  appState.image.path = filepath;
  const thisLoadId = ++appState.loadId;
  resetTransform();
  resetFilters();
  appState.output.format = 'original';
  outputFormatSelect.value = 'original';

  appState.cachedExt = getFileExtension(filepath);
  appState.cachedMime = getMimeType(appState.cachedExt);

  const info = await window.electronAPI.getImageInfo(filepath);
  if (!info || !info.dataUrl) {
    if (thisLoadId !== appState.loadId) return;
    showStatus(t('errorLoadingImage'), 'error');
    return;
  }

  if (thisLoadId !== appState.loadId) return;

  appState.image.dataUrl = info.dataUrl;
  appState.image.format = info.format;
  appState.cachedImage = null;

  const img = new Image();
  img.onload = function() {
    if (thisLoadId !== appState.loadId) return;
    
    appState.cachedImage = this;
    const originalWidth = this.width;
    const originalHeight = this.height;

    appState.image.dimensions.width = originalWidth;
    appState.image.dimensions.height = originalHeight;
    originalDims.textContent = `${originalWidth} x ${originalHeight} ${t('px')}`;
    formatInfo.textContent = appState.image.format;

    qualityRow.style.display = isJpegFormat(appState.image.format) ? 'flex' : 'none';

    const filename = filepath.split(/[/\\]/).pop();
    fileInfo.innerHTML = `<span class="filename">${filename}</span>`;

    inputWidth.value = originalWidth;
    inputHeight.value = originalHeight;

    previewImage.src = appState.image.dataUrl;
    previewImage.classList.remove('hidden');
    emptyState.style.display = 'none';

    btnResize.disabled = false;
    showStatus(t('imageLoaded'), 'success');
  };
  img.onerror = function() {
    if (thisLoadId !== appState.loadId) return;
    showStatus(t('errorLoadingImage'), 'error');
  };
  img.src = appState.image.dataUrl;
}

/**
 * Displays a status message in the status bar
 * @function showStatus
 * @param {string} message - The message to display
 * @param {string} [type] - Optional type for styling ('error', 'success', 'info')
 * @returns {void}
 * @example
 * showStatus('Image loaded successfully', 'success');
 * showStatus('Error processing image', 'error');
 */
function showStatus(message, type) {
  statusText.textContent = message;
  statusText.parentElement.className = 'status-bar';
  if (type) {
    statusText.parentElement.classList.add(type);
  }
}

/**
 * Debounce timer for preview updates
 * @type {number|null}
 */
let previewDebounce = null;

// ==================== LIVE PREVIEW ====================

/**
 * Updates the preview image in real-time when dimensions or quality change
 * Uses a reusable canvas for better performance
 * Includes debounce handling (called via setTimeout in event listeners)
 * @function updatePreview
 * @returns {void}
 */
function updatePreview() {
  if (!appState.image.dataUrl || !appState.image.path || !appState.cachedImage) return;

  let width = parseInt(inputWidth.value);
  let height = parseInt(inputHeight.value);
  if (!validateDimensions(width, height)) return;

  const isRotated90or270 = (appState.transform.rotation === 90 || appState.transform.rotation === 270);
  
  if (isRotated90or270) {
    const temp = width;
    width = height;
    height = temp;
  }

  previewCanvas.width = width;
  previewCanvas.height = height;
  const ctx = previewCanvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  ctx.save();

  const centerX = width / 2;
  const centerY = height / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate((appState.transform.rotation * Math.PI) / 180);

  if (appState.transform.flip === 'horizontal') {
    ctx.scale(-1, 1);
  } else if (appState.transform.flip === 'vertical') {
    ctx.scale(1, -1);
  }

  applyFiltersToContext(ctx);
  ctx.drawImage(appState.cachedImage, -width / 2, -height / 2, width, height);
  ctx.filter = 'none';

  ctx.restore();

  const ext = getFileExtension(appState.image.path);
  const mimeType = getMimeType(ext);
  const quality = ext === 'png' ? 1.0 : (qualitySlider ? qualitySlider.value / 100 : 0.9);
  previewImage.src = previewCanvas.toDataURL(mimeType, quality);
  
  showStatus(`${width}x${height}`, 'success');
}

// ==================== ACCORDION PANELS ====================

/**
 * Sets up collapsible panel functionality (accordion-style)
 * Makes panel headers clickable to expand/collapse content
 * Initially collapses panels 2, 3, 4 (Dimensions, Information, Batch)
 */
function setupCollapsiblePanels() {
  document.querySelectorAll('.panel-header').forEach((header, index) => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const panel = header.parentElement;
      panel.classList.toggle('collapsed');
    });
  });

  document.querySelectorAll('.panel')[1].classList.add('collapsed');
  document.querySelectorAll('.panel')[2].classList.add('collapsed');
  document.querySelectorAll('.panel')[3].classList.add('collapsed');
  document.querySelectorAll('.panel')[4].classList.add('collapsed');
  document.querySelectorAll('.panel')[5].classList.add('collapsed');
}

// ==================== ZOOM FUNCTIONS ====================

function updateZoom() {
  if (!previewImage || previewImage.classList.contains('hidden')) return;
  zoomLevelDisplay.textContent = appState.zoom.current + '%';
  previewImage.style.transform = `scale(${appState.zoom.current / 100})`;
  if (appState.zoom.current !== 100) {
    previewImage.classList.add('zoomed');
  } else {
    previewImage.classList.remove('zoomed');
  }
}

function zoomIn() {
  if (appState.zoom.current < appState.zoom.max) {
    appState.zoom.current = Math.min(appState.zoom.current + appState.zoom.step, appState.zoom.max);
    updateZoom();
  }
}

function zoomOut() {
  if (appState.zoom.current > appState.zoom.min) {
    appState.zoom.current = Math.max(appState.zoom.current - appState.zoom.step, appState.zoom.min);
    updateZoom();
  }
}

function zoomFit() {
  appState.zoom.current = 100;
  updateZoom();
}

// ==================== LOADING SPINNER ====================

function showLoading() {
  appState.ui.isLoading = true;
  loadingSpinner.classList.add('active');
}

function hideLoading() {
  appState.ui.isLoading = false;
  loadingSpinner.classList.remove('active');
}

// ==================== ZOOM EVENT LISTENERS ====================

btnZoomIn.addEventListener('click', zoomIn);
btnZoomOut.addEventListener('click', zoomOut);
btnZoomFit.addEventListener('click', zoomFit);

workspace.addEventListener('wheel', (e) => {
  if (!previewImage || previewImage.classList.contains('hidden')) return;
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }
}, { passive: false });

loadTranslations().then(() => {
  langSelect.value = appState.lang;
  setupDragAndDrop();
  setupKeyboardShortcuts();
  setupRatioButtons();
  setupBatchHandlers();
  setupTransformHandlers();
  setupFilterHandlers();
  setupCollapsiblePanels();
  batchFolder.textContent = t('noFolderSelected');

  // Update button text with translation (only text, not SVG which is already in HTML)
  btnSelect.querySelector('.btn-text').textContent = t('openImage');
  btnResize.querySelector('.btn-text').textContent = t('resize');
  btnClear.querySelector('.btn-text').textContent = t('clear');

  // Translate output format options
  // "Original" is standard in most languages, so use direct text
  const outputFormatSelect = document.getElementById('output-format');
  if (outputFormatSelect && outputFormatSelect.options.length > 0) {
    outputFormatSelect.options[0].textContent = 'Original';
    // PNG, JPEG, WEBP, BMP stay as-is (universal terms)
  }

  if (qualitySlider) {
    qualitySlider.addEventListener('input', () => {
      qualityValue.textContent = qualitySlider.value + '%';
      clearTimeout(previewDebounce);
      previewDebounce = setTimeout(updatePreview, 200);
    });
  }

  inputWidth.addEventListener('input', () => {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  inputHeight.addEventListener('input', () => {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });
});