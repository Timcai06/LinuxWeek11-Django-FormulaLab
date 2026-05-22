import os
from pathlib import Path
from threading import Lock

from django.conf import settings


_CACHED_MODEL = None
_MODEL_LOCK = Lock()


class PaddleFormulaEngine:
    name = "paddle"

    @property
    def model_name(self) -> str:
        return settings.FORMULA_LAB_PADDLE_MODEL_NAME

    def warmup(self) -> None:
        self._load_model()

    def recognize(self, image_path: str) -> str:
        model = self._load_model()
        results = model.predict(input=image_path, batch_size=1)
        return _extract_formula(results)

    def _load_model(self):
        global _CACHED_MODEL

        if _CACHED_MODEL is not None:
            return _CACHED_MODEL

        with _MODEL_LOCK:
            if _CACHED_MODEL is None:
                _configure_paddle_runtime()

                from paddleocr import FormulaRecognition

                _CACHED_MODEL = FormulaRecognition(
                    model_name=settings.FORMULA_LAB_PADDLE_MODEL_NAME,
                    device=settings.FORMULA_LAB_PADDLE_DEVICE,
                )
        return _CACHED_MODEL


def _configure_paddle_runtime() -> None:
    cache_home = Path(settings.FORMULA_LAB_PADDLE_CACHE_HOME)
    cache_home.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", str(cache_home))
    os.environ.setdefault("PADDLE_PDX_MODEL_SOURCE", settings.FORMULA_LAB_PADDLE_MODEL_SOURCE)
    os.environ.setdefault(
        "PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK",
        settings.FORMULA_LAB_PADDLE_DISABLE_SOURCE_CHECK,
    )


def _extract_formula(results) -> str:
    for result in results:
        formula = _find_formula(result)
        if formula:
            return formula
    raise ValueError("PaddleOCR returned no formula text")


def _find_formula(value) -> str:
    if isinstance(value, str):
        return value.strip()

    if isinstance(value, dict):
        for key in ("rec_formula", "latex", "formula", "text"):
            candidate = value.get(key)
            formula = _find_formula(candidate)
            if formula:
                return formula
        for candidate in value.values():
            formula = _find_formula(candidate)
            if formula:
                return formula
        return ""

    if isinstance(value, (list, tuple)):
        for candidate in value:
            formula = _find_formula(candidate)
            if formula:
                return formula
        return ""

    result_json = getattr(value, "json", None)
    if result_json is not None:
        formula = _find_formula(result_json)
        if formula:
            return formula

    result_res = getattr(value, "res", None)
    if result_res is not None:
        formula = _find_formula(result_res)
        if formula:
            return formula

    return ""
