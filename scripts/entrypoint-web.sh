#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate --noinput
python manage.py collectstatic --noinput

: "${FORMULA_LAB_WEB_BIND:=0.0.0.0:8000}"
: "${FORMULA_LAB_WEB_WORKERS:=2}"
: "${FORMULA_LAB_WEB_TIMEOUT:=180}"

exec gunicorn config.wsgi:application \
    --bind "${FORMULA_LAB_WEB_BIND}" \
    --workers "${FORMULA_LAB_WEB_WORKERS}" \
    --timeout "${FORMULA_LAB_WEB_TIMEOUT}" \
    --access-logfile - \
    --error-logfile -
