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
