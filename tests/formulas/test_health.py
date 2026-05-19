from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import Client, SimpleTestCase, TestCase, override_settings

from apps.formulas.models import FormulaJob
from apps.formulas.services.model_state import (
    MODEL_LAST_ERROR_KEY,
    MODEL_LAST_WARMUP_KEY,
    MODEL_MESSAGE_KEY,
    MODEL_STATUS_KEY,
    WORKER_HEARTBEAT_KEY,
    get_model_status,
    get_worker_heartbeat,
)


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.ping_called = False

    def ping(self):
        self.ping_called = True
        return True

    def get(self, key):
        return self.values.get(key)


class FailingRedis:
    def ping(self):
        raise RuntimeError("redis down")

    def get(self, key):
        raise RuntimeError("redis down")


class HealthSnapshotTests(TestCase):
    def setUp(self):
        self.media_root_context = TemporaryDirectory()
        self.media_root = Path(self.media_root_context.name)
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()

    def test_health_snapshot_includes_runtime_sections(self):
        from apps.formulas.services.health import build_health_snapshot

        redis_client = FakeRedis()
        redis_client.values = {
            MODEL_STATUS_KEY: "ready",
            MODEL_MESSAGE_KEY: "model warmed",
            WORKER_HEARTBEAT_KEY: "2026-05-19T12:00:00+08:00",
        }
        FormulaJob.objects.create(original_image="formula_uploads/source.png", status=FormulaJob.Status.QUEUED)

        with patch("apps.formulas.services.health.get_redis_client", return_value=redis_client):
            snapshot = build_health_snapshot()

        self.assertEqual(
            set(snapshot),
            {"web", "database", "redis", "worker", "model", "media", "queues", "last_job"},
        )
        self.assertTrue(snapshot["web"]["ok"])
        self.assertTrue(snapshot["database"]["ok"])
        self.assertTrue(snapshot["redis"]["ok"])
        self.assertTrue(snapshot["worker"]["ok"])
        self.assertEqual(snapshot["model"]["status"], "ready")
        self.assertEqual(snapshot["queues"]["queued"], 1)
        self.assertIsNotNone(snapshot["last_job"])

    def test_health_snapshot_degrades_backend_failures_to_json_fields(self):
        from apps.formulas.services.health import build_health_snapshot

        blocked_media_root = self.media_root / "blocked-media-root"
        blocked_media_root.write_text("not a directory", encoding="utf-8")

        with (
            override_settings(MEDIA_ROOT=blocked_media_root),
            patch("apps.formulas.services.health.get_redis_client", return_value=FailingRedis()),
            patch("apps.formulas.services.health.connection.cursor", side_effect=RuntimeError("db down")),
        ):
            snapshot = build_health_snapshot()

        self.assertTrue(snapshot["web"]["ok"])
        self.assertFalse(snapshot["database"]["ok"])
        self.assertIn("db down", snapshot["database"]["error"])
        self.assertFalse(snapshot["redis"]["ok"])
        self.assertFalse(snapshot["worker"]["ok"])
        self.assertFalse(snapshot["model"]["ok"])
        self.assertFalse(snapshot["media"]["ok"])
        self.assertIn("error", snapshot["queues"])
        self.assertIn("error", snapshot["last_job"])


class ModelStateTests(SimpleTestCase):
    def test_model_state_decodes_bytes_and_strings(self):
        redis_client = FakeRedis()
        redis_client.values = {
            MODEL_STATUS_KEY: b"ready",
            MODEL_MESSAGE_KEY: "model warmed",
            MODEL_LAST_WARMUP_KEY: b"2026-05-19T12:00:00+08:00",
            MODEL_LAST_ERROR_KEY: None,
            WORKER_HEARTBEAT_KEY: b"2026-05-19T12:01:00+08:00",
        }

        self.assertEqual(
            get_model_status(redis_client),
            {
                "status": "ready",
                "message": "model warmed",
                "last_warmup_at": "2026-05-19T12:00:00+08:00",
                "last_error": None,
            },
        )
        self.assertEqual(get_worker_heartbeat(redis_client), "2026-05-19T12:01:00+08:00")


class HealthApiTests(SimpleTestCase):
    def test_health_api_returns_expected_json_shape(self):
        payload = {
            "web": {"ok": True},
            "database": {"ok": True},
            "redis": {"ok": True},
            "worker": {"ok": False},
            "model": {"status": None},
            "media": {"ok": True},
            "queues": {"total": 0},
            "last_job": None,
        }

        with patch("apps.formulas.views.build_health_snapshot", return_value=payload):
            response = Client().get("/api/system/health/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        for key in ("web", "database", "redis", "worker", "model", "last_job"):
            self.assertIn(key, data)

    def test_warmup_api_requires_post(self):
        response = Client().get("/api/system/warmup/")

        self.assertEqual(response.status_code, 405)

    def test_warmup_api_uses_csrf_protection(self):
        response = Client(enforce_csrf_checks=True).post("/api/system/warmup/")

        self.assertEqual(response.status_code, 403)

    def test_warmup_api_queues_task(self):
        with patch("apps.formulas.views.warmup_model_task.delay") as delay:
            response = Client().post("/api/system/warmup/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "queued"})
        delay.assert_called_once_with()

    def test_warmup_api_reports_broker_failure(self):
        with (
            patch("apps.formulas.views.warmup_model_task.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.logger.exception") as log_exception,
        ):
            response = Client().post("/api/system/warmup/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "unavailable")
        self.assertEqual(response.json()["error"], "warmup broker unavailable")
        log_exception.assert_called_once_with("Unable to queue model warmup task")
