/**
 * IPC 엑셀 핸들러 모듈 (ipc-excel-handler.js)
 * 
 * 이 모듈은 엑셀 파일 저장 경로 선택과 관련된 IPC 이벤트 핸들러를 정의합니다.
 * 
 * @module ipc-excel-handler
 * @date 2025-03-14
 */

// 필요한 Electron 및 Node.js 모듈 가져오기
const { ipcMain, dialog } = require('electron');  // Electron의 IPC 및 대화상자 모듈

// 중앙 상수 모듈 가져오기
const constants = require('../../constants/export-constants');
const { updateConfig } = require('../config-manager');

/**
 * 엑셀 파일 저장 경로 선택 이벤트 핸들러 설정 함수
 * 
 * 'select-excel-path' 이벤트를 수신하여 엑셀 파일 저장 위치를 선택하기 위한
 * 파일 대화상자를 표시합니다. 선택된 경로는 설정에 저장되고 UI로 전달됩니다.
 * 
 * @param {BrowserWindow} mainWindow - 메인 윈도우 객체 (UI 업데이트 및 대화상자 표시에 사용)
 * @param {Object} config - 애플리케이션 설정 객체 (환경설정 값 접근에 사용)
 * @example
 * // renderer.js에서 이벤트 발생 예시
 * ipcRenderer.send('select-excel-path');
 * 
 * // 결과 수신 예시
 * ipcRenderer.on('excel-path-selected', (event, path) => {
 *   console.log('선택된 엑셀 저장 경로:', path);
 * });
 */
function setupExcelHandlers(mainWindow, config) {
    ipcMain.on('select-excel-path', (event) => {
        console.log('엑셀 경로 선택 이벤트 수신');
        
        // 파일 저장 대화상자 표시
        dialog.showSaveDialog(mainWindow, {
            title: constants.DIALOG_STRINGS.EXCEL_PATH_TITLE,  // 상수에서 대화상자 제목 가져오기
            defaultPath: constants.PYTHON_SCRIPT.excelFileName,  // 기본 파일명 설정
            filters: [
                { name: constants.DIALOG_STRINGS.EXCEL_FILE_TYPE, extensions: ['xlsx'] }  // Excel 파일 형식 필터
            ],
            properties: ['createDirectory']  // 필요시 디렉토리 생성 허용
        }).then(result => {
            // 대화상자 결과 로깅
            console.log('대화상자 결과:', result);
            
            // 사용자가 파일 경로를 선택하고 취소하지 않았을 경우
            if (!result.canceled && result.filePath) {
                console.log('선택된 파일 경로:', result.filePath);
                
                // 선택된 경로를 UI로 전송
                mainWindow.webContents.send('excel-path-selected', result.filePath);
                
            }
        }).catch(err => {
            // 대화상자 표시 중 오류 발생 시
            console.error('대화상자 오류:', err);
        });
    });
}

// 모듈 내보내기
module.exports = {
    setupExcelHandlers  // 엑셀 파일 저장 경로 선택 이벤트 핸들러 설정 함수
};