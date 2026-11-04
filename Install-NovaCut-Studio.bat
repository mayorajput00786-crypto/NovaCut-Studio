@echo off
title NovaCut AI Video Studio - Desktop Setup
color 0B
cls
echo ===============================================================================
echo            NOVACUT AI VIDEO STUDIO - WINDOWS DESKTOP INSTALLER
echo                 Version 1.0.0 Pro Suite (CapCut + Canva Hybrid)
echo ===============================================================================
echo.
echo [1/5] Checking System Prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js was not detected in PATH.
    echo [*] Attempting automated installation via Windows Package Manager (winget)...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [X] Automated winget install failed.
        echo Please download and install Node.js LTS from: https://nodejs.org
        pause
        exit /b 1
    )
    echo [*] Node.js installed successfully.
) else (
    echo [OK] Node.js detected: 
    node -v
)

echo.
echo [2/5] Preparing Local Project Environment...
if not exist ".env" (
    echo Creating .env configuration with Master Owner accounts...
    (
        echo PORT=3000
        echo OWNER_EMAIL_1=josnking01@gmail.com
        echo OWNER_EMAIL_2=mayorajput00786@gmail.com
        echo OWNER_EMAIL_3=admin@novacut.io
    ) > .env
    echo [OK] .env configured.
)

echo.
echo [3/5] Installing Project Dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install --no-audit --prefer-offline
) else (
    echo [OK] Dependencies already installed.
)

echo.
echo [4/5] Creating Windows Desktop & Start Menu Shortcuts...
cscript //nologo Install-Shortcuts.vbs

echo.
echo [5/5] Launching NovaCut Studio Desktop Application...
start "" Launch-NovaCut.vbs

echo ===============================================================================
echo [SUCCESS] NovaCut Studio has been installed and launched!
echo Access Master Admin with: josnking01@gmail.com or mayorajput00786@gmail.com
echo ===============================================================================
timeout /t 5 >nul
exit /b 0
