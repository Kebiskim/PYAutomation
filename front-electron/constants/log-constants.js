/**
 * 로그 관련 상수 모듈 (log-constants.js)
 * 
 * 이 모듈은 애플리케이션의 로깅 시스템에 관련된 상수와 유틸리티 함수를 정의합니다.
 * 로그 파일 이름, 경로, 포맷 등에 관한 설정을 포함합니다.
 * 
 * @module log-constants
 * @date 2025-03-14
 */

// 필요한 모듈 가져오기
const path = require('path');  // 경로 관련 작업을 위한 모듈
const { LOG_DIRECTORY } = require('./path-constants');  // 경로 상수 가져오기
const { getAppNameFromConfig } = require('./app-defaults');  // 앱 이름 가져오기 함수

/**
 * 로그 파일 관련 설정
 * 
 * 애플리케이션에서 생성하는 로그 파일의 이름 패턴과 저장 위치를 정의합니다.
 * 
 * @constant {Object}
 * @property {string} defaultPrefix - 기본 로그 파일 접두어
 * @property {string} directory - 로그 파일이 저장될 디렉토리 경로
 * @property {string} extension - 로그 파일 확장자
 * @example
 * // LOG_CONFIG 사용 예:
 * const logFilePath = path.join(LOG_CONFIG.directory, 
 *                              `${LOG_CONFIG.defaultPrefix}${dateString}.${LOG_CONFIG.extension}`);
 */
const LOG_CONFIG = {
    defaultPrefix: `${getAppNameFromConfig().replace(/\s+/g, '_').toLowerCase()}_log_`,  // 기본 로그 파일 접두어
    directory: LOG_DIRECTORY,  // 로그 저장 디렉토리 (path_constants.js에서 가져옴)
    extension: 'log'  // 로그 파일 확장자
};

/**
 * 로그 파일 기본 설정
 * 
 * 로그 파일 생성 시 사용할 기본 설정 값을 정의합니다.
 * 
 * @constant {Object}
 * @property {string} prefix - 기본 로그 파일 접두어
 */
const LOG_DEFAULTS = {
    prefix: LOG_CONFIG.defaultPrefix  // 기본 로그 파일 접두어
};

/**
 * 대화상자 문자열 상수
 * 
 * 로그 저장 대화상자에 사용되는 문자열 상수를 정의합니다.
 * 
 * @constant {Object}
 * @property {string} LOG_SAVE_TITLE - 로그 저장 대화상자 제목
 * @property {string} LOG_FILE_TYPE - 로그 파일 형식 설명
 * @example
 * // DIALOG_STRINGS 사용 예:
 * const title = DIALOG_STRINGS.LOG_SAVE_TITLE;
 * console.log(title); // 출력: "로그 저장하기"
 */
const DIALOG_STRINGS = {
    LOG_SAVE_TITLE: '로그 저장하기',  // 로그 저장 대화상자 제목
    LOG_FILE_TYPE: '로그 파일'  // 로그 파일 형식 설명
};

/**
 * 로그 파일 이름 생성 함수
 * 
 * 현재 날짜와 시간을 기반으로 로그 파일 이름을 생성합니다.
 * 포맷: [접두어]_YYYY-MM-DD_HH-MM-SS.log
 * 
 * @function
 * @param {string} [prefix] - 로그 파일 접두어 (기본값: LOG_CONFIG.defaultPrefix)
 * @returns {string} 생성된 로그 파일 이름
 * @example
 * // generateLogFileName 함수 사용 예:
 * const logFile = generateLogFileName('news_crawler_');
 * console.log(logFile); 
 * // 출력 예: "news_crawler_2025-03-14_15-30-45.log"
 */
function generateLogFileName(prefix = LOG_CONFIG.defaultPrefix) {
    // 현재 날짜와 시간 가져오기
    const now = new Date();
    
    // 날짜 및 시간 문자열 포맷팅 (YYYY-MM-DD_HH-MM-SS 형식)
    const dateString = [
        now.getFullYear(),  // 년도 (4자리)
        String(now.getMonth() + 1).padStart(2, '0'),  // 월 (2자리, 0-패딩)
        String(now.getDate()).padStart(2, '0')  // 일 (2자리, 0-패딩)
    ].join('-');
    
    const timeString = [
        String(now.getHours()).padStart(2, '0'),  // 시간 (2자리, 0-패딩)
        String(now.getMinutes()).padStart(2, '0'),  // 분 (2자리, 0-패딩)
        String(now.getSeconds()).padStart(2, '0')  // 초 (2자리, 0-패딩)
    ].join('-');
    
    // 최종 로그 파일 이름 생성 및 반환
    // 예: "automation_log_2025-03-14_15-30-45.log"
    return `${prefix}${dateString}_${timeString}.${LOG_CONFIG.extension}`;
}

/**
 * 애플리케이션 이름에서 로그 파일 접두어 생성 함수
 * 
 * 애플리케이션 이름을 기반으로 로그 파일에 사용할 접두어를 생성합니다.
 * 공백을 밑줄로 대체하고 소문자로 변환하여 파일 이름으로 적합하게 만듭니다.
 * 
 * @function
 * @param {string} [appName] - 애플리케이션 이름 (기본값: package.json에서 읽어온 이름)
 * @returns {string} 생성된 로그 파일 접두어
 * @example
 * // createLogPrefix 함수 사용 예:
 * const prefix = createLogPrefix("뉴스 크롤링 프로그램");
 * console.log(prefix); 
 * // 출력 예: "뉴스_크롤링_프로그램_log_"
 */
function createLogPrefix(appName) {
    // appName이 제공되지 않은 경우, package.json에서 읽어오기
    const name = appName || getAppNameFromConfig();
    
    // 공백을 밑줄로 대체하고 소문자로 변환
    // 정규식 /\s+/g는 하나 이상의 공백 문자와 일치
    // replace() 메서드로 모든 공백을 밑줄로 변경
    // toLowerCase()로 모든 문자를 소문자로 변환
    const formattedName = name.replace(/\s+/g, '_').toLowerCase();
    
    // 접두어에 "_log_" 접미사 추가하여 반환
    return `${formattedName}_log_`;
}

// 모듈 내보내기
module.exports = {
    LOG_CONFIG,  // 로그 파일 관련 설정
    LOG_DEFAULTS,  // 로그 파일 기본 설정
    DIALOG_STRINGS,  // 대화상자 문자열 상수
    generateLogFileName,  // 로그 파일 이름 생성 함수
    createLogPrefix  // 애플리케이션 이름에서 로그 파일 접두어 생성 함수
};