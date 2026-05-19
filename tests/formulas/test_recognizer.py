import importlib
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import ModuleType
from unittest.mock import patch

from django.test import SimpleTestCase, TestCase, override_settings
from PIL import Image

from apps.formulas.models import FormulaJob
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
                calls.append(image_path)
                return f"latex:{Path(image_path).name}"

        fake_cli.LatexOCR = FakeLatexOCR

        with patch.dict(sys.modules, {"pix2tex": ModuleType("pix2tex"), "pix2tex.cli": fake_cli}):
            module = importlib.import_module("apps.formulas.services.pix2tex_engine")
            module = importlib.reload(module)

            first = module.Pix2TexEngine().recognize("/tmp/first.png")
            second = module.Pix2TexEngine().recognize("/tmp/second.png")

        self.assertEqual(first, "latex:first.png")
        self.assertEqual(second, "latex:second.png")
        self.assertEqual(load_count, 1)
        self.assertEqual(calls, ["/tmp/first.png", "/tmp/second.png"])


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

        with patch("apps.formulas.services.recognizer.Pix2TexEngine") as engine_class:
            engine_class.return_value.recognize.return_value = "$$  x   +   y  $$"

            result = recognize_formula(job)

        job.refresh_from_db()
        self.assertEqual(result, "x + y")
        self.assertTrue(job.preprocessed_image.name.startswith("formula_preprocessed/"))
        preprocessed_path = self.media_root / job.preprocessed_image.name
        self.assertTrue(preprocessed_path.exists())
        engine_class.return_value.recognize.assert_called_once_with(str(preprocessed_path))

    def test_prepare_formula_image_only_preprocesses_and_updates_job(self):
        source = self.media_root / "formula_uploads" / "source.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (24, 12), (255, 255, 255)).save(source)
        job = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        preprocessed_path = prepare_formula_image(job)

        job.refresh_from_db()
        self.assertTrue(preprocessed_path.exists())
        self.assertEqual(job.preprocessed_image.name, preprocessed_path.relative_to(self.media_root).as_posix())
