let currentFilePath = null;
let originalWidth = 0;
let originalHeight = 0;
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
const canvasArea = document.getElementById('canvas-area');

btnSelect.addEventListener('click', async () => {
  const filepath = await window.electronAPI.selectImage();
  if (filepath) {
    await loadImage(filepath);
  }
});

btnResize.addEventListener('click', async () => {
  if (!currentFilePath) return;

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);

  if (!width || !height || width < 1 || height < 1) {
    showStatus('Informe largura e altura válidas', 'error');
    return;
  }

  btnResize.disabled = true;
  btnResize.innerHTML = '<span class="icon">⏳</span> Processando...';

  const result = await window.electronAPI.resizeImage({
    filepath: currentFilePath,
    width: width,
    height: height
  });

  if (result.success) {
    showStatus(`✓ Salvo: ${result.filename}`, 'success');
    await loadPreview(result.filepath);
  } else {
    showStatus(`Erro: ${result.error}`, 'error');
  }

  btnResize.disabled = false;
  btnResize.innerHTML = '<span class="icon">✓</span> Redimensionar';
});

btnClear.addEventListener('click', () => {
  currentFilePath = null;
  originalWidth = 0;
  originalHeight = 0;
  originalFormat = '';

  inputWidth.value = '';
  inputHeight.value = '';
  originalDims.textContent = '-';
  formatInfo.textContent = '-';
  fileInfo.innerHTML = '<span class="label">Nenhum arquivo selecionado</span>';
  previewImage.classList.add('hidden');
  btnResize.disabled = true;
  showStatus('', '');
});

inputWidth.addEventListener('input', updatePreview);
inputHeight.addEventListener('input', updatePreview);

async function loadImage(filepath) {
  currentFilePath = filepath;

  const info = await window.electronAPI.getImageInfo(filepath);
  if (!info) {
    showStatus('Erro ao carregar imagem', 'error');
    return;
  }

  originalWidth = info.width;
  originalHeight = info.height;
  originalFormat = info.format;

  originalDims.textContent = `${originalWidth} x ${originalHeight} px`;
  formatInfo.textContent = originalFormat;

  const filename = filepath.split(/[/\\]/).pop();
  fileInfo.innerHTML = `<span class="filename">${filename}</span>`;

  inputWidth.value = originalWidth;
  inputHeight.value = originalHeight;

  await loadPreview(filepath);

  btnResize.disabled = false;
  showStatus('Imagem carregada', 'success');
}

async function loadPreview(filepath) {
  const base64 = await window.electronAPI.getPreviewBase64(filepath);
  previewImage.src = base64;
  previewImage.classList.remove('hidden');
}

function updatePreview() {
  const width = parseInt(inputWidth.value) || 0;
  const height = parseInt(inputHeight.value) || 0;

  if (width > 0 && height > 0 && currentFilePath) {
    const previewUrl = `file://${currentFilePath}`;
  }
}

function showStatus(message, type) {
  statusText.textContent = message;
  statusText.parentElement.className = 'status-bar';
  if (type) {
    statusText.parentElement.classList.add(type);
  }
}