# Imgro

Desktop application to resize images to any resolution (may distort). Photoshop-style interface.

## How to Use

### Portable (Recommended)
- Run `dist\Imgrop.exe` directly (no installation needed)

### Installer
- Run `dist\ImgroSetup.exe` to install

### Development
```bash
npm install
npm start
```

### Build
```bash
npm run build
```

## Features

- Photoshop-style interface (dark theme)
- 7 languages (EN, PT-BR, ES, FR, DE, JA, ZH)
- Select image via dialog
- Forced resizing (may distort)
- Image preview
- Preserves original format (jpg→jpg, png→png)
- Automatic naming: `{name}_modified.ext`, `{name}_modified2.ext`, etc.

## Technologies

- Electron
- HTML5 Canvas (image processing)
- HTML/CSS/JS

## Requirements

- Windows 10/11 (x64)