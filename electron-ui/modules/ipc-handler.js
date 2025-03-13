const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const { updateConfig } = require('./config-manager');
const { setupDevTools } = require('./window-manager');
const { runPythonScript, stopPythonScript } = require('./python-runner');

/**
 * Sets up all IPC event handlers
 * @param {BrowserWindow} mainWindow - The main window
 * @param {Object} config - The application configuration
 */
function setupIpcHandlers(mainWindow, config) {
    // 로그 저장 처리
    ipcMain.on('save-log', (event, logContent) => {
        console.log('Received save-log event with content length:', logContent.length);
        
        dialog.showSaveDialog(mainWindow, {
            title: '로그 파일 저장',
            defaultPath: `automation_log_${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.log`,
            filters: [
                { name: '로그 파일', extensions: ['log'] }
            ],
            properties: ['createDirectory']
        }).then(result => {
            console.log('Save dialog result:', result);
            if (!result.canceled && result.filePath) {
                try {
                    fs.writeFileSync(result.filePath, logContent, 'utf8');
                    console.log(`Log saved successfully to ${result.filePath}`);
                    mainWindow.webContents.send('log-saved', {
                        success: true,
                        path: result.filePath
                    });
                } catch (err) {
                    console.error('Error saving log file:', err);
                    mainWindow.webContents.send('log-saved', {
                        success: false,
                        error: err.message
                    });
                }
            } else {
                console.log('Save dialog was canceled or no path was selected');
            }
        }).catch(err => {
            console.error('로그 저장 대화상자 오류:', err);
            mainWindow.webContents.send('log-saved', {
                success: false,
                error: err.message
            });
        });
    });

    // 엑셀 경로 선택 처리
    ipcMain.on('select-excel-path', (event) => {
        console.log('Received select-excel-path event');
        
        dialog.showSaveDialog(mainWindow, {
            title: '엑셀 파일 저장 위치 선택',
            defaultPath: 'news_results.xlsx',
            filters: [
                { name: 'Excel 파일', extensions: ['xlsx'] }
            ],
            properties: ['createDirectory']
        }).then(result => {
            console.log('Dialog result:', result);
            if (!result.canceled && result.filePath) {
                console.log('Selected file path:', result.filePath);
                // 선택된 경로를 렌더러로 보내기
                mainWindow.webContents.send('excel-path-selected', result.filePath);
                
                // 설정 파일에 경로 저장
                updateConfig(config, 'excel_path', result.filePath);
            }
        }).catch(err => {
            console.error('Dialog error:', err);
        });
    });

    // 작업 중단 확인 대화상자 표시
    ipcMain.on('confirm-stop-automation', (event) => {
        console.log('작업 중단 확인 대화상자 표시 요청 받음');
        
        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: '작업 중단',
            message: '작업을 중단하시겠습니까?',
            detail: '진행 중인 작업이 즉시 종료됩니다.',
            buttons: ['예', '아니오'],
            defaultId: 1,  // 기본값은 '아니오'
            cancelId: 1,   // ESC를 누르면 '아니오'
            noLink: true   // 버튼을 명령형 문구로 표시
        }).then(result => {
            console.log('작업 중단 대화상자 응답:', result);
            
            // result.response: 0 = 예, 1 = 아니오
            const shouldStop = result.response === 0;
            
            // 렌더러에 응답 전송
            mainWindow.webContents.send('stop-automation-response', shouldStop);
        }).catch(err => {
            console.error('대화상자 오류:', err);
            // 오류가 발생해도 취소로 처리
            mainWindow.webContents.send('stop-automation-response', false);
        });
    });

    // Python 스크립트 실행
    ipcMain.on('run-automation', (event, data) => {
        console.log("이벤트 받음: ", data);
        runPythonScript(mainWindow, config, data);
    });

    // Python 스크립트 중지
    ipcMain.on('stop-automation', (event) => {
        console.log("작업 중지 명령 수신");
        stopPythonScript(mainWindow);
    });

    // 개발자 도구 토글
    ipcMain.on('toggle-dev-tools', (event, enabled) => {
        console.log(`Toggling dev tools: ${enabled}`);
        
        updateConfig(config, 'devToolsEnabled', enabled);
        
        // Update shortcuts immediately
        setupDevTools(enabled);
        
        // Send confirmation back to renderer
        mainWindow.webContents.send('dev-tools-toggled', enabled);
    });

    // 개발자 도구 열기
    ipcMain.on('open-dev-tools', (event) => {
        if (mainWindow) {
            mainWindow.webContents.openDevTools();
        }
    });

    // 윈도우 크기 조절 가능 여부 토글
    ipcMain.on('toggle-resizable', (event) => {
        if (mainWindow) {
            const isResizable = !mainWindow.isResizable();
            mainWindow.setResizable(isResizable);
            updateConfig(config, 'windowResizable', isResizable);
        }
    });
}

module.exports = {
    setupIpcHandlers
};