try {
    // preload.js
    const { contextBridge, ipcRenderer } = require('electron');
    
    console.log('Preload script executing');
    
    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    contextBridge.exposeInMainWorld('electron', {
      send: (channel, data) => {
        // whitelist channels
        const validChannels = ['run-automation'];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      receive: (channel, func) => {
        const validChannels = ['update-status'];
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender` 
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      }
    });
    
    console.log('Preload script successfully loaded');
  } catch (error) {
    console.error('Error in preload script:', error);
  }