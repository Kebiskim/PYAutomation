import sys
import subprocess
from PyQt5.QtCore import QThread, pyqtSignal

class AutomationThread(QThread):
    status_signal = pyqtSignal(str)

    def run(self):
        try:
            # Run Selenium Automation
            subprocess.run(['python', 'automation/selenium_automation.py'])
            print("Selenium Task Completed")  # Electron reads this

            # Run Pandas Automation
            subprocess.run(['python', 'automation/pandas_automation.py'])
            print("Pandas Task Completed")  # Electron reads this

        except Exception as e:
            print(f"Error: {e}")  # Electron reads this

if __name__ == "__main__":
    # Python이 Electron의 명령을 받을 준비만 하고 실행 X
    print("Python automation service ready")
