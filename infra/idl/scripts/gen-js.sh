#!/usr/bin/env bash
set -euo pipefail

# 生成 Node.js 运行时代码（使用全局 Apache Thrift 编译器）
# 说明：为版本目录下的服务与类型生成 JS 桩代码，输出到 infra/idl/src/generated/js/<version>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "${SCRIPT_DIR}/config.sh"

if [ -n "${IDL_SOURCE_DIR}" ]; then
  MODULE_NAME="single"
  SOURCE_DIR="${IDL_SOURCE_DIR}"
  TARGET_DIR="${JS_OUT_DIR:-"${OUTPUT_JS_BASE}/${MODULE_NAME}/${IDL_VERSION}"}"
  if [ -d "${SOURCE_DIR}" ] && ls "${SOURCE_DIR}"/*.thrift >/dev/null 2>&1; then
    mkdir -p "${TARGET_DIR}"
    for f in "${SOURCE_DIR}"/*.thrift; do
      thrift -r --gen js:node -out "${TARGET_DIR}" "${f}"
    done
    echo "[IDL] JS generated -> ${TARGET_DIR}"
  else
    echo "[IDL] Skip JS generation: source dir not found or empty -> ${SOURCE_DIR}"
  fi
else
  for MODULE_NAME in "${MODULES[@]}"; do
    SOURCE_DIR="${BASE_DIR}/${MODULE_NAME}/${IDL_VERSION}"
    TARGET_DIR="${OUTPUT_JS_BASE}/${MODULE_NAME}/${IDL_VERSION}"
    if [ -d "${SOURCE_DIR}" ] && ls "${SOURCE_DIR}"/*.thrift >/dev/null 2>&1; then
      mkdir -p "${TARGET_DIR}"
      for f in "${SOURCE_DIR}"/*.thrift; do
        thrift -r --gen js:node -out "${TARGET_DIR}" "${f}"
      done
      echo "[IDL] JS generated -> ${TARGET_DIR}"
    else
      echo "[IDL] Skip JS generation: ${SOURCE_DIR}"
    fi
  done
fi
