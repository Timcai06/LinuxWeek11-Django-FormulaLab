import hashlib
import re
from pathlib import Path

from django.conf import settings
from PIL import Image


SAFE_FILENAME_PATTERN = re.compile(r"[^A-Za-z0-9._-]+")


def preprocess_image_file(path: str | Path) -> Path:
    source = Path(path)
    output_dir = Path(settings.MEDIA_ROOT) / "formula_preprocessed"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = _build_output_path(source, output_dir)

    with Image.open(source) as image:
        processed = _to_white_background_rgb(image)
        processed = _resize_to_max_side(processed, int(settings.FORMULA_LAB_MAX_IMAGE_SIDE))
        processed.save(output_path, format="PNG")

    return output_path


def _build_output_path(source: Path, output_dir: Path) -> Path:
    safe_stem = SAFE_FILENAME_PATTERN.sub("_", source.stem).strip("._-") or "image"
    content_hash = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    path_hash = hashlib.sha256(str(source.resolve()).encode("utf-8")).hexdigest()[:8]
    output_path = output_dir / f"{safe_stem}_{content_hash}_{path_hash}.png"
    if source.resolve() == output_path.resolve():
        output_path = output_dir / f"{safe_stem}_{content_hash}_{path_hash}_preprocessed.png"
    return output_path


def _to_white_background_rgb(image: Image.Image) -> Image.Image:
    if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        background.alpha_composite(rgba)
        return background.convert("RGB")
    return image.convert("RGB")


def _resize_to_max_side(image: Image.Image, max_side: int) -> Image.Image:
    current_max_side = max(image.size)
    if max_side <= 0 or current_max_side <= max_side:
        return image

    scale = max_side / current_max_side
    width = max(1, round(image.width * scale))
    height = max(1, round(image.height * scale))
    return image.resize((width, height), Image.Resampling.LANCZOS)
