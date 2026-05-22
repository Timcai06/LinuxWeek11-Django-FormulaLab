from apps.formulas.models import FormulaItem


def confirm_formula_item_review(item: FormulaItem, latex_current: str) -> FormulaItem:
    cleaned_latex = (latex_current or "").strip()
    if cleaned_latex:
        item.latex_current = cleaned_latex
    item.status = FormulaItem.Status.CONFIRMED
    item.save(update_fields=["latex_current", "status", "updated_at"])
    return item
