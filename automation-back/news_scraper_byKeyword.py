import json
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time
from datetime import datetime

# 설정 파일 로드
def load_config():
    try:
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print("설정 파일을 성공적으로 로드했습니다.")
        return config
    except Exception as e:
        print(f"설정 파일 로드 중 오류 발생: {str(e)}")
        # 기본 설정 반환
        return {
            "search_url": "https://search.naver.com/search.naver?ssc=tab.news.all&where=news&sm=tab_jum&query={keyword}",
            "excel_path": "news_results.xlsx"
        }

# 뉴스 데이터를 엑셀로 저장하는 함수
def save_to_excel(results, excel_path=None):
    try:
        if excel_path is None:
            # 현재 시간을 포함한 기본 파일명 생성
            now = datetime.now().strftime("%Y%m%d_%H%M%S")
            excel_path = f"news_results_{now}.xlsx"
        
        # 데이터프레임 생성
        df = pd.DataFrame(results, columns=["키워드", "제목", "언론사", "요약", "URL"])
        
        # 엑셀 파일로 저장
        df.to_excel(excel_path, index=False, engine='openpyxl')
        
        print(f"결과가 {excel_path}에 성공적으로 저장되었습니다.")
        return True
    except Exception as e:
        print(f"엑셀 저장 중 오류 발생: {str(e)}")
        return False

def run_selenium_task(keywords=None):
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
    
    if not keywords:
        print("오류: 검색할 키워드가 제공되지 않았습니다")
        return False
    
    print(f"키워드 {len(keywords)}개 검색 시작: {', '.join(keywords)}")
    
    # Selenium WebDriver 설정
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # 배포 시 주석 제거
    driver = webdriver.Chrome(options=chrome_options)
    
    all_results = []  # 모든 결과를 저장할 리스트
    
    try:
        for keyword in keywords:
            print(f"\n키워드 '{keyword}' 검색 중...")
            
            # URL에 키워드 삽입
            url = search_url.format(keyword=keyword)
            driver.get(url)
            
            # 페이지 로드 기다리기
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".list_news"))
                )
            except Exception as e:
                print(f"페이지 로드 대기 중 오류: {str(e)}")
                continue
            
            # 뉴스 기사 요소들 가져오기
            try:
                news_items = driver.find_elements(By.CSS_SELECTOR, ".news_wrap")
                print(f"키워드 '{keyword}'에 대한 뉴스 {len(news_items)}개 발견")
                
                # 상위 10개 뉴스 항목만 처리
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
                        print(f"  - [{press}] {title}")
                    except Exception as e:
                        print(f"  - 기사 파싱 오류: {str(e)}")
                
                print(f"키워드 '{keyword}' 처리 완료")
            except Exception as e:
                print(f"뉴스 항목 추출 중 오류: {str(e)}")
            
            # 다음 키워드 전 잠시 대기
            time.sleep(2)
        
        # 결과를 엑셀로 저장
        if all_results:
            save_to_excel(all_results, excel_path)
        else:
            print("저장할 결과가 없습니다.")
    
    except Exception as e:
        print(f"작업 중 오류 발생: {str(e)}")
        return False
    finally:
        # 브라우저 종료
        driver.quit()
    
    print("모든 키워드 처리 완료")
    return True

# Selenium 작업 실행
if __name__ == "__main__":
    run_selenium_task()