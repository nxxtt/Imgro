# Imgro

Desktop application to resize images to any resolution (may distort).

![Version](https://img.shields.io/badge/version-1.2.0-blue)
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

### Core
- **Forced resizing**: Set any width x height (may distort)
- **Live preview**: Real-time preview when changing dimensions/quality
- **Quality control**: Compression quality slider for JPEG (0-100%)
- **Proportion presets**: 16:9, 4:3, 1:1, 3:2, 9:16, 21:9, Original
- **Format conversion**: Output to PNG, JPEG, WEBP, BMP (or keep original)

### Transformations
- **Rotation**: 90°, 180° left/right
- **Flip**: Horizontal and vertical flip
- **Reset**: Reset all transformations

### Filters
- **Brightness**: 0-200% (default 100%)
- **Contrast**: 0-200% (default 100%)
- **Saturation**: 0-200% (default 100%)
- **Grayscale**: 0-100% (default 0%)

### Input/Output
- **Drag & drop**: Drop images anywhere on the workspace
- **File dialog**: Open via button or Ctrl+O
- **Save dialog**: Native Windows save dialog with default name "image"

### Batch Processing
- **Multiple files**: Process hundreds of images at once
- **Folder selection**: Select output directory
- **Retry logic**: 3 attempts per image with 30s timeout
- **Progress indicator**: Visual progress bar

### UI/UX
- **7 languages**: EN, PT-BR, ES, FR, DE, JA, ZH
- **Dark theme**: Photoshop-like interface
- **Zoom controls**: Zoom in/out/fit (25%-400%)
- **Collapsible panels**: Accordion-style panels
- **Loading spinner**: Visual feedback during processing
- **Keyboard shortcuts**: Full keyboard navigation

### Advanced
- **Validation**: Dimensions up to 20000px, canvas limit 65535px
- **Memory management**: Proper cleanup of resources
- **Error handling**: Detailed error messages
- **Security**: Path traversal protection

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+O | Open image |
| Ctrl+Shift+S | Resize & save |
| Ctrl+E | Rotate 90° clockwise |
| Ctrl+L / Escape | Clear current image |
| Ctrl+Plus (+) | Zoom in |
| Ctrl+Minus (-) | Zoom out |
| Ctrl+0 | Fit to window |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Technologies

- **Electron** 41.4.0
- **HTML5 Canvas** (image processing)
- **HTML/CSS/JS**

## Requirements

- Windows 10/11 (x64)
- No additional runtime required (self-contained)

## Project Structure

```
modificador_resolucao/
├── main.js          # Electron main process
├── preload.js      # IPC bridge (contextBridge)
├── package.json    # Project configuration
├── src/
│   ├── index.html   # UI structure
│   ├── renderer.js # UI logic
│   ├── styles.css  # Dark theme styles
│   └── translations.json # 7 language translations
├── dist-new/        # Build output
│   ├── ImgroSetup.exe   # Installer
│   └── Imgrop.exe       # Portable
├── README.md       # This file
└── CHANGELOG.md    # Version history
```