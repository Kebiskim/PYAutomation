const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path'); 
// const config = require('../config.json');
const fs = require('fs');

// Use absolute path to config file
const configPath = path.join(__dirname, '..', 'config.json');
console.log('Looking for config at:', configPath);

let config;
try {
    if (fs.existsSync(configPath)) {
        config = require(configPath);
        console.log('Config loaded successfully');
    } else {
        console.error(`Config file not found at: ${configPath}`);
        // Create default config
        config = {
            pythonScriptPath: '../automation-back/news_scraper_byKeyword.py',
            alternativeScriptPaths: [
                '../scripts/news_scraper_byKeyword.py',
                '../news_scraper_byKeyword.py'
            ]
        };
        console.log('Using default config');
    }
} catch (error) {
    console.error('Error loading config:', error);
    // Fallback to default config
    config = {
        pythonScriptPath: '../automation-back/news_scraper_byKeyword.py',
        alternativeScriptPaths: [
            '../scripts/news_scraper_byKeyword.py',
            '../news_scraper_byKeyword.py'
        ]
    };
}
let mainWindow;
let pythonProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,  // 창 크기 조절을 막음
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // 커스텀 메뉴 생성
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
                }
            ]
        },
        {
            label: '정보',
            submenu: [
                {
                    label: '버전',
                    click: () => {
                        require('electron').dialog.showMessageBox({
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
                        require('electron').shell.openExternal('mailto:support@example.com');
                    }
                }
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // index.html 파일 경로 수정
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

// UI에서 "자동화 시작" 버튼을 클릭하면 Python 실행
ipcMain.on('run-automation', (event, keywords) => {
    console.log("이벤트 받음: ", keywords);
    if (!pythonProcess) {
        try {
            const keywordString = Array.isArray(keywords) ? keywords.join(',') : keywords;
            
            // Use path from configuration
            const scriptPath = path.join(__dirname, config.pythonScriptPath);
            console.log("Python script path:", scriptPath);
            
            const fs = require('fs');
            if (!fs.existsSync(scriptPath)) {
                console.error(`Python script not found at: ${scriptPath}`);
                
                // Try alternative locations from config
                let found = false;
                for (const altPath of config.alternativeScriptPaths) {
                    const fullPath = path.join(__dirname, altPath);
                    if (fs.existsSync(fullPath)) {
                        console.log(`Found script at alternative path: ${fullPath}`);
                        found = true;
                        pythonProcess = spawn('python', [fullPath, keywordString]);
                        break;
                    }
                }
                
                if (!found) {
                    mainWindow.webContents.send('update-status', `오류: 스크립트 파일을 찾을 수 없습니다.`);
                    return;
                }
            } else {
                pythonProcess = spawn('python', [scriptPath, keywordString]);
            }
            
            // ...rest of your code...
        } catch (error) {
            // ...error handling...
        }
    }
});

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
        createWindow();
    }
});