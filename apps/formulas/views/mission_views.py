import logging
from urllib.parse import urlencode

from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from apps.formulas.models import FormulaJob
from apps.formulas.presenters.missions import mission_report_context
from apps.formulas.selectors.missions import get_mission_for_report
from apps.formulas.tasks import run_formula_job

from .shared import mark_dispatch_failed

HISTORY_PAGE_SIZE = 20
logger = logging.getLogger(__name__)


def mission_progress(request, job_id):
    job = get_object_or_404(FormulaJob, id=job_id)
    return render(request, "formulas/progress.html", {"job": job})


def mission_report(request, job_id):
    job = get_mission_for_report(job_id)
    return render(request, "formulas/result.html", mission_report_context(job))


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
        mark_dispatch_failed(new_job, "RETRY_DISPATCH")
        return JsonResponse({"status": "unavailable", "error": "mission broker unavailable"}, status=503)

    return redirect("mission-progress", job_id=new_job.id)


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
