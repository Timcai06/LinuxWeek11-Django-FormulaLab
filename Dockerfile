FROM node:22-slim AS frontend

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci

COPY frontend /app/frontend
COPY scripts/copy_katex_assets.mjs /app/scripts/copy_katex_assets.mjs
COPY apps/formulas/static/formulas/js /app/apps/formulas/static/formulas/js
COPY apps/formulas/static/formulas/vendor /app/apps/formulas/static/formulas/vendor
RUN npm run build

FROM python:3.10-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.11 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_SYSTEM_PYTHON=1
ENV UV_HTTP_TIMEOUT=300
ENV UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
COPY requirements-paddle.txt /app/requirements-paddle.txt
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r /app/requirements.txt -r /app/requirements-paddle.txt

COPY . /app
COPY --from=frontend /app/apps/formulas/static/formulas/js/generated/layout-intelligence.js /app/apps/formulas/static/formulas/js/generated/layout-intelligence.js

RUN chmod +x /app/scripts/entrypoint-web.sh /app/scripts/entrypoint-worker.sh /app/scripts/verify.sh
