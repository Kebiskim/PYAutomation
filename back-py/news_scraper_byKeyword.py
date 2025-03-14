import json
import sys
import os
import pandas as pd
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 상태 메시지를 Electron에 전달하는 함수
def send_status_to_electron(message):
    """
    특별한 형식으로 메시지를 출력하여 Electron에서 이를 감지하도록 합니다.
    
    매개변수:
    - message: Electron에 전달할 메시지 내용
    """
    # 일반 로그로도 출력하여 콘솔에서 확인 가능하게 함
    print(message)
    
    # Electron이 인식할 수 있는 특별한 형식으로 메시지 출력
    # 이 형식은 main.js에서 감지하여 renderer 프로세스로 전달됨
    print(f"STATUS_UPDATE:{message}", flush=True)

# 설정 파일 로드
def load_config():
    """
    설정 파일을 로드하는 함수입니다.
    
    반환값:
    - config: 설정 정보가 담긴 딕셔너리
    """
    try:
        # 설정 파일의 경로 계산 (상위 디렉토리의 config.json)
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.json')
        
        # 설정 파일 열고 JSON으로 파싱
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        send_status_to_electron("설정 파일을 성공적으로 로드했습니다.")
        return config
    except Exception as e:
        send_status_to_electron(f"설정 파일 로드 중 오류 발생: {str(e)}")
        
        # 기본 설정 반환 (설정 파일이 없거나 오류 발생 시 사용)
        return {
            "search_url": "https://search.naver.com/search.naver?ssc=tab.news.all&where=news&sm=tab_jum&query={keyword}",
            "excel_path": "news_results.xlsx"
        }

# 뉴스 데이터를 엑셀로 저장하는 함수
def save_to_excel(results, excel_path=None):
    """
    수집한 뉴스 데이터를 엑셀 파일로 저장하는 함수입니다.
    
    매개변수:
    - results: 저장할 뉴스 데이터 (리스트)
    - excel_path: 저장할 엑셀 파일 경로
    
    반환값:
    - 저장 성공 여부, 저장된 파일 경로, 경로 변경 여부
    """
    try:
        original_path = excel_path  # 원래 요청된 저장 경로 기록
        path_changed = False  # 경로 변경 여부를 추적하는 플래그
        
        if excel_path is None:
            # 현재 시간을 포함한 기본 파일명 생성
            now = datetime.now().strftime("%Y%m%d_%H%M%S")
            excel_path = f"news_results_{now}.xlsx"
        
        # 경로가 접근 가능한지 확인
        try:
            # 파일 디렉토리가 존재하는지 확인하고 생성
            directory = os.path.dirname(excel_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
                send_status_to_electron(f"저장 디렉토리가 존재하지 않아 새로 생성했습니다: {directory}")
                
            # 파일이 이미 존재하고 열려 있으면 다른 이름으로 저장 시도
            if os.path.exists(excel_path):
                send_status_to_electron(f"파일이 이미 존재합니다: {excel_path}")
                try:
                    # 파일이 열려 있는지 테스트
                    with open(excel_path, 'a'):
                        pass
                except PermissionError:
                    # 파일이 열려 있다면 현재 시간을 포함한 다른 이름으로 저장
                    file_name, file_ext = os.path.splitext(excel_path)
                    now = datetime.now().strftime("%Y%m%d_%H%M%S")
                    excel_path = f"{file_name}_{now}{file_ext}"
                    path_changed = True
                    send_status_to_electron(f"파일이 이미 열려 있어 새 경로로 저장합니다: {excel_path}")
        except Exception as e:
            send_status_to_electron(f"경로 접근 확인 중 오류 발생: {str(e)}")
            # 접근 가능한 기본 위치에 저장 (사용자 데스크톱)
            desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop')
            now = datetime.now().strftime("%Y%m%d_%H%M%S")
            excel_path = os.path.join(desktop_path, f"news_results_{now}.xlsx")
            path_changed = True
            send_status_to_electron(f"접근 가능한 경로로 변경: {excel_path}")
        
        send_status_to_electron(f"엑셀 파일 저장 준비 중... (총 {len(results)}개의 뉴스 기사)")
        
        # 데이터프레임 생성 (Pandas 사용)
        df = pd.DataFrame(results, columns=["키워드", "제목", "언론사", "요약", "URL"])
        
        # 엑셀 파일로 저장 (openpyxl 엔진 사용)
        df.to_excel(excel_path, index=False, engine='openpyxl')
        
        send_status_to_electron(f"결과가 {excel_path}에 성공적으로 저장되었습니다.")
        
        # 경로가 변경되었는지 표시
        if path_changed and original_path:
            send_status_to_electron(f"*** 원래 경로({original_path})가 아닌 다른 위치에 저장되었습니다: {excel_path}")
        
        return True, excel_path, path_changed
    except Exception as e:
        send_status_to_electron(f"엑셀 저장 중 오류 발생: {str(e)}")
        try:
            # 오류 발생 시 데스크톱에 저장 시도
            desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop')
            now = datetime.now().strftime("%Y%m%d_%H%M%S")
            fallback_path = os.path.join(desktop_path, f"news_results_{now}.xlsx")
            
            send_status_to_electron(f"원래 경로에 저장 실패, 대체 경로로 저장 시도 중: {fallback_path}")
            
            df = pd.DataFrame(results, columns=["키워드", "제목", "언론사", "요약", "URL"])
            df.to_excel(fallback_path, index=False, engine='openpyxl')
            
            send_status_to_electron(f"대체 경로에 저장 성공: {fallback_path}")
            send_status_to_electron(f"*** 원래 경로({excel_path})가 아닌 대체 위치에 저장되었습니다: {fallback_path}")
            return True, fallback_path, True # 경로 변경된 경우 True
        except Exception as fallback_error:
            send_status_to_electron(f"대체 경로 저장 중 오류 발생: {str(fallback_error)}")
            return False, None, False

def run_selenium_task(keywords=None):
    """
    Selenium을 사용하여 뉴스 자동화 작업을 실행하는 메인 함수입니다.
    
    매개변수:
    - keywords: 검색할 키워드 목록
    
    반환값:
    - 작업 성공 여부 (True/False)
    """
    # 시작 시간 기록 (작업 소요 시간 계산용)
    start_time = time.time()
    
    # 설정 로드
    config = load_config()
    search_url = config.get("search_url")
    excel_path = config.get("excel_path")
    
    # 명령줄 인수에서 키워드 가져오기
    if keywords is None:
        if len(sys.argv) > 1:
            # 콤마로 구분된 키워드 목록 파싱
            keywords = sys.argv[1].split(',')
        else:
            # config에서 키워드 가져오기
            keywords = config.get("keywords", [])
    
    # 엑셀 경로 확인 (명령줄 두 번째 인수)
    if len(sys.argv) > 2:
        excel_path = sys.argv[2]
        send_status_to_electron(f"명령줄에서 엑셀 저장 경로를 가져왔습니다: {excel_path}")
    
    if not keywords:
        send_status_to_electron("오류: 검색할 키워드가 제공되지 않았습니다")
        return False
    
    send_status_to_electron(f"키워드 {len(keywords)}개 검색 시작: {', '.join(keywords)}")
    
    # Selenium WebDriver 설정
    send_status_to_electron("브라우저를 초기화하는 중입니다. 잠시만 기다려주세요...")
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # 배포 시 주석 제거
    
    # 추가적인 브라우저 옵션 설정
    chrome_options.add_argument("--disable-gpu")  # GPU 가속 비활성화
    chrome_options.add_argument("--no-sandbox")  # 샌드박스 모드 비활성화
    chrome_options.add_argument("--window-size=1920,1080")  # 창 크기 설정
    
    send_status_to_electron("웹 브라우저를 시작하는 중입니다...")
    driver = webdriver.Chrome(options=chrome_options)
    send_status_to_electron("웹 브라우저가 성공적으로 시작되었습니다")
    
    all_results = []  # 모든 결과를 저장할 리스트
    
    try:
        # 각 키워드에 대해 검색 실행
        for keyword_index, keyword in enumerate(keywords, 1):
            send_status_to_electron(f"\n키워드 {keyword_index}/{len(keywords)} '{keyword}' 검색 중...")
            
            # URL에 키워드 삽입
            url = search_url.format(keyword=keyword)
            send_status_to_electron(f"네이버 뉴스 검색 페이지로 이동합니다")
            driver.get(url)
            
            # 페이지 로드 기다리기
            try:
                send_status_to_electron(f"키워드 '{keyword}' 검색 결과를 기다리는 중...")
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".list_news"))
                )
                send_status_to_electron(f"키워드 '{keyword}' 검색이 완료되었습니다")
            except Exception as e:
                send_status_to_electron(f"페이지 로드 대기 중 오류 발생: {str(e)}")
                send_status_to_electron(f"키워드 '{keyword}'에 대한 검색 페이지를 로드하지 못했습니다. 다음 키워드로 넘어갑니다.")
                continue
            
            # 뉴스 기사 요소들 가져오기
            try:
                send_status_to_electron(f"키워드 '{keyword}'에 대한 뉴스 기사를 수집 중입니다...")
                news_items = driver.find_elements(By.CSS_SELECTOR, ".news_wrap")
                found_count = len(news_items)
                
                if found_count == 0:
                    send_status_to_electron(f"키워드 '{keyword}'에 대한 뉴스 기사를 찾을 수 없습니다.")
                    continue
                    
                send_status_to_electron(f"키워드 '{keyword}'에 대한 뉴스 {found_count}개 발견, 상위 10개 기사를 처리합니다.")
                
                # 상위 10개 뉴스 항목만 처리
                processed_count = 0
                for i, item in enumerate(news_items[:10]):
                    try:
                        # 제목
                        title_elem = item.find_element(By.CSS_SELECTOR, ".news_tit")
                        title = title_elem.text
                        url = title_elem.get_attribute("href")
                        
                        # 언론사
                        press = item.find_element(By.CSS_SELECTOR, ".press").text
                        
                        # 요약
                        summary_elem = item.find_elements(By.CSS_SELECTOR, ".api_txt_lines.dsc_txt_wrap")
                        summary = summary_elem[0].text if summary_elem else ""
                        
                        # 결과 저장
                        all_results.append([keyword, title, press, summary, url])
                        send_status_to_electron(f"  - [{press}] {title}")
                        processed_count += 1
                        
                    except Exception as e:
                        send_status_to_electron(f"  - 기사 정보 추출 중 오류 발생: {str(e)}")
                
                send_status_to_electron(f"키워드 '{keyword}'에 대한 뉴스 기사 {processed_count}개를 성공적으로 수집했습니다")
            except Exception as e:
                send_status_to_electron(f"뉴스 항목 추출 중 오류 발생: {str(e)}")
                send_status_to_electron(f"키워드 '{keyword}'에 대한 뉴스 수집을 건너뜁니다.")
            
            # 다음 키워드 전 잠시 대기
            if keyword_index < len(keywords):
                send_status_to_electron(f"다음 키워드 검색을 위해 잠시 대기합니다...")
                time.sleep(2)
        
        # 결과를 엑셀로 저장
        save_success = False
        final_excel_path = ""
        path_changed = False
        
        if all_results:
            send_status_to_electron(f"총 {len(all_results)}개의 뉴스 기사를 수집했습니다. 엑셀 파일로 저장을 시작합니다...")
            try:
                save_success, final_excel_path, path_changed = save_to_excel(all_results, excel_path)
                if not save_success:
                    send_status_to_electron("엑셀 파일 저장에 실패했습니다. 다른 위치에 저장을 시도합니다.")
                    # 현재 스크립트 디렉토리에 저장 시도
                    script_dir = os.path.dirname(os.path.abspath(__file__))
                    now = datetime.now().strftime("%Y%m%d_%H%M%S")
                    new_path = os.path.join(script_dir, f"news_results_{now}.xlsx")
                    send_status_to_electron(f"스크립트 디렉토리에 저장 시도 중: {new_path}")
                    save_success, final_excel_path, path_changed = save_to_excel(all_results, new_path)
            except Exception as e:
                send_status_to_electron(f"엑셀 저장 시도 중 오류 발생: {str(e)}")
                save_success = False
                path_changed = False
        else:
            send_status_to_electron("저장할 뉴스 기사가 없습니다. 키워드에 대한 검색 결과가 없거나 모든 검색에 실패했습니다.")
    
    except Exception as e:
        send_status_to_electron(f"작업 중 예상치 못한 오류가 발생했습니다: {str(e)}")
        return False
    finally:
        # 브라우저 종료
        send_status_to_electron("브라우저를 종료하는 중입니다...")
        driver.quit()
        send_status_to_electron("웹 브라우저가 성공적으로 종료되었습니다")
    
    # 작업 완료시간 계산
    end_time = time.time()
    elapsed_time = end_time - start_time
    minutes, seconds = divmod(elapsed_time, 60)
    time_str = f"{int(minutes)}분 {int(seconds)}초"
    
    send_status_to_electron(f"\n작업이 완료되었습니다. 총 소요 시간: {time_str}")
    if save_success:
        send_status_to_electron(f"수집한 뉴스 기사는 '{final_excel_path}' 파일에 저장되었습니다")
    else:
        send_status_to_electron("뉴스 기사를 파일로 저장하지 못했습니다")
    
    # 작업 완료 신호 전송 (Electron에서 인식할 특별한 형식)
    completion_data = {
        "status": "completed",
        "articles_count": len(all_results),
        "elapsed_time": time_str,
        "excel_path": final_excel_path,
        "keywords_count": len(keywords),
        "save_success": save_success,
        "path_changed": path_changed,  # 경로 변경 여부 추가
        "original_path": excel_path  # 원래 요청된 경로 추가
    }
    
    # 특별한 형식으로 출력 - Electron에서 이 메시지를 감지
    print(f"TASK_COMPLETED:{json.dumps(completion_data)}")
    
    send_status_to_electron("모든 키워드 처리 완료")
    return True

# Selenium 작업 실행
if __name__ == "__main__":
    run_selenium_task()