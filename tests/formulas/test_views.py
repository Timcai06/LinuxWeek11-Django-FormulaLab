from pathlib import Path
from io import BytesIO
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from PIL import Image

from apps.formulas.models import FormulaJob


def image_bytes(format_name: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (10, 5), (255, 255, 255)).save(buffer, format=format_name)
    return buffer.getvalue()


def upload_file(name: str = "formula.png", content: bytes | None = None) -> SimpleUploadedFile:
    if content is None:
        content = image_bytes("JPEG" if name.lower().endswith((".jpg", ".jpeg")) else "PNG")
    return SimpleUploadedFile(name, content, content_type="image/png")


class FormulaMissionViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.media_root_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()

    def test_create_job_accepts_valid_upload_creates_job_and_dispatches_worker(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.jpeg")})

        self.assertEqual(response.status_code, 302)
        job = FormulaJob.objects.get()
        self.assertEqual(job.original_image.name.rsplit("/", 1)[-1], "formula.jpeg")
        self.assertEqual(response["Location"], f"/missions/{job.id}/progress/")
        delay.assert_called_once_with(str(job.id))

    def test_create_job_rejects_invalid_extension(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.gif")})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("image", response.json()["errors"])
        delay.assert_not_called()

    def test_create_job_rejects_spoofed_png_content(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("spoofed.png", b"not a real image")})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("image", response.json()["errors"])
        delay.assert_not_called()

    def test_create_job_rejects_uploads_over_configured_limit(self):
        too_large = b"x" * ((10 * 1024 * 1024) + 1)

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
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
            patch("apps.formulas.views.run_formula_job.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.logger.exception") as log_exception,
        ):
            response = self.client.post("/jobs/", {"image": upload_file("formula.png")})

        self.assertEqual(response.status_code, 503)
        job = FormulaJob.objects.get()
        self.assertEqual(job.status, FormulaJob.Status.FAILED)
        self.assertEqual(job.failure_stage, "DISPATCH")
        self.assertEqual(job.error_message, "mission broker unavailable")
        log_exception.assert_called_once()

    def test_mission_status_api_returns_expected_shape_and_result_url_for_success(self):
        job = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.SUCCEEDED,
            progress=100,
            stage_code="RESULT_READY",
            stage_label="RESULT READY",
            stage_message="公式识别结果已生成",
            error_message="",
            failure_stage="",
        )

        response = self.client.get(f"/api/missions/{job.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json()),
            {
                "status",
                "progress",
                "stage_code",
                "stage_label",
                "stage_message",
                "result_url",
                "error_message",
                "failure_stage",
            },
        )
        self.assertEqual(response.json()["status"], FormulaJob.Status.SUCCEEDED)
        self.assertEqual(response.json()["result_url"], f"/missions/{job.id}/report/")

    def test_mission_status_api_uses_null_result_url_until_success(self):
        job = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        response = self.client.get(f"/api/missions/{job.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["result_url"])

    def test_retry_failed_job_creates_linked_job_and_dispatches_worker(self):
        failed = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.FAILED,
            error_message="inference failed",
            failure_stage="INFERENCE",
        )

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post(f"/missions/{failed.id}/retry/")

        self.assertEqual(response.status_code, 302)
        retry = FormulaJob.objects.exclude(id=failed.id).get()
        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(retry.original_image.name, failed.original_image.name)
        self.assertEqual(response["Location"], f"/missions/{retry.id}/progress/")
        delay.assert_called_once_with(str(retry.id))

    def test_retry_non_failed_job_is_rejected(self):
        queued = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post(f"/missions/{queued.id}/retry/")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["error"], "only failed missions can be retried")
        self.assertEqual(FormulaJob.objects.count(), 1)
        delay.assert_not_called()

    def test_retry_marks_new_job_failed_when_dispatch_fails(self):
        failed = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.FAILED,
            error_message="inference failed",
            failure_stage="INFERENCE",
        )

        with (
            patch("apps.formulas.views.run_formula_job.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.logger.exception") as log_exception,
        ):
            response = self.client.post(f"/missions/{failed.id}/retry/")

        self.assertEqual(response.status_code, 503)
        retry = FormulaJob.objects.exclude(id=failed.id).get()
        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(retry.status, FormulaJob.Status.FAILED)
        self.assertEqual(retry.failure_stage, "RETRY_DISPATCH")
        self.assertEqual(retry.error_message, "mission broker unavailable")
        log_exception.assert_called_once()
