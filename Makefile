PYTHON ?= ./.conda/bin/python
HOST ?= 127.0.0.1
PORT ?= 8000
DOCKER_BUILDKIT ?= 1

.PHONY: up down logs web-logs worker-logs migrate shell admin test verify warmup e2e dev dev-migrate dev-check dev-test dev-shell docker-build

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

e2e:
	npm run e2e
