import uuid
from pathlib import PurePosixPath

from django.core.exceptions import ValidationError
from django.db import IntegrityError, models, transaction
from django.utils import timezone


MISSION_CODE_PREFIX = "FL"
CODE_GENERATION_RETRY_LIMIT = 20


def _next_dated_code(model, field_name: str, prefix: str) -> str:
    date_prefix = f"{prefix}-{timezone.localdate():%Y%m%d}"
    lookup = {f"{field_name}__startswith": f"{date_prefix}-"}
    last_code = (
        model.objects.filter(**lookup)
        .order_by(f"-{field_name}")
        .values_list(field_name, flat=True)
        .first()
    )
    next_sequence = _next_sequence_from_code(last_code)

    for sequence in range(next_sequence, next_sequence + 1000):
        code = f"{date_prefix}-{sequence:04d}"
        if not model.objects.filter(**{field_name: code}).exists():
            return code

    raise RuntimeError(f"Unable to allocate {field_name}")


def _save_with_generated_code(instance, field_name: str, prefix: str, save_callable, args, kwargs) -> None:
    if getattr(instance, field_name):
        save_callable(*args, **kwargs)
        return

    last_error = None
    for _ in range(CODE_GENERATION_RETRY_LIMIT):
        setattr(instance, field_name, _next_dated_code(type(instance), field_name, prefix))
        try:
            with transaction.atomic():
                save_callable(*args, **kwargs)
            return
        except IntegrityError as error:
            last_error = error
            setattr(instance, field_name, "")

    raise RuntimeError(f"Unable to allocate unique {field_name}") from last_error


def _inherit_or_validate_batch_project(instance) -> None:
    if instance.batch_id and not instance.project_id:
        instance.project = instance.batch.project

    if instance.project_id and instance.batch_id and instance.batch.project_id != instance.project_id:
        raise ValidationError({"batch": "Batch belongs to a different project."})


class PaperProject(models.Model):
    class ExportFormat(models.TextChoices):
        MARKDOWN = "markdown", "Markdown"
        LATEX = "latex", "LaTeX"
        ALIGN = "align", "Align"
        INLINE = "inline", "Inline"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_code = models.CharField(max_length=32, unique=True, db_index=True, blank=True)
    name = models.CharField(max_length=120)
    writing_goal = models.CharField(max_length=255, blank=True)
    default_export_format = models.CharField(
        max_length=20,
        choices=ExportFormat.choices,
        default=ExportFormat.LATEX,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.project_code or self.id} {self.name}"

    def save(self, *args, **kwargs) -> None:
        _save_with_generated_code(self, "project_code", "FP", super().save, args, kwargs)


class BatchMission(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        RUNNING = "running", "Running"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_code = models.CharField(max_length=36, unique=True, db_index=True, blank=True)
    project = models.ForeignKey(
        PaperProject,
        on_delete=models.CASCADE,
        related_name="batches",
    )
    title = models.CharField(max_length=160, default="Untitled batch")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.batch_code or self.id} {self.title}"

    def save(self, *args, **kwargs) -> None:
        _save_with_generated_code(self, "batch_code", "FB", super().save, args, kwargs)


class PaperDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_code = models.CharField(max_length=36, unique=True, db_index=True, blank=True)
    project = models.ForeignKey(PaperProject, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=160, default="Untitled manuscript")
    root_file_path = models.CharField(max_length=255, default="main.tex")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.document_code or self.id} {self.title}"

    def save(self, *args, **kwargs) -> None:
        _save_with_generated_code(self, "document_code", "FD", super().save, args, kwargs)


class PaperFile(models.Model):
    class FileType(models.TextChoices):
        TEX = "tex", "TeX"
        BIB = "bib", "BibTeX"
        MARKDOWN = "markdown", "Markdown"
        TEXT = "text", "Text"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(PaperDocument, on_delete=models.CASCADE, related_name="files")
    path = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FileType.choices, default=FileType.TEX)
    content = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "path", "created_at"]
        unique_together = [("document", "path")]

    def __str__(self) -> str:
        return f"{self.document.document_code or self.document_id} {self.path}"

    def clean(self) -> None:
        super().clean()
        path = PurePosixPath(self.path or "")
        if not self.path or path.is_absolute() or "." in path.parts or ".." in path.parts:
            raise ValidationError({"path": "Paper file path must be a safe relative path."})

    def save(self, *args, **kwargs) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class FormulaJob(models.Model):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mission_code = models.CharField(max_length=32, unique=True, db_index=True, blank=True)
    project = models.ForeignKey(
        PaperProject,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="formula_jobs",
    )
    batch = models.ForeignKey(
        BatchMission,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="formula_jobs",
    )
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
        return f"FormulaJob {self.mission_code or self.id} {self.status}"

    def save(self, *args, **kwargs) -> None:
        _inherit_or_validate_batch_project(self)
        _save_with_generated_code(self, "mission_code", MISSION_CODE_PREFIX, super().save, args, kwargs)

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

    @classmethod
    def _next_mission_code(cls) -> str:
        return _next_dated_code(cls, "mission_code", MISSION_CODE_PREFIX)


class FormulaItem(models.Model):
    class Status(models.TextChoices):
        AUTO_READY = "auto_ready", "Auto ready"
        NEEDS_REVIEW = "needs_review", "Needs review"
        EDITED = "edited", "Edited"
        CONFIRMED = "confirmed", "Confirmed"
        EXPORTED = "exported", "Exported"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    formula_code = models.CharField(max_length=40, unique=True, db_index=True, blank=True)
    project = models.ForeignKey(
        PaperProject,
        on_delete=models.CASCADE,
        related_name="formula_items",
    )
    batch = models.ForeignKey(
        BatchMission,
        on_delete=models.CASCADE,
        related_name="formula_items",
    )
    recognition_job = models.OneToOneField(
        FormulaJob,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="formula_item",
    )
    latex_current = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEEDS_REVIEW)
    quality_score = models.PositiveSmallIntegerField(default=0)
    quality_flags = models.JSONField(default=list, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["batch", "sort_order", "created_at"]

    def __str__(self) -> str:
        return f"{self.formula_code or self.id} {self.status}"

    def save(self, *args, **kwargs) -> None:
        _inherit_or_validate_batch_project(self)
        _save_with_generated_code(self, "formula_code", "FF", super().save, args, kwargs)


class FormulaItemVersion(models.Model):
    class Source(models.TextChoices):
        OCR = "ocr", "OCR"
        MANUAL = "manual", "Manual"
        SYSTEM_CORRECTION = "system_correction", "System correction"
        EXPORT_SNAPSHOT = "export_snapshot", "Export snapshot"

    item = models.ForeignKey(
        FormulaItem,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    latex = models.TextField()
    source = models.CharField(max_length=32, choices=Source.choices)
    created_by_label = models.CharField(max_length=80, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return f"{self.item.formula_code or self.item_id} {self.source}"


def _next_sequence_from_code(code: str | None) -> int:
    if not code:
        return 1
    try:
        return int(code.rsplit("-", 1)[1]) + 1
    except (IndexError, ValueError):
        return 1


from .collaboration_models import (  # noqa: E402,F401
    PaperAnnotation,
    PaperChangeSuggestion,
    PaperFileVersion,
    ProjectMembership,
)
