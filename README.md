# Automatic Form Filler Extension

A browser extension that automatically fills forms on web pages.

## Features

- Automatically detects form fields on web pages
- Fills forms with predefined data
- Support for all common field types (text, email, password, select, checkbox, etc.)
- Auto-fill on page load (optional)
- Keyboard shortcut (Alt+F) for quick form filling
- Context menu integration
- Popup interface for easy control

## Project Structure

```
form-filler-extension/
├── src/                      # Source code
│   ├── background/           # Background script
│   ├── content/              # Content scripts (injected into web pages)
│   ├── popup/                # Popup UI
│   ├── utils/                # Shared utilities
│   └── manifest.json         # Extension manifest
├── test/                     # Tests
│   ├── e2e/                  # End-to-end tests
│   └── setup.ts              # Test setup
├── dist/                     # Build output
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── webpack.config.js         # Webpack configuration
```

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Build

Build the extension:

```bash
npm run build
```

For development with auto-rebuilding:

```bash
npm run watch
```

### Testing

Run E2E tests:

```bash
npm run test:e2e
```

### Installing the Extension

1. Build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` directory

## MVP Features

- [x] Project setup with TypeScript
- [x] Core form detection logic
- [x] Form filling with static data
- [x] Basic UI for controlling extension
- [x] E2E testing setup
