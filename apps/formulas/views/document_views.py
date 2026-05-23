import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from apps.formulas.models import PaperDocument, PaperFile, PaperProject
from apps.formulas.presenters.document_api import (
    paper_document_payload,
    paper_file_payload,
    project_documents_payload,
)
from apps.formulas.services.documents import create_default_document


@require_http_methods(["GET", "POST"])
def api_project_documents(request, project_id):
    project = get_object_or_404(PaperProject, id=project_id)
    if request.method == "POST":
        payload = _json_payload(request)
        document = create_default_document(project, title=payload.get("title", ""))
        document = _document_queryset().get(id=document.id)
        return JsonResponse(
            {
                "document": paper_document_payload(document, include_files=False),
                "files": [paper_file_payload(file) for file in document.files.all()],
            },
            status=201,
        )

    documents = _document_queryset().filter(project=project)
    return JsonResponse(project_documents_payload(project, documents))


@require_http_methods(["GET", "PATCH"])
def api_document_file_detail(request, file_id):
    file = get_object_or_404(PaperFile.objects.select_related("document", "document__project"), id=file_id)
    if request.method == "PATCH":
        payload = _json_payload(request)
        if "content" not in payload:
            return JsonResponse({"error": "content is required"}, status=400)
        file.content = str(payload["content"])
        file.save(update_fields=["content", "updated_at"])
        file.refresh_from_db()
    return JsonResponse(paper_file_payload(file))


def _document_queryset():
    return PaperDocument.objects.select_related("project").prefetch_related("files")


def _json_payload(request) -> dict:
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}
