from django.db import migrations, models
from django.utils import timezone


def populate_mission_codes(apps, schema_editor):
    FormulaJob = apps.get_model("formulas", "FormulaJob")
    counters = {}

    for job in FormulaJob.objects.order_by("created_at", "id"):
        if job.mission_code:
            continue

        if job.created_at:
            date_text = timezone.localtime(job.created_at).strftime("%Y%m%d")
        else:
            date_text = timezone.localdate().strftime("%Y%m%d")

        counters[date_text] = counters.get(date_text, 0) + 1
        job.mission_code = f"FL-{date_text}-{counters[date_text]:04d}"
        job.save(update_fields=["mission_code"])


class Migration(migrations.Migration):
    dependencies = [
        ("formulas", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="formulajob",
            name="mission_code",
            field=models.CharField(blank=True, db_index=True, max_length=32, null=True, unique=True),
        ),
        migrations.RunPython(populate_mission_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="formulajob",
            name="mission_code",
            field=models.CharField(blank=True, db_index=True, max_length=32, unique=True),
        ),
    ]
