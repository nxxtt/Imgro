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
    showStatus('Informe largura e altura válidas', 'error');
    return;
  }

  btnResize.disabled = true;
  btnResize.innerHTML = '<span class="icon">⏳</span> Processando...';

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
      showStatus(`✓ Salvo: ${result.filename}`, 'success');
      previewImage.src = resizedBase64;
    } else {
      showStatus(`Erro: ${result.error}`, 'error');
    }

    btnResize.disabled = false;
    btnResize.innerHTML = '<span class="icon">✓</span> Redimensionar';
  };
  img.onerror = function() {
    showStatus('Erro ao processar imagem', 'error');
    btnResize.disabled = false;
    btnResize.innerHTML = '<span class="icon">✓</span> Redimensionar';
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
  fileInfo.innerHTML = '<span class="label">Nenhum arquivo selecionado</span>';
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
    showStatus('Erro ao carregar imagem', 'error');
    return;
  }

  currentDataUrl = info.dataUrl;
  originalFormat = info.format;

  const img = new Image();
  img.onload = function() {
    originalWidth = this.width;
    originalHeight = this.height;

    originalDims.textContent = `${originalWidth} x ${originalHeight} px`;
    formatInfo.textContent = originalFormat;

    const filename = filepath.split(/[/\\]/).pop();
    fileInfo.innerHTML = `<span class="filename">${filename}</span>`;

    inputWidth.value = originalWidth;
    inputHeight.value = originalHeight;

    previewImage.src = currentDataUrl;
    previewImage.classList.remove('hidden');
    emptyState.style.display = 'none';

    btnResize.disabled = false;
    showStatus('Imagem carregada', 'success');
  };
  img.onerror = function() {
    showStatus('Erro ao carregar imagem', 'error');
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