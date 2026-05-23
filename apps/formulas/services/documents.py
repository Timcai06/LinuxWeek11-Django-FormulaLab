from django.db import transaction

from apps.formulas.models import PaperDocument, PaperFile, PaperProject


def create_default_document(project: PaperProject, *, title: str = "") -> PaperDocument:
    document_title = (title or "").strip() or f"{project.name} manuscript"
    with transaction.atomic():
        document = PaperDocument.objects.create(
            project=project,
            title=document_title,
            root_file_path="main.tex",
        )
        PaperFile.objects.create(
            document=document,
            path="main.tex",
            file_type=PaperFile.FileType.TEX,
            content=_default_main_tex(project),
        )
    return document


def create_document_file(document: PaperDocument, *, path: str, content: str = "") -> PaperFile:
    return PaperFile.objects.create(
        document=document,
        path=path,
        content=content,
        file_type=paper_file_type_for_path(path),
        sort_order=document.files.count(),
    )


def update_document_file(file: PaperFile, *, path: str | None = None, content: str | None = None) -> PaperFile:
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
    file.save(update_fields=update_fields)
    file.refresh_from_db()
    return file


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
