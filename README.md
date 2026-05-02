# Imgro

Desktop application to resize images to any resolution (may distort).

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20x64-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## Download

| Type | File | Description |
|------|------|-------------|
| Portable | `Imgrop.exe` | Run directly, no installation |
| Installer | `ImgroSetup.exe` | Full installation with shortcuts |

## How to Use

### Portable (Recommended)
- Run `Imgrop.exe` directly (no installation needed)

### Installer
- Run `ImgroSetup.exe` to install
- Creates Start Menu and Desktop shortcuts

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

- **Multi-language**: 7 languages (EN, PT-BR, ES, FR, DE, JA, ZH)
- **Forced resizing**: Set any width x height (may distort)
- **Image preview**: Real-time preview when changing dimensions
- **Quality control**: Compression quality slider for JPEG (0-100%)
- **Proportion presets**: 16:9, 4:3, 1:1, 3:2, 9:16, 21:9, Original
- **Drag & drop**: Drop images anywhere on the workspace
- **Batch processing**: Resize multiple images at once
- **Format preservation**: jpg→jpg, png→png, webp→webp
- **Auto-naming**: `{name}_modificado.ext`, `{name}_modificado2.ext`, etc.
- **Dark theme**: Photoshop-like interface

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+O | Open image |
| Ctrl+Shift+S | Resize & save |
| Ctrl+L / Escape | Clear current image |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Technologies

- **Electron** 41.4.0
- **HTML5 Canvas** (image processing)
- **HTML/CSS/JS**

## Requirements

- Windows 10/11 (x64)