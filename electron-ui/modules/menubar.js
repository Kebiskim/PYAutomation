const { Menu, dialog, app, shell } = require('electron');
const { updateConfig } = require('./config-manager');

/**
 * Creates application menu
 * @param {BrowserWindow} mainWindow - The main browser window
 * @param {Object} config - The application configuration
 * @returns {Menu} The created menu
 */
function createApplicationMenu(mainWindow, config) {
    const devToolsEnabled = config.devToolsEnabled !== undefined ? config.devToolsEnabled : false;
    
    const template = [
        {
            label: '파일',
            submenu: [
                { 
                    label: '닫기', 
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit() 
                }
            ]
        },
        {
            label: '보기',
            submenu: [
                { 
                    label: '최대화',
                    click: () => {
                        if (!mainWindow.isMaximized()) {
                            mainWindow.maximize();
                        } else {
                            mainWindow.unmaximize();
                        }
                    }
                },
                { 
                    label: '최소화', 
                    accelerator: 'CmdOrCtrl+M',
                    click: () => mainWindow.minimize() 
                },
                { type: 'separator' },
                {
                    label: '개발자 도구',
                    type: 'checkbox',
                    checked: devToolsEnabled,
                    click: () => {
                        const newState = !config.devToolsEnabled;
                        mainWindow.webContents.send('toggle-dev-tools', newState);
                    }
                }
            ]
        },
        {
            label: '정보',
            submenu: [
                {
                    label: '버전 정보',
                    click: () => {
                        dialog.showMessageBox({
                            title: '프로그램 정보',
                            message: '뉴스 자동화 프로그램',
                            detail: '버전: 1.0.0\n©2025 All Rights Reserved'
                        });
                    }
                }
            ]
        },
        {
            label: '도움말',
            submenu: [
                {
                    label: '문의하기: kebikim@kakao.com',
                    click: () => {
                        shell.openExternal('mailto:kebikim@kakao.com');
                    }
                }
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    return menu;
}

module.exports = {
    createApplicationMenu
};