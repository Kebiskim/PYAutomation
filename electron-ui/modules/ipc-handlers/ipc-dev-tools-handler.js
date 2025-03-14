/**
 * 개발자 도구 핸들러 모듈 (dev-tools-handler.js)
 * 
 * 이 모듈은 개발자 도구와 관련된 IPC 이벤트를 처리합니다.
 * 개발자 도구를 열고 닫는 기능을 제공합니다.
 * 
 * @module dev-tools-handler
 * @date 2025-03-14
 */

// 필요한 Electron 모듈 가져오기
const { ipcMain } = require('electron');  // Electron의 IPC 모듈

// 중앙 상수 모듈 가져오기
const constants = require('../../constants/export-constants');
const { updateConfig } = require('../config-manager');  // 설정 관리 모듈
const { setupDevTools } = require('../window-manager');  // 윈도우 관리 모듈

/**
 * 개발자 도구 관련 이벤트 핸들러 설정 함수
 * 
 * 'toggle-dev-tools' 및 'open-dev-tools' 이벤트를 처리하는 핸들러를 설정합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (UI 업데이트 및 대화상자 표시에 사용)
 * @param {Object} config - 애플리케이션 설정 객체 (환경설정 값 접근에 사용)
 */
function setupDevToolsHandlers(mainWindow, config) {
    // 개발자 도구 토글 이벤트 핸들러
    ipcMain.on('toggle-dev-tools', (event, enabled) => {
        console.log(`개발자 도구 토글: ${enabled}`);
        
        // 설정 파일에 개발자 도구 활성화 상태 저장
        updateConfig(config, constants.CONFIG_KEYS.DEV_TOOLS_ENABLED || 'devToolsEnabled', enabled);
        
        // 개발자 도구 단축키 즉시 설정 업데이트
        setupDevTools(enabled);
        
        // 설정 변경 확인 메시지를 UI로 전송
        mainWindow.webContents.send('dev-tools-toggled', enabled);
    });

    // 개발자 도구 열기 이벤트 핸들러
    ipcMain.on('open-dev-tools', (event) => {
        // 메인 윈도우가 유효한 경우에만 개발자 도구 열기
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.openDevTools();
            console.log("개발자 도구가 열렸습니다");
        } else {
            console.error("개발자 도구를 열 수 없습니다: 유효하지 않은 윈도우");
        }
    });
}

// 모듈 내보내기
module.exports = {
    setupDevToolsHandlers  // 개발자 도구 관련 이벤트 핸들러 설정 함수
};