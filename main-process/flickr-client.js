const Flickr = require('flickr-sdk')
const settings = require('electron-settings')
const AuthWindow = require('./auth-window')
const { consumerKey, consumerSecret } = require('./flickr-credentials')

const callbackUrl = 'http://example.com/'

class FlickrClient {
  static authorize (consumerKey, consumerSecret) {
    var oauth = new Flickr.OAuth(consumerKey, consumerSecret)
    return oauth
      .request(callbackUrl)
      .then(res => {
        const oauthToken = res.body.oauth_token

        const url = oauth.authorizeUrl(oauthToken, 'write')

        const authWindow = new AuthWindow(
          url,
          ['https://login.yahoo.com/account/challenge/password', 'https://guce.yahoo.com/consent'],
          callbackUrl,
          'https://www.flickr.com/'
        )
        return authWindow.show()
      })
      .then(res => {
        settings.set('oauth_token', res.oauthToken)
        settings.set('oauth_verifier', res.oauthVerifier)
        return res
      })
  }

  static login () {
    function hasCredentials () {
      return settings.has('oauth_token') && settings.has('oauth_verifier')
    }

    function readCredentials () {
      return new Promise(function (resolve, reject) {
        let oauthToken = settings.get('oauth_token')
        let oauthVerifier = settings.get('oauth_verifier')

        resolve({
          oauthToken: oauthToken,
          oauthVerifier: oauthVerifier
        })
      })
    }

    let creds = hasCredentials() ? readCredentials() : this.authorize(consumerKey, consumerSecret)

    return creds.then(res => {})
  }

}

module.exports = FlickrClient
