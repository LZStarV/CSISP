#!/usr/bin/env bash
set -euo pipefail

# 生成 TypeScript 代码（使用 @creditkarma/thrift-typescript）
# 说明：在版本目录下对所有 .thrift 文件进行生成，输出到 infra/idl/src/generated/ts/<version>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "${SCRIPT_DIR}/config.sh"

if [ -n "${IDL_SOURCE_DIR}" ]; then
  MODULE_NAME="single"
  SOURCE_DIR="${IDL_SOURCE_DIR}"
  TARGET_DIR="${TS_OUT_DIR:-"${OUTPUT_TS_BASE}/${MODULE_NAME}/${IDL_VERSION}"}"
  if [ -d "${SOURCE_DIR}" ] && ls "${SOURCE_DIR}"/*.thrift >/dev/null 2>&1; then
    mkdir -p "${TARGET_DIR}"
    (cd "${SOURCE_DIR}" && thrift-typescript --sourceDir . --outDir "${TARGET_DIR}" --target thrift-server *.thrift)
  else
    echo "[IDL] Skip TS generation: source dir not found or empty -> ${SOURCE_DIR}"
  fi
else
  for MODULE_NAME in "${MODULES[@]}"; do
    SOURCE_DIR="${BASE_DIR}/${MODULE_NAME}/${IDL_VERSION}"
    TARGET_DIR="${OUTPUT_TS_BASE}/${MODULE_NAME}/${IDL_VERSION}"
    if [ -d "${SOURCE_DIR}" ] && ls "${SOURCE_DIR}"/*.thrift >/dev/null 2>&1; then
      mkdir -p "${TARGET_DIR}"
      (cd "${SOURCE_DIR}" && thrift-typescript --sourceDir . --outDir "${TARGET_DIR}" --target thrift-server *.thrift)
      echo "[IDL] TS generated -> ${TARGET_DIR}"
    else
      echo "[IDL] Skip TS generation: ${SOURCE_DIR}"
    fi
  done
fi

# 生成 .generated 子入口，用于 tsc 自动产出 dist/backoffice.{js,d.ts} 与 dist/backend.{js,d.ts}
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_GEN_DIR="${ROOT_DIR}/.generated"
OUT_BACKOFFICE_TS="${ROOT_GEN_DIR}/backoffice.ts"
OUT_BACKEND_TS="${ROOT_GEN_DIR}/backend.ts"
mkdir -p "${ROOT_GEN_DIR}"
> "${OUT_BACKOFFICE_TS}"
> "${OUT_BACKEND_TS}"

if [ -n "${IDL_SOURCE_DIR}" ]; then
  MODULES_TO_SCAN=("${MODULE_NAME}")
else
  MODULES_TO_SCAN=("${MODULES[@]}")
fi

for MODULE in "${MODULES_TO_SCAN[@]}"; do
  if [ "${MODULE}" = "backoffice" ]; then
    BASE_GEN_TS="${OUTPUT_TS_BASE}/${MODULE}/${IDL_VERSION}"
    if [ -d "${BASE_GEN_TS}" ]; then
      while IFS= read -r SUB; do
        if [ "${SUB}" != "backoffice" ]; then
          echo "export * from './ts/${MODULE}/${IDL_VERSION}/${SUB}';" >> "${OUT_BACKOFFICE_TS}"
        fi
      done < <(find "${BASE_GEN_TS}" -maxdepth 1 -mindepth 1 -type d -exec basename {} \;)
    fi
  elif [ "${MODULE}" = "backend" ]; then
    BASE_GEN_TS="${OUTPUT_TS_BASE}/${MODULE}/${IDL_VERSION}"
    if [ -d "${BASE_GEN_TS}" ]; then
      while IFS= read -r SUB; do
        echo "export * from './ts/${MODULE}/${IDL_VERSION}/${SUB}';" >> "${OUT_BACKEND_TS}"
      done < <(find "${BASE_GEN_TS}" -maxdepth 1 -mindepth 1 -type d -exec basename {} \;)
    fi
  fi
done
