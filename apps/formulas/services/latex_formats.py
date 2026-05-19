import re


VECTOR_ROMAN_PATTERN = re.compile(r"\\vec\{\\mathrm\{([A-Za-z])\}\}")


def normalize_latex(value: str) -> str:
    text = value.strip()
    if text.startswith("$$") and text.endswith("$$") and len(text) >= 4:
        text = text[2:-2].strip()
    elif text.startswith("$") and text.endswith("$") and len(text) >= 2:
        text = text[1:-1].strip()
    text = VECTOR_ROMAN_PATTERN.sub(r"\\vec{\1}", text)
    return " ".join(text.split())


def build_latex_formats(value: str) -> dict[str, str]:
    raw = normalize_latex(value)
    return {
        "raw": raw,
        "block": f"$${raw}$$",
        "inline": f"${raw}$",
        "render": raw,
    }
