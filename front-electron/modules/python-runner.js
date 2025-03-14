/**
 * Python 스크립트 실행 관리 모듈
 * 
 * 이 모듈은 파이썬 스크립트를 실행하고, 출력을 처리하며, 필요시 중단하는 기능을 제공합니다.
 * 작업 완료 시 결과를 분석하여 UI에 적절한 메시지를 표시합니다.
 */
const { spawn } = require('child_process');  // 자식 프로세스 생성을 위한 Node.js 모듈
const fs = require('fs');                    // 파일 시스템 작업을 위한 Node.js 모듈
const path = require('path');                // 경로 작업을 위한 Node.js 모듈

// 현재 실행 중인 Python 프로세스를 추적하는 전역 변수
// null이면 실행 중인 프로세스가 없음을 의미
let pythonProcess = null;

/**
 * Python 스크립트 출력을 처리하는 함수
 * 
 * Python에서 출력되는 메시지를 분석하여 적절한 형식으로 UI에 전달합니다.
 * 특히 'TASK_COMPLETED:' 접두어가 있는 완료 메시지를 감지하고 처리합니다.
 * 
 * @param {BrowserWindow} mainWindow - 메시지를 전송할 메인 창 객체
 * @param {string} message - Python 스크립트에서 출력된 메시지
 */
function handlePythonOutput(mainWindow, message) {
    // 작업 완료 메시지 확인 ('TASK_COMPLETED:' 접두어로 시작하는 메시지)
    if (message.startsWith('TASK_COMPLETED:')) {
        try {
            // JSON 데이터 부분 추출 및 파싱
            // 'TASK_COMPLETED:' 이후의 텍스트를 JSON으로 해석
            const jsonData = message.substring('TASK_COMPLETED:'.length);
            const completionData = JSON.parse(jsonData);
            
            // 콘솔에 완료 데이터 기록
            console.log('작업 완료 데이터:', completionData);
            
            // 로그에 작업 완료 메시지 표시 - 기본 완료 메시지
            mainWindow.webContents.send('update-status', `작업이 성공적으로 완료되었습니다!`);
            
            // 수집된 기사 개수 정보 표시
            mainWindow.webContents.send('update-status', `총 ${completionData.articles_count}개의 뉴스 기사가 수집되었습니다.`);
            
            // 작업 소요 시간 정보 표시
            mainWindow.webContents.send('update-status', `소요 시간: ${completionData.elapsed_time}`);
            
            // 저장 경로 정보 표시 - 저장 성공 여부에 따라 다른 메시지 표시
            if (completionData.save_success) {
                // 저장 성공 시 경로 정보 표시
                mainWindow.webContents.send('update-status', `저장 경로: ${completionData.excel_path}`);
                
                // 경로가 변경된 경우 추가 안내 메시지 표시
                // 권한 문제나 파일 충돌로 인해 원래 지정된 경로와 다른 위치에 저장된 경우
                if (completionData.path_changed && completionData.original_path) {
                    mainWindow.webContents.send('update-status', `주의: 원래 요청한 경로(${completionData.original_path})가 아닌 다른 위치에 파일이 저장되었습니다.`);
                }
            } else {
                // 저장 실패 시 오류 메시지 표시
                mainWindow.webContents.send('update-status', `엑셀 저장에 실패했습니다. 다른 경로를 지정해 주세요.`);
            }
            
            // 작업 완료 이벤트 전송 - UI 상태 업데이트를 위해 완료 데이터 함께 전달
            mainWindow.webContents.send('process-finished', completionData);
            
        } catch (error) {
            // JSON 파싱 오류 처리 - 형식이 잘못된 경우
            console.error('완료 데이터 파싱 오류:', error);
            
            // 원본 메시지를 그대로 전달
            mainWindow.webContents.send('update-status', message);
        }
    } else {
        // 일반 메시지는 그대로 UI에 전달 (작업 진행 상황, 디버그 정보 등)
        mainWindow.webContents.send('update-status', message);
    }
}

/**
 * Python 스크립트 실행 함수
 * 
 * 지정된 키워드와 엑셀 저장 경로로 Python 스크립트를 실행합니다.
 * 스크립트 실행 중 출력을 모니터링하고 UI에 상태를 업데이트합니다.
 * 
 * @param {BrowserWindow} mainWindow - 상태 업데이트를 전송할 메인 창 객체
 * @param {Object} config - 애플리케이션 설정 객체 (스크립트 경로 등 포함)
 * @param {Object} data - Python 스크립트에 전달할 데이터 (키워드, 엑셀 경로)
 * @returns {boolean} 실행 성공 여부 (true: 성공, false: 실패)
 */
function runPythonScript(mainWindow, config, data) {
    // 이미 실행 중인 프로세스가 있는 경우 중복 실행 방지
    if (pythonProcess) {
        mainWindow.webContents.send('update-status', "이미 작업이 실행 중입니다.");
        return false;
    }
    
    try {
        // 입력 데이터에서 키워드와 엑셀 저장 경로 추출
        const keywords = data.keywords;
        const excelPath = data.excelPath;
        
        // 키워드가 배열인 경우 쉼표로 구분된 문자열로 변환
        // Python 스크립트에 명령행 인수로 전달하기 위함
        const keywordString = Array.isArray(keywords) ? keywords.join(',') : keywords;
        
        // 설정에서 Python 스크립트 경로 가져오기
        const scriptPath = path.join(__dirname, '..', config.pythonScriptPath);
        console.log("Python 스크립트 경로:", scriptPath);
        
        // 기본 스크립트 경로가 존재하지 않는 경우 대체 경로 시도
        if (!fs.existsSync(scriptPath)) {
            console.error(`Python 스크립트를 찾을 수 없습니다: ${scriptPath}`);
            
            // 설정에 지정된 대체 경로 목록에서 스크립트 탐색
            let found = false;
            for (const altPath of config.alternativeScriptPaths) {
                const fullPath = path.join(__dirname, '..', altPath);
                if (fs.existsSync(fullPath)) {
                    // 대체 경로에서 스크립트를 찾은 경우
                    console.log(`대체 경로에서 스크립트 발견: ${fullPath}`);
                    found = true;
                    
                    // Python 프로세스 시작 - 키워드와 엑셀 경로를 인수로 전달
                    pythonProcess = spawn('python', [fullPath, keywordString, excelPath]);
                    break;
                }
            }
            
            // 모든 경로를 시도했으나 스크립트를 찾지 못한 경우
            if (!found) {
                mainWindow.webContents.send('update-status', `오류: 스크립트 파일을 찾을 수 없습니다.`);
                return false;
            }
        } else {
            // 기본 경로에서 스크립트를 찾은 경우
            // Python 프로세스 시작 - 키워드와 엑셀 경로를 인수로 전달
            pythonProcess = spawn('python', [scriptPath, keywordString, excelPath]);
        }
        
        // 시작된 프로세스 정보 로깅
        console.log(`Python 프로세스 시작, PID: ${pythonProcess.pid}`);
        mainWindow.webContents.send('update-status', "Python 스크립트 실행 중...");
        
        // 표준 출력(stdout) 처리 - Python에서 print()로 출력된 내용
        pythonProcess.stdout.on('data', (data) => {
            const message = data.toString().trim();
            console.log(`Python 표준 출력: ${message}`);
            // 출력 메시지 처리 함수 호출
            handlePythonOutput(mainWindow, message);
        });
        
        // 표준 오류(stderr) 처리 - Python에서 발생한 오류나 경고
        pythonProcess.stderr.on('data', (data) => {
            const message = data.toString().trim();
            console.error(`Python 표준 오류: ${message}`);
            // 오류 메시지를 UI에 표시
            mainWindow.webContents.send('update-status', `오류: ${message}`);
        });
        
        // 프로세스 종료 처리 - 정상 종료 또는 오류로 인한 종료
        pythonProcess.on('close', (code) => {
            console.log(`Python 프로세스 종료, 종료 코드: ${code}`);
            // 프로세스 참조 초기화
            pythonProcess = null;
            
            // UI에 프로세스 종료 신호 전송 (버튼 상태 업데이트용)
            mainWindow.webContents.send('process-finished');
        });
        
        // 프로세스 오류 처리 - 시작 실패 또는 실행 중 발생한 오류
        pythonProcess.on('error', (err) => {
            console.error(`Python 프로세스 오류: ${err.message}`);
            // 프로세스 참조 초기화
            pythonProcess = null;
            
            // UI에 오류 메시지 전송
            mainWindow.webContents.send('update-status', `Python 실행 오류: ${err.message}`);
            mainWindow.webContents.send('process-finished');
        });
        
        // 프로세스 성공적으로 시작됨
        return true;
    } catch (error) {
        // 프로세스 시작 과정에서 발생한 예외 처리
        console.error('Python 스크립트 실행 오류:', error);
        mainWindow.webContents.send('update-status', `작업 시작 오류: ${error.message}`);
        mainWindow.webContents.send('process-finished');
        return false;
    }
}

/**
 * 실행 중인 Python 스크립트 중지 함수
 * 
 * 현재 실행 중인 Python 프로세스를 강제 종료합니다.
 * 운영체제에 따라 다른 종료 방식을 사용합니다.
 * 
 * @param {BrowserWindow} mainWindow - 상태 업데이트를 전송할 메인 창 객체
 * @returns {boolean} 중지 성공 여부 (true: 성공, false: 실패 또는 실행 중인 프로세스 없음)
 */
function stopPythonScript(mainWindow) {
    // 실행 중인 프로세스가 없는 경우
    if (!pythonProcess) {
        console.log("중단할 Python 프로세스가 없습니다");
        mainWindow.webContents.send('update-status', "중단할 작업이 없습니다.");
        return false;
    }
    
    try {
        // Windows 환경에서의 프로세스 종료 (taskkill 명령 사용)
        if (process.platform === 'win32') {
            const { exec } = require('child_process');
            console.log(`Python 프로세스 강제 종료 시도 (PID: ${pythonProcess.pid})`);
            
            // /T: 모든 하위 프로세스 포함, /F: 강제 종료
            exec(`taskkill /pid ${pythonProcess.pid} /T /F`, (error, stdout, stderr) => {
                if (error) {
                    // 종료 실패 처리
                    console.error("프로세스 강제 종료 실패:", error);
                    mainWindow.webContents.send('update-status', `작업 중단 실패: ${error.message}`);
                } else {
                    // 종료 성공 처리
                    console.log("프로세스 강제 종료 성공:", stdout);
                    mainWindow.webContents.send('update-status', "작업이 성공적으로 중단되었습니다.");
                }
            });
        } else {
            // Linux/Mac 환경에서의 프로세스 종료 (SIGTERM 신호 사용)
            console.log(`Python 프로세스에 SIGTERM 신호 전송 (PID: ${pythonProcess.pid})`);
            pythonProcess.kill('SIGTERM');
            mainWindow.webContents.send('update-status', "작업 중단 신호가 전송되었습니다.");
        }
        
        // 프로세스 참조 초기화
        pythonProcess = null;
        return true;
    } catch (error) {
        // 프로세스 종료 과정에서 발생한 예외 처리
        console.error("프로세스 종료 중 예외 발생:", error);
        mainWindow.webContents.send('update-status', `작업 중단 중 오류 발생: ${error.message}`);
        return false;
    }
}

/**
 * 애플리케이션 종료 시 실행 중인 Python 프로세스 정리 함수
 * 
 * 애플리케이션이 종료될 때 실행 중인 모든 Python 프로세스를 강제 종료합니다.
 * 이는 좀비 프로세스가 남는 것을 방지하기 위함입니다.
 */
function cleanup() {
    if (pythonProcess) {
        console.log('애플리케이션 종료 중, Python 프로세스 정리');
        try {
            // Windows 환경에서는 taskkill 명령 사용
            if (process.platform === 'win32') {
                const { execSync } = require('child_process');
                execSync(`taskkill /pid ${pythonProcess.pid} /T /F`);
            } else {
                // Linux/Mac 환경에서는 SIGTERM 신호 사용
                pythonProcess.kill('SIGTERM');
            }
        } catch (error) {
            // 프로세스 종료 실패 시 오류 로깅
            console.error('Python 프로세스 종료 중 오류:', error);
        }
        // 프로세스 참조 초기화
        pythonProcess = null;
    }
}

/**
 * Python 프로세스 실행 상태 확인 함수
 * 
 * 현재 Python 스크립트가 실행 중인지 확인합니다.
 * 
 * @returns {boolean} 실행 중 여부 (true: 실행 중, false: 실행 중이 아님)
 */
function isRunning() {
    return pythonProcess !== null;
}

// 모듈 내보내기 - 다른 파일에서 이 함수들을 사용할 수 있도록 함
module.exports = {
    runPythonScript,   // Python 스크립트 실행 함수
    stopPythonScript,  // 실행 중인 스크립트 중지 함수
    isRunning,         // 실행 상태 확인 함수
    cleanup            // 종료 시 정리 함수
};