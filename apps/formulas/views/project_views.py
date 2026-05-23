import json

from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from apps.formulas.models import FormulaItem, FormulaItemVersion, PaperProject
from apps.formulas.presenters.project_api import (
    formula_item_detail_payload,
    formula_item_version_payload,
    project_items_payload,
)
from apps.formulas.presenters.projects import build_project_index_context, build_project_workspace_context
from apps.formulas.selectors.projects import get_project_workspace
from apps.formulas.services.export_artifacts import (
    collect_export_formulas,
    export_filename,
    render_latex_export,
    render_markdown_export,
)
from apps.formulas.services.project_items import confirm_formula_item_review, update_formula_item_latex


def projects(request):
    return render(request, "formulas/projects.html", build_project_index_context())


def project_workspace(request, project_id):
    project = get_project_workspace(project_id)
    return render(
        request,
        "formulas/project_workspace.html",
        build_project_workspace_context(
            project,
            query_params=request.GET,
            request_path=request.path,
        ),
    )


@require_GET
def api_project_items(request, project_id):
    project = get_object_or_404(PaperProject, id=project_id)
    items = (
        FormulaItem.objects.filter(project=project)
        .select_related("batch", "recognition_job")
        .order_by("batch", "sort_order", "created_at")
    )
    return JsonResponse(project_items_payload(project, items))


@require_http_methods(["GET", "PATCH"])
def api_formula_item_detail(request, item_id):
    item = _get_api_formula_item(item_id)
    if request.method == "PATCH":
        payload = _json_payload(request)
        latex = payload.get("latex_current", "")
        if not (latex or "").strip():
            return JsonResponse({"error": "latex_current is required"}, status=400)
        update_formula_item_latex(
            item,
            latex,
            source=FormulaItemVersion.Source.MANUAL,
            created_by_label="api",
            note=payload.get("note", ""),
            status=FormulaItem.Status.EDITED,
        )
        item = _get_api_formula_item(item_id)
    return JsonResponse(formula_item_detail_payload(item))


@require_http_methods(["GET", "POST"])
def api_formula_item_versions(request, item_id):
    item = _get_api_formula_item(item_id)
    if request.method == "POST":
        payload = _json_payload(request)
        latex = payload.get("latex", "")
        if not (latex or "").strip():
            return JsonResponse({"error": "latex is required"}, status=400)
        update_formula_item_latex(
            item,
            latex,
            source=FormulaItemVersion.Source.MANUAL,
            created_by_label="api",
            note=payload.get("note", ""),
            status=FormulaItem.Status.EDITED,
        )
        latest_version = FormulaItemVersion.objects.filter(item=item).first()
        return JsonResponse({"version": formula_item_version_payload(latest_version)}, status=201)

    versions = item.versions.all()
    return JsonResponse(
        {
            "item_id": str(item.id),
            "versions": [formula_item_version_payload(version) for version in versions],
        }
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
    confirm_formula_item_review(item, request.POST.get("latex_current", ""))
    return redirect("project-workspace", project_id=item.project_id)


def _get_api_formula_item(item_id):
    queryset = FormulaItem.objects.select_related(
        "project",
        "batch",
        "recognition_job",
    ).prefetch_related("versions")
    return get_object_or_404(
        queryset,
        id=item_id,
    )


def _json_payload(request) -> dict:
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}
