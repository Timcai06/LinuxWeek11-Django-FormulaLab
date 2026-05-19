import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="FormulaJob",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("original_image", models.ImageField(upload_to="formula_uploads/%Y/%m/")),
                ("preprocessed_image", models.ImageField(blank=True, upload_to="formula_preprocessed/%Y/%m/")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("running", "Running"),
                            ("succeeded", "Succeeded"),
                            ("failed", "Failed"),
                        ],
                        default="queued",
                        max_length=20,
                    ),
                ),
                ("progress", models.PositiveSmallIntegerField(default=10)),
                ("stage_code", models.CharField(default="UPLOAD_LOCKED", max_length=64)),
                ("stage_label", models.CharField(default="UPLOAD LOCKED", max_length=64)),
                ("stage_message", models.CharField(default="上传完成，任务已锁定", max_length=255)),
                ("latex_result", models.TextField(blank=True)),
                ("engine_name", models.CharField(default="pix2tex", max_length=64)),
                ("error_message", models.CharField(blank=True, max_length=255)),
                ("error_detail", models.TextField(blank=True)),
                ("failure_stage", models.CharField(blank=True, max_length=64)),
                ("timings", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("duration_ms", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "retry_of",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="retries",
                        to="formulas.formulajob",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
