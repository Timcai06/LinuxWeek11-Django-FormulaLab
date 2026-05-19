from celery import shared_task


@shared_task
def warmup_model_task():
    return {"status": "pending_task_6"}
