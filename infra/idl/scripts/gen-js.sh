#!/usr/bin/env bash
set -euo pipefail

# 生成 Node.js 运行时代码（使用全局 Apache Thrift 编译器）
# 说明：为 v1 下的服务与类型生成 JS 桩代码，输出到 infra/idl/src/generated/js/v1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IDL_DIR="${SCRIPT_DIR}/../src/v1"
OUT_DIR="${SCRIPT_DIR}/../src/generated/js/v1"

mkdir -p "${OUT_DIR}"
cd "${IDL_DIR}"
for f in *.thrift; do
  thrift -r --gen js:node -out "${OUT_DIR}" "${f}"
done
