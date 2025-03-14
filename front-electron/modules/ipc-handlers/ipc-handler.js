/**
 * IPC 통신 핸들러 모듈 (ipc-handler.js)
 * 
 * 이 모듈은 메인 프로세스와 렌더러 프로세스(UI) 사이의 통신을 관리합니다.
 * 다양한 IPC 이벤트 핸들러를 설정하여 사용자 인터페이스의 동작에 따라 
 * 적절한 작업을 수행하고 결과를 UI로 전달합니다.
 * 
 * @module ipc-handler
 * @date 2025-03-14
 */

// 필요한 핸들러 모듈 가져오기
const { setupLogHandlers } = require('./ipc-log-handler');
const { setupExcelHandlers } = require('./ipc-excel-handler');
const { setupAutomationHandlers } = require('./ipc-automation-handler');
const { setupDevToolsHandlers } = require('./ipc-dev-tools-handler');
const { setupWindowHandlers } = require('./ipc-window-handler');

/**
 * IPC 이벤트 핸들러 설정 함수
 * 
 * 애플리케이션에서 사용되는 모든 IPC 이벤트 핸들러를 등록하고 설정합니다.
 * 메인 윈도우 객체와 설정 객체를 전달받아 각 이벤트에 대한 처리 로직을 정의합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (UI 업데이트 및 대화상자 표시에 사용)
 * @param {Object} config - 애플리케이션 설정 객체 (환경설정 값 접근에 사용)
 * @example
 * // main.js에서 함수 호출 예시
 * const mainWindow = new BrowserWindow({ width: 1200, height: 800 });
 * const config = loadConfig();
 * setupIpcHandlers(mainWindow, config);
 * // 이후 IPC 이벤트가 발생하면 정의된 핸들러가 자동으로 처리함
 */
function setupIpcHandlers(mainWindow, config) {
    setupLogHandlers(mainWindow);
    setupExcelHandlers(mainWindow, config);
    setupAutomationHandlers(mainWindow, config);
    setupDevToolsHandlers(mainWindow, config);
    setupWindowHandlers(mainWindow);
}

// 모듈 내보내기
module.exports = {
    setupIpcHandlers  // IPC 이벤트 핸들러 설정 함수
};