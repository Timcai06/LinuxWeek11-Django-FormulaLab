from apps.formulas.models import PaperDocument, PaperFile, PaperFileVersion, PaperProject


def paper_file_payload(file: PaperFile) -> dict:
    return {
        "id": str(file.id),
        "document_id": str(file.document_id),
        "path": file.path,
        "file_type": file.file_type,
        "content": file.content,
        "sort_order": file.sort_order,
        "created_at": file.created_at.isoformat(),
        "updated_at": file.updated_at.isoformat(),
    }


def paper_file_version_payload(version: PaperFileVersion) -> dict:
    return {
        "id": str(version.id),
        "file_id": str(version.file_id),
        "version_number": version.version_number,
        "content": version.content,
        "source": version.source,
        "created_by_label": version.created_by_label,
        "note": version.note,
        "created_at": version.created_at.isoformat(),
    }


def paper_file_versions_payload(file: PaperFile, versions) -> dict:
    return {
        "file_id": str(file.id),
        "versions": [paper_file_version_payload(version) for version in versions],
    }


def paper_document_payload(document: PaperDocument, *, include_files: bool = True) -> dict:
    payload = {
        "id": str(document.id),
        "document_code": document.document_code,
        "project_id": str(document.project_id),
        "title": document.title,
        "root_file_path": document.root_file_path,
        "created_at": document.created_at.isoformat(),
        "updated_at": document.updated_at.isoformat(),
    }
    if include_files:
        payload["files"] = [paper_file_payload(file) for file in document.files.all()]
    return payload


def project_documents_payload(project: PaperProject, documents) -> dict:
    return {
        "project": {
            "id": str(project.id),
            "project_code": project.project_code,
            "name": project.name,
        },
        "documents": [paper_document_payload(document) for document in documents],
    }
