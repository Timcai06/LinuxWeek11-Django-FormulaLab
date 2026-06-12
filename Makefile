PYTHON ?= ./.conda/bin/python
HOST ?= 127.0.0.1
PORT ?= 8000
DOCKER_BUILDKIT ?= 1
OCR_ENGINE ?= paddle
# Route C: UTM/Linux ARM64 runs Django/Celery/Postgres/Redis, while the Mac
# hosts Paddle through model-api because Paddle has no Linux ARM64 wheel.
LINUX_MAC_MODEL_HOST ?= $(shell ip route 2>/dev/null | awk '/default/ {print $$3; exit}')
LINUX_MAC_MODEL_URL ?= http://$(LINUX_MAC_MODEL_HOST):9000
LINUX_ARM64_COMPOSE = docker compose -f docker-compose.yml -f docker-compose.arm64-smoke.yml -f docker-compose.arm64-mac-model.yml

.PHONY: up down logs web-logs worker-logs model-api-logs migrate shell admin test verify warmup e2e e2e-install e2e-smoke e2e-real-model e2e-visual e2e-visual-update e2e-local e2e-local-smoke e2e-local-visual dev dev-migrate dev-check dev-test dev-shell dev-worker dev-redis dev-model-api mac-model linux-up linux-down linux-ps linux-logs linux-worker-logs linux-model-health docker-build local local-http local-pix2tex install-pix2tex paddle-web paddle-worker paddle-redis editor-build editor-check frontend-build frontend-check governance-check

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

mac-model:
	$(MAKE) dev-model-api HOST=0.0.0.0

linux-up:
	@test -n "$(LINUX_MAC_MODEL_HOST)" || (echo "Cannot detect Mac model host. Run on Linux/UTM or pass LINUX_MAC_MODEL_HOST=..." && exit 1)
	@echo "Using Mac model API: $(LINUX_MAC_MODEL_URL)"
	FORMULA_LAB_MODEL_API_URL=$(LINUX_MAC_MODEL_URL) $(LINUX_ARM64_COMPOSE) up -d --no-build db redis web worker

linux-down:
	@test -n "$(LINUX_MAC_MODEL_HOST)" || (echo "Cannot detect Mac model host. Run on Linux/UTM or pass LINUX_MAC_MODEL_HOST=..." && exit 1)
	FORMULA_LAB_MODEL_API_URL=$(LINUX_MAC_MODEL_URL) $(LINUX_ARM64_COMPOSE) down

linux-ps:
	@test -n "$(LINUX_MAC_MODEL_HOST)" || (echo "Cannot detect Mac model host. Run on Linux/UTM or pass LINUX_MAC_MODEL_HOST=..." && exit 1)
	FORMULA_LAB_MODEL_API_URL=$(LINUX_MAC_MODEL_URL) $(LINUX_ARM64_COMPOSE) ps

linux-logs:
	@test -n "$(LINUX_MAC_MODEL_HOST)" || (echo "Cannot detect Mac model host. Run on Linux/UTM or pass LINUX_MAC_MODEL_HOST=..." && exit 1)
	FORMULA_LAB_MODEL_API_URL=$(LINUX_MAC_MODEL_URL) $(LINUX_ARM64_COMPOSE) logs -f web worker

linux-worker-logs:
	@test -n "$(LINUX_MAC_MODEL_HOST)" || (echo "Cannot detect Mac model host. Run on Linux/UTM or pass LINUX_MAC_MODEL_HOST=..." && exit 1)
	FORMULA_LAB_MODEL_API_URL=$(LINUX_MAC_MODEL_URL) $(LINUX_ARM64_COMPOSE) logs -f worker

linux-model-health:
	@test -n "$(LINUX_MAC_MODEL_HOST)" || (echo "Cannot detect Mac model host. Run on Linux/UTM or pass LINUX_MAC_MODEL_HOST=..." && exit 1)
	curl -fsS $(LINUX_MAC_MODEL_URL)/health

local:
	@echo "Starting Redis, Django, and Celery with FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE)"
	@echo "Open http://$(HOST):$(PORT)/ after Django is ready. Press Ctrl-C to stop."
	FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) HOST=$(HOST) PORT=$(PORT) PYTHON=$(PYTHON) ./scripts/run_local.sh

local-http:
	@echo "Starting Redis, Django, Celery, and FastAPI model API with FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE)"
	@echo "Open http://$(HOST):$(PORT)/ after Django is ready. Model API runs at http://$(HOST):9000/."
	FORMULA_LAB_RECOGNITION_BACKEND=http FORMULA_LAB_MODEL_API_URL=http://$(HOST):9000 START_MODEL_API=1 FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) HOST=$(HOST) PORT=$(PORT) PYTHON=$(PYTHON) ./scripts/run_local.sh

local-pix2tex:
	$(MAKE) OCR_ENGINE=pix2tex local

install-pix2tex:
	$(PYTHON) -m pip install -r config/requirements/pix2tex.txt

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
	npx playwright test --config=build/playwright/playwright.config.ts e2e/smoke.spec.ts

e2e-real-model:
	npx playwright test --config=build/playwright/playwright.config.ts e2e/formula_lab.spec.ts

e2e-visual:
	E2E_VISUAL=1 npx playwright test --config=build/playwright/playwright.config.ts e2e/visual.spec.ts

e2e-visual-update:
	E2E_VISUAL=1 npx playwright test --config=build/playwright/playwright.config.ts e2e/visual.spec.ts --update-snapshots

e2e-local:
	E2E_SPEC=e2e/formula_lab.spec.ts ./scripts/run_e2e_local.sh

e2e-local-smoke:
	E2E_SPEC=e2e/smoke.spec.ts ./scripts/run_e2e_local.sh

e2e-local-visual:
	E2E_VISUAL=1 E2E_SPEC=e2e/visual.spec.ts ./scripts/run_e2e_local.sh
