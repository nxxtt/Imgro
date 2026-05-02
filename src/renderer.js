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

// ==================== GLOBAL STATE ====================

// Translation system
let translations = {};
let currentLang = localStorage.getItem('lang') || 'en';

// Current image state
let currentFilePath = null;
let currentDataUrl = null;
let originalFormat = '';
let cachedImage = null;

// Race condition prevention
let currentLoadId = 0;

// Reusable canvas for preview (performance optimization)
const previewCanvas = document.createElement('canvas');

// ==================== HELPER FUNCTIONS ====================

// Get file extension from path
function getFileExtension(filepath) {
  return filepath.split('.').pop().toLowerCase();
}

// Check if format is JPEG
function isJpegFormat(format) {
  return format === 'JPEG' || format === 'JPG';
}

// Get MIME type from extension
function getMimeType(ext) {
  const mimeTypes = { 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 'bmp': 'image/bmp', 'webp': 'image/webp' };
  return mimeTypes[ext] || 'image/jpeg';
}

// ==================== DOM ELEMENTS ====================

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

const validExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'];

const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', bmp: 'image/bmp', gif: 'image/gif', webp: 'image/webp' };

function getMimeType(ext) {
  return mimeTypes[ext] || 'image/jpeg';
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
    const img = new Image();

    for (let i = 0; i < total; i++) {
      const file = batchFiles[i];
      const progress = i + 1;
      progressText.textContent = `${progress}/${total}`;
      progressFill.style.width = `${(progress / total) * 100}%`;
      
      const info = await window.electronAPI.getImageData(file.path);
      if (!info || !info.dataUrl) continue;

      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = info.dataUrl;
        });
      } catch (error) {
        console.error('Failed to load image:', file.path, error);
        continue;
      }
      
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      const ext = getFileExtension(file.path);
      const mimeType = getMimeType(ext);
      const imgQuality = ext === 'png' ? 1.0 : quality / 100;
      
      const base64 = canvas.toDataURL(mimeType, imgQuality);
      const outputExt = ext === 'png' ? '.png' : '.jpg';
      const filename = `imagem_${Date.now()}_${i + 1}${outputExt}`;
      
      const result = await window.electronAPI.saveBatchImage({
        outputFolder: batchOutputFolder,
        filename: filename,
        base64Data: base64
      });
      
      if (result.success) successCount++;
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
  batchFilesList.innerHTML = '';
  
  batchFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'batch-file-item';
    div.dataset.index = index;
    div.innerHTML = `
      <span class="batch-file-name">${file.name}</span>
      <button class="batch-remove-btn" data-index="${index}">×</button>
    `;
    batchFilesList.appendChild(div);
  });

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

    const filepath = files[0].path;
    const ext = getFileExtension(filepath);

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
  if (labelEl) {
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
}

langSelect.addEventListener('change', (e) => {
  currentLang = e.target.value;
  localStorage.setItem('lang', currentLang);
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

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);

  if (!width || !height || width < 1 || height < 1) {
    showStatus(t('errorResize'), 'error');
    return;
  }

  btnResize.disabled = true;
  btnResize.innerHTML = `<span class="icon">⏳</span> ${t('processing')}`;

  previewCanvas.width = width;
  previewCanvas.height = height;
  const ctx = previewCanvas.getContext('2d');
  
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(cachedImage, 0, 0, width, height);
  
  const ext = getFileExtension(currentFilePath);
  const mimeType = getMimeType(ext);
  const quality = ext === 'png' ? 1.0 : (qualitySlider ? qualitySlider.value / 100 : 0.9);
  const resizedBase64 = previewCanvas.toDataURL(mimeType, quality);

  const result = await window.electronAPI.resizeImage({
    filepath: currentFilePath,
    width: width,
    height: height,
    base64Data: resizedBase64,
    format: originalFormat
  });

  if (result.success) {
    showStatus(`${t('saved')}: ${result.filename}`, 'success');
    previewImage.src = resizedBase64;
  } else {
    showStatus(`${t('errorProcessingImage')}: ${result.error}`, 'error');
  }

  btnResize.disabled = false;
  btnResize.innerHTML = `<span class="icon">✓</span> ${t('resize')}`;
});

btnClear.addEventListener('click', () => {
  currentFilePath = null;
  currentDataUrl = null;
  originalFormat = '';
  cachedImage = null;
  currentLoadId++;

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
  const thisLoadId = ++currentLoadId;
  currentFilePath = filepath;

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

function showStatus(message, type) {
  statusText.textContent = message;
  statusText.parentElement.className = 'status-bar';
  if (type) {
    statusText.parentElement.classList.add(type);
  }
}

let previewDebounce = null;

// ==================== LIVE PREVIEW ====================

/**
 * Updates the preview image in real-time when dimensions or quality change
 * Uses a reusable canvas for better performance
 * Includes debounce handling (called via setTimeout in event listeners)
 */
function updatePreview() {
  if (!currentDataUrl || !currentFilePath || !cachedImage) return;

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);
  if (!width || !height || width < 1 || height < 1) return;

  previewCanvas.width = width;
  previewCanvas.height = height;
  const ctx = previewCanvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(cachedImage, 0, 0, width, height);
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
}

loadTranslations().then(() => {
  langSelect.value = currentLang;
  setupDragAndDrop();
  setupKeyboardShortcuts();
  setupRatioButtons();
  setupBatchHandlers();
  setupCollapsiblePanels();
  batchFolder.textContent = t('noFolderSelected');

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