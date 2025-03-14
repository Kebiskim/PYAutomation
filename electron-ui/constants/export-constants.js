/**
 * 상수 모듈 진입점 (export-constants.js)
 * 
 * 이 파일은 모든 상수 모듈을 한 곳에서 가져와서 내보냅니다.
 * 이를 통해 다른 모듈에서 필요한 상수를 더 쉽게 가져올 수 있습니다.
 * 
 * @module constants
 * @date 2025-03-14
 */

// 각 상수 모듈 가져오기
const pathConstants = require('./path-constants');
const appDefaults = require('./app-defaults');
const uiConstants = require('./ui-constants');
const pythonConstants = require('./python-constants');
const logConstants = require('./log-constants');
const errorConstants = require('./error-constants');  // 에러 메시지 상수 모듈 추가

// 모든 상수를 단일 객체로 결합하여 내보내기
module.exports = {
    // 경로 관련 상수
    ...pathConstants,
    
    // 앱 기본 정보 상수
    ...appDefaults,
    
    // UI 관련 상수
    ...uiConstants,
    
    // Python 실행 관련 상수
    ...pythonConstants,
    
    // 로그 관련 상수
    ...logConstants,
    
    // 에러 메시지 상수
    ...errorConstants
};