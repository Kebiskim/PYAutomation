# 1. 프로그램 소개
이 프로그램은 키워드를 기반으로 네이버 검색 후 상위 10건의 제목, 언론사, 요약 내용, URL을 엑셀로 저장합니다.

---

# 2. Project 실행을 위한 사전 준비사항

## Install Python Modules
```
pip install PyQt5, selenium, pandas, openpyxl
```

## Install node modules
```
npm install electron --save-dev
```

---

### 참고: Project Structure
```
Automation_Framework/
│
├── electron-ui/                  # Electron 프론트엔드 
│   ├── index.html                # 메인 HTML 구조
│   ├── preload.js                # 보안 IPC 통신을 위한 프리로드 스크립트
│   ├── main.js                   # Electron 메인 프로세스
│   ├── modules/                  # 모듈화된 코드 구조
│   │   ├── config-manager.js     # 설정 관리 모듈
│   │   ├── ipc-handler.js        # IPC 통신 핸들러
│   │   ├── menubar.js            # 메뉴바 관련 기능
│   │   ├── python-runner.js      # Python 실행 관련 모듈
│   │   └── window-manager.js     # 윈도우 관리 모듈
│   ├── scripts/                  # 렌더러 프로세스 스크립트
│   │   └── app.js                # 메인 애플리케이션 로직
│   ├── styles/                   # CSS 스타일
│   │   ├── global.css            # 전역 스타일
│   │   ├── index.css             # 메인 인덱스 스타일
│   │   ├── menu.css              # 메뉴 스타일
│   │   ├── menu-custom.css       # 커스텀 메뉴 스타일
│   │   └── page-automation.css   # 자동화 페이지 스타일
│   └── renderer.js               # 렌더러 프로세스 진입점
│
├── automation-back/              # Python 백엔드
│   ├── news_scraper_byKeyword.py # 뉴스 자동화 스크립트
│   └── utils.py                  # 유틸리티 함수
│
├── config.json                   # 애플리케이션 설정 파일
├── main.py                       #
├── package.json                  # 프로젝트 의존성 및 스크립트
└── README.md                     # 프로젝트 문서화
```