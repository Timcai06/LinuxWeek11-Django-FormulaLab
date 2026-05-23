from apps.formulas.models import FormulaItem, FormulaItemVersion, PaperProject


def formula_item_version_payload(version: FormulaItemVersion) -> dict:
    return {
        "id": version.id,
        "latex": version.latex,
        "source": version.source,
        "created_by_label": version.created_by_label,
        "note": version.note,
        "created_at": version.created_at.isoformat(),
    }


def formula_item_payload(item: FormulaItem) -> dict:
    return {
        "id": str(item.id),
        "formula_code": item.formula_code,
        "project_id": str(item.project_id),
        "batch_id": str(item.batch_id),
        "batch_title": item.batch.title,
        "latex_current": item.latex_current,
        "review_status": item.status,
        "quality_score": item.quality_score,
        "quality_flags": item.quality_flags,
        "sort_order": item.sort_order,
        "source_job_code": item.recognition_job.mission_code if item.recognition_job_id else "",
        "created_at": item.created_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }


def formula_item_detail_payload(item: FormulaItem) -> dict:
    payload = formula_item_payload(item)
    latest_version = item.versions.first()
    payload["latest_version"] = formula_item_version_payload(latest_version) if latest_version else None
    return payload


def project_items_payload(project: PaperProject, items) -> dict:
    return {
        "project": {
            "id": str(project.id),
            "project_code": project.project_code,
            "name": project.name,
        },
        "items": [formula_item_payload(item) for item in items],
    }
