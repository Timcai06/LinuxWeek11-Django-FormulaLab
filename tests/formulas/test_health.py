from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import Client, SimpleTestCase, TestCase, override_settings

from apps.formulas.models import FormulaJob


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.ping_called = False

    def ping(self):
        self.ping_called = True
        return True

    def get(self, key):
        return self.values.get(key)


class HealthSnapshotTests(TestCase):
    def setUp(self):
        self.media_root_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()

    def test_health_snapshot_includes_runtime_sections(self):
        from apps.formulas.services.health import build_health_snapshot
        from apps.formulas.services.model_state import (
            MODEL_MESSAGE_KEY,
            MODEL_STATUS_KEY,
            WORKER_HEARTBEAT_KEY,
        )

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
