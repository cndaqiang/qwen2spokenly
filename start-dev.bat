@echo off
chcp 65001 >nul
echo ========================================
echo   Qwen2Spokenly - 本地调试
echo ========================================
echo.
echo 本地地址: http://127.0.0.1:8787
echo Spokenly Base URL: http://127.0.0.1:8787/v1
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

wrangler dev

pause
