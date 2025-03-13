const fs = require('fs');
const path = require('path');

// Config file path
const configPath = path.join(__dirname, '..', '..', 'config.json');

/**
 * Loads configuration from file or creates default config if none exists
 * @returns {Object} The loaded configuration
 */
function loadConfig() {
    console.log('Looking for config at:', configPath);
    
    let config;
    try {
        if (fs.existsSync(configPath)) {
            config = require(configPath);
            console.log('Config loaded successfully');
            
            // Add default values for missing properties
            ensureDefaultValues(config);
        } else {
            console.error(`Config file not found at: ${configPath}`);
            config = createDefaultConfig();
            saveConfig(config);
        }
    } catch (error) {
        console.error('Error loading config:', error);
        config = createDefaultConfig();
    }
    
    return config;
}

/**
 * Creates a default configuration object
 * @returns {Object} The default configuration
 */
function createDefaultConfig() {
    console.log('Creating default config');
    return {
        windowWidth: 1200,
        windowHeight: 800,
        windowResizable: false,
        devToolsEnabled: false,
        pythonScriptPath: '../automation-back/news_scraper_byKeyword.py',
        alternativeScriptPaths: [
            '../scripts/news_scraper_byKeyword.py',
            '../news_scraper_byKeyword.py'
        ]
    };
}

/**
 * Ensures that the given config has all required default values
 * @param {Object} config - The configuration object to check
 */
function ensureDefaultValues(config) {
    const defaults = createDefaultConfig();
    
    // Add any missing properties from defaults
    for (const [key, value] of Object.entries(defaults)) {
        if (config[key] === undefined) {
            config[key] = value;
            console.log(`Added default value for ${key} to config`);
        }
    }
}

/**
 * Saves configuration to file
 * @param {Object} config - The configuration to save
 * @returns {boolean} True if saved successfully, false otherwise
 */
function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
        console.log('Config saved successfully');
        return true;
    } catch (err) {
        console.error('Error saving config:', err);
        return false;
    }
}

/**
 * Updates a configuration property
 * @param {Object} config - The configuration object
 * @param {string} key - The property name to update
 * @param {*} value - The new value
 * @returns {boolean} True if updated successfully, false otherwise
 */
function updateConfig(config, key, value) {
    if (!config) return false;
    
    config[key] = value;
    return saveConfig(config);
}

module.exports = {
    loadConfig,
    saveConfig,
    updateConfig,
    configPath
};