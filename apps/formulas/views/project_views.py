from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.formulas.models import FormulaItem, PaperProject
from apps.formulas.presenters.projects import build_project_index_context, build_project_workspace_context
from apps.formulas.selectors.projects import get_project_workspace
from apps.formulas.services.export_artifacts import (
    collect_export_formulas,
    export_filename,
    render_latex_export,
    render_markdown_export,
)


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
