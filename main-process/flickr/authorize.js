const { BrowserWindow, ipcMain, shell } = require('electron')
const settings = require('electron-settings')
const { URL } = require('url')
const Flickr = require('flickr-sdk')

const consumerKey = '2fb4fcdb9722d23bedd4b7552fc981cc'
const consumerSecret = '2cf5f4dfc516638a'
const callbackUrl = 'http://example.com/'

function showAuthWindow (url) {
  return new Promise((resolve, reject) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const options = {
      width: 400,
      height: 650,
      webPreferences: {
        nodeIntegration: false,
        webSecurity: true
      },
      show: false,
      modal: true,
      parent: mainWindow
    }
    const authWindow = new BrowserWindow(options)
    const validUrls = ['https://login.yahoo.com/account/challenge/password', 'https://guce.yahoo.com/consent']
    const rejectUrl = 'https://www.flickr.com/'

    function onCallback (event, url) {
      const urlObj = new URL(url)
      const target = urlObj.origin + urlObj.pathname
      if (target === callbackUrl) {
        const params = urlObj.searchParams
        const oauthToken = params.get('oauth_token')
        const oauthVerifier = params.get('oauth_verifier')
        resolve({
          oauthToken,
          oauthVerifier
        })
        setImmediate(() => {
          authWindow.removeAllListeners('on-close')
          authWindow.close()
        })
      } else if (target === rejectUrl) {
        reject(new Error('Was not authorized'))
        setImmediate(() => {
          authWindow.removeAllListeners('on-close')
          authWindow.close()
        })
      } else if (validUrls.includes(target)) {
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

    authWindow.loadURL(url)
  })
}

function authorize () {
  var oauth = new Flickr.OAuth(consumerKey, consumerSecret)
  return oauth
      .request(callbackUrl)
      .then(res => {
        const oauthToken = res.body.oauth_token

        const url = oauth.authorizeUrl(oauthToken, 'write')

        return showAuthWindow(url)
      })
      .then(res => {
        settings.set('oauth_token', res.oauthToken)
        settings.set('oauth_verifier', res.oauthVerifier)
        return res.oauthToken
      })
}

ipcMain.on('authorize', (event, arg) => {
  authorize().then(res => event.sender.send('authorized', res))
})
