from django.utils import timezone

MODEL_STATUS_KEY = "formula_lab:model:status"
MODEL_MESSAGE_KEY = "formula_lab:model:message"
MODEL_LAST_WARMUP_KEY = "formula_lab:model:last_warmup_at"
MODEL_LAST_ERROR_KEY = "formula_lab:model:last_error"
WORKER_HEARTBEAT_KEY = "formula_lab:worker:heartbeat"

SUCCESS_STATUSES = {"ready", "warmed", "success", "succeeded"}
ERROR_STATUSES = {"error", "failed", "failure"}


def _decode(value):
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def set_model_status(redis_client, status, message):
    timestamp = timezone.now().isoformat()
    normalized_status = str(status).lower()

    redis_client.set(MODEL_STATUS_KEY, status)
    redis_client.set(MODEL_MESSAGE_KEY, message)

    if normalized_status in SUCCESS_STATUSES:
        redis_client.set(MODEL_LAST_WARMUP_KEY, timestamp)
    if normalized_status in ERROR_STATUSES:
        redis_client.set(MODEL_LAST_ERROR_KEY, timestamp)

    return timestamp


def get_model_status(redis_client):
    return {
        "status": _decode(redis_client.get(MODEL_STATUS_KEY)),
        "message": _decode(redis_client.get(MODEL_MESSAGE_KEY)),
        "last_warmup_at": _decode(redis_client.get(MODEL_LAST_WARMUP_KEY)),
        "last_error": _decode(redis_client.get(MODEL_LAST_ERROR_KEY)),
    }


def write_worker_heartbeat(redis_client):
    timestamp = timezone.now().isoformat()
    redis_client.set(WORKER_HEARTBEAT_KEY, timestamp)
    return timestamp


def get_worker_heartbeat(redis_client):
    return _decode(redis_client.get(WORKER_HEARTBEAT_KEY))
