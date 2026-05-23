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
