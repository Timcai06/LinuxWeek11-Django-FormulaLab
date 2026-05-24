import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from apps.formulas.models import PaperAnnotation, PaperDocument, PaperFile, PaperFileVersion, PaperProject
from apps.formulas.presenters.document_api import (
    paper_annotation_payload,
    paper_annotations_payload,
    paper_document_payload,
    paper_file_payload,
    paper_file_version_payload,
    paper_file_versions_payload,
    project_documents_payload,
)
from apps.formulas.services.annotations import create_paper_annotation, update_paper_annotation
from apps.formulas.services.documents import (
    create_default_document,
    create_document_file,
    restore_document_file_version,
    update_document_file,
)


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


@require_http_methods(["POST"])
def api_document_files(request, document_id):
    document = get_object_or_404(PaperDocument.objects.select_related("project"), id=document_id)
    payload = _json_payload(request)
    path = str(payload.get("path", "")).strip()
    if not path:
        return JsonResponse({"error": "path is required"}, status=400)

    try:
        file = create_document_file(
            document,
            path=path,
            content=str(payload.get("content", "")),
            created_by_label="api",
        )
    except (IntegrityError, ValidationError) as error:
        return JsonResponse({"error": _validation_error_message(error)}, status=400)

    return JsonResponse(paper_file_payload(file), status=201)


@require_http_methods(["DELETE", "GET", "PATCH"])
def api_document_file_detail(request, file_id):
    file = get_object_or_404(PaperFile.objects.select_related("document", "document__project"), id=file_id)
    if request.method == "DELETE":
        if file.path == file.document.root_file_path or file.document.files.count() <= 1:
            return JsonResponse({"error": "Root paper file cannot be deleted."}, status=400)
        file.delete()
        return HttpResponse(status=204)

    if request.method == "PATCH":
        payload = _json_payload(request)
        path = str(payload["path"]).strip() if "path" in payload else None
        content = str(payload["content"]) if "content" in payload else None
        if path is None and content is None:
            return JsonResponse({"error": "path or content is required"}, status=400)
        try:
            file = update_document_file(file, path=path, content=content, created_by_label="api")
        except (IntegrityError, ValidationError) as error:
            return JsonResponse({"error": _validation_error_message(error)}, status=400)
    return JsonResponse(paper_file_payload(file))


@require_http_methods(["GET"])
def api_document_file_versions(request, file_id):
    file = get_object_or_404(PaperFile, id=file_id)
    versions = file.versions.all()
    return JsonResponse(paper_file_versions_payload(file, versions))


@require_http_methods(["POST"])
def api_document_file_version_restore(request, file_id, version_id):
    file = get_object_or_404(PaperFile.objects.select_related("document", "document__project"), id=file_id)
    version = get_object_or_404(PaperFileVersion, id=version_id, file=file)
    file, restored_version = restore_document_file_version(file, version, created_by_label="api")
    return JsonResponse(
        {
            "file": paper_file_payload(file),
            "version": paper_file_version_payload(restored_version),
        }
    )


@require_http_methods(["GET", "POST"])
def api_document_file_annotations(request, file_id):
    file = get_object_or_404(PaperFile.objects.select_related("document", "document__project"), id=file_id)
    if request.method == "POST":
        payload = _json_payload(request)
        body = str(payload.get("body", "")).strip()
        if not body:
            return JsonResponse({"error": "body is required"}, status=400)
        try:
            annotation = create_paper_annotation(
                file,
                line_start=_payload_int(payload, "line_start"),
                line_end=_payload_int(payload, "line_end"),
                char_start=_payload_int(payload, "char_start", default=0),
                char_end=_payload_int(payload, "char_end", default=0),
                quoted_text=str(payload.get("quoted_text", "")),
                body=body,
                created_by_label="api",
            )
        except (TypeError, ValueError, ValidationError) as error:
            return JsonResponse({"error": _validation_error_message(error)}, status=400)
        return JsonResponse(paper_annotation_payload(annotation), status=201)

    return JsonResponse(paper_annotations_payload(file, file.annotations.all()))


@require_http_methods(["PATCH"])
def api_paper_annotation_detail(request, annotation_id):
    annotation = get_object_or_404(PaperAnnotation.objects.select_related("file"), id=annotation_id)
    payload = _json_payload(request)
    body = str(payload["body"]).strip() if "body" in payload else None
    status = str(payload["status"]).strip() if "status" in payload else None
    if body is None and status is None:
        return JsonResponse({"error": "body or status is required"}, status=400)
    try:
        annotation = update_paper_annotation(annotation, body=body, status=status)
    except ValidationError as error:
        return JsonResponse({"error": _validation_error_message(error)}, status=400)
    return JsonResponse(paper_annotation_payload(annotation))


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


def _validation_error_message(error: IntegrityError | ValidationError) -> str:
    if isinstance(error, ValidationError):
        messages = getattr(error, "messages", None)
        if messages:
            return " ".join(messages)
    if isinstance(error, (TypeError, ValueError)):
        return str(error)
    return "Paper file path must be unique and safe."


def _payload_int(payload: dict, key: str, *, default: int | None = None) -> int:
    if key not in payload:
        if default is None:
            raise ValueError(f"{key} is required")
        return default
    return int(payload[key])
