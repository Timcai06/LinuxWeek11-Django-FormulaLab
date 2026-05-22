from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase, override_settings
from PIL import Image

from apps.formulas.models import FormulaJob
from apps.formulas.services.recognizer import recognize_formula


class RecognitionClientFactoryTests(SimpleTestCase):
    @override_settings(FORMULA_LAB_RECOGNITION_BACKEND="local")
    def test_get_local_recognition_client(self):
        from apps.formulas.services.recognition_clients import get_recognition_client

        client = get_recognition_client()

        self.assertEqual(client.name, "local")

    @override_settings(
        FORMULA_LAB_RECOGNITION_BACKEND="http",
        FORMULA_LAB_MODEL_API_URL="http://model-api:9000",
        FORMULA_LAB_MODEL_API_TIMEOUT_SECONDS=30,
    )
    def test_get_http_recognition_client(self):
        from apps.formulas.services.recognition_clients import get_recognition_client

        client = get_recognition_client()

        self.assertEqual(client.name, "http")
        self.assertEqual(client.base_url, "http://model-api:9000")
        self.assertEqual(client.timeout_seconds, 30)

    @override_settings(FORMULA_LAB_RECOGNITION_BACKEND="missing")
    def test_get_recognition_client_rejects_unknown_backend(self):
        from apps.formulas.services.recognition_clients import get_recognition_client

        with self.assertRaisesMessage(ValueError, "Unsupported recognition backend"):
            get_recognition_client()


@override_settings(FORMULA_LAB_MAX_IMAGE_SIDE=1600)
class RecognizerClientIntegrationTests(TestCase):
    def setUp(self):
        self.media_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_context.name))
        self.settings_context.enable()
        self.media_root = Path(self.media_context.name)

    def tearDown(self):
        self.settings_context.disable()
        self.media_context.cleanup()

    def test_recognize_formula_uses_recognition_client_and_saves_engine_name(self):
        from apps.formulas.services.recognition_types import RecognitionResult

        source = self.media_root / "formula_uploads" / "source.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (24, 12), (255, 255, 255)).save(source)
        job = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        client = Mock()
        client.recognize.return_value = RecognitionResult(
            latex="$$  x   +   y  $$",
            engine="paddle",
            model="PP-FormulaNet_plus-S",
            duration_ms=900,
            confidence=None,
        )

        with patch("apps.formulas.services.recognizer.get_recognition_client", return_value=client):
            result = recognize_formula(job)

        job.refresh_from_db()
        self.assertEqual(result, "x + y")
        self.assertEqual(job.engine_name, "paddle")
        self.assertTrue(job.preprocessed_image.name.startswith("formula_preprocessed/"))
        preprocessed_path = self.media_root / job.preprocessed_image.name
        client.recognize.assert_called_once_with(str(preprocessed_path))
