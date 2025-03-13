const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path'); 

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

    // index.html 파일 경로 수정
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

// UI에서 "자동화 시작" 버튼을 클릭하면 Python 실행
ipcMain.on('run-automation', (event, keywords) => {
    console.log("이벤트 받음: ", keywords);  // 이벤트가 제대로 수신되는지 확인
    if (!pythonProcess) {
        // Convert array to comma-separated string if needed
        const keywordString = Array.isArray(keywords) ? keywords.join(',') : keywords;
        
        pythonProcess = spawn('python', [path.join(__dirname, 'automation-back', 'news_scraper_byKeyword.py'), keywordString]);

        pythonProcess.stdout.on('data', (data) => {
            const message = data.toString().trim();
            console.log("Python Output:", message);
            mainWindow.webContents.send('update-status', message);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error("Python Error:", data.toString().trim());
            mainWindow.webContents.send('update-status', "Error occurred during automation.");
        });

        pythonProcess.on('exit', () => {
            pythonProcess = null;
            mainWindow.webContents.send('update-status', "작업 완료");
        });
    }
});