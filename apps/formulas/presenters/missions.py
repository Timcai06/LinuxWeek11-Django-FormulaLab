from apps.formulas.services.latex_formats import build_latex_formats


def mission_report_context(job):
    return {
        "job": job,
        "formats": build_latex_formats(job.latex_result or ""),
    }
