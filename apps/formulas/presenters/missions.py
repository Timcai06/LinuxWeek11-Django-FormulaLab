from apps.formulas.services.latex_formats import build_latex_formats, correct_latex_result


def mission_report_context(job):
    latex_result = correct_latex_result(job.latex_result or "", job.original_image.path)
    return {
        "job": job,
        "formats": build_latex_formats(latex_result),
    }
