from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from apps.formulas.models import FormulaItem, PaperProject
from apps.formulas.presenters.projects import project_workspace_context
from apps.formulas.selectors.projects import get_project_workspace
from apps.formulas.services.export_artifacts import (
    collect_export_formulas,
    export_filename,
    render_latex_export,
    render_markdown_export,
)

PROJECT_WORKSPACE_PAGE_SIZE = 12
EXPORT_READY_STATUSES = [
    FormulaItem.Status.AUTO_READY,
    FormulaItem.Status.CONFIRMED,
    FormulaItem.Status.EDITED,
]
PROJECT_ITEM_STATUS_FILTERS = [
    ("", "ALL ITEMS"),
    (FormulaItem.Status.NEEDS_REVIEW, "NEEDS REVIEW"),
    (FormulaItem.Status.AUTO_READY, "AUTO READY"),
    (FormulaItem.Status.EDITED, "EDITED"),
    (FormulaItem.Status.CONFIRMED, "CONFIRMED"),
    (FormulaItem.Status.EXPORTED, "EXPORTED"),
    (FormulaItem.Status.REJECTED, "REJECTED"),
]


def projects(request):
    project_list = list(
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
    project_metrics = {}
    for project in project_list:
        batches = list(project.batches.all())
        project_metrics[str(project.id)] = {
            "total_formulas": project.total_formula_count,
            "batch_count": project.batch_count,
            "needs_review": project.review_formula_count,
            "ready_to_export": project.export_ready_formula_count,
            "latest_batch": batches[0] if batches else None,
        }
    return render(
        request,
        "formulas/projects.html",
        {
            "projects": project_list,
            "project_metrics": project_metrics,
        },
    )


def project_workspace(request, project_id):
    project = get_project_workspace(project_id)
    batches = project.batches.all()[:6]
    active_item_status = request.GET.get("status", "").strip().lower()
    valid_item_statuses = {choice.value for choice in FormulaItem.Status}
    if active_item_status not in valid_item_statuses:
        active_item_status = ""

    formula_queryset = project.formula_items.select_related("batch", "recognition_job")
    if active_item_status:
        formula_queryset = formula_queryset.filter(status=active_item_status)

    item_paginator = Paginator(formula_queryset, PROJECT_WORKSPACE_PAGE_SIZE)
    item_page_obj = item_paginator.get_page(request.GET.get("page", 1))
    formula_items = list(item_page_obj.object_list)
    review_items = [_review_item_payload(item) for item in formula_items]
    paper_preview_items = []
    for item in formula_items:
        latex = _formula_item_latex(item)
        if not latex:
            continue
        paper_preview_items.append(
            {
                "code": item.formula_code,
                "batch_title": item.batch.title,
                "latex": latex,
                "status": item.status,
                "quality_score": item.quality_score,
            }
        )
    overview = {
        "total_formulas": project.formula_items.count(),
        "needs_review": project.formula_items.filter(status=FormulaItem.Status.NEEDS_REVIEW).count(),
        "ready_to_export": project.formula_items.filter(status__in=EXPORT_READY_STATUSES).count(),
        "exported": project.formula_items.filter(status=FormulaItem.Status.EXPORTED).count(),
        "recent_batches": project.batches.count(),
    }
    status_filter_links = _project_status_filter_links(request, active_item_status)
    next_item_querystring = (
        _page_querystring(request, item_page_obj.next_page_number()) if item_page_obj.has_next() else ""
    )
    previous_item_querystring = (
        _page_querystring(request, item_page_obj.previous_page_number()) if item_page_obj.has_previous() else ""
    )
    return render(
        request,
        "formulas/project_workspace.html",
        project_workspace_context(
            project,
            batches=batches,
            formula_items=formula_items,
            paper_preview_items=paper_preview_items,
            review_items=review_items,
            overview=overview,
            active_item_status=active_item_status,
            status_filter_links=status_filter_links,
            item_page_obj=item_page_obj,
            next_item_querystring=next_item_querystring,
            previous_item_querystring=previous_item_querystring,
        ),
    )


def export_project(request, project_id, format_name):
    project = get_object_or_404(PaperProject, id=project_id)
    formulas = collect_export_formulas(project)
    if format_name == "tex":
        body = render_latex_export(project, formulas)
        filename = export_filename(project, "tex")
    elif format_name == "markdown":
        body = render_markdown_export(project, formulas)
        filename = export_filename(project, "md")
    else:
        raise Http404("Unsupported export format")

    response = HttpResponse(body, content_type="text/plain; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@require_POST
def review_formula_item(request, item_id):
    item = get_object_or_404(FormulaItem.objects.select_related("project"), id=item_id)
    latex_current = request.POST.get("latex_current", "").strip()
    if latex_current:
        item.latex_current = latex_current
    item.status = FormulaItem.Status.CONFIRMED
    item.save(update_fields=["latex_current", "status", "updated_at"])
    return redirect("project-workspace", project_id=item.project_id)


def _formula_item_latex(item: FormulaItem) -> str:
    if item.latex_current:
        return item.latex_current
    if item.recognition_job and item.recognition_job.latex_result:
        return item.recognition_job.latex_result
    return ""


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


def _project_status_filter_links(request, active_item_status: str) -> list[dict]:
    links = []
    for value, label in PROJECT_ITEM_STATUS_FILTERS:
        query_params = request.GET.copy()
        query_params.pop("page", None)
        if value:
            query_params["status"] = value
        else:
            query_params.pop("status", None)
        querystring = query_params.urlencode()
        links.append(
            {
                "value": value,
                "label": label,
                "url": f"?{querystring}" if querystring else request.path,
                "active": value == active_item_status,
            }
        )
    return links


def _page_querystring(request, page_number: int) -> str:
    query_params = request.GET.copy()
    query_params["page"] = page_number
    return query_params.urlencode()
