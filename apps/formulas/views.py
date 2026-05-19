"""Temporary Task 2 import stubs; Task 7 replaces these with real views."""

from django.http import HttpResponse, JsonResponse


def _temporary_page(name: str) -> HttpResponse:
    return HttpResponse(f"Temporary Formula Lab placeholder: {name}")


def landing(request):
    return _temporary_page("landing")


def workbench(request):
    return _temporary_page("workbench")


def create_job(request):
    return _temporary_page("create-job")


def mission_progress(request, job_id):
    return _temporary_page(f"mission-progress:{job_id}")


def mission_report(request, job_id):
    return _temporary_page(f"mission-report:{job_id}")


def retry_mission(request, job_id):
    return _temporary_page(f"retry-mission:{job_id}")


def history(request):
    return _temporary_page("history")


def system_page(request):
    return _temporary_page("system")


def mission_status_api(request, job_id):
    return JsonResponse({"temporary": True, "job_id": str(job_id), "status": "pending_task_7"})


def health_api(request):
    return JsonResponse({"temporary": True, "status": "pending_task_7"})


def warmup_api(request):
    return JsonResponse({"temporary": True, "status": "pending_task_7"})
