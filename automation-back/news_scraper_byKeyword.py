import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# Configuration을 설정 파일에서 읽어오기
def load_config():
    with open('config.json', 'r') as f:
        config = json.load(f)
    return config

# Configuration을 설정 파일에 저장하기
def save_config(config):
    with open('config.json', 'w') as f:
        json.dump(config, f, indent=4)

# 사용자로부터 키워드 및 URL을 입력 받는 함수
def get_user_input():
    # 기존 config.json 로드
    config = load_config()
    
    # 검색 URL 입력 받기
    search_url = input(f"Enter search URL (default: {config['search_url']}): ")
    if not search_url:
        search_url = config['search_url']
    
    # 키워드 입력 받기
    keywords_input = input("Enter keywords separated by commas (e.g. 'python, selenium, automation'): ")
    keywords = [keyword.strip() for keyword in keywords_input.split(',')] if keywords_input else config['keywords']
    
    # 업데이트된 config 저장
    config['search_url'] = search_url
    config['keywords'] = keywords
    save_config(config)

    return config

def run_selenium_task():
    # 사용자 입력 받기
    config = get_user_input()
    search_url = config["search_url"]
    keywords = config["keywords"]
    
    # Selenium WebDriver 설정
    driver = webdriver.Chrome()

    for keyword in keywords:
        url = search_url.format(keyword=keyword)
        driver.get(url)

        # 페이지 로드 대기 (기본적인 로딩 대기, 필요시 WebDriverWait 추가)
        time.sleep(2)

        # 키워드를 검색창에 입력하고 엔터
        search_box = driver.find_element(By.NAME, "q")  # 'q'는 검색창의 이름
        search_box.clear()
        search_box.send_keys(keyword)
        search_box.send_keys(Keys.RETURN)

        # 검색 결과 대기
        time.sleep(3)

        # 여기서 결과를 처리할 수 있습니다 (예: 기사 제목 추출 등)
        print(f"Search results for: {keyword}")
        
        # 예시로 검색 결과의 제목을 추출해봄 (구체적인 XPath는 변경 필요)
        results = driver.find_elements(By.XPATH, "//h3")  # 예시: 검색 결과의 제목을 모두 출력
        for result in results:
            print(result.text)

    # 자동화 완료 후 드라이버 종료
    driver.quit()

# Selenium 작업 실행
if __name__ == "__main__":
    run_selenium_task()
