# Redimensionador de Imagens

Aplicação desktop para redimensionar imagens para qualquer resolução (pode distorcer). Interface estilo Photoshop.

## Como Usar

### Executável (Recomendado)
- Execute `dist\win-unpacked\Redimensionador de Imagens.exe` diretamente

### Ou instale
- Execute `dist\Redimensionador de Imagens Setup 1.0.0.exe` para instalar

### Desenvolvimento
```bash
npm install
npm start
```

### Compilar
```bash
npm run build
```

## Funcionalidades

- Interface estilo Photoshop (dark theme)
- Selecionar imagem via diálogo
- Redimensionamento forçado (pode distorcer)
- Preview da imagem
- Preserva formato original (jpg→jpg, png→png)
- Nome automático: `{nome}_modificado.ext`, `{nome}_modificado2.ext`, etc.

## Tecnologias

- Electron
- HTML5 Canvas (processamento de imagens)
- HTML/CSS/JS

## Requisitos

- Windows 10/11 (x64)