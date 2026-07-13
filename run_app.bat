@echo off
REM Change directory to the script location
cd /d %~dp0

REM Activate the virtual environment
if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)

REM Run the startup script
python run.py

REM Pause to keep the command window open after execution
pause
