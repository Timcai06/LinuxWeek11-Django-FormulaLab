from pathlib import Path

from django.conf import settings

from apps.formulas.models import FormulaJob
from apps.formulas.services.latex_formats import normalize_latex
from apps.formulas.services.pix2tex_engine import Pix2TexEngine
from apps.formulas.services.preprocessing import preprocess_image_file


def recognize_formula(job: FormulaJob) -> str:
    preprocessed_path = preprocess_image_file(job.original_image.path)
    job.preprocessed_image.name = _media_relative_path(preprocessed_path)
    job.save(update_fields=["preprocessed_image"])

    latex = Pix2TexEngine().recognize(str(preprocessed_path))
    return normalize_latex(latex)


def _media_relative_path(path: Path) -> str:
    media_root = Path(settings.MEDIA_ROOT).resolve()
    return path.resolve().relative_to(media_root).as_posix()
