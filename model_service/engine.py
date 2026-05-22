import time
from threading import Lock

from django.conf import settings

from apps.formulas.services.ocr_engines import get_formula_engine


_STATE_LOCK = Lock()
_STATUS = "unknown"
_ERROR_MESSAGE = ""


def current_model_info() -> dict[str, str]:
    engine = get_formula_engine()
    return {
        "engine": engine.name,
        "model": _model_name(engine),
        "device": getattr(settings, "FORMULA_LAB_PADDLE_DEVICE", "cpu"),
    }


def health_snapshot() -> dict[str, str]:
    snapshot = current_model_info()
    snapshot["status"] = _STATUS
    if _ERROR_MESSAGE:
        snapshot["error"] = _ERROR_MESSAGE
    return snapshot


def warmup_model() -> dict[str, str]:
    global _ERROR_MESSAGE, _STATUS

    with _STATE_LOCK:
        if _STATUS == "ready":
            return health_snapshot()

        _STATUS = "warming"
        _ERROR_MESSAGE = ""
        try:
            engine = get_formula_engine()
            engine.warmup()
        except Exception as exc:
            _STATUS = "error"
            _ERROR_MESSAGE = str(exc) or exc.__class__.__name__
            raise

        _STATUS = "ready"
        _ERROR_MESSAGE = ""
        return {
            "status": "ready",
            "engine": engine.name,
            "model": _model_name(engine),
            "device": getattr(settings, "FORMULA_LAB_PADDLE_DEVICE", "cpu"),
        }


def reset_health_state_for_tests() -> None:
    global _ERROR_MESSAGE, _STATUS

    with _STATE_LOCK:
        _STATUS = "unknown"
        _ERROR_MESSAGE = ""


def recognize_image(image_path: str) -> dict[str, object]:
    global _ERROR_MESSAGE, _STATUS

    start = time.perf_counter()
    engine = get_formula_engine()
    try:
        latex = engine.recognize(image_path)
    except Exception as exc:
        _STATUS = "error"
        _ERROR_MESSAGE = str(exc) or exc.__class__.__name__
        raise

    _STATUS = "ready"
    _ERROR_MESSAGE = ""
    duration_ms = int((time.perf_counter() - start) * 1000)
    return {
        "latex": latex,
        "engine": engine.name,
        "model": _model_name(engine),
        "duration_ms": duration_ms,
        "confidence": None,
    }


def _model_name(engine) -> str:
    return getattr(engine, "model_name", engine.name)
