/**
 * 애플리케이션 메뉴바 관리 모듈 (menubar.js)
 * 
 * 이 모듈은 애플리케이션의 메뉴바를 생성하고 관리하는 기능을 담당합니다.
 * '파일', '보기', '정보', '도움말' 등의 메뉴 항목과 각 항목에 대한 동작을 정의합니다.
 */

// 필요한 Electron 모듈 가져오기
const { Menu, dialog, app, shell } = require('electron');  // 메뉴, 대화상자, 앱 제어, 외부 링크 열기 기능
const { updateConfig } = require('./config-manager');     // 설정 관리 모듈
const path = require('path');                            // 경로 관리를 위한 모듈
const fs = require('fs');                               // 파일 시스템 접근을 위한 모듈

/**
 * package.json 파일에서 애플리케이션 정보를 읽어오는 함수
 * 
 * 프로젝트 루트 디렉토리의 package.json 파일을 읽고 파싱하여
 * 애플리케이션 이름, 버전 등의 정보를 추출합니다.
 * 
 * @returns {Object} 애플리케이션 정보 객체 ({name, version, description, author} 등)
 * @example
 * // 반환값 예시: 
 * // {
 * //   name: "뉴스 크롤링 프로그램", // package.json의 name 필드 값
 * //   version: "1.0.0",         // package.json의 version 필드 값
 * //   description: "",          // package.json의 description 필드 값(없으면 빈 문자열)
 * //   author: ""                // package.json의 author 필드 값(없으면 빈 문자열)
 * // }
 */
function getAppInfo() {
    // 기본값 설정 - package.json 읽기 실패 시 사용할 기본 애플리케이션 정보
    // 애플리케이션의 일관된 정보 제공을 위해 사용됩니다.
    const defaultAppInfo = {
        name: '뉴스 크롤링 프로그램',  // 기본 애플리케이션 이름
        version: '1.0.0',           // 기본 버전 문자열
        description: '',            // 기본 설명 (빈 문자열)
        author: ''                  // 기본 저작자 정보 (빈 문자열)
    };
    
    try {
        // package.json 파일 경로 설정 (상위 디렉토리의 package.json)
        // __dirname: 현재 실행 중인 스크립트 파일의 디렉토리 경로
        // '..': 상위 디렉토리로 이동 (electron-ui 폴더의 상위 디렉토리인 프로젝트 루트)
        // path.join(): 플랫폼 독립적인 방식으로 경로 문자열을 결합
        const packagePath = path.join(__dirname, '..', '..', 'package.json');
        
        // package.json 파일 읽기 및 파싱
        // fs.readFileSync(): 파일을 동기적으로 읽어오는 메서드
        // 'utf8': 파일 인코딩 방식 지정
        // JSON.parse(): 문자열을 JSON 객체로 변환
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // console.log로 파일 경로와 읽어온 데이터 확인 (디버깅 목적)
        console.log('package.json 경로:', packagePath);
        console.log('package.json 데이터:', packageData);
        
        // 필요한 정보 반환 (package.json에서 값을 가져오거나 기본값 사용)
        // || 연산자: 좌측 값이 falsy(undefined, null 등)일 경우 우측 값을 사용
        return {
            name: packageData.name || defaultAppInfo.name,             // 앱 이름
            version: packageData.version || defaultAppInfo.version,     // 앱 버전
            description: packageData.description || defaultAppInfo.description, // 앱 설명
            author: packageData.author || defaultAppInfo.author         // 앱 제작자
        };
    } catch (error) {
        // 파일 읽기 실패 시 오류 로깅 및 기본값 반환
        // 파일이 없거나, 권한이 없거나, JSON 파싱에 실패한 경우 등
        console.error('package.json 읽기 오류 발생:', error);
        console.error('오류 발생 위치:', error.stack);
        
        // 위에서 정의한 기본값 객체를 반환
        // 이렇게 함으로써 앱이 정상 작동할 수 있도록 합니다.
        return defaultAppInfo;
    }
}

/**
 * 애플리케이션 메뉴바 생성 함수
 * 
 * 설정 객체를 기반으로 애플리케이션의 메뉴바를 생성하고 설정합니다.
 * 각 메뉴 항목의 레이블, 단축키, 클릭 이벤트 등을 정의합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (메뉴 동작에 필요한 창 참조)
 * @param {Object} config - 애플리케이션 설정 객체 (메뉴 상태 설정에 사용)
 * @returns {Menu} 생성된 메뉴 객체
 */
function createApplicationMenu(mainWindow, config) {
    // 설정에서 개발자 도구 활성화 여부 가져오기 (기본값: false)
    const devToolsEnabled = config.devToolsEnabled !== undefined ? config.devToolsEnabled : false;
    
    // package.json에서 앱 정보 가져오기
    const appInfo = getAppInfo();
    
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
                        // 정보 대화상자 표시
                        dialog.showMessageBox({
                            title: '프로그램 정보',  // 대화상자 제목
                            message: appInfo.name,  // package.json에서 가져온 앱 이름
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
    const menu = Menu.buildFromTemplate(template);
    
    // 생성된 메뉴를 애플리케이션의 메뉴바로 설정
    Menu.setApplicationMenu(menu);
    
    // 생성된 메뉴 객체 반환 (필요시 추가 조작을 위해)
    return menu;
}

/**
 * 모듈 내보내기
 * 
 * 다른 파일에서 이 모듈의 함수를 사용할 수 있도록 내보냅니다.
 */
module.exports = {
    createApplicationMenu  // 애플리케이션 메뉴바 생성 함수
};