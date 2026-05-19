#!/usr/bin/env bash
set -euo pipefail

curl -fsS http://localhost:8000/api/system/health/ | python -m json.tool
