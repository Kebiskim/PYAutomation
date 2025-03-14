/**
 * 설정 관리 모듈 (config-manager.js)
 * 
 * 이 모듈은 애플리케이션의 설정을 관리합니다:
 * - 설정 파일 로드 및 저장
 * - 기본 설정 값 생성
 * - 설정 업데이트 및 변경사항 저장
 */

// 필요한 Node.js 모듈 가져오기
const fs = require('fs');     // 파일 시스템 작업을 위한 모듈
const path = require('path'); // 경로 관련 작업을 위한 모듈

// 설정 파일 경로 설정
// __dirname: 현재 스크립트 파일의 디렉토리 경로
// '..', '..': 상위 디렉토리로 두 번 이동 (electron-ui/modules -> electron-ui -> 프로젝트 루트)
const configPath = path.join(__dirname, '..', '..', 'config.json');

/**
 * 설정 파일 로드 함수
 * 
 * 지정된 경로에서 설정 파일(config.json)을 로드합니다.
 * 파일이 없거나 오류가 발생하면 기본 설정을 생성합니다.
 * 
 * @returns {Object} 로드된 설정 객체
 */
function loadConfig() {
    // 설정 파일 경로 로그 출력
    console.log('설정 파일 탐색 경로:', configPath);
    
    let config;
    try {
        // 설정 파일 존재 여부 확인
        if (fs.existsSync(configPath)) {
            // 설정 파일이 존재하는 경우 로드
            config = require(configPath);
            console.log('설정 파일 로드 성공');
            
            // 누락된 설정 항목에 기본값 추가
            ensureDefaultValues(config);
        } else {
            // 설정 파일이 없는 경우 오류 로그 출력
            console.error(`설정 파일을 찾을 수 없습니다: ${configPath}`);
            
            // 기본 설정 생성
            config = createDefaultConfig();
            // 생성된 기본 설정 저장
            saveConfig(config);
        }
    } catch (error) {
        // 파일 로딩 중 오류 발생 시 처리
        console.error('설정 로드 중 오류 발생:', error);
        // 오류 발생 시 기본 설정 사용
        config = createDefaultConfig();
    }
    
    // 최종 설정 객체 반환
    return config;
}

/**
 * 기본 설정 생성 함수
 * 
 * 애플리케이션에서 사용할 기본 설정 값을 정의합니다.
 * 설정 파일이 없거나 로드할 수 없을 때 이 기본 설정이 사용됩니다.
 * package.json 파일에서 애플리케이션 기본 정보를 가져와 설정에 반영합니다.
 * 
 * @returns {Object} 기본 설정 객체
 */
function createDefaultConfig() {
    console.log('기본 설정 생성 중');
    
    // 애플리케이션 정보를 package.json에서 가져오기
    const appInfo = getPackageInfo();
    
    // 애플리케이션 이름에서 로그 파일 접두어 생성
    // 공백을 밑줄로 대체하고 소문자로 변환하여 파일 이름으로 적합하게 만듦
    const logPrefix = appInfo.name ? 
        appInfo.name.replace(/\s+/g, '_').toLowerCase() + '_log_' : 
        'automation_log_';
    
    // 기본 설정 객체 정의
    return {
        // 창 크기 및 동작 관련 설정
        windowWidth: 1200,        // 창 너비 (픽셀)
        windowHeight: 800,        // 창 높이 (픽셀)
        windowResizable: false,   // 창 크기 조정 가능 여부
        devToolsEnabled: false,   // 개발자 도구 활성화 여부
        
        // Python 스크립트 경로 설정
        pythonScriptPath: '../automation-back/news_scraper_byKeyword.py',
        
        // 대체 스크립트 경로 목록 (기본 경로에서 파일을 찾을 수 없을 때 시도할 경로들)
        alternativeScriptPaths: [
            '../scripts/news_scraper_byKeyword.py',
            '../news_scraper_byKeyword.py'
        ],
        
        // package.json에서 가져온 앱 이름 기반으로 로그 파일 접두어 설정
        // 예: 앱 이름이 "뉴스 크롤링 프로그램"이면 "뉴스_크롤링_프로그램_log_"로 설정됨
        logFilePrefix: logPrefix
    };
}

/**
 * package.json 파일에서 애플리케이션 정보를 읽어오는 함수
 * 
 * 프로젝트 루트 디렉토리의 package.json 파일을 읽고 파싱하여
 * 애플리케이션 이름, 버전 등의 정보를 추출합니다.
 * 
 * @returns {Object} 애플리케이션 정보 객체 ({name, version} 등)
 * @example
 * // 반환값 예시:
 * // {
 * //   name: "뉴스 크롤링 프로그램",
 * //   version: "1.0.0"
 * // }
 */
function getPackageInfo() {
    // 기본값 설정 - package.json 읽기 실패 시 사용할 기본 애플리케이션 정보
    const defaultPackageInfo = {
        name: '뉴스 크롤링 프로그램',  // 기본 애플리케이션 이름
        version: '1.0.0'           // 기본 버전 문자열
    };
    
    try {
        // package.json 파일 경로 설정 (프로젝트 루트 디렉토리)
        // __dirname: 현재 실행 중인 스크립트 파일의 디렉토리 경로
        // '..', '..': 상위 디렉토리로 두 번 이동 (electron-ui/modules -> electron-ui -> 프로젝트 루트)
        // path.join(): 플랫폼 독립적인 방식으로 경로 문자열을 결합
        const packagePath = path.join(__dirname, '..', '..', 'package.json');
        
        // package.json 파일 읽기 및 파싱
        // fs.readFileSync(): 파일을 동기적으로 읽어오는 메서드
        // 'utf8': 파일 인코딩 방식 지정
        // JSON.parse(): 문자열을 JSON 객체로 변환
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // 디버깅용 로그: 읽어온 package.json 데이터 출력
        console.log('package.json 데이터 로드됨:', packagePath);
        
        // 필요한 정보 반환 (package.json에서 값을 가져오거나 기본값 사용)
        // || 연산자: 좌측 값이 falsy(undefined, null 등)일 경우 우측 값을 사용
        return {
            name: packageData.name || defaultPackageInfo.name,         // 앱 이름
            version: packageData.version || defaultPackageInfo.version  // 앱 버전
        };
    } catch (error) {
        // 파일 읽기 실패 시 오류 로깅 및 기본값 반환
        // 파일이 없거나, 권한이 없거나, JSON 파싱에 실패한 경우 등
        console.error('package.json 읽기 오류 발생:', error);
        
        // 오류 발생 시 기본값 객체를 반환하여 앱 동작 유지
        return defaultPackageInfo;
    }
}

/**
 * 기본 설정 값 보장 함수
 * 
 * 설정 객체에 필수 항목이 누락된 경우 기본값을 추가합니다.
 * 이는 기존 설정 파일에 새로운 설정 항목이 추가되었을 때 유용합니다.
 * 
 * @param {Object} config - 점검 및 보완할 설정 객체
 */
function ensureDefaultValues(config) {
    // 기본 설정 객체 가져오기
    const defaults = createDefaultConfig();
    
    // 기본 설정의 모든 항목을 순회하며 점검
    for (const [key, value] of Object.entries(defaults)) {
        // 설정 객체에 해당 키가 없으면 기본값 추가
        if (config[key] === undefined) {
            config[key] = value;
            console.log(`설정 항목 '${key}'에 기본값 추가됨`);
        }
    }
}

/**
 * 설정 저장 함수
 * 
 * 설정 객체를 JSON 형식으로 파일에 저장합니다.
 * 
 * @param {Object} config - 저장할 설정 객체
 * @returns {boolean} 저장 성공 여부 (true: 성공, false: 실패)
 */
function saveConfig(config) {
    try {
        // 설정을 JSON 형식으로 변환하여 파일에 저장
        // null, 4: 보기 좋게 들여쓰기된 형태로 저장(가독성 향상)
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
        console.log('설정 저장 성공');
        return true;
    } catch (err) {
        // 파일 저장 중 오류 발생 시 처리
        console.error('설정 저장 중 오류 발생:', err);
        return false;
    }
}

/**
 * 설정 업데이트 함수
 * 
 * 특정 설정 항목의 값을 업데이트하고 파일에 저장합니다.
 * 
 * @param {Object} config - 업데이트할 설정 객체
 * @param {string} key - 업데이트할 설정 항목의 키
 * @param {*} value - 새로운 설정 값
 * @returns {boolean} 업데이트 성공 여부 (true: 성공, false: 실패)
 */
function updateConfig(config, key, value) {
    // 설정 객체가 유효하지 않은 경우 실패 반환
    if (!config) return false;
    
    // 설정 항목 업데이트
    config[key] = value;
    
    // 변경된 설정을 파일에 저장하고 결과 반환
    return saveConfig(config);
}

/**
 * 모듈 내보내기
 * 
 * 다른 파일에서 이 모듈의 함수들을 사용할 수 있도록 내보냅니다.
 */
module.exports = {
    loadConfig,    // 설정 로드 함수
    saveConfig,    // 설정 저장 함수
    updateConfig,  // 설정 업데이트 함수
    configPath     // 설정 파일 경로
};