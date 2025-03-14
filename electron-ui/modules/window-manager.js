/**
 * 윈도우 관리 모듈 (window-manager.js)
 * 
 * 이 모듈은 애플리케이션의 메인 윈도우를 생성하고 관리하는 기능을 담당합니다.
 * 윈도우 크기, 개발자 도구, 리사이징 옵션 등 윈도우 관련 속성을 설정하고 제어합니다.
 */

// 필요한 Electron 모듈 가져오기
const { BrowserWindow, globalShortcut } = require('electron');  // Electron 창과 전역 단축키 모듈
const path = require('path');                                  // 파일 경로 처리 모듈
const { updateConfig } = require('./config-manager');          // 설정 관리 모듈
const { createApplicationMenu } = require('./menubar');        // 애플리케이션 메뉴바 생성 모듈

// 메인 윈도우 인스턴스를 저장하기 위한 변수
// null로 초기화하여 윈도우가 생성되지 않은 상태를 표시
let mainWindow = null;

/**
 * 애플리케이션 메인 윈도우 생성 함수
 * 
 * 설정 객체를 기반으로 애플리케이션의 메인 윈도우를 생성하고 설정합니다.
 * 윈도우 크기, 리사이징 가능 여부, 개발자 도구 활성화 여부 등을 설정합니다.
 * 
 * @param {Object} config - 애플리케이션 설정 객체
 * @returns {BrowserWindow} 생성된 메인 윈도우 객체
 */
function createMainWindow(config) {
    // 설정에서 윈도우 크기와 옵션을 가져오거나 기본값 사용
    const windowWidth = config.windowWidth || 1200;            // 창 너비 (기본값: 1200px)
    const windowHeight = config.windowHeight || 800;           // 창 높이 (기본값: 800px)
    const windowResizable = config.windowResizable !== undefined ? config.windowResizable : false;  // 창 크기 조절 가능 여부 (기본값: false)
    const devToolsEnabled = config.devToolsEnabled !== undefined ? config.devToolsEnabled : false;  // 개발자 도구 활성화 여부 (기본값: false)
    
    // 윈도우 생성 정보 로깅
    console.log(`윈도우 생성 - 크기: ${windowWidth}x${windowHeight}, 크기조절: ${windowResizable}, 개발자도구: ${devToolsEnabled}`);
    
    // 메인 윈도우 생성 및 설정
    mainWindow = new BrowserWindow({
        width: windowWidth,       // 창 너비 설정
        height: windowHeight,     // 창 높이 설정
        resizable: windowResizable, // 창 크기 조절 가능 여부
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload.js'),  // 사전 로드 스크립트 경로
            nodeIntegration: false,  // Node.js 통합 비활성화 (보안 강화)
            contextIsolation: true,  // 컨텍스트 격리 활성화 (보안 강화)
            devTools: true // 개발자 도구는 항상 가능하도록 설정 (단축키로 제어)
        }
    });

    // 애플리케이션 메뉴 생성 및 설정
    createApplicationMenu(mainWindow, config);

    // 개발자 도구 단축키 설정
    setupDevTools(devToolsEnabled);

    // 창 크기 조절이 가능한 경우에만 크기 변경 이벤트 처리
    if (windowResizable) {
        // 창 크기가 조절되는 중에 발생하는 이벤트
        mainWindow.on('resize', () => {
            // 현재 창의 크기 정보 가져오기
            const { width, height } = mainWindow.getBounds();
            
            // 설정 객체에 현재 창 크기 저장 (메모리상)
            config.windowWidth = width;
            config.windowHeight = height;
            // 크기 조절 중에는 설정 파일에 즉시 저장하지 않음 (과도한 디스크 쓰기 방지)
        });
        
        // 창 크기 조절이 완료된 후 발생하는 이벤트
        mainWindow.on('resized', () => {
            // 최종 창 크기 정보 가져오기
            const { width, height } = mainWindow.getBounds();
            
            // 설정 파일에 최종 창 크기 저장
            updateConfig(config, 'windowWidth', width);
            updateConfig(config, 'windowHeight', height);
        });
    }

    // 메인 HTML 파일 로드
    // __dirname: 현재 스크립트 경로
    // '..': 상위 디렉토리 (modules -> electron-ui)
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    
    // 생성된 메인 윈도우 객체 반환
    return mainWindow;
}

/**
 * 개발자 도구 단축키 설정 함수
 * 
 * 개발자 도구 활성화 상태에 따라 관련 단축키를 설정하거나 비활성화합니다.
 * F12 및 Ctrl+Shift+I 단축키를 통해 개발자 도구를 토글할 수 있습니다.
 * 
 * @param {boolean} enabled - 개발자 도구 활성화 여부
 */
function setupDevTools(enabled) {
    // 중복 등록 방지를 위해 먼저 모든 단축키 해제
    globalShortcut.unregisterAll();
    
    // 개발자 도구가 활성화된 경우에만 단축키 등록
    if (enabled) {
        // F12 키를 개발자 도구 토글 단축키로 등록
        globalShortcut.register('F12', () => {
            // 메인 윈도우가 유효한 경우에만 동작
            if (mainWindow) {
                // 개발자 도구 표시/숨김 토글
                mainWindow.webContents.toggleDevTools();
            }
        });
        
        // Ctrl+Shift+I(Windows/Linux) 또는 Cmd+Shift+I(Mac) 단축키 등록
        globalShortcut.register('CommandOrControl+Shift+I', () => {
            // 메인 윈도우가 유효한 경우에만 동작
            if (mainWindow) {
                // 개발자 도구 표시/숨김 토글
                mainWindow.webContents.toggleDevTools();
            }
        });
        
        // 개발자 도구 단축키 활성화 로그 출력
        console.log('개발자 도구 단축키가 활성화되었습니다');
    } else {
        // 개발자 도구 단축키 비활성화 로그 출력
        console.log('개발자 도구 단축키가 비활성화되었습니다');
    }
}

/**
 * 메인 윈도우 객체 반환 함수
 * 
 * 현재 생성된 메인 윈도우 객체를 반환합니다.
 * 윈도우가 생성되지 않은 경우 null을 반환합니다.
 * 
 * @returns {BrowserWindow|null} 메인 윈도우 객체 또는 null
 */
function getMainWindow() {
    // 현재 메인 윈도우 인스턴스 반환
    return mainWindow;
}

/**
 * 리소스 정리 함수
 * 
 * 애플리케이션이 종료될 때 등록된 단축키 등의 리소스를 정리합니다.
 * 이 함수는 애플리케이션 종료 과정에서 호출되어야 합니다.
 */
function cleanup() {
    // 등록된 모든 전역 단축키 해제
    globalShortcut.unregisterAll();
}

/**
 * 모듈 내보내기
 * 
 * 다른 파일에서 이 모듈의 함수들을 사용할 수 있도록 내보냅니다.
 */
module.exports = {
    createMainWindow,  // 메인 윈도우 생성 함수
    getMainWindow,     // 메인 윈도우 객체 반환 함수
    setupDevTools,     // 개발자 도구 단축키 설정 함수
    cleanup            // 리소스 정리 함수
};