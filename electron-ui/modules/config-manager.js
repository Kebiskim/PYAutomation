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
 * 
 * @returns {Object} 기본 설정 객체
 */
function createDefaultConfig() {
    console.log('기본 설정 생성 중');
    
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
        
        // 추후 확장을 위한 다른 기본 설정 항목을 여기에 추가할 수 있습니다.
        logFilePrefix: 'automation_log_'  // 로그 파일 저장 시 사용할 접두어
    };
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