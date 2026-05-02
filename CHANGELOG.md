# Changelog

## [1.1.0] - 2026-05-02

### Added
- Comprehensive code documentation (JSDoc comments) across all source files:
  - **main.js**: Added header comments explaining main process functionality, IPC handlers, and app lifecycle
  - **renderer.js**: Documented global state, helper functions, DOM elements, batch processing, image loading, live preview, and accordion panels
  - **styles.css**: Added header with CSS structure overview and section organization

### Fixed
- Dialog filter extension bug: removed dots from extension array (`.png` → `png`) to prevent `..extensao` showing in file dialog

### Code Organization
- Added section dividers using `// ==================== SECTION NAME ====================` pattern
- Organized renderer.js into clear functional groups:
  - GLOBAL STATE
  - HELPER FUNCTIONS
  - DOM ELEMENTS
  - BATCH PROCESSING
  - IMAGE LOADING
  - LIVE PREVIEW
  - ACCORDION PANELS
- Improved code readability and maintainability for future development

---

## [1.0.1] - Previous Version

### Features
- Multi-language support (EN, PT-BR, ES, FR, DE, JA, ZH)
- Drag & drop image loading
- Keyboard shortcuts (Ctrl+O, Ctrl+Shift+S, Ctrl+L/Escape)
- Compression quality slider for JPEG
- Live preview for real-time updates
- Proportion preset buttons (16:9, 4:3, 1:1, etc.)
- Collapsible panels (accordion style)
- Batch resize with progress tracking
- Dark theme (Photoshop-like UI)

### Bug Fixes
- Fixed race condition in loadImage() with currentLoadId
- Fixed batch file overwriting with unique naming
- Fixed unhandled promise rejection in batch processing
- Fixed WEBP MIME type in mimeMap
- Fixed translation loading error handling
- Converted file operations to async
- Fixed canvas memory leak
- Added missing functions to preload.js