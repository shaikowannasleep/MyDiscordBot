@echo off
setlocal
cd /d "%~dp0"
title Discord Game Alarm Bot

echo ======================================================================
echo       DISCORD GAME ALARM AND SCHEDULE BOT - WAKEUP RUNNER
echo ======================================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js trong he thong!
    echo Vui long cai dat Node.js tai: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [CANH BAO] Khong tim thay file .env!
    if exist ".env.example" (
        echo [INFO] Dang tu dong sao chep tu .env.example sang .env...
        copy /y ".env.example" ".env" >nul
    )
)

if not exist "node_modules" (
    echo [INFO] Chua co node_modules. Dang tien hanh npm install...
    call npm install
    if errorlevel 1 (
        echo [LOI] npm install that bai.
        pause
        exit /b 1
    )
)

:start_bot
cls
echo ======================================================================
echo       DISCORD GAME ALARM AND SCHEDULE BOT - DANG CHAY
echo ======================================================================
echo   Thu muc: %CD%
echo   Che do: npm run dev
echo   De dung bot: Dong cua so nay hoac an to hop phim Ctrl + C
echo ======================================================================
echo.

call npm run dev

echo.
echo ======================================================================
echo [THONG BAO] Bot da dung lai (Exit Code: %errorlevel%).
echo ======================================================================
echo - Nhan phim bat ky de KHOI DONG LAI bot (Restart)
echo - Hoac dong cua so nay de THOAT.
echo ======================================================================
pause >nul
goto start_bot
