@echo off
setlocal
cd /d "%~dp0"

if not exist "ai-service\.venv\Scripts\python.exe" (
  echo Virtual env missing. Run setup.bat first.
  pause
  exit /b 1
)

if not exist ".env" (
  echo Missing .env — run setup.bat or copy .env.example to .env
  pause
  exit /b 1
)

echo Starting IGNIS AI on http://127.0.0.1:8001
echo   Test UI:  http://127.0.0.1:8001/test/
echo   API docs: http://127.0.0.1:8001/docs
echo   Ctrl+C to stop
echo.

start "" "http://127.0.0.1:8001/test/"

cd ai-service
call ".venv\Scripts\activate.bat"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
