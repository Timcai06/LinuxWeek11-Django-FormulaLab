from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.formulas.services.health import build_health_snapshot
from apps.formulas.tasks import warmup_model_task


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
    return JsonResponse({"temporary": True, "job_id": str(job_id), "status": "pending_task_7"}, status=501)


def health_api(request):
    return JsonResponse(build_health_snapshot())


@csrf_exempt
@require_POST
def warmup_api(request):
    warmup_model_task.delay()
    return JsonResponse({"status": "queued"})
