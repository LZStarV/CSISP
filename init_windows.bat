@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo ================================================
echo    Windows Development Environment Check
echo ================================================
echo.

echo [1/4] Checking Node.js (expected: v22.x)
set NODE_OK=0

where node >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    if defined NODE_VERSION (
        set "NODE_MAJOR=!NODE_VERSION:~1,2!"

        if "!NODE_MAJOR!"=="22" (
            set NODE_OK=1
            echo   [OK] Node.js !NODE_VERSION!
        ) else (
            echo   [WARN] Node.js !NODE_VERSION! (expected v22.x)
            echo   [INFO] To switch version using nvm:
            echo          nvm install 22 ^&^& nvm use 22
            echo          or download from: https://nodejs.org/en/download/
        )
    ) else (
        echo   [ERROR] Could not determine Node.js version
    )
) else (
    echo   [ERROR] Node.js not installed
    echo   [INFO] Install nvm-windows: https://github.com/coreybutler/nvm-windows/releases
    echo          then run: nvm install 22 ^&^& nvm use 22
)

echo.
echo [2/4] Checking pnpm (expected: v10.22.0)
set PNPM_OK=0

set REQUIRED_PNPM_VERSION=10.22.0

where pnpm >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do set "PNPM_VERSION=%%i"
    if defined PNPM_VERSION (
        set "PNPM_VERSION=!PNPM_VERSION: =!"

        if "!PNPM_VERSION!"=="!REQUIRED_PNPM_VERSION!" (
            set PNPM_OK=1
            echo   [OK] pnpm v!PNPM_VERSION!
        ) else (
            echo   [WARN] pnpm v!PNPM_VERSION! (expected v!REQUIRED_PNPM_VERSION!)
            echo   [INFO] Upgrade with: npm install -g pnpm@!REQUIRED_PNPM_VERSION!
        )
    ) else (
        echo   [ERROR] Could not determine pnpm version
    )
) else (
    echo   [ERROR] pnpm not installed
    echo   [INFO] Install with: npm install -g pnpm@!REQUIRED_PNPM_VERSION!
)

echo.
echo [3/5] Checking Docker Desktop
set DOCKER_OK=0

where docker >nul 2>&1
if !errorlevel! equ 0 (
    docker info >nul 2>&1
    if !errorlevel! equ 0 (
        set DOCKER_OK=1
        echo   [OK] Docker is running
    ) else (
        echo   [WARN] Docker installed but service not ready
        echo   [INFO] Start Docker Desktop and ensure it shows "Running"
    )
) else (
    echo   [ERROR] Docker not installed
    echo   [INFO] Download from: https://www.docker.com/products/docker-desktop/
)

echo.
echo [4/5] Checking Apache Thrift Compiler
set THRIFT_OK=0

where thrift >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('thrift --version') do set "THRIFT_VERSION=%%i"
    set THRIFT_OK=1
    echo   [OK] !THRIFT_VERSION!
) else (
    echo   [ERROR] Thrift not installed
    echo   [INFO] Please install Apache Thrift compiler:
    echo         https://thrift.apache.org/
    echo         or via package manager like Chocolatey: choco install thrift
)

echo.
echo [5/5] Checking Git
set GIT_OK=0

where git >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set "GIT_VERSION=%%i"
    set GIT_OK=1
    echo   [OK] !GIT_VERSION!
) else (
    echo   [ERROR] Git not installed
    echo   [INFO] Download from: https://git-scm.com/download/win
)

echo.
echo ================================================
echo    Environment Check Summary
echo ================================================
echo.

set /a TOTAL=!NODE_OK!+!PNPM_OK!+!DOCKER_OK!+!THRIFT_OK!+!GIT_OK!

if !TOTAL! equ 5 (
    echo [SUCCESS] All 5 components ready
    echo          Development environment is fully configured
    echo.
    echo ================================================
    echo    Next Steps
    echo ================================================
    echo.
    echo 1. Install dependencies:
    echo    pnpm i
    echo.
    echo 2. Start database infrastructure:
    echo    bash infra/database/scripts/init_mac.sh
    echo.
    echo 3. Initialize database:
    echo    pnpm run -F @csisp/db-schema migrate
    echo    pnpm run -F @csisp/db-schema seed
    echo.
    echo 4. Start backend services:
    echo    pnpm run -F @csisp/bff dev
    echo    pnpm run -F @csisp/backend-integrated dev
    echo.
    echo 5. Start frontend projects:
    echo    pnpm run -F @csisp/frontend-admin dev
    echo    pnpm run -F @csisp/frontend-portal dev
) else (
    echo [WARNING] Only !TOTAL! of 5 components ready
    echo           Some components need configuration
    echo.
    echo ================================================
    echo    Missing Components
    echo ================================================
    echo.
    if !NODE_OK! equ 0 echo    - Node.js v22.x
    if !PNPM_OK! equ 0 echo    - pnpm v!REQUIRED_PNPM_VERSION!
    if !DOCKER_OK! equ 0 echo    - Docker Desktop
    if !THRIFT_OK! equ 0 echo    - Apache Thrift compiler
    if !GIT_OK! equ 0 echo    - Git
    echo.
    echo Please install the missing components and run this script again.
)

echo.
endlocal
