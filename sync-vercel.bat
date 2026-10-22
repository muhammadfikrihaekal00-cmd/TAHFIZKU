@echo off
title Sinkronisasi Otomatis ke Vercel - RQ Ummul Qasim
echo ===================================================
echo    MEMULAI SINKRONISASI OTOMATIS KE VERCEL...
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
echo.
echo Tekan sembarang tombol untuk menutup jendela ini...
pause >nul
