from apps.formulas.models import PaperAnnotation, PaperDocument, PaperFile, PaperFileVersion, PaperProject
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

    def test_api_document_file_annotations_returns_file_annotations(self):
        project = PaperProject.objects.create(name="API annotations list")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="alpha")
        other_file = PaperFile.objects.create(document=document, path="sections/other.tex", content="beta")
        annotation = PaperAnnotation.objects.create(
            file=file,
            line_start=2,
            line_end=2,
            char_start=4,
            char_end=9,
            quoted_text="alpha",
            body="Check symbol definition.",
            created_by_label="reviewer",
        )
        PaperAnnotation.objects.create(
            file=other_file,
            line_start=1,
            line_end=1,
            body="Other file note.",
        )

        response = self.client.get(f"/api/document-files/{file.id}/annotations/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["file_id"], str(file.id))
        self.assertEqual(len(payload["annotations"]), 1)
        self.assertEqual(payload["annotations"][0]["id"], str(annotation.id))
        self.assertEqual(payload["annotations"][0]["body"], "Check symbol definition.")
        self.assertEqual(payload["annotations"][0]["status"], PaperAnnotation.Status.OPEN)
        self.assertEqual(payload["annotations"][0]["created_by_label"], "reviewer")

    def test_api_document_file_annotations_post_creates_annotation(self):
        project = PaperProject.objects.create(name="API annotations create")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="alpha")

        response = self.client.post(
            f"/api/document-files/{file.id}/annotations/",
            data=(
                '{"line_start": 3, "line_end": 4, "char_start": 2, "char_end": 8, '
                '"quoted_text": "alpha", "body": "Clarify the derivation."}'
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        annotation = file.annotations.get()
        self.assertEqual(annotation.line_start, 3)
        self.assertEqual(annotation.line_end, 4)
        self.assertEqual(annotation.char_start, 2)
        self.assertEqual(annotation.char_end, 8)
        self.assertEqual(annotation.quoted_text, "alpha")
        self.assertEqual(annotation.body, "Clarify the derivation.")
        self.assertEqual(annotation.created_by_label, "api")
        self.assertEqual(response.json()["id"], str(annotation.id))

    def test_api_document_file_annotations_post_rejects_invalid_anchor(self):
        project = PaperProject.objects.create(name="API annotations invalid")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="alpha")

        response = self.client.post(
            f"/api/document-files/{file.id}/annotations/",
            data='{"line_start": 4, "line_end": 3, "body": "Bad anchor."}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(file.annotations.count(), 0)

    def test_api_paper_annotation_patch_updates_status_and_resolved_at(self):
        project = PaperProject.objects.create(name="API annotation patch")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="alpha")
        annotation = PaperAnnotation.objects.create(
            file=file,
            line_start=1,
            line_end=1,
            body="Resolve me.",
        )

        response = self.client.generic(
            "PATCH",
            f"/api/paper-annotations/{annotation.id}/",
            data='{"status": "resolved", "body": "Resolved after rewrite."}',
            content_type="application/json",
        )

        annotation.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(annotation.status, PaperAnnotation.Status.RESOLVED)
        self.assertEqual(annotation.body, "Resolved after rewrite.")
        self.assertIsNotNone(annotation.resolved_at)
        self.assertEqual(response.json()["resolved_at"], annotation.resolved_at.isoformat())

    def test_api_paper_annotation_patch_rejects_invalid_status(self):
        project = PaperProject.objects.create(name="API annotation invalid status")
        document = PaperDocument.objects.create(project=project, title="Main")
        file = PaperFile.objects.create(document=document, path="main.tex", content="alpha")
        annotation = PaperAnnotation.objects.create(
            file=file,
            line_start=1,
            line_end=1,
            body="Keep me open.",
        )

        response = self.client.generic(
            "PATCH",
            f"/api/paper-annotations/{annotation.id}/",
            data='{"status": "done"}',
            content_type="application/json",
        )

        annotation.refresh_from_db()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(annotation.status, PaperAnnotation.Status.OPEN)

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
