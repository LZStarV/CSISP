#!/usr/bin/env bash
set -e

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

log_info() { printf "[INFO] %s\n" "$1"; }
log_warn() { printf "[WARN] %s\n" "$1"; }
log_error() { printf "[ERROR] %s\n" "$1" >&2; }
log_success() { printf "[OK] %s\n" "$1"; }

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
    log_warn "已安装 Node.js $NODE_VERSION，期望主版本为 $REQUIRED_NODE_MAJOR.x"
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

log_info "正在检查 pnpm 环境 (期望版本 $REQUIRED_PNPM_VERSION)"
if command -v pnpm >/dev/null 2>&1; then
  PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "")
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
    DOCKER_STATUS="检测到 Docker，但服务未就绪，请确保 Docker Desktop 已启动"
    log_warn "$DOCKER_STATUS"
  fi
else
  if command -v brew >/dev/null 2>&1; then
    log_info "未检测到 Docker，尝试通过 Homebrew 安装 Docker Desktop"
    if brew install --cask docker >/dev/null 2>&1; then
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

printf "\n======== 环境检查结果汇总 ========\n"
printf "Node.js: %s\n" "$NODE_STATUS"
printf "pnpm: %s\n" "$PNPM_STATUS"
printf "Docker: %s\n" "$DOCKER_STATUS"
printf "Git: %s\n" "$GIT_STATUS"

ALL_OK=1
if [ "$NODE_OK" -ne 1 ]; then ALL_OK=0; fi
if [ "$PNPM_OK" -ne 1 ]; then ALL_OK=0; fi
if [ "$DOCKER_OK" -ne 1 ]; then ALL_OK=0; fi
if [ "$GIT_OK" -ne 1 ]; then ALL_OK=0; fi

if [ "$ALL_OK" -eq 1 ]; then
  printf "\n所有必需环境组件已就绪，可以继续进行项目开发。\n"
  printf "\n推荐的后续操作：\n"
  printf "1) 安装依赖:\n   pnpm i\n"
  printf "2) 启动数据库基础设施:\n   bash infra/database/scripts/init_mac.sh\n"
  printf "3) 初始化数据库结构与种子数据:\n   pnpm -F @csisp/db-schema run migrate\n   pnpm -F @csisp/db-schema run seed\n"
  printf "4) 启动 BFF 与后端服务:\n   pnpm -F @csisp/bff dev\n   pnpm -F @csisp/backend dev\n"
  printf "5) 启动前端项目:\n   pnpm -F @csisp/frontend-admin dev\n   pnpm -F @csisp/frontend-portal dev\n"
else
  printf "\n部分环境组件未正确配置，请根据上述提示先完成安装或修复。\n"
fi
