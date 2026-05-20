PYTHON ?= ./.conda/bin/python
HOST ?= 127.0.0.1
PORT ?= 8000
DOCKER_BUILDKIT ?= 1
OCR_ENGINE ?= paddle

.PHONY: up down logs web-logs worker-logs migrate shell admin test verify warmup e2e dev dev-migrate dev-check dev-test dev-shell dev-worker dev-redis docker-build local local-pix2tex paddle-web paddle-worker paddle-redis frontend-build frontend-check

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

local:
	@echo "Starting Redis, Django, and Celery with FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE)"
	@echo "Open http://$(HOST):$(PORT)/ after Django is ready. Press Ctrl-C to stop."
	FORMULA_LAB_OCR_ENGINE=$(OCR_ENGINE) $(MAKE) -j3 dev-redis dev-worker dev

local-pix2tex:
	$(MAKE) OCR_ENGINE=pix2tex local

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

frontend-check:
	npm run check:frontend

e2e:
	npm run e2e
