import logging

from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from apps.formulas.forms import FormulaUploadForm
from apps.formulas.models import BatchMission, FormulaJob, PaperProject
from apps.formulas.services.queue_control import is_recognition_queue_paused
from apps.formulas.tasks import run_formula_job

from .shared import mark_dispatch_failed
from .system_views import _safe_health_snapshot

logger = logging.getLogger(__name__)


def landing(request):
    return render(request, "formulas/landing.html")


def workbench(request):
    health_snapshot = _safe_health_snapshot()
    return render(
        request,
        "formulas/workbench.html",
        {
            "form": FormulaUploadForm(),
            "projects": PaperProject.objects.all(),
            "recent_jobs": FormulaJob.objects.all()[:5],
            "health_snapshot": health_snapshot,
            "queue_counts": health_snapshot.get("queues", {}),
            "model_status": health_snapshot.get("model", {}),
        },
    )


@require_POST
def create_job(request):
    form = FormulaUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        return JsonResponse({"status": "invalid", "errors": form.errors}, status=400)

    image = form.cleaned_data["image"]
    project = _resolve_upload_project(form)
    batch = _create_upload_batch(project, image.name) if project else None
    job = FormulaJob.objects.create(original_image=image, project=project, batch=batch)
    if is_recognition_queue_paused():
        job.mark_stage("QUEUE_PAUSED", "QUEUE PAUSED", "识别队列已暂停，任务会在恢复后继续", 15)
        return redirect("mission-progress", job_id=job.id)

    try:
        run_formula_job.delay(str(job.id))
    except Exception:
        logger.exception("Unable to queue formula job %s", job.id)
        mark_dispatch_failed(job, "DISPATCH")
        _mark_batch_failed(batch)
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=job.id)


def _resolve_upload_project(form: FormulaUploadForm) -> PaperProject | None:
    project = form.cleaned_data.get("project")
    project_name = form.cleaned_data.get("project_name", "").strip()
    if project:
        return project
    if project_name:
        return PaperProject.objects.create(name=project_name)
    return None


def _create_upload_batch(project: PaperProject, image_name: str) -> BatchMission:
    return BatchMission.objects.create(
        project=project,
        title=image_name,
        status=BatchMission.Status.RUNNING,
    )


def _mark_batch_failed(batch: BatchMission | None) -> None:
    if not batch:
        return
    batch.status = BatchMission.Status.FAILED
    batch.save(update_fields=["status", "updated_at"])
