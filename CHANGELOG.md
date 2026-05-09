# Changelog

## [1.2.0] - 2026-05-08

### Added
- **UI/UX Enhancements**:
  - Panel icons (📁 File, 📐 Dimensions, ℹ️ Info, 🔄 Transform, 🎨 Filters, 📚 Batch)
  - Smooth CSS transitions on buttons and panels
  - Zoom controls (+/-/fit) with Ctrl+scroll wheel support (25%-400%)
  - Loading spinner during image processing
  - Professional SVG icons replacing emojis
  - Keyboard shortcut tooltips on buttons
  - Enhanced status bar with gradient colors and shadows
  - Button ripple effect on click
  - Highlighted keyboard shortcut badges
  - Animated progress bar with gradient

### Fixed
- **Critical Bugs**:
  - Preview using original image dimensions instead of user-specified dimensions
  - Date.now() filename collision in batch processing (now uses performance.now() + index)
  - fs.existsSync() blocking event loop (now uses async fsPromises.access())
  - Canvas dimensions > 65535 causing crash (now validates before rendering)
  - Missing integer validation (accepts "10.5" instead of only integers)

- **Security Fixes**:
  - Path traversal protection in save-batch-image handler
  - Input validation for file paths and output folders
  - localStorage wrapped in try-catch

- **Memory Leaks**:
  - onload/onerror handlers not cleared after image loads
  - Images in ratio buttons not cleaned up
  - Batch images not cleared after each iteration

- **UI/UX Fixes**:
  - Filter sliders lag when image loaded (added 200ms debounce)
  - Batch ignoring outputFormatSelect (now respects format choice)
  - Case sensitivity for JPEG format (now accepts 'jpeg', 'jpg', 'JPEG')
  - Silent failures in batch processing (now shows error messages)
  - Race condition in loadImage (moved currentFilePath assignment before increment)
  - CSS !important redundancy removed
  - Proper centering in preview with scaled dimensions

### Improved
- **Accessibility**:
  - Added aria-labels to all buttons
  - Connected labels to inputs via for/id attributes
  - Added alt text to preview image
  - Better screen reader support

- **Performance**:
  - DocumentFragment for batch file list updates
  - Cached extension/mime for repeated lookups
  - Unified regex for base64 extraction
  - Debounced filter slider updates

### Documentation
- Complete JSDoc documentation:
  - main.js: @module, @version, @param, @returns, @example
  - preload.js: Full API documentation with namespace
  - renderer.js: Variables and functions documented
  - styles.css: Header with color palette
  - README.md: Updated with all features

---

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