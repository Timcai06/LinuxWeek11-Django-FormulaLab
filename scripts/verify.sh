#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${FORMULA_LAB_BASE_URL:-http://localhost:8000}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

curl -fsS "$BASE_URL/api/system/health/" | "$PYTHON_BIN" -m json.tool
