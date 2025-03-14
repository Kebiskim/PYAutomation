/**
 * 자동화 핸들러 모듈 (automation-handler.js)
 * 
 * 이 모듈은 자동화 작업 실행 및 중단과 관련된 IPC 이벤트를 처리합니다.
 * Python 스크립트를 실행하고 중단하는 기능을 제공합니다.
 * 
 * @module automation-handler
 * @date 2025-03-14
 */

// 필요한 Electron 및 Node.js 모듈 가져오기
const { ipcMain } = require('electron');  // Electron의 IPC 모듈

// 중앙 상수 모듈 가져오기
const constants = require('../../constants/export-constants');
const { runPythonScript, stopPythonScript } = require('../python-runner');  // Python 스크립트 실행 모듈

/**
 * 자동화 작업 실행 및 중단 이벤트 핸들러 설정 함수
 * 
 * 'run-automation' 및 'stop-automation' 이벤트를 처리하는 핸들러를 설정합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (UI 업데이트 및 대화상자 표시에 사용)
 * @param {Object} config - 애플리케이션 설정 객체 (환경설정 값 접근에 사용)
 */
function setupAutomationHandlers(mainWindow, config) {
    // Python 자동화 스크립트 실행 이벤트 핸들러
    ipcMain.on('run-automation', (event, data) => {
        console.log("자동화 실행 이벤트 수신:", data);
        
        // 데이터 유효성 검증
        if (!data || !data.excelPath) {
            console.error("유효하지 않은 데이터: 엑셀 경로가 누락되었습니다");
            mainWindow.webContents.send('automation-error', {
                message: constants.ERROR_MESSAGES.INVALID_EXCEL_PATH || "유효한 엑셀 경로를 지정해주세요."
            });
            return;
        }
        
        // Python 스크립트 실행 함수 호출
        runPythonScript(mainWindow, config, data);
    });

    // Python 자동화 스크립트 중지 이벤트 핸들러
    ipcMain.on('stop-automation', (event) => {
        console.log("작업 중지 명령 수신");
        
        // Python 스크립트 중지 함수 호출
        stopPythonScript(mainWindow);
    });
}

// 모듈 내보내기
module.exports = {
    setupAutomationHandlers  // 자동화 작업 실행 및 중단 이벤트 핸들러 설정 함수
};