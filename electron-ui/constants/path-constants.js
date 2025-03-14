/**
 * 경로 관련 상수 모듈 (path-constants.js)
 * 
 * 이 모듈은 애플리케이션에서 사용하는 모든 경로 관련 상수를 정의합니다.
 * 프로젝트 루트, 설정 파일, 로그 파일 등의 경로를 중앙에서 관리하여
 * 코드의 일관성과 유지보수성을 향상시킵니다.
 * 
 * @module path-constants
 * @author 개발팀
 * @date 2025-03-14
 */

// 필요한 Node.js 모듈 가져오기
const path = require('path');  // 경로 관련 작업을 위한 모듈

/**
 * 프로젝트 루트 디렉토리 경로
 * 
 * 현재 모듈(path_constants.js)의 위치를 기준으로 프로젝트 루트 디렉토리 경로를 계산합니다.
 * 이 상수는 프로젝트 내의 다른 파일이나 디렉토리의 절대 경로를 구성할 때 기준점으로 사용됩니다.
 * 
 * @constant {string}
 * @example
 * // PROJECT_ROOT를 사용하여 다른 파일의 절대 경로 구성
 * const configPath = path.join(PROJECT_ROOT, 'config.json'); // 예: 'c:\Coding\Python\Automation_Framework\config.json'
 */
const PROJECT_ROOT = path.join(__dirname, '..', '..');

/**
 * package.json 파일 경로
 * 
 * 프로젝트의 package.json 파일 경로를 정의합니다.
 * 이 파일에는 애플리케이션의 이름, 버전, 설명 등의 메타데이터가 포함되어 있습니다.
 * 
 * @constant {string}
 * @example
 * // PACKAGE_JSON_PATH를 사용하여 package.json 파일 읽기
 * const packageData = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
 */
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

/**
 * 설정 파일 경로
 * 
 * 애플리케이션의 사용자 설정 파일(config.json)의 경로를 정의합니다.
 * 이 파일은 사용자 기본 설정, 환경 설정 등을 저장하는 데 사용됩니다.
 * 
 * @constant {string}
 * @example
 * // CONFIG_PATH를 사용하여 설정 파일 저장
 * fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
 */
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config.json');

/**
 * 로그 디렉토리 경로
 * 
 * 애플리케이션 로그 파일이 저장될 디렉토리 경로를 정의합니다.
 * 
 * @constant {string}
 * @example
 * // LOG_DIRECTORY를 사용하여 로그 파일 경로 생성
 * const logFilePath = path.join(LOG_DIRECTORY, 'app_log_2025-03-14.log');
 */
const LOG_DIRECTORY = path.join(PROJECT_ROOT, 'logs');

/**
 * 백엔드 디렉토리 경로
 * 
 * Python 백엔드 스크립트가 위치한 디렉토리 경로를 정의합니다.
 * 
 * @constant {string}
 * @example
 * // BACKEND_DIRECTORY를 사용하여 Python 스크립트 경로 생성
 * const scriptPath = path.join(BACKEND_DIRECTORY, 'news_scraper_byKeyword.py');
 */
const BACKEND_DIRECTORY = path.join(PROJECT_ROOT, 'automation-back');

// 모듈 내보내기
module.exports = {
    PROJECT_ROOT,      // 프로젝트 루트 디렉토리 경로
    PACKAGE_JSON_PATH, // package.json 파일 경로
    CONFIG_PATH,       // 설정 파일 경로
    LOG_DIRECTORY,     // 로그 디렉토리 경로
    BACKEND_DIRECTORY  // 백엔드 디렉토리 경로
};