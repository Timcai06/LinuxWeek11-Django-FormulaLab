# Formula Lab Mission Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Formula Lab Mission Control, a Docker Compose Django application that uploads equation images, runs real pix2tex recognition through Celery, tracks mission progress, renders LaTeX, stores history in PostgreSQL, and presents a SpaceX-inspired UI.

**Architecture:** Django owns pages, upload orchestration, APIs, and persistence through `FormulaJob`. Celery worker owns pix2tex warmup and recognition, writes mission state back to PostgreSQL, and publishes runtime telemetry in Redis. UI routes use Mission language while model and service code keep clear engineering names.

**Tech Stack:** Django, PostgreSQL, Redis, Celery, pix2tex / LaTeX-OCR, Pillow, KaTeX, Tailwind CDN, local CSS/JS, lucide static SVG, Docker Compose, Makefile, Playwright.

---

## File Structure

Create or modify these paths under `/Users/tim/Desktop/shared-Linux/formula-lab`:

```text
.
  README.md
  .env.example
  .gitignore
  Dockerfile
  docker-compose.yml
  Makefile
  requirements.txt
  manage.py
  scripts/
    entrypoint-web.sh
    entrypoint-worker.sh
    verify.sh
  config/
    __init__.py
    asgi.py
    urls.py
    wsgi.py
    celery.py
    settings/
      __init__.py
      base.py
      dev.py
      prod.py
  apps/
    __init__.py
    formulas/
      __init__.py
      admin.py
      apps.py
      forms.py
      models.py
      tasks.py
      urls.py
      views.py
      services/
        __init__.py
        health.py
        latex_formats.py
        model_state.py
        pix2tex_engine.py
        preprocessing.py
        recognizer.py
        telemetry.py
      templates/formulas/
        base.html
        landing.html
        workbench.html
        progress.html
        result.html
        history.html
        system.html
        partials/
          nav.html
      static/formulas/
        css/base.css
        css/pages/landing.css
        css/pages/workbench.css
        css/pages/progress.css
        css/pages/result.css
        css/pages/history.css
        css/pages/system.css
        js/landing.js
        js/workbench.js
        js/progress.js
        js/result.js
        js/history.js
        js/system.js
        visuals/landing-mission-bg.png
  tests/
    formulas/
      test_latex_formats.py
      test_models.py
      test_preprocessing.py
      test_views.py
      test_health.py
  e2e/
    formula_lab.spec.ts
  playwright.config.ts
  package.json
```

## Task 1: Project Scaffold and Runtime Entrypoints

**Files:**
- Create: `manage.py`
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `Makefile`
- Create: `scripts/entrypoint-web.sh`
- Create: `scripts/entrypoint-worker.sh`
- Create: `scripts/verify.sh`

- [ ] **Step 1: Create Python dependency list**

Write `requirements.txt` with:

```text
Django>=5.0,<5.3
psycopg[binary]>=3.1,<4
redis>=5,<6
celery>=5.3,<6
Pillow>=10,<12
python-dotenv>=1,<2
dj-database-url>=2,<3
pix2tex>=0.1.4
torch
torchvision
```

- [ ] **Step 2: Create environment template**

Write `.env.example` with:

```text
DEBUG=1
DJANGO_SETTINGS_MODULE=config.settings.dev
DJANGO_SECRET_KEY=change-me-local-only
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DATABASE_URL=postgres://formula_lab:formula_lab_password@db:5432/formula_lab
REDIS_URL=redis://redis:6379/0
MEDIA_ROOT=/app/media
HF_HOME=/app/.model-cache/huggingface
TORCH_HOME=/app/.model-cache/torch
XDG_CACHE_HOME=/app/.model-cache
FORMULA_LAB_MAX_UPLOAD_MB=10
FORMULA_LAB_MAX_IMAGE_SIDE=1600
```

- [ ] **Step 3: Create ignore rules**

Write `.gitignore` with:

```text
.env
__pycache__/
*.py[cod]
.pytest_cache/
.coverage
htmlcov/
node_modules/
test-results/
playwright-report/
media/
.model-cache/
*.sqlite3
.DS_Store
```

- [ ] **Step 4: Create Dockerfile**

Write `Dockerfile` with:

```dockerfile
FROM python:3.10-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.11 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_SYSTEM_PYTHON=1

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
```

- [ ] **Step 5: Create Compose services**

Write `docker-compose.yml` with:

```yaml
services:
  web:
    build: .
    command: /app/scripts/entrypoint-web.sh
    env_file: .env
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - ./media:/app/media
      - ./.model-cache:/app/.model-cache
    depends_on:
      - db
      - redis

  worker:
    build: .
    command: /app/scripts/entrypoint-worker.sh
    env_file: .env
    volumes:
      - .:/app
      - ./media:/app/media
      - ./.model-cache:/app/.model-cache
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: formula_lab
      POSTGRES_USER: formula_lab
      POSTGRES_PASSWORD: formula_lab_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

- [ ] **Step 6: Create entrypoint scripts**

Write `scripts/entrypoint-web.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000
```

Write `scripts/entrypoint-worker.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

celery -A config worker --loglevel=info
```

Write `scripts/verify.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

curl -fsS http://localhost:8000/api/system/health/ | python -m json.tool
```

- [ ] **Step 7: Create Makefile**

Write `Makefile` with:

```makefile
.PHONY: up down logs web-logs worker-logs migrate shell admin test verify warmup e2e

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

web-logs:
	docker compose logs -f web

worker-logs:
	docker compose logs -f worker

migrate:
	docker compose exec web python manage.py migrate

shell:
	docker compose exec web python manage.py shell

admin:
	docker compose exec web python manage.py createsuperuser

test:
	docker compose exec web python manage.py test

verify:
	./scripts/verify.sh

warmup:
	curl -fsS -X POST http://localhost:8000/api/system/warmup/ | python -m json.tool

e2e:
	npm run e2e
```

- [ ] **Step 8: Verify scaffold files exist**

Run: `ls -la Dockerfile docker-compose.yml Makefile requirements.txt .env.example scripts/entrypoint-web.sh scripts/entrypoint-worker.sh scripts/verify.sh`

Expected: all listed files exist.

## Task 2: Django Settings, Celery, and URLs

**Files:**
- Create: `manage.py`
- Create: `config/__init__.py`
- Create: `config/settings/__init__.py`
- Create: `config/settings/base.py`
- Create: `config/settings/dev.py`
- Create: `config/settings/prod.py`
- Create: `config/urls.py`
- Create: `config/asgi.py`
- Create: `config/wsgi.py`
- Create: `config/celery.py`
- Create: `apps/__init__.py`
- Create: `apps/formulas/apps.py`
- Create: `apps/formulas/urls.py`

- [ ] **Step 1: Create Django entry files**

Write `manage.py` with:

```python
#!/usr/bin/env python
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
```

Write `config/asgi.py` and `config/wsgi.py` using `config.settings.dev` as the default settings module.

- [ ] **Step 2: Create base settings**

Write `config/settings/base.py` with settings for `INSTALLED_APPS`, PostgreSQL via `dj_database_url`, Redis URL, static/media paths, upload limits, and Celery broker.

Required settings:

```python
import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parents[2]

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-local-only")
DEBUG = os.environ.get("DEBUG", "0") == "1"
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "apps.formulas",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

DATABASES = {
    "default": dj_database_url.parse(os.environ["DATABASE_URL"], conn_max_age=60)
}

LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_TASK_IGNORE_RESULT = True

FORMULA_LAB_MAX_UPLOAD_MB = int(os.environ.get("FORMULA_LAB_MAX_UPLOAD_MB", "10"))
FORMULA_LAB_MAX_IMAGE_SIDE = int(os.environ.get("FORMULA_LAB_MAX_IMAGE_SIDE", "1600"))
```

- [ ] **Step 3: Create dev/prod settings**

Write `config/settings/dev.py` with:

```python
from .base import *  # noqa: F403

DEBUG = True
```

Write `config/settings/prod.py` with:

```python
from .base import *  # noqa: F403

DEBUG = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

- [ ] **Step 4: Create Celery app**

Write `config/celery.py` with:

```python
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("formula_lab")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

Write `config/__init__.py` with:

```python
from .celery import app as celery_app

__all__ = ("celery_app",)
```

- [ ] **Step 5: Create root URLs**

Write `config/urls.py` with:

```python
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("apps.formulas.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 6: Create formulas app config and URL skeleton**

Write `apps/formulas/apps.py` with:

```python
from django.apps import AppConfig


class FormulasConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.formulas"
```

Write `apps/formulas/urls.py` with:

```python
from django.urls import path

from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("workbench/", views.workbench, name="workbench"),
    path("jobs/", views.create_job, name="create-job"),
    path("missions/<uuid:job_id>/progress/", views.mission_progress, name="mission-progress"),
    path("missions/<uuid:job_id>/report/", views.mission_report, name="mission-report"),
    path("missions/<uuid:job_id>/retry/", views.retry_mission, name="retry-mission"),
    path("history/", views.history, name="history"),
    path("system/", views.system_page, name="system"),
    path("api/missions/<uuid:job_id>/", views.mission_status_api, name="api-mission-status"),
    path("api/system/health/", views.health_api, name="api-system-health"),
    path("api/system/warmup/", views.warmup_api, name="api-system-warmup"),
]
```

- [ ] **Step 7: Verify Django imports**

Run: `python manage.py check`

Expected after Task 7: Django reports no system check issues.

## Task 3: FormulaJob Model, Admin, and Model Tests

**Files:**
- Create: `apps/formulas/models.py`
- Create: `apps/formulas/admin.py`
- Create: `tests/formulas/test_models.py`

- [ ] **Step 1: Write model tests**

Create `tests/formulas/test_models.py` with:

```python
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from apps.formulas.models import FormulaJob


def tiny_png(name: str = "formula.png") -> SimpleUploadedFile:
    return SimpleUploadedFile(name, b"fake-image-bytes", content_type="image/png")


class FormulaJobModelTests(TestCase):
    def test_formula_job_retry_relation_keeps_original_failed_job(self):
        failed = FormulaJob.objects.create(original_image=tiny_png("failed.png"), status=FormulaJob.Status.FAILED)
        retry = FormulaJob.objects.create(original_image=failed.original_image, retry_of=failed)

        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(failed.retries.count(), 1)

    def test_formula_job_is_terminal_for_succeeded_and_failed(self):
        succeeded = FormulaJob(status=FormulaJob.Status.SUCCEEDED)
        failed = FormulaJob(status=FormulaJob.Status.FAILED)
        running = FormulaJob(status=FormulaJob.Status.RUNNING)

        self.assertTrue(succeeded.is_terminal)
        self.assertTrue(failed.is_terminal)
        self.assertFalse(running.is_terminal)

    def test_formula_job_duration_ms_uses_started_and_finished_times(self):
        started = timezone.now()
        job = FormulaJob(started_at=started, finished_at=started + timedelta(milliseconds=1250))

        self.assertEqual(job.calculate_duration_ms(), 1250)
```

- [ ] **Step 2: Implement FormulaJob**

Create `apps/formulas/models.py` with:

```python
import uuid

from django.db import models
from django.utils import timezone


class FormulaJob(models.Model):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_image = models.ImageField(upload_to="formula_uploads/%Y/%m/")
    preprocessed_image = models.ImageField(upload_to="formula_preprocessed/%Y/%m/", blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    progress = models.PositiveSmallIntegerField(default=10)
    stage_code = models.CharField(max_length=64, default="UPLOAD_LOCKED")
    stage_label = models.CharField(max_length=64, default="UPLOAD LOCKED")
    stage_message = models.CharField(max_length=255, default="上传完成，任务已锁定")
    latex_result = models.TextField(blank=True)
    engine_name = models.CharField(max_length=64, default="pix2tex")
    retry_of = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="retries")
    error_message = models.CharField(max_length=255, blank=True)
    error_detail = models.TextField(blank=True)
    failure_stage = models.CharField(max_length=64, blank=True)
    timings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"FormulaJob {self.id} {self.status}"

    @property
    def is_terminal(self) -> bool:
        return self.status in {self.Status.SUCCEEDED, self.Status.FAILED}

    def mark_stage(self, code: str, label: str, message: str, progress: int) -> None:
        self.stage_code = code
        self.stage_label = label
        self.stage_message = message
        self.progress = progress
        self.save(update_fields=["stage_code", "stage_label", "stage_message", "progress"])

    def calculate_duration_ms(self) -> int | None:
        if not self.started_at or not self.finished_at:
            return None
        return int((self.finished_at - self.started_at).total_seconds() * 1000)

    def finish(self, status: str) -> None:
        self.status = status
        self.finished_at = timezone.now()
        self.duration_ms = self.calculate_duration_ms()
        self.save(update_fields=["status", "finished_at", "duration_ms"])
```

- [ ] **Step 3: Register admin**

Create `apps/formulas/admin.py` with `FormulaJobAdmin` listing id, status, stage label, engine name, retry_of, created_at, duration_ms.

- [ ] **Step 4: Create and run migrations**

Run: `python manage.py makemigrations formulas`

Expected: migration creates `FormulaJob`.

Run: `python manage.py test tests.formulas.test_models -v 2`

Expected: tests pass.

## Task 4: LaTeX Formatting and Image Preprocessing Services

**Files:**
- Create: `apps/formulas/services/latex_formats.py`
- Create: `apps/formulas/services/preprocessing.py`
- Create: `tests/formulas/test_latex_formats.py`
- Create: `tests/formulas/test_preprocessing.py`

- [ ] **Step 1: Write LaTeX format tests**

Test these cases:

```python
def test_latex_formats_strip_outer_dollars():
    assert build_latex_formats("$$x^2$$")["raw"] == "x^2"

def test_latex_formats_build_block_and_inline():
    formats = build_latex_formats(r"\frac{a}{b}")
    assert formats["block"] == "$$\\frac{a}{b}$$"
    assert formats["inline"] == "$\\frac{a}{b}$"
```

- [ ] **Step 2: Implement LaTeX format builder**

Create `apps/formulas/services/latex_formats.py` with:

```python
def normalize_latex(value: str) -> str:
    text = value.strip()
    if text.startswith("$$") and text.endswith("$$") and len(text) >= 4:
        text = text[2:-2].strip()
    elif text.startswith("$") and text.endswith("$") and len(text) >= 2:
        text = text[1:-1].strip()
    return " ".join(text.split())


def build_latex_formats(value: str) -> dict[str, str]:
    raw = normalize_latex(value)
    return {
        "raw": raw,
        "block": f"$${raw}$$",
        "inline": f"${raw}$",
        "render": raw,
    }
```

- [ ] **Step 3: Write preprocessing tests**

Create `tests/formulas/test_preprocessing.py` with these test functions:

```python
from pathlib import Path

from django.test import SimpleTestCase, override_settings
from PIL import Image

from apps.formulas.services.preprocessing import preprocess_image_file


class PreprocessingTests(SimpleTestCase):
    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_transparent_png_is_composited_to_white(self):
        source = Path(self.settings.MEDIA_ROOT) / "transparent.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGBA", (20, 20), (0, 0, 0, 0)).save(source)

        output = preprocess_image_file(source)
        image = Image.open(output)

        self.assertEqual(image.mode, "RGB")
        self.assertEqual(image.getpixel((0, 0)), (255, 255, 255))

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_large_image_is_resized_to_max_side(self):
        source = Path(self.settings.MEDIA_ROOT) / "large.jpg"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (3200, 1200), (255, 255, 255)).save(source)

        output = preprocess_image_file(source)
        image = Image.open(output)

        self.assertEqual(max(image.size), 1600)

    @override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
    def test_small_rgb_image_keeps_size(self):
        source = Path(self.settings.MEDIA_ROOT) / "small.jpg"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (400, 200), (255, 255, 255)).save(source)

        output = preprocess_image_file(source)
        image = Image.open(output)

        self.assertEqual(image.size, (400, 200))
```

- [ ] **Step 4: Implement preprocessing**

Create `apps/formulas/services/preprocessing.py` with functions that open an image with Pillow, composite transparent images onto white, resize only if max side exceeds settings `FORMULA_LAB_MAX_IMAGE_SIDE`, and save to `formula_preprocessed/`.

- [ ] **Step 5: Run service tests**

Run: `python manage.py test tests.formulas.test_latex_formats tests.formulas.test_preprocessing -v 2`

Expected: all service tests pass.

## Task 5: Redis Telemetry, Health API, and Warmup Endpoint

**Files:**
- Create: `apps/formulas/services/model_state.py`
- Create: `apps/formulas/services/telemetry.py`
- Create: `apps/formulas/services/health.py`
- Modify: `apps/formulas/views.py`
- Modify: `apps/formulas/urls.py`
- Create: `tests/formulas/test_health.py`

- [ ] **Step 1: Implement Redis model state service**

Create `apps/formulas/services/model_state.py` with constants:

```python
MODEL_STATUS_KEY = "formula_lab:model:status"
MODEL_MESSAGE_KEY = "formula_lab:model:message"
MODEL_LAST_WARMUP_KEY = "formula_lab:model:last_warmup_at"
MODEL_LAST_ERROR_KEY = "formula_lab:model:last_error"
WORKER_HEARTBEAT_KEY = "formula_lab:worker:heartbeat"
```

and functions `set_model_status(redis_client, status, message)`, `get_model_status(redis_client)`, `write_worker_heartbeat(redis_client)`, `get_worker_heartbeat(redis_client)`.

- [ ] **Step 2: Implement health snapshot**

Create `apps/formulas/services/health.py` to check database with `SELECT 1`, Redis with `ping`, worker heartbeat key, model status keys, media storage writability, queue counts from `FormulaJob`, and last job.

- [ ] **Step 3: Add system views**

In `apps/formulas/views.py`, create `system_page`, `health_api`, and `warmup_api`.

`warmup_api` dispatches `warmup_model_task.delay()` and returns JSON `{ "status": "queued" }`.

- [ ] **Step 4: Add routes**

In `apps/formulas/urls.py`, add:

```python
path("system/", views.system_page, name="system"),
path("api/system/health/", views.health_api, name="api-system-health"),
path("api/system/warmup/", views.warmup_api, name="api-system-warmup"),
```

- [ ] **Step 5: Test health JSON shape**

Run: `python manage.py test tests.formulas.test_health -v 2`

Expected: health JSON includes `web`, `database`, `redis`, `worker`, `model`, and `last_job`.

## Task 6: pix2tex Recognition Engine and Celery Tasks

**Files:**
- Create: `apps/formulas/services/pix2tex_engine.py`
- Create: `apps/formulas/services/recognizer.py`
- Create: `apps/formulas/tasks.py`
- Modify: `apps/formulas/models.py`

- [ ] **Step 1: Implement pix2tex lazy engine**

Create `apps/formulas/services/pix2tex_engine.py` with a module-level cached model. Use lazy import so Django web can start even if model load is slow.

Required interface shape:

```python
class Pix2TexEngine:
    def warmup(self) -> None:
        self._load_model()

    def recognize(self, image_path: str) -> str:
        model = self._load_model()
        return model(image_path)
```

- [ ] **Step 2: Implement recognizer orchestration**

Create `apps/formulas/services/recognizer.py` with:

`recognize_formula(job: FormulaJob) -> str` must preprocess the file, run pix2tex, normalize output, and return raw LaTeX.

It preprocesses the image, calls `Pix2TexEngine.recognize`, normalizes LaTeX, and returns raw LaTeX.

- [ ] **Step 3: Implement Celery tasks**

Create `apps/formulas/tasks.py` with:

Create two tasks: `run_formula_job(job_id: str) -> None` and `warmup_model_task() -> None`.

`run_formula_job` updates stages in this order:

```text
QUEUED 25
MODEL_WARMUP 40
IMAGE_PREPROCESS 60
INFERENCE 80
LATEX_POSTPROCESS 95
RESULT_READY 100
```

On exception, set `status=failed`, `failure_stage`, `error_message`, and truncated `error_detail`.

- [ ] **Step 4: Implement worker heartbeat**

Add a lightweight heartbeat thread in `tasks.py` using Celery worker process init signal. It writes `formula_lab:worker:heartbeat` to Redis with TTL 60 seconds every 20 seconds.

- [ ] **Step 5: Verify worker imports**

Run: `python -m compileall config apps`

Expected: compile succeeds.

## Task 7: Forms, Upload, Mission APIs, Retry API

**Files:**
- Create: `apps/formulas/forms.py`
- Modify: `apps/formulas/views.py`
- Modify: `apps/formulas/urls.py`
- Create: `tests/formulas/test_views.py`

- [ ] **Step 1: Implement upload form**

Create `apps/formulas/forms.py` with `FormulaUploadForm` validating:

```text
PNG
JPG
JPEG
<= 10MB
```

Error message for oversize:

```text
PAYLOAD EXCEEDS 10MB LIMIT
```

- [ ] **Step 2: Implement workbench and create job**

In `views.py`, implement `landing`, `workbench`, and `create_job`.

`create_job` creates `FormulaJob` only after POST from `START RECOGNITION`, then calls `run_formula_job.delay(str(job.id))`, then redirects to `mission_progress`.

- [ ] **Step 3: Implement mission pages and API**

In `views.py`, implement `mission_progress`, `mission_report`, `mission_status_api`, and `history`.

`mission_status_api` returns status, progress, stage_code, stage_label, stage_message, result_url, error_message, failure_stage.

- [ ] **Step 4: Implement retry**

In `views.py`, implement `retry_mission`.

It accepts only failed jobs, creates a new `FormulaJob` with `retry_of=old_job`, reuses `original_image`, dispatches `run_formula_job`, and redirects to the new progress page.

- [ ] **Step 5: Test views**

Run: `python manage.py test tests.formulas.test_views -v 2`

Expected: upload creates job on POST, mission API returns JSON, retry creates a new job linked through `retry_of`.

## Task 8: Templates, CSS, JavaScript, and Visual Assets

**Files:**
- Create templates under `apps/formulas/templates/formulas/`
- Create static CSS and JS under `apps/formulas/static/formulas/`
- Create visual assets under `apps/formulas/static/formulas/visuals/`

- [ ] **Step 1: Generate visual assets**

Create:

```text
apps/formulas/static/formulas/visuals/landing-mission-bg.png
```

Landing prompt:

```text
abstract black and white mathematical recognition scene, floating equation fragments,
paper and scanner texture, geometric measurement lines, cold white light, subtle
recognition boxes, mission control atmosphere, cinematic high contrast, no rockets,
no planets, no spacecraft, no colorful gradients
```

Current visual direction: Landing keeps the cinematic bitmap background; all other pages use the global fine-grid CSS background.

- [ ] **Step 2: Create base template**

`base.html` loads Tailwind CDN, local `base.css`, page CSS block, KaTeX CSS/JS, lucide inline SVG symbols, and includes `partials/nav.html`.

- [ ] **Step 3: Create Landing**

`landing.html` shows full-screen image background, `FORMULA LAB`, `MISSION CONTROL FOR LATEX RECOGNITION`, CTA links `ENTER WORKBENCH` and `VIEW MISSION LOG`.

- [ ] **Step 4: Create Workbench**

`workbench.html` has file drop zone, preview-only selected image state, `START RECOGNITION`, right telemetry panel with model status, queue status, supported formats, recent missions.

- [ ] **Step 5: Create Progress**

`progress.html` has image preview, checklist stages, small progress bar, task metadata, failure details disclosure, and JS polling `/api/missions/<uuid>/`.

- [ ] **Step 6: Create Result**

`result.html` has left image/metadata column and right LaTeX console. Tabs default to `BLOCK`; `COPY CURRENT` copies current tab; preview updates with the selected tab.

- [ ] **Step 7: Create History and System pages**

`history.html` renders timeline entries with expandable timings and `RETRY MISSION` for failed missions. `system.html` renders telemetry and `WARMUP MODEL`.

- [ ] **Step 8: Run Django template check**

Run: `python manage.py check`

Expected: no template or URL errors.

## Task 9: README and Documentation Sync

**Files:**
- Create: `README.md`
- Modify: `docs/00-文档索引.md` if plan path should be linked

- [ ] **Step 1: Create bilingual README**

Write `README.md` with:

```markdown
# Formula Lab Mission Control

SpaceX-inspired formula recognition mission control for Linux System and Programming Practice.

## 中文说明

本项目用于《Linux系统与编程实践》大实验 2：上传公式图片，使用 pix2tex 识别为 LaTeX，并在网页中展示可复制源码和渲染预览。

## Quick Start

```bash
cp .env.example .env
make up
```

Open: http://localhost:8000/

## Useful Commands

```bash
make verify
make warmup
make e2e
make test
```
```

- [ ] **Step 2: Link implementation plan**

Add the plan path to `docs/00-文档索引.md` under a short “实施计划” section.

## Task 10: Unit Tests, E2E, and Verification

**Files:**
- Create: `package.json`
- Create: `playwright.config.ts`
- Create: `e2e/formula_lab.spec.ts`

- [ ] **Step 1: Create Playwright package**

Write `package.json` with:

```json
{
  "scripts": {
    "e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0"
  }
}
```

- [ ] **Step 2: Create Playwright config**

Write `playwright.config.ts` with base URL `http://localhost:8000`, timeout `180000`, and one Chromium project.

- [ ] **Step 3: Create real-model E2E**

`e2e/formula_lab.spec.ts` uploads all four course images:

```text
../linux2026/大实验2/测试用图片/formular1.png
../linux2026/大实验2/测试用图片/formular2.png
../linux2026/大实验2/测试用图片/formular3.png
../linux2026/大实验2/测试用图片/formular4.png
```

Flow per image:

```text
landing -> ENTER WORKBENCH -> choose file -> START RECOGNITION
-> wait for RESULT READY -> result page -> tabs RAW/BLOCK/INLINE
-> COPY CURRENT -> history -> telemetry
```

- [ ] **Step 4: Run verification commands**

Run:

```bash
make test
make verify
make warmup
make e2e
```

Expected:

```text
make test    PASS
make verify  health JSON returned
make warmup  queued or ready response
make e2e     all four real-image missions complete
```

## Self-Review

**Spec coverage:** This plan covers Docker Compose, Django/PostgreSQL/Redis/Celery, pix2tex, mission routes, telemetry, retry, visual assets, SpaceX-inspired UI, LaTeX tabs, Playwright real-model E2E, and bilingual README.

**Placeholder scan:** The plan avoids undefined open-ended tasks. Implementation steps name exact files and expected commands.

**Type consistency:** The data model consistently uses `FormulaJob`; user-facing routes and UI use `mission`; LaTeX formats consistently use `raw`, `block`, `inline`, and `render`.
