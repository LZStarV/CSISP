@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [INFO] 开始检查 Windows 开发环境

set NODE_STATUS=未检查
set NODE_OK=0
set PNPM_STATUS=未检查
set PNPM_OK=0
set DOCKER_STATUS=未检查
set DOCKER_OK=0
set GIT_STATUS=未检查
set GIT_OK=0

set REQUIRED_NODE_MAJOR=22
set REQUIRED_PNPM_VERSION=

for /f "tokens=2 delims=@\"" %%i in ('findstr /r /c:"\"packageManager\"" package.json 2^>nul') do (
  set REQUIRED_PNPM_VERSION=%%i
)
if "%REQUIRED_PNPM_VERSION%"=="" set REQUIRED_PNPM_VERSION=10.22.0

echo [INFO] 检查 Node.js (期望主版本 %REQUIRED_NODE_MAJOR%.x)
node --version >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
  set NODE_MAJOR=!NODE_VERSION:~1,2!
  if "!NODE_MAJOR:~0,2!"=="%REQUIRED_NODE_MAJOR%" (
    set NODE_STATUS=已安装，版本符合要求: !NODE_VERSION!
    set NODE_OK=1
    echo [OK] !NODE_STATUS!
  ) else (
    set NODE_STATUS=已安装 !NODE_VERSION!，期望主版本为 %REQUIRED_NODE_MAJOR%.x
    echo [WARN] !NODE_STATUS!
    echo [INFO] 建议安装 nvm-windows 或直接安装 Node.js %REQUIRED_NODE_MAJOR%.x
    echo        nvm-windows: https://github.com/coreybutler/nvm-windows/releases
    echo        Node.js 官方下载: https://nodejs.org/en/download/
  )
) else (
  set NODE_STATUS=未检测到 Node.js
  echo [ERROR] !NODE_STATUS!
  echo [INFO] 建议安装 nvm-windows 后执行: nvm install %REQUIRED_NODE_MAJOR% ^&^& nvm use %REQUIRED_NODE_MAJOR%
  echo        或直接从 https://nodejs.org/en/download/ 下载并安装 Node.js %REQUIRED_NODE_MAJOR%.x
)

echo [INFO] 检查 pnpm (期望版本 %REQUIRED_PNPM_VERSION%)
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
  set PNPM_PREFIX=!PNPM_VERSION:~0,7!
  set REQUIRED_PREFIX=%REQUIRED_PNPM_VERSION%
  if "!PNPM_PREFIX!"=="%REQUIRED_PNPM_VERSION%" (
    set PNPM_STATUS=已安装，版本符合要求: !PNPM_VERSION!
    set PNPM_OK=1
    echo [OK] !PNPM_STATUS!
  ) else (
    set PNPM_STATUS=已安装 !PNPM_VERSION!，建议升级到 %REQUIRED_PNPM_VERSION%
    echo [WARN] !PNPM_STATUS!
    echo [INFO] 可使用如下命令升级:
    echo        npm install -g pnpm@%REQUIRED_PNPM_VERSION%
  )
) else (
  set PNPM_STATUS=未检测到 pnpm
  echo [ERROR] !PNPM_STATUS!
  echo [INFO] 如已安装 Node.js/npm，可执行:
  echo        npm install -g pnpm@%REQUIRED_PNPM_VERSION%
  echo        官方安装文档: https://pnpm.io/installation
)

echo [INFO] 检查 Docker Desktop
docker --version >nul 2>&1
if %errorlevel% equ 0 (
  docker info >nul 2>&1
  if %errorlevel% equ 0 (
    set DOCKER_STATUS=Docker 已安装且服务可用
    set DOCKER_OK=1
    echo [OK] !DOCKER_STATUS!
  ) else (
    set DOCKER_STATUS=检测到 Docker，但服务未就绪，请启动 Docker Desktop 并确保其显示 Running 状态
    echo [WARN] !DOCKER_STATUS!
    echo [INFO] 如在本机通过 WSL2 或其他 Unix 环境管理数据库，可在项目根目录执行:
    echo        bash infra/database/scripts/init_mac.sh   ^(macOS 示例^)
    echo        bash infra/database/scripts/init_linux.sh ^(Linux 示例^)
  )
) else (
  set DOCKER_STATUS=未检测到 Docker Desktop
  echo [ERROR] !DOCKER_STATUS!
  echo [INFO] 请从以下地址下载安装 Docker Desktop for Windows:
  echo        https://www.docker.com/products/docker-desktop/
  echo        安装完成后重启计算机并重新运行本脚本
)

echo [INFO] 检查 Git
git --version >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
  set GIT_STATUS=已安装: !GIT_VERSION!
  set GIT_OK=1
  echo [OK] !GIT_STATUS!
) else (
  set GIT_STATUS=未安装 Git
  echo [ERROR] !GIT_STATUS!
  echo [INFO] 请从以下地址下载安装 Git for Windows:
  echo        https://git-scm.com/download/win
)

echo.
set TOTAL=4
set COMPLETED=0
if "%NODE_OK%"=="1" set /a COMPLETED+=1
if "%PNPM_OK%"=="1" set /a COMPLETED+=1
if "%DOCKER_OK%"=="1" set /a COMPLETED+=1
if "%GIT_OK%"=="1" set /a COMPLETED+=1

echo ======== 环境检查结果汇总 [%COMPLETED% / %TOTAL%] ========

echo.
if "%COMPLETED%"=="%TOTAL%" (
  echo 所有必需环境组件已检测完成，可继续进行项目开发。
  echo.
  echo 推荐的后续操作：
  echo   1^)^ 安装依赖:
  echo        pnpm i
  echo   2^)^ 启动数据库基础设施^（如使用 WSL2 或远程 Docker 环境，请按项目文档配置^）
  echo        bash infra/database/scripts/init_mac.sh  ^(示例命令，请根据实际环境选择对应腳本^)
  echo   3^)^ 初始化数据库结构与种子数据:
  echo        pnpm -F @csisp/db-schema run migrate
  echo        pnpm -F @csisp/db-schema run seed
  echo   4^)^ 启动 BFF 和后端服务:
  echo        pnpm -F @csisp/bff dev
  echo        pnpm -F @csisp/backend-integrated dev
  echo   5^)^ 启动前端项目:
  echo        pnpm -F @csisp/frontend-admin dev
  echo        pnpm -F @csisp/frontend-portal dev
) else (
  echo 未完成的环境组件及建议操作：
  if not "%NODE_OK%"=="1" echo   - Node.js: %NODE_STATUS%
  if not "%PNPM_OK%"=="1" echo   - pnpm: %PNPM_STATUS%
  if not "%DOCKER_OK%"=="1" echo   - Docker: %DOCKER_STATUS%
  if not "%GIT_OK%"=="1" echo   - Git: %GIT_STATUS%
)

endlocal
