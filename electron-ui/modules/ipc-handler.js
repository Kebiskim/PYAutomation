/**
 * IPC 통신 핸들러 모듈 (ipc-handler.js)
 * 
 * 이 모듈은 메인 프로세스와 렌더러 프로세스(UI) 사이의 통신을 관리합니다.
 * 다양한 IPC 이벤트 핸들러를 설정하여 사용자 인터페이스의 동작에 따라 
 * 적절한 작업을 수행하고 결과를 UI로 전달합니다.
 * 
 * 주요 기능:
 * - 로그 파일 저장
 * - 엑셀 파일 경로 선택
 * - 자동화 작업 실행 및 중단
 * - 개발자 도구 관리
 * - 윈도우 속성 조정
 */

// 필요한 Electron 및 Node.js 모듈 가져오기
const { ipcMain, dialog } = require('electron');  // Electron의 IPC 및 대화상자 모듈
const fs = require('fs');                        // 파일 시스템 작업을 위한 모듈
const { updateConfig } = require('./config-manager');  // 설정 관리 모듈
const { setupDevTools } = require('./window-manager');  // 윈도우 관리 모듈
const { runPythonScript, stopPythonScript } = require('./python-runner');  // Python 스크립트 실행 모듈

/**
 * IPC 이벤트 핸들러 설정 함수
 * 
 * 애플리케이션에서 사용되는 모든 IPC 이벤트 핸들러를 등록하고 설정합니다.
 * 메인 윈도우 객체와 설정 객체를 전달받아 각 이벤트에 대한 처리 로직을 정의합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (UI 업데이트 및 대화상자 표시에 사용)
 * @param {Object} config - 애플리케이션 설정 객체 (환경설정 값 접근에 사용)
 */
function setupIpcHandlers(mainWindow, config) {
    /**
     * 로그 저장 이벤트 핸들러
     * 
     * 'save-log' 이벤트를 수신하여 현재 로그 내용을 파일로 저장합니다.
     * 파일 저장 다이얼로그를 표시하고, 사용자가 선택한 위치에 로그를 저장합니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     * @param {string} logContent - 저장할 로그 내용
     */
    ipcMain.on('save-log', (event, logContent) => {
        // 수신한 로그 내용의 길이를 콘솔에 기록
        console.log('로그 저장 이벤트 수신, 내용 길이:', logContent.length);
        
        // 설정에서 로그 파일 프리픽스 가져오기 (기본값은 'automation_log_')
        const logPrefix = config.logFilePrefix || 'automation_log_';
        
        // 저장 대화상자 표시
        dialog.showSaveDialog(mainWindow, {
            title: '로그 파일 저장',  // 대화상자 제목
            // 기본 파일명: 프리픽스 + 현재 날짜/시간
            defaultPath: `${logPrefix}${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.log`,
            filters: [
                { name: '로그 파일', extensions: ['log'] }  // 파일 형식 필터
            ],
            properties: ['createDirectory']  // 필요시 디렉토리 생성 허용
        }).then(result => {
            // 대화상자 결과 로깅
            console.log('저장 대화상자 결과:', result);
            
            // 사용자가 파일 경로를 선택하고 취소하지 않았을 경우
            if (!result.canceled && result.filePath) {
                try {
                    // 선택한 경로에 로그 내용 저장
                    fs.writeFileSync(result.filePath, logContent, 'utf8');
                    console.log(`로그가 ${result.filePath}에 저장되었습니다`);
                    
                    // 저장 성공 메시지를 UI에 전송
                    mainWindow.webContents.send('log-saved', {
                        success: true,
                        path: result.filePath  // 저장된 파일 경로
                    });
                } catch (err) {
                    // 파일 저장 중 오류 발생 시
                    console.error('로그 파일 저장 중 오류:', err);
                    
                    // 오류 메시지를 UI에 전송
                    mainWindow.webContents.send('log-saved', {
                        success: false,
                        error: err.message  // 오류 메시지
                    });
                }
            } else {
                // 사용자가 대화상자를 취소하거나 경로를 선택하지 않은 경우
                console.log('저장 대화상자가 취소되었거나 경로가 선택되지 않았습니다');
                
                // 저장 취소 이벤트를 UI에 전송
                mainWindow.webContents.send('log-save-canceled');
            }
        }).catch(err => {
            // 대화상자 표시 중 오류 발생 시
            console.error('로그 저장 대화상자 오류:', err);
            
            // 오류 메시지를 UI에 전송
            mainWindow.webContents.send('log-saved', {
                success: false,
                error: err.message  // 오류 메시지
            });
        });
    });

    /**
     * 로그 저장 대화상자 표시 이벤트 핸들러 (대체 방식)
     * 
     * 'show-save-dialog' 이벤트를 수신하여 로그 저장 대화상자를 표시합니다.
     * 기능적으로 'save-log' 이벤트와 유사하지만, 별도 이벤트로 구분되어 있습니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     * @param {string} logContent - 저장할 로그 내용
     */
    ipcMain.on('show-save-dialog', (event, logContent) => {
        console.log('저장 대화상자 표시 이벤트 수신, 내용 길이:', logContent.length);
        
        // 설정에서 로그 파일 프리픽스 가져오기 (기본값은 'automation_log_')
        const logPrefix = config.logFilePrefix || 'automation_log_';
        
        // 저장 대화상자 표시
        dialog.showSaveDialog(mainWindow, {
            title: '로그 파일 저장',
            defaultPath: `${logPrefix}${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.log`,
            filters: [
                { name: '로그 파일', extensions: ['log'] }
            ],
            properties: ['createDirectory']
        }).then(result => {
            console.log('저장 대화상자 결과:', result);
            
            if (!result.canceled && result.filePath) {
                try {
                    // 선택한 경로에 로그 내용 저장
                    fs.writeFileSync(result.filePath, logContent, 'utf8');
                    console.log(`로그가 ${result.filePath}에 저장되었습니다`);
                    
                    // 저장 성공 메시지를 UI에 전송
                    mainWindow.webContents.send('log-saved', {
                        success: true,
                        path: result.filePath
                    });
                } catch (err) {
                    // 파일 저장 중 오류 발생 시
                    console.error('로그 파일 저장 중 오류:', err);
                    
                    // 오류 메시지를 UI에 전송
                    mainWindow.webContents.send('log-saved', {
                        success: false,
                        error: err.message
                    });
                }
            } else {
                // 사용자가 대화상자를 취소하거나 경로를 선택하지 않은 경우
                console.log('저장 대화상자가 취소되었거나 경로가 선택되지 않았습니다');
                
                // 저장 취소 이벤트를 UI에 전송
                mainWindow.webContents.send('log-save-canceled');
            }
        }).catch(err => {
            // 대화상자 표시 중 오류 발생 시
            console.error('로그 저장 대화상자 오류:', err);
            
            // 오류 메시지를 UI에 전송
            mainWindow.webContents.send('log-saved', {
                success: false,
                error: err.message
            });
        });
    });

    /**
     * 엑셀 파일 저장 경로 선택 이벤트 핸들러
     * 
     * 'select-excel-path' 이벤트를 수신하여 엑셀 파일 저장 위치를 선택하기 위한
     * 파일 대화상자를 표시합니다. 선택된 경로는 설정에 저장되고 UI로 전달됩니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     */
    ipcMain.on('select-excel-path', (event) => {
        console.log('엑셀 경로 선택 이벤트 수신');
        
        // 파일 저장 대화상자 표시
        dialog.showSaveDialog(mainWindow, {
            title: '엑셀 파일 저장 위치 선택',
            defaultPath: 'news_results.xlsx',  // 기본 파일명
            filters: [
                { name: 'Excel 파일', extensions: ['xlsx'] }  // Excel 파일 형식 필터
            ],
            properties: ['createDirectory']  // 필요시 디렉토리 생성 허용
        }).then(result => {
            // 대화상자 결과 로깅
            console.log('대화상자 결과:', result);
            
            // 사용자가 파일 경로를 선택하고 취소하지 않았을 경우
            if (!result.canceled && result.filePath) {
                console.log('선택된 파일 경로:', result.filePath);
                
                // 선택된 경로를 UI로 전송
                mainWindow.webContents.send('excel-path-selected', result.filePath);
                
                // 선택된 경로를 설정 파일에 저장
                updateConfig(config, 'excel_path', result.filePath);
            }
        }).catch(err => {
            // 대화상자 표시 중 오류 발생 시
            console.error('대화상자 오류:', err);
        });
    });

    /**
     * 작업 중단 확인 대화상자 표시 이벤트 핸들러
     * 
     * 'confirm-stop-automation' 이벤트를 수신하여 사용자에게
     * 작업 중단을 확인하는 메시지 대화상자를 표시합니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     */
    ipcMain.on('confirm-stop-automation', (event) => {
        console.log('작업 중단 확인 대화상자 표시 요청 받음');
        
        // 확인 메시지 대화상자 표시
        dialog.showMessageBox(mainWindow, {
            type: 'question',           // 질문 유형 대화상자
            title: '작업 중단',         // 대화상자 제목
            message: '작업을 중단하시겠습니까?',  // 주요 메시지
            detail: '진행 중인 작업이 즉시 종료됩니다.',  // 상세 설명
            buttons: ['예', '아니오'],  // 버튼 옵션
            defaultId: 1,               // 기본 선택: '아니오'
            cancelId: 1,                // ESC 키 누를 경우: '아니오'
            noLink: true                // 버튼을 명령형 문구로 표시
        }).then(result => {
            // 대화상자 응답 로깅
            console.log('작업 중단 대화상자 응답:', result);
            
            // result.response: 0 = '예', 1 = '아니오'
            const shouldStop = result.response === 0;
            
            // 사용자 선택 결과를 UI로 전송
            mainWindow.webContents.send('stop-automation-response', shouldStop);
        }).catch(err => {
            // 대화상자 표시 중 오류 발생 시
            console.error('대화상자 오류:', err);
            
            // 오류 발생 시 기본적으로 작업 중단 취소 처리
            mainWindow.webContents.send('stop-automation-response', false);
        });
    });

    /**
     * Python 자동화 스크립트 실행 이벤트 핸들러
     * 
     * 'run-automation' 이벤트를 수신하여 Python 스크립트를 실행합니다.
     * 키워드와 엑셀 저장 경로 등의 설정을 Python 스크립트에 전달합니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     * @param {Object} data - 스크립트 실행에 필요한 데이터 (키워드, 엑셀 경로 등)
     */
    ipcMain.on('run-automation', (event, data) => {
        console.log("자동화 실행 이벤트 수신:", data);
        
        // Python 스크립트 실행 함수 호출
        runPythonScript(mainWindow, config, data);
    });

    /**
     * Python 자동화 스크립트 중지 이벤트 핸들러
     * 
     * 'stop-automation' 이벤트를 수신하여 실행 중인 Python 스크립트를 중지합니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     */
    ipcMain.on('stop-automation', (event) => {
        console.log("작업 중지 명령 수신");
        
        // Python 스크립트 중지 함수 호출
        stopPythonScript(mainWindow);
    });

    /**
     * 개발자 도구 토글 이벤트 핸들러
     * 
     * 'toggle-dev-tools' 이벤트를 수신하여 개발자 도구 활성화 상태를 변경합니다.
     * 변경된 설정은 설정 파일에 저장됩니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     * @param {boolean} enabled - 개발자 도구 활성화 여부
     */
    ipcMain.on('toggle-dev-tools', (event, enabled) => {
        console.log(`개발자 도구 토글: ${enabled}`);
        
        // 설정 파일에 개발자 도구 활성화 상태 저장
        updateConfig(config, 'devToolsEnabled', enabled);
        
        // 개발자 도구 단축키 즉시 설정 업데이트
        setupDevTools(enabled);
        
        // 설정 변경 확인 메시지를 UI로 전송
        mainWindow.webContents.send('dev-tools-toggled', enabled);
    });

    /**
     * 개발자 도구 열기 이벤트 핸들러
     * 
     * 'open-dev-tools' 이벤트를 수신하여 즉시 개발자 도구 창을 엽니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     */
    ipcMain.on('open-dev-tools', (event) => {
        // 메인 윈도우가 유효한 경우에만 개발자 도구 열기
        if (mainWindow) {
            mainWindow.webContents.openDevTools();
        }
    });

    /**
     * 윈도우 크기 조절 가능 여부 토글 이벤트 핸들러
     * 
     * 'toggle-resizable' 이벤트를 수신하여 애플리케이션 창의 크기 조절 가능 상태를 변경합니다.
     * 변경된 설정은 설정 파일에 저장됩니다.
     * 
     * @param {Event} event - IPC 이벤트 객체
     */
    ipcMain.on('toggle-resizable', (event) => {
        // 메인 윈도우가 유효한 경우에만 설정 변경
        if (mainWindow) {
            // 현재 설정의 반대 값으로 토글
            const isResizable = !mainWindow.isResizable();
            
            // 윈도우 크기 조절 가능 속성 설정
            mainWindow.setResizable(isResizable);
            
            // 설정 파일에 변경사항 저장
            updateConfig(config, 'windowResizable', isResizable);
        }
    });
}

/**
 * 모듈 내보내기
 * 
 * 다른 파일에서 이 모듈의 함수를 사용할 수 있도록 내보냅니다.
 */
module.exports = {
    setupIpcHandlers  // IPC 이벤트 핸들러 설정 함수
};