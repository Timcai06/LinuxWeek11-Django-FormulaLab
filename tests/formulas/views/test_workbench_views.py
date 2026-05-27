from unittest.mock import patch

from django.test import SimpleTestCase

from apps.formulas.models import BatchMission, FormulaJob, PaperProject
from tests.formulas.helpers import upload_file
from tests.formulas.views.base import FormulaViewTestCase


class UploadFileHelperTests(SimpleTestCase):
    def test_upload_file_uses_png_content_type_for_png_suffix(self):
        self.assertEqual(upload_file("formula.png").content_type, "image/png")

    def test_upload_file_uses_jpeg_content_type_for_jpeg_suffixes(self):
        self.assertEqual(upload_file("formula.jpg").content_type, "image/jpeg")
        self.assertEqual(upload_file("formula.jpeg").content_type, "image/jpeg")
        self.assertEqual(upload_file("formula.JPG").content_type, "image/jpeg")

    def test_upload_file_uses_octet_stream_content_type_for_unknown_suffix(self):
        self.assertEqual(upload_file("formula.gif").content_type, "application/octet-stream")


class FormulaWorkbenchViewTests(FormulaViewTestCase):
    def test_landing_renders_mission_control_entry_points(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/landing.html")
        self.assertContains(response, "formulas/js/generated/layout-intelligence.js")
        self.assertContains(response, "FORMULA")
        self.assertContains(response, "LAB")
        self.assertContains(response, "ENTER WORKBENCH")
        self.assertContains(response, "VIEW MISSION LOG")

    def test_workbench_renders_upload_form_and_telemetry_context(self):
        project = PaperProject.objects.create(name="Active paper", writing_goal="Collect formulas")
        FormulaJob.objects.create(original_image="formula_uploads/source.png")

        with patch("apps.formulas.views.system_views.build_health_snapshot") as health_snapshot:
            health_snapshot.return_value = {
                "model": {"status": "ready", "state": "ready", "message": "pix2tex model ready", "ok": True},
                "queues": {"queued": 1, "running": 0, "succeeded": 0, "failed": 0, "total": 1},
            }
            response = self.client.get("/workbench/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/workbench.html")
        self.assertContains(response, "/static/formulas/css/pages/workbench.css")
        self.assertContains(response, "/static/formulas/css/components/workbench-telemetry.css")
        self.assertContains(response, 'action="/jobs/"')
        self.assertContains(response, 'enctype="multipart/form-data"')
        self.assertContains(response, 'name="project"')
        self.assertContains(response, 'name="project_name"')
        self.assertContains(response, "Active paper")
        self.assertEqual(list(response.context["projects"]), [project])
        self.assertNotContains(response, "model-indicator")
        self.assertContains(response, "model-status-light is-ready")
        self.assertContains(response, "status-readout is-ready")
        self.assertNotContains(response, "pix2tex model ready")
        self.assertNotContains(response, "SUPPORTED FORMATS")
        self.assertNotContains(response, "PNG, JPG, JPEG")
        self.assertEqual(response.context["queue_counts"]["queued"], 1)
        self.assertEqual(len(response.context["recent_jobs"]), 1)

    def test_create_job_accepts_valid_upload_creates_job_and_dispatches_worker(self):
        with patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.jpeg")})

        self.assertEqual(response.status_code, 302)
        job = FormulaJob.objects.get()
        self.assertEqual(job.original_image.name.rsplit("/", 1)[-1], "formula.jpeg")
        self.assertEqual(response["Location"], f"/missions/{job.id}/progress/")
        delay.assert_called_once_with(str(job.id))

    def test_create_job_keeps_job_queued_when_recognition_queue_is_paused(self):
        with (
            patch("apps.formulas.views.workbench_views.is_recognition_queue_paused", return_value=True),
            patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay,
        ):
            response = self.client.post("/jobs/", {"image": upload_file("formula.jpeg")})

        self.assertEqual(response.status_code, 302)
        job = FormulaJob.objects.get()
        self.assertEqual(job.status, FormulaJob.Status.QUEUED)
        self.assertEqual(job.stage_code, "QUEUE_PAUSED")
        self.assertEqual(job.stage_label, "QUEUE PAUSED")
        self.assertEqual(response["Location"], f"/missions/{job.id}/progress/")
        delay.assert_not_called()

    def test_create_job_attaches_existing_project_and_creates_batch(self):
        project = PaperProject.objects.create(name="Existing paper")

        with patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay:
            response = self.client.post(
                "/jobs/",
                {
                    "image": upload_file("formula.png"),
                    "project": str(project.id),
                },
            )

        self.assertEqual(response.status_code, 302)
        job = FormulaJob.objects.get()
        batch = BatchMission.objects.get()
        self.assertEqual(job.project, project)
        self.assertEqual(job.batch, batch)
        self.assertEqual(batch.project, project)
        self.assertEqual(batch.status, BatchMission.Status.RUNNING)
        self.assertEqual(batch.title, "formula.png")
        delay.assert_called_once_with(str(job.id))

    def test_create_job_creates_new_project_from_project_name(self):
        with patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay:
            response = self.client.post(
                "/jobs/",
                {
                    "image": upload_file("formula.png"),
                    "project_name": "New theorem draft",
                },
            )

        self.assertEqual(response.status_code, 302)
        project = PaperProject.objects.get()
        job = FormulaJob.objects.get()
        self.assertEqual(project.name, "New theorem draft")
        self.assertEqual(job.project, project)
        self.assertEqual(job.batch.project, project)
        delay.assert_called_once_with(str(job.id))

    def test_create_job_rejects_invalid_extension(self):
        with patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.gif")})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("image", response.json()["errors"])
        delay.assert_not_called()

    def test_create_job_rejects_spoofed_png_content(self):
        with patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("spoofed.png", b"not a real image")})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("image", response.json()["errors"])
        delay.assert_not_called()

    def test_create_job_rejects_uploads_over_configured_limit(self):
        too_large = b"x" * ((10 * 1024 * 1024) + 1)

        with patch("apps.formulas.views.workbench_views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.png", too_large)})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("PAYLOAD EXCEEDS 10MB LIMIT", response.json()["errors"]["image"][0])
        delay.assert_not_called()

    def test_create_job_get_is_rejected_and_does_not_create_job(self):
        response = self.client.get("/jobs/")

        self.assertEqual(response.status_code, 405)
        self.assertEqual(FormulaJob.objects.count(), 0)

    def test_create_job_marks_failed_when_dispatch_fails(self):
        with (
            patch("apps.formulas.views.workbench_views.run_formula_job.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.workbench_views.logger.exception") as log_exception,
        ):
            response = self.client.post("/jobs/", {"image": upload_file("formula.png")})

        self.assertEqual(response.status_code, 503)
        job = FormulaJob.objects.get()
        self.assertEqual(job.status, FormulaJob.Status.FAILED)
        self.assertEqual(job.failure_stage, "DISPATCH")
        self.assertEqual(job.error_message, "mission broker unavailable")
        log_exception.assert_called_once()
