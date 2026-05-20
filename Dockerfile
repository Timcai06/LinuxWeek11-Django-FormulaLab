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
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r /app/requirements.txt

COPY . /app

RUN chmod +x /app/scripts/entrypoint-web.sh /app/scripts/entrypoint-worker.sh /app/scripts/verify.sh
