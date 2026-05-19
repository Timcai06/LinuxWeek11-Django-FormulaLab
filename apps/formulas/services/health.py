from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.db import connection

from apps.formulas.models import FormulaJob
from apps.formulas.services.model_state import SUCCESS_STATUSES, get_model_status, get_worker_heartbeat
from apps.formulas.services.telemetry import get_redis_client


def _error_message(exc):
    return str(exc) or exc.__class__.__name__


def _iso_or_none(value):
    return value.isoformat() if value else None


def _check_database():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": _error_message(exc)}


def _check_redis(redis_client):
    if redis_client is None:
        return {"ok": False, "error": "Redis client unavailable"}
    try:
        return {"ok": bool(redis_client.ping())}
    except Exception as exc:
        return {"ok": False, "error": _error_message(exc)}


def _check_worker(redis_client):
    if redis_client is None:
        return {"ok": False, "heartbeat_at": None, "error": "Redis client unavailable"}
    try:
        heartbeat_at = get_worker_heartbeat(redis_client)
        return {"ok": bool(heartbeat_at), "heartbeat_at": heartbeat_at}
    except Exception as exc:
        return {"ok": False, "heartbeat_at": None, "error": _error_message(exc)}


def _check_model(redis_client):
    if redis_client is None:
        return {
            "ok": False,
            "status": None,
            "message": None,
            "last_warmup_at": None,
            "last_error": None,
            "error": "Redis client unavailable",
        }
    try:
        model = get_model_status(redis_client)
        model["ok"] = (model.get("status") or "").lower() in SUCCESS_STATUSES
        return model
    except Exception as exc:
        return {
            "ok": False,
            "status": None,
            "message": None,
            "last_warmup_at": None,
            "last_error": None,
            "error": _error_message(exc),
        }


def _check_media():
    probe_path = None
    try:
        media_root = Path(settings.MEDIA_ROOT)
        media_root.mkdir(parents=True, exist_ok=True)
        probe_path = media_root / f".formula_lab_health_probe_{uuid4().hex}"
        probe_path.write_text("ok", encoding="utf-8")
        probe_path.unlink()
        return {"ok": True, "root": str(media_root)}
    except Exception as exc:
        if probe_path and probe_path.exists():
            try:
                probe_path.unlink()
            except OSError:
                pass
        return {"ok": False, "root": str(settings.MEDIA_ROOT), "error": _error_message(exc)}


def _queue_counts():
    try:
        return {
            "queued": FormulaJob.objects.filter(status=FormulaJob.Status.QUEUED).count(),
            "running": FormulaJob.objects.filter(status=FormulaJob.Status.RUNNING).count(),
            "succeeded": FormulaJob.objects.filter(status=FormulaJob.Status.SUCCEEDED).count(),
            "failed": FormulaJob.objects.filter(status=FormulaJob.Status.FAILED).count(),
            "total": FormulaJob.objects.count(),
        }
    except Exception as exc:
        return {
            "queued": 0,
            "running": 0,
            "succeeded": 0,
            "failed": 0,
            "total": 0,
            "error": _error_message(exc),
        }


def _last_job():
    try:
        job = FormulaJob.objects.order_by("-created_at").first()
        if job is None:
            return None
        return {
            "id": str(job.id),
            "status": job.status,
            "stage_code": job.stage_code,
            "stage_label": job.stage_label,
            "created_at": _iso_or_none(job.created_at),
            "started_at": _iso_or_none(job.started_at),
            "finished_at": _iso_or_none(job.finished_at),
            "duration_ms": job.duration_ms,
        }
    except Exception as exc:
        return {"error": _error_message(exc)}


def build_health_snapshot():
    redis_client = None
    redis_client_error = None
    try:
        redis_client = get_redis_client()
    except Exception as exc:
        redis_client_error = _error_message(exc)

    redis_status = _check_redis(redis_client)
    if redis_client_error:
        redis_status = {"ok": False, "error": redis_client_error}

    return {
        "web": {"ok": True},
        "database": _check_database(),
        "redis": redis_status,
        "worker": _check_worker(redis_client),
        "model": _check_model(redis_client),
        "media": _check_media(),
        "queues": _queue_counts(),
        "last_job": _last_job(),
    }
