import logging

from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.formulas.forms import FormulaUploadForm
from apps.formulas.models import FormulaJob
from apps.formulas.services.health import build_health_snapshot
from apps.formulas.tasks import run_formula_job, warmup_model_task

logger = logging.getLogger(__name__)


def _temporary_page(name: str) -> HttpResponse:
    return HttpResponse(f"Temporary Formula Lab placeholder: {name}")


def landing(request):
    return _temporary_page("landing")


def workbench(request):
    response = _temporary_page("workbench")
    response.context_data = {"form": FormulaUploadForm()}
    return response


@require_POST
def create_job(request):
    form = FormulaUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        return JsonResponse({"status": "invalid", "errors": form.errors}, status=400)

    job = FormulaJob.objects.create(original_image=form.cleaned_data["image"])
    try:
        run_formula_job.delay(str(job.id))
    except Exception:
        logger.exception("Unable to queue formula job %s", job.id)
        _mark_dispatch_failed(job, "DISPATCH")
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=job.id)


def mission_progress(request, job_id):
    get_object_or_404(FormulaJob, id=job_id)
    return _temporary_page(f"mission-progress:{job_id}")


def mission_report(request, job_id):
    get_object_or_404(FormulaJob, id=job_id)
    return _temporary_page(f"mission-report:{job_id}")


@require_POST
def retry_mission(request, job_id):
    old_job = get_object_or_404(FormulaJob, id=job_id)
    if old_job.status != FormulaJob.Status.FAILED:
        return JsonResponse({"status": "rejected", "error": "only failed missions can be retried"}, status=409)

    new_job = FormulaJob.objects.create(original_image=old_job.original_image, retry_of=old_job)
    try:
        run_formula_job.delay(str(new_job.id))
    except Exception:
        logger.exception("Unable to queue retry formula job %s from %s", new_job.id, old_job.id)
        _mark_dispatch_failed(new_job, "RETRY_DISPATCH")
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=new_job.id)


def history(request):
    return _temporary_page("history")


def system_page(request):
    return _temporary_page("system")


def mission_status_api(request, job_id):
    job = get_object_or_404(FormulaJob, id=job_id)
    result_url = None
    if job.status == FormulaJob.Status.SUCCEEDED:
        result_url = reverse("mission-report", kwargs={"job_id": job.id})

    return JsonResponse(
        {
            "status": job.status,
            "progress": job.progress,
            "stage_code": job.stage_code,
            "stage_label": job.stage_label,
            "stage_message": job.stage_message,
            "result_url": result_url,
            "error_message": job.error_message,
            "failure_stage": job.failure_stage,
        }
    )


def _mark_dispatch_failed(job: FormulaJob, failure_stage: str) -> None:
    job.status = FormulaJob.Status.FAILED
    job.failure_stage = failure_stage
    job.error_message = "mission broker unavailable"
    job.stage_code = failure_stage
    job.stage_label = "DISPATCH FAILED"
    job.stage_message = "任务无法进入异步识别队列"
    job.progress = 100
    job.finished_at = timezone.now()
    job.duration_ms = job.calculate_duration_ms()
    job.save(
        update_fields=[
            "status",
            "failure_stage",
            "error_message",
            "stage_code",
            "stage_label",
            "stage_message",
            "progress",
            "finished_at",
            "duration_ms",
        ]
    )


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
