@echo off
echo ==============================================
echo   AUTO PUSH & DEPLOY - BOS KROCO ERP
echo ==============================================
echo.

git add .
set /p msg="Masukkan pesan revisi (tekan Enter untuk default): "
if "%msg%"=="" set msg=update: auto deploy revisi baru

echo Menyimpan perubahan...
git commit -m "%msg%"

echo Mengunggah ke GitHub & Vercel...
git push origin main

echo.
echo ==============================================
echo   BERHASIL! Vercel otomatis deploy web Anda.
echo ==============================================
pause
