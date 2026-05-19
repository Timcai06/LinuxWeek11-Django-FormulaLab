#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${FORMULA_LAB_BASE_URL:-http://localhost:8000}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

curl -fsS -c "$COOKIE_JAR" "$BASE_URL/system/" >/dev/null
CSRF_TOKEN="$(awk '$6 == "csrftoken" { print $7 }' "$COOKIE_JAR" | tail -n 1)"

if [[ -z "$CSRF_TOKEN" ]]; then
    echo "Unable to read csrftoken from $BASE_URL/system/" >&2
    exit 1
fi

curl --fail-with-body -sS \
    -b "$COOKIE_JAR" \
    -H "X-CSRFToken: $CSRF_TOKEN" \
    -H "Accept: application/json" \
    -X POST \
    "$BASE_URL/api/system/warmup/" \
    | "$PYTHON_BIN" -m json.tool
