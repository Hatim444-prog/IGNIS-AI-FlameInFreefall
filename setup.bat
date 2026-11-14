@echo off
setlocal
cd /d "%~dp0"

echo === IGNIS AI — one-time setup ===

where py >nul 2>&1
if %errorlevel%==0 (
  set PY=py -3.12
) else (
  where python >nul 2>&1
  if %errorlevel% neq 0 (
    echo Python 3.12+ not found. Install from https://www.python.org/
    exit /b 1
  )
  set PY=python
)

if not exist ".env" (
  echo.
  echo Creating .env from .env.example — edit DATABASE_URL before production use.
  copy /Y ".env.example" ".env" >nul
)

if not exist "ai-service\.venv\Scripts\python.exe" (
  echo Creating virtual environment...
  %PY% -m venv "ai-service\.venv"
  if errorlevel 1 exit /b 1
)

echo Installing Python packages...
"ai-service\.venv\Scripts\python.exe" -m pip install --upgrade pip
"ai-service\.venv\Scripts\pip.exe" install -r "ai-service\requirements.txt"
if errorlevel 1 exit /b 1

echo.
echo Setup done.
echo   1. Edit .env ^(DATABASE_URL for Neon^)
echo   2. Run start.bat
echo   3. Optional: run import-data.bat
echo.
pause
