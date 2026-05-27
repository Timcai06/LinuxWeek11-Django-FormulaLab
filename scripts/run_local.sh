#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON="${PYTHON:-./.conda/bin/python}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"
MODEL_API_HOST="${MODEL_API_HOST:-127.0.0.1}"
MODEL_API_PORT="${MODEL_API_PORT:-9000}"
OCR_ENGINE="${FORMULA_LAB_OCR_ENGINE:-paddle}"
START_MODEL_API="${START_MODEL_API:-0}"
LOCAL_LOG_DIR="${LOCAL_LOG_DIR:-/tmp/formula-lab-local}"

mkdir -p "$LOCAL_LOG_DIR"

PIDS=()
REDIS_PID=""
DOCKER_REDIS_STARTED=0

cleanup() {
  echo
  echo "Stopping Formula Lab local services..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      wait "$pid" >/dev/null 2>&1 || true
    fi
  done
  if [ -n "$REDIS_PID" ] && kill -0 "$REDIS_PID" >/dev/null 2>&1; then
    kill "$REDIS_PID" >/dev/null 2>&1 || true
    wait "$REDIS_PID" >/dev/null 2>&1 || true
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
  for _ in $(seq 1 120); do
    if can_connect "$host" "$port"; then
      return 0
    fi
    sleep 0.25
  done
  echo "Timed out waiting for ${label} at ${host}:${port}" >&2
  return 1
}

start_redis() {
  if can_connect 127.0.0.1 6379; then
    echo "Redis already available at 127.0.0.1:6379"
    return 0
  fi

  if command -v redis-server >/dev/null 2>&1; then
    echo "Starting redis-server"
    redis-server --save "" --appendonly no --port 6379 >"${LOCAL_LOG_DIR}/redis.log" 2>&1 &
    REDIS_PID="$!"
    wait_for_tcp 127.0.0.1 6379 redis
    return 0
  fi

  if command -v docker >/dev/null 2>&1; then
    echo "Starting Docker Compose redis service"
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

if [ "$START_MODEL_API" = "1" ]; then
  echo "Starting FastAPI model API at http://${MODEL_API_HOST}:${MODEL_API_PORT}"
  DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE="$OCR_ENGINE" \
    "$PYTHON" -m uvicorn model_service.main:app --host "$MODEL_API_HOST" --port "$MODEL_API_PORT" >"${LOCAL_LOG_DIR}/model-api.log" 2>&1 &
  PIDS+=("$!")
  wait_for_tcp "$MODEL_API_HOST" "$MODEL_API_PORT" "model API"
fi

echo "Starting Celery worker"
DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE="$OCR_ENGINE" \
  "$PYTHON" -m celery -A config worker --loglevel=info --pool=solo >"${LOCAL_LOG_DIR}/celery.log" 2>&1 &
PIDS+=("$!")

echo "Starting Django at http://${HOST}:${PORT}"
DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE="$OCR_ENGINE" \
  "$PYTHON" manage.py runserver "${HOST}:${PORT}" >"${LOCAL_LOG_DIR}/django.log" 2>&1 &
PIDS+=("$!")
wait_for_tcp "$HOST" "$PORT" django

echo "Formula Lab is ready: http://${HOST}:${PORT}/"
echo "Logs: ${LOCAL_LOG_DIR}"
echo "Press Ctrl-C to stop."

while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "A local service exited. See logs in ${LOCAL_LOG_DIR}." >&2
      exit 1
    fi
  done
  sleep 1
done
