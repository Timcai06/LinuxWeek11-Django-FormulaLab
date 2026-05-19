import logging
import threading
import time
import traceback

from celery import shared_task
from celery.signals import worker_process_init
from django.utils import timezone

from apps.formulas.models import FormulaJob
from apps.formulas.services.model_state import WORKER_HEARTBEAT_KEY, set_model_status
from apps.formulas.services.pix2tex_engine import Pix2TexEngine
from apps.formulas.services.recognizer import recognize_formula
from apps.formulas.services.telemetry import get_redis_client


logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL_SECONDS = 20
HEARTBEAT_TTL_SECONDS = 60
ERROR_DETAIL_MAX_LENGTH = 4000
ERROR_MESSAGE_MAX_LENGTH = 255

STAGES = {
    "QUEUED": ("QUEUED", "任务已进入识别队列", 25),
    "MODEL_WARMUP": ("MODEL WARMUP", "正在确认 pix2tex 模型可用", 40),
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


@shared_task
def warmup_model_task():
    redis_client = get_redis_client()
    set_model_status(redis_client, "warming", "loading pix2tex model")
    try:
        Pix2TexEngine().warmup()
    except Exception as exc:
        set_model_status(redis_client, "error", _short_error_message(exc))
        raise

    set_model_status(redis_client, "ready", "pix2tex model ready")
    return {"status": "ready"}


@shared_task
def run_formula_job(job_id: str) -> None:
    job = FormulaJob.objects.get(id=job_id)
    current_stage = "QUEUED"

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

    try:
        for stage in ("QUEUED", "MODEL_WARMUP"):
            current_stage = stage
            _mark_stage(job, stage)

        Pix2TexEngine().warmup()

        current_stage = "IMAGE_PREPROCESS"
        _mark_stage(job, current_stage)
        latex_result = recognize_formula(job)

        for stage in ("INFERENCE", "LATEX_POSTPROCESS"):
            current_stage = stage
            _mark_stage(job, stage)

        job.latex_result = latex_result
        job.save(update_fields=["latex_result"])

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
