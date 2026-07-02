const { app, BrowserWindow } = require('electron')
const path = require('path')
const serve = require('electron-serve')

// Serve the 'out' directory in production mode
const loadURL = serve({ directory: 'out' })

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (app.isPackaged) {
    loadURL(mainWindow)
  } else {
    mainWindow.loadURL('http://localhost:3000')
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
