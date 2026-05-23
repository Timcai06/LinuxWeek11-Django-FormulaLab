from apps.formulas.models import FormulaItem
from apps.formulas.selectors.projects import (
    list_projects_for_index,
    project_workspace_overview,
)


PROJECT_PREVIEW_ITEM_LIMIT = 12


def project_workspace_context(workspace_project, **extra):
    if "project" in extra:
        raise ValueError("project cannot be provided in extra context")

    context = {"project": workspace_project}
    context.update(extra)
    return context


def build_project_index_context() -> dict:
    projects = list_projects_for_index()
    return {
        "projects": projects,
        "project_metrics": {str(project.id): _project_card_metrics(project) for project in projects},
    }


def build_project_workspace_context(project, query_params, request_path: str) -> dict:
    del query_params, request_path
    preview_items = list(
        project.formula_items.select_related("batch", "recognition_job").order_by("batch", "sort_order", "created_at")[
            :PROJECT_PREVIEW_ITEM_LIMIT
        ]
    )
    return project_workspace_context(
        project,
        batches=project.batches.all()[:6],
        paper_preview_items=[_paper_preview_item_payload(item) for item in preview_items if _formula_item_latex(item)],
        overview=project_workspace_overview(project),
    )


def _project_card_metrics(project) -> dict:
    batches = list(project.batches.all())
    return {
        "total_formulas": project.total_formula_count,
        "batch_count": project.batch_count,
        "needs_review": project.review_formula_count,
        "ready_to_export": project.export_ready_formula_count,
        "latest_batch": batches[0] if batches else None,
    }


def _formula_item_latex(item: FormulaItem) -> str:
    if item.latex_current:
        return item.latex_current
    if item.recognition_job and item.recognition_job.latex_result:
        return item.recognition_job.latex_result
    return ""


def _paper_preview_item_payload(item: FormulaItem) -> dict:
    return {
        "code": item.formula_code,
        "batch_title": item.batch.title,
        "latex": _formula_item_latex(item),
        "status": item.status,
        "quality_score": item.quality_score,
    }
