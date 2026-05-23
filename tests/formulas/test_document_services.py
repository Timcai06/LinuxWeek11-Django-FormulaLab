from django.test import TestCase

from apps.formulas.models import PaperFile, PaperProject
from apps.formulas.services.documents import create_default_document


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
