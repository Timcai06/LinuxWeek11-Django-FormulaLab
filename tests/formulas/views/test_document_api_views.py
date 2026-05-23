from apps.formulas.models import PaperDocument, PaperFile, PaperProject
from tests.formulas.views.base import FormulaViewTestCase


class PaperDocumentApiViewTests(FormulaViewTestCase):
    def test_api_project_documents_post_creates_default_document(self):
        project = PaperProject.objects.create(name="API manuscript")

        response = self.client.post(
            f"/api/projects/{project.id}/documents/",
            data='{"title": "Draft one"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["document"]["title"], "Draft one")
        self.assertEqual(payload["document"]["root_file_path"], "main.tex")
        self.assertEqual(payload["files"][0]["path"], "main.tex")
        self.assertIn(r"\documentclass{article}", payload["files"][0]["content"])
        self.assertEqual(project.documents.count(), 1)

    def test_api_project_documents_get_returns_documents_and_files(self):
        project = PaperProject.objects.create(name="API document list")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content=r"\section{Intro}")

        response = self.client.get(f"/api/projects/{project.id}/documents/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project"]["id"], str(project.id))
        self.assertEqual(payload["documents"][0]["id"], str(document.id))
        self.assertEqual(payload["documents"][0]["files"][0]["id"], str(file.id))
        self.assertEqual(payload["documents"][0]["files"][0]["content"], r"\section{Intro}")

    def test_api_document_file_patch_updates_content(self):
        project = PaperProject.objects.create(name="API file save")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="old")

        response = self.client.generic(
            "PATCH",
            f"/api/document-files/{file.id}/",
            data='{"content": "\\\\section{Method}"}',
            content_type="application/json",
        )

        file.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(file.content, r"\section{Method}")
        self.assertEqual(response.json()["content"], r"\section{Method}")
