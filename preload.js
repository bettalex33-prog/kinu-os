const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('kinu', {
  version: '1.0.0',
  platform: process.platform
})
