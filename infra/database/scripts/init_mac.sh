#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
source "$ROOT_DIR/infra/database/scripts/common.sh"

export $(grep -v '^#' "$ROOT_DIR/infra/database/.env.db" | xargs)

log_info "启动数据库服务"
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" --env-file "$ROOT_DIR/infra/database/.env.db" up -d postgres redis

log_info "等待数据库就绪"
for i in {1..30}; do
  if docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres pg_isready >/dev/null 2>&1; then
    log_success "PostgreSQL 已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "数据库启动超时"
    exit 1
  fi
  sleep 2
done

log_info "创建应用用户与数据库"
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;" >/dev/null 2>&1 || true
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null 2>&1 || true
docker compose -f "$ROOT_DIR/infra/database/docker-compose.db.yml" exec -T postgres psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" >/dev/null 2>&1 || true

log_success "初始化完成"
