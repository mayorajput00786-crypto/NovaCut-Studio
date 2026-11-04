@echo off
title NovaCut AI Video Studio - Local Offline Server
color 0B
cls
echo ===============================================================================
echo             NOVACUT AI VIDEO STUDIO - LOCAL OFFLINE SERVER
echo ===============================================================================
echo.
echo [*] Starting local HTTP server for NovaCut Studio...
echo.

set EDGE64="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
set EDGE32="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
set BROWSER_CMD=

if exist %EDGE64% (
    set BROWSER_CMD=%EDGE64%
) else if exist %EDGE32% (
    set BROWSER_CMD=%EDGE32%
) else if exist %CHROME% (
    set BROWSER_CMD=%CHROME%
)

echo [*] Launching NovaCut Studio Application Window...
start "" powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0Start-Offline-Server.ps1"

timeout /t 2 >nul

if defined BROWSER_CMD (
    start "" %BROWSER_CMD% --app=http://localhost:3000 --window-size=1440,900
) else (
    start "" http://localhost:3000
)

echo [OK] NovaCut Studio is running! Keep this window open while using offline mode.
echo To stop the offline server, simply close this window.
pause
