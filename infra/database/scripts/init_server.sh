#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
source "$ROOT_DIR/infra/database/scripts/common.sh"

INFISICAL_API_URL_DEFAULT="http://43.139.43.214/api"
INFISICAL_API_URL="${INFISICAL_API_URL:-$INFISICAL_API_URL_DEFAULT}"
BACKUP_DIR="$ROOT_DIR/backups"

if command -v pg_dump >/dev/null 2>&1; then
  mkdir -p "$BACKUP_DIR"
  log_info "执行迁移前备份到 $BACKUP_DIR"
  pnpm exec infisical run --env=prod --domain "$INFISICAL_API_URL" -- bash -lc "pg_dump --dbname=\"\$DATABASE_URL\" --file=\"$BACKUP_DIR/backup_\$(date +%F_%T).sql\" || true"
else
  log_info "未检测到 pg_dump，跳过备份步骤"
fi

log_info "执行 Atlas 迁移（docker run --network host）"
pnpm exec infisical run --env=prod --domain "$INFISICAL_API_URL" -- docker run --rm --network host \
  -e DATABASE_URL -e DEV_DATABASE_URL \
  -v "$ROOT_DIR":/work -w /work arigaio/atlas:latest \
  migrate apply --config file://infra/database/atlas.hcl --env local || {
  log_error "数据库迁移执行失败，请检查日志"
  exit 1
}

log_success "生产环境数据库迁移与种子执行完成"
