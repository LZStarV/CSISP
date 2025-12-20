#!/usr/bin/env bash
set -euo pipefail

RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
RESET=$'\033[0m'

log_info() { printf "[INFO] %s\n" "$1"; }
log_error() { printf "%s[ERROR]%s %s\n" "$RED" "$RESET" "$1"; }
log_success() { printf "%s[SUCCESS]%s %s\n" "$GREEN" "$RESET" "$1"; }
