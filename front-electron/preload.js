/**
 * 프리로드 스크립트 (preload.js)
 * 
 * 이 스크립트는 렌더러 프로세스가 로드되기 전에 실행되며,
 * 보안이 강화된 환경에서 Node.js와 Electron API에 제한적으로 접근할 수 있는
 * 인터페이스를 제공합니다.
 */

try {
    // Electron 모듈에서 필요한 컴포넌트 가져오기
    const { contextBridge, ipcRenderer } = require('electron');

    /**
     * 메인 프로세스로 메시지를 보낼 수 있는 허용된 채널 목록
     * 보안을 위해 화이트리스트 방식으로 명시적으로 허용된 채널만 사용 가능
     */
    const validSendChannels = [
        'run-automation',        // 자동화 작업 실행 요청
        'stop-automation',       // 실행 중인 자동화 작업 중지 요청
        'select-excel-path',     // 엑셀 파일 저장 경로 선택 대화상자 요청
        'confirm-stop-automation', // 작업 중단 확인 대화상자 요청
        'save-log',              // 로그 저장 요청
        'toggle-dev-tools',      // 개발자 도구 토글 요청
        'open-dev-tools',        // 개발자 도구 열기 요청
        'show-save-dialog'       // 저장 대화상자 표시 요청
    ];

    /**
     * 메인 프로세스로부터 메시지를 받을 수 있는 허용된 채널 목록
     * 보안을 위해 화이트리스트 방식으로 명시적으로 허용된 채널만 사용 가능
     */
    const validReceiveChannels = [
        'update-status',         // 상태 업데이트 메시지 수신
        'excel-path-selected',   // 선택된 엑셀 파일 경로 수신
        'stop-automation-response', // 작업 중단 확인 응답 수신
        'log-saved',             // 로그 저장 결과 수신
        'process-finished',      // 프로세스 종료 알림 수신
        'dev-tools-toggled',     // 개발자 도구 상태 변경 알림 수신
        'log-save-canceled'      // 로그 저장 취소 알림 수신
    ];
    
    // 프리로드 스크립트 실행 시작 로그
    console.log('프리로드 스크립트 실행 중...');
    
    /**
     * 안전한 IPC 통신 인터페이스 노출
     * 
     * contextBridge를 통해 렌더러 프로세스에서 사용할 수 있는
     * 제한된 IPC 통신 기능을 제공합니다.
     * 전체 ipcRenderer 객체를 노출하지 않고, 안전한 래퍼 함수만 제공합니다.
     */
    contextBridge.exposeInMainWorld('electron', {
        /**
         * 메인 프로세스로 메시지를 보내는 함수
         * 
         * @param {string} channel - 메시지를 보낼 채널 이름
         * @param {any} data - 전송할 데이터
         */
        send: (channel, data) => {
            // 채널 이름 유효성 검사 (화이트리스트 확인)
            if (validSendChannels.includes(channel)) {
                // 전송 로그 기록 (로그 데이터는 크기만 표시하여 콘솔 오버플로우 방지)
                console.log(`채널 ${channel}로 전송:`, 
                    channel === 'save-log' ? '로그 데이터 (길이: ' + data.length + ')' : data);
                
                // 실제 IPC 메시지 전송
                ipcRenderer.send(channel, data);
            } else {
                // 허용되지 않은 채널 사용 시도 경고
                console.warn(`허용되지 않은 채널로의 전송 시도: ${channel}`);
            }
        },
        
        /**
         * 메인 프로세스로부터 메시지를 받는 함수
         * 
         * @param {string} channel - 메시지를 수신할 채널 이름
         * @param {Function} func - 메시지 수신 시 실행할 콜백 함수
         */
        receive: (channel, func) => {
            // 유효한 수신 채널 목록
            const validChannels = [
                'update-status',         // 상태 업데이트 메시지
                'excel-path-selected',   // 선택된 엑셀 파일 경로
                'stop-automation-response', // 작업 중단 확인 응답
                'log-saved',             // 로그 저장 결과
                'process-finished',      // 프로세스 종료 알림
                'dev-tools-toggled',     // 개발자 도구 상태 변경 알림
                'log-save-canceled'      // 로그 저장 취소 알림
            ];
            
            // 채널 이름 유효성 검사 (화이트리스트 확인)
            if (validChannels.includes(channel)) {
                // 채널 핸들러 등록 로그
                console.log(`채널 ${channel}에 대한 핸들러 등록`);
                
                // IPC 이벤트 리스너 등록
                // 의도적으로 event 객체는 제거 (sender 정보 등 보안 민감 정보 포함)
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            } else {
                // 허용되지 않은 채널 수신 시도 경고
                console.warn(`허용되지 않은 채널로부터의 수신 시도: ${channel}`);
            }
        }
    });
    
    // 프리로드 스크립트 완료 로그
    console.log('프리로드 스크립트 완료');
} catch (error) {
    // 프리로드 스크립트 실행 중 오류 발생 시 로그
    console.error('프리로드 스크립트 오류:', error);
}