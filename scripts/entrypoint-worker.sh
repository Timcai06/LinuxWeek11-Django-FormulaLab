#!/usr/bin/env bash
set -euo pipefail

celery -A config worker --loglevel=info
