import logging

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from apps.formulas.services.health import build_health_snapshot
from apps.formulas.tasks import warmup_model_task

logger = logging.getLogger(__name__)


def _safe_health_snapshot() -> dict:
    try:
        return build_health_snapshot()
    except Exception:
        logger.exception("Unable to build formula lab health snapshot")
        return {
            "web": {"ok": True},
            "database": {"ok": False, "error": "health snapshot unavailable"},
            "redis": {"ok": False, "error": "health snapshot unavailable"},
            "worker": {"ok": False, "heartbeat_at": None, "error": "health snapshot unavailable"},
            "model": {"ok": False, "status": None, "state": "error", "message": "health snapshot unavailable"},
            "media": {"ok": False, "error": "health snapshot unavailable"},
            "queues": {"queued": 0, "running": 0, "succeeded": 0, "failed": 0, "total": 0},
            "last_job": None,
        }


def system_page(request):
    return render(request, "formulas/system.html", {"health_snapshot": _safe_health_snapshot()})


def health_api(request):
    return JsonResponse(build_health_snapshot())


@require_POST
def warmup_api(request):
    try:
        warmup_model_task.delay()
    except Exception:
        logger.exception("Unable to queue model warmup task")
        return JsonResponse({"status": "unavailable", "error": "warmup broker unavailable"}, status=503)
    return JsonResponse({"status": "queued"})
