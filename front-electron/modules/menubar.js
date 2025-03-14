/**
 * 애플리케이션 메뉴바 관리 모듈 (menubar.js)
 * 
 * 이 모듈은 애플리케이션의 메뉴바를 생성하고 관리하는 기능을 담당합니다.
 * '파일', '보기', '정보', '도움말' 등의 메뉴 항목과 각 항목에 대한 동작을 정의합니다.
 * 메뉴바는 사용자가 애플리케이션의 다양한 기능을 쉽게 접근하고 사용할 수 있게 합니다.
 * 
 * @module menubar
 * @author 개발팀
 * @date 2025-03-14
 */

// 필요한 Electron 모듈 가져오기
const { Menu, dialog, app, shell } = require('electron');  // 메뉴, 대화상자, 앱 제어, 외부 링크 열기 기능
const { updateConfig } = require('./config-manager');     // 설정 관리 모듈에서 설정 업데이트 함수 가져오기

// 중앙 상수 모듈에서 필요한 함수와 상수 가져오기
const constants = require('../constants/export-constants');

/**
 * 애플리케이션 메뉴바 생성 함수
 * 
 * 설정 객체를 기반으로 애플리케이션의 메뉴바를 생성하고 설정합니다.
 * 각 메뉴 항목의 레이블, 단축키, 클릭 이벤트 등을 정의합니다.
 * 이 함수는 애플리케이션이 시작될 때 호출되어 메뉴바를 초기화합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (메뉴 동작에 필요한 창 참조)
 * @param {Object} config - 애플리케이션 설정 객체 (메뉴 상태 설정에 사용)
 * @returns {Menu} 생성된 메뉴 객체 - 추가 조작이 필요할 경우 반환
 * @example
 * // 함수 사용 예시:
 * const mainWindow = new BrowserWindow({ ... });
 * const config = loadConfig();
 * const appMenu = createApplicationMenu(mainWindow, config);
 */
function createApplicationMenu(mainWindow, config) {
    // 설정에서 개발자 도구 활성화 여부 가져오기 (기본값: false)
    // config 객체에 devToolsEnabled 속성이 없을 경우 기본값으로 false 사용
    const devToolsEnabled = config.devToolsEnabled !== undefined ? 
        config.devToolsEnabled : constants.UI_CONFIG.devTools.enabled;
    
    // constants 모듈에서 앱 정보 가져오기 
    // 이전에 직접 구현했던 getAppInfo 함수 대신 중앙화된 함수 사용
    const appInfo = constants.getAppInfo();
    
    // 메뉴 템플릿 정의 (메뉴 구조와 동작을 설명하는 객체 배열)
    const template = [
        /**
         * '파일' 메뉴 - 앱 기본 동작 관련 항목
         * 애플리케이션 종료 등의 기능을 포함합니다.
         */
        {
            label: '파일',  // 메뉴 레이블
            submenu: [     // 하위 메뉴 항목
                { 
                    label: '닫기',  // 하위 메뉴 레이블
                    accelerator: 'CmdOrCtrl+Q',  // 단축키 (Windows/Mac 호환)
                    click: () => app.quit()      // 클릭 시 앱 종료
                }
            ]
        },
        
        /**
         * '보기' 메뉴 - 화면 표시 관련 항목
         * 윈도우 크기 조절, 개발자 도구 등의 기능을 포함합니다.
         */
        {
            label: '보기',
            submenu: [
                { 
                    label: '최대화',  // 윈도우 최대화/복원 토글
                    click: () => {
                        // 현재 최대화 상태가 아니면 최대화, 이미 최대화 상태면 원래 크기로 복원
                        if (!mainWindow.isMaximized()) {
                            mainWindow.maximize();  // 윈도우 최대화
                        } else {
                            mainWindow.unmaximize(); // 윈도우 원래 크기로 복원
                        }
                    }
                },
                { 
                    label: '최소화',  // 윈도우 최소화
                    accelerator: 'CmdOrCtrl+M',  // 단축키 (Windows/Mac 호환)
                    click: () => mainWindow.minimize() // 윈도우 최소화
                },
                { type: 'separator' },  // 메뉴 구분선 추가
                {
                    label: '개발자 도구',  // 개발자 도구 토글
                    type: 'checkbox',     // 체크박스 형태로 표시
                    checked: devToolsEnabled,  // 초기 체크 상태 (설정값에 따라)
                    click: () => {
                        // 현재 설정의 반대 값으로 토글
                        const newState = !config.devToolsEnabled;
                        // UI에 토글 이벤트 전송 (IPC 통신)
                        mainWindow.webContents.send('toggle-dev-tools', newState);
                        
                        // 변경된 설정 저장 (config-manager 모듈의 updateConfig 함수 사용)
                        updateConfig(config, 'devToolsEnabled', newState);
                    }
                }
            ]
        },
        
        /**
         * '정보' 메뉴 - 앱 정보 관련 항목
         * 버전 정보, 저작권 등을 표시합니다.
         */
        {
            label: '정보',
            submenu: [
                {
                    label: '버전 정보',  // 버전 정보 표시
                    click: () => {
                        // 정보 대화상자 표시 - 앱 이름, 버전, 설명, 제작자 정보 포함
                        dialog.showMessageBox({
                            title: '프로그램 정보',  // 대화상자 제목
                            message: appInfo.name,  // constants에서 가져온 앱 이름 
                            detail: `버전: ${appInfo.version}\n${appInfo.description ? appInfo.description + '\n' : ''}©2025 ${appInfo.author || 'All Rights Reserved'}`  // 상세 정보
                        });
                    }
                }
            ]
        },
        
        /**
         * '도움말' 메뉴 - 지원 및 문의 관련 항목
         * 이메일 문의, 도움말 등을 제공합니다.
         */
        {
            label: '도움말',
            submenu: [
                {
                    label: '문의하기: kebikim@kakao.com',  // 이메일 문의 항목
                    click: () => {
                        // 기본 메일 클라이언트를 통해 이메일 작성 창 열기
                        shell.openExternal('mailto:kebikim@kakao.com');
                    }
                }
            ]
        }
    ];
    
    // 템플릿으로부터 메뉴 객체 생성
    // Menu.buildFromTemplate(): 메뉴 템플릿 배열을 기반으로 실제 메뉴 객체 생성
    const menu = Menu.buildFromTemplate(template);
    
    // 생성된 메뉴를 애플리케이션의 메뉴바로 설정
    // Menu.setApplicationMenu(): 애플리케이션의 메인 메뉴로 설정
    Menu.setApplicationMenu(menu);
    
    // 생성된 메뉴 객체 반환 (필요시 추가 조작을 위해)
    return menu;
}

/**
 * 모듈 내보내기
 * 
 * 다른 파일에서 이 모듈의 함수를 사용할 수 있도록 내보냅니다.
 * module.exports는 이 파일에서 외부로 공개할 기능을 정의합니다.
 */
module.exports = {
    createApplicationMenu  // 애플리케이션 메뉴바 생성 함수
};