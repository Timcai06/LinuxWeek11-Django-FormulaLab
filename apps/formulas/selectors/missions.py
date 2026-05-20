from django.shortcuts import get_object_or_404

from apps.formulas.models import FormulaJob


def get_mission_for_report(job_id):
    return get_object_or_404(FormulaJob, id=job_id)
