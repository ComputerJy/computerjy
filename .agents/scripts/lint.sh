#!/usr/bin/env bash
# ==============================================================================
# Quick Lint & Syntax Check Hook
# ==============================================================================
set -e

# Read stdin if piped without blocking if interactive tty
if [ ! -t 0 ]; then
  INPUT_JSON=$(cat 2>/dev/null || true)
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 1. Check PHP syntax across all project PHP files
find "${ROOT_DIR}" -maxdepth 3 -name "*.php" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.astro/*" \
  -exec php -l {} + > /dev/null 2>&1

# 2. Output empty JSON object as required by PostToolUse hook contract
echo "{}"
