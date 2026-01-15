#!/usr/bin/env bash
set -euo pipefail

# IDL 通用配置
# - IDL_VERSION：版本目录（默认 v1），可通过环境变量覆盖
# - BASE_DIR：IDL 源码基础目录（固定为 infra/idl/src）
# - MODULES：固定扫描模块目录（backoffice、backend）
# - IDL_SOURCE_DIR：单模块源目录（可通过环境变量覆盖）
# - TS_OUT_DIR / JS_OUT_DIR：生成代码输出目录（可通过环境变量覆盖）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="${SCRIPT_DIR}/../src"

IDL_VERSION="${IDL_VERSION:-v1}"

# 固定模块列表，避免误扫应用代码目录
MODULES=("backoffice" "backend")

# 为兼容旧环境，允许指定单模块来源或输出（否则按模块循环生成）
IDL_SOURCE_DIR="${IDL_SOURCE_DIR:-}"
TS_OUT_DIR="${TS_OUT_DIR:-}"
JS_OUT_DIR="${JS_OUT_DIR:-}"

# 输出基础目录
OUTPUT_TS_BASE="${SCRIPT_DIR}/../.generated/ts"
OUTPUT_JS_BASE="${SCRIPT_DIR}/../dist/js"
