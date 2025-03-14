/**
 * 렌더러 스크립트 (renderer.js)
 * 
 * 이 파일은 Electron 애플리케이션의 렌더러 프로세스에서 실행되며,
 * 사용자 인터페이스의 이벤트 처리와 메인 프로세스와의 통신을 담당합니다.
 * 
 * 주의: 여기서는 Node.js의 require를 직접 사용하지 않습니다.
 * 대신 preload.js에서 노출한 안전한 API를 사용합니다.
 */

/**
 * DOM이 완전히 로드된 후 실행되는 이벤트 리스너
 * 모든 UI 요소에 접근하고 이벤트 핸들러를 설정합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 렌더러 스크립트 로드 완료 로그
    console.log("렌더러 스크립트가 로드되었습니다");
    
    /**
     * '작업 실행' 버튼 클릭 이벤트 핸들러
     * 키워드를 수집하고 자동화 작업을 시작합니다.
     */
    document.getElementById('runAutomation').addEventListener('click', () => {
        // 버튼 클릭 로그 기록
        console.log("작업 실행 버튼이 클릭되었습니다");
        
        // 키워드 입력 필드 모두 가져오기 (여러 키워드 지원)
        const keywordInputs = document.querySelectorAll('.keyword-input');
        const keywords = [];
        
        // 비어있지 않은 키워드만 수집
        keywordInputs.forEach(input => {
            // 입력값 앞뒤 공백 제거
            const keyword = input.value.trim();
            // 값이 있는 경우에만 배열에 추가
            if (keyword) {
                keywords.push(keyword);
            }
        });
        
        // 최소 하나의 키워드가 있는지 확인
        if (keywords.length === 0) {
            // 키워드가 없는 경우 오류 메시지 표시
            document.getElementById('error-message').style.display = 'block';
            return; // 추가 작업 수행 중단
        } else {
            // 키워드가 있는 경우 오류 메시지 숨김
            document.getElementById('error-message').style.display = 'none';
        }
        
        // 상태 메시지 업데이트로 작업 중임을 사용자에게 알림
        document.getElementById('status').textContent = '상태: 작업 중...';
        
        // 검색할 키워드 로그 출력
        console.log("검색할 키워드:", keywords);
        
        // 키워드를 메인 프로세스로 전송하여 자동화 작업 시작 요청
        window.electron.send('run-automation', keywords);
    });
    
    /**
     * 메인 프로세스로부터 상태 업데이트 수신 이벤트 핸들러
     * 작업 진행 상태를 UI에 표시합니다.
     * 
     * @param {string} message - 상태 메시지
     */
    window.electron.receive('update-status', (message) => {
        // 수신된 상태 업데이트 로그
        console.log("상태 업데이트 수신:", message);
        
        // 상태 메시지 UI 업데이트
        document.getElementById('status').textContent = '상태: ' + message;
    });
    
    /**
     * 엑셀 경로 선택 버튼 이벤트 핸들러
     * 파일 저장 대화상자를 열어 엑셀 파일 저장 위치를 선택합니다.
     */
    document.getElementById('selectExcelPath').addEventListener('click', () => {
        // 경로 선택 요청을 메인 프로세스로 전송
        console.log("엑셀 파일 경로 선택 버튼 클릭됨");
        window.electron.send('select-excel-path');
    });
    
    /**
     * 선택된 엑셀 경로 수신 이벤트 핸들러
     * 사용자가 선택한 파일 경로를 UI에 표시합니다.
     * 
     * @param {string} path - 선택된 파일 경로
     */
    window.electron.receive('excel-path-selected', (path) => {
        console.log("선택된 엑셀 경로:", path);
        document.getElementById('excelPath').value = path;
    });
    
    /**
     * 작업 중지 버튼 이벤트 핸들러
     * 실행 중인 자동화 작업을 중지하도록 요청합니다.
     */
    document.getElementById('stopAutomation').addEventListener('click', () => {
        console.log("작업 중지 버튼 클릭됨");
        window.electron.send('confirm-stop-automation');
    });
    
    /**
     * 작업 중지 확인 응답 수신 이벤트 핸들러
     * 사용자가 작업 중지 확인 대화상자에서 선택한 결과에 따라 처리합니다.
     * 
     * @param {boolean} shouldStop - 작업을 중지할지 여부
     */
    window.electron.receive('stop-automation-response', (shouldStop) => {
        console.log("작업 중지 응답:", shouldStop);
        
        if (shouldStop) {
            // 사용자가 중지를 확인한 경우 메인 프로세스에 중지 요청 전송
            window.electron.send('stop-automation');
            document.getElementById('status').textContent = '상태: 작업 중지 중...';
        }
        // 중지하지 않기로 한 경우에는 아무 작업도 수행하지 않음
    });
    
    /**
     * 프로세스 종료 이벤트 수신 핸들러
     * 작업이 완료되었을 때 UI 상태를 업데이트합니다.
     */
    window.electron.receive('process-finished', (data) => {
        console.log("프로세스 종료 이벤트 수신:", data);
        
        // 버튼 상태 변경 (중지 버튼 숨기고 실행 버튼 표시)
        document.getElementById('stopAutomation').style.display = 'none';
        document.getElementById('runAutomation').style.display = 'block';
    });
    
    // 모든 이벤트 리스너 연결 완료 로그
    console.log("모든 이벤트 리스너가 연결되었습니다");
});