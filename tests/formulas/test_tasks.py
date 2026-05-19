from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import TestCase, override_settings
from PIL import Image

from apps.formulas.models import FormulaJob
from apps.formulas.services.model_state import MODEL_MESSAGE_KEY, MODEL_STATUS_KEY
from apps.formulas.tasks import run_formula_job, warmup_model_task


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.calls = []

    def set(self, key, value, **kwargs):
        self.values[key] = value
        self.calls.append((key, value, kwargs))


@override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
class FormulaTaskTests(TestCase):
    def setUp(self):
        self.media_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_context.name))
        self.settings_context.enable()
        self.media_root = Path(self.media_context.name)

    def tearDown(self):
        self.settings_context.disable()
        self.media_context.cleanup()

    def create_job(self):
        source = self.media_root / "formula_uploads" / "source.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (20, 10), (255, 255, 255)).save(source)
        return FormulaJob.objects.create(original_image="formula_uploads/source.png")

    def test_warmup_model_task_sets_warming_then_ready(self):
        redis_client = FakeRedis()

        with (
            patch("apps.formulas.tasks.get_redis_client", return_value=redis_client),
            patch("apps.formulas.tasks.Pix2TexEngine") as engine_class,
        ):
            result = warmup_model_task.run()

        engine_class.return_value.warmup.assert_called_once_with()
        status_writes = [call for call in redis_client.calls if call[0] == MODEL_STATUS_KEY]
        self.assertEqual([call[1] for call in status_writes], ["warming", "ready"])
        self.assertEqual(redis_client.values[MODEL_MESSAGE_KEY], "pix2tex model ready")
        self.assertEqual(result["status"], "ready")

    def test_run_formula_job_success_updates_stage_sequence_and_result_fields(self):
        job = self.create_job()
        stage_codes = []
        original_mark_stage = FormulaJob.mark_stage

        def record_stage(instance, code, label, message, progress):
            stage_codes.append(code)
            return original_mark_stage(instance, code, label, message, progress)

        with (
            patch.object(FormulaJob, "mark_stage", autospec=True, side_effect=record_stage),
            patch("apps.formulas.tasks.Pix2TexEngine") as engine_class,
            patch("apps.formulas.tasks.recognize_formula", return_value="a + b"),
        ):
            run_formula_job.run(str(job.id))

        job.refresh_from_db()
        engine_class.return_value.warmup.assert_called_once_with()
        self.assertEqual(
            stage_codes,
            ["QUEUED", "MODEL_WARMUP", "IMAGE_PREPROCESS", "INFERENCE", "LATEX_POSTPROCESS", "RESULT_READY"],
        )
        self.assertEqual(job.status, FormulaJob.Status.SUCCEEDED)
        self.assertEqual(job.progress, 100)
        self.assertEqual(job.stage_code, "RESULT_READY")
        self.assertEqual(job.latex_result, "a + b")
        self.assertIsNotNone(job.started_at)
        self.assertIsNotNone(job.finished_at)
        self.assertIsNotNone(job.duration_ms)

    def test_run_formula_job_failure_records_failure_fields_without_raising_success(self):
        job = self.create_job()
        long_detail = "boom " * 1200

        with (
            patch("apps.formulas.tasks.Pix2TexEngine"),
            patch("apps.formulas.tasks.recognize_formula", side_effect=RuntimeError(long_detail)),
        ):
            result = run_formula_job.run(str(job.id))

        job.refresh_from_db()
        self.assertIsNone(result)
        self.assertEqual(job.status, FormulaJob.Status.FAILED)
        self.assertEqual(job.failure_stage, "IMAGE_PREPROCESS")
        self.assertEqual(job.error_message, long_detail[:255])
        self.assertLessEqual(len(job.error_detail), 4000)
        self.assertIn("RuntimeError", job.error_detail)
        self.assertIsNotNone(job.finished_at)
        self.assertIsNotNone(job.duration_ms)
