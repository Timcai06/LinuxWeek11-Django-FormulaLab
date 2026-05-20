from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from apps.formulas.models import FormulaJob


def tiny_png(name: str = "formula.png") -> SimpleUploadedFile:
    return SimpleUploadedFile(name, b"fake-image-bytes", content_type="image/png")


class FormulaJobModelTests(TestCase):
    def test_formula_job_generates_human_readable_mission_code(self):
        first = FormulaJob.objects.create(original_image=tiny_png("first.png"))
        second = FormulaJob.objects.create(original_image=tiny_png("second.png"))
        today = timezone.localdate().strftime("%Y%m%d")

        self.assertRegex(first.mission_code, rf"^FL-{today}-\d{{4}}$")
        self.assertEqual(second.mission_code, f"FL-{today}-{int(first.mission_code.rsplit('-', 1)[1]) + 1:04d}")

    def test_formula_job_retry_relation_keeps_original_failed_job(self):
        failed = FormulaJob.objects.create(original_image=tiny_png("failed.png"), status=FormulaJob.Status.FAILED)
        retry = FormulaJob.objects.create(original_image=failed.original_image, retry_of=failed)

        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(failed.retries.count(), 1)

    def test_formula_job_is_terminal_for_succeeded_and_failed(self):
        succeeded = FormulaJob(status=FormulaJob.Status.SUCCEEDED)
        failed = FormulaJob(status=FormulaJob.Status.FAILED)
        running = FormulaJob(status=FormulaJob.Status.RUNNING)

        self.assertTrue(succeeded.is_terminal)
        self.assertTrue(failed.is_terminal)
        self.assertFalse(running.is_terminal)

    def test_formula_job_duration_ms_uses_started_and_finished_times(self):
        started = timezone.now()
        job = FormulaJob(started_at=started, finished_at=started + timedelta(milliseconds=1250))

        self.assertEqual(job.calculate_duration_ms(), 1250)
