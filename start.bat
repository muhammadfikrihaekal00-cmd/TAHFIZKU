@echo off
title Menjalankan Aplikasi RQ Ummul Qasim
echo ========================================================
echo   MEMBUKA APLIKASI KONTROL HAFALAN & KITAB TAMHID
echo                 RQ UMMUL QASIM
echo ========================================================
echo.
echo Sedang membuka aplikasi di browser default Anda...
start "" "http://localhost:8080/index.html"
if errorlevel 1 (
  start "" "%~dp0index.html"
)
echo.
echo Aplikasi siap digunakan!
pause
