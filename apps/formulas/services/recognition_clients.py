from django.conf import settings

from apps.formulas.services.model_api_client import ModelApiRecognitionClient
from apps.formulas.services.ocr_engines import get_formula_engine
from apps.formulas.services.recognition_types import RecognitionResult


class LocalRecognitionClient:
    name = "local"

    @property
    def engine_name(self) -> str:
        return get_formula_engine().name

    def recognize(self, image_path: str) -> RecognitionResult:
        engine = get_formula_engine()
        latex = engine.recognize(image_path)
        return RecognitionResult(
            latex=latex,
            engine=engine.name,
            model=getattr(engine, "model_name", engine.name),
            duration_ms=None,
            confidence=None,
        )

    def warmup(self) -> dict:
        engine = get_formula_engine()
        engine.warmup()
        return {"status": "ready", "engine": engine.name, "model": getattr(engine, "model_name", engine.name)}


def get_recognition_client():
    backend = settings.FORMULA_LAB_RECOGNITION_BACKEND
    if backend == "local":
        return LocalRecognitionClient()
    if backend == "http":
        return ModelApiRecognitionClient(
            base_url=settings.FORMULA_LAB_MODEL_API_URL,
            timeout_seconds=settings.FORMULA_LAB_MODEL_API_TIMEOUT_SECONDS,
        )
    raise ValueError(f"Unsupported recognition backend: {backend}")
