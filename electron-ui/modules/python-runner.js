const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let pythonProcess = null;

/**
 * Runs a Python script with the specified arguments
 * @param {BrowserWindow} mainWindow - The main window for sending status updates
 * @param {Object} config - The application configuration
 * @param {Object} data - The data to pass to the Python script
 * @returns {boolean} True if started successfully, false otherwise
 */
function runPythonScript(mainWindow, config, data) {
    if (pythonProcess) {
        mainWindow.webContents.send('update-status', "이미 작업이 실행 중입니다.");
        return false;
    }
    
    try {
        const keywords = data.keywords;
        const excelPath = data.excelPath;
        const keywordString = Array.isArray(keywords) ? keywords.join(',') : keywords;
        
        // Use path from configuration
        const scriptPath = path.join(__dirname, '..', config.pythonScriptPath);
        console.log("Python script path:", scriptPath);
        
        if (!fs.existsSync(scriptPath)) {
            console.error(`Python script not found at: ${scriptPath}`);
            
            // Try alternative locations from config
            let found = false;
            for (const altPath of config.alternativeScriptPaths) {
                const fullPath = path.join(__dirname, '..', altPath);
                if (fs.existsSync(fullPath)) {
                    console.log(`Found script at alternative path: ${fullPath}`);
                    found = true;
                    // Pass excel path as an additional argument
                    pythonProcess = spawn('python', [fullPath, keywordString, excelPath]);
                    break;
                }
            }
            
            if (!found) {
                mainWindow.webContents.send('update-status', `오류: 스크립트 파일을 찾을 수 없습니다.`);
                return false;
            }
        } else {
            // Pass excel path as an additional argument
            pythonProcess = spawn('python', [scriptPath, keywordString, excelPath]);
        }
        
        console.log(`Python process started with PID: ${pythonProcess.pid}`);
        mainWindow.webContents.send('update-status', "Python 스크립트 실행 중...");
        
        // 표준 출력 처리
        pythonProcess.stdout.on('data', (data) => {
            const message = data.toString().trim();
            console.log(`Python stdout: ${message}`);
            mainWindow.webContents.send('update-status', message);
        });
        
        // 표준 오류 처리
        pythonProcess.stderr.on('data', (data) => {
            const message = data.toString().trim();
            console.error(`Python stderr: ${message}`);
            mainWindow.webContents.send('update-status', `오류: ${message}`);
        });
        
        // 프로세스 종료 처리
        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            pythonProcess = null;
            
            if (code === 0) {
                mainWindow.webContents.send('update-status', "작업이 성공적으로 완료되었습니다.");
            } else {
                mainWindow.webContents.send('update-status', `작업이 비정상적으로 종료되었습니다. (코드: ${code})`);
            }
            
            // 버튼 상태 업데이트
            mainWindow.webContents.send('process-finished');
        });
        
        // 프로세스 오류 처리
        pythonProcess.on('error', (err) => {
            console.error(`Python process error: ${err.message}`);
            pythonProcess = null;
            mainWindow.webContents.send('update-status', `Python 실행 오류: ${err.message}`);
            mainWindow.webContents.send('process-finished');
        });
        
        return true;
    } catch (error) {
        console.error('Python script execution error:', error);
        mainWindow.webContents.send('update-status', `작업 시작 오류: ${error.message}`);
        mainWindow.webContents.send('process-finished');
        return false;
    }
}

/**
 * Stops the running Python script
 * @param {BrowserWindow} mainWindow - The main window for sending status updates
 * @returns {boolean} True if stopped successfully, false if no process was running
 */
function stopPythonScript(mainWindow) {
    if (!pythonProcess) {
        console.log("중단할 Python 프로세스가 없습니다");
        mainWindow.webContents.send('update-status', "중단할 작업이 없습니다.");
        return false;
    }
    
    try {
        // Windows에서는 taskkill로 프로세스 트리를 중지
        if (process.platform === 'win32') {
            const { exec } = require('child_process');
            console.log(`Python 프로세스 강제 종료 시도 (PID: ${pythonProcess.pid})`);
            
            exec(`taskkill /pid ${pythonProcess.pid} /T /F`, (error, stdout, stderr) => {
                if (error) {
                    console.error("프로세스 강제 종료 실패:", error);
                    mainWindow.webContents.send('update-status', `작업 중단 실패: ${error.message}`);
                } else {
                    console.log("프로세스 강제 종료 성공:", stdout);
                    mainWindow.webContents.send('update-status', "작업이 성공적으로 중단되었습니다.");
                }
            });
        } else {
            // Linux/Mac에서는 SIGTERM 시그널 전송
            console.log(`Python 프로세스 SIGTERM 시그널 전송 (PID: ${pythonProcess.pid})`);
            pythonProcess.kill('SIGTERM');
            mainWindow.webContents.send('update-status', "작업 중단 신호가 전송되었습니다.");
        }
        
        // 프로세스 상태 업데이트
        pythonProcess = null;
        return true;
    } catch (error) {
        console.error("프로세스 종료 중 예외 발생:", error);
        mainWindow.webContents.send('update-status', `작업 중단 중 오류 발생: ${error.message}`);
        return false;
    }
}

/**
 * Cleans up any running Python processes when the application is quitting
 */
function cleanup() {
    if (pythonProcess) {
        console.log('Application quitting, terminating Python process');
        try {
            if (process.platform === 'win32') {
                const { execSync } = require('child_process');
                execSync(`taskkill /pid ${pythonProcess.pid} /T /F`);
            } else {
                pythonProcess.kill('SIGTERM');
            }
        } catch (error) {
            console.error('Error terminating Python process:', error);
        }
        pythonProcess = null;
    }
}

/**
 * Checks if a Python process is currently running
 * @returns {boolean} True if a process is running, false otherwise
 */
function isRunning() {
    return pythonProcess !== null;
}

module.exports = {
    runPythonScript,
    stopPythonScript,
    isRunning,
    cleanup
};