/**
 * IPC 로그 핸들러 모듈 (ipc-log-handler.js)
 * 
 * 이 모듈은 로그 파일 저장과 관련된 IPC 이벤트 핸들러를 정의합니다.
 * 
 * @module ipc-log-handler
 * @date 2025-03-14
 */

// 필요한 Electron 및 Node.js 모듈 가져오기
const { ipcMain, dialog } = require('electron');  // Electron의 IPC 및 대화상자 모듈
const fs = require('fs');                        // 파일 시스템 작업을 위한 모듈
const path = require('path');                    // 경로 처리를 위한 모듈

// 중앙 상수 모듈 가져오기
const constants = require('../../constants/export-constants');

/**
 * 로그 저장 및 대화상자 표시 공통 함수
 * 
 * 로그 저장 관련 이벤트에서 반복되는 코드를 분리한 내부 함수입니다.
 * 로그 저장 대화상자를 표시하고 결과에 따라 적절한 작업을 수행합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체
 * @param {string} logContent - 저장할 로그 내용
 * @example
 * // 함수 내부에서 호출 예시
 * saveLogWithDialog(mainWindow, '애플리케이션 로그 내용...');
 */
function saveLogWithDialog(mainWindow, logContent) {
    // 로그 내용 길이 확인 및 로깅
    console.log('로그 저장 처리, 내용 길이:', logContent.length);
    
    // 설정에서 로그 파일 프리픽스 가져오기 (기본값은 상수에서 가져옴)
    const logPrefix = constants.LOG_DEFAULTS.prefix;
    
    // 현재 날짜/시간으로 파일명 생성 (yyyy-MM-ddTHH-mm-ss 형식)
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    
    // 로그 저장 대화상자 표시
    dialog.showSaveDialog(mainWindow, {
        title: constants.DIALOG_STRINGS.LOG_SAVE_TITLE,  // 상수에서 대화상자 제목 가져오기
        defaultPath: `${logPrefix}${timestamp}.log`,  // 기본 파일명 설정
        filters: [
            { name: constants.DIALOG_STRINGS.LOG_FILE_TYPE, extensions: ['log'] }  // 파일 형식 필터
        ],
        properties: ['createDirectory']  // 필요시 디렉토리 생성 허용
    }).then(result => {
        // 대화상자 결과 로깅
        console.log('저장 대화상자 결과:', result);
        
        // 사용자가 파일 경로를 선택하고 취소하지 않았을 경우
        if (!result.canceled && result.filePath) {
            try {
                // 로그 저장 전 디렉토리 존재 확인 및 생성
                const logDir = path.dirname(result.filePath);
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                    console.log(`로그 디렉토리 생성됨: ${logDir}`);
                }
                
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
}

/**
 * 로그 저장 이벤트 핸들러
 * 
 * 'save-log' 이벤트를 수신하여 현재 로그 내용을 파일로 저장합니다.
 * 파일 저장 다이얼로그를 표시하고, 사용자가 선택한 위치에 로그를 저장합니다.
 * 
 * @param {Event} event - IPC 이벤트 객체
 * @param {string} logContent - 저장할 로그 내용
 * @example
 * // renderer.js에서 이벤트 발생 예시
 * ipcRenderer.send('save-log', '로그 내용...');
 */
function setupLogHandlers(mainWindow) {
    ipcMain.on('save-log', (event, logContent) => {
        // 공통 로그 저장 함수 호출
        saveLogWithDialog(mainWindow, logContent);
    });

    ipcMain.on('show-save-dialog', (event, logContent) => {
        // 공통 로그 저장 함수 호출 (중복 코드 제거)
        saveLogWithDialog(mainWindow, logContent);
    });
}

// 모듈 내보내기
module.exports = {
    setupLogHandlers  // 로그 저장 이벤트 핸들러 설정 함수
};