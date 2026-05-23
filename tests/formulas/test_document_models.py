from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from apps.formulas.models import (
    PaperAnnotation,
    PaperChangeSuggestion,
    PaperDocument,
    PaperFile,
    PaperFileVersion,
    PaperProject,
    ProjectMembership,
)


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

    def test_paper_file_versions_increment_per_file_and_latest_first(self):
        project = PaperProject.objects.create(name="Versioned manuscript")
        document = PaperDocument.objects.create(project=project, title="Draft")
        file = PaperFile.objects.create(document=document, path="main.tex", content="v2")

        first = PaperFileVersion.objects.create(
            file=file,
            content="v1",
            source=PaperFileVersion.Source.MANUAL_SAVE,
            created_by_label="tim",
        )
        second = PaperFileVersion.objects.create(
            file=file,
            content="v2",
            source=PaperFileVersion.Source.AUTOSAVE,
            created_by_label="autosave",
        )

        self.assertEqual(first.version_number, 1)
        self.assertEqual(second.version_number, 2)
        self.assertEqual(list(file.versions.all()), [second, first])
        self.assertEqual(str(second), f"{file.path} v2")

    def test_project_membership_links_user_to_project_with_role(self):
        user = get_user_model().objects.create_user(username="paper-editor")
        project = PaperProject.objects.create(name="Shared manuscript")

        membership = ProjectMembership.objects.create(
            project=project,
            user=user,
            role=ProjectMembership.Role.EDITOR,
            display_name="Paper Editor",
        )

        self.assertEqual(project.memberships.get(), membership)
        self.assertEqual(user.formula_project_memberships.get(), membership)
        self.assertEqual(str(membership), f"{project.project_code} paper-editor editor")

    def test_project_membership_is_unique_per_user_and_project(self):
        user = get_user_model().objects.create_user(username="duplicate-member")
        project = PaperProject.objects.create(name="Membership uniqueness")
        ProjectMembership.objects.create(project=project, user=user)

        with self.assertRaises(ValidationError):
            ProjectMembership(project=project, user=user).validate_unique()

    def test_annotations_and_suggestions_anchor_to_paper_file_ranges(self):
        user = get_user_model().objects.create_user(username="reviewer")
        project = PaperProject.objects.create(name="Annotated manuscript")
        document = PaperDocument.objects.create(project=project, title="Draft")
        file = PaperFile.objects.create(document=document, path="sections/method.tex", content="old")

        annotation = PaperAnnotation.objects.create(
            file=file,
            line_start=4,
            line_end=5,
            char_start=2,
            char_end=24,
            quoted_text="old equation",
            body="Check this derivation.",
            created_by=user,
            created_by_label="reviewer",
        )
        suggestion = PaperChangeSuggestion.objects.create(
            annotation=annotation,
            file=file,
            line_start=4,
            line_end=5,
            char_start=2,
            char_end=24,
            original_text="old equation",
            replacement_text="new equation",
            created_by=user,
            created_by_label="reviewer",
        )

        self.assertEqual(file.annotations.get(), annotation)
        self.assertEqual(annotation.suggestions.get(), suggestion)
        self.assertEqual(suggestion.status, PaperChangeSuggestion.Status.OPEN)
        self.assertEqual(str(annotation), f"{file.path}:4-5 open")

    def test_invalid_annotation_anchor_range_is_rejected(self):
        project = PaperProject.objects.create(name="Invalid annotation")
        document = PaperDocument.objects.create(project=project, title="Draft")
        file = PaperFile.objects.create(document=document, path="main.tex", content="")

        with self.assertRaises(ValidationError):
            PaperAnnotation(file=file, line_start=5, line_end=4, body="bad range").full_clean()
