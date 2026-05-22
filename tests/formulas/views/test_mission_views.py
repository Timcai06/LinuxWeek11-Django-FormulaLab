import hashlib
from pathlib import Path
from unittest.mock import patch

from apps.formulas.models import BatchMission, FormulaJob, PaperProject
from apps.formulas.services import latex_formats
from tests.formulas.views.base import FormulaViewTestCase


class FormulaMissionViewTests(FormulaViewTestCase):
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
        self.assertEqual(response.context["job"], job)
        self.assertEqual(response.context["job"].mission_code, job.mission_code)
        self.assertEqual(response.context["formats"]["raw"], r"\frac{a}{b}")
        self.assertEqual(response.context["formats"]["block"], r"$$\frac{a}{b}$$")
        self.assertContains(response, "data-copy-current")
        self.assertContains(response, "console-actions-row")
        self.assertNotContains(response, "COPY CURRENT")
        self.assertContains(response, job.mission_code)
        self.assertContains(response, "ORIGINAL IMAGE")
        self.assertContains(response, "scope-viewport")
        self.assertContains(response, "scope-bracket")
        self.assertContains(response, "telemetry-grid")
        self.assertContains(response, "telemetry-card")
        self.assertContains(response, 'data-katex-preview')
        self.assertContains(response, "katex-surface")
        self.assertContains(response, "RENDERED OUTPUT")
        self.assertContains(response, "data-paper-fit-preview")
        self.assertContains(response, "PAPER FIT PREVIEW")
        self.assertContains(response, "data-ruler-cursor")
        self.assertContains(response, "data-paper-fit-width")
        self.assertContains(response, "data-paper-fit-lines")
        self.assertContains(response, "data-paper-fit-tight")
        self.assertNotContains(response, "REVIEW INSPECTOR")
        self.assertNotContains(response, "SOURCE THUMBNAIL")
        self.assertContains(response, 'formulas/css/pages/result-inspector.css')
        self.assertContains(response, 'formulas/css/pages/result-pipeline.css')
        self.assertContains(response, 'defer src="/static/formulas/js/shared/katex_preview.js"')
        self.assertContains(response, 'defer src="/static/formulas/js/shared/format_tabs.js"')
        self.assertContains(response, "/static/formulas/js/result/core.js")
        self.assertContains(response, "/static/formulas/js/result/preview.js")
        self.assertContains(response, "/static/formulas/js/result/paper_fit.js")
        self.assertContains(response, "/static/formulas/js/result/format_controls.js")
        self.assertContains(response, "/static/formulas/js/result/copy.js")
        self.assertContains(response, "/static/formulas/js/result/image_viewport.js")
        self.assertContains(response, "/static/formulas/js/result/index.js")
        self.assertNotContains(response, 'defer src="/static/formulas/js/result.js"')
        response_html = response.content.decode()
        self.assertLess(
            response_html.index("/static/formulas/js/shared/katex_preview.js"),
            response_html.index("/static/formulas/js/result/core.js"),
        )
        self.assertLess(
            response_html.index("/static/formulas/js/shared/format_tabs.js"),
            response_html.index("/static/formulas/js/result/core.js"),
        )

    def test_mission_report_presenter_exposes_job_and_formats_from_result(self):
        from apps.formulas.presenters.missions import mission_report_context

        job = FormulaJob.objects.create(
            original_image="formula_uploads/source.png",
            status=FormulaJob.Status.SUCCEEDED,
            latex_result=" $$ x + y $$ ",
        )

        context = mission_report_context(job)

        self.assertEqual(context["job"], job)
        self.assertEqual(context["job"].mission_code, job.mission_code)
        self.assertEqual(context["formats"]["raw"], "x + y")

    def test_report_applies_known_image_correction_before_formatting(self):
        job = FormulaJob.objects.create(
            original_image="formula_uploads/known-course-sample.png",
            status=FormulaJob.Status.SUCCEEDED,
            latex_result=r"\bad",
        )
        image_path = Path(job.original_image.path)
        image_path.parent.mkdir(parents=True, exist_ok=True)
        image_path.write_bytes(b"known course sample")
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()[:12]

        with patch.dict(latex_formats.KNOWN_IMAGE_CORRECTIONS, {digest: r"\fixed"}):
            response = self.client.get(f"/missions/{job.id}/report/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["formats"]["raw"], r"\fixed")
        self.assertEqual(response.context["formats"]["block"], r"$$\fixed$$")

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

        with patch("apps.formulas.views.mission_views.run_formula_job.delay") as delay:
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

        with patch("apps.formulas.views.mission_views.run_formula_job.delay") as delay:
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
            patch("apps.formulas.views.mission_views.run_formula_job.delay", side_effect=RuntimeError("broker down")),
            patch("apps.formulas.views.mission_views.logger.exception") as log_exception,
        ):
            response = self.client.post(f"/missions/{failed.id}/retry/")

        self.assertEqual(response.status_code, 503)
        retry = FormulaJob.objects.exclude(id=failed.id).get()
        self.assertEqual(retry.retry_of, failed)
        self.assertEqual(retry.status, FormulaJob.Status.FAILED)
        self.assertEqual(retry.failure_stage, "RETRY_DISPATCH")
        self.assertEqual(retry.error_message, "mission broker unavailable")
        log_exception.assert_called_once()
