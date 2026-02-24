#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
INFISICAL_API_URL_DEFAULT="http://127.0.0.1/api"
INFISICAL_API_URL="${INFISICAL_API_URL:-$INFISICAL_API_URL_DEFAULT}"
pnpm exec infisical run --env=prod --domain "$INFISICAL_API_URL" -- docker run --rm --network host -e DATABASE_URL -e DEV_DATABASE_URL -v "$ROOT_DIR":/work -w /work arigaio/atlas:latest migrate apply --config file://infra/database/atlas.hcl --env local
