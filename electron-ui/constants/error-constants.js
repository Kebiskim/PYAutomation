/**
 * 에러 메시지 상수 모듈 (error-constants.js)
 * 
 * 이 모듈은 애플리케이션에서 사용되는 에러 메시지를 관리합니다.
 * 각 에러 메시지는 고유한 키를 가지며, 이를 통해 코드에서 쉽게 참조할 수 있습니다.
 * 
 * @module error-constants
 * @date 2025-03-14
 */

// 에러 메시지 상수 정의
const ERROR_MESSAGES = {
    INVALID_EXCEL_PATH: '유효한 엑셀 경로를 지정해주세요.',
    FILE_SAVE_ERROR: '파일 저장 중 오류가 발생했습니다.',
    DIRECTORY_CREATION_ERROR: '디렉토리 생성 중 오류가 발생했습니다.',
    SCRIPT_EXECUTION_ERROR: '스크립트 실행 중 오류가 발생했습니다.',
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
};

// 모듈 내보내기
module.exports = {
    ERROR_MESSAGES  // 에러 메시지 상수
};