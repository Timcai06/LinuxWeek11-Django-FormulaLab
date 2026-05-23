from apps.formulas.services.telemetry import get_redis_client


RECOGNITION_QUEUE_PAUSED_KEY = "formula_lab:queue:recognition_paused"


def _decode(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def is_recognition_queue_paused(redis_client=None) -> bool:
    try:
        client = redis_client or get_redis_client()
        value = _decode(client.get(RECOGNITION_QUEUE_PAUSED_KEY))
    except Exception:
        return False
    return str(value or "").lower() in {"1", "true", "yes", "paused"}


def pause_recognition_queue(redis_client=None) -> None:
    client = redis_client or get_redis_client()
    client.set(RECOGNITION_QUEUE_PAUSED_KEY, "1")


def resume_recognition_queue(redis_client=None) -> None:
    client = redis_client or get_redis_client()
    client.delete(RECOGNITION_QUEUE_PAUSED_KEY)
