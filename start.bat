@echo off
cd /d "%~dp0"
echo Starting Quiz System...
echo ========================
echo Vite HMR is enabled - changes will sync automatically after saving.
echo.
start "" http://localhost:5173
call npm run dev
pause