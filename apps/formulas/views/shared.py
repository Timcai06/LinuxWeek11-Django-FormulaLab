from django.utils import timezone

from apps.formulas.models import FormulaJob


def mark_dispatch_failed(job: FormulaJob, failure_stage: str) -> None:
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
