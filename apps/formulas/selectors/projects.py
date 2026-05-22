from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from apps.formulas.models import FormulaItem, PaperProject


EXPORT_READY_STATUSES = [
    FormulaItem.Status.AUTO_READY,
    FormulaItem.Status.CONFIRMED,
    FormulaItem.Status.EDITED,
]


def get_project_workspace(project_id):
    return get_object_or_404(PaperProject, id=project_id)


def list_projects_for_index() -> list[PaperProject]:
    return list(
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


def get_project_formula_queryset(project: PaperProject, active_item_status: str = ""):
    queryset = project.formula_items.select_related("batch", "recognition_job")
    if active_item_status:
        return queryset.filter(status=active_item_status)
    return queryset


def project_workspace_overview(project: PaperProject) -> dict:
    total_formulas = project.formula_items.count()
    needs_review = project.formula_items.filter(status=FormulaItem.Status.NEEDS_REVIEW).count()
    ready_to_export = project.formula_items.filter(status__in=EXPORT_READY_STATUSES).count()
    exported = project.formula_items.filter(status=FormulaItem.Status.EXPORTED).count()
    reviewed = ready_to_export + exported
    return {
        "total_formulas": total_formulas,
        "needs_review": needs_review,
        "ready_to_export": ready_to_export,
        "exported": exported,
        "recent_batches": project.batches.count(),
        "completion_rate": int((reviewed / total_formulas) * 100) if total_formulas else 0,
    }
