from pathlib import Path

from django.conf import settings

from apps.formulas.models import FormulaJob
from apps.formulas.services.latex_formats import correct_latex_result
from apps.formulas.services.ocr_engines import get_formula_engine
from apps.formulas.services.preprocessing import preprocess_image_file


def recognize_formula(job: FormulaJob) -> str:
    preprocessed_path = prepare_formula_image(job)
    engine = get_formula_engine()
    latex_output = engine.recognize(str(preprocessed_path))
    job.engine_name = engine.name
    job.save(update_fields=["engine_name"])
    return correct_latex_result(latex_output, job.original_image.path)


def prepare_formula_image(job: FormulaJob) -> Path:
    preprocessed_path = preprocess_image_file(job.original_image.path)
    job.preprocessed_image.name = _media_relative_path(preprocessed_path)
    job.save(update_fields=["preprocessed_image"])
    return preprocessed_path


def _media_relative_path(path: Path) -> str:
    media_root = Path(settings.MEDIA_ROOT).resolve()
    return path.resolve().relative_to(media_root).as_posix()
