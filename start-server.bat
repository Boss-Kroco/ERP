@echo off
title Bos Kroco ERP Server (localhost:8080)
echo ============================================================
echo   BOS KROCO ERP - LOCAL SERVER
echo   Akses aplikasi di browser: http://localhost:8080
echo ============================================================
echo.
python -m http.server 8080
pause
