/**
 * Electron 애플리케이션 진입점 (main.js)
 * 
 * Windows 환경에 최적화된 Electron 애플리케이션의 메인 프로세스 정의
 */

// Electron 핵심 모듈 가져오기
const { app, BrowserWindow, childProcess } = require('electron');

// 애플리케이션 모듈 가져오기
const { loadConfig } = require('./modules/config-manager');
const { createMainWindow, cleanup: cleanupWindow } = require('./modules/window-manager');
const { cleanup: cleanupPython } = require('./modules/python-runner');
const { setupIpcHandlers } = require('./modules/ipc-handlers/ipc-handler');

// 애플리케이션 설정 로드
const config = loadConfig();

/**
 * 애플리케이션 초기화 함수
 * 
 * 메인 윈도우를 생성하고 IPC 통신 핸들러를 설정합니다.
 */
function initializeApp() {
    // 메인 윈도우 생성
    const mainWindow = createMainWindow(config);
    
    // IPC 통신 핸들러 설정
    setupIpcHandlers(mainWindow, config);
}

// 애플리케이션이 준비되면 초기화 함수 실행
app.whenReady().then(initializeApp);

/**
 * 모든 창이 닫혔을 때 애플리케이션 종료
 * 
 * Windows 환경에서는 모든 창이 닫히면 애플리케이션도 종료합니다.
 */
app.on('window-all-closed', () => {
    app.quit();
});

/**
 * 애플리케이션 종료 직전 윈도우 관련 리소스 정리
 */
app.on('will-quit', () => {
    cleanupWindow();
});

/**
 * 애플리케이션 종료 전 Python 프로세스 정리
 * 
 * 실행 중인 Python 스크립트를 안전하게 종료하고 리소스를 정리합니다.
 */
app.on('before-quit', () => {
    cleanupPython();
});