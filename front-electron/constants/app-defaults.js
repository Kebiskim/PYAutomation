/**
 * 애플리케이션 기본 정보 상수 모듈 (app-defaults.js)
 * 
 * 이 모듈은 애플리케이션의 기본 정보(이름, 버전, 설명 등)를 정의합니다.
 * package.json 파일을 읽을 수 없거나 필요한 정보가 누락된 경우에 사용할
 * 기본값을 제공합니다.
 * 
 * @module app-defaults
 * @date 2025-03-14
 */

// 필요한 모듈 가져오기
const fs = require('fs');  // 파일 시스템 접근을 위한 모듈
const path = require('path');  // 경로 관련 작업을 위한 모듈
const { PACKAGE_JSON_PATH } = require('./path-constants');  // 경로 상수 가져오기

// config.json 파일 경로
const CONFIG_PATH = path.join(__dirname, '../../config.json');

/**
 * 애플리케이션 기본 정보
 * 
 * package.json 파일을 읽을 수 없거나 필요한 필드가 없을 때 사용할
 * 애플리케이션의 기본 정보를 정의합니다.
 * 
 * @constant {Object}
 * @property {string} name - 애플리케이션 이름 (예: "뉴스 크롤링 프로그램")
 * @property {string} version - 애플리케이션 버전 (예: "1.0.0")
 * @property {string} description - 애플리케이션 설명 (기본값: 빈 문자열)
 * @property {string} author - 애플리케이션 제작자 (기본값: 빈 문자열)
 * @example
 * // APP_DEFAULTS 사용 예:
 * const appName = packageData.name || APP_DEFAULTS.name;
 */
const APP_DEFAULTS = {
    name: '자동화 프로그램 프레임워크',  // 기본 애플리케이션 이름 (UI에 표시됨)
    version: '1.0.0',           // 기본 버전 번호 (Semantic Versioning 형식)
    description: '',            // 기본 애플리케이션 설명 (비어있음)
    author: ''                  // 기본 저작자 정보 (비어있음)
};

/**
 * config.json 파일에서 애플리케이션 이름을 읽어오는 함수
 * 
 * config.json 파일을 읽고 파싱하여 애플리케이션 이름을 추출합니다.
 * 파일을 찾을 수 없거나 읽는 과정에서 오류가 발생하면 기본값을 사용합니다.
 * 
 * @function
 * @returns {string} 애플리케이션 이름
 * @example
 * // getAppNameFromConfig 함수 사용 예:
 * const appName = getAppNameFromConfig();
 * console.log(`애플리케이션 이름: ${appName}`);
 * // 출력 예: "애플리케이션 이름: 자동화 프로그램 프레임워크"
 */
function getAppNameFromConfig() {
    try {
        // config.json 파일 읽기 및 파싱
        const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        
        // config.json에서 애플리케이션 이름 반환
        return configData.name || APP_DEFAULTS.name;
    } catch (error) {
        // 파일 읽기 실패 시 오류 로깅 및 기본값 반환
        console.error('config.json 읽기 오류:', error.message);
        
        // 오류 발생 시 APP_DEFAULTS 상수에서 정의된 기본값 반환
        return APP_DEFAULTS.name;
    }
}

/**
 * package.json 파일에서 애플리케이션 정보를 읽어오는 함수
 * 
 * 프로젝트 루트 디렉토리의 package.json 파일을 읽고 파싱하여
 * 애플리케이션 이름, 버전 등의 정보를 추출합니다.
 * 파일을 찾을 수 없거나 읽는 과정에서 오류가 발생하면 기본값을 사용합니다.
 * 
 * @function
 * @returns {Object} 애플리케이션 정보 객체
 * @property {string} name - 애플리케이션 이름 
 * @property {string} version - 애플리케이션 버전
 * @property {string} description - 애플리케이션 설명
 * @property {string} author - 애플리케이션 제작자
 * @example
 * // getAppInfo 함수 사용 예:
 * const appInfo = getAppInfo();
 * console.log(`애플리케이션 이름: ${appInfo.name}, 버전: ${appInfo.version}`);
 * // 출력 예: "애플리케이션 이름: 뉴스 크롤링 프로그램, 버전: 1.0.0"
 */
function getAppInfo() {
    try {
        // package.json 파일 읽기 및 파싱
        const packageData = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
        
        // 디버깅 목적의 로그 출력 (개발 중 확인용)
        console.log('package.json 데이터 로드됨:', PACKAGE_JSON_PATH);
        
        // package.json에서 읽어온 정보를 반환 객체로 구성
        // 각 필드가 없거나 undefined인 경우 APP_DEFAULTS의 해당 값으로 대체
        return {
            name: packageData.name || getAppNameFromConfig(),  // 애플리케이션 이름
            version: packageData.version || APP_DEFAULTS.version,  // 버전 정보
            description: packageData.description || APP_DEFAULTS.description,  // 설명
            author: packageData.author || APP_DEFAULTS.author  // 저작자
        };
    } catch (error) {
        // 파일 읽기 실패 시 오류 로깅 및 기본값 반환
        console.error('package.json 읽기 오류:', error.message);
        
        // 오류 발생 시 APP_DEFAULTS 상수에서 정의된 기본값 반환
        return { 
            ...APP_DEFAULTS, 
            name: getAppNameFromConfig()  // 이름은 config.json에서 가져옴
        };
    }
}

// 모듈 내보내기
module.exports = {
    APP_DEFAULTS,  // 기본 애플리케이션 정보 객체
    getAppInfo,    // 애플리케이션 정보를 읽어오는 함수
    getAppNameFromConfig  // config.json에서 애플리케이션 이름을 읽어오는 함수
};