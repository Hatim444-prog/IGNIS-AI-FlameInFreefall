@echo off
setlocal
cd /d "%~dp0frontend"

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Starting IGNIS frontend on http://127.0.0.1:5173
echo   API proxy: /ai -> http://127.0.0.1:8001
echo   Run start.bat in another terminal for the backend.
echo.

start "" "http://127.0.0.1:5173"
call npm run dev
