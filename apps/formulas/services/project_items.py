from django.db import transaction

from apps.formulas.models import FormulaItem, FormulaItemVersion


def update_formula_item_latex(
    item: FormulaItem,
    latex: str,
    *,
    source: str,
    created_by_label: str = "",
    note: str = "",
    status: str | None = None,
) -> FormulaItem:
    cleaned_latex = (latex or "").strip()
    if not cleaned_latex:
        return item

    item.latex_current = cleaned_latex
    update_fields = ["latex_current", "updated_at"]
    if status:
        item.status = status
        update_fields.append("status")
    item.save(update_fields=update_fields)
    FormulaItemVersion.objects.create(
        item=item,
        latex=cleaned_latex,
        source=source,
        created_by_label=created_by_label,
        note=note,
    )
    return item


def confirm_formula_item_review(item: FormulaItem, latex_current: str) -> FormulaItem:
    cleaned_latex = (latex_current or "").strip()
    with transaction.atomic():
        if cleaned_latex:
            update_formula_item_latex(
                item,
                cleaned_latex,
                source=FormulaItemVersion.Source.MANUAL,
                created_by_label="review",
            )
        item.status = FormulaItem.Status.CONFIRMED
        item.save(update_fields=["status", "updated_at"])
    return item
