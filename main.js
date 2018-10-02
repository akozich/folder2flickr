// only add update server if it's not being run from cli
if (require.main !== module) {
  require('update-electron-app')({
    logger: require('electron-log')
  })
}

const path = require('path')
const { app, BrowserWindow } = require('electron')
const settings = require('electron-settings')
const flickrClient = require('./main-process/flickr-client')

const debug = /--debug/.test(process.argv[2])

if (process.mas) app.setName('Electron APIs')

let mainWindow = null

function initialize () {
  const shouldQuit = makeSingleInstance()
  if (shouldQuit) return app.quit()

  function createWindow () {
    const defaultState = {
      x: 100,
      y: 100,
      width: 800,
      height: 600
    }
    const lastWindowState = settings.get('lastWindowState', defaultState)

    const windowOptions = {
      title: app.getName(),
      x: lastWindowState.x,
      y: lastWindowState.y,
      width: lastWindowState.width,
      height: lastWindowState.height,
      minWidth: 600,
      minHeight: 400
    }

    // if (process.platform === 'linux') {
    //   windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/512.png')
    // }

    mainWindow = new BrowserWindow(windowOptions)
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      mainWindow.webContents.openDevTools()
      mainWindow.maximize()
      require('devtron').install()
    }

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  }

  app.on('ready', () => {
    createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    if (mainWindow && !mainWindow.isFullScreen()) {
      settings.set('lastWindowState', mainWindow.getBounds())
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  if (process.mas) return false

  return app.makeSingleInstance(() => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
// initialize()
flickrClient.login().then(() => {
  initialize()
}).catch(err => {
  console.error(err)
})

