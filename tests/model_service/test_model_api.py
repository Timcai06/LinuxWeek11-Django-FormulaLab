from pathlib import Path
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
from fastapi.testclient import TestClient

from model_service.main import app


class ModelApiTests(SimpleTestCase):
    @override_settings(FORMULA_LAB_OCR_ENGINE="pix2tex")
    def test_engine_metadata_uses_engine_name_when_model_name_is_unavailable(self):
        from apps.formulas.services import ocr_engines
        from model_service.engine import current_model_info

        ocr_engines._ENGINE_CACHE.clear()
        self.addCleanup(ocr_engines._ENGINE_CACHE.clear)

        self.assertEqual(current_model_info()["model"], "pix2tex")

    def test_health_endpoint_reports_unready_state_with_503(self):
        with patch("model_service.engine.health_snapshot") as health_snapshot:
            health_snapshot.return_value = {
                "status": "unknown",
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "device": "cpu",
            }

            response = TestClient(app).get("/health")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "unknown")

    def test_health_endpoint_reports_ready_state_with_200(self):
        with patch("model_service.engine.health_snapshot") as health_snapshot:
            health_snapshot.return_value = {
                "status": "ready",
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "device": "cpu",
            }

            response = TestClient(app).get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ready",
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "device": "cpu",
            },
        )

    def test_models_current_endpoint_reports_engine_metadata(self):
        with patch("model_service.engine.current_model_info") as current_model_info:
            current_model_info.return_value = {
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "device": "cpu",
            }

            response = TestClient(app).get("/models/current")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["engine"], "paddle")
        self.assertEqual(response.json()["model"], "PP-FormulaNet_plus-S")

    def test_warmup_endpoint_calls_engine_warmup(self):
        with patch("model_service.engine.warmup_model") as warmup_model:
            warmup_model.return_value = {
                "status": "ready",
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "device": "cpu",
            }

            response = TestClient(app).post("/warmup")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ready")
        warmup_model.assert_called_once_with()

    def test_warmup_endpoint_returns_structured_error(self):
        with patch("model_service.engine.warmup_model", side_effect=RuntimeError("download failed")):
            response = TestClient(app).post("/warmup")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"], "download failed")
        self.assertEqual(response.json()["code"], "MODEL_WARMUP_FAILED")

    def test_recognize_endpoint_saves_upload_to_temp_file_and_returns_latex(self):
        seen_paths = []

        def recognize_image(image_path: str):
            seen_paths.append(Path(image_path))
            return {
                "latex": r"\frac{a}{b}",
                "engine": "paddle",
                "model": "PP-FormulaNet_plus-S",
                "duration_ms": 42,
                "confidence": None,
            }

        with patch("model_service.engine.recognize_image", side_effect=recognize_image):
            response = TestClient(app).post(
                "/v1/formula/recognize",
                files={"image": ("formula.png", b"fake image bytes", "image/png")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["latex"], r"\frac{a}{b}")
        self.assertEqual(response.json()["duration_ms"], 42)
        self.assertEqual(len(seen_paths), 1)
        self.assertEqual(seen_paths[0].suffix, ".png")

    def test_recognize_endpoint_returns_readable_error(self):
        with patch("model_service.engine.recognize_image", side_effect=RuntimeError("model failed")):
            response = TestClient(app).post(
                "/v1/formula/recognize",
                files={"image": ("formula.png", b"fake image bytes", "image/png")},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"], "model failed")
        self.assertEqual(response.json()["code"], "MODEL_INFERENCE_FAILED")
