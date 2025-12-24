#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
source "$ROOT_DIR/infra/database/scripts/common.sh"

if [ -f "$ROOT_DIR/.env" ]; then export $(grep -v '^#' "$ROOT_DIR/.env" | xargs); fi

if ! command -v docker >/dev/null 2>&1; then
  log_info "检测到未安装 Docker，准备通过 Homebrew 安装 Docker Desktop"
  if ! command -v brew >/dev/null 2>&1; then
    log_error "未检测到 Homebrew，无法自动安装 Docker，请先手动安装 Homebrew 和 Docker Desktop"
    exit 1
  fi
  brew install --cask docker
fi

if ! docker info >/dev/null 2>&1; then
  log_info "启动 Docker Desktop"
  open -a Docker
  log_info "等待 Docker 服务就绪"
  for i in {1..30}; do
    if docker info >/dev/null 2>&1; then
      log_success "Docker 服务已就绪"
      break
    fi
    if [ "$i" -eq 30 ]; then
      log_error "Docker 服务启动超时，请检查 Docker Desktop 状态"
      exit 1
    fi
    sleep 2
  done
fi

if ! docker compose version >/dev/null 2>&1; then
  log_error "未检测到 docker compose，请升级 Docker Desktop 至支持 compose 的版本"
  exit 1
fi

log_info "启动数据库服务"
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" --env-file "$ROOT_DIR/.env" up -d postgres redis mongo

log_info "等待 PostgreSQL 数据库就绪"
for i in {1..30}; do
  if docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres pg_isready >/dev/null 2>&1; then
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
  if docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T mongo mongosh --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
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
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;" >/dev/null 2>&1 || true
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null 2>&1 || true
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" >/dev/null 2>&1 || true

log_success "初始化完成"
