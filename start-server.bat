@echo off
title Bos Kroco ERP - Local Server & Asisten Bot (localhost:8080)
cd /d "%~dp0"

echo ============================================================
echo   BOS KROCO ERP - LOCAL SERVER & ASISTEN TELEGRAM RUNNER
echo ============================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js terdeteksi. Menjalankan Server ERP + Bot Asisten Telegram...
    echo.
    node server.js
    goto end
)

echo [INFO] Node.js tidak ditemukan, menjalankan fallback Python...
start "" "http://localhost:8080"
python -m http.server 8080 --bind 127.0.0.1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Port 8080 sibuk, mencoba beralih ke port 8081...
    start "" "http://localhost:8081"
    python -m http.server 8081 --bind 127.0.0.1
)

:end
pause
