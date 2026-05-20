import logging
from urllib.parse import urlencode

from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.formulas.forms import FormulaUploadForm
from apps.formulas.models import BatchMission, FormulaItem, FormulaJob, PaperProject
from apps.formulas.services.export_artifacts import (
    collect_export_formulas,
    export_filename,
    render_latex_export,
    render_markdown_export,
)
from apps.formulas.services.health import build_health_snapshot
from apps.formulas.services.latex_formats import build_latex_formats, correct_latex_result
from apps.formulas.tasks import run_formula_job, warmup_model_task

logger = logging.getLogger(__name__)
HISTORY_PAGE_SIZE = 20
PROJECT_WORKSPACE_PAGE_SIZE = 12
EXPORT_READY_STATUSES = [
    FormulaItem.Status.AUTO_READY,
    FormulaItem.Status.CONFIRMED,
    FormulaItem.Status.EDITED,
]
PROJECT_ITEM_STATUS_FILTERS = [
    ("", "ALL ITEMS"),
    (FormulaItem.Status.NEEDS_REVIEW, "NEEDS REVIEW"),
    (FormulaItem.Status.AUTO_READY, "AUTO READY"),
    (FormulaItem.Status.EDITED, "EDITED"),
    (FormulaItem.Status.CONFIRMED, "CONFIRMED"),
    (FormulaItem.Status.EXPORTED, "EXPORTED"),
    (FormulaItem.Status.REJECTED, "REJECTED"),
]


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


def projects(request):
    project_list = list(
        PaperProject.objects.annotate(
            total_formula_count=Count("formula_items", distinct=True),
            batch_count=Count("batches", distinct=True),
            review_formula_count=Count(
                "formula_items",
                filter=Q(formula_items__status=FormulaItem.Status.NEEDS_REVIEW),
                distinct=True,
            ),
            export_ready_formula_count=Count(
                "formula_items",
                filter=Q(formula_items__status__in=EXPORT_READY_STATUSES),
                distinct=True,
            ),
        ).prefetch_related("batches")
    )
    project_metrics = {}
    for project in project_list:
        batches = list(project.batches.all())
        project_metrics[str(project.id)] = {
            "total_formulas": project.total_formula_count,
            "batch_count": project.batch_count,
            "needs_review": project.review_formula_count,
            "ready_to_export": project.export_ready_formula_count,
            "latest_batch": batches[0] if batches else None,
        }
    return render(
        request,
        "formulas/projects.html",
        {
            "projects": project_list,
            "project_metrics": project_metrics,
        },
    )


def project_workspace(request, project_id):
    project = get_object_or_404(PaperProject, id=project_id)
    batches = project.batches.all()[:6]
    active_item_status = request.GET.get("status", "").strip().lower()
    valid_item_statuses = {choice.value for choice in FormulaItem.Status}
    if active_item_status not in valid_item_statuses:
        active_item_status = ""

    formula_queryset = project.formula_items.select_related("batch", "recognition_job")
    if active_item_status:
        formula_queryset = formula_queryset.filter(status=active_item_status)

    item_paginator = Paginator(formula_queryset, PROJECT_WORKSPACE_PAGE_SIZE)
    item_page_obj = item_paginator.get_page(request.GET.get("page", 1))
    formula_items = list(item_page_obj.object_list)
    review_items = [_review_item_payload(item) for item in formula_items]
    paper_preview_items = []
    for item in formula_items:
        latex = _formula_item_latex(item)
        if not latex:
            continue
        paper_preview_items.append(
            {
                "code": item.formula_code,
                "batch_title": item.batch.title,
                "latex": latex,
                "status": item.status,
                "quality_score": item.quality_score,
            }
        )
    overview = {
        "total_formulas": project.formula_items.count(),
        "needs_review": project.formula_items.filter(status=FormulaItem.Status.NEEDS_REVIEW).count(),
        "ready_to_export": project.formula_items.filter(status__in=EXPORT_READY_STATUSES).count(),
        "exported": project.formula_items.filter(status=FormulaItem.Status.EXPORTED).count(),
        "recent_batches": project.batches.count(),
    }
    status_filter_links = _project_status_filter_links(request, active_item_status)
    next_item_querystring = _page_querystring(request, item_page_obj.next_page_number()) if item_page_obj.has_next() else ""
    previous_item_querystring = (
        _page_querystring(request, item_page_obj.previous_page_number()) if item_page_obj.has_previous() else ""
    )
    return render(
        request,
        "formulas/project_workspace.html",
        {
            "project": project,
            "batches": batches,
            "formula_items": formula_items,
            "paper_preview_items": paper_preview_items,
            "review_items": review_items,
            "overview": overview,
            "active_item_status": active_item_status,
            "status_filter_links": status_filter_links,
            "item_page_obj": item_page_obj,
            "next_item_querystring": next_item_querystring,
            "previous_item_querystring": previous_item_querystring,
        },
    )


def export_project(request, project_id, format_name):
    project = get_object_or_404(PaperProject, id=project_id)
    formulas = collect_export_formulas(project)
    if format_name == "tex":
        body = render_latex_export(project, formulas)
        filename = export_filename(project, "tex")
    elif format_name == "markdown":
        body = render_markdown_export(project, formulas)
        filename = export_filename(project, "md")
    else:
        raise Http404("Unsupported export format")

    response = HttpResponse(body, content_type="text/plain; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


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
        run_formula_job.delay(str(job.id))
    except Exception:
        logger.exception("Unable to queue formula job %s", job.id)
        _mark_dispatch_failed(job, "DISPATCH")
        _mark_batch_failed(batch)
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=job.id)


def mission_progress(request, job_id):
    job = get_object_or_404(FormulaJob, id=job_id)
    return render(request, "formulas/progress.html", {"job": job})


def mission_report(request, job_id):
    job = get_object_or_404(FormulaJob, id=job_id)
    return render(
        request,
        "formulas/result.html",
        {
            "job": job,
            "formats": build_latex_formats(correct_latex_result(job.latex_result, job.original_image.path)),
        },
    )


@require_POST
def retry_mission(request, job_id):
    old_job = get_object_or_404(FormulaJob, id=job_id)
    if old_job.status != FormulaJob.Status.FAILED:
        return JsonResponse({"status": "rejected", "error": "only failed missions can be retried"}, status=409)

    new_job = FormulaJob.objects.create(
        original_image=old_job.original_image,
        retry_of=old_job,
        project=old_job.project,
        batch=old_job.batch,
    )
    try:
        run_formula_job.delay(str(new_job.id))
    except Exception:
        logger.exception("Unable to queue retry formula job %s from %s", new_job.id, old_job.id)
        _mark_dispatch_failed(new_job, "RETRY_DISPATCH")
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=new_job.id)


@require_POST
def review_formula_item(request, item_id):
    item = get_object_or_404(FormulaItem.objects.select_related("project"), id=item_id)
    latex_current = request.POST.get("latex_current", "").strip()
    if latex_current:
        item.latex_current = latex_current
    item.status = FormulaItem.Status.CONFIRMED
    item.save(update_fields=["latex_current", "status", "updated_at"])
    return redirect("project-workspace", project_id=item.project_id)


def history(request):
    search_query = request.GET.get("q", "").strip()
    active_status = request.GET.get("status", "").strip().lower()
    valid_statuses = {choice.value for choice in FormulaJob.Status}

    jobs = FormulaJob.objects.all()
    if search_query:
        jobs = jobs.filter(mission_code__icontains=search_query)
    if active_status in valid_statuses:
        jobs = jobs.filter(status=active_status)
    else:
        active_status = ""

    paginator = Paginator(jobs, HISTORY_PAGE_SIZE)
    page_obj = paginator.get_page(request.GET.get("page", 1))
    next_querystring = ""
    previous_querystring = ""
    if page_obj.has_next():
        query_params = request.GET.copy()
        query_params["page"] = page_obj.next_page_number()
        next_querystring = urlencode(query_params, doseq=True)
    if page_obj.has_previous():
        query_params = request.GET.copy()
        query_params["page"] = page_obj.previous_page_number()
        previous_querystring = urlencode(query_params, doseq=True)

    return render(
        request,
        "formulas/history.html",
        {
            "jobs": page_obj.object_list,
            "page_obj": page_obj,
            "paginator": paginator,
            "search_query": search_query,
            "active_status": active_status,
            "status_choices": FormulaJob.Status,
            "next_querystring": next_querystring,
            "previous_querystring": previous_querystring,
        },
    )


def system_page(request):
    return render(request, "formulas/system.html", {"health_snapshot": _safe_health_snapshot()})


def mission_status_api(request, job_id):
    job = get_object_or_404(FormulaJob, id=job_id)
    result_url = None
    if job.status == FormulaJob.Status.SUCCEEDED:
        result_url = reverse("mission-report", kwargs={"job_id": job.id})

    return JsonResponse(
        {
            "id": str(job.id),
            "mission_code": job.mission_code,
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


def _formula_item_latex(item: FormulaItem) -> str:
    if item.latex_current:
        return item.latex_current
    if item.recognition_job and item.recognition_job.latex_result:
        return item.recognition_job.latex_result
    return ""


def _review_item_payload(item: FormulaItem) -> dict:
    return {
        "id": str(item.id),
        "code": item.formula_code,
        "batch_title": item.batch.title,
        "latex": _formula_item_latex(item),
        "status": item.status,
        "quality_score": item.quality_score,
        "review_url": reverse("review-formula-item", kwargs={"item_id": item.id}),
    }


def _project_status_filter_links(request, active_item_status: str) -> list[dict]:
    links = []
    for value, label in PROJECT_ITEM_STATUS_FILTERS:
        query_params = request.GET.copy()
        query_params.pop("page", None)
        if value:
            query_params["status"] = value
        else:
            query_params.pop("status", None)
        querystring = query_params.urlencode()
        links.append(
            {
                "value": value,
                "label": label,
                "url": f"?{querystring}" if querystring else request.path,
                "active": value == active_item_status,
            }
        )
    return links


def _page_querystring(request, page_number: int) -> str:
    query_params = request.GET.copy()
    query_params["page"] = page_number
    return query_params.urlencode()


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
