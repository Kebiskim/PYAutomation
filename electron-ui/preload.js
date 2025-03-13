try {
    const { contextBridge, ipcRenderer } = require('electron');

    // Send channels
    const validSendChannels = [
        'run-automation', 
        'stop-automation', 
        'select-excel-path',
        'confirm-stop-automation',
        'save-log',
        'toggle-dev-tools',  // Add this new channel
        'open-dev-tools'     // Add this new channel
    ];

    // Receive channels
    const validReceiveChannels = [
        'update-status', 
        'excel-path-selected',
        'stop-automation-response',
        'log-saved',
        'process-finished',
        'dev-tools-toggled'  // Add this new channel
    ];
    
    console.log('Preload script executing');
    
    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    contextBridge.exposeInMainWorld('electron', {
        send: (channel, data) => {
            // whitelist channels
            const validChannels = [
                'run-automation', 
                'stop-automation', 
                'select-excel-path',
                'confirm-stop-automation',
                'save-log',
                'toggle-dev-tools',
                'open-dev-tools'
            ];
            if (validChannels.includes(channel)) {
                console.log(`Sending to channel ${channel}:`, 
                    channel === 'save-log' ? 'log data (length: ' + data.length + ')' : data);
                ipcRenderer.send(channel, data);
            } else {
                console.warn(`Attempted to send to invalid channel: ${channel}`);
            }
        },
        receive: (channel, func) => {
            const validChannels = [
                'update-status', 
                'excel-path-selected',
                'stop-automation-response',
                'log-saved',
                'process-finished',
                'dev-tools-toggled'
            ];
            if (validChannels.includes(channel)) {
                console.log(`Registering handler for channel ${channel}`);
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            } else {
                console.warn(`Attempted to receive from invalid channel: ${channel}`);
            }
        }
    });
    
    console.log('Preload script completed');
} catch (error) {
    console.error('Error in preload script:', error);
}