const {ipcRenderer} = require('electron')

const newWindowBtn = document.getElementById('flickr-authorize')

newWindowBtn.addEventListener('click', () => {
  ipcRenderer.send('authorize', '')
})

ipcRenderer.on('authorized', (event, arg) => {
  const message = `Received token: ${arg}`
  document.getElementById('authorize-reply').innerHTML = message
})
