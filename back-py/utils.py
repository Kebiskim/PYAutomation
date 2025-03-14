import logging
import sys
import traceback

# 로그 설정 (파일과 콘솔에 로그를 남기기)
def setup_logger(log_file='automation.log'):
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)

    # 콘솔에 로그 출력
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 로그 파일에 기록
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

# 에러 핸들링 함수
def handle_error(e):
    logger = logging.getLogger()
    error_message = f"An error occurred: {str(e)}"
    logger.error(error_message)
    # 에러 traceback 출력
    exc_type, exc_value, exc_tb = sys.exc_info()
    traceback_details = traceback.format_exception(exc_type, exc_value, exc_tb)
    logger.error("".join(traceback_details))

# 예시: 테스트용
if __name__ == "__main__":
    logger = setup_logger()  # 로거 설정
    try:
        # 예시로 오류 발생
        1 / 0  # ZeroDivisionError
    except Exception as e:
        handle_error(e)
