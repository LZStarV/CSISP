#!/usr/bin/env bash
set -e

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

log_info() { printf "[INFO] %s\n" "$1"; }
log_warn() { printf "%s[WARN]%s %s\n" "$YELLOW" "$RESET" "$1"; }
log_error() { printf "%s[ERROR]%s %s\n" "$RED" "$RESET" "$1" >&2; }
log_success() { printf "%s[OK]%s %s\n" "$GREEN" "$RESET" "$1"; }

RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
RESET=$'\033[0m'

export LC_ALL="en_US.UTF-8"
export LANG="en_US.UTF-8"

if [ -f ".nvmrc" ]; then
  REQUIRED_NODE_MAJOR=$(tr -d ' v' < .nvmrc)
else
  REQUIRED_NODE_MAJOR=22
fi

PNPM_LINE=$(grep '"packageManager"' package.json 2>/dev/null || true)
if [[ "$PNPM_LINE" =~ pnpm@([0-9.]+) ]]; then
  REQUIRED_PNPM_VERSION="${BASH_REMATCH[1]}"
else
  REQUIRED_PNPM_VERSION="10.22.0"
fi

NODE_STATUS="未检查"
NODE_OK=0
PNPM_STATUS="未检查"
PNPM_OK=0
DOCKER_STATUS="未检查"
DOCKER_OK=0
GIT_STATUS="未检查"
GIT_OK=0

if [ -z "${NVM_DIR:-}" ]; then
  NVM_DIR="$HOME/.nvm"
fi
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

log_info "正在检查 Node.js 环境 (期望主版本 $REQUIRED_NODE_MAJOR.x)"
  if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v 2>/dev/null || echo "")
  NODE_MAJOR=${NODE_VERSION#v}
  NODE_MAJOR=${NODE_MAJOR%%.*}
  if [ "$NODE_MAJOR" = "$REQUIRED_NODE_MAJOR" ]; then
    NODE_STATUS="已安装，版本符合要求: $NODE_VERSION"
    NODE_OK=1
    log_success "$NODE_STATUS"
  else
    log_warn "已安装 Node.js $NODE_VERSION, 期望主版本为 $REQUIRED_NODE_MAJOR.x"
    if command -v nvm >/dev/null 2>&1; then
      log_info "尝试通过 nvm 切换到 Node.js $REQUIRED_NODE_MAJOR"
      if nvm install "$REQUIRED_NODE_MAJOR" >/dev/null 2>&1 && nvm use "$REQUIRED_NODE_MAJOR" >/dev/null 2>&1; then
        NODE_VERSION=$(node -v 2>/dev/null || echo "")
        NODE_STATUS="已通过 nvm 切换到: $NODE_VERSION"
        NODE_OK=1
        log_success "$NODE_STATUS"
      else
        NODE_STATUS="已安装但无法切换到期望版本，请手动使用 nvm 或安装 Node.js $REQUIRED_NODE_MAJOR.x"
        log_warn "$NODE_STATUS"
      fi
    else
      NODE_STATUS="已安装但版本不符合要求，建议安装 nvm 或手动安装 Node.js $REQUIRED_NODE_MAJOR.x"
      log_warn "$NODE_STATUS"
    fi
  fi
else
  if command -v nvm >/dev/null 2>&1; then
    log_info "未检测到 Node.js，尝试通过 nvm 安装 Node.js $REQUIRED_NODE_MAJOR"
    if nvm install "$REQUIRED_NODE_MAJOR" >/dev/null 2>&1 && nvm use "$REQUIRED_NODE_MAJOR" >/dev/null 2>&1; then
      NODE_VERSION=$(node -v 2>/dev/null || echo "")
      NODE_STATUS="已通过 nvm 安装并切换到: $NODE_VERSION"
      NODE_OK=1
      log_success "$NODE_STATUS"
    else
      NODE_STATUS="通过 nvm 安装 Node.js 失败，请手动安装 Node.js $REQUIRED_NODE_MAJOR.x"
      log_error "$NODE_STATUS"
    fi
  else
    NODE_STATUS="未安装 Node.js，建议安装 nvm 或使用系统包管理器安装 Node.js $REQUIRED_NODE_MAJOR.x"
    log_error "$NODE_STATUS"
  fi
fi

log_info "正在检查 pnpm 环境 (期望版本 $REQUIRED_PNPM_VERSION)"
if command -v pnpm >/dev/null 2>&1; then
  PNPM_VERSION_RAW=$(pnpm -v 2>/dev/null || echo "")
  PNPM_VERSION=$(printf "%s" "$PNPM_VERSION_RAW" | tr -d '\r\n' | LC_ALL=C tr -cd '0-9.')
  if [[ "$PNPM_VERSION" == "$REQUIRED_PNPM_VERSION"* ]]; then
    PNPM_STATUS="已安装，版本符合要求: $PNPM_VERSION"
    PNPM_OK=1
    log_success "$PNPM_STATUS"
  else
    log_warn "已安装 pnpm $PNPM_VERSION，期望版本为 $REQUIRED_PNPM_VERSION"
    if command -v npm >/dev/null 2>&1; then
      log_info "尝试通过 npm 安装 pnpm@$REQUIRED_PNPM_VERSION"
      if npm install -g "pnpm@$REQUIRED_PNPM_VERSION" >/dev/null 2>&1; then
        PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "")
        PNPM_STATUS="已更新 pnpm 至: $PNPM_VERSION"
        PNPM_OK=1
        log_success "$PNPM_STATUS"
      else
        PNPM_STATUS="pnpm 更新失败，请手动执行: npm install -g pnpm@$REQUIRED_PNPM_VERSION"
        log_error "$PNPM_STATUS"
      fi
    else
      PNPM_STATUS="未检测到 npm，无法自动更新 pnpm，请手动安装 pnpm@$REQUIRED_PNPM_VERSION"
      log_error "$PNPM_STATUS"
    fi
  fi
else
  if command -v npm >/dev/null 2>&1; then
    log_info "未检测到 pnpm，尝试通过 npm 安装 pnpm@$REQUIRED_PNPM_VERSION"
    if npm install -g "pnpm@$REQUIRED_PNPM_VERSION" >/dev/null 2>&1; then
      PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "")
      PNPM_STATUS="已安装 pnpm: $PNPM_VERSION"
      PNPM_OK=1
      log_success "$PNPM_STATUS"
    else
      PNPM_STATUS="通过 npm 安装 pnpm 失败，请手动安装 pnpm@$REQUIRED_PNPM_VERSION"
      log_error "$PNPM_STATUS"
    fi
  else
    PNPM_STATUS="未安装 pnpm，且未检测到 npm，请先安装 Node.js/npm 后再安装 pnpm@$REQUIRED_PNPM_VERSION"
    log_error "$PNPM_STATUS"
  fi
fi

log_info "正在检查 Docker 环境"
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    DOCKER_STATUS="Docker 已安装且服务可用"
    DOCKER_OK=1
    log_success "$DOCKER_STATUS"
  else
    DOCKER_STATUS="检测到 Docker，但服务未就绪，尝试启动并重试检测"
    log_warn "$DOCKER_STATUS"
    # 常见发行版：尝试启动服务
    if command -v systemctl >/dev/null 2>&1; then
      sudo systemctl start docker >/dev/null 2>&1 || true
    elif command -v service >/dev/null 2>&1; then
      sudo service docker start >/dev/null 2>&1 || true
    fi
    for i in {1..15}; do
      if docker info >/dev/null 2>&1; then
        DOCKER_STATUS="Docker 服务已就绪"
        DOCKER_OK=1
        log_success "$DOCKER_STATUS"
        break
      fi
      sleep 2
    done
    if [ "$DOCKER_OK" -ne 1 ]; then
      log_warn "Docker 服务仍未就绪，请手动启动并确保当前用户有权限运行 docker"
      log_info "可以在项目根目录执行: bash infra/database/scripts/init_linux.sh，启动数据库相关容器并等待就绪"
    fi
  fi
else
  if command -v apt-get >/dev/null 2>&1; then
    log_info "未检测到 Docker，尝试通过 apt-get 安装"
    if sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y docker.io docker-compose-plugin >/dev/null 2>&1; then
      DOCKER_STATUS="已通过 apt-get 安装 Docker，请确保当前用户有权限运行 docker 命令"
      DOCKER_OK=1
      log_success "$DOCKER_STATUS"
    else
      DOCKER_STATUS="通过 apt-get 安装 Docker 失败，请参考发行版文档手动安装"
      log_error "$DOCKER_STATUS"
    fi
  elif command -v yum >/dev/null 2>&1; then
    log_info "未检测到 Docker，尝试通过 yum 安装"
    if sudo yum install -y docker docker-compose >/dev/null 2>&1; then
      DOCKER_STATUS="已通过 yum 安装 Docker，请启动 Docker 服务并配置权限"
      DOCKER_OK=1
      log_success "$DOCKER_STATUS"
    else
      DOCKER_STATUS="通过 yum 安装 Docker 失败，请参考发行版文档手动安装"
      log_error "$DOCKER_STATUS"
    fi
  else
    DOCKER_STATUS="未检测到 Docker，且未识别常见包管理器，请参照 https://docs.docker.com/engine/install/ 手动安装"
    log_error "$DOCKER_STATUS"
  fi
fi

log_info "正在检查 Apache Thrift 编译器"
THRIFT_STATUS="未检查"
THRIFT_OK=0
if command -v thrift >/dev/null 2>&1; then
  THRIFT_VERSION=$(thrift --version 2>/dev/null || echo "thrift")
  THRIFT_STATUS="已安装: $THRIFT_VERSION"
  THRIFT_OK=1
  log_success "$THRIFT_STATUS"
else
  # 按发行版尝试安装
  if command -v apt-get >/dev/null 2>&1; then
    log_info "未检测到 thrift，尝试通过 apt-get 安装 (thrift-compiler)"
    if sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y thrift-compiler >/dev/null 2>&1; then
      if command -v thrift >/dev/null 2>&1; then
        THRIFT_VERSION=$(thrift --version 2>/dev/null || echo "thrift")
        THRIFT_STATUS="已安装: $THRIFT_VERSION"
        THRIFT_OK=1
        log_success "$THRIFT_STATUS"
      else
        THRIFT_STATUS="安装后仍未检测到 thrift，请检查安装日志"
        log_error "$THRIFT_STATUS"
      fi
    else
      THRIFT_STATUS="通过 apt-get 安装 thrift 失败，请参考发行版文档手动安装"
      log_error "$THRIFT_STATUS"
    fi
  elif command -v dnf >/dev/null 2>&1; then
    log_info "未检测到 thrift，尝试通过 dnf 安装"
    if sudo dnf install -y thrift >/dev/null 2>&1; then
      THRIFT_VERSION=$(thrift --version 2>/dev/null || echo "thrift")
      THRIFT_STATUS="已安装: $THRIFT_VERSION"
      THRIFT_OK=1
      log_success "$THRIFT_STATUS"
    else
      THRIFT_STATUS="通过 dnf 安装 thrift 失败，请参考发行版文档手动安装"
      log_error "$THRIFT_STATUS"
    fi
  elif command -v yum >/dev/null 2>&1; then
    log_info "未检测到 thrift，尝试通过 yum 安装"
    if sudo yum install -y thrift >/dev/null 2>&1; then
      THRIFT_VERSION=$(thrift --version 2>/dev/null || echo "thrift")
      THRIFT_STATUS="已安装: $THRIFT_VERSION"
      THRIFT_OK=1
      log_success "$THRIFT_STATUS"
    else
      THRIFT_STATUS="通过 yum 安装 thrift 失败，请参考发行版文档手动安装"
      log_error "$THRIFT_STATUS"
    fi
  else
    THRIFT_STATUS="未检测到常见包管理器，无法自动安装 thrift，请手动安装"
    log_error "$THRIFT_STATUS"
  fi
fi
log_info "正在检查 Git 环境"
if command -v git >/dev/null 2>&1; then
  GIT_VERSION=$(git --version 2>/dev/null || echo "git")
  GIT_STATUS="已安装: $GIT_VERSION"
  GIT_OK=1
  log_success "$GIT_STATUS"
else
  GIT_STATUS="未安装 Git，请通过发行版包管理器安装"
  log_error "$GIT_STATUS"
fi

TOTAL=5
COMPLETED=0
if [ "$NODE_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$PNPM_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$DOCKER_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$THRIFT_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$GIT_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi

printf "\n======== 环境检查结果汇总 [%d / %d] ========\n" "$COMPLETED" "$TOTAL"

if [ "$COMPLETED" -eq "$TOTAL" ]; then
  printf "\n%s所有必需环境组件已就绪，可以继续进行项目开发。%s\n" "$GREEN" "$RESET"
  printf "\n推荐的后续操作：\n"
  printf "1) 安装依赖:\n   pnpm i\n"
  printf "2) 启动数据库基础设施:\n   bash infra/database/scripts/init_linux.sh\n"
  printf "3) 初始化数据库结构与种子数据:\n   pnpm -F @csisp/db-schema run migrate\n   pnpm -F @csisp/db-schema run seed\n"
printf "4) 启动 BFF 与 backend-integrated:\n   pnpm -F @csisp/bff dev\n   pnpm -F @csisp/backend-integrated dev\n"
  printf "5) 启动前端项目:\n   pnpm -F @csisp/frontend-admin dev\n   pnpm -F @csisp/frontend-portal dev\n"
else
  printf "\n%s未完成的环境组件及建议操作：%s\n" "$RED" "$RESET"
  if [ "$NODE_OK" -ne 1 ]; then
    printf "%s- Node.js: %s%s\n" "$RED" "$NODE_STATUS" "$RESET"
  fi
  if [ "$PNPM_OK" -ne 1 ]; then
    printf "%s- pnpm: %s%s\n" "$RED" "$PNPM_STATUS" "$RESET"
  fi
  if [ "$DOCKER_OK" -ne 1 ]; then
    printf "%s- Docker: %s%s\n" "$RED" "$DOCKER_STATUS" "$RESET"
  fi
  if [ "$GIT_OK" -ne 1 ]; then
    printf "%s- Git: %s%s\n" "$RED" "$GIT_STATUS" "$RESET"
  fi
fi
