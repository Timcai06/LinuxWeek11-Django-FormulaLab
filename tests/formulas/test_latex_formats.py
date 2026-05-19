from django.test import SimpleTestCase

from apps.formulas.services.latex_formats import build_latex_formats, normalize_latex


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
