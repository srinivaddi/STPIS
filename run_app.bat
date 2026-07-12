@echo off
REM Change directory to the script location
cd /d %~dp0

REM Activate the virtual environment
if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)

REM Open default web browser and navigate to the frontend port
echo [STPIS] Opening browser at http://localhost:3000/
start http://localhost:3000/

REM Run the startup script
python run.py

REM Pause to keep the command window open after execution
pause
