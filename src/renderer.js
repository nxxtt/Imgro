let translations = {};
let currentLang = localStorage.getItem('lang') || 'en';

let currentFilePath = null;
let currentDataUrl = null;
let originalFormat = '';

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

const validExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'];

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
    const ext = filepath.split('.').pop().toLowerCase();

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
  const response = await fetch('translations.json');
  translations = await response.json();
  applyTranslations();
}

function t(key) {
  const langObj = translations[currentLang];
  if (langObj && langObj[key]) return langObj[key];
  const ptObj = translations['pt-BR'];
  if (ptObj && ptObj[key]) return ptObj[key];
  return key;
}

function applyTranslations() {
  document.getElementById('btn-select').innerHTML = `<span class="icon">📂</span> ${t('openImage')}<span class="shortcut">Ctrl+O</span>`;
  document.getElementById('btn-resize').innerHTML = `<span class="icon">✓</span> ${t('resize')}<span class="shortcut">Ctrl+Shift+S</span>`;
  document.getElementById('btn-clear').innerHTML = `<span class="icon">↺</span> ${t('clear')}<span class="shortcut">Ctrl+L</span>`;
  document.querySelector('.panel-header').textContent = t('file');
  document.querySelectorAll('.panel-header')[1].textContent = t('dimensions');
  document.querySelectorAll('.panel-header')[2].textContent = t('info');
  document.querySelector('.sidebar-header h1').textContent = t('appTitle');
  
  const emptyText = document.querySelector('.empty-state p');
  if (emptyText) emptyText.textContent = t('dragOrClick');
  
  const labels = document.querySelectorAll('.dimension-row label');
  if (labels[0]) labels[0].textContent = t('original') + ':';
  if (labels[1]) labels[1].textContent = t('newWidth') + ':';
  if (labels[2]) labels[2].textContent = t('newHeight') + ':';
  if (labels[3]) labels[3].textContent = t('format') + ':';
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
  if (!currentFilePath || !currentDataUrl) return;

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);

  if (!width || !height || width < 1 || height < 1) {
    showStatus(t('errorResize'), 'error');
    return;
  }

  btnResize.disabled = true;
  btnResize.innerHTML = `<span class="icon">⏳</span> ${t('processing')}`;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.onload = async function() {
    ctx.drawImage(img, 0, 0, width, height);
    
    const ext = currentFilePath.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const quality = ext === 'png' ? 1.0 : (qualitySlider ? qualitySlider.value / 100 : 0.9);
    const resizedBase64 = canvas.toDataURL(mimeType, quality);

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
  };
  img.onerror = function() {
    showStatus(t('errorProcessingImage'), 'error');
    btnResize.disabled = false;
    btnResize.innerHTML = `<span class="icon">✓</span> ${t('resize')}`;
  };
  img.src = currentDataUrl;
});

btnClear.addEventListener('click', () => {
  currentFilePath = null;
  currentDataUrl = null;
  originalFormat = '';

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
});

async function loadImage(filepath) {
  currentFilePath = filepath;

  const info = await window.electronAPI.getImageInfo(filepath);
  if (!info || !info.dataUrl) {
    showStatus(t('errorLoadingImage'), 'error');
    return;
  }

  currentDataUrl = info.dataUrl;
  originalFormat = info.format;

  const img = new Image();
  img.onload = function() {
    const originalWidth = this.width;
    const originalHeight = this.height;

    originalDims.textContent = `${originalWidth} x ${originalHeight} ${t('px')}`;
    formatInfo.textContent = originalFormat;

    const isJpeg = originalFormat === 'JPEG' || originalFormat === 'JPG';
    qualityRow.style.display = isJpeg ? 'flex' : 'none';

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

function updatePreview() {
  if (!currentDataUrl || !currentFilePath) return;

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);
  if (!width || !height || width < 1 || height < 1) return;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = function() {
    ctx.drawImage(img, 0, 0, width, height);
    const ext = currentFilePath.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const quality = ext === 'png' ? 1.0 : (qualitySlider ? qualitySlider.value / 100 : 0.9);
    previewImage.src = canvas.toDataURL(mimeType, quality);
    showStatus(`${width}x${height}`, 'success');
  };
  img.src = currentDataUrl;
}

loadTranslations().then(() => {
  langSelect.value = currentLang;
  setupDragAndDrop();
  setupKeyboardShortcuts();
  setupRatioButtons();

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