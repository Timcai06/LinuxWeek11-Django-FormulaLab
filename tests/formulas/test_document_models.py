from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from apps.formulas.models import PaperDocument, PaperFile, PaperProject


class PaperDocumentModelTests(TestCase):
    def test_paper_document_and_file_generate_project_scoped_workspace(self):
        project = PaperProject.objects.create(name="Overleaf style paper")
        document = PaperDocument.objects.create(project=project, title="Main manuscript")
        file = PaperFile.objects.create(
            document=document,
            path="main.tex",
            file_type=PaperFile.FileType.TEX,
            content=r"\documentclass{article}",
        )
        today = timezone.localdate().strftime("%Y%m%d")

        self.assertRegex(document.document_code, rf"^FD-{today}-\d{{4}}$")
        self.assertEqual(project.documents.get(), document)
        self.assertEqual(document.files.get(), file)
        self.assertEqual(str(file), f"{document.document_code} main.tex")

    def test_paper_file_rejects_unsafe_paths(self):
        project = PaperProject.objects.create(name="Path safety")
        document = PaperDocument.objects.create(project=project, title="Draft")
        file = PaperFile(document=document, path="../main.tex", content="")

        with self.assertRaises(ValidationError):
            file.full_clean()

    def test_paper_file_path_is_unique_per_document(self):
        project = PaperProject.objects.create(name="Unique file path")
        document = PaperDocument.objects.create(project=project, title="Draft")
        PaperFile.objects.create(document=document, path="main.tex", content="first")

        with self.assertRaises(ValidationError):
            PaperFile(document=document, path="main.tex", content="second").validate_unique()
