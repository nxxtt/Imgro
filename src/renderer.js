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

// ==================== GLOBAL STATE ====================

/**
 * Translation system - stores all language translations
 * @type {Object.<string, Object>}
 */
let translations = {};

/**
 * Current selected language code
 * @type {string}
 */
let currentLang = 'en';
try {
  currentLang = localStorage.getItem('lang') || 'en';
} catch (e) {
  console.warn('localStorage not available:', e.message);
}

/**
 * Current loaded image file path
 * @type {string|null}
 */
let currentFilePath = null;

/**
 * Current image as base64 data URL
 * @type {string|null}
 */
let currentDataUrl = null;

/**
 * Original image format (e.g., 'PNG', 'JPEG')
 * @type {string}
 */
let originalFormat = '';

/**
 * Cached Image object for performance
 * @type {HTMLImageElement|null}
 */
let cachedImage = null;

/**
 * Load ID for race condition prevention
 * Used to discard outdated image loads
 * @type {number}
 */
let currentLoadId = 0;

/**
 * Current image rotation in degrees
 * @type {number}
 * @description 0, 90, 180, or 270
 */
let currentRotation = 0;

/**
 * Current flip state
 * @type {string}
 * @description 'none', 'horizontal', or 'vertical'
 */
let currentFlip = 'none';

/**
 * Brightness filter value (0-200)
 * @type {number}
 * @default 100
 */
let filterBrightness = 100;

/**
 * Contrast filter value (0-200)
 * @type {number}
 * @default 100
 */
let filterContrast = 100;

/**
 * Saturation filter value (0-200)
 * @type {number}
 * @default 100
 */
let filterSaturation = 100;

/**
 * Grayscale filter value (0-100)
 * @type {number}
 * @default 0
 */
let filterGrayscale = 0;

/**
 * Selected output format
 * @type {string}
 * @description 'original', 'PNG', 'JPEG', 'WEBP', 'BMP'
 */
let outputFormat = 'original';

/**
 * Cached file extension for performance
 * @type {string|null}
 */
let cachedExt = null;

/**
 * cached MIME type for performance
 * @type {string|null}
 */
let cachedMime = null;

/**
 * Current zoom level percentage
 * @type {number}
 * @default 100
 */
let currentZoom = 100;

/**
 * Minimum zoom level
 * @type {number}
 * @constant
 */
const MIN_ZOOM = 25;

/**
 * Maximum zoom level
 * @type {number}
 * @constant
 */
const MAX_ZOOM = 400;

/**
 * Zoom increment step
 * @type {number}
 * @constant
 */
const ZOOM_STEP = 25;

/**
 * Loading state indicator
 * @type {boolean}
 */
let isLoading = false;

/**
 * Reusable canvas for preview rendering
 * @type {HTMLCanvasElement}
 */
const previewCanvas = document.createElement('canvas');

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

let batchFiles = [];
let batchOutputFolder = null;

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
  if (!cachedImage || !currentFilePath) return;
  updatePreview();
}

/**
 * Rotates the image 90 degrees to the left
 * @function rotateLeft
 * @returns {void}
 */
function rotateLeft() {
  if (!cachedImage) return;
  currentRotation = (currentRotation - 90 + 360) % 360;
  applyTransform();
}

/**
 * Rotates the image 90 degrees to the right
 * @function rotateRight
 * @returns {void}
 */
function rotateRight() {
  if (!cachedImage) return;
  currentRotation = (currentRotation + 90) % 360;
  applyTransform();
}

/**
 * Toggles horizontal flip of the image
 * @function flipHorizontal
 * @returns {void}
 */
function flipHorizontal() {
  if (!cachedImage) return;
  currentFlip = currentFlip === 'horizontal' ? 'none' : 'horizontal';
  applyTransform();
}

/**
 * Toggles vertical flip of the image
 * @function flipVertical
 * @returns {void}
 */
function flipVertical() {
  if (!cachedImage) return;
  currentFlip = currentFlip === 'vertical' ? 'none' : 'vertical';
  applyTransform();
}

/**
 * Resets all transform settings to default
 * @function resetTransform
 * @returns {void}
 */
function resetTransform() {
  currentRotation = 0;
  currentFlip = 'none';
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
  const filterString = `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%) grayscale(${filterGrayscale}%)`;
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
    filterBrightness = parseInt(filterBrightnessSlider.value);
    brightnessValue.textContent = filterBrightness + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  filterContrastSlider.addEventListener('input', () => {
    filterContrast = parseInt(filterContrastSlider.value);
    contrastValue.textContent = filterContrast + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  filterSaturationSlider.addEventListener('input', () => {
    filterSaturation = parseInt(filterSaturationSlider.value);
    saturationValue.textContent = filterSaturation + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });

  filterGrayscaleSlider.addEventListener('input', () => {
    filterGrayscale = parseInt(filterGrayscaleSlider.value);
    grayscaleValue.textContent = filterGrayscale + '%';
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 200);
  });
  
  btnResetFilters.addEventListener('click', resetFilters);
  
  outputFormatSelect.addEventListener('change', () => {
    outputFormat = outputFormatSelect.value;
  });
}

function resetFilters() {
  filterBrightness = 100;
  filterContrast = 100;
  filterSaturation = 100;
  filterGrayscale = 0;
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
        if (currentDataUrl) {
          const img = new Image();
          img.onload = function() {
            inputWidth.value = this.width;
            inputHeight.value = this.height;
            updatePreview();
            // Memory cleanup
            this.onload = null;
            this.src = '';
          };
          img.src = currentDataUrl;
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
          if (!batchFiles.find(f => f.path === filepath)) {
            batchFiles.push({ path: filepath, name: filename });
          }
        }
      });
      updateBatchUI();
    }
  });

  btnSelectFolder.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      batchOutputFolder = folder;
      batchFolder.textContent = folder;
      updateBatchButtonState();
    }
  });

  btnClearBatch.addEventListener('click', () => {
    batchFiles = [];
    batchOutputFolder = null;
    batchFolder.textContent = t('noFolderSelected');
    updateBatchUI();
  });

  btnProcessBatch.addEventListener('click', async () => {
    if (!batchOutputFolder || batchFiles.length === 0) return;

    const width = parseInt(batchWidth.value) || 800;
    const height = parseInt(batchHeight.value) || 600;
    const quality = parseInt(batchQuality.value) || 90;

    btnProcessBatch.disabled = true;
    batchProgress.style.display = 'block';
    
    let successCount = 0;
    const total = batchFiles.length;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < total; i++) {
      const file = batchFiles[i];
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

      const imgQuality = (outputExt === '.png') ? 1.0 : quality / 100;

      const base64 = canvas.toDataURL(outputMimeType, imgQuality);
      // Fix: Use performance.now() + index to prevent filename collision
      const timestamp = Math.floor(performance.now() * 1000);
      const filename = `imagem_${timestamp}_${i + 1}${outputExt}`;

      const result = await window.electronAPI.saveBatchImage({
        outputFolder: batchOutputFolder,
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
  batchFilesInfo.textContent = t('filesCount').replace('{0}', batchFiles.length);

  // Use DocumentFragment for better performance (optimization)
  const fragment = document.createDocumentFragment();
  batchFiles.forEach((file, index) => {
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
    if (!isNaN(index) && index >= 0 && index < batchFiles.length) {
      batchFiles.splice(index, 1);
      updateBatchUI();
    }
  }
});

function updateBatchButtonState() {
  btnProcessBatch.disabled = !batchOutputFolder || batchFiles.length === 0;
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
    translations = await response.json();
    applyTranslations();
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
}

function t(key) {
  const langObj = translations[currentLang];
  if (langObj && langObj[key]) return langObj[key];
  const ptObj = translations['pt-BR'];
  if (ptObj && ptObj[key]) return ptObj[key];
  // Fallback to English
  const enObj = translations['en'];
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
  
  // Preserve file info when changing language (don't reset to "noFileSelected")
  const labelEl = fileInfo.querySelector('.label');
  const filenameEl = fileInfo.querySelector('.filename');
  
  if (currentFilePath) {
    const filename = currentFilePath.split(/[/\\]/).pop();
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
  if (batchFolder && !batchOutputFolder) batchFolder.textContent = t('noFolderSelected');
  if (batchFilesInfo) batchFilesInfo.textContent = t('filesCount').replace('{0}', batchFiles.length);
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
  currentLang = e.target.value;
  try {
    localStorage.setItem('lang', currentLang);
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
  if (!currentFilePath || !currentDataUrl || !cachedImage) return;

  let width = parseInt(inputWidth.value);
  let height = parseInt(inputHeight.value);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || isNaN(width) || isNaN(height) || !isFinite(width) || !isFinite(height) || width > 20000 || height > 20000) {
    showStatus(t('errorResize'), 'error');
    return;
  }

  const isRotated90or270 = (currentRotation === 90 || currentRotation === 270);
  let finalWidth = isRotated90or270 ? height : width;
  let finalHeight = isRotated90or270 ? width : height;

  // Critical fix: validate canvas dimensions (max 65535)
  if (finalWidth > 65535 || finalHeight > 65535) {
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
  ctx.rotate((currentRotation * Math.PI) / 180);

  if (currentFlip === 'horizontal') {
    ctx.scale(-1, 1);
  } else if (currentFlip === 'vertical') {
    ctx.scale(1, -1);
  }

  applyFiltersToContext(ctx);
  // Use scaled dimensions for proper centering
  ctx.drawImage(cachedImage, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);
  ctx.filter = 'none';
  ctx.restore();
  
  // Determine output format and MIME type
  let outputMimeType = 'image/png';
  let outputExt = getFileExtension(currentFilePath);
  
  if (outputFormat === 'PNG') {
    outputMimeType = 'image/png';
    outputExt = 'png';
  } else if (outputFormat === 'JPEG') {
    outputMimeType = 'image/jpeg';
    outputExt = 'jpg';
  } else if (outputFormat === 'WEBP') {
    outputMimeType = 'image/webp';
    outputExt = 'webp';
  } else if (outputFormat === 'BMP') {
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
    format: outputFormat
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
  currentFilePath = null;
  currentDataUrl = null;
  originalFormat = '';
  cachedImage = null;
  currentLoadId++;
  resetTransform();
  resetFilters();
  outputFormat = 'original';
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
  currentFilePath = filepath;
  const thisLoadId = ++currentLoadId;
  resetTransform();
  resetFilters();
  outputFormat = 'original';
  outputFormatSelect.value = 'original';

  // Cache extension and MIME for performance
  cachedExt = getFileExtension(filepath);
  cachedMime = getMimeType(cachedExt);

  const info = await window.electronAPI.getImageInfo(filepath);
  if (!info || !info.dataUrl) {
    if (thisLoadId !== currentLoadId) return;
    showStatus(t('errorLoadingImage'), 'error');
    return;
  }

  if (thisLoadId !== currentLoadId) return;

  currentDataUrl = info.dataUrl;
  originalFormat = info.format;
  cachedImage = null;

  const img = new Image();
  img.onload = function() {
    if (thisLoadId !== currentLoadId) return;
    
    cachedImage = this;
    const originalWidth = this.width;
    const originalHeight = this.height;

    originalDims.textContent = `${originalWidth} x ${originalHeight} ${t('px')}`;
    formatInfo.textContent = originalFormat;

    qualityRow.style.display = isJpegFormat(originalFormat) ? 'flex' : 'none';

    const filename = filepath.split(/[/\\]/).pop();
    fileInfo.innerHTML = `<span class="filename">${filename}</span>`;

    inputWidth.value = originalWidth;
    inputHeight.value = originalHeight;

    previewImage.src = currentDataUrl;
    previewImage.classList.remove('hidden');
    emptyState.style.display = 'none';

    btnResize.disabled = false;
    showStatus(t('imageLoaded'), 'success');
  };
  img.onerror = function() {
    if (thisLoadId !== currentLoadId) return;
    showStatus(t('errorLoadingImage'), 'error');
  };
  img.src = currentDataUrl;
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
  if (!currentDataUrl || !currentFilePath || !cachedImage) return;

  let width = parseInt(inputWidth.value);
  let height = parseInt(inputHeight.value);
  if (!width || !height || width < 1 || height < 1) return;

  const isRotated90or270 = (currentRotation === 90 || currentRotation === 270);
  
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
  ctx.rotate((currentRotation * Math.PI) / 180);

  if (currentFlip === 'horizontal') {
    ctx.scale(-1, 1);
  } else if (currentFlip === 'vertical') {
    ctx.scale(1, -1);
  }

  applyFiltersToContext(ctx);
  // Fix: Use user-specified dimensions instead of original image dimensions
  ctx.drawImage(cachedImage, -width / 2, -height / 2, width, height);
  ctx.filter = 'none';

  ctx.restore();

  const ext = getFileExtension(currentFilePath);
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
  zoomLevelDisplay.textContent = currentZoom + '%';
  previewImage.style.transform = `scale(${currentZoom / 100})`;
  if (currentZoom !== 100) {
    previewImage.classList.add('zoomed');
  } else {
    previewImage.classList.remove('zoomed');
  }
}

function zoomIn() {
  if (currentZoom < MAX_ZOOM) {
    currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    updateZoom();
  }
}

function zoomOut() {
  if (currentZoom > MIN_ZOOM) {
    currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    updateZoom();
  }
}

function zoomFit() {
  currentZoom = 100;
  updateZoom();
}

// ==================== LOADING SPINNER ====================

function showLoading() {
  isLoading = true;
  loadingSpinner.classList.add('active');
}

function hideLoading() {
  isLoading = false;
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
  langSelect.value = currentLang;
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