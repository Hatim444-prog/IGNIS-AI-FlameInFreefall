@echo off
setlocal
cd /d "%~dp0"

if not exist "ai-service\.venv\Scripts\python.exe" (
  echo Run setup.bat first.
  pause
  exit /b 1
)

echo Importing ZARM experiments into Neon ^(from .env DATABASE_URL^)...
cd ai-service
call ".venv\Scripts\activate.bat"
python import_zarm.py
if errorlevel 1 (
  echo Import failed.
  pause
  exit /b 1
)

echo.
echo Optional: migrate PDF embeddings if data\index.json exists:
echo   python migrate_vectors.py
echo.
pause
