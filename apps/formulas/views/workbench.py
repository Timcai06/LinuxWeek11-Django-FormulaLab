from importlib import import_module

from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.formulas.forms import FormulaUploadForm
from apps.formulas.models import BatchMission, FormulaJob, PaperProject

from .system import _safe_health_snapshot


def _views_facade():
    return import_module("apps.formulas.views")


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
    try:
        _views_facade().run_formula_job.delay(str(job.id))
    except Exception:
        _views_facade().logger.exception("Unable to queue formula job %s", job.id)
        _mark_dispatch_failed(job, "DISPATCH")
        _mark_batch_failed(batch)
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=job.id)


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
