// Electron entry point for the desktop build. Loads the Vite bundle produced by
// `vite build --mode electron` (relative base, no service worker) straight from disk.
// .cjs on purpose: package.json declares "type": "module" for the Vite/React code, and
// CommonJS is the friction-free format for Electron main processes.
const path = require('node:path')
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'buildResources', 'icon.png'),
    autoHideMenuBar: true,
  })
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()

  // macOS convention: clicking the dock icon with no windows open recreates one.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Windows/Linux convention: closing the last window quits the app (macOS apps stay in the dock).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
