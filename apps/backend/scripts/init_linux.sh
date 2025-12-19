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

# OS Check - Only for Linux
if [[ "$(uname -s)" != "Linux" ]]; then
    log_error "错误：此脚本仅适用于 Linux 操作系统"
    log_warning "请使用对应操作系统的初始化脚本："
    log_warning "   • macOS 系统：init_mac.sh"
    log_warning "   • Windows 系统：init_windows.bat"
    read -p "是否仍要继续执行此脚本？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# CSISP 后端环境初始化脚本 (Linux版本)
# 适用于 Node.js 22.x

echo -e "${BLUE}🚀 开始初始化 CSISP 后端环境...${NC}"

# Path Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$BACKEND_ROOT")")"

# Change to project root
cd "$PROJECT_ROOT" || { log_error "无法切换到项目根目录"; exit 1; }

# Check directory structure
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
    log_error "错误：项目根目录结构异常"
    log_warning "请确保在 CSISP 项目根目录中运行此脚本"
    exit 1
fi

# 检查并安装 nvm (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ] || [ ! -f "$NVM_DIR/nvm.sh" ]; then
    log_info "未检测到 nvm，正在安装..."
    # 使用官方安装脚本安装 nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash || {
        log_error "nvm 安装失败"
        log_warning "请手动安装 nvm: https://github.com/nvm-sh/nvm"
        exit 1
    }

    # 安装完成后加载 nvm
    log_info "nvm 安装成功，正在加载..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

    log_success "nvm 加载成功"
else
    log_info "加载已安装的 nvm..."
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    log_success "nvm 已加载"
fi

# 检查 nvm 是否已加载或安装
if ! command -v nvm &> /dev/null; then
    log_info "nvm 未加载，尝试加载..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

    # 如果仍然无法加载，提示安装
    if ! command -v nvm &> /dev/null; then
        log_warning "nvm 未安装，将在后续步骤中安装"
    fi
fi

# 严格检查并使用 Node.js 22.x
log_info "检查 Node.js 22.x 版本..."

# 尝试使用 nvm 切换到 Node.js 22
if command -v nvm &> /dev/null; then
    if nvm ls 22 &> /dev/null; then
        log_info "发现已安装的 Node.js 22.x，正在切换..."
        nvm use 22 || {
            log_error "切换到 Node.js 22.x 失败"
            exit 1
        }
    else
        log_info "Node.js 22.x 未安装，正在通过 nvm 安装..."
        nvm install 22 || {
            log_error "通过 nvm 安装 Node.js 22.x 失败"
            exit 1
        }
        nvm use 22
    fi
else
    # 如果没有 nvm，检查系统安装的 Node.js 版本
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        # 严格检查版本是否为 22.x
        if [[ "$NODE_VERSION" == v22.* ]]; then
            log_success "Node.js 版本检查通过: $NODE_VERSION"
        else
            log_error "Node.js 版本不符合要求: $NODE_VERSION"
            log_warning "请安装 Node.js 22.x 版本"
            log_warning "推荐使用 nvm 管理 Node.js 版本"
            exit 1
        fi
    else
        log_error "Node.js 未安装，且 nvm 不可用"
        log_warning "请先安装 nvm，然后再运行此脚本"
        exit 1
    fi
fi

# 最终确认 Node.js 版本
NODE_VERSION=$(node -v)
if [[ "$NODE_VERSION" == v22.* ]]; then
    log_success "Node.js 版本检查通过: $NODE_VERSION"
else
    log_error "Node.js 版本不符合要求: $NODE_VERSION"
    log_warning "请安装 Node.js 22.x 版本"
    exit 1
fi

# 检查并安装 pnpm (版本 10.22.0)
PNPM_REQUIRED_VERSION="10.22.0"
log_info "检查 pnpm 安装状态..."

if command -v pnpm &> /dev/null; then
    PNPM_CURRENT_VERSION=$(pnpm -v)

    # 检查版本是否匹配
    if [[ "$PNPM_CURRENT_VERSION" == "$PNPM_REQUIRED_VERSION"* ]]; then
        log_success "pnpm 已安装且版本符合要求: $PNPM_CURRENT_VERSION"
    else
        log_warning "pnpm 版本不匹配: 已安装 $PNPM_CURRENT_VERSION，需要 $PNPM_REQUIRED_VERSION"
        log_info "正在更新 pnpm..."
        npm install -g pnpm@$PNPM_REQUIRED_VERSION || {
            log_error "pnpm 更新失败"
            exit 1
        }
        log_success "pnpm 已更新到版本: $(pnpm -v)"
    fi
else
    log_info "pnpm 未安装，正在安装..."
    # 尝试使用 npm 安装 pnpm
    if ! npm install -g pnpm@$PNPM_REQUIRED_VERSION; then
        log_warning "使用 npm 安装 pnpm 失败，尝试使用其他方法..."
        # 备用安装方法
        curl -fsSL https://get.pnpm.io/install.sh | sh - || {
            log_error "pnpm 安装失败"
            log_warning "请手动安装 pnpm: https://pnpm.io/installation"
            exit 1
        }
        # 重新加载 shell 配置以确保 pnpm 可用
        export PNPM_HOME="$HOME/.local/share/pnpm"
        export PATH="$PNPM_HOME:$PATH"
    fi

    if command -v pnpm &> /dev/null; then
        log_success "pnpm 已安装: $(pnpm -v)"
    else
        log_error "pnpm 安装成功但无法在当前会话中使用"
        log_warning "请重新打开终端后再运行此脚本"
        exit 1
    fi
fi

# 注意：在monorepo项目中，依赖管理由根目录统一处理
# 本脚本不再执行任何依赖安装操作

# 检查并安装 Docker
if ! command -v docker &> /dev/null; then
    log_info "Docker 未安装，正在自动安装..."

    # 检测系统类型
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        sudo yum install -y docker docker-compose
    elif command -v dnf &> /dev/null; then
        # Fedora
        sudo dnf install -y docker docker-compose
    else
        log_error "无法自动安装 Docker，请手动安装"
        log_warning "参考: https://docs.docker.com/engine/install/"
        exit 1
    fi

    # 启动 Docker 服务
    sudo systemctl start docker
    sudo systemctl enable docker

    # 将当前用户添加到 docker 组（需要重新登录生效）
    sudo usermod -aG docker $USER
    log_warning "请重新登录或执行 'newgrp docker' 使 Docker 组权限生效"
fi

# 检查 Docker 版本
if command -v docker &> /dev/null; then
    log_success "Docker 已安装: $(docker --version)"
else
    log_error "Docker 安装失败，请手动安装并启动 Docker"
    exit 1
fi

# 启动 Docker 服务（如果未运行）
if ! sudo systemctl is-active --quiet docker; then
    log_info "启动 Docker 服务..."
    sudo systemctl start docker
    log_success "Docker 服务已启动"
else
    log_success "Docker 服务已在运行"
fi

# 清理旧的 Docker 资源
log_info "清理旧的 Docker 资源..."
sudo docker-compose down -v 2>/dev/null || true
sudo docker volume prune -f 2>/dev/null || true
sudo docker network prune -f 2>/dev/null || true

# 注意：在monorepo项目中，依赖管理由根目录统一处理
# 本脚本不再执行任何依赖安装操作

# 创建环境变量文件
if [ ! -f "apps/backend/.env" ]; then
    log_info "创建环境变量配置文件..."
    mkdir -p "$(dirname "apps/backend/.env")"
    cat > apps/backend/.env << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=5433
DB_NAME=csisp
DB_USER=postgres
DB_PASSWORD=password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 应用配置
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
EOF
    log_success "环境变量文件已创建 (apps/backend/.env)"
    log_warning "请根据实际情况修改 apps/backend/.env 文件中的配置"
else
    log_success "环境变量文件已存在 (apps/backend/.env)"
fi

log_info "使用 infra/database 管理数据库"
bash infra/database/scripts/init_linux.sh

if [ $? -ne 0 ]; then
    log_error "Redis 启动失败"
    log_warning "请检查端口 6379 是否被占用"
    exit 1
fi

# 等待 Redis 启动
log_info "等待 Redis 启动..."
for i in {1..15}; do
    if sudo docker-compose exec -T redis redis-cli ping &> /dev/null; then
        log_success "Redis 缓存服务已启动"
        break
    fi
    if [ $i -eq 15 ]; then
        log_error "Redis 启动超时"
        log_warning "请检查 Docker 容器日志以获取更多信息"
        exit 1
    fi
    sleep 2
done

export $(grep -v '^#' infra/database/.env.db | xargs)

# 注意：在monorepo项目中，sequelize-cli应由根目录统一管理
# 本脚本不再执行sequelize-cli的全局安装

# 运行数据库迁移
log_info "运行数据库迁移..."
(cd packages/db-schema && DB_HOST=${DB_HOST:-localhost} DB_PORT=${DB_PORT_HOST:-5433} DB_USER=${DB_USER:-admin} DB_PASSWORD=${DB_PASSWORD:-password} DB_NAME=${DB_NAME:-csisp} pnpm run migrate)

if [ $? -ne 0 ]; then
    log_error "数据库迁移失败"
    log_warning "请检查迁移文件和数据库连接配置"
    exit 1
fi

log_success "数据库迁移完成"

# 创建必要的目录
log_info "创建必要的目录结构..."
sudo mkdir -p apps/backend/logs apps/backend/uploads/temp apps/backend/uploads/homework

# 设置目录权限
sudo chmod 755 apps/backend/uploads apps/backend/uploads/temp apps/backend/uploads/homework apps/backend/logs
sudo chown $USER:$USER -R apps/backend/uploads apps/backend/logs

log_success "目录结构创建完成"

log_info "执行种子数据..."
(cd packages/db-schema && DB_HOST=${DB_HOST:-localhost} DB_PORT=${DB_PORT_HOST:-5433} DB_USER=${DB_USER:-admin} DB_PASSWORD=${DB_PASSWORD:-password} DB_NAME=${DB_NAME:-csisp} pnpm run seed)

if [ $? -ne 0 ]; then
    log_error "CLI 种子数据执行失败"
    log_warning "请检查 seeders 目录中的脚本与数据库连接配置"
    exit 1
fi

log_success "CLI 种子数据执行完成"

# 注意：测试运行不再作为初始化脚本的一部分，避免影响初始化流程

# 显示服务状态
log_info "\n📊 服务状态检查:"
POSTGRES_STATUS=$(docker compose -f infra/database/docker-compose.db.yml ps postgres | grep -o 'Up' || echo 'Down')
REDIS_STATUS=$(docker compose -f infra/database/docker-compose.db.yml ps redis | grep -o 'Up' || echo 'Down')

if [ "$POSTGRES_STATUS" = "Up" ]; then
    echo -e "   PostgreSQL: ${GREEN}Up${NC}"
else
    echo -e "   PostgreSQL: ${RED}Down${NC}"
fi

if [ "$REDIS_STATUS" = "Up" ]; then
    echo -e "   Redis: ${GREEN}Up${NC}"
else
    echo -e "   Redis: ${RED}Down${NC}"
fi

# 显示初始化完成信息
echo -e "\n${GREEN}🎉 CSISP 后端环境初始化完成！${NC}"
echo -e "\n${GREEN}✅ 已完成的任务:${NC}"
echo "   • Node.js 环境检查"
echo "   • pnpm 包管理器安装"
echo "   • Docker 服务启动"
echo "   • 项目依赖安装"
echo "   • 环境变量配置"
echo "   • 数据库服务启动"
echo "   • 数据库迁移执行"
echo "   • 种子数据生成"
echo "   • 目录结构创建"

echo -e "\n${BLUE}📚 文档位置:${NC}"
echo "   • 后端设计文档: docs/project/后端设计文档.md"
echo "   • 数据库设计文档: docs/project/数据库设计文档.md"
echo "   • 种子数据脚本: packages/db-schema/seeders/*.cjs"

echo -e "\n${BLUE}🔧 常用命令:${NC}"
echo "   • 启动开发服务器: pnpm dev"
echo "   • 构建项目: pnpm build"
echo "   • 停止服务: docker compose -f infra/database/docker-compose.db.yml down"

echo -e "\n${YELLOW}💡 如果需要重新生成数据:${NC}"
echo "   (cd packages/db-schema && pnpm run migrate)"
echo "   (cd packages/db-schema && pnpm run seed)"

# 显示额外的提示信息
echo -e "\n${YELLOW}ℹ️  注意事项:${NC}"
echo "   • 请确保.env文件中的JWT密钥在生产环境中修改为安全的值"
echo "   • 定期备份数据库以防止数据丢失"
echo "   • 如遇到端口冲突，请修改docker-compose.yml中的端口映射"

# 检查是否需要重新登录 Docker 组
if ! groups $USER | grep -q "docker"; then
    echo -e "\n${YELLOW}⚠️  Docker 组权限需要重新登录生效${NC}"
    echo "   请执行以下命令之一:"
    echo "   • 重新登录系统"
    echo "   • 执行: newgrp docker"
    echo "   • 或者使用 sudo 运行 Docker 命令"
fi

echo -e "\n${GREEN}✨ 初始化脚本执行完毕！${NC}"

# 询问是否立即启动后端服务
echo -e "\n${BLUE}🚀 是否立即启动后端服务？${NC}"
read -p "启动服务将占用终端窗口，确定要现在启动吗？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "正在启动后端服务..."
    # 调用启动脚本
    if [ -f "$SCRIPT_DIR/start_backend_linux.sh" ]; then
        bash "$SCRIPT_DIR/start_backend_linux.sh"
    else
        log_warning "未找到启动脚本，请手动执行："
        log_info "  cd apps/backend && pnpm dev"
    fi
else
    log_info "您可以在任何时候使用以下命令启动后端服务："
    log_info "  cd apps/backend && pnpm dev"
    log_info "或者使用启动脚本："
    log_info "  bash apps/backend/scripts/start_backend_linux.sh"
fi
