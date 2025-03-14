/**
 * Python 스크립트 관련 상수 모듈 (python-constants.js)
 * 
 * 이 모듈은 애플리케이션에서 실행할 Python 스크립트 관련 경로와 설정을 정의합니다.
 * 기본 스크립트 경로와 대체 경로, 실행 옵션 등을 포함합니다.
 * 
 * @module python-constants
 * @date 2025-03-14
 */

// 경로 상수 가져오기
const path = require('path');  // 경로 관련 작업을 위한 모듈
const { PROJECT_ROOT, BACKEND_DIRECTORY } = require('./path-constants');

/**
 * 파이썬 스크립트 관련 설정
 * 
 * 애플리케이션에서 실행할 파이썬 스크립트 경로와 관련 설정을 정의합니다.
 * 기본 경로와 대체 경로를 포함하여, 스크립트를 찾을 수 없을 때 대체 경로를 시도할 수 있습니다.
 * 
 * @constant {Object}
 * @property {string} mainScriptPath - 기본 파이썬 스크립트 경로
 * @property {string[]} alternativePaths - 대체 스크립트 경로 목록
 * @property {string} interpreterCommand - Python 인터프리터 명령어
 * @property {string} excelFileName - 기본 엑셀 파일 이름
 * @example
 * // PYTHON_SCRIPT 사용 예:
 * const scriptPath = PYTHON_SCRIPT.mainScriptPath;
 * // Python 실행 시 스크립트 경로 전달
 * spawn('python', [scriptPath, ...args]);
 */
const PYTHON_SCRIPT = {
    // 메인 Python 스크립트 경로 (automation-back 폴더 내 위치)
    mainScriptPath: path.join(BACKEND_DIRECTORY, 'news_scraper_byKeyword.py'),
    
    // 대체 스크립트 경로 목록 (메인 스크립트를 찾지 못할 경우 시도할 경로들)
    alternativePaths: [
        path.join(PROJECT_ROOT, 'scripts', 'news_scraper_byKeyword.py'),
        path.join(PROJECT_ROOT, 'news_scraper_byKeyword.py')
    ],
    
    // Python 인터프리터 명령어 (시스템에 따라 'python' 또는 'python3'를 사용)
    // Windows에서는 'python', 일부 Unix/Linux 시스템에서는 'python3' 사용
    interpreterCommand: process.platform === 'win32' ? 'python' : 'python3',
    
    // 기본 엑셀 파일 이름
    excelFileName: 'news_results.xlsx'
};

// 모듈 내보내기
module.exports = {
    PYTHON_SCRIPT  // Python 스크립트 관련 설정
};