## Install Python Modules
```
pip install PyQt5
```

## Install node modules
npm install electron --save-dev


## Project Structure
```
Automation_Framework/
│
├── electron-ui/            # Electron frontend for UI (HTML/CSS)
│   ├── index.html          # HTML structure
│   ├── preload.js          
│   ├── main.js          
│   ├── styles/             # CSS 파일을 관리하는 폴더
│   │   ├── global.css      # 전역 스타일
│   │   └── page-automation.css  # 페이지별 스타일
│   └── renderer.js         # JS for managing interactions with the UI
│
├── automation-back/        # Python backend for automation logic
│   ├── __init__.py         # Initialization file
│   ├── news_scraper_byKeyword.py # Selenium automation scripts
│   ├── pandas_automation.py    # Pandas automation scripts
│   └── utils.py            # Helper functions (e.g., logging, error handling)
│
├── main.py                 # Python entry point (runs the automation logic)
├── package.json            # Electron dependencies and script
└── README.md               # Project documentation

```