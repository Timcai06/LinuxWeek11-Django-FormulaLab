import uuid

from django.db import models
from django.utils import timezone


class FormulaJob(models.Model):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_image = models.ImageField(upload_to="formula_uploads/%Y/%m/")
    preprocessed_image = models.ImageField(upload_to="formula_preprocessed/%Y/%m/", blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    progress = models.PositiveSmallIntegerField(default=10)
    stage_code = models.CharField(max_length=64, default="UPLOAD_LOCKED")
    stage_label = models.CharField(max_length=64, default="UPLOAD LOCKED")
    stage_message = models.CharField(max_length=255, default="上传完成，任务已锁定")
    latex_result = models.TextField(blank=True)
    engine_name = models.CharField(max_length=64, default="pix2tex")
    retry_of = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="retries")
    error_message = models.CharField(max_length=255, blank=True)
    error_detail = models.TextField(blank=True)
    failure_stage = models.CharField(max_length=64, blank=True)
    timings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"FormulaJob {self.id} {self.status}"

    @property
    def is_terminal(self) -> bool:
        return self.status in {self.Status.SUCCEEDED, self.Status.FAILED}

    def mark_stage(self, code: str, label: str, message: str, progress: int) -> None:
        self.stage_code = code
        self.stage_label = label
        self.stage_message = message
        self.progress = progress
        self.save(update_fields=["stage_code", "stage_label", "stage_message", "progress"])

    def calculate_duration_ms(self) -> int | None:
        if not self.started_at or not self.finished_at:
            return None
        return int((self.finished_at - self.started_at).total_seconds() * 1000)

    def finish(self, status: str) -> None:
        self.status = status
        self.finished_at = timezone.now()
        self.duration_ms = self.calculate_duration_ms()
        self.save(update_fields=["status", "finished_at", "duration_ms"])
