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
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
export HOMEBREW_NO_ENV_HINTS=1
export NONINTERACTIVE=1

log_info "正在检查 Infisical CLI"
if command -v infisical >/dev/null 2>&1; then
  log_success "已安装 Infisical CLI"
else
  log_warn "未检测到 Infisical CLI"
  if command -v brew >/dev/null 2>&1; then
    log_info "可通过 Homebrew 安装: brew install InfisicalHQ/infisical/infisical"
  else
    log_info "请参考官方说明安装 CLI: https://infisical.com/docs/cli/overview"
  fi
fi

if [ -f ".nvmrc" ]; then
  REQUIRED_NODE_MAJOR=$(tr -d ' v' < .nvmrc)
else
  REQUIRED_NODE_MAJOR=18
fi

REQUIRED_PNPM_MAJOR=10

NODE_STATUS="未检查"
NODE_OK=0
NODE_VERSION=""
NODE_MAJOR=""
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
    NODE_STATUS="未安装 Node.js，建议先安装 nvm，然后安装 Node.js $REQUIRED_NODE_MAJOR.x"
    log_error "$NODE_STATUS"
  fi
fi

log_info "正在检查 pnpm 环境 (期望主版本 $REQUIRED_PNPM_MAJOR.x)"
if command -v pnpm >/dev/null 2>&1; then
  PNPM_VERSION_RAW=$(pnpm -v 2>/dev/null || echo "")
  PNPM_VERSION=$(printf "%s" "$PNPM_VERSION_RAW" | tr -d '\r\n' | LC_ALL=C tr -cd '0-9.')
  PNPM_MAJOR=$(printf "%s" "$PNPM_VERSION" | cut -d. -f1)
  if [ "$PNPM_MAJOR" -ge "$REQUIRED_PNPM_MAJOR" ]; then
    PNPM_STATUS="已安装，版本符合要求: $PNPM_VERSION"
    PNPM_OK=1
    log_success "$PNPM_STATUS"
  else
    log_warn "已安装 pnpm $PNPM_VERSION，期望主版本为 $REQUIRED_PNPM_MAJOR.x"
    if command -v npm >/dev/null 2>&1; then
      log_info "尝试通过 npm 安装 pnpm@$REQUIRED_PNPM_MAJOR"
      if npm install -g "pnpm@$REQUIRED_PNPM_MAJOR" >/dev/null 2>&1; then
        PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "")
        PNPM_STATUS="已更新 pnpm 至: $PNPM_VERSION"
        PNPM_OK=1
        log_success "$PNPM_STATUS"
      else
        PNPM_STATUS="pnpm 更新失败，请手动执行: npm install -g pnpm@$REQUIRED_PNPM_MAJOR"
        log_error "$PNPM_STATUS"
      fi
    else
      PNPM_STATUS="未检测到 npm，无法自动更新 pnpm，请手动安装 pnpm@$REQUIRED_PNPM_MAJOR"
      log_error "$PNPM_STATUS"
    fi
  fi
else
  if command -v npm >/dev/null 2>&1; then
    log_info "未检测到 pnpm，尝试通过 npm 安装 pnpm@$REQUIRED_PNPM_MAJOR"
    if npm install -g "pnpm@$REQUIRED_PNPM_MAJOR" >/dev/null 2>&1; then
      PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "")
      PNPM_STATUS="已安装 pnpm: $PNPM_VERSION"
      PNPM_OK=1
      log_success "$PNPM_STATUS"
    else
      PNPM_STATUS="通过 npm 安装 pnpm 失败，请手动安装 pnpm@$REQUIRED_PNPM_MAJOR"
      log_error "$PNPM_STATUS"
    fi
  else
    PNPM_STATUS="未安装 pnpm，且未检测到 npm，请先安装 Node.js/npm 后再安装 pnpm@$REQUIRED_PNPM_MAJOR"
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
    DOCKER_STATUS="检测到 Docker，但服务未就绪，尝试启动 Docker Desktop"
    log_warn "$DOCKER_STATUS"
    open -a Docker || true
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
      log_warn "Docker 服务仍未就绪，请手动启动 Docker Desktop"
      log_info "可以在项目根目录执行: bash infra/database/scripts/init_mac.sh，启动数据库相关容器并等待就绪"
    fi
  fi
else
  if command -v brew >/dev/null 2>&1; then
    log_info "未检测到 Docker，尝试通过 Homebrew 安装 Docker Desktop"
    if brew install --cask docker; then
      DOCKER_STATUS="已通过 Homebrew 安装 Docker Desktop，请手动启动 Docker 应用"
      log_success "$DOCKER_STATUS"
    else
      DOCKER_STATUS="通过 Homebrew 安装 Docker Desktop 失败，请手动安装: https://www.docker.com/products/docker-desktop/"
      log_error "$DOCKER_STATUS"
    fi
  else
    DOCKER_STATUS="未检测到 Docker，也未检测到 Homebrew，请手动安装 Docker Desktop: https://www.docker.com/products/docker-desktop/"
    log_error "$DOCKER_STATUS"
  fi
fi


log_info "正在检查 Git 环境"
if command -v git >/dev/null 2>&1; then
  GIT_VERSION=$(git --version 2>/dev/null || echo "git")
  GIT_STATUS="已安装: $GIT_VERSION"
  GIT_OK=1
  log_success "$GIT_STATUS"
else
  GIT_STATUS="未安装 Git，建议通过 Xcode Command Line Tools 或 Homebrew 安装"
  log_error "$GIT_STATUS"
fi

TOTAL=4
COMPLETED=0
if [ "$NODE_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$PNPM_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$DOCKER_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi
if [ "$GIT_OK" -eq 1 ]; then COMPLETED=$((COMPLETED + 1)); fi

printf "\n======== 环境检查结果汇总 [%d / %d] ========\n" "$COMPLETED" "$TOTAL"

if [ "$COMPLETED" -eq "$TOTAL" ]; then
  printf "\n%s所有必需环境组件已就绪，可以继续进行项目开发。%s\n" "$GREEN" "$RESET"
  printf "\n推荐的后续操作：\n"
  printf "1) 安装依赖:\n   pnpm i\n"
  printf "2) 启动基础设施与生成 IDL:\n   pnpm run dev:infra\n"
  printf "3) 启动后端集成服务:\n   pnpm run dev:backend-integrated\n"
  printf "4) 启动前端项目（管理端与门户）:\n   pnpm run dev:admin\n   pnpm run dev:portal\n"
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
