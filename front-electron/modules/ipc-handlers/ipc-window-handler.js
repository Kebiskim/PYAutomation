/**
 * 윈도우 핸들러 모듈 (window-handler.js)
 * 
 * 이 모듈은 윈도우 속성 조정과 관련된 IPC 이벤트를 처리합니다.
 * 윈도우 크기 조절 가능 여부를 토글하는 기능을 제공합니다.
 * 
 * @module window-handler
 * @date 2025-03-14
 */

// 필요한 Electron 모듈 가져오기
const { ipcMain } = require('electron');  // Electron의 IPC 모듈

// 중앙 상수 모듈 가져오기
const constants = require('../../constants/export-constants');
const { updateConfig } = require('../config-manager');  // 설정 관리 모듈

/**
 * 윈도우 속성 조정 이벤트 핸들러 설정 함수
 * 
 * 'toggle-resizable' 이벤트를 처리하는 핸들러를 설정합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (UI 업데이트 및 대화상자 표시에 사용)
 * @param {Object} config - 애플리케이션 설정 객체 (환경설정 값 접근에 사용)
 */
function setupWindowHandlers(mainWindow, config) {
    // 윈도우 크기 조절 가능 여부 토글 이벤트 핸들러
    ipcMain.on('toggle-resizable', (event) => {
        // 메인 윈도우가 유효한 경우에만 설정 변경
        if (mainWindow) {
            // 현재 설정의 반대 값으로 토글
            const isResizable = !mainWindow.isResizable();
            
            // 윈도우 크기 조절 가능 속성 설정
            mainWindow.setResizable(isResizable);
            
            // 설정 파일에 변경사항 저장
            updateConfig(config, constants.CONFIG_KEYS.WINDOW_RESIZABLE || 'windowResizable', isResizable);
            
            // 상태 변경 로깅
            console.log(`윈도우 크기 조절 가능 상태 변경: ${isResizable ? '가능' : '불가능'}`);
            
            // 변경된 상태를 UI에 알림 (필요한 경우)
            mainWindow.webContents.send('resizable-changed', isResizable);
        }
    });
}

// 모듈 내보내기
module.exports = {
    setupWindowHandlers  // 윈도우 속성 조정 이벤트 핸들러 설정 함수
};