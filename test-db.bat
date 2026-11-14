@echo off
setlocal
cd /d "%~dp0ai-service"

if not exist ".venv\Scripts\python.exe" (
  echo Run setup.bat from repo root first.
  pause
  exit /b 1
)

call ".venv\Scripts\activate.bat"
python test_db.py
pause
