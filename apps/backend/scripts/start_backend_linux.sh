#!/bin/bash

# 启用严格模式
set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}🔍 ${1}${NC}"; }
log_success() { echo -e "${GREEN}✅ ${1}${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  ${1}${NC}"; }
log_error() { echo -e "${RED}❌ ${1}${NC}"; }

# CSISP 后端服务启动脚本 (Linux版本)
echo -e "${BLUE}🚀 开始启动 CSISP 后端服务...${NC}"

# Path Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$BACKEND_ROOT")")"

# Change to backend directory
cd "$BACKEND_ROOT" || { log_error "无法切换到后端目录"; exit 1; }

# 检查环境配置文件
if [ ! -f ".env" ]; then
    log_error "未找到环境配置文件 .env"
    log_warning "请先运行初始化脚本或手动创建 .env 文件"
    exit 1
fi

# 检查依赖安装
if [ ! -d "node_modules" ]; then
    log_info "检测到依赖未安装，正在安装..."
    pnpm install || {
        log_error "依赖安装失败"
        exit 1
    }
fi

# 检查数据库连接
log_info "检查数据库连接..."
if ! pnpm exec sequelize-cli db:migrate:status &> /dev/null; then
    log_error "数据库连接失败"
    log_warning "请确保："
    log_warning "  • PostgreSQL 服务正在运行"
    log_warning "  • 数据库配置正确 (.env文件)"
    log_warning "  • 数据库已初始化"
    exit 1
fi

log_success "数据库连接正常"

# 检查端口占用
PORT=${PORT:-3000}
if command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "端口 $PORT 已被占用"
        log_warning "请检查是否有其他服务占用了该端口，或修改 .env 文件中的 PORT 配置"
        exit 1
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":$PORT "; then
        log_error "端口 $PORT 已被占用"
        log_warning "请检查是否有其他服务占用了该端口，或修改 .env 文件中的 PORT 配置"
        exit 1
    fi
else
    log_warning "无法检查端口占用情况（未找到 lsof 或 netstat 命令）"
fi

# 启动开发服务器
log_info "正在启动开发服务器 (端口: $PORT)..."
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 使用 trap 捕获中断信号，确保服务可以优雅关闭
trap 'log_info "正在停止服务..."; kill %1 2>/dev/null; exit 0' INT TERM

# 启动服务
pnpm dev &

# 等待服务启动
log_info "等待服务启动..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT/health >/dev/null 2>&1; then
        log_success "后端服务启动成功！"
        echo -e "${GREEN}🎉 CSISP 后端服务已在 http://localhost:$PORT 启动${NC}"
        echo -e "${BLUE}📊 服务状态: 运行中${NC}"
        echo -e "${BLUE}📝 日志: 实时显示下方${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "服务启动超时"
        log_warning "请检查日志输出以获取更多信息"
        kill %1 2>/dev/null
        exit 1
    fi
    sleep 2
done

# 保持脚本运行，等待用户中断
wait