from django.conf import settings

from apps.formulas.services.pix2tex_engine import Pix2TexEngine


_ENGINE_CACHE = {}


def get_formula_engine():
    engine_name = getattr(settings, "FORMULA_LAB_OCR_ENGINE", "pix2tex").strip().lower()
    if engine_name not in _ENGINE_CACHE:
        _ENGINE_CACHE[engine_name] = _create_engine(engine_name)
    return _ENGINE_CACHE[engine_name]


def _create_engine(engine_name: str):
    if engine_name == "pix2tex":
        return Pix2TexEngine()
    if engine_name == "paddle":
        from apps.formulas.services.paddle_formula_engine import PaddleFormulaEngine

        return PaddleFormulaEngine()
    raise ValueError(f"Unsupported formula OCR engine: {engine_name}")
