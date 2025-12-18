@echo off
chcp 65001 >nul

:: 启用延迟环境变量扩展
setlocal enabledelayedexpansion

:: 颜色定义（Windows 命令提示符颜色代码）
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"  :: No Color

:: 日志函数
:log_info
    echo %BLUE%🔍 %~1%NC%
    exit /b 0

:log_success
    echo %GREEN%✅ %~1%NC%
    exit /b 0

:log_warning
    echo %YELLOW%⚠️  %~1%NC%
    exit /b 0

:log_error
    echo %RED%❌ %~1%NC%
    exit /b 0

:: OS Check - Only for Windows
ver | findstr "Windows" >nul 2>&1
if errorlevel 1 (
    call :log_error "错误：此脚本仅适用于 Windows 操作系统"
    call :log_warning "请使用对应操作系统的初始化脚本："
    call :log_warning "   • macOS 系统：init_mac.sh"
    call :log_warning "   • Linux 系统：init_linux.sh"
    pause
    exit /b 1
)

:: CSISP 后端环境初始化脚本 (Windows版本)
:: 适用于 Node.js 22.x

echo %BLUE%🚀 开始初始化 CSISP 后端环境...%NC%

:: 获取脚本所在目录和项目根目录
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"  :: 移除末尾的反斜杠
set "BACKEND_ROOT=%SCRIPT_DIR%\.."
set "PROJECT_ROOT=%BACKEND_ROOT%\.."

:: 切换到项目根目录
cd /d "%PROJECT_ROOT%" || (
    call :log_error "无法切换到项目根目录"
    pause
    exit /b 1
)

:: 检查目录结构
if not exist "package.json" (
    call :log_error "错误：项目根目录结构异常"
    call :log_warning "请确保在 CSISP 项目根目录中运行此脚本"
    pause
    exit /b 1
)

if not exist "pnpm-workspace.yaml" (
    call :log_error "错误：项目根目录结构异常"
    call :log_warning "请确保在 CSISP 项目根目录中运行此脚本"
    pause
    exit /b 1
)

:: 检查并安装 nvm-windows (Node Version Manager)
set "NVM_INSTALLED=false"
nvm --version >nul 2>&1
if %errorlevel% equ 0 (
    set "NVM_INSTALLED=true"
    call :log_success "nvm-windows 已安装"
) else (
    call :log_warning "未检测到 nvm-windows，推荐安装："
    call :log_warning "1. 下载: https://github.com/coreybutler/nvm-windows/releases"
    call :log_warning "2. 安装后重启命令提示符并重新运行此脚本"
    call :log_warning "按任意键继续（如已安装 Node.js 22.x）..."
    pause >nul
)

:: 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Node.js 未安装"
    if "%NVM_INSTALLED%"=="true" (
        call :log_info "使用 nvm 安装 Node.js 22.x..."
        nvm install 22
        if %errorlevel% neq 0 (
            call :log_error "通过 nvm 安装 Node.js 22.x 失败"
            pause
            exit /b 1
        )
        nvm use 22
        if %errorlevel% neq 0 (
            call :log_error "切换到 Node.js 22.x 失败"
            pause
            exit /b 1
        )
    ) else (
        call :log_error "请安装 Node.js 22.x 版本或 nvm-windows"
        call :log_warning "直接下载 Node.js 22.x: https://nodejs.org/en/download/"
        pause
        exit /b 1
    )
)

:: 严格检查 Node.js 版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i

if "!NODE_VERSION:~0,4!"=="v22." (
    call :log_success "Node.js 版本检查通过: !NODE_VERSION!"
) else (
    call :log_error "Node.js 版本不符合要求: !NODE_VERSION!"
    call :log_warning "需要 Node.js 22.x 版本"

    if "%NVM_INSTALLED%"=="true" (
        call :log_info "尝试通过 nvm 安装 Node.js 22.x..."
        nvm install 22
        if %errorlevel% neq 0 (
            call :log_error "通过 nvm 安装 Node.js 22.x 失败"
            pause
            exit /b 1
        )
        nvm use 22
        if %errorlevel% neq 0 (
            call :log_error "切换到 Node.js 22.x 失败"
            pause
            exit /b 1
        )

        :: 重新检查版本
        for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
        if "!NODE_VERSION:~0,4!"=="v22." (
            call :log_success "Node.js 版本检查通过: !NODE_VERSION!"
        ) else (
            call :log_error "仍然未检测到正确的 Node.js 版本"
            pause
            exit /b 1
        )
    ) else (
        call :log_warning "请手动安装 Node.js 22.x 或使用 nvm-windows"
        pause
        exit /b 1
    )
)

:: 检查并安装 pnpm (版本 8.15.0)
set "PNPM_REQUIRED_VERSION=8.15.0"
call :log_info "检查 pnpm 安装状态..."

pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do set "PNPM_CURRENT_VERSION=%%i"

    :: 检查版本是否匹配
    if "!PNPM_CURRENT_VERSION:~0,6!"=="%PNPM_REQUIRED_VERSION%" (
        call :log_success "pnpm 已安装且版本符合要求: !PNPM_CURRENT_VERSION!"
    ) else (
        call :log_warning "pnpm 版本不匹配: 已安装 !PNPM_CURRENT_VERSION!，需要 %PNPM_REQUIRED_VERSION%"
        call :log_info "正在更新 pnpm..."
        npm install -g pnpm@%PNPM_REQUIRED_VERSION%
        if %errorlevel% neq 0 (
            call :log_error "pnpm 更新失败"
            pause
            exit /b 1
        )
        for /f "tokens=*" %%i in ('pnpm --version') do set "PNPM_CURRENT_VERSION=%%i"
        call :log_success "pnpm 已更新到版本: !PNPM_CURRENT_VERSION!"
    )
) else (
    call :log_info "pnpm 未安装，正在安装..."
    npm install -g pnpm@%PNPM_REQUIRED_VERSION%
    if %errorlevel% neq 0 (
        call :log_error "pnpm 安装失败"
        call :log_warning "请手动安装 pnpm: https://pnpm.io/installation"
        pause
        exit /b 1
    )
    for /f "tokens=*" %%i in ('pnpm --version') do set "PNPM_CURRENT_VERSION=%%i"
    call :log_success "pnpm 已安装: !PNPM_CURRENT_VERSION!"
)

:: 注意：在monorepo项目中，依赖管理由根目录统一处理
:: 本脚本不再执行任何依赖安装操作

:: 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker 未安装，请先安装 Docker Desktop for Windows"
    call :log_warning "下载链接: https://docs.docker.com/desktop/install/windows-install/"
    call :log_warning "安装完成后请重启计算机并重新运行此脚本"
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
call :log_success "Docker 已安装: %DOCKER_VERSION%"

:: 检查 Docker 服务是否运行
docker info >nul 2>&1
if errorlevel 1 (
    call :log_warning "Docker Desktop 未运行"
    call :log_info "请确保 Docker Desktop 正在运行"
    call :log_info "正在等待 Docker 启动..."
    set /a "counter=0"
    :wait_docker
    set /a "counter+=1"
    if !counter! gtr 30 (
        call :log_error "Docker 启动超时"
        call :log_warning "请手动启动 Docker Desktop 并重新运行此脚本"
        pause
        exit /b 1
    )
    docker info >nul 2>&1
    if errorlevel 1 (
        timeout /t 5 /nobreak >nul
        goto wait_docker
    )
)

call :log_success "Docker 服务已启动"

:: 清理旧的 Docker 资源
call :log_info "清理旧的 Docker 资源..."
docker-compose down -v 2>nul || (call :log_info "没有需要清理的旧资源")
docker volume prune -f 2>nul || (call :log_info "无法清理卷")
docker network prune -f 2>nul || (call :log_info "无法清理网络")

:: 注意：在monorepo项目中，依赖管理由根目录统一处理
:: 本脚本不再执行任何依赖安装操作

:: 创建环境变量文件
if not exist "apps\backend\.env" (
    call :log_info "创建环境变量配置文件..."
    if not exist "apps\backend" mkdir "apps\backend"
    (
        echo # 数据库配置
        echo DB_HOST=localhost
        echo DB_PORT=5433
        echo DB_NAME=csisp
        echo DB_USER=postgres
        echo DB_PASSWORD=password
        echo.
        echo # Redis配置
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo REDIS_PASSWORD=
        echo REDIS_DB=0
        echo.
        echo # JWT配置
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
        echo JWT_EXPIRES_IN=1h
        echo JWT_REFRESH_EXPIRES_IN=7d
        echo.
        echo # 应用配置
        echo NODE_ENV=development
        echo PORT=3000
        echo LOG_LEVEL=info
        echo.
        echo # 文件上传配置
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=10485760
    ) > apps\backend\.env
    call :log_success "环境变量文件已创建 (apps\backend\.env)"
    call :log_warning "请根据实际情况修改 apps\backend\.env 文件中的配置"
) else (
    call :log_success "环境变量文件已存在 (apps\backend\.env)"
)

call :log_info "使用 infra/database 管理数据库"
call "%PROJECT_ROOT%\infra\database\scripts\init_windows.bat"

for /f "usebackq tokens=*" %%a in (`type "%PROJECT_ROOT%\infra\database\.env.db"`) do (
  for /f "tokens=1,2 delims==" %%i in ("%%a") do (
    if not "%%i"=="" set %%i=%%j
  )
)

:: 注意：在monorepo项目中，sequelize-cli应由根目录统一管理
:: 本脚本不再执行sequelize-cli的全局安装

call :log_info "运行数据库迁移..."
cd /d "packages\db-schema"
set DB_HOST=%DB_HOST%
set DB_PORT=%DB_PORT_HOST%
set DB_USER=%DB_USER%
set DB_PASSWORD=%DB_PASSWORD%
set DB_NAME=%DB_NAME%
pnpm run migrate
cd /d "%PROJECT_ROOT%"

if errorlevel 1 (
    call :log_error "数据库迁移失败"
    call :log_warning "请检查迁移文件和数据库连接配置"
    pause
    exit /b 1
)

call :log_success "数据库迁移完成"

:: 创建必要的目录
call :log_info "创建必要的目录结构..."
mkdir apps\backend\logs 2>nul
mkdir apps\backend\uploads 2>nul
mkdir apps\backend\uploads\temp 2>nul
mkdir apps\backend\uploads\homework 2>nul

call :log_success "目录结构创建完成"

call :log_info "执行种子数据..."
cd /d "packages\db-schema"
pnpm run seed
cd /d "%PROJECT_ROOT%"

if errorlevel 1 (
    call :log_error "CLI 种子数据执行失败"
    call :log_warning "请检查 seeders 目录中的脚本与数据库连接配置"
    pause
    exit /b 1
)

call :log_success "CLI 种子数据执行完成"

:: 注意：测试运行不再作为初始化脚本的一部分，避免影响初始化流程

:: 显示服务状态
call :log_info "
📊 服务状态检查:"
set "POSTGRES_STATUS=Down"
set "REDIS_STATUS=Down"

docker compose -f infra\database\docker-compose.db.yml ps postgres | findstr "Up" >nul
if %errorlevel% equ 0 (
    set "POSTGRES_STATUS=Up"
)

docker compose -f infra\database\docker-compose.db.yml ps redis | findstr "Up" >nul
if %errorlevel% equ 0 (
    set "REDIS_STATUS=Up"
)

if "%POSTGRES_STATUS%" == "Up" (
    echo    PostgreSQL: %GREEN%Up%NC%
) else (
    echo    PostgreSQL: %RED%Down%NC%
)

if "%REDIS_STATUS%" == "Up" (
    echo    Redis: %GREEN%Up%NC%
) else (
    echo    Redis: %RED%Down%NC%
)

:: 显示初始化完成信息
echo.
echo %GREEN%🎉 CSISP 后端环境初始化完成！%NC%
echo.
echo %GREEN%✅ 已完成的任务:%NC%
echo    • Node.js 环境检查
echo    • pnpm 包管理器安装
echo    • Docker 服务启动
echo    • 项目依赖安装
echo    • 环境变量配置
echo    • 数据库服务启动
echo    • 数据库迁移执行
echo    • 种子数据生成
echo    • 目录结构创建

echo.
echo %BLUE%📚 文档位置:%NC%
echo    • 后端设计文档: docs\project\后端设计文档.md
echo    • 数据库设计文档: docs\project\数据库设计文档.md
echo    • 种子数据脚本: packages\db-schema\seeders\*.cjs

echo.
echo %BLUE%🔧 常用命令:%NC%
echo    • 启动开发服务器: pnpm dev
echo    • 构建项目: pnpm build
echo    • 停止服务: docker compose -f infra\database\docker-compose.db.yml down

echo.
echo %YELLOW%💡 如果需要重新生成数据:%NC%
echo    (cd packages\db-schema && pnpm run migrate)
echo    (cd packages\db-schema && pnpm run seed)

:: 显示额外的提示信息
echo.
echo %YELLOW%ℹ️  注意事项:%NC%
echo    • 请确保.env文件中的JWT密钥在生产环境中修改为安全的值
echo    • 定期备份数据库以防止数据丢失
echo    • 如遇到端口冲突，请修改docker-compose.yml中的端口映射

echo.
echo %GREEN%✨ 初始化脚本执行完毕！%NC%

:: 询问是否立即启动后端服务
echo.
echo %BLUE%🚀 是否立即启动后端服务？%NC%
echo 启动服务将占用终端窗口，确定要现在启动吗？(y/N)
set /p START_SERVICE=
if /i "%START_SERVICE%"=="y" (
    call :log_info "正在启动后端服务..."
    :: 调用启动脚本
    if exist "%SCRIPT_DIR%\start_backend_windows.bat" (
        call "%SCRIPT_DIR%\start_backend_windows.bat"
    ) else (
        call :log_warning "未找到启动脚本，请手动执行："
        call :log_info "  cd apps/backend && pnpm dev"
    )
) else (
    call :log_info "您可以在任何时候使用以下命令启动后端服务："
    call :log_info "  cd apps/backend && pnpm dev"
    call :log_info "或者使用启动脚本："
    call :log_info "  apps/backend/scripts/start_backend_windows.bat"
)

pause

:: 结束延迟环境变量扩展
endlocal
