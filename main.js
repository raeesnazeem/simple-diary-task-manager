const { app, BrowserWindow, ipcMain, protocol, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")
const { syncToDrive } = require("./drive-sync")

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  })
  mainWindow.webContents.openDevTools()

  if (app.isPackaged) {
    const serve = (await import("electron-serve")).default
    const loadURL = serve({ directory: "out" })
    loadURL(mainWindow)
  } else {
    mainWindow.loadURL("http://localhost:3004")
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('diary', (request, callback) => {
    const url = request.url.substr(8)
    const imagesDir = path.join(app.getPath('userData'), 'images')
    callback({ path: path.normalize(path.join(imagesDir, url)) })
  })

  ipcMain.handle('save-image', async (event, arrayBuffer, extension) => {
    const buffer = Buffer.from(arrayBuffer)
    const imagesDir = path.join(app.getPath('userData'), 'images')
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }
    const filename = crypto.randomUUID() + (extension || '.png')
    const filePath = path.join(imagesDir, filename)
    fs.writeFileSync(filePath, buffer)
    return `diary://${filename}`
  })

  ipcMain.handle('save-data', async (event, data) => {
    const dataPath = path.join(app.getPath('userData'), 'diary-data.json')
    fs.writeFileSync(dataPath, data, 'utf-8')
    return true
  })

  ipcMain.on('load-data-sync', (event) => {
    const dataPath = path.join(app.getPath('userData'), 'diary-data.json')
    if (fs.existsSync(dataPath)) {
      event.returnValue = fs.readFileSync(dataPath, 'utf-8')
    } else {
      event.returnValue = null
    }
  })

  ipcMain.handle('sync-to-drive', async (event) => {
    return await syncToDrive()
  })

  createWindow()

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit()
})
