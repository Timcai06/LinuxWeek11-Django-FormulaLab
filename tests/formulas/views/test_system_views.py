from unittest.mock import patch

from tests.formulas.views.base import FormulaViewTestCase


class FormulaSystemViewTests(FormulaViewTestCase):
    def test_base_template_uses_local_katex_assets(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "/static/formulas/vendor/katex/katex.min.css")
        self.assertContains(response, "/static/formulas/vendor/katex/katex.min.js")
        self.assertContains(response, "/static/formulas/css/components/console.css")
        self.assertContains(response, "/static/formulas/css/components/katex-preview.css")
        self.assertContains(response, "/static/formulas/css/components/dashboard.css")
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

        with patch("apps.formulas.views.system_views.build_health_snapshot", return_value=payload):
            response = self.client.get("/system/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/system.html")
        self.assertContains(response, "/static/formulas/css/pages/system.css")
        self.assertContains(response, "/static/formulas/css/components/system-service-flow.css")
        self.assertContains(response, "dashboard-grid")
        self.assertContains(response, "service-flow")
        self.assertContains(response, 'data-service="MODEL"')
        self.assertContains(response, "is-warming")
        self.assertNotContains(response, "system-dashboard")
