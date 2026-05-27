# FastAPI 模型服务化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将 Formula Lab 的公式识别模型从 Django/Celery 进程中抽象出来，支持本地 Paddle 调用和独立 FastAPI 模型服务两种后端。

**Architecture:** Django 继续负责页面、项目、任务、数据库和导出；Celery 继续负责任务编排；新增 recognition client 层选择 `local` 或 `http` 后端；FastAPI `model-api` 只负责模型加载、预热、识别和健康检查。

**Tech Stack:** Django 5.2、Celery、Redis、PostgreSQL、PaddleOCR Formula Recognition、FastAPI、Pydantic、httpx、Docker Compose。

## 当前完成情况

A 阶段已经落地为 Formula Lab 的模型服务边界：

- `apps/formulas/services/recognition_clients.py` 已经提供本地与 HTTP recognition backend。
- `apps/formulas/services/model_api_client.py` 已经实现模型服务 HTTP client。
- `model_service/` 已经提供 FastAPI app、schema 与 engine 边界。
- `Makefile` 已经提供 `make local-http`，用于本机 Django + Celery + FastAPI 模型服务联调。
- `docker-compose.yml` 已经包含 `model-api`，Compose 内的 worker 通过 HTTP 调用模型服务。
- 默认 `make local` 仍保留本地 Paddle 开发路径。

本文件后续保留为 A 阶段实施记录和回归参考。

---

## 文件结构

### 新增文件

```text
apps/formulas/services/recognition_clients.py
apps/formulas/services/model_api_client.py
model_service/__init__.py
model_service/main.py
model_service/schemas.py
model_service/engine.py
tests/formulas/test_recognition_clients.py
tests/formulas/test_model_api_client.py
tests/model_service/test_model_api.py
```

### 修改文件

```text
config/settings/base.py
apps/formulas/services/recognizer.py
apps/formulas/tasks.py
docker-compose.yml
Dockerfile
config/requirements/base.txt
Makefile
docs/02-总体架构.md
docs/06-公式识别引擎.md
docs/08-Docker运行方案.md
```

## A1：增加 Recognition Client 抽象

目标是在不改变现有默认行为的前提下，让识别调用拥有可替换边界。

### Task 1: 配置项

**Files:**
- Modify: `config/settings/base.py`
- Test: `tests/formulas/test_recognition_clients.py`

- [x] **Step 1: 写配置读取测试**

测试目标：

```python
from django.test import override_settings

from apps.formulas.services.recognition_clients import get_recognition_client


@override_settings(FORMULA_LAB_RECOGNITION_BACKEND="local")
def test_get_local_recognition_client():
    client = get_recognition_client()
    assert client.name == "local"


@override_settings(
    FORMULA_LAB_RECOGNITION_BACKEND="http",
    FORMULA_LAB_MODEL_API_URL="http://model-api:9000",
)
def test_get_http_recognition_client():
    client = get_recognition_client()
    assert client.name == "http"
```

- [x] **Step 2: 运行测试，确认失败**

Run:

```bash
./.conda/bin/python manage.py test tests.formulas.test_recognition_clients -v 2
```

Expected:

```text
ModuleNotFoundError: No module named 'apps.formulas.services.recognition_clients'
```

- [x] **Step 3: 增加配置默认值**

在 `config/settings/base.py` 增加：

```python
FORMULA_LAB_RECOGNITION_BACKEND = os.environ.get("FORMULA_LAB_RECOGNITION_BACKEND", "local")
FORMULA_LAB_MODEL_API_URL = os.environ.get("FORMULA_LAB_MODEL_API_URL", "http://model-api:9000")
FORMULA_LAB_MODEL_API_TIMEOUT_SECONDS = int(os.environ.get("FORMULA_LAB_MODEL_API_TIMEOUT_SECONDS", "120"))
```

- [x] **Step 4: 新增 client 工厂**

`apps/formulas/services/recognition_clients.py`：

```python
from dataclasses import dataclass

from django.conf import settings

from apps.formulas.services.model_api_client import ModelApiRecognitionClient
from apps.formulas.services.ocr_engines import get_formula_engine


@dataclass(frozen=True)
class RecognitionResult:
    latex: str
    engine: str
    model: str
    duration_ms: int | None = None
    confidence: float | None = None


class LocalRecognitionClient:
    name = "local"

    def recognize(self, image_path: str) -> RecognitionResult:
        engine = get_formula_engine()
        latex = engine.recognize(image_path)
        return RecognitionResult(
            latex=latex,
            engine=engine.name,
            model=getattr(engine, "model_name", engine.name),
            duration_ms=None,
            confidence=None,
        )


def get_recognition_client():
    backend = settings.FORMULA_LAB_RECOGNITION_BACKEND
    if backend == "local":
        return LocalRecognitionClient()
    if backend == "http":
        return ModelApiRecognitionClient(
            base_url=settings.FORMULA_LAB_MODEL_API_URL,
            timeout_seconds=settings.FORMULA_LAB_MODEL_API_TIMEOUT_SECONDS,
        )
    raise ValueError(f"Unsupported recognition backend: {backend}")
```

- [x] **Step 5: 暂时增加 HTTP client 空实现以通过导入**

`apps/formulas/services/model_api_client.py`：

```python
class ModelApiRecognitionClient:
    name = "http"

    def __init__(self, base_url: str, timeout_seconds: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
```

- [x] **Step 6: 运行测试**

Run:

```bash
./.conda/bin/python manage.py test tests.formulas.test_recognition_clients -v 2
```

Expected:

```text
OK
```

## A2：让 recognizer.py 走 client

目标是 `recognizer.py` 不再直接调用 `get_formula_engine()`，而是调用 `get_recognition_client()`。

### Task 2: 更新识别入口

**Files:**
- Modify: `apps/formulas/services/recognizer.py`
- Test: `tests/formulas/test_recognition_clients.py`

- [x] **Step 1: 写任务识别结果保存测试**

测试目标：

```python
from unittest.mock import patch

from apps.formulas.services.recognition_clients import RecognitionResult
from apps.formulas.services.recognizer import recognize_formula


def test_recognize_formula_saves_engine_name(formula_job):
    with patch("apps.formulas.services.recognizer.get_recognition_client") as get_client:
        get_client.return_value.recognize.return_value = RecognitionResult(
            latex=r"\frac{a}{b}",
            engine="paddle",
            model="PP-FormulaNet_plus-S",
            duration_ms=900,
            confidence=None,
        )

        result = recognize_formula(formula_job)

    formula_job.refresh_from_db()
    assert result == r"\frac{a}{b}"
    assert formula_job.engine_name == "paddle"
```

- [x] **Step 2: 更新 `recognizer.py`**

替换识别调用为：

```python
from apps.formulas.services.recognition_clients import get_recognition_client


def recognize_formula(job: FormulaJob) -> str:
    preprocessed_path = prepare_formula_image(job)
    client = get_recognition_client()
    result = client.recognize(str(preprocessed_path))
    job.engine_name = result.engine
    job.save(update_fields=["engine_name"])
    return correct_latex_result(result.latex, job.original_image.path)
```

- [x] **Step 3: 运行测试**

Run:

```bash
./.conda/bin/python manage.py test tests.formulas.test_recognition_clients tests.formulas -v 2
```

Expected:

```text
OK
```

## A3：实现 HTTP Model API Client

目标是 Celery 可以通过 HTTP 请求调用模型服务。

### Task 3: HTTP client

**Files:**
- Modify: `apps/formulas/services/model_api_client.py`
- Test: `tests/formulas/test_model_api_client.py`

- [x] **Step 1: 写成功响应测试**

```python
from pathlib import Path

import httpx

from apps.formulas.services.model_api_client import ModelApiRecognitionClient


def test_model_api_client_parses_success_response(tmp_path):
    image_path = tmp_path / "formula.png"
    image_path.write_bytes(b"fake-image")

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/formula/recognize"
        return httpx.Response(
            200,
            json={
                "latex": r"\int_0^1 x^2 dx",
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "duration_ms": 1200,
                "confidence": None,
            },
        )

    transport = httpx.MockTransport(handler)
    client = ModelApiRecognitionClient("http://model-api:9000", 30, transport=transport)

    result = client.recognize(str(image_path))

    assert result.latex == r"\int_0^1 x^2 dx"
    assert result.engine == "paddle"
    assert result.model == "PP-FormulaNet_plus-S"
    assert result.duration_ms == 1200
```

- [x] **Step 2: 写错误响应测试**

```python
import httpx
import pytest

from apps.formulas.services.model_api_client import ModelApiRecognitionClient, ModelApiError


def test_model_api_client_raises_readable_error(tmp_path):
    image_path = tmp_path / "formula.png"
    image_path.write_bytes(b"fake-image")

    transport = httpx.MockTransport(
        lambda request: httpx.Response(503, json={"error": "model warming"})
    )
    client = ModelApiRecognitionClient("http://model-api:9000", 30, transport=transport)

    with pytest.raises(ModelApiError, match="model warming"):
        client.recognize(str(image_path))
```

- [x] **Step 3: 实现 client**

```python
import httpx

from apps.formulas.services.recognition_clients import RecognitionResult


class ModelApiError(RuntimeError):
    pass


class ModelApiRecognitionClient:
    name = "http"

    def __init__(self, base_url: str, timeout_seconds: int, transport=None) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    def recognize(self, image_path: str) -> RecognitionResult:
        with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
            with open(image_path, "rb") as image_file:
                response = client.post(
                    f"{self.base_url}/v1/formula/recognize",
                    files={"image": (image_path, image_file, "application/octet-stream")},
                )

        if response.status_code >= 400:
            try:
                message = response.json().get("error", response.text)
            except ValueError:
                message = response.text
            raise ModelApiError(message)

        payload = response.json()
        return RecognitionResult(
            latex=payload["latex"],
            engine=payload["engine"],
            model=payload["model"],
            duration_ms=payload.get("duration_ms"),
            confidence=payload.get("confidence"),
        )
```

- [x] **Step 4: 修复循环导入**

如果 `recognition_clients.py` 和 `model_api_client.py` 出现循环导入，将 `RecognitionResult` 移入新文件：

```text
apps/formulas/services/recognition_types.py
```

并让两个模块都从该文件导入。

- [x] **Step 5: 运行测试**

Run:

```bash
./.conda/bin/python manage.py test tests.formulas.test_model_api_client tests.formulas.test_recognition_clients -v 2
```

Expected:

```text
OK
```

## A4：新增 FastAPI model-api

目标是新增独立服务，但先在本机用 Python 直接运行验证。

### Task 4: FastAPI 服务

**Files:**
- Create: `model_service/schemas.py`
- Create: `model_service/engine.py`
- Create: `model_service/main.py`
- Test: `tests/model_service/test_model_api.py`

- [x] **Step 1: 写 FastAPI API 测试**

```python
from fastapi.testclient import TestClient

from model_service.main import app


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in {"ready", "warming", "unknown"}


def test_models_current_endpoint():
    client = TestClient(app)
    response = client.get("/models/current")
    assert response.status_code == 200
    assert "engine" in response.json()
    assert "model" in response.json()
```

- [x] **Step 2: 新增 schema**

`model_service/schemas.py`：

```python
from pydantic import BaseModel


class RecognitionResponse(BaseModel):
    latex: str
    engine: str
    model: str
    duration_ms: int
    confidence: float | None = None


class HealthResponse(BaseModel):
    status: str
    engine: str
    model: str
```

- [x] **Step 3: 新增 engine 适配**

`model_service/engine.py`：

```python
import time

from apps.formulas.services.ocr_engines import get_formula_engine


def current_model_info() -> dict[str, str]:
    engine = get_formula_engine()
    return {
        "engine": engine.name,
        "model": getattr(engine, "model_name", engine.name),
    }


def recognize_image(image_path: str) -> dict[str, object]:
    start = time.perf_counter()
    engine = get_formula_engine()
    latex = engine.recognize(image_path)
    duration_ms = int((time.perf_counter() - start) * 1000)
    return {
        "latex": latex,
        "engine": engine.name,
        "model": getattr(engine, "model_name", engine.name),
        "duration_ms": duration_ms,
        "confidence": None,
    }
```

- [x] **Step 4: 新增 FastAPI app**

`model_service/main.py`：

```python
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile

from model_service.engine import current_model_info, recognize_image
from model_service.schemas import HealthResponse, RecognitionResponse

app = FastAPI(title="Formula Lab Model API")


@app.get("/health", response_model=HealthResponse)
def health():
    info = current_model_info()
    return HealthResponse(status="ready", engine=info["engine"], model=info["model"])


@app.get("/models/current")
def models_current():
    return current_model_info()


@app.post("/warmup", response_model=HealthResponse)
def warmup():
    info = current_model_info()
    return HealthResponse(status="ready", engine=info["engine"], model=info["model"])


@app.post("/v1/formula/recognize", response_model=RecognitionResponse)
async def recognize_formula(image: UploadFile = File(...)):
    suffix = Path(image.filename or "formula.png").suffix or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as temp_file:
        temp_file.write(await image.read())
        temp_file.flush()
        result = recognize_image(temp_file.name)
    return RecognitionResponse(**result)
```

- [x] **Step 5: 增加依赖**

`config/requirements/base.txt` 增加：

```text
fastapi
uvicorn[standard]
httpx
python-multipart
```

- [x] **Step 6: 运行测试**

Run:

```bash
./.conda/bin/python manage.py test tests.model_service.test_model_api -v 2
```

Expected:

```text
OK
```

## A5：Makefile 和 Docker Compose

目标是让本机和 Docker 都有简单命令。

### Task 5: 运行入口

**Files:**
- Modify: `Makefile`
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`

- [x] **Step 1: Makefile 增加本机命令**

```makefile
model-api:
	DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) $(PYTHON) -m uvicorn model_service.main:app --host $(HOST) --port 9000

local-http:
	@echo "Starting Redis, Django, Celery, and FastAPI model API"
	FORMULA_LAB_RECOGNITION_BACKEND=http FORMULA_LAB_MODEL_API_URL=http://127.0.0.1:9000 $(MAKE) -j4 dev-redis model-api dev-worker dev
```

- [x] **Step 2: Docker Compose 增加 model-api 服务**

```yaml
model-api:
  build: .
  command: python -m uvicorn model_service.main:app --host 0.0.0.0 --port 9000
  environment:
    DJANGO_SETTINGS_MODULE: config.settings.prod
    FORMULA_LAB_OCR_ENGINE: paddle
  volumes:
    - model-cache:/app/var/model-cache
  depends_on:
    - redis

worker:
  environment:
    FORMULA_LAB_RECOGNITION_BACKEND: http
    FORMULA_LAB_MODEL_API_URL: http://model-api:9000
```

- [x] **Step 3: 运行本机 HTTP 模式**

Run:

```bash
make local-http
```

Expected:

```text
Uvicorn running on http://127.0.0.1:9000
Django development server at http://127.0.0.1:8000/
celery ... ready
```

- [x] **Step 4: 运行 Docker 构建**

Run:

```bash
docker compose up --build
```

Expected:

```text
web-1        | Starting development server
worker-1     | celery ready
model-api-1  | Uvicorn running on http://0.0.0.0:9000
```

## A6：验收标准

- [x] 默认 `make local` 仍然走本地 Paddle，不依赖 FastAPI。
- [x] `make local-http` 可以通过 FastAPI 完成一次真实图片识别。
- [x] Docker Compose 中 `worker` 不直接加载 Paddle 模型，只调用 `model-api`。
- [x] `model-api` 可独立健康检查：`curl http://127.0.0.1:9000/health`。
- [x] 模型服务异常时，Django 页面不崩溃，任务进入 failed 状态并显示可读错误。
- [x] 所有新增测试通过。

## 回滚策略

如果 FastAPI 路径出现问题，设置：

```text
FORMULA_LAB_RECOGNITION_BACKEND=local
```

即可回到现有 Celery 本地 Paddle 调用链。A 阶段所有改动必须保持这个回滚路径可用。
