from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import Client, TestCase, override_settings


class FormulaSystemViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.media_root_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()

    def test_base_template_uses_local_katex_assets(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "/static/formulas/vendor/katex/katex.min.css")
        self.assertContains(response, "/static/formulas/vendor/katex/katex.min.js")
        self.assertNotContains(response, "cdn.jsdelivr.net/npm/katex")

    def test_system_renders_summary_first_and_compact_service_list(self):
        payload = {
            "web": {"ok": True},
            "database": {"ok": True},
            "redis": {"ok": True},
            "worker": {"ok": False, "heartbeat_at": None},
            "model": {"status": "warming", "state": "warming", "message": "loading paddle model", "ok": False},
            "media": {"ok": True},
            "queues": {"queued": 2, "running": 1, "succeeded": 8, "failed": 1, "total": 12},
            "last_job": {"status": "running", "stage_label": "INFERENCE"},
        }

        with patch("apps.formulas.views.build_health_snapshot", return_value=payload):
            response = self.client.get("/system/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/system.html")
        self.assertContains(response, "dashboard-grid")
        self.assertContains(response, "service-flow")
        self.assertContains(response, 'data-service="MODEL"')
        self.assertContains(response, "is-warming")
        self.assertNotContains(response, "system-dashboard")
