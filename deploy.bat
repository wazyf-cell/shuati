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
echo [OK] shuati.exe

echo Copying setup ...
for %%f in ("src-tauri\target\release\bundle\nsis\shuati_*.exe") do (
    copy /Y "%%f" "versel-update\" >nul
    echo [OK] %%~nxf
)

echo Copying APK ...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "versel-update\" >nul
    echo [OK] app-debug.apk
) else (
    echo [SKIP] APK not found
)

echo Committing and pushing to Gitee ...
git add versel-update/
git commit -m "update: build artifacts"
git push origin master

if errorlevel 1 (
    echo ERROR: git push failed
    pause
    exit /b 1
)

echo.
echo ====== DONE ======
echo https://gitee.com/zhong-yongfu/shuati/raw/master/versel-update/version.json
echo.
pause
