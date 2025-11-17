@echo off
chcp 65001 >nul

:: 启用延迟环境变量扩展
setlocal enabledelayedexpansion

:: 颜色定义（Windows 命令提示符颜色代码）
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"  :: No Color

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

:: CSISP 后端服务启动脚本 (Windows版本)
echo %BLUE%🚀 开始启动 CSISP 后端服务...%NC%

:: 获取脚本所在目录和项目根目录
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"  :: 移除末尾的反斜杠
set "BACKEND_ROOT=%SCRIPT_DIR%\.."

:: 切换到后端目录
cd /d "%BACKEND_ROOT%" || (
    call :log_error "无法切换到后端目录"
    pause
    exit /b 1
)

:: 检查环境配置文件
if not exist ".env" (
    call :log_error "未找到环境配置文件 .env"
    call :log_warning "请先运行初始化脚本或手动创建 .env 文件"
    pause
    exit /b 1
)

:: 检查依赖安装
if not exist "node_modules" (
    call :log_info "检测到依赖未安装，正在安装..."
    pnpm install
    if errorlevel 1 (
        call :log_error "依赖安装失败"
        pause
        exit /b 1
    )
)

:: 检查数据库连接
call :log_info "检查数据库连接..."
pnpm exec sequelize-cli db:migrate:status >nul 2>&1
if errorlevel 1 (
    call :log_error "数据库连接失败"
    call :log_warning "请确保："
    call :log_warning "  • PostgreSQL 服务正在运行"
    call :log_warning "  • 数据库配置正确 (.env文件)"
    call :log_warning "  • 数据库已初始化"
    pause
    exit /b 1
)

call :log_success "数据库连接正常"

:: 检查端口占用
set "PORT=3000"
netstat -an | findstr ":%PORT% " | findstr "LISTEN" >nul
if not errorlevel 1 (
    call :log_error "端口 %PORT% 已被占用"
    call :log_warning "请检查是否有其他服务占用了该端口，或修改 .env 文件中的 PORT 配置"
    pause
    exit /b 1
)

:: 启动开发服务器
call :log_info "正在启动开发服务器 (端口: %PORT%)..."
echo %YELLOW%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

:: 启动服务
echo %BLUE%📝 正在启动服务，请稍候...%NC%
pnpm dev

:: 如果pnpm dev执行失败，显示错误信息
if errorlevel 1 (
    call :log_error "服务启动失败"
    call :log_warning "请检查日志输出以获取更多信息"
    pause
    exit /b 1
)

:: 结束延迟环境变量扩展
endlocal