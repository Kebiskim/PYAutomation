// Main application logic

// DOM Ready event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
});

function initApp() {
    // 레이아웃 설정
    updateKeywordLayout();
    
    // Event listeners
    setupEventListeners();
    
    // 초기 로그 메시지
    appendToLog('프로그램이 시작되었습니다. 엑셀 저장 경로 및 검색 키워드를 입력하고 작업을 시작하세요.');
}

function setupEventListeners() {
    // 로그 지우기
    document.getElementById('clearLog').addEventListener('click', function() {
        document.getElementById('logOutput').value = '';
    });
    
    // 로그 저장
    document.getElementById('saveLog').addEventListener('click', function() {
        const logContent = document.getElementById('logOutput').value;
        if (logContent.trim() === '') {
            appendToLog('저장할 로그가 없습니다.');
            return;
        }
        
        appendToLog('로그 저장 중...');
        console.log('Sending log content to main process, length:', logContent.length);
        
        // Use a timeout to ensure the UI updates before sending the potentially large log
        setTimeout(() => {
            window.electron.send('save-log', logContent);
        }, 100);
    });
    
    // 파일 경로 선택 이벤트 - 버튼과 입력 필드 모두에 연결
    document.getElementById('selectPath').addEventListener('click', openFileDialog);
    document.getElementById('excelPath').addEventListener('click', openFileDialog);
    
    // 입력 필드에 마우스 올리면 커서 변경 (클릭 가능함을 시각적으로 표시)
    document.getElementById('excelPath').addEventListener('mouseover', function() {
        this.style.cursor = 'pointer';
    });
    
    // 작업 시작 버튼 클릭 이벤트
    document.getElementById('runAutomation').addEventListener('click', function() {
        const formData = validateForm();
        
        // 폼이 유효하면 작업 시작
        if (formData) {
            this.style.display = 'none';
            document.getElementById('stopAutomation').style.display = 'block';
            
            appendToLog(`작업을 시작합니다. 키워드: ${formData.keywords.join(', ')}`);
            appendToLog(`저장 위치: ${formData.excelPath}`);
            
            // 키워드와 경로를 메인 프로세스로 전송
            window.electron.send('run-automation', formData);
        }
    });
    
    // 작업 중단 버튼 클릭 이벤트
    document.getElementById('stopAutomation').addEventListener('click', function() {
        // 작업 중단 전 확인 대화상자 표시
        window.electron.send('confirm-stop-automation');
    });
    
    // IPC event handlers
    setupIpcEventHandlers();
}

function setupIpcEventHandlers() {
    // 메인 프로세스로부터 선택된 경로 받기
    window.electron.receive('excel-path-selected', function(path) {
        document.getElementById('excelPath').value = path;
        // 경로가 선택되면 오류 메시지 숨기기
        document.getElementById('path-error-message').style.display = 'none';
        appendToLog(`엑셀 저장 경로가 설정되었습니다: ${path}`);
    });
    
    // 작업 중단 확인 응답 처리
    window.electron.receive('stop-automation-response', function(shouldStop) {
        if (shouldStop) {
            // 사용자가 Yes를 선택한 경우
            document.getElementById('stopAutomation').style.display = 'none';
            document.getElementById('runAutomation').style.display = 'block';
            
            appendToLog('작업을 중단합니다...');
            
            // 작업 중단 명령을 메인 프로세스로 전송
            window.electron.send('stop-automation');
        } else {
            appendToLog('작업 중단이 취소되었습니다.');
        }
    });
    
    // 파이썬 스크립트 업데이트 처리
    window.electron.receive('update-status', function(message) {
        appendToLog(message);
    });
    
    // 로그 저장 결과 처리
    window.electron.receive('log-saved', function(result) {
        if (result.success) {
            appendToLog(`로그가 저장되었습니다: ${result.path}`);
        } else {
            appendToLog(`로그 저장 실패: ${result.error}`);
        }
    });
}

// Add this to setupIpcEventHandlers function

function setupIpcEventHandlers() {
    // Existing handlers...
    
    // 메인 프로세스로부터 선택된 경로 받기
    window.electron.receive('excel-path-selected', function(path) {
        document.getElementById('excelPath').value = path;
        // 경로가 선택되면 오류 메시지 숨기기
        document.getElementById('path-error-message').style.display = 'none';
        appendToLog(`엑셀 저장 경로가 설정되었습니다: ${path}`);
    });
    
    // 작업 중단 확인 응답 처리
    window.electron.receive('stop-automation-response', function(shouldStop) {
        if (shouldStop) {
            // 사용자가 Yes를 선택한 경우
            document.getElementById('stopAutomation').style.display = 'none';
            document.getElementById('runAutomation').style.display = 'block';
            
            appendToLog('작업을 중단합니다...');
            
            // 작업 중단 명령을 메인 프로세스로 전송
            window.electron.send('stop-automation');
        } else {
            appendToLog('작업 중단이 취소되었습니다.');
        }
    });
    
    // 파이썬 스크립트 업데이트 처리
    window.electron.receive('update-status', function(message) {
        appendToLog(message);
    });
    
    // 로그 저장 결과 처리
    window.electron.receive('log-saved', function(result) {
        if (result.success) {
            appendToLog(`로그가 저장되었습니다: ${result.path}`);
        } else {
            appendToLog(`로그 저장 실패: ${result.error}`);
        }
    });
    
    // 개발자 도구 토글 응답 처리
    window.electron.receive('dev-tools-toggled', function(enabled) {
        appendToLog(`개발자 도구가 ${enabled ? '활성화' : '비활성화'} 되었습니다.`);
        if (enabled) {
            appendToLog('F12 또는 Ctrl+Shift+I 단축키로 개발자 도구를 열 수 있습니다.');
        }
    });
    
    // 프로세스 완료 처리
    window.electron.receive('process-finished', function() {
        document.getElementById('stopAutomation').style.display = 'none';
        document.getElementById('runAutomation').style.display = 'block';
    });
}

// 레이아웃 설정
function updateKeywordLayout() {
    const keywordsGrid = document.getElementById('keywords-grid');
    const keywordRows = keywordsGrid.querySelectorAll('.keyword-row');
    
    // 레이아웃 초기화
    keywordRows.forEach(row => {
        row.style.width = '';
        row.style.marginRight = '';
    });
    
    // 그리드 레이아웃 설정
    keywordRows.forEach((row, index) => {
        row.style.width = 'calc(50% - 10px)'; // 너비의 절반에서 약간의 여백 제외
        row.style.marginRight = (index % 2 === 0) ? '20px' : '0'; // 홀수 인덱스는 오른쪽 여백
    });
}

// 로그 추가 함수
function appendToLog(message) {
    const logOutput = document.getElementById('logOutput');
    const timestamp = new Date().toLocaleTimeString();
    logOutput.value += `[${timestamp}] ${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight; // 자동 스크롤
}

// 파일 경로 선택 다이얼로그 열기
function openFileDialog() {
    window.electron.send('select-excel-path');
}

// 폼 유효성 검사
function validateForm() {
    // 1. 키워드 검사
    const keywordInputs = document.querySelectorAll('.keyword-input');
    const keywords = [];
    
    // 비어있지 않은 키워드만 수집
    keywordInputs.forEach(input => {
        const keyword = input.value.trim();
        if (keyword) {
            keywords.push(keyword);
        }
    });
    
    // 키워드가 없으면 오류 메시지 표시
    if (keywords.length === 0) {
        document.getElementById('error-message').style.display = 'block';
        appendToLog('오류: 최소 하나의 키워드를 입력해주세요.');
        return null;
    } else {
        document.getElementById('error-message').style.display = 'none';
    }
    
    // 2. 엑셀 경로 검사
    const excelPath = document.getElementById('excelPath').value.trim();
    if (!excelPath) {
        document.getElementById('path-error-message').style.display = 'block';
        appendToLog('오류: 엑셀 저장 경로를 지정해주세요.');
        
        // 경로 입력 필드에 포커스 주기
        document.getElementById('excelPath').focus();
        
        // 경로 입력 필드 깜빡임 효과
        flashElement('excelPath');
        return null;
    } else {
        document.getElementById('path-error-message').style.display = 'none';
    }
    
    // 모든 검증 통과
    return {
        keywords: keywords,
        excelPath: excelPath
    };
}

// 요소에 깜빡임 효과를 주는 함수
function flashElement(elementId) {
    const element = document.getElementById(elementId);
    let count = 0;
    
    // 깜빡임 효과 타이머
    const interval = setInterval(() => {
        if (count >= 6) { // 3번 깜빡임 (on-off 3쌍)
            clearInterval(interval);
            element.style.borderColor = ''; // 원래 스타일로
            return;
        }
        
        element.style.borderColor = count % 2 === 0 ? '#ff5252' : '';
        count++;
    }, 200); // 0.2초 간격
}