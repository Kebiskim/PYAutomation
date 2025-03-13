const { app, BrowserWindow } = require('electron');

// Import modules
const { loadConfig } = require('./modules/config-manager');
const { createMainWindow, cleanup: cleanupWindow } = require('./modules/window-manager');
const { cleanup: cleanupPython } = require('./modules/python-runner');
const { setupIpcHandlers } = require('./modules/ipc-handler');

// Load configuration
const config = loadConfig();

function initializeApp() {
    // Create the browser window
    const mainWindow = createMainWindow(config);
    
    // Set up IPC handlers
    setupIpcHandlers(mainWindow, config);
}

// App is ready to start
app.whenReady().then(initializeApp);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) {
        initializeApp();
    }
});

// Clean up resources when app is about to quit
app.on('will-quit', () => {
    cleanupWindow();
});

// Make sure to clean up any running processes when the app is about to quit
app.on('before-quit', () => {
    cleanupPython();
});