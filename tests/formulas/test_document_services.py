from django.test import TestCase

from apps.formulas.models import PaperFile, PaperFileVersion, PaperProject
from apps.formulas.services.documents import create_default_document, create_document_file, update_document_file


class PaperDocumentServiceTests(TestCase):
    def test_create_default_document_creates_main_tex(self):
        project = PaperProject.objects.create(name="Transformer OCR paper")

        document = create_default_document(project, title="Research draft")

        main_file = document.files.get(path="main.tex")
        self.assertEqual(document.project, project)
        self.assertEqual(document.title, "Research draft")
        self.assertEqual(document.root_file_path, "main.tex")
        self.assertEqual(main_file.file_type, PaperFile.FileType.TEX)
        self.assertIn(r"\documentclass{article}", main_file.content)
        self.assertIn("Transformer OCR paper", main_file.content)
        self.assertEqual(main_file.versions.get().source, PaperFileVersion.Source.SYSTEM)

    def test_create_document_file_records_initial_version(self):
        project = PaperProject.objects.create(name="New file version paper")
        document = create_default_document(project, title="Draft")

        file = create_document_file(
            document,
            path="sections/method.tex",
            content=r"\section{Method}",
            created_by_label="api",
        )

        version = file.versions.get()
        self.assertEqual(version.version_number, 1)
        self.assertEqual(version.content, r"\section{Method}")
        self.assertEqual(version.source, PaperFileVersion.Source.MANUAL_SAVE)
        self.assertEqual(version.created_by_label, "api")

    def test_update_document_file_records_content_version(self):
        project = PaperProject.objects.create(name="Save version paper")
        document = create_default_document(project, title="Draft")
        file = document.files.get(path="main.tex")
        file.versions.all().delete()

        updated_file = update_document_file(
            file,
            content=r"\section{Updated}",
            created_by_label="api",
            note="manual editor save",
        )

        version = updated_file.versions.get()
        self.assertEqual(updated_file.content, r"\section{Updated}")
        self.assertEqual(version.version_number, 1)
        self.assertEqual(version.content, r"\section{Updated}")
        self.assertEqual(version.source, PaperFileVersion.Source.MANUAL_SAVE)
        self.assertEqual(version.created_by_label, "api")
        self.assertEqual(version.note, "manual editor save")

    def test_update_document_file_rename_without_content_does_not_record_version(self):
        project = PaperProject.objects.create(name="Rename only paper")
        document = create_default_document(project, title="Draft")
        file = create_document_file(document, path="sections/draft.tex", content="draft")
        file.versions.all().delete()

        updated_file = update_document_file(file, path="sections/renamed.tex", created_by_label="api")

        self.assertEqual(updated_file.path, "sections/renamed.tex")
        self.assertEqual(updated_file.versions.count(), 0)
