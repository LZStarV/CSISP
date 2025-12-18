#!/usr/bin/env bash
set -euo pipefail

log_info() { printf "[INFO] %s\n" "$1"; }
log_error() { printf "[ERROR] %s\n" "$1"; }
log_success() { printf "[SUCCESS] %s\n" "$1"; }
