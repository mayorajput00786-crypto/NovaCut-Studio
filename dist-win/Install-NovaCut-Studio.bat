@echo off
title NovaCut AI Video Studio - Desktop Setup
color 0B
cls
echo ===============================================================================
echo            NOVACUT AI VIDEO STUDIO - WINDOWS DESKTOP INSTALLER
echo                 Version 1.0.0 Pro Suite (CapCut + Canva Hybrid)
echo ===============================================================================
echo.
echo [*] Launching NovaCut Studio Desktop Executable...

if exist "NovaCut-Studio-Desktop.exe" (
    start "" "NovaCut-Studio-Desktop.exe"
    exit /b 0
)

if exist "NovaCut-Studio-Installer.exe" (
    start "" "NovaCut-Studio-Installer.exe"
    exit /b 0
)

echo [*] Starting local server...
start "" Launch-NovaCut.vbs
exit /b 0
