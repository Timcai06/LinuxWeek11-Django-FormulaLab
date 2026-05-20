from django.shortcuts import get_object_or_404

from apps.formulas.models import PaperProject


def get_project_workspace(project_id):
    return get_object_or_404(
        PaperProject.objects.prefetch_related("formula_items", "formula_jobs", "batches"),
        id=project_id,
    )
