from django.core.paginator import Paginator
from django.urls import reverse

from apps.formulas.models import FormulaItem
from apps.formulas.selectors.projects import (
    get_project_formula_queryset,
    list_projects_for_index,
    project_workspace_overview,
)


PROJECT_WORKSPACE_PAGE_SIZE = 12
PROJECT_ITEM_STATUS_FILTERS = [
    ("", "ALL ITEMS"),
    (FormulaItem.Status.NEEDS_REVIEW, "NEEDS REVIEW"),
    (FormulaItem.Status.AUTO_READY, "AUTO READY"),
    (FormulaItem.Status.EDITED, "EDITED"),
    (FormulaItem.Status.CONFIRMED, "CONFIRMED"),
    (FormulaItem.Status.EXPORTED, "EXPORTED"),
    (FormulaItem.Status.REJECTED, "REJECTED"),
]


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
    active_item_status = _normalized_item_status(query_params.get("status", ""))
    item_paginator = Paginator(
        get_project_formula_queryset(project, active_item_status),
        PROJECT_WORKSPACE_PAGE_SIZE,
    )
    item_page_obj = item_paginator.get_page(query_params.get("page", 1))
    formula_items = list(item_page_obj.object_list)
    return project_workspace_context(
        project,
        batches=project.batches.all()[:6],
        formula_items=formula_items,
        paper_preview_items=[_paper_preview_item_payload(item) for item in formula_items if _formula_item_latex(item)],
        review_items=[_review_item_payload(item) for item in formula_items],
        overview=project_workspace_overview(project),
        active_item_status=active_item_status,
        status_filter_links=_project_status_filter_links(query_params, request_path, active_item_status),
        item_page_obj=item_page_obj,
        next_item_querystring=(
            _page_querystring(query_params, item_page_obj.next_page_number()) if item_page_obj.has_next() else ""
        ),
        previous_item_querystring=(
            _page_querystring(query_params, item_page_obj.previous_page_number()) if item_page_obj.has_previous() else ""
        ),
    )


def _normalized_item_status(raw_status: str) -> str:
    active_item_status = (raw_status or "").strip().lower()
    valid_item_statuses = {choice.value for choice in FormulaItem.Status}
    return active_item_status if active_item_status in valid_item_statuses else ""


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


def _review_item_payload(item: FormulaItem) -> dict:
    return {
        "id": str(item.id),
        "code": item.formula_code,
        "batch_title": item.batch.title,
        "latex": _formula_item_latex(item),
        "status": item.status,
        "quality_score": item.quality_score,
        "review_url": reverse("review-formula-item", kwargs={"item_id": item.id}),
    }


def _project_status_filter_links(query_params, request_path: str, active_item_status: str) -> list[dict]:
    links = []
    for value, label in PROJECT_ITEM_STATUS_FILTERS:
        link_params = query_params.copy()
        link_params.pop("page", None)
        if value:
            link_params["status"] = value
        else:
            link_params.pop("status", None)
        querystring = link_params.urlencode()
        links.append(
            {
                "value": value,
                "label": label,
                "url": f"?{querystring}" if querystring else request_path,
                "active": value == active_item_status,
            }
        )
    return links


def _page_querystring(query_params, page_number: int) -> str:
    link_params = query_params.copy()
    link_params["page"] = page_number
    return link_params.urlencode()
