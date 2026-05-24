from apps.formulas.models import PaperDocument, PaperFile, PaperFileVersion, PaperProject
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
        version = file.versions.get()
        self.assertEqual(version.content, r"\section{Method}")
        self.assertEqual(version.source, PaperFileVersion.Source.MANUAL_SAVE)
        self.assertEqual(version.created_by_label, "api")

    def test_api_document_file_versions_returns_latest_first_timeline(self):
        project = PaperProject.objects.create(name="API file versions")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="latest")
        first = PaperFileVersion.objects.create(
            file=file,
            content="old",
            source=PaperFileVersion.Source.SYSTEM,
            created_by_label="system",
            note="initial",
        )
        second = PaperFileVersion.objects.create(
            file=file,
            content="latest",
            source=PaperFileVersion.Source.MANUAL_SAVE,
            created_by_label="api",
            note="saved",
        )

        response = self.client.get(f"/api/document-files/{file.id}/versions/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["file_id"], str(file.id))
        self.assertEqual([version["id"] for version in payload["versions"]], [str(second.id), str(first.id)])
        self.assertEqual(payload["versions"][0]["version_number"], 2)
        self.assertEqual(payload["versions"][0]["content"], "latest")
        self.assertEqual(payload["versions"][0]["source"], PaperFileVersion.Source.MANUAL_SAVE)
        self.assertEqual(payload["versions"][0]["created_by_label"], "api")
        self.assertEqual(payload["versions"][0]["note"], "saved")

    def test_api_document_file_version_restore_updates_content_and_creates_audit_version(self):
        project = PaperProject.objects.create(name="API file restore")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="current")
        old_version = PaperFileVersion.objects.create(
            file=file,
            content="old",
            source=PaperFileVersion.Source.SYSTEM,
            created_by_label="system",
        )
        PaperFileVersion.objects.create(
            file=file,
            content="current",
            source=PaperFileVersion.Source.MANUAL_SAVE,
            created_by_label="api",
        )

        response = self.client.post(f"/api/document-files/{file.id}/versions/{old_version.id}/restore/")

        file.refresh_from_db()
        restored = file.versions.first()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(file.content, "old")
        self.assertEqual(restored.content, "old")
        self.assertEqual(restored.source, PaperFileVersion.Source.RESTORE)
        self.assertEqual(restored.created_by_label, "api")
        self.assertIn(str(old_version.version_number), restored.note)
        self.assertEqual(response.json()["file"]["content"], "old")
        self.assertEqual(response.json()["version"]["id"], str(restored.id))

    def test_api_document_file_version_restore_rejects_other_file_version(self):
        project = PaperProject.objects.create(name="API file restore guard")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="current")
        other_file = PaperFile.objects.create(document=document, path="sections/other.tex", content="other")
        other_version = PaperFileVersion.objects.create(
            file=other_file,
            content="other old",
            source=PaperFileVersion.Source.SYSTEM,
        )

        response = self.client.post(f"/api/document-files/{file.id}/versions/{other_version.id}/restore/")

        file.refresh_from_db()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(file.content, "current")

    def test_api_document_files_post_creates_project_file(self):
        project = PaperProject.objects.create(name="API file create")
        document = PaperDocument.objects.create(project=project, title="Main")
        PaperFile.objects.create(document=document, path="main.tex", content="root")

        response = self.client.post(
            f"/api/documents/{document.id}/files/",
            data='{"path": "sections/method.tex", "content": "\\\\section{Method}"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["path"], "sections/method.tex")
        self.assertEqual(payload["file_type"], PaperFile.FileType.TEX)
        self.assertEqual(payload["content"], r"\section{Method}")
        self.assertTrue(document.files.filter(path="sections/method.tex").exists())

    def test_api_document_file_patch_updates_path_and_content(self):
        project = PaperProject.objects.create(name="API file rename")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="draft.tex", content="old")

        response = self.client.generic(
            "PATCH",
            f"/api/document-files/{file.id}/",
            data='{"path": "sections/results.tex", "content": "\\\\section{Results}"}',
            content_type="application/json",
        )

        file.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(file.path, "sections/results.tex")
        self.assertEqual(file.content, r"\section{Results}")

    def test_api_document_file_rejects_duplicate_rename(self):
        project = PaperProject.objects.create(name="API file duplicate")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="draft.tex", content="old")
        PaperFile.objects.create(document=document, path="main.tex", content="root")

        response = self.client.generic(
            "PATCH",
            f"/api/document-files/{file.id}/",
            data='{"path": "main.tex"}',
            content_type="application/json",
        )

        file.refresh_from_db()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(file.path, "draft.tex")

    def test_api_document_file_delete_removes_non_root_file(self):
        project = PaperProject.objects.create(name="API file delete")
        document = PaperDocument.objects.create(project=project, title="Main", root_file_path="main.tex")
        PaperFile.objects.create(document=document, path="main.tex", content="root")
        file = PaperFile.objects.create(document=document, path="sections/draft.tex", content="draft")

        response = self.client.delete(f"/api/document-files/{file.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(document.files.filter(path="sections/draft.tex").exists())

    def test_api_document_file_delete_rejects_root_file(self):
        project = PaperProject.objects.create(name="API root delete")
        document = PaperDocument.objects.create(project=project, title="Main", root_file_path="main.tex")
        file = PaperFile.objects.create(document=document, path="main.tex", content="root")
        PaperFile.objects.create(document=document, path="sections/method.tex", content="method")

        response = self.client.delete(f"/api/document-files/{file.id}/")

        self.assertEqual(response.status_code, 400)
        self.assertTrue(document.files.filter(path="main.tex").exists())
