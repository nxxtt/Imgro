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

async function loadTranslations() {
  const response = await fetch('translations.json');
  translations = await response.json();
  applyTranslations();
}

function t(key) {
  return translations[currentLang]?.[key] || translations['pt-BR']?.[key] || key;
}

function applyTranslations() {
  document.getElementById('btn-select').innerHTML = `<span class="icon">📂</span> ${t('openImage')}`;
  document.getElementById('btn-resize').innerHTML = `<span class="icon">✓</span> ${t('resize')}`;
  document.getElementById('btn-clear').innerHTML = `<span class="icon">↺</span> ${t('clear')}`;
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
  
  if (!fileInfo.querySelector('.label')) {
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
    const resizedBase64 = canvas.toDataURL(mimeType, 0.9);

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

loadTranslations().then(() => {
  langSelect.value = currentLang;
});