/**
 * 설정 관리 모듈 (config-manager.js)
 * 
 * 이 모듈은 애플리케이션의 설정을 관리합니다:
 * - 설정 파일 로드 및 저장
 * - 기본 설정 값 생성
 * - 설정 업데이트 및 변경사항 저장
 * 
 * 이 파일은 애플리케이션의 환경 설정 관리를 담당하며, 사용자 설정을 저장하고 불러오는
 * 기능을 제공합니다. config.json 파일을 사용하여 설정을 영구적으로 저장합니다.
 * 
 * @module config-manager
 * @author 개발팀
 * @date 2025-03-14
 */

// 필요한 Node.js 모듈 가져오기
const fs = require('fs');     // 파일 시스템 작업을 위한 모듈 (파일 읽기/쓰기)
const path = require('path'); // 경로 관련 작업을 위한 모듈 (경로 조작 및 생성)

// 모든 상수를 한 번에 가져오기 - export-constants.js를 통해 중앙화된 상수 관리
const constants = require('../constants/export-constants');

// 설정 캐시 - 성능 최적화를 위해 메모리에 설정 보관 (잦은 파일 읽기 방지)
let configCache = null;

/**
 * 설정 파일 로드 함수
 * 
 * 지정된 경로에서 설정 파일(config.json)을 로드합니다.
 * 파일이 없거나 오류가 발생하면 기본 설정을 생성합니다.
 * 메모리 캐싱을 통해 반복적인 파일 로드를 방지합니다.
 * 
 * @param {boolean} [forceReload=false] - 캐시된 설정을 무시하고 파일에서 강제로 다시 로드할지 여부
 * @returns {Object} 로드된 설정 객체 - 애플리케이션에서 사용할 각종 설정값들이 담긴 객체
 * @example
 * // 기본 사용법 (캐시된 설정 사용)
 * const config = loadConfig();
 * console.log(config.windowWidth); // 출력: 1200 (기본값 또는 사용자 지정값)
 * 
 * // 강제 재로드 (파일에서 설정 다시 읽기)
 * const freshConfig = loadConfig(true);
 */
function loadConfig(forceReload = false) {
    // 캐시된 설정이 있고 강제 재로드를 요청하지 않았다면 캐시된 설정 반환
    if (configCache && !forceReload) {
        console.log('캐시된 설정 사용');
        return configCache;
    }
    
    // 설정 파일 경로 로그 출력 - constants에서 가져온 CONFIG_PATH 사용
    console.log('설정 파일 탐색 경로:', constants.CONFIG_PATH);
    
    // 설정 객체를 저장할 변수 선언
    let config;
    
    try {
        // 설정 파일 존재 여부 확인 - fs.existsSync()는 파일이 존재하면 true, 없으면 false 반환
        if (fs.existsSync(constants.CONFIG_PATH)) {
            // 설정 파일이 존재하는 경우 로드
            // fs.readFileSync()와 JSON.parse()를 사용하여 캐싱 문제 방지
            const configContent = fs.readFileSync(constants.CONFIG_PATH, 'utf8');
            config = JSON.parse(configContent);
            console.log('설정 파일 로드 성공');
            
            // 누락된 설정 항목에 기본값 추가 - 이전 버전 설정 파일 호환성 유지
            ensureDefaultValues(config);
        } else {
            // 설정 파일이 없는 경우 오류 로그 출력
            console.error(`설정 파일을 찾을 수 없습니다: ${constants.CONFIG_PATH}`);
            
            // 기본 설정 생성 - 설정 파일이 없을 때 기본값으로 새 설정 생성
            config = createDefaultConfig();
            
            // 생성된 기본 설정 저장 - 다음 실행 시 파일에서 불러올 수 있도록 함
            saveConfig(config);
            
            console.log('기본 설정 파일이 생성되었습니다.');
        }
    } catch (error) {
        // 파일 로딩 중 오류 발생 시 처리
        // - 파일 읽기 실패, JSON 파싱 오류 등이 여기서 처리됨
        console.error('설정 로드 중 오류 발생:', error);
        console.error('오류 상세 정보:', error.stack);
        
        // 오류 발생 시 기본 설정 사용 - 프로그램이 계속 작동할 수 있도록 함
        config = createDefaultConfig();
        console.log('오류로 인해 기본 설정이 적용되었습니다.');
    }
    
    // 로드된 설정을 캐시에 저장
    configCache = config;
    
    // 최종 설정 객체 반환 - 이 객체는 애플리케이션 전반에서 사용됨
    return config;
}

/**
 * 기본 설정 생성 함수
 * 
 * 애플리케이션에서 사용할 기본 설정 값을 정의합니다.
 * 설정 파일이 없거나 로드할 수 없을 때 이 기본 설정이 사용됩니다.
 * 외부 상수 파일에서 가져온 기본값을 사용하여 설정 객체를 구성합니다.
 * 
 * @returns {Object} 기본 설정 객체 - 애플리케이션의 기본 설정값들이 담긴 객체
 * @example
 * // 함수 사용 예시:
 * const defaultConfig = createDefaultConfig();
 * console.log(defaultConfig.logFilePrefix); // 출력: "news_crawler_log_" 또는 유사한 형식
 * console.log(defaultConfig.windowWidth); // 출력: 1200
 */
function createDefaultConfig() {
    console.log('기본 설정 생성 중');
    
    // 애플리케이션 정보를 가져오기 - constants를 통해 중앙화된 함수 접근
    const appInfo = constants.getAppInfo();
    
    // 애플리케이션 이름에서 로그 파일 접두어 생성
    // constants.createLogPrefix 함수를 사용하여 일관된 형식의 로그 파일 접두어 생성
    const logPrefix = constants.createLogPrefix ? 
        constants.createLogPrefix(appInfo.name) : 
        appInfo.name.replace(/\s+/g, '_').toLowerCase() + '_log_';
    
    // 기본 설정 객체 정의 - 외부 상수 파일의 값들을 활용하여 구성
    return {
        // 창 크기 및 동작 관련 설정 - UI 상수에서 가져옴
        windowWidth: constants.UI_CONFIG.defaultWidth,          // 창 너비 (픽셀)
        windowHeight: constants.UI_CONFIG.defaultHeight,        // 창 높이 (픽셀)
        windowResizable: constants.UI_CONFIG.resizable,         // 창 크기 조정 가능 여부
        devToolsEnabled: constants.UI_CONFIG.devTools.enabled,  // 개발자 도구 활성화 여부
        
        // Python 스크립트 경로 설정 - Python 상수에서 가져옴
        pythonScriptPath: constants.PYTHON_SCRIPT.mainScriptPath,  // 기본 스크립트 경로
        
        // 대체 스크립트 경로 목록 - Python 상수에서 가져옴
        // 기본 스크립트를 찾지 못할 경우 시도할 대체 경로 목록
        alternativeScriptPaths: constants.PYTHON_SCRIPT.alternativePaths,
        
        // 로그 파일 접두어 설정 - 앱 이름 기반으로 생성된 값 사용
        // 로그 파일 이름의 앞부분을 구성하는 문자열 (시간 정보가 뒤에 추가됨)
        // 예: 앱 이름이 "뉴스 크롤링 프로그램"이면 "뉴스_크롤링_프로그램_log_"로 설정됨
        logFilePrefix: logPrefix,
        
        // 사용자 지정 추가 설정 - 여기에 애플리케이션 특화 설정을 추가할 수 있음
        // 예: 네트워크 타임아웃, 자동 저장 간격 등
        autoSaveInterval: 5000,  // 자동 저장 간격 (밀리초)
        maxLogFiles: 100,        // 최대 로그 파일 수 (오래된 로그 자동 정리용)
        theme: 'system'          // 테마 설정 (system, light, dark)
    };
}

/**
 * 기본 설정 값 보장 함수
 * 
 * 설정 객체에 필수 항목이 누락된 경우 기본값을 추가합니다.
 * 이는 기존 설정 파일에 새로운 설정 항목이 추가되었을 때 유용합니다.
 * 
 * @param {Object} config - 점검 및 보완할 설정 객체
 * @example
 * // 함수 사용 예시:
 * const config = { windowWidth: 1200 }; // 일부 설정만 있는 객체
 * ensureDefaultValues(config);
 * console.log(config.windowHeight); // 출력: 800 (기본값이 추가됨)
 * console.log(config.devToolsEnabled); // 출력: false (기본값이 추가됨)
 */
function ensureDefaultValues(config) {
    // 기본 설정 객체 가져오기 - 모든 필수 설정 항목과 기본값을 포함
    const defaults = createDefaultConfig();
    
    // 기본 설정의 모든 항목을 순회하며 점검
    // - Object.entries()는 [키, 값] 쌍의 배열을 반환
    // - for...of 루프로 각 항목에 접근
    for (const [key, value] of Object.entries(defaults)) {
        // 설정 객체에 해당 키가 없으면 기본값 추가
        // - undefined 체크로 누락된 항목 식별
        if (config[key] === undefined) {
            // 설정 객체에 기본값 할당
            config[key] = value;
            // 기본값 추가 로깅
            console.log(`설정 항목 '${key}'에 기본값 추가됨: ${JSON.stringify(value)}`);
        }
    }
}

/**
 * 설정 저장 함수
 * 
 * 설정 객체를 JSON 형식으로 파일에 저장합니다.
 * 
 * @param {Object} config - 저장할 설정 객체 (모든 설정 값을 포함하는 JavaScript 객체)
 * @returns {boolean} 저장 성공 여부 (true: 성공, false: 실패)
 * @example
 * // 함수 사용 예시:
 * const config = { windowWidth: 1000, windowHeight: 600, devToolsEnabled: true };
 * if (saveConfig(config)) {
 *   console.log('설정 저장 완료');
 * } else {
 *   console.error('설정 저장 실패');
 * }
 */
function saveConfig(config) {
    try {
        // 설정 저장 전 로그 디렉토리 존재 여부 확인 및 생성
        const configDir = path.dirname(constants.CONFIG_PATH);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`설정 디렉토리 생성됨: ${configDir}`);
        }
        
        // 설정을 JSON 형식으로 변환하여 파일에 저장
        // - JSON.stringify(): JavaScript 객체를 JSON 문자열로 변환
        // - 매개변수 설명: 
        //   * config: 변환할 객체
        //   * null: 대체 함수 없음 (기본값)
        //   * 2: 들여쓰기 공백 수 (가독성을 위해 2칸 들여쓰기 적용)
        // - fs.writeFileSync(): 동기적으로 파일에 내용 쓰기
        //   * constants.CONFIG_PATH: 저장할 파일 경로
        //   * JSON.stringify(config, null, 2): 저장할 내용
        //   * 'utf8': 인코딩 방식
        fs.writeFileSync(constants.CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        
        // 저장된 설정을 캐시에 업데이트
        configCache = config;
        
        // 저장 성공 로그 및 true 반환
        console.log('설정 저장 성공:', constants.CONFIG_PATH);
        return true;
    } catch (err) {
        // 파일 저장 중 오류 발생 시 처리
        // - 파일 접근 권한 문제, 디스크 공간 부족 등의 이유로 실패할 수 있음
        console.error('설정 저장 중 오류 발생:', err);
        console.error('오류 메시지:', err.message);
        
        // 저장 실패를 나타내는 false 반환
        return false;
    }
}

/**
 * 설정 업데이트 함수
 * 
 * 특정 설정 항목의 값을 업데이트하고 파일에 저장합니다.
 * 이 함수는 단일 설정 항목을 변경할 때 유용합니다.
 * 
 * @param {Object} config - 업데이트할 설정 객체
 * @param {string} key - 업데이트할 설정 항목의 키(이름)
 * @param {*} value - 새로운 설정 값
 * @returns {boolean} 업데이트 성공 여부 (true: 성공, false: 실패)
 * @example
 * // 함수 사용 예시:
 * const config = loadConfig();
 * // 개발자 도구 설정을 활성화
 * if (updateConfig(config, 'devToolsEnabled', true)) {
 *   console.log('개발자 도구 설정이 활성화되었습니다.');
 * }
 * // 창 크기 변경
 * if (updateConfig(config, 'windowWidth', 1400)) {
 *   console.log('창 너비가 1400px로 변경되었습니다.');
 * }
 */
function updateConfig(config, key, value) {
    // 설정 객체가 유효하지 않은 경우 실패 반환
    // - 잘못된 설정 객체가 전달되었을 때 오류 방지
    if (!config) {
        console.error('유효하지 않은 설정 객체: 설정을 업데이트할 수 없습니다.');
        return false;
    }
    
    // 이전 값 저장 (로깅용)
    const oldValue = config[key];
    
    // 값이 실제로 변경되었는지 확인
    if (JSON.stringify(oldValue) === JSON.stringify(value)) {
        console.log(`설정 항목 '${key}'는 이미 동일한 값을 가지고 있습니다.`);
        return true; // 변경 없이 성공으로 간주
    }
    
    // 설정 항목 업데이트
    config[key] = value;
    
    // 변경 내역 로깅
    console.log(`설정 항목 '${key}' 업데이트: ${JSON.stringify(oldValue)} → ${JSON.stringify(value)}`);
    
    // 변경된 설정을 파일에 저장하고 결과 반환
    // saveConfig() 함수의 반환값(성공 또는 실패)을 그대로 전달
    return saveConfig(config);
}

/**
 * 설정 항목 가져오기 함수
 * 
 * 특정 설정 항목의 값을 가져옵니다. 설정이 없으면 제공된 기본값을 반환합니다.
 * 
 * @param {string} key - 가져올 설정 항목의 키(이름)
 * @param {*} [defaultValue=null] - 설정이 없을 때 반환할 기본값
 * @returns {*} 설정 값 또는 기본값
 * @example
 * // 함수 사용 예시:
 * const width = getConfigValue('windowWidth', 1000);
 * console.log(width); // 출력: 설정된 windowWidth 값 또는 기본값 1000
 */
function getConfigValue(key, defaultValue = null) {
    const config = loadConfig();
    return config.hasOwnProperty(key) ? config[key] : defaultValue;
}

/**
 * 모듈 내보내기
 * 
 * 다른 파일에서 이 모듈의 함수들을 사용할 수 있도록 내보냅니다.
 * module.exports는 이 파일에서 외부로 공개할 기능을 정의합니다.
 */
module.exports = {
    loadConfig,       // 설정 로드 함수
    saveConfig,       // 설정 저장 함수
    updateConfig,     // 설정 업데이트 함수
    getConfigValue,   // 특정 설정 항목 가져오기 함수
    CONFIG_PATH: constants.CONFIG_PATH  // 설정 파일 경로 (상수 모듈에서 가져옴)
};