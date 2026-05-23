import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def _validate_text_anchor(instance) -> None:
    if instance.line_end < instance.line_start:
        raise ValidationError({"line_end": "Anchor end line must be greater than or equal to start line."})
    if instance.line_end == instance.line_start and instance.char_end < instance.char_start:
        raise ValidationError({"char_end": "Anchor end character must be greater than or equal to start character."})


class ProjectMembership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        EDITOR = "editor", "Editor"
        COMMENTER = "commenter", "Commenter"
        VIEWER = "viewer", "Viewer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey("formulas.PaperProject", on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="formula_project_memberships",
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    display_name = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["project", "role", "created_at"]
        unique_together = [("project", "user")]

    def __str__(self) -> str:
        return f"{self.project.project_code or self.project_id} {self.user.get_username()} {self.role}"


class PaperFileVersion(models.Model):
    class Source(models.TextChoices):
        MANUAL_SAVE = "manual_save", "Manual save"
        AUTOSAVE = "autosave", "Autosave"
        RESTORE = "restore", "Restore"
        SYSTEM = "system", "System"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey("formulas.PaperFile", on_delete=models.CASCADE, related_name="versions")
    version_number = models.PositiveIntegerField(default=0)
    content = models.TextField(blank=True)
    source = models.CharField(max_length=32, choices=Source.choices, default=Source.MANUAL_SAVE)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="paper_file_versions",
    )
    created_by_label = models.CharField(max_length=120, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version_number", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["file", "version_number"], name="unique_paper_file_version_number"),
        ]

    def __str__(self) -> str:
        return f"{self.file.path} v{self.version_number}"

    def save(self, *args, **kwargs) -> None:
        if not self.version_number:
            latest_number = (
                PaperFileVersion.objects.filter(file=self.file).aggregate(max_version=models.Max("version_number"))[
                    "max_version"
                ]
                or 0
            )
            self.version_number = latest_number + 1
        super().save(*args, **kwargs)


class PaperAnnotation(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        RESOLVED = "resolved", "Resolved"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey("formulas.PaperFile", on_delete=models.CASCADE, related_name="annotations")
    line_start = models.PositiveIntegerField()
    line_end = models.PositiveIntegerField()
    char_start = models.PositiveIntegerField(default=0)
    char_end = models.PositiveIntegerField(default=0)
    quoted_text = models.TextField(blank=True)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="paper_annotations",
    )
    created_by_label = models.CharField(max_length=120, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["file", "line_start", "char_start", "created_at"]

    def __str__(self) -> str:
        return f"{self.file.path}:{self.line_start}-{self.line_end} {self.status}"

    def clean(self) -> None:
        super().clean()
        _validate_text_anchor(self)

    def save(self, *args, **kwargs) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class PaperChangeSuggestion(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        APPLIED = "applied", "Applied"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    annotation = models.ForeignKey(
        PaperAnnotation,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="suggestions",
    )
    file = models.ForeignKey("formulas.PaperFile", on_delete=models.CASCADE, related_name="change_suggestions")
    line_start = models.PositiveIntegerField()
    line_end = models.PositiveIntegerField()
    char_start = models.PositiveIntegerField(default=0)
    char_end = models.PositiveIntegerField(default=0)
    original_text = models.TextField(blank=True)
    replacement_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="paper_change_suggestions",
    )
    created_by_label = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["file", "line_start", "char_start", "created_at"]

    def __str__(self) -> str:
        return f"{self.file.path}:{self.line_start}-{self.line_end} {self.status}"

    def clean(self) -> None:
        super().clean()
        _validate_text_anchor(self)

    def save(self, *args, **kwargs) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
