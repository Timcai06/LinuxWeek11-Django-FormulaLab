import logging

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from apps.formulas.models import FormulaJob
from apps.formulas.services.health import build_health_snapshot
from apps.formulas.services.queue_control import pause_recognition_queue, resume_recognition_queue
from apps.formulas.services.telemetry import get_redis_client
from apps.formulas.tasks import run_formula_job, warmup_model_task

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
            "queues": {"queued": 0, "running": 0, "succeeded": 0, "failed": 0, "total": 0, "paused": False},
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


@require_POST
def pause_queue_api(request):
    pause_recognition_queue(get_redis_client())
    return JsonResponse({"status": "paused", "paused": True})


@require_POST
def resume_queue_api(request):
    resume_recognition_queue(get_redis_client())
    dispatched = 0
    try:
        for job_id in FormulaJob.objects.filter(status=FormulaJob.Status.QUEUED).values_list("id", flat=True):
            run_formula_job.delay(str(job_id))
            dispatched += 1
    except Exception:
        logger.exception("Unable to resume recognition queue")
        return JsonResponse(
            {"status": "unavailable", "error": "resume broker unavailable", "dispatched": dispatched},
            status=503,
        )
    return JsonResponse({"status": "resumed", "paused": False, "dispatched": dispatched})
