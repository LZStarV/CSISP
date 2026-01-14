#!/usr/bin/env bash
set -euo pipefail

# 生成 TypeScript 代码（使用 @creditkarma/thrift-typescript）
# 说明：在 v1 目录下对所有 .thrift 文件进行生成，输出到 infra/idl/src/generated/ts/v1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IDL_DIR="${SCRIPT_DIR}/../src/v1"
OUT_DIR="${SCRIPT_DIR}/../src/generated/ts/v1"

cd "${IDL_DIR}"
thrift-typescript --sourceDir . --outDir "${OUT_DIR}" --target thrift-server *.thrift
