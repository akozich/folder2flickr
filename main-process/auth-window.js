const { BrowserWindow, shell } = require('electron')
const { URL } = require('url')

class AuthWindow {
  constructor (url, validUrls, callbackUrl, rejectUrl) {
    this.url = url
    this.validUrls = validUrls
    this.callbackUrl = callbackUrl
    this.rejectUrl = rejectUrl
  }

  show () {
    const that = this
    return new Promise(function (resolve, reject) {
      const options = {
        width: 400,
        height: 600,
        frame: false,
        webPreferences: {
          nodeIntegration: false,
          webSecurity: true
        },
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        show: false
      }
      const authWindow = new BrowserWindow(options)

      function onCallback (event, url) {
        const urlObj = new URL(url)
        const target = urlObj.origin + urlObj.pathname
        if (target === that.callbackUrl) {
          const params = urlObj.searchParams
          const oauthToken = params.get('oauth_token')
          const oauthVerifier = params.get('oauth_verifier')
          resolve({
            oauthToken: oauthToken,
            oauthVerifier: oauthVerifier
          })
          setImmediate(() => {
            authWindow.removeAllListeners('on-close')
            authWindow.close()
          })
        } else if (target === that.rejectUrl) {
          reject(new Error('Was not authorized'))
          setImmediate(() => {
            authWindow.removeAllListeners('on-close')
            authWindow.close()
          })
        } else if (that.validUrls.includes(target)) {
          // allow
        } else {
          event.preventDefault()
          shell.openExternal(url)
        }
      }

      authWindow.webContents.on('will-navigate', (event, url) => {
        onCallback(event, url)
      })

      authWindow.webContents.on('did-finish-load', () => {
        authWindow.show()
      })

      authWindow.webContents.on('on-close', () => {
        reject(new Error('Login window closed'))
      })

      authWindow.loadURL(that.url)
    })
  }
}

module.exports = AuthWindow
