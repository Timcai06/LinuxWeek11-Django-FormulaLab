import os
import sys

import django
from django.utils import timezone


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.formulas.models import BatchMission, FormulaJob, PaperProject  # noqa: E402


def get_demo_scope():
    project = PaperProject.objects.first()
    if not project:
        project = PaperProject.objects.create(
            name="Mission Log UI Demo",
            writing_goal="Stress-test mission log status cards and timeline layout.",
        )
        print(f"Created project: {project}")

    batch = project.batches.first()
    if not batch:
        batch = BatchMission.objects.create(project=project, title="Mission Log UI cases")
        print(f"Created batch: {batch}")

    return project, batch


def create_job(project, batch, *, minutes_ago, status, progress, stage_code, stage_label, stage_message,
               duration_ms=None, latex_result="", error_message="", error_detail="", failure_stage=""):
    now = timezone.now()
    started_at = now - timezone.timedelta(minutes=minutes_ago, seconds=20)
    finished_at = None
    if status in {FormulaJob.Status.SUCCEEDED, FormulaJob.Status.FAILED}:
        finished_at = started_at + timezone.timedelta(milliseconds=duration_ms or 1800)

    return FormulaJob.objects.create(
        project=project,
        batch=batch,
        original_image=f"formula_uploads/2026/05/ui_case_{minutes_ago}_{status}.png",
        status=status,
        progress=progress,
        stage_code=stage_code,
        stage_label=stage_label,
        stage_message=stage_message,
        latex_result=latex_result,
        engine_name="paddle",
        error_message=error_message,
        error_detail=error_detail,
        failure_stage=failure_stage,
        timings={
            "preprocess_ms": 210,
            "inference_ms": max(0, (duration_ms or 900) - 420),
            "postprocess_ms": 210,
        } if duration_ms else {},
        started_at=started_at if status != FormulaJob.Status.QUEUED else None,
        finished_at=finished_at,
        duration_ms=duration_ms,
    )


def create_mission_log_cases():
    project, batch = get_demo_scope()
    cases = [
        {
            "minutes_ago": 1,
            "status": FormulaJob.Status.FAILED,
            "progress": 85,
            "stage_code": "OCR_ENGINE_TIMEOUT",
            "stage_label": "OCR TIMEOUT",
            "stage_message": "Paddle formula recognition timeout after 15000ms: model service was warming up.",
            "duration_ms": 15000,
            "error_message": "OCR Engine Timeout",
            "error_detail": (
                "Exception: PaddleOCR timeout after 15s. "
                "Connection refused at uvicorn server 127.0.0.1:9000."
            ),
            "failure_stage": "OCR_RECOGNITION",
        },
        {
            "minutes_ago": 3,
            "status": FormulaJob.Status.SUCCEEDED,
            "progress": 100,
            "stage_code": "RESULT_READY",
            "stage_label": "RESULT READY",
            "stage_message": "Recognized a compact inline derivative and exported review-ready LaTeX.",
            "duration_ms": 1880,
            "latex_result": r"\frac{d}{dx}\left(e^{x^2}\right)=2xe^{x^2}",
        },
        {
            "minutes_ago": 5,
            "status": FormulaJob.Status.FAILED,
            "progress": 55,
            "stage_code": "PREPROCESS_REJECTED",
            "stage_label": "IMAGE REJECTED",
            "stage_message": (
                "Input contrast was too low and the formula baseline could not be separated from paper shadows; "
                "try cropping tighter or converting the image to PNG before retrying."
            ),
            "duration_ms": 4200,
            "error_message": "Low contrast image",
            "error_detail": "Adaptive threshold produced an empty foreground mask after denoising.",
            "failure_stage": "IMAGE_PREPROCESSING",
        },
        {
            "minutes_ago": 7,
            "status": FormulaJob.Status.SUCCEEDED,
            "progress": 100,
            "stage_code": "RESULT_READY",
            "stage_label": "RESULT READY",
            "stage_message": (
                "Long display equation recognized with matrix notation, nested summation, and a stable KaTeX preview."
            ),
            "duration_ms": 6420,
            "latex_result": r"\mathbf{K}_{ij}=\int_{\Omega}\nabla \phi_i^\top\mathbf{D}\nabla \phi_j\,d\Omega",
        },
        {
            "minutes_ago": 9,
            "status": FormulaJob.Status.RUNNING,
            "progress": 64,
            "stage_code": "INFERENCE",
            "stage_label": "INFERENCE",
            "stage_message": "Paddle model is decoding a multi-line aligned equation; awaiting final token sequence.",
        },
        {
            "minutes_ago": 11,
            "status": FormulaJob.Status.QUEUED,
            "progress": 10,
            "stage_code": "UPLOAD_LOCKED",
            "stage_label": "UPLOAD LOCKED",
            "stage_message": "Upload accepted and queued behind two recognition missions.",
        },
        {
            "minutes_ago": 13,
            "status": FormulaJob.Status.SUCCEEDED,
            "progress": 100,
            "stage_code": "RESULT_READY",
            "stage_label": "RESULT READY",
            "stage_message": "Recognized stochastic optimization objective for a paper draft insertion test.",
            "duration_ms": 3120,
            "latex_result": r"\min_{\theta}\mathbb{E}_{(x,y)\sim\mathcal{D}}\left[\ell(f_{\theta}(x),y)\right]+\lambda\lVert\theta\rVert_2^2",
        },
        {
            "minutes_ago": 15,
            "status": FormulaJob.Status.FAILED,
            "progress": 92,
            "stage_code": "LATEX_VALIDATION_FAILED",
            "stage_label": "LATEX VALIDATION",
            "stage_message": (
                "Recognition completed but postprocess detected unmatched braces in a piecewise expression, "
                "so the mission was held back for manual review."
            ),
            "duration_ms": 5300,
            "latex_result": r"\left\{ \begin{array}{ll} x^2, & x < 0 \\ \sqrt{x}, & x \ge 0",
            "error_message": "Unmatched LaTeX braces",
            "error_detail": "Postprocess validation found one unclosed \\left\\{ block and a missing array terminator.",
            "failure_stage": "LATEX_POSTPROCESS",
        },
    ]

    created_jobs = [create_job(project, batch, **case) for case in cases]
    print(f"Created {len(created_jobs)} Mission Log UI cases:")
    for job in created_jobs:
        print(f"- {job.mission_code} {job.status.upper()} {job.stage_label}")


def create_fail_case():
    project, batch = get_demo_scope()
    job = create_job(
        project,
        batch,
        minutes_ago=1,
        status=FormulaJob.Status.FAILED,
        progress=85,
        stage_code="OCR_ENGINE_TIMEOUT",
        stage_label="OCR TIMEOUT",
        stage_message="OCR engine timeout after 15000ms: backend offline",
        duration_ms=15000,
        error_message="OCR Engine Timeout",
        error_detail=(
            "Exception: PaddleOCR timeout after 15s. "
            "Connection refused at uvicorn server 127.0.0.1:9000."
        ),
        failure_stage="OCR_RECOGNITION",
    )
    print(f"Created failed FormulaJob: {job.mission_code} ({job.id})")


if __name__ == "__main__":
    create_mission_log_cases()
