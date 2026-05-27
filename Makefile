PYTHON ?= ./.conda/bin/python
HOST ?= 127.0.0.1
PORT ?= 8000
DOCKER_BUILDKIT ?= 1
OCR_ENGINE ?= paddle

.PHONY: up down logs web-logs worker-logs model-api-logs migrate shell admin test verify warmup e2e e2e-install e2e-smoke e2e-real-model e2e-local dev dev-migrate dev-check dev-test dev-shell dev-worker dev-redis dev-model-api docker-build local local-http local-pix2tex install-pix2tex paddle-web paddle-worker paddle-redis editor-build editor-check frontend-build frontend-check governance-check

up:
	docker compose up --build

docker-build:
	DOCKER_BUILDKIT=$(DOCKER_BUILDKIT) docker compose build

down:
	docker compose down

logs:
	docker compose logs -f

web-logs:
	docker compose logs -f web

worker-logs:
	docker compose logs -f worker

model-api-logs:
	docker compose logs -f model-api

migrate:
	docker compose exec web python manage.py migrate

shell:
	docker compose exec web python manage.py shell

admin:
	docker compose exec web python manage.py createsuperuser

test:
	docker compose exec web python manage.py test

dev:
	$(PYTHON) manage.py runserver $(HOST):$(PORT)

dev-redis:
	docker compose up redis

dev-worker:
	DJANGO_SETTINGS_MODULE=config.settings.dev $(PYTHON) -m celery -A config worker --loglevel=info --pool=solo

dev-model-api:
	DJANGO_SETTINGS_MODULE=config.settings.dev FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) $(PYTHON) -m uvicorn model_service.main:app --host $(HOST) --port 9000

local:
	@echo "Starting Redis, Django, and Celery with FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE)"
	@echo "Open http://$(HOST):$(PORT)/ after Django is ready. Press Ctrl-C to stop."
	FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) $(MAKE) -j3 dev-redis dev-worker dev

local-http:
	@echo "Starting Redis, Django, Celery, and FastAPI model API with FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE)"
	@echo "Open http://$(HOST):$(PORT)/ after Django is ready. Model API runs at http://$(HOST):9000/."
	FORMULA_LAB_RECOGNITION_BACKEND=http FORMULA_LAB_MODEL_API_URL=http://$(HOST):9000 FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) $(MAKE) -j4 dev-redis dev-model-api dev-worker dev

local-pix2tex:
	$(MAKE) OCR_ENGINE=pix2tex local

install-pix2tex:
	$(PYTHON) -m pip install -r requirements-pix2tex.txt

paddle-web:
	FORMULA_LAB_OCR_ENGINE=paddle $(MAKE) dev

paddle-worker:
	FORMULA_LAB_OCR_ENGINE=paddle $(MAKE) dev-worker

paddle-redis:
	$(MAKE) dev-redis

dev-migrate:
	$(PYTHON) manage.py migrate

dev-check:
	$(PYTHON) manage.py check

dev-test:
	$(PYTHON) manage.py test tests.formulas -v 2

dev-shell:
	$(PYTHON) manage.py shell

verify:
	./scripts/verify.sh

warmup:
	./scripts/warmup.sh

frontend-build:
	npm run build

editor-build:
	npm run build:editor

editor-check:
	npm run check:editor

frontend-check:
	npm run check:frontend

governance-check:
	$(PYTHON) scripts/check_repository_governance.py

e2e:
	npm run e2e

e2e-install:
	npx playwright install chromium

e2e-smoke:
	npx playwright test e2e/smoke.spec.ts

e2e-real-model:
	npx playwright test e2e/formula_lab.spec.ts

e2e-local:
	E2E_SPEC=e2e/formula_lab.spec.ts ./scripts/run_e2e_local.sh
