from dataclasses import dataclass

from apps.formulas.models import FormulaItem, PaperProject


@dataclass(frozen=True)
class ExportFormula:
    code: str
    batch_title: str
    latex: str
    status: str
    quality_score: int


def collect_export_formulas(project: PaperProject) -> list[ExportFormula]:
    items = (
        project.formula_items.select_related("batch", "recognition_job")
        .exclude(status=FormulaItem.Status.REJECTED)
        .order_by("batch__created_at", "sort_order", "created_at")
    )
    formulas = []
    for item in items:
        latex = _formula_item_latex(item)
        if not latex:
            continue
        formulas.append(
            ExportFormula(
                code=item.formula_code,
                batch_title=item.batch.title,
                latex=latex,
                status=item.status,
                quality_score=item.quality_score,
            )
        )
    return formulas


def render_latex_export(project: PaperProject, formulas: list[ExportFormula]) -> str:
    lines = [
        "% Formula Lab LaTeX export",
        f"% Project: {project.name}",
        f"% Project Code: {project.project_code}",
        "",
    ]
    for formula in formulas:
        lines.extend(
            [
                f"% Formula: {formula.code}",
                f"% Batch: {formula.batch_title}",
                f"% Status: {formula.status}; Quality: {formula.quality_score}",
                r"\begin{equation}",
                formula.latex,
                r"\end{equation}",
                "",
            ]
        )
    return "\n".join(lines).rstrip() + "\n"


def render_markdown_export(project: PaperProject, formulas: list[ExportFormula]) -> str:
    lines = [
        f"# {project.name}",
        "",
        f"`{project.project_code}` Formula Lab export",
        "",
    ]
    current_batch = None
    for formula in formulas:
        if formula.batch_title != current_batch:
            current_batch = formula.batch_title
            lines.extend([f"## {current_batch}", ""])
        lines.extend(
            [
                f"<!-- {formula.code} | {formula.status} | Q {formula.quality_score} -->",
                "$$",
                formula.latex,
                "$$",
                "",
            ]
        )
    return "\n".join(lines).rstrip() + "\n"


def export_filename(project: PaperProject, extension: str) -> str:
    return f"{project.project_code}-formula-export.{extension}"


def _formula_item_latex(item: FormulaItem) -> str:
    if item.latex_current:
        return item.latex_current
    if item.recognition_job and item.recognition_job.latex_result:
        return item.recognition_job.latex_result
    return ""
