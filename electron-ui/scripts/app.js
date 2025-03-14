// 메인 애플리케이션 로직

// DOM이 완전히 로드된 후 실행되는 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 앱 초기화 함수 호출
    initApp();
});

/**
 * 애플리케이션 초기화 함수
 * - 키워드 레이아웃을 설정하고 이벤트 리스너를 등록하며 초기 로그 메시지를 표시
 */
function initApp() {
    // 키워드 입력 필드의 레이아웃 설정 (2열 그리드 구조)
    updateKeywordLayout();
    
    // 모든 이벤트 리스너 설정 (버튼 클릭, 입력 필드 이벤트 등)
    setupEventListeners();
    
    // 프로그램 시작 시 초기 안내 메시지를 로그 영역에 표시
    appendToLog('프로그램이 시작되었습니다. 엑셀 저장 경로 및 검색 키워드를 입력하고 작업을 시작하세요.');
}

/**
 * 이벤트 리스너 설정 함수
 * - 사용자 인터페이스의 모든 상호작용 요소(버튼, 입력 필드 등)에 이벤트 리스너를 연결
 */
function setupEventListeners() {
    // 로그 지우기 버튼 클릭 시 로그 영역을 비움
    document.getElementById('clearLog').addEventListener('click', function() {
        document.getElementById('logOutput').value = '';
    });

    /**
     * 로그 저장 버튼 클릭 이벤트 핸들러
     * - 로그 내용을 확인하고 저장 다이얼로그를 열어 파일로 저장
     */
    document.getElementById('saveLog').addEventListener('click', function() {
        // 현재 로그 출력 영역의 내용 가져오기
        const logContent = document.getElementById('logOutput').value;
        
        // 로그 내용이 비어있는 경우 저장하지 않고 안내 메시지 출력
        if (logContent.trim() === '') {
            appendToLog('저장할 로그가 없습니다.');
            return;
        }
        
        // 저장 다이얼로그를 열기 전 사용자에게 알림
        appendToLog('로그 저장 다이얼로그를 여는 중...');
        
        // 메인 프로세스에 로그 내용과 함께 저장 다이얼로그를 표시하도록 요청
        window.electron.send('show-save-dialog', logContent);
    });
    
    /**
     * 파일 경로 선택 이벤트 설정
     * - 엑셀 저장 경로 선택 버튼과 경로 표시 텍스트 필드 모두에 클릭 이벤트 연결
     */
    document.getElementById('selectPath').addEventListener('click', openFileDialog);
    document.getElementById('excelPath').addEventListener('click', openFileDialog);
    
    /**
     * 엑셀 경로 입력 필드 마우스 오버 이벤트
     * - 클릭 가능함을 시각적으로 표시하기 위해 커서 스타일 변경
     */
    document.getElementById('excelPath').addEventListener('mouseover', function() {
        this.style.cursor = 'pointer';
    });
    
    /**
     * 작업 시작 버튼 클릭 이벤트 핸들러
     * - 폼 유효성 검사 후 검색 자동화 작업 시작
     */
    document.getElementById('runAutomation').addEventListener('click', function() {
        // 폼 유효성 검사 실행 (키워드 및 경로 확인)
        const formData = validateForm();
        
        // 폼이 유효한 경우에만 작업 시작
        if (formData) {
            // 시작 버튼 숨기고 중지 버튼 표시
            this.style.display = 'none';
            document.getElementById('stopAutomation').style.display = 'block';
            
            // 작업 시작을 로그에 기록 (선택한 키워드와 저장 경로 표시)
            appendToLog(`작업을 시작합니다. 검색 키워드: ${formData.keywords.join(', ')}`);
            
            // 검색할 키워드와 저장 경로 정보를 메인 프로세스에 전달하여 자동화 시작
            window.electron.send('run-automation', formData);
        }
    });
    
    /**
     * 작업 중단 버튼 클릭 이벤트 핸들러
     * - 현재 실행 중인 자동화 작업 중단 요청
     */
    document.getElementById('stopAutomation').addEventListener('click', function() {
        // 작업 중단 전 사용자에게 확인 대화상자 표시 요청
        window.electron.send('confirm-stop-automation');
    });
    
    // IPC(프로세스 간 통신) 이벤트 핸들러 설정
    setupIpcEventHandlers();
}

/**
 * IPC 이벤트 핸들러 설정 함수
 * - 메인 프로세스와 렌더러 프로세스(UI) 사이의 통신을 처리
 * - 메인 프로세스로부터 오는 다양한 이벤트를 수신하고 처리
 */
function setupIpcEventHandlers() {
    /**
     * 엑셀 경로 선택 이벤트 결과 처리
     * - 사용자가 파일 선택 다이얼로그에서 경로를 선택하면 해당 경로를 입력 필드에 표시
     */
    window.electron.receive('excel-path-selected', function(path) {
        // 선택된 경로를 입력 필드에 설정
        document.getElementById('excelPath').value = path;
        // 경로가 선택되었으므로 오류 메시지가 있다면 숨김
        document.getElementById('path-error-message').style.display = 'none';
        // 선택된 경로를 로그에 기록
        appendToLog(`엑셀 저장 경로가 설정되었습니다: ${path}`);
    });
    
    /**
     * 작업 중단 확인 대화상자 응답 처리
     * - 사용자가 중단 확인 대화상자에서 선택한 결과에 따라 작업 중단 여부 결정
     */
    window.electron.receive('stop-automation-response', function(shouldStop) {
        if (shouldStop) {
            // 사용자가 '예'를 선택한 경우 작업 중단 진행
            // 중단 버튼 숨기고 시작 버튼 표시
            document.getElementById('stopAutomation').style.display = 'none';
            document.getElementById('runAutomation').style.display = 'block';
            
            // 작업 중단 시작을 로그에 기록
            appendToLog('작업을 중단합니다...');
            
            // 메인 프로세스에 작업 중단 명령 전송
            window.electron.send('stop-automation');
        } else {
            // 사용자가 '아니오'를 선택한 경우 작업 계속 진행
            appendToLog('작업 중단이 취소되었습니다.');
        }
    });
    
    /**
     * 파이썬 스크립트 상태 메시지 처리
     * - 파이썬 스크립트에서 전송된 상태 메시지를 로그 영역에 표시
     */
    window.electron.receive('update-status', function(message) {
        appendToLog(message);
    });

    /**
     * 작업 완료 이벤트 처리
     * - 파이썬 스크립트 작업이 완료되면 결과 정보를 표시
     */
    window.electron.receive('process-finished', function(data) {
        document.getElementById('stopAutomation').style.display = 'none';
        document.getElementById('runAutomation').style.display = 'block';

        // 작업 완료 데이터가 있는 경우에만 추가 정보 표시
        if (data && typeof data === 'object') {
            // 저장 경로가 변경된 경우 UI 업데이트
            if (data.excel_path && data.excel_path !== document.getElementById('excelPath').value) {
                document.getElementById('excelPath').value = data.excel_path;
                appendToLog(`엑셀 파일이 다른 위치에 저장되었습니다: ${data.excel_path}`);
            }
            
            // 저장 실패한 경우 안내 메시지 표시
            if (data.save_success === false) {
                appendToLog('엑셀 파일 저장에 문제가 발생했습니다. 다른 경로를 지정하세요.');
            }
        }
    });
    
    /**
     * 로그 저장 결과 처리
     * - 로그 파일 저장 시도 후 성공 또는 실패 결과를 로그에 표시
     */
    window.electron.receive('log-saved', function(result) {
        if (result.success) {
            // 로그 저장 성공 시 저장 위치와 함께 성공 메시지 표시
            appendToLog(`로그가 저장되었습니다: ${result.path}`);
        } else {
            // 로그 저장 실패 시 오류 메시지 표시
            appendToLog(`로그 저장 실패: ${result.error}`);
        }
    });

    /**
     * 로그 저장 취소 이벤트 처리
     * - 사용자가 로그 저장 대화상자에서 취소하거나 창을 닫았을 때의 처리
     */
    window.electron.receive('log-save-canceled', function() {
        appendToLog('로그 저장이 취소되었습니다.');
    });
}

/**
 * 키워드 입력 레이아웃 설정 함수
 * - 키워드 입력 필드를 2열 그리드 형태로 배치
 */
function updateKeywordLayout() {
    // 키워드 입력 필드가 있는 컨테이너 요소 참조
    const keywordsGrid = document.getElementById('keywords-grid');
    // 모든 키워드 입력 행 요소 가져오기
    const keywordRows = keywordsGrid.querySelectorAll('.keyword-row');
    
    // 기존 레이아웃 스타일 제거
    keywordRows.forEach(row => {
        row.style.width = '';
        row.style.marginRight = '';
    });
    
    // 그리드 레이아웃 스타일 적용 (2열 구조)
    keywordRows.forEach((row, index) => {
        // 각 행의 너비를 전체 너비의 절반(50%)에서 여백을 제외한 크기로 설정
        row.style.width = 'calc(50% - 10px)';
        // 짝수 인덱스(왼쪽 열) 요소에만 오른쪽 여백 추가
        row.style.marginRight = (index % 2 === 0) ? '20px' : '0';
    });
}

/**
 * 로그 메시지 추가 함수
 * - 현재 시간과 함께 메시지를 로그 출력 영역에 추가
 * @param {string} message - 로그에 추가할 메시지
 */
function appendToLog(message) {
    // 로그 출력 영역 요소 참조
    const logOutput = document.getElementById('logOutput');
    // 현재 시간을 HH:MM:SS 형식으로 가져오기
    const timestamp = new Date().toLocaleTimeString();
    // 시간 정보와 함께 메시지를 로그에 추가
    logOutput.value += `[${timestamp}] ${message}\n`;
    // 로그 영역을 자동으로 스크롤하여 최신 메시지가 보이도록 함
    logOutput.scrollTop = logOutput.scrollHeight;
}

/**
 * 파일 선택 대화상자 열기 함수
 * - 엑셀 파일 저장 위치를 선택하기 위한 시스템 대화상자 표시
 */
function openFileDialog() {
    // 메인 프로세스에 엑셀 경로 선택 대화상자 표시 요청
    window.electron.send('select-excel-path');
}

/**
 * 폼 유효성 검사 함수
 * - 키워드 입력과 엑셀 저장 경로가 유효한지 검사
 * @returns {Object|null} 검증 통과 시 키워드와 경로 정보, 실패 시 null
 */
function validateForm() {
    // 1. 키워드 입력 검사
    // 모든 키워드 입력 필드 가져오기
    const keywordInputs = document.querySelectorAll('.keyword-input');
    const keywords = [];
    
    // 비어있지 않은 키워드만 수집
    keywordInputs.forEach(input => {
        const keyword = input.value.trim();
        if (keyword) {
            keywords.push(keyword);
        }
    });
    
    // 최소 하나 이상의 키워드가 입력되었는지 검사
    if (keywords.length === 0) {
        // 키워드가 없으면 오류 메시지 표시
        document.getElementById('error-message').style.display = 'block';
        appendToLog('오류: 최소 하나의 키워드를 입력해주세요.');
        return null;
    } else {
        // 키워드가 있으면 오류 메시지 숨김
        document.getElementById('error-message').style.display = 'none';
    }
    
    // 2. 엑셀 저장 경로 검사
    const excelPath = document.getElementById('excelPath').value.trim();
    // 엑셀 저장 경로가 입력되었는지 검사
    if (!excelPath) {
        // 경로가 없으면 오류 메시지 표시
        document.getElementById('path-error-message').style.display = 'block';
        appendToLog('오류: 엑셀 저장 경로를 지정해주세요.');
        
        // 경로 입력 필드에 포커스 설정
        document.getElementById('excelPath').focus();
        
        // 경로 입력 필드에 시각적 경고 효과 표시
        flashElement('excelPath');
        return null;
    } else {
        // 경로가 있으면 오류 메시지 숨김
        document.getElementById('path-error-message').style.display = 'none';
    }
    
    // 모든 검증을 통과하면 키워드와 경로 정보 반환
    return {
        keywords: keywords,
        excelPath: excelPath
    };
}

/**
 * 요소에 깜빡임 경고 효과를 주는 함수
 * - 유효성 검사 실패 시 시각적 피드백 제공
 * @param {string} elementId - 깜빡임 효과를 적용할 요소의 ID
 */
function flashElement(elementId) {
    // 대상 요소 참조
    const element = document.getElementById(elementId);
    let count = 0;
    
    // 일정 간격으로 테두리 색상을 변경하는 타이머 설정
    const interval = setInterval(() => {
        // 총 6번 색상이 변경되면 중지 (3번의 깜빡임 = 3회의 on-off 사이클)
        if (count >= 6) {
            clearInterval(interval);
            element.style.borderColor = ''; // 원래 테두리 스타일로 복원
            return;
        }
        
        // 깜빡임 효과: 짝수 카운트에서는 빨간색, 홀수 카운트에서는 원래 색상
        element.style.borderColor = count % 2 === 0 ? '#ff5252' : '';
        count++;
    }, 200); // 0.2초(200밀리초) 간격으로 색상 변경
}