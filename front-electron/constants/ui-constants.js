/**
 * UI 관련 상수 모듈 (ui-constants.js)
 * 
 * 이 모듈은 사용자 인터페이스 관련 상수를 정의합니다.
 * 창 크기, 기본 타이틀, 스타일 설정 등이 포함됩니다.
 * 
 * @module ui-constants
 * @author 개발팀
 * @date 2025-03-14
 */

/**
 * UI 관련 설정
 * 
 * 사용자 인터페이스 관련 기본 설정을 정의합니다.
 * 창 크기, 최소 크기, 기본 타이틀 등이 포함됩니다.
 * 
 * @constant {Object}
 * @property {number} defaultWidth - 기본 창 너비 (픽셀)
 * @property {number} defaultHeight - 기본 창 높이 (픽셀)
 * @property {boolean} resizable - 창 크기 조정 가능 여부
 * @property {string} defaultTitle - 기본 창 제목
 * @property {Object} minSize - 최소 창 크기 (너비, 높이)
 * @example
 * // UI_CONFIG 사용 예:
 * const mainWindow = new BrowserWindow({
 *   width: config.windowWidth || UI_CONFIG.defaultWidth,
 *   height: config.windowHeight || UI_CONFIG.defaultHeight,
 *   resizable: UI_CONFIG.resizable
 * });
 */
const UI_CONFIG = {
    defaultWidth: 1200,        // 기본 창 너비 (픽셀)
    defaultHeight: 800,        // 기본 창 높이 (픽셀)
    resizable: false,          // 기본 창 크기 조정 가능 여부
    defaultTitle: '뉴스 크롤링 시스템',  // 기본 창 제목
    minSize: {                 // 최소 창 크기
        width: 800,
        height: 600
    },
    // 개발자 도구 기본 설정
    devTools: {
        enabled: false         // 개발자 도구 활성화 기본값
    }
};

/**
 * 색상 테마 정의
 * 
 * 애플리케이션에서 사용되는 색상 테마를 정의합니다.
 * 일관된 UI를 위해 색상 코드를 중앙에서 관리합니다.
 * 
 * @constant {Object}
 * @property {string} primary - 주요 색상 (헤더, 버튼 등)
 * @property {string} secondary - 보조 색상
 * @property {string} background - 배경 색상
 * @property {string} text - 텍스트 기본 색상
 * @property {Object} alert - 알림 메시지 색상 (성공, 경고, 오류)
 * @example
 * // COLOR_THEME 사용 예:
 * document.body.style.backgroundColor = COLOR_THEME.background;
 * button.style.backgroundColor = COLOR_THEME.primary;
 */
const COLOR_THEME = {
    primary: '#4285F4',       // 주요 색상 (파란색 계열)
    secondary: '#34A853',     // 보조 색상 (녹색 계열)
    background: '#F8F9FA',    // 배경 색상 (밝은 회색)
    text: '#202124',          // 텍스트 기본 색상 (어두운 회색)
    alert: {
        success: '#34A853',   // 성공 메시지 색상 (녹색)
        warning: '#FBBC05',   // 경고 메시지 색상 (노란색)
        error: '#EA4335'      // 오류 메시지 색상 (빨간색)
    }
};

// 모듈 내보내기
module.exports = {
    UI_CONFIG,    // 창 설정 등 UI 구성 요소 관련 설정
    COLOR_THEME   // 애플리케이션 색상 테마
};