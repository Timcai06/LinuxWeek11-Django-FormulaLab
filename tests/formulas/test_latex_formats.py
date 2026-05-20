import hashlib
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import SimpleTestCase

from apps.formulas.services import latex_formats
from apps.formulas.services.latex_formats import build_latex_formats, correct_latex_result, normalize_latex


class LatexFormatTests(SimpleTestCase):
    def test_normalize_latex_strips_outer_dollars(self):
        self.assertEqual(normalize_latex(" $$ x^2 $$ "), "x^2")
        self.assertEqual(normalize_latex(" $ y + 1 $ "), "y + 1")

    def test_normalize_latex_collapses_internal_whitespace(self):
        self.assertEqual(normalize_latex("  x   +\n  y  "), "x + y")

    def test_normalize_latex_simplifies_vector_roman_letters(self):
        self.assertEqual(
            normalize_latex(r"\vec{\mathrm{B}}+\vec{\mathrm{E}}"),
            r"\vec{B}+\vec{E}",
        )

    def test_normalize_latex_simplifies_simple_double_brace_commands(self):
        self.assertEqual(normalize_latex(r"6.\overline{{3}}"), r"6.\overline{3}")

    def test_correct_latex_result_uses_known_image_hash(self):
        with TemporaryDirectory() as tmpdir:
            image_path = Path(tmpdir) / "sample.png"
            image_path.write_bytes(b"known course sample")
            digest = hashlib.sha256(image_path.read_bytes()).hexdigest()[:12]

            with patch.dict(latex_formats.KNOWN_IMAGE_CORRECTIONS, {digest: r"\fixed"}):
                self.assertEqual(correct_latex_result(r"\bad", image_path), r"\fixed")

    def test_latex_formats_build_block_inline_and_render(self):
        formats = build_latex_formats(r"\frac{a}{b}")

        self.assertEqual(
            formats,
            {
                "raw": r"\frac{a}{b}",
                "block": r"$$\frac{a}{b}$$",
                "inline": r"$\frac{a}{b}$",
                "render": r"\frac{a}{b}",
            },
        )
