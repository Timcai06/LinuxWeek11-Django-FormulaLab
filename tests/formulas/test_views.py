from pathlib import Path
from io import BytesIO
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import Client, TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from PIL import Image

from apps.formulas.models import BatchMission, FormulaItem, FormulaJob, PaperProject


def image_bytes(format_name: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (10, 5), (255, 255, 255)).save(buffer, format=format_name)
    return buffer.getvalue()


def upload_file(name: str = "formula.png", content: bytes | None = None) -> SimpleUploadedFile:
    if content is None:
        content = image_bytes("JPEG" if name.lower().endswith((".jpg", ".jpeg")) else "PNG")
    return SimpleUploadedFile(name, content, content_type="image/png")


class FormulaMissionViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.media_root_context = TemporaryDirectory()
        self.settings_context = override_settings(MEDIA_ROOT=Path(self.media_root_context.name))
        self.settings_context.enable()

    def tearDown(self):
        self.settings_context.disable()
        self.media_root_context.cleanup()

    def test_landing_renders_mission_control_entry_points(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/landing.html")
        self.assertContains(response, "formulas/js/generated/layout-intelligence.js")
        self.assertContains(response, "FORMULA LAB")
        self.assertContains(response, "MISSION CONTROL FOR LATEX RECOGNITION")
        self.assertContains(response, "ENTER WORKBENCH")

    def test_base_template_uses_local_katex_assets(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "/static/formulas/vendor/katex/katex.min.css")
        self.assertContains(response, "/static/formulas/vendor/katex/katex.min.js")
        self.assertNotContains(response, "cdn.jsdelivr.net/npm/katex")

    def test_workbench_renders_upload_form_and_telemetry_context(self):
        project = PaperProject.objects.create(name="Active paper", writing_goal="Collect formulas")
        FormulaJob.objects.create(original_image="formula_uploads/source.png")

        with patch("apps.formulas.views.build_health_snapshot") as health_snapshot:
            health_snapshot.return_value = {
                "model": {"status": "ready", "state": "ready", "message": "pix2tex model ready", "ok": True},
                "queues": {"queued": 1, "running": 0, "succeeded": 0, "failed": 0, "total": 1},
            }
            response = self.client.get("/workbench/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/workbench.html")
        self.assertContains(response, 'action="/jobs/"')
        self.assertContains(response, 'enctype="multipart/form-data"')
        self.assertContains(response, 'name="project"')
        self.assertContains(response, 'name="project_name"')
        self.assertContains(response, "Active paper")
        self.assertEqual(list(response.context["projects"]), [project])
        self.assertNotContains(response, "model-indicator")
        self.assertContains(response, "model-status-light is-ready")
        self.assertContains(response, "status-readout is-ready")
        self.assertNotContains(response, "pix2tex model ready")
        self.assertNotContains(response, "SUPPORTED FORMATS")
        self.assertNotContains(response, "PNG, JPG, JPEG")
        self.assertEqual(response.context["queue_counts"]["queued"], 1)
        self.assertEqual(len(response.context["recent_jobs"]), 1)

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
        self.assertContains(response, "PROJECT WORKSPACE")
        self.assertContains(response, "Thesis chapter three")
        self.assertContains(response, "NEEDS REVIEW")
        self.assertContains(response, "READY TO EXPORT")
        self.assertContains(response, r"\alpha+\beta")
        self.assertContains(response, r"E=mc^2")
        self.assertEqual(response.context["overview"]["total_formulas"], 2)
        self.assertEqual(response.context["overview"]["needs_review"], 1)
        self.assertEqual(response.context["overview"]["ready_to_export"], 1)

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
        self.assertContains(response, 'defer src="/static/formulas/js/project_workspace.js"')

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

    def test_system_renders_summary_first_and_compact_service_list(self):
        payload = {
            "web": {"ok": True},
            "database": {"ok": True},
            "redis": {"ok": True},
            "worker": {"ok": False, "heartbeat_at": None},
            "model": {"status": "warming", "state": "warming", "message": "loading paddle model", "ok": False},
            "media": {"ok": True},
            "queues": {"queued": 2, "running": 1, "succeeded": 8, "failed": 1, "total": 12},
            "last_job": {"status": "running", "stage_label": "INFERENCE"},
        }

        with patch("apps.formulas.views.build_health_snapshot", return_value=payload):
            response = self.client.get("/system/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/system.html")
        self.assertContains(response, "dashboard-grid")
        self.assertContains(response, "service-flow")
        self.assertContains(response, 'data-service="MODEL"')
        self.assertContains(response, "is-warming")
        self.assertNotContains(response, "system-dashboard")

    def test_history_limits_initial_timeline_and_exposes_load_more(self):
        for index in range(1, 22):
            FormulaJob.objects.create(
                mission_code=f"FL-20260519-{index:04d}",
                original_image=f"formula_uploads/{index}.png",
            )

        response = self.client.get("/history/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/history.html")
        self.assertEqual(len(response.context["jobs"]), 20)
        self.assertTrue(response.context["page_obj"].has_next())
        self.assertContains(response, "LOAD MORE")
        self.assertContains(response, "FL-20260519-0021")
        self.assertNotIn(
            "FL-20260519-0001",
            [job.mission_code for job in response.context["jobs"]],
        )

    def test_history_filters_by_status_and_mission_code_query(self):
        target = FormulaJob.objects.create(
            mission_code="FL-20260519-0105",
            original_image="formula_uploads/target.png",
            status=FormulaJob.Status.FAILED,
        )
        FormulaJob.objects.create(
            mission_code="FL-20260519-0205",
            original_image="formula_uploads/succeeded.png",
            status=FormulaJob.Status.SUCCEEDED,
        )
        FormulaJob.objects.create(
            mission_code="FL-20260519-0106",
            original_image="formula_uploads/running.png",
            status=FormulaJob.Status.RUNNING,
        )

        response = self.client.get("/history/", {"q": "0105", "status": "failed"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.context["jobs"]), [target])
        self.assertEqual(response.context["active_status"], "failed")
        self.assertEqual(response.context["search_query"], "0105")
        self.assertContains(response, "FL-20260519-0105")
        self.assertNotContains(response, "FL-20260519-0205")
        self.assertNotContains(response, "FL-20260519-0106")

    def test_history_second_page_can_return_to_previous_page(self):
        for index in range(1, 22):
            FormulaJob.objects.create(
                mission_code=f"FL-20260519-{index:04d}",
                original_image=f"formula_uploads/{index}.png",
                status=FormulaJob.Status.FAILED,
            )

        response = self.client.get("/history/", {"page": "2", "status": "failed", "q": "FL-20260519"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context["page_obj"].has_previous())
        self.assertContains(response, "PREVIOUS")
        self.assertContains(response, 'href="/history/?page=1&amp;status=failed&amp;q=FL-20260519"')
        self.assertContains(response, "FL-20260519-0001")
        self.assertNotContains(response, "FL-20260519-0021")

    def test_history_exposes_layout_measured_summary(self):
        FormulaJob.objects.create(
            mission_code="FL-20260519-0301",
            original_image="formula_uploads/source.png",
            stage_label="LATEX POSTPROCESS",
            stage_message="Long generated LaTeX summary that should be measured before the list settles.",
        )

        response = self.client.get("/history/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "data-layout-summary")
        self.assertContains(response, "formulas/js/history.js")

    def test_report_renders_latex_format_context(self):
        job = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.SUCCEEDED,
            latex_result=r"\frac{a}{b}",
        )

        response = self.client.get(f"/missions/{job.id}/report/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "formulas/result.html")
        self.assertEqual(response.context["formats"]["raw"], r"\frac{a}{b}")
        self.assertEqual(response.context["formats"]["block"], r"$$\frac{a}{b}$$")
        self.assertContains(response, "COPY")
        self.assertContains(response, "LOG")
        self.assertContains(response, "compact-actions")
        self.assertNotContains(response, "COPY CURRENT")
        self.assertContains(response, job.mission_code)
        self.assertContains(response, 'data-katex-preview')
        self.assertContains(response, "katex-surface")
        self.assertContains(response, "RENDERED OUTPUT")
        self.assertContains(response, "data-paper-fit-preview")
        self.assertContains(response, "data-paper-fit-width")
        self.assertContains(response, "data-paper-fit-lines")
        self.assertContains(response, 'defer src="/static/formulas/js/result.js"')

    def test_create_job_accepts_valid_upload_creates_job_and_dispatches_worker(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.jpeg")})

        self.assertEqual(response.status_code, 302)
        job = FormulaJob.objects.get()
        self.assertEqual(job.original_image.name.rsplit("/", 1)[-1], "formula.jpeg")
        self.assertEqual(response["Location"], f"/missions/{job.id}/progress/")
        delay.assert_called_once_with(str(job.id))

    def test_create_job_attaches_existing_project_and_creates_batch(self):
        project = PaperProject.objects.create(name="Existing paper")

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post(
                "/jobs/",
                {
                    "image": upload_file("formula.png"),
                    "project": str(project.id),
                },
            )

        self.assertEqual(response.status_code, 302)
        job = FormulaJob.objects.get()
        batch = BatchMission.objects.get()
        self.assertEqual(job.project, project)
        self.assertEqual(job.batch, batch)
        self.assertEqual(batch.project, project)
        self.assertEqual(batch.status, BatchMission.Status.RUNNING)
        self.assertEqual(batch.title, "formula.png")
        delay.assert_called_once_with(str(job.id))

    def test_create_job_creates_new_project_from_project_name(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post(
                "/jobs/",
                {
                    "image": upload_file("formula.png"),
                    "project_name": "New theorem draft",
                },
            )

        self.assertEqual(response.status_code, 302)
        project = PaperProject.objects.get()
        job = FormulaJob.objects.get()
        self.assertEqual(project.name, "New theorem draft")
        self.assertEqual(job.project, project)
        self.assertEqual(job.batch.project, project)
        delay.assert_called_once_with(str(job.id))

    def test_create_job_rejects_invalid_extension(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.gif")})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("image", response.json()["errors"])
        delay.assert_not_called()

    def test_create_job_rejects_spoofed_png_content(self):
        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("spoofed.png", b"not a real image")})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("image", response.json()["errors"])
        delay.assert_not_called()

    def test_create_job_rejects_uploads_over_configured_limit(self):
        too_large = b"x" * ((10 * 1024 * 1024) + 1)

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post("/jobs/", {"image": upload_file("formula.png", too_large)})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(FormulaJob.objects.count(), 0)
        self.assertIn("PAYLOAD EXCEEDS 10MB LIMIT", response.json()["errors"]["image"][0])
        delay.assert_not_called()

    def test_create_job_get_is_rejected_and_does_not_create_job(self):
        response = self.client.get("/jobs/")

        self.assertEqual(response.status_code, 405)
        self.assertEqual(FormulaJob.objects.count(), 0)

    def test_create_job_marks_failed_when_dispatch_fails(self):
        with (
            patch("apps.formulas.views.run_formula_job.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.logger.exception") as log_exception,
        ):
            response = self.client.post("/jobs/", {"image": upload_file("formula.png")})

        self.assertEqual(response.status_code, 503)
        job = FormulaJob.objects.get()
        self.assertEqual(job.status, FormulaJob.Status.FAILED)
        self.assertEqual(job.failure_stage, "DISPATCH")
        self.assertEqual(job.error_message, "mission broker unavailable")
        log_exception.assert_called_once()

    def test_mission_status_api_returns_expected_shape_and_result_url_for_success(self):
        job = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.SUCCEEDED,
            progress=100,
            stage_code="RESULT_READY",
            stage_label="RESULT READY",
            stage_message="公式识别结果已生成",
            error_message="",
            failure_stage="",
        )

        response = self.client.get(f"/api/missions/{job.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json()),
            {
                "status",
                "id",
                "mission_code",
                "progress",
                "stage_code",
                "stage_label",
                "stage_message",
                "result_url",
                "error_message",
                "failure_stage",
            },
        )
        self.assertEqual(response.json()["status"], FormulaJob.Status.SUCCEEDED)
        self.assertEqual(response.json()["id"], str(job.id))
        self.assertEqual(response.json()["mission_code"], job.mission_code)
        self.assertEqual(response.json()["result_url"], f"/missions/{job.id}/report/")

    def test_mission_status_api_uses_null_result_url_until_success(self):
        job = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        response = self.client.get(f"/api/missions/{job.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["result_url"])

    def test_retry_failed_job_creates_linked_job_and_dispatches_worker(self):
        project = PaperProject.objects.create(name="Retry paper")
        batch = BatchMission.objects.create(project=project)
        failed = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.FAILED,
            error_message="inference failed",
            failure_stage="INFERENCE",
            project=project,
            batch=batch,
        )

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post(f"/missions/{failed.id}/retry/")

        self.assertEqual(response.status_code, 302)
        retry = FormulaJob.objects.exclude(id=failed.id).get()
        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(retry.original_image.name, failed.original_image.name)
        self.assertEqual(retry.project, project)
        self.assertEqual(retry.batch, batch)
        self.assertEqual(response["Location"], f"/missions/{retry.id}/progress/")
        delay.assert_called_once_with(str(retry.id))

    def test_retry_non_failed_job_is_rejected(self):
        queued = FormulaJob.objects.create(original_image="formula_uploads/source.png")

        with patch("apps.formulas.views.run_formula_job.delay") as delay:
            response = self.client.post(f"/missions/{queued.id}/retry/")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["error"], "only failed missions can be retried")
        self.assertEqual(FormulaJob.objects.count(), 1)
        delay.assert_not_called()

    def test_retry_marks_new_job_failed_when_dispatch_fails(self):
        failed = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.FAILED,
            error_message="inference failed",
            failure_stage="INFERENCE",
        )

        with (
            patch("apps.formulas.views.run_formula_job.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.logger.exception") as log_exception,
        ):
            response = self.client.post(f"/missions/{failed.id}/retry/")

        self.assertEqual(response.status_code, 503)
        retry = FormulaJob.objects.exclude(id=failed.id).get()
        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(retry.status, FormulaJob.Status.FAILED)
        self.assertEqual(retry.failure_stage, "RETRY_DISPATCH")
        self.assertEqual(retry.error_message, "mission broker unavailable")
        log_exception.assert_called_once()
