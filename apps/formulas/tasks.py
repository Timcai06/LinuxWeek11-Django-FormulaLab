import logging
import threading
import time
import traceback

from celery import shared_task
from celery.signals import worker_process_init
from django.db import transaction
from django.utils import timezone

from apps.formulas.models import FormulaJob
from apps.formulas.services.latex_formats import correct_latex_result
from apps.formulas.services.model_state import WORKER_HEARTBEAT_KEY, set_model_status
from apps.formulas.services.ocr_engines import get_formula_engine
from apps.formulas.services.recognizer import prepare_formula_image
from apps.formulas.services.telemetry import get_redis_client


logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL_SECONDS = 20
HEARTBEAT_TTL_SECONDS = 60
ERROR_DETAIL_MAX_LENGTH = 4000
ERROR_MESSAGE_MAX_LENGTH = 255

STAGES = {
    "QUEUED": ("QUEUED", "任务已进入识别队列", 25),
    "MODEL_WARMUP": ("MODEL WARMUP", "正在确认公式识别模型可用", 40),
    "IMAGE_PREPROCESS": ("IMAGE PREPROCESS", "正在预处理公式图片", 60),
    "INFERENCE": ("INFERENCE", "正在运行公式识别推理", 80),
    "LATEX_POSTPROCESS": ("LATEX POSTPROCESS", "正在归一化 LaTeX 输出", 95),
    "RESULT_READY": ("RESULT READY", "公式识别结果已生成", 100),
}

_heartbeat_thread = None
_heartbeat_lock = threading.Lock()


def _write_worker_heartbeat_loop() -> None:
    while True:
        try:
            redis_client = get_redis_client()
            redis_client.set(WORKER_HEARTBEAT_KEY, timezone.now().isoformat(), ex=HEARTBEAT_TTL_SECONDS)
        except Exception:
            logger.warning("Unable to write worker heartbeat", exc_info=True)
        time.sleep(HEARTBEAT_INTERVAL_SECONDS)


@worker_process_init.connect
def start_worker_heartbeat(**kwargs) -> None:
    global _heartbeat_thread

    with _heartbeat_lock:
        if _heartbeat_thread and _heartbeat_thread.is_alive():
            return
        _heartbeat_thread = threading.Thread(
            target=_write_worker_heartbeat_loop,
            name="formula-lab-worker-heartbeat",
            daemon=True,
        )
        _heartbeat_thread.start()


def _mark_stage(job: FormulaJob, code: str) -> None:
    label, message, progress = STAGES[code]
    job.mark_stage(code, label, message, progress)


def _short_error_message(exc: Exception) -> str:
    return (str(exc) or exc.__class__.__name__)[:ERROR_MESSAGE_MAX_LENGTH]


def _truncated_error_detail() -> str:
    return traceback.format_exc()[:ERROR_DETAIL_MAX_LENGTH]


def _safe_set_model_status(redis_client, status: str, message: str) -> None:
    try:
        set_model_status(redis_client, status, message)
    except Exception:
        logger.warning("Unable to write model status telemetry", exc_info=True)


@shared_task
def warmup_model_task():
    redis_client = get_redis_client()
    engine = get_formula_engine()
    _safe_set_model_status(redis_client, "warming", f"loading {engine.name} model")
    try:
        engine.warmup()
    except Exception as exc:
        _safe_set_model_status(redis_client, "error", _short_error_message(exc))
        raise

    _safe_set_model_status(redis_client, "ready", f"{engine.name} model ready")
    return {"status": "ready"}


@shared_task
def run_formula_job(job_id: str) -> None:
    with transaction.atomic():
        job = FormulaJob.objects.select_for_update().get(id=job_id)
        if job.status != FormulaJob.Status.QUEUED:
            logger.info("Skipping formula job %s because status is %s", job_id, job.status)
            return None
        job.status = FormulaJob.Status.RUNNING
        job.started_at = timezone.now()
        job.finished_at = None
        job.duration_ms = None
        job.error_message = ""
        job.error_detail = ""
        job.failure_stage = ""
        job.save(
            update_fields=[
                "status",
                "started_at",
                "finished_at",
                "duration_ms",
                "error_message",
                "error_detail",
                "failure_stage",
            ]
        )

    current_stage = "QUEUED"

    try:
        for stage in ("QUEUED", "MODEL_WARMUP"):
            current_stage = stage
            _mark_stage(job, stage)

        engine = get_formula_engine()
        engine.warmup()

        current_stage = "IMAGE_PREPROCESS"
        _mark_stage(job, current_stage)
        preprocessed_path = prepare_formula_image(job)

        current_stage = "INFERENCE"
        _mark_stage(job, current_stage)
        latex_output = engine.recognize(str(preprocessed_path))

        current_stage = "LATEX_POSTPROCESS"
        _mark_stage(job, current_stage)
        latex_result = correct_latex_result(latex_output, job.original_image.path)

        job.latex_result = latex_result
        job.engine_name = engine.name
        job.save(update_fields=["latex_result", "engine_name"])

        current_stage = "RESULT_READY"
        _mark_stage(job, current_stage)
        job.finish(FormulaJob.Status.SUCCEEDED)
    except Exception as exc:
        job.status = FormulaJob.Status.FAILED
        job.failure_stage = current_stage
        job.error_message = _short_error_message(exc)
        job.error_detail = _truncated_error_detail()
        job.finished_at = timezone.now()
        job.duration_ms = job.calculate_duration_ms()
        job.save(
            update_fields=[
                "status",
                "failure_stage",
                "error_message",
                "error_detail",
                "finished_at",
                "duration_ms",
            ]
        )
        return None

    return None
