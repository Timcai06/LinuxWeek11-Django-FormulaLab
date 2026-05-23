from django.test import TestCase

from apps.formulas.models import BatchMission, FormulaItem, FormulaItemVersion, PaperProject
from apps.formulas.services.project_items import confirm_formula_item_review


class ProjectItemServiceTests(TestCase):
    def test_confirm_formula_item_review_updates_latex_and_status(self):
        project = PaperProject.objects.create(name="Review service")
        batch = BatchMission.objects.create(project=project, title="Manual corrections")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha",
            status=FormulaItem.Status.NEEDS_REVIEW,
        )

        reviewed_item = confirm_formula_item_review(item, r"  \beta + \gamma  ")

        item.refresh_from_db()
        self.assertEqual(reviewed_item.id, item.id)
        self.assertEqual(item.latex_current, r"\beta + \gamma")
        self.assertEqual(item.status, FormulaItem.Status.CONFIRMED)
        version = item.versions.get()
        self.assertEqual(version.latex, r"\beta + \gamma")
        self.assertEqual(version.source, FormulaItemVersion.Source.MANUAL)
        self.assertEqual(version.created_by_label, "review")

    def test_confirm_formula_item_review_keeps_existing_latex_when_input_is_blank(self):
        project = PaperProject.objects.create(name="Blank review service")
        batch = BatchMission.objects.create(project=project, title="Manual corrections")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"E=mc^2",
            status=FormulaItem.Status.NEEDS_REVIEW,
        )

        confirm_formula_item_review(item, "   ")

        item.refresh_from_db()
        self.assertEqual(item.latex_current, r"E=mc^2")
        self.assertEqual(item.status, FormulaItem.Status.CONFIRMED)
        self.assertFalse(item.versions.exists())
