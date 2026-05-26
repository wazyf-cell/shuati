@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo    Shuati Deploy Script
echo ====================================
echo.

:: Ask for version
set /p VERSION="Version (e.g. 1.0.2): "

:: Copy exe
echo.
echo [1/3] Copying shuati.exe ...
copy /Y "src-tauri\target\release\shuati.exe" "gitee-update\" >nul
if errorlevel 1 (
    echo ERROR: shuati.exe not found. Run "npm run tauri:build" first.
    goto :end
)
echo   [OK] shuati.exe

:: Copy setup exe
for %%f in ("src-tauri\target\release\bundle\nsis\shuati_*.exe") do (
    copy /Y "%%f" "gitee-update\" >nul
    echo   [OK] %%~nxf
)

:: Copy APK
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "gitee-update\" >nul
    echo   [OK] app-debug.apk
) else (
    echo   [SKIP] APK not found (build in Android Studio first)
)

:: Update version.json
echo.
echo [2/3] Updating version.json ...
powershell -Command "(Get-Content 'gitee-update\version.json') -replace '\"version\": \"[^\"]*\"', '\"version\": \"%VERSION%\"' | Set-Content 'gitee-update\version.json'"
echo   [OK] version set to %VERSION%

:: Choose remote
echo.
echo [3/3] Push to which remote?
echo   1. Gitee only
echo   2. GitHub only
echo   3. Both
set /p CHOICE="Choice (1/2/3): "

if "%CHOICE%"=="1" goto :push_gitee
if "%CHOICE%"=="2" goto :push_github
if "%CHOICE%"=="3" goto :push_both

echo Invalid choice, skipping push.
goto :end

:push_gitee
echo.
echo Pushing to Gitee ...
git add gitee-update/
git commit -m "release v%VERSION%"
git push origin master
if errorlevel 1 (echo ERROR: push failed & goto :end)
echo   [OK] Pushed to Gitee
goto :summary

:push_github
echo.
echo Pushing to GitHub ...
git add gitee-update/
git commit -m "release v%VERSION%"
git push github master
if errorlevel 1 (echo ERROR: push failed & goto :end)
echo   [OK] Pushed to GitHub
goto :summary

:push_both
echo.
echo Pushing to Gitee ...
git add gitee-update/
git commit -m "release v%VERSION%"
git push origin master
echo.
echo Pushing to GitHub ...
git push github master
echo   [OK] Pushed to both
goto :summary

:summary
echo.
echo ====== DONE ======
echo Check: https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/version.json
echo Download: https://raw.githubusercontent.com/wazyf-cell/shuati/main/shuati-update/shuati.exe
echo APK: https://raw.githubusercontent.com/wazyf-cell/shuati/main/shuati-update/app-debug.apk

:end
echo.
pause
