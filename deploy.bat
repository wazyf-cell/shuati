@echo off
chcp 65001 >nul

cd /d "%~dp0"

echo Copying shuati.exe ...
copy /Y "src-tauri\target\release\shuati.exe" "versel-update\" >nul
if errorlevel 1 (
    echo ERROR: shuati.exe not found. Run "npm run tauri:build" first.
    pause
    exit /b 1
)
echo [OK] shuati.exe updated

echo Copying setup ...
for %%f in ("src-tauri\target\release\bundle\nsis\shuati_*.exe") do (
    copy /Y "%%f" "versel-update\" >nul
    if not errorlevel 1 (
        echo [OK] %%~nxf
    ) else (
        echo ERROR: setup copy failed
        pause
        exit /b 1
    )
)

echo Copying APK ...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "versel-update\" >nul
    echo [OK] APK updated
) else (
    echo [SKIP] APK not found (desktop deploy continues)
)

cd /d "%~dp0versel-update"
echo Deploying to Vercel ...
vercel deploy --prod

if errorlevel 1 (
    echo ERROR: Vercel deploy failed
    pause
    exit /b 1
)

echo.
echo ====== DONE ======
echo https://versel-update.vercel.app/version.json
echo.
pause
