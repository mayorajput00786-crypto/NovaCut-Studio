# Windows Desktop Packaging & Installer Guide

## 1. Overview
NovaCut AI Video Studio runs as a full-stack desktop application combining an Express backend engine with a high-performance React canvas UI.

To produce `.exe` and `.msi` installers for Windows, you can package the application using **Electron Forge** or **Tauri**.

---

## 2. Packaging with Electron Forge
1. Add Electron and Forge dependencies:
   ```bash
   npm install --save-dev @electron-forge/cli electron
   npx electron-forge import
   ```

2. Create `electron-main.js`:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   require('./server.js'); // Starts the local Express licensing server

   function createWindow() {
     const win = new BrowserWindow({
       width: 1440,
       height: 900,
       title: 'NovaCut AI Video Studio',
       icon: path.join(__dirname, 'icon.ico'),
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
       },
     });

     win.loadURL('http://localhost:3000');
   }

   app.whenReady().then(createWindow);
   ```

3. Build the Windows installer:
   ```bash
   npm run build
   npx electron-forge make
   ```
   The generated Windows `.exe` installer will be located in `/out/make/squirrel.windows/x64/`.

---

## 3. Creating Windows Installers with Inno Setup
For a lightweight distribution without Electron overhead:
1. Compile the Node.js backend using `pkg` or `nexe`:
   ```bash
   npx pkg server.ts -t node18-win-x64 --out-path bin/
   ```
2. Create an `installer.iss` script in **Inno Setup Compiler**.
3. Compile into a single `NovaCut_Studio_Setup_v2.5.exe`.
