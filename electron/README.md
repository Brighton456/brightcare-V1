# Brightech SmartCare — Offline Desktop Version

## Overview
This is the **Electron-based offline desktop application** for Brightech SmartCare Hospital Management & Medical POS System.

It wraps the same web application in a native desktop window, with:
- **Offline capability** via IndexedDB local storage
- **Auto-sync** when internet connectivity is restored
- **Native OS integration** (system tray, notifications, file dialogs)

## Architecture
```
electron/
├── main.cjs          # Electron main process
├── preload.cjs       # Secure bridge between main & renderer
├── README.md         # This file
```

The app loads the production build from `dist/index.html`.

## Building

### Prerequisites
- Node.js 18+
- npm or bun

### Steps

1. Install dependencies:
   ```bash
   npm install --save-dev electron @electron/packager
   ```

2. Build the web app:
   ```bash
   npx vite build
   ```

3. Package for your platform. Always write packaged binaries outside the
   source repository; they are release downloads and must never enter Git
   history. For example:
   ```bash
   # Linux
   npx @electron/packager . "BrightechSmartCare" --platform=linux --arch=x64 --out=../brightcare-desktop-builds --overwrite --ignore='node_modules' --ignore='^/src' --ignore='^/public'

   # Windows
   npx @electron/packager . "BrightechSmartCare" --platform=win32 --arch=x64 --out=../brightcare-desktop-builds --overwrite --ignore='node_modules' --ignore='^/src' --ignore='^/public'

   # macOS
   npx @electron/packager . "BrightechSmartCare" --platform=darwin --arch=x64 --out=../brightcare-desktop-builds --overwrite --ignore='node_modules' --ignore='^/src' --ignore='^/public'
   ```

4. Find the packaged app in `../brightcare-desktop-builds/`, archive it there,
   and upload it as a downloadable release artifact rather than source code.

Before syncing or building, run `npm run check:repo-size`. The normal web
build also runs this guard automatically and stops if a source file is close
to GitHub's 100 MB limit.

## Offline Storage

The desktop version uses **IndexedDB** for local data persistence:
- Patient records cached locally
- POS transactions queued when offline
- Auto-sync queue processes when connectivity returns
- Conflict resolution uses server-wins strategy with local backup

## Online vs Offline

| Feature | Online (Web) | Offline (Desktop) |
|---------|-------------|-------------------|
| Data Storage | Brightech Cloud | IndexedDB + Cloud sync |
| Access | Browser | Native window |
| Connectivity | Required | Optional |
| Updates | Instant | Manual rebuild |
| M-Pesa STK Push | Full | Online only |
| Receipt Printing | Browser print | Native print dialog |
