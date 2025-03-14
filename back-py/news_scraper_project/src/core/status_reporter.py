class StatusReporter:
    """
    StatusReporter 클래스는 스크래핑 프로세스의 상태 메시지를 콘솔이나 UI에 전송하는 기능을 제공합니다.
    """

    @staticmethod
    def report_status(message):
        """
        주어진 메시지를 콘솔에 출력하여 현재 스크래핑 상태를 보고합니다.

        매개변수:
        - message: 콘솔에 출력할 상태 메시지
        """
        print(f"STATUS: {message}")

    @staticmethod
    def report_error(error_message):
        """
        오류 메시지를 콘솔에 출력하여 스크래핑 중 발생한 오류를 보고합니다.

        매개변수:
        - error_message: 콘솔에 출력할 오류 메시지
        """
        print(f"ERROR: {error_message}")

    @staticmethod
    def report_completion(total_articles, elapsed_time):
        """
        스크래핑 작업이 완료되었음을 보고하고, 수집된 기사 수와 소요 시간을 출력합니다.

        매개변수:
        - total_articles: 수집된 뉴스 기사의 총 수
        - elapsed_time: 작업 소요 시간 (형식: 'X분 Y초')
        """
        print(f"작업 완료: 총 {total_articles}개의 뉴스 기사가 수집되었습니다. 소요 시간: {elapsed_time}")