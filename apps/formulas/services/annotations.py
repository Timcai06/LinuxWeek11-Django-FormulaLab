from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.formulas.models import PaperAnnotation, PaperFile


def create_paper_annotation(
    file: PaperFile,
    *,
    line_start: int,
    line_end: int,
    char_start: int = 0,
    char_end: int = 0,
    quoted_text: str = "",
    body: str,
    created_by_label: str = "",
) -> PaperAnnotation:
    annotation = PaperAnnotation(
        file=file,
        line_start=line_start,
        line_end=line_end,
        char_start=char_start,
        char_end=char_end,
        quoted_text=quoted_text,
        body=body,
        created_by_label=created_by_label,
    )
    annotation.full_clean()
    annotation.save()
    return annotation


def update_paper_annotation(
    annotation: PaperAnnotation,
    *,
    body: str | None = None,
    status: str | None = None,
) -> PaperAnnotation:
    if body is not None:
        annotation.body = body
    if status is not None:
        if status not in PaperAnnotation.Status.values:
            raise ValidationError({"status": "Unknown annotation status."})
        annotation.status = status
        annotation.resolved_at = timezone.now() if status == PaperAnnotation.Status.RESOLVED else None
    annotation.full_clean()
    annotation.save()
    return annotation
