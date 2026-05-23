from apps.formulas.models import BatchMission, FormulaItem, FormulaItemVersion, PaperProject
from tests.formulas.views.base import FormulaViewTestCase


class FormulaProjectApiViewTests(FormulaViewTestCase):
    def test_api_project_items_returns_formula_item_list(self):
        project = PaperProject.objects.create(name="API workspace")
        batch = BatchMission.objects.create(project=project, title="Chapter 2")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha+\beta",
            status=FormulaItem.Status.NEEDS_REVIEW,
            sort_order=3,
        )

        response = self.client.get(f"/api/projects/{project.id}/items/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project"]["id"], str(project.id))
        self.assertEqual(payload["items"][0]["id"], str(item.id))
        self.assertEqual(payload["items"][0]["formula_code"], item.formula_code)
        self.assertEqual(payload["items"][0]["latex_current"], r"\alpha+\beta")
        self.assertEqual(payload["items"][0]["review_status"], FormulaItem.Status.NEEDS_REVIEW)

    def test_api_formula_item_detail_returns_latest_version(self):
        project = PaperProject.objects.create(name="API detail")
        batch = BatchMission.objects.create(project=project, title="Chapter 3")
        item = FormulaItem.objects.create(project=project, batch=batch, latex_current=r"E=mc^2")
        version = FormulaItemVersion.objects.create(
            item=item,
            latex=r"E=mc^2",
            source=FormulaItemVersion.Source.OCR,
            created_by_label="paddle",
        )

        response = self.client.get(f"/api/formula-items/{item.id}/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], str(item.id))
        self.assertEqual(payload["latest_version"]["id"], version.id)
        self.assertEqual(payload["latest_version"]["source"], FormulaItemVersion.Source.OCR)

    def test_api_formula_item_patch_updates_latex_and_creates_version(self):
        project = PaperProject.objects.create(name="API patch")
        batch = BatchMission.objects.create(project=project, title="Chapter 4")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha",
            status=FormulaItem.Status.NEEDS_REVIEW,
        )

        response = self.client.generic(
            "PATCH",
            f"/api/formula-items/{item.id}/",
            data='{"latex_current": "  \\\\beta + \\\\gamma  "}',
            content_type="application/json",
        )

        item.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(item.latex_current, r"\beta + \gamma")
        self.assertEqual(item.status, FormulaItem.Status.EDITED)
        version = item.versions.get()
        self.assertEqual(version.latex, r"\beta + \gamma")
        self.assertEqual(version.source, FormulaItemVersion.Source.MANUAL)
        self.assertEqual(version.created_by_label, "api")

    def test_api_formula_item_versions_returns_timeline(self):
        project = PaperProject.objects.create(name="API versions")
        batch = BatchMission.objects.create(project=project, title="Chapter 5")
        item = FormulaItem.objects.create(project=project, batch=batch, latex_current=r"\beta")
        first = FormulaItemVersion.objects.create(
            item=item,
            latex=r"\alpha",
            source=FormulaItemVersion.Source.OCR,
            created_by_label="paddle",
        )
        second = FormulaItemVersion.objects.create(
            item=item,
            latex=r"\beta",
            source=FormulaItemVersion.Source.MANUAL,
            created_by_label="api",
        )

        response = self.client.get(f"/api/formula-items/{item.id}/versions/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual([version["id"] for version in payload["versions"]], [second.id, first.id])

    def test_api_formula_item_versions_post_creates_manual_version(self):
        project = PaperProject.objects.create(name="API version create")
        batch = BatchMission.objects.create(project=project, title="Chapter 6")
        item = FormulaItem.objects.create(project=project, batch=batch, latex_current=r"\alpha")

        response = self.client.post(
            f"/api/formula-items/{item.id}/versions/",
            data='{"latex": "\\\\delta", "note": "fixed subscript"}',
            content_type="application/json",
        )

        item.refresh_from_db()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(item.latex_current, r"\delta")
        version = item.versions.get()
        self.assertEqual(version.latex, r"\delta")
        self.assertEqual(version.source, FormulaItemVersion.Source.MANUAL)
        self.assertEqual(version.created_by_label, "api")
        self.assertEqual(version.note, "fixed subscript")
