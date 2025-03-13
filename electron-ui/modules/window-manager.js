const { BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { updateConfig } = require('./config-manager');
const { createApplicationMenu } = require('./menubar');

let mainWindow = null;

/**
 * Creates the application main window
 * @param {Object} config - The application configuration
 * @returns {BrowserWindow} The created window
 */
function createMainWindow(config) {
    // Get window size from config or use defaults
    const windowWidth = config.windowWidth || 1200;
    const windowHeight = config.windowHeight || 800;
    const windowResizable = config.windowResizable !== undefined ? config.windowResizable : false;
    const devToolsEnabled = config.devToolsEnabled !== undefined ? config.devToolsEnabled : false;
    
    console.log(`Creating window with size: ${windowWidth}x${windowHeight}, resizable: ${windowResizable}, devTools: ${devToolsEnabled}`);
    
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        resizable: windowResizable,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true // Always allow DevTools, control via shortcuts
        }
    });

    // Create and set the application menu
    createApplicationMenu(mainWindow, config);

    // Set up developer tools shortcuts
    setupDevTools(devToolsEnabled);

    // Save window size when resized if resizable is true
    if (windowResizable) {
        mainWindow.on('resize', () => {
            const { width, height } = mainWindow.getBounds();
            config.windowWidth = width;
            config.windowHeight = height;
            // Don't save immediately to prevent excessive writes on resize
        });
        
        // Save window size only when resize ends
        mainWindow.on('resized', () => {
            const { width, height } = mainWindow.getBounds();
            updateConfig(config, 'windowWidth', width);
            updateConfig(config, 'windowHeight', height);
        });
    }

    // index.html 파일 경로 수정
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    
    return mainWindow;
}

/**
 * Sets up developer tools shortcuts
 * @param {boolean} enabled - Whether developer tools are enabled
 */
function setupDevTools(enabled) {
    // Always unregister shortcuts first to avoid duplicates
    globalShortcut.unregisterAll();
    
    if (enabled) {
        // Register developer shortcuts
        globalShortcut.register('F12', () => {
            if (mainWindow) {
                mainWindow.webContents.toggleDevTools();
            }
        });
        
        globalShortcut.register('CommandOrControl+Shift+I', () => {
            if (mainWindow) {
                mainWindow.webContents.toggleDevTools();
            }
        });
        
        console.log('Developer tools shortcuts enabled');
    } else {
        console.log('Developer tools shortcuts disabled');
    }
}

/**
 * Gets the main window instance
 * @returns {BrowserWindow|null} The main window or null if not created
 */
function getMainWindow() {
    return mainWindow;
}

/**
 * Cleans up resources when the application is quitting
 */
function cleanup() {
    globalShortcut.unregisterAll();
}

module.exports = {
    createMainWindow,
    getMainWindow,
    setupDevTools,
    cleanup
};