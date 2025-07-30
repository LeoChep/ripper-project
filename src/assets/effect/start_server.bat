@echo off
echo 启动本地服务器...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python
    pause
    exit /b 1
)

REM 启动服务器
echo 正在启动服务器，请稍候...
python server.py

pause
