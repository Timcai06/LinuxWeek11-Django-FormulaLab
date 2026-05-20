import importlib
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import ModuleType
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase, override_settings
from PIL import Image

from apps.formulas.models import FormulaJob
from apps.formulas.services.paddle_formula_engine import _extract_formula
from apps.formulas.services.recognizer import prepare_formula_image, recognize_formula


class Pix2TexEngineTests(SimpleTestCase):
    def test_module_import_does_not_import_pix2tex(self):
        sys.modules.pop("apps.formulas.services.pix2tex_engine", None)
        real_import = __import__

        def guarded_import(name, *args, **kwargs):
            if name.startswith("pix2tex"):
                raise AssertionError("pix2tex must not be imported at Django import time")
            return real_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=guarded_import):
            importlib.import_module("apps.formulas.services.pix2tex_engine")

    def test_recognize_lazily_loads_and_caches_latex_ocr(self):
        fake_cli = ModuleType("pix2tex.cli")
        load_count = 0
        calls = []

        class FakeLatexOCR:
            def __init__(self):
                nonlocal load_count
                load_count += 1

            def __call__(self, image_path):
                calls.append(image_path.copy())
                return f"latex:{image_path.size[0]}x{image_path.size[1]}"

        fake_cli.LatexOCR = FakeLatexOCR

        with patch.dict(sys.modules, {"pix2tex": ModuleType("pix2tex"), "pix2tex.cli": fake_cli}):
            module = importlib.import_module("apps.formulas.services.pix2tex_engine")
            module = importlib.reload(module)

            first_image = self.create_temp_image("first.png", (14, 7))
            second_image = self.create_temp_image("second.png", (18, 9))

            first = module.Pix2TexEngine().recognize(str(first_image))
            second = module.Pix2TexEngine().recognize(str(second_image))

        self.assertEqual(first, "latex:14x7")
        self.assertEqual(second, "latex:18x9")
        self.assertEqual(load_count, 1)
        self.assertEqual([image.size for image in calls], [(14, 7), (18, 9)])

    def create_temp_image(self, name, size):
        if not hasattr(self, "_temp_context"):
            self._temp_context = TemporaryDirectory()
            self.addCleanup(self._temp_context.cleanup)
        path = Path(self._temp_context.name) / name
        Image.new("RGB", size, (255, 255, 255)).save(path)
        return path


class OcrEngineTests(SimpleTestCase):
    def tearDown(self):
        from apps.formulas.services import ocr_engines

        ocr_engines._ENGINE_CACHE.clear()

    def test_factory_defaults_to_pix2tex(self):
        from apps.formulas.services.ocr_engines import get_formula_engine

        engine = get_formula_engine()

        self.assertEqual(engine.name, "pix2tex")

    @override_settings(FORMULA_LAB_OCR_ENGINE="paddle")
    def test_factory_can_select_paddle_without_importing_pix2tex_model(self):
        fake_engine_class = Mock()
        fake_engine_class.return_value.name = "paddle"

        with patch("apps.formulas.services.paddle_formula_engine.PaddleFormulaEngine", fake_engine_class):
            from apps.formulas.services.ocr_engines import get_formula_engine

            engine = get_formula_engine()

        self.assertEqual(engine.name, "paddle")
        fake_engine_class.assert_called_once_with()

    @override_settings(FORMULA_LAB_OCR_ENGINE="missing")
    def test_factory_rejects_unknown_engine(self):
        from apps.formulas.services.ocr_engines import get_formula_engine

        with self.assertRaisesMessage(ValueError, "Unsupported formula OCR engine"):
            get_formula_engine()

    def test_paddle_formula_result_extracts_rec_formula(self):
        result = SimpleResult({"res": {"rec_formula": r"\int_a^b f(x)\,dx"}})

        self.assertEqual(_extract_formula([result]), r"\int_a^b f(x)\,dx")


class SimpleResult:
    def __init__(self, value):
        self.json = value


@override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
class RecognizerTests(TestCase):
    def setUp(self):
        self.media_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_context.name))
        self.settings_context.enable()
        self.media_root = Path(self.media_context.name)

    def tearDown(self):
        self.settings_context.disable()
        self.media_context.cleanup()

    def test_recognize_formula_preprocesses_image_updates_job_and_normalizes_latex(self):
        source = self.media_root / "formula_uploads" / "source.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (24, 12), (255, 255, 255)).save(source)
        job = FormulaJob.objects.create(original_image="formula_uploads/source.png")
        engine = Mock()
        engine.name = "pix2tex"
        engine.recognize.return_value = "$$  x   +   y  $$"

        with patch("apps.formulas.services.recognizer.get_formula_engine", return_value=engine):
            result = recognize_formula(job)

        job.refresh_from_db()
        self.assertEqual(result, "x + y")
        self.assertEqual(job.engine_name, "pix2tex")
        self.assertTrue(job.preprocessed_image.name.startswith("formula_preprocessed/"))
        preprocessed_path = self.media_root / job.preprocessed_image.name
        self.assertTrue(preprocessed_path.exists())
        engine.recognize.assert_called_once_with(str(preprocessed_path))

    def test_prepare_formula_image_only_preprocesses_and_updates_job(self):
        source = self.media_root / "formula_uploads" / "source.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (24, 12), (255, 255, 255)).save(source)
        job = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        preprocessed_path = prepare_formula_image(job)

        job.refresh_from_db()
        self.assertTrue(preprocessed_path.exists())
        self.assertEqual(job.preprocessed_image.name, preprocessed_path.relative_to(self.media_root).as_posix())
