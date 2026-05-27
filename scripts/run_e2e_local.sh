#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON="${PYTHON:-./.conda/bin/python}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"
OCR_ENGINE="${OCR_ENGINE:-paddle}"
E2E_SPEC="${E2E_SPEC:-e2e/formula_lab.spec.ts}"
E2E_BASE_URL="${E2E_BASE_URL:-http://${HOST}:${PORT}}"
E2E_LOG_DIR="${E2E_LOG_DIR:-/tmp/formula-lab-e2e}"

mkdir -p "$E2E_LOG_DIR"

PIDS=()
REDIS_PID=""
DOCKER_REDIS_STARTED=0

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  if [ -n "$REDIS_PID" ] && kill -0 "$REDIS_PID" >/dev/null 2>&1; then
    kill "$REDIS_PID" >/dev/null 2>&1 || true
  fi
  if [ "$DOCKER_REDIS_STARTED" = "1" ]; then
    docker compose stop redis >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

can_connect() {
  "$PYTHON" - "$1" "$2" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
try:
    with socket.create_connection((host, port), timeout=0.5):
        pass
except OSError:
    raise SystemExit(1)
PY
}

wait_for_tcp() {
  local host="$1"
  local port="$2"
  local label="$3"
  for _ in $(seq 1 80); do
    if can_connect "$host" "$port"; then
      return 0
    fi
    sleep 0.25
  done
  echo "Timed out waiting for ${label} at ${host}:${port}" >&2
  return 1
}

wait_for_url() {
  local url="$1"
  for _ in $(seq 1 120); do
    if "$PYTHON" - "$url" <<'PY'
import sys
import urllib.request

try:
    with urllib.request.urlopen(sys.argv[1], timeout=1) as response:
        if response.status < 500:
            raise SystemExit(0)
except Exception:
    pass
raise SystemExit(1)
PY
    then
      return 0
    fi
    sleep 0.5
  done
  echo "Timed out waiting for Django at ${url}" >&2
  return 1
}

start_redis() {
  if can_connect 127.0.0.1 6379; then
    echo "Redis already available at 127.0.0.1:6379"
    return 0
  fi

  if command -v redis-server >/dev/null 2>&1; then
    echo "Starting redis-server for e2e"
    redis-server --save "" --appendonly no --port 6379 >"${E2E_LOG_DIR}/redis.log" 2>&1 &
    REDIS_PID="$!"
    wait_for_tcp 127.0.0.1 6379 redis
    return 0
  fi

  if command -v docker >/dev/null 2>&1; then
    echo "Starting Docker Compose redis service for e2e"
    docker compose up -d redis
    DOCKER_REDIS_STARTED=1
    wait_for_tcp 127.0.0.1 6379 redis
    return 0
  fi

  echo "Redis is not running, and neither redis-server nor docker is available." >&2
  return 1
}

start_redis

echo "Applying migrations"
DJANGO_SETTINGS_MODULE=config.settings.dev "$PYTHON" manage.py migrate

echo "Starting Celery worker"
DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE="$OCR_ENGINE" \
  "$PYTHON" -m celery -A config worker --loglevel=info --pool=solo >"${E2E_LOG_DIR}/celery.log" 2>&1 &
PIDS+=("$!")

echo "Starting Django at ${E2E_BASE_URL}"
DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE="$OCR_ENGINE" \
  "$PYTHON" manage.py runserver "${HOST}:${PORT}" >"${E2E_LOG_DIR}/django.log" 2>&1 &
PIDS+=("$!")

wait_for_url "$E2E_BASE_URL/"

echo "Running Playwright spec: ${E2E_SPEC}"
E2E_BASE_URL="$E2E_BASE_URL" npx playwright test "$E2E_SPEC"
