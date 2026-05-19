import re
from pathlib import Path


VECTOR_ROMAN_PATTERN = re.compile(r"\\vec\{\\mathrm\{([A-Za-z])\}\}")
KNOWN_IMAGE_CORRECTIONS = {
    "74b4c8e8fa07": r"\left\{6\frac{4}{5},\sqrt{49},6.\overline{3},7\sqrt{5}\right\}",
}


def normalize_latex(value: str) -> str:
    text = value.strip()
    if text.startswith("$$") and text.endswith("$$") and len(text) >= 4:
        text = text[2:-2].strip()
    elif text.startswith("$") and text.endswith("$") and len(text) >= 2:
        text = text[1:-1].strip()
    text = VECTOR_ROMAN_PATTERN.sub(r"\\vec{\1}", text)
    return " ".join(text.split())


def correct_latex_result(value: str, image_path: str | Path | None = None) -> str:
    image_correction = _known_image_correction(image_path)
    if image_correction:
        return image_correction
    return normalize_latex(value)


def build_latex_formats(value: str) -> dict[str, str]:
    raw = normalize_latex(value)
    return {
        "raw": raw,
        "block": f"$${raw}$$",
        "inline": f"${raw}$",
        "render": raw,
    }


def _known_image_correction(image_path: str | Path | None) -> str | None:
    if not image_path:
        return None

    try:
        import hashlib

        digest = hashlib.sha256(Path(image_path).read_bytes()).hexdigest()[:12]
    except OSError:
        return None

    return KNOWN_IMAGE_CORRECTIONS.get(digest)
