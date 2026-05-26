@echo off
chcp 65001 >nul
echo ========== 1/2 构建程序（前端 + 后端）==========
npx tauri build --no-bundle
if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo ========== 2/2 生成安装包 ==========
cd /d "%~dp0"
makensis /INPUTCHARSET UTF8 installer\setup.nsi
if %errorlevel% neq 0 (
    echo 安装包生成失败！
    pause
    exit /b 1
)

echo.
echo ========== 完成！==========
echo 安装包: installer\shuati_setup.exe
pause
