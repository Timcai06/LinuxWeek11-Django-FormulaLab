from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.formulas.models import BatchMission, FormulaItem, FormulaJob, PaperProject
from tests.formulas.views.base import FormulaViewTestCase


class FormulaProjectViewTests(FormulaViewTestCase):
    def test_projects_renders_empty_product_workspace_state(self):
        response = self.client.get("/projects/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/projects.html")
        self.assertContains(response, "PAPER WORKSPACES")
        self.assertContains(response, "NO PAPER WORKSPACES")
        self.assertContains(response, 'href="/workbench/"')

    def test_projects_renders_project_cards_with_metrics(self):
        project = PaperProject.objects.create(
            name="Transformer survey",
            writing_goal="Collect attention equations",
            default_export_format=PaperProject.ExportFormat.LATEX,
        )
        batch = BatchMission.objects.create(project=project, title="Section 2")
        FormulaItem.objects.create(project=project, batch=batch, status=FormulaItem.Status.NEEDS_REVIEW)
        FormulaItem.objects.create(project=project, batch=batch, status=FormulaItem.Status.CONFIRMED)

        response = self.client.get("/projects/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, project.project_code)
        self.assertContains(response, "Transformer survey")
        self.assertContains(response, "Collect attention equations")
        self.assertContains(response, 'href="/projects/')
        metrics = response.context["project_metrics"][str(project.id)]
        self.assertEqual(metrics["total_formulas"], 2)
        self.assertEqual(metrics["batch_count"], 1)
        self.assertEqual(metrics["needs_review"], 1)
        self.assertEqual(metrics["ready_to_export"], 1)
        self.assertEqual(metrics["latest_batch"], batch)

    def test_projects_metrics_query_count_does_not_grow_per_project(self):
        for index in range(12):
            project = PaperProject.objects.create(name=f"Paper {index}")
            batch = BatchMission.objects.create(project=project, title=f"Batch {index}")
            FormulaItem.objects.create(project=project, batch=batch, status=FormulaItem.Status.CONFIRMED)
            FormulaItem.objects.create(project=project, batch=batch, status=FormulaItem.Status.NEEDS_REVIEW)

        with CaptureQueriesContext(connection) as queries:
            response = self.client.get("/projects/")

        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(queries), 4)

    def test_project_workspace_renders_overview_and_formula_items(self):
        project = PaperProject.objects.create(name="Thesis chapter three", writing_goal="Model derivation")
        batch = BatchMission.objects.create(project=project, title="Derivation screenshots", status=BatchMission.Status.READY)
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha+\beta",
            status=FormulaItem.Status.NEEDS_REVIEW,
            quality_score=42,
        )
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"E=mc^2",
            status=FormulaItem.Status.AUTO_READY,
            quality_score=91,
            sort_order=2,
        )

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/project_workspace.html")
        self.assertContains(response, "/static/formulas/css/pages/projects.css")
        self.assertContains(response, "/static/formulas/css/components/project-workspace.css")
        self.assertContains(response, "PROJECT WORKSPACE")
        self.assertContains(response, "Thesis chapter three")
        self.assertContains(response, "NEEDS REVIEW")
        self.assertContains(response, "READY TO EXPORT")
        self.assertContains(response, r"\alpha+\beta")
        self.assertContains(response, r"E=mc^2")
        self.assertEqual(response.context["project"], project)
        self.assertEqual(
            [item.latex_current for item in response.context["formula_items"]],
            [r"\alpha+\beta", r"E=mc^2"],
        )
        self.assertEqual(
            [item["latex"] for item in response.context["paper_preview_items"]],
            [r"\alpha+\beta", r"E=mc^2"],
        )
        self.assertEqual(response.context["overview"]["total_formulas"], 2)
        self.assertEqual(response.context["overview"]["needs_review"], 1)
        self.assertEqual(response.context["overview"]["ready_to_export"], 1)

    def test_project_workspace_presenter_preserves_extra_context(self):
        from apps.formulas.presenters.projects import project_workspace_context

        project = PaperProject.objects.create(name="Presenter paper")
        formula_items = ["formula-item"]
        paper_preview_items = [{"latex": r"x+y"}]

        context = project_workspace_context(
            project,
            formula_items=formula_items,
            paper_preview_items=paper_preview_items,
        )

        self.assertEqual(context["project"], project)
        self.assertEqual(context["formula_items"], formula_items)
        self.assertEqual(context["paper_preview_items"], paper_preview_items)

    def test_project_workspace_presenter_rejects_project_override(self):
        from apps.formulas.presenters.projects import project_workspace_context

        project = PaperProject.objects.create(name="Presenter paper")

        with self.assertRaisesMessage(ValueError, "project cannot be provided in extra context"):
            project_workspace_context(project, project="override")

    def test_project_workspace_builds_paper_preview_items_from_formula_sources(self):
        project = PaperProject.objects.create(name="Preview paper", writing_goal="Draft theorem section")
        batch = BatchMission.objects.create(project=project, title="Section 4")
        job = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.SUCCEEDED,
            latex_result=r"\int_0^1 x^2\,dx",
        )
        direct_item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\nabla \cdot \mathbf{E} = \rho / \epsilon_0",
            status=FormulaItem.Status.CONFIRMED,
            quality_score=95,
            sort_order=1,
        )
        fallback_item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            recognition_job=job,
            status=FormulaItem.Status.AUTO_READY,
            quality_score=88,
            sort_order=2,
        )

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context["paper_preview_items"],
            [
                {
                    "code": direct_item.formula_code,
                    "batch_title": "Section 4",
                    "latex": r"\nabla \cdot \mathbf{E} = \rho / \epsilon_0",
                    "status": FormulaItem.Status.CONFIRMED,
                    "quality_score": 95,
                },
                {
                    "code": fallback_item.formula_code,
                    "batch_title": "Section 4",
                    "latex": r"\int_0^1 x^2\,dx",
                    "status": FormulaItem.Status.AUTO_READY,
                    "quality_score": 88,
                },
            ],
        )

    def test_project_workspace_renders_latex_and_paper_preview_hooks(self):
        project = PaperProject.objects.create(name="Preview UI")
        batch = BatchMission.objects.create(project=project, title="Main theorem")
        FormulaItem.objects.create(project=project, batch=batch, latex_current=r"E=mc^2")

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "PAPER PREVIEW")
        self.assertContains(response, "LATEX PREVIEW")
        self.assertContains(response, "paper-preview-data")
        self.assertContains(response, "data-project-katex-preview")
        self.assertContains(response, "data-paper-preview-slot")
        self.assertContains(response, "/static/formulas/js/project_workspace.js")

    def test_project_workspace_paginates_formula_items_without_truncating_project(self):
        project = PaperProject.objects.create(name="Large paper")
        batch = BatchMission.objects.create(project=project, title="Full chapter")
        for index in range(25):
            FormulaItem.objects.create(
                project=project,
                batch=batch,
                latex_current=rf"x_{{{index}}}",
                status=FormulaItem.Status.AUTO_READY,
                sort_order=index,
            )

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["overview"]["total_formulas"], 25)
        self.assertEqual(len(response.context["formula_items"]), 12)
        self.assertEqual(response.context["item_page_obj"].number, 1)
        self.assertEqual(response.context["item_page_obj"].paginator.num_pages, 3)
        self.assertContains(response, "PAGE 1 OF 3")
        self.assertContains(response, "?page=2")

    def test_project_workspace_filters_formula_items_by_status(self):
        project = PaperProject.objects.create(name="Filtered paper")
        batch = BatchMission.objects.create(project=project, title="Mixed formulas")
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha",
            status=FormulaItem.Status.NEEDS_REVIEW,
            sort_order=1,
        )
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\beta",
            status=FormulaItem.Status.CONFIRMED,
            sort_order=2,
        )

        response = self.client.get(f"/projects/{project.id}/?status=needs_review")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["active_item_status"], FormulaItem.Status.NEEDS_REVIEW)
        self.assertEqual(response.context["overview"]["total_formulas"], 2)
        self.assertEqual(len(response.context["formula_items"]), 1)
        self.assertContains(response, r"\alpha")
        self.assertNotContains(response, r"\beta")
        self.assertContains(response, "NEEDS REVIEW")
        self.assertContains(response, "?status=confirmed")

    def test_project_workspace_renders_review_drawer_hooks(self):
        project = PaperProject.objects.create(name="Review UI")
        batch = BatchMission.objects.create(project=project, title="Lemma screenshots")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\gamma = \frac{1}{\sqrt{1-v^2/c^2}}",
            status=FormulaItem.Status.NEEDS_REVIEW,
            quality_score=54,
        )

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "review-drawer-data")
        self.assertContains(response, "REVIEW DRAWER")
        self.assertContains(response, "data-review-drawer")
        self.assertContains(response, "data-review-trigger")
        self.assertContains(response, f'data-review-item-id="{item.id}"')
        self.assertContains(response, f'action="/formula-items/{item.id}/review/"')
        self.assertContains(response, "CONFIRM FORMULA")
        self.assertEqual(response.context["review_items"][0]["id"], str(item.id))
        self.assertEqual(response.context["review_items"][0]["latex"], item.latex_current)

    def test_project_workspace_renders_inspection_tabs_and_drawer_backdrop(self):
        project = PaperProject.objects.create(name="Tabbed review")
        batch = BatchMission.objects.create(project=project, title="Audit screenshots")
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\sum_i x_i",
            status=FormulaItem.Status.NEEDS_REVIEW,
            quality_score=71,
        )

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "workspace-body-layout")
        self.assertContains(response, "workspace-tab-trigger")
        self.assertContains(response, "FORMULA INSPECTION QUEUE")
        self.assertContains(response, "PAPER ADAPTABILITY CHECK")
        self.assertContains(response, "data-drawer-backdrop")
        self.assertContains(response, "formula-status-pills")
        self.assertContains(response, "code-wrapper")

    def test_project_workspace_renders_compact_queue_with_formula_inspector(self):
        project = PaperProject.objects.create(name="Inspector workflow")
        batch = BatchMission.objects.create(project=project, title="Equation batch")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\int_0^\infty e^{-x^2}\,dx=\frac{\sqrt{\pi}}{2}",
            status=FormulaItem.Status.NEEDS_REVIEW,
            quality_score=67,
        )

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "workspace-review-grid")
        self.assertContains(response, "formula-inspector-panel")
        self.assertContains(response, "data-workspace-item")
        self.assertContains(response, f'data-inspector-item-id="{item.id}"')
        self.assertContains(response, "data-inspector-latex")
        self.assertContains(response, "data-inspector-preview")
        self.assertContains(response, "data-inspector-fit-width")
        self.assertContains(response, "data-inspector-fit-lines")
        self.assertContains(response, "PAPER FIT")
        self.assertContains(response, "OPEN IN REVIEW")

    def test_project_workspace_renders_export_download_links(self):
        project = PaperProject.objects.create(name="Export UI")
        batch = BatchMission.objects.create(project=project, title="Export batch")
        FormulaItem.objects.create(project=project, batch=batch, latex_current=r"\alpha+\beta")

        response = self.client.get(f"/projects/{project.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "EXPORT FILES")
        self.assertContains(response, f'href="/projects/{project.id}/export/tex/"')
        self.assertContains(response, f'href="/projects/{project.id}/export/markdown/"')

    def test_project_tex_export_downloads_equation_file(self):
        project = PaperProject.objects.create(name="Export paper")
        batch = BatchMission.objects.create(project=project, title="Chapter 2")
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\alpha+\beta",
            status=FormulaItem.Status.CONFIRMED,
            sort_order=1,
        )
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\gamma+\delta",
            status=FormulaItem.Status.REJECTED,
            sort_order=2,
        )

        response = self.client.get(f"/projects/{project.id}/export/tex/")
        content = response.content.decode("utf-8")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/plain; charset=utf-8")
        self.assertIn('attachment; filename="FP-', response["Content-Disposition"])
        self.assertIn(".tex", response["Content-Disposition"])
        self.assertIn("% Formula Lab LaTeX export", content)
        self.assertIn("% Project: Export paper", content)
        self.assertIn("% Formula: ", content)
        self.assertIn(r"\begin{equation}", content)
        self.assertIn(r"\alpha+\beta", content)
        self.assertIn(r"\end{equation}", content)
        self.assertNotIn(r"\gamma+\delta", content)

    def test_project_markdown_export_downloads_math_blocks(self):
        project = PaperProject.objects.create(name="Markdown paper")
        batch = BatchMission.objects.create(project=project, title="Markdown batch")
        FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"\sum_i x_i",
            status=FormulaItem.Status.AUTO_READY,
        )

        response = self.client.get(f"/projects/{project.id}/export/markdown/")
        content = response.content.decode("utf-8")

        self.assertEqual(response.status_code, 200)
        self.assertIn('attachment; filename="FP-', response["Content-Disposition"])
        self.assertIn(".md", response["Content-Disposition"])
        self.assertIn("# Markdown paper", content)
        self.assertIn("## Markdown batch", content)
        self.assertIn("$$", content)
        self.assertIn(r"\sum_i x_i", content)

    def test_project_export_rejects_unknown_format(self):
        project = PaperProject.objects.create(name="Invalid export")

        response = self.client.get(f"/projects/{project.id}/export/pdf/")

        self.assertEqual(response.status_code, 404)

    def test_review_formula_item_updates_latex_and_marks_confirmed(self):
        project = PaperProject.objects.create(name="Review post")
        batch = BatchMission.objects.create(project=project, title="Proof formulas")
        item = FormulaItem.objects.create(
            project=project,
            batch=batch,
            latex_current=r"E=mc^2",
            status=FormulaItem.Status.NEEDS_REVIEW,
        )

        response = self.client.post(
            f"/formula-items/{item.id}/review/",
            {"latex_current": r"E^2 = p^2c^2 + m^2c^4"},
        )

        item.refresh_from_db()
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], f"/projects/{project.id}/")
        self.assertEqual(item.latex_current, r"E^2 = p^2c^2 + m^2c^4")
        self.assertEqual(item.status, FormulaItem.Status.CONFIRMED)
