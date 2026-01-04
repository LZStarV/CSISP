#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
source "$ROOT_DIR/infra/database/scripts/common.sh"

if [ -f "$ROOT_DIR/.env" ]; then export $(grep -v '^#' "$ROOT_DIR/.env" | xargs); fi

if ! command -v docker >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    log_info "检测到未安装 Docker，使用 apt-get 安装"
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose-plugin
  elif command -v yum >/dev/null 2>&1; then
    log_info "检测到未安装 Docker，使用 yum 安装"
    sudo yum install -y docker docker-compose
  elif command -v dnf >/dev/null 2>&1; then
    log_info "检测到未安装 Docker，使用 dnf 安装"
    sudo dnf install -y docker docker-compose
  else
    log_error "未检测到可用的包管理器，请手动安装 Docker 和 docker compose"
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1; then
  log_info "启动 Docker 服务"
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start docker || true
  fi
  for i in {1..30}; do
    if docker info >/dev/null 2>&1; then
      log_success "Docker 服务已就绪"
      break
    fi
    if [ "$i" -eq 30 ]; then
      log_error "Docker 服务启动超时，请检查 Docker 状态"
      exit 1
    fi
    sleep 2
  done
fi

DC_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    DC_CMD="docker-compose"
  else
    log_error "未检测到 docker compose 或 docker-compose，请检查安装"
    exit 1
  fi
fi

log_info "启动数据库服务 "
$DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" --env-file "$ROOT_DIR/.env" up -d postgres redis mongo

log_info "等待 PostgreSQL 数据库就绪"
for i in {1..30}; do
  if $DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres pg_isready >/dev/null 2>&1; then
    log_success "PostgreSQL 已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "PostgreSQL 数据库启动超时"
    exit 1
  fi
  sleep 2
done

log_info "等待 MongoDB 就绪"
for i in {1..30}; do
  if $DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T mongo mongosh --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
    log_success "MongoDB 已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "MongoDB 启动超时"
    exit 1
  fi
  sleep 2
done

log_info "创建应用用户与数据库"
$DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;" >/dev/null 2>&1 || true
$DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null 2>&1 || true
$DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" >/dev/null 2>&1 || true

log_info "检查数据库是否已初始化"
HAS_USER_TABLE=$($DC_CMD -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user';" 2>/dev/null || true)

if [ "$HAS_USER_TABLE" = "1" ]; then
  log_info "检测到数据库已存在 user 表，跳过迁移步骤"
else
  log_info "执行数据库迁移（@csisp/infra-database db:migrate）"
  if command -v pnpm >/dev/null 2>&1; then
    (cd "$ROOT_DIR" && pnpm -F @csisp/infra-database db:migrate) || {
      log_error "数据库迁移执行失败，请检查日志"
      exit 1
    }
  else
    log_error "未检测到 pnpm，请先安装 pnpm 后再重试"
    exit 1
  fi
fi

if [ "${MONGODB_ENABLED:-true}" != "false" ]; then
  log_info "执行 MongoDB 内容种子（@csisp/infra-database db:seed:mongo）"
  if command -v pnpm >/dev/null 2>&1; then
    (cd "$ROOT_DIR" && pnpm -F @csisp/infra-database db:seed:mongo) || {
      log_error "MongoDB 种子执行失败，请检查日志"
      exit 1
    }
  else
    log_error "未检测到 pnpm，请先安装 pnpm 后再重试"
    exit 1
  fi
fi

log_success "初始化完成"
