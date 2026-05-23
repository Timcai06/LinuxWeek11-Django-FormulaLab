from django.http import QueryDict
from django.test import TestCase

from apps.formulas.models import BatchMission, FormulaItem, FormulaJob, PaperProject
from apps.formulas.presenters.projects import build_project_index_context, build_project_workspace_context


class ProjectWorkspacePresenterTests(TestCase):
    def test_build_project_index_context_owns_project_card_metrics(self):
        project = PaperProject.objects.create(name="Index workspace", writing_goal="Collect equations")
        batch = BatchMission.objects.create(project=project, title="Section 2")
        FormulaItem.objects.create(project=project, batch=batch, status=FormulaItem.Status.NEEDS_REVIEW)
        FormulaItem.objects.create(project=project, batch=batch, status=FormulaItem.Status.CONFIRMED)

        context = build_project_index_context()

        self.assertEqual([entry.id for entry in context["projects"]], [project.id])
        metrics = context["project_metrics"][str(project.id)]
        self.assertEqual(metrics["total_formulas"], 2)
        self.assertEqual(metrics["batch_count"], 1)
        self.assertEqual(metrics["needs_review"], 1)
        self.assertEqual(metrics["ready_to_export"], 1)
        self.assertEqual(metrics["latest_batch"], batch)

    def test_build_project_workspace_context_owns_workspace_view_model(self):
        project = PaperProject.objects.create(name="Presenter workspace")
        batch = BatchMission.objects.create(project=project, title="Chapter formulas")
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha",
            status=FormulaItem.Status.NEEDS_REVIEW,
            quality_score=42,
            sort_order=1,
        )
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\beta",
            status=FormulaItem.Status.CONFIRMED,
            quality_score=91,
            sort_order=2,
        )
        job = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.SUCCEEDED,
            latex_result=r"\gamma",
        )
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            recognition_job=job,
            status=FormulaItem.Status.AUTO_READY,
            quality_score=88,
            sort_order=3,
        )

        context = build_project_workspace_context(
            project,
            query_params=QueryDict("status=confirmed&page=2"),
            request_path=f"/projects/{project.id}/",
        )

        self.assertEqual(context["project"], project)
        self.assertEqual(context["overview"]["total_formulas"], 3)
        self.assertEqual(context["overview"]["needs_review"], 1)
        self.assertEqual(context["overview"]["ready_to_export"], 2)
        self.assertEqual(context["overview"]["completion_rate"], 66)
        self.assertEqual([item["latex"] for item in context["paper_preview_items"]], [r"\alpha", r"\beta", r"\gamma"])
        self.assertNotIn("formula_items", context)
        self.assertNotIn("review_items", context)
        self.assertNotIn("active_item_status", context)
        self.assertNotIn("status_filter_links", context)

    def test_build_project_workspace_context_does_not_emit_legacy_review_queue_state(self):
        project = PaperProject.objects.create(name="React-owned review workspace")
        batch = BatchMission.objects.create(project=project, title="Formula screenshots")
        FormulaItem.objects.create(project=project, batch=batch, latex_current=r"\alpha")

        context = build_project_workspace_context(
            project,
            query_params=QueryDict("status=needs_review&page=2"),
            request_path=f"/projects/{project.id}/",
        )

        self.assertNotIn("formula_items", context)
        self.assertNotIn("review_items", context)
        self.assertNotIn("active_item_status", context)
        self.assertNotIn("status_filter_links", context)
        self.assertNotIn("item_page_obj", context)
        self.assertNotIn("next_item_querystring", context)
        self.assertNotIn("previous_item_querystring", context)
        self.assertEqual(context["paper_preview_items"][0]["latex"], r"\alpha")
