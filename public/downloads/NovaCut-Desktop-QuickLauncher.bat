@echo off
title NovaCut AI Video Studio - 1-Click Desktop Launcher
color 0B
cls
echo ===============================================================================
echo            NOVACUT AI VIDEO STUDIO - 1-CLICK DESKTOP LAUNCHER
echo ===============================================================================
echo.
echo [*] Launching NovaCut Studio...

if exist "%~dp0NovaCut-Studio-Desktop.exe" (
    start "" "%~dp0NovaCut-Studio-Desktop.exe"
    exit /b 0
)

if exist "%~dp0Launch-NovaCut-Studio.html" (
    start "" "%~dp0Launch-NovaCut-Studio.html"
    exit /b 0
)

start "" "https://ais-dev-p7twebxergo2ygfntubhgq-991742061158.asia-east1.run.app"
exit /b 0
