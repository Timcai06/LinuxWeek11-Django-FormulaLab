from datetime import timedelta
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from apps.formulas.models import BatchMission, FormulaItem, FormulaItemVersion, FormulaJob, PaperProject


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


class ProductCoreModelTests(TestCase):
    def test_product_core_models_generate_human_readable_codes(self):
        project = PaperProject.objects.create(name="Hormuz pricing paper")
        batch = BatchMission.objects.create(project=project, title="Chapter 3 formulas")
        item = FormulaItem.objects.create(project=project, batch=batch, latex_current=r"E=mc^2")
        today = timezone.localdate().strftime("%Y%m%d")

        self.assertRegex(project.project_code, rf"^FP-{today}-\d{{4}}$")
        self.assertRegex(batch.batch_code, rf"^FB-{today}-\d{{4}}$")
        self.assertRegex(item.formula_code, rf"^FF-{today}-\d{{4}}$")

    def test_generated_codes_retry_after_unique_collision(self):
        PaperProject.objects.create(project_code="FP-20990101-0001", name="Existing paper")

        with patch(
            "apps.formulas.models._next_dated_code",
            side_effect=["FP-20990101-0001", "FP-20990101-0002"],
        ):
            project = PaperProject.objects.create(name="Concurrent paper")

        self.assertEqual(project.project_code, "FP-20990101-0002")

    def test_product_core_hierarchy_relations_are_addressable(self):
        project = PaperProject.objects.create(name="Paper workspace")
        batch = BatchMission.objects.create(project=project, title="Batch one")
        item = FormulaItem.objects.create(project=project, batch=batch, sort_order=2)

        self.assertEqual(project.batches.get(), batch)
        self.assertEqual(project.formula_items.get(), item)
        self.assertEqual(batch.formula_items.get(), item)

    def test_formula_item_defaults_to_review_queue_with_isolated_flags(self):
        project = PaperProject.objects.create(name="Review defaults")
        batch = BatchMission.objects.create(project=project)
        first = FormulaItem.objects.create(project=project, batch=batch)
        second = FormulaItem.objects.create(project=project, batch=batch)

        first.quality_flags.append("low_contrast")

        self.assertEqual(first.status, FormulaItem.Status.NEEDS_REVIEW)
        self.assertEqual(first.quality_score, 0)
        self.assertEqual(second.quality_flags, [])

    def test_formula_item_versions_are_ordered_with_latest_first(self):
        project = PaperProject.objects.create(name="Versioned formula")
        batch = BatchMission.objects.create(project=project)
        item = FormulaItem.objects.create(project=project, batch=batch, latex_current=r"\alpha")

        first = FormulaItemVersion.objects.create(
            item=item,
            latex=r"\alpha",
            source=FormulaItemVersion.Source.OCR,
            created_by_label="paddle",
        )
        second = FormulaItemVersion.objects.create(
            item=item,
            latex=r"\alpha+\beta",
            source=FormulaItemVersion.Source.MANUAL,
            created_by_label="reviewer",
        )

        self.assertEqual(list(item.versions.all()), [second, first])
        self.assertEqual(str(second), f"{item.formula_code} manual")

    def test_formula_job_can_optionally_attach_to_project_and_batch(self):
        project = PaperProject.objects.create(name="Attached OCR flow")
        batch = BatchMission.objects.create(project=project)
        job = FormulaJob.objects.create(
            original_image=tiny_png("attached.png"),
            project=project,
            batch=batch,
        )

        self.assertEqual(job.project, project)
        self.assertEqual(job.batch, batch)
        self.assertEqual(project.formula_jobs.get(), job)
        self.assertEqual(batch.formula_jobs.get(), job)

    def test_formula_job_inherits_project_from_batch_when_missing(self):
        project = PaperProject.objects.create(name="Batch inferred project")
        batch = BatchMission.objects.create(project=project)

        job = FormulaJob.objects.create(original_image=tiny_png("batch-only.png"), batch=batch)

        self.assertEqual(job.project, project)

    def test_formula_job_rejects_batch_from_another_project(self):
        project = PaperProject.objects.create(name="Project A")
        other_project = PaperProject.objects.create(name="Project B")
        other_batch = BatchMission.objects.create(project=other_project)

        with self.assertRaises(ValidationError):
            FormulaJob.objects.create(
                original_image=tiny_png("mismatch.png"),
                project=project,
                batch=other_batch,
            )

    def test_formula_item_rejects_batch_from_another_project(self):
        project = PaperProject.objects.create(name="Item project A")
        other_project = PaperProject.objects.create(name="Item project B")
        other_batch = BatchMission.objects.create(project=other_project)

        with self.assertRaises(ValidationError):
            FormulaItem.objects.create(project=project, batch=other_batch)
