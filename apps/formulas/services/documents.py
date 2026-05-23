from django.db import transaction

from apps.formulas.models import PaperDocument, PaperFile, PaperFileVersion, PaperProject


def create_default_document(project: PaperProject, *, title: str = "") -> PaperDocument:
    document_title = (title or "").strip() or f"{project.name} manuscript"
    with transaction.atomic():
        document = PaperDocument.objects.create(
            project=project,
            title=document_title,
            root_file_path="main.tex",
        )
        main_file = PaperFile.objects.create(
            document=document,
            path="main.tex",
            file_type=PaperFile.FileType.TEX,
            content=_default_main_tex(project),
        )
        record_paper_file_version(
            main_file,
            source=PaperFileVersion.Source.SYSTEM,
            created_by_label="system",
            note="Initial manuscript scaffold.",
        )
    return document


def create_document_file(
    document: PaperDocument,
    *,
    path: str,
    content: str = "",
    created_by_label: str = "",
) -> PaperFile:
    with transaction.atomic():
        file = PaperFile.objects.create(
            document=document,
            path=path,
            content=content,
            file_type=paper_file_type_for_path(path),
            sort_order=document.files.count(),
        )
        record_paper_file_version(
            file,
            source=PaperFileVersion.Source.MANUAL_SAVE,
            created_by_label=created_by_label,
            note="Initial file content.",
        )
    return file


def update_document_file(
    file: PaperFile,
    *,
    path: str | None = None,
    content: str | None = None,
    created_by_label: str = "",
    note: str = "",
) -> PaperFile:
    update_fields = ["updated_at"]
    if path is not None:
        file.path = path
        file.file_type = paper_file_type_for_path(path)
        update_fields.extend(["path", "file_type"])
    if content is not None:
        file.content = content
        update_fields.append("content")
    if len(update_fields) == 1:
        return file
    with transaction.atomic():
        file.save(update_fields=update_fields)
        file.refresh_from_db()
        if content is not None:
            record_paper_file_version(
                file,
                source=PaperFileVersion.Source.MANUAL_SAVE,
                created_by_label=created_by_label,
                note=note,
            )
    return file


def record_paper_file_version(
    file: PaperFile,
    *,
    source: str,
    created_by_label: str = "",
    note: str = "",
) -> PaperFileVersion:
    return PaperFileVersion.objects.create(
        file=file,
        content=file.content,
        source=source,
        created_by_label=created_by_label,
        note=note,
    )


def paper_file_type_for_path(path: str) -> str:
    suffix = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    if suffix == "bib":
        return PaperFile.FileType.BIB
    if suffix in {"md", "markdown"}:
        return PaperFile.FileType.MARKDOWN
    if suffix == "txt":
        return PaperFile.FileType.TEXT
    return PaperFile.FileType.TEX


def _default_main_tex(project: PaperProject) -> str:
    return "\n".join(
        [
            r"\documentclass{article}",
            r"\usepackage{amsmath}",
            "",
            rf"\title{{{project.name}}}",
            r"\author{}",
            r"\date{}",
            "",
            r"\begin{document}",
            r"\maketitle",
            "",
            r"\section{Introduction}",
            "",
            r"\end{document}",
            "",
        ]
    )
