from __future__ import annotations

import random
from io import BytesIO
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps/formulas/static/formulas/visuals/landing-mission-bg.png"
WIDTH = 1920
HEIGHT = 1100
RANDOM_SEED = 20260519

FORMULAS = [
    r"$R_{\mu\nu}-\frac{1}{2}Rg_{\mu\nu}+\Lambda g_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}$",
    r"$i\hbar\frac{\partial\Psi}{\partial t}=\hat{H}\Psi$",
    r"$\nabla\times\vec{B}=\mu_0\vec{J}+\mu_0\varepsilon_0\frac{\partial\vec{E}}{\partial t}$",
    r"$\mathcal{F}\{f\}(\omega)=\int_{-\infty}^{\infty}f(t)e^{-i\omega t}\,dt$",
    r"$\zeta(s)=\prod_{p}(1-p^{-s})^{-1}$",
    r"$D_{KL}(p\|q)=\sum_x p(x)\log\frac{p(x)}{q(x)}$",
    r"$\frac{\partial \rho}{\partial t}+\nabla\cdot(\rho\vec{u})=0$",
    r"$\mathcal{H}\Psi_n=E_n\Psi_n$",
    r"$S=-k_B\sum_i p_i\log p_i$",
    r"$\dot{x}=Ax+Bu,\quad y=Cx+Du$",
]


def main() -> None:
    random.seed(RANDOM_SEED)
    image = Image.new("RGBA", (WIDTH, HEIGHT), (3, 3, 3, 255))
    draw_grid(image)
    draw_measurement_rectangles(image)
    draw_formula_field(image)
    draw_noise(image)
    draw_scanlines(image)
    draw_vignette(image)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT)
    print(f"Wrote {OUTPUT}")


def draw_grid(image: Image.Image) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for x in range(0, WIDTH, 64):
        alpha = 10 if x % 256 == 0 else 4
        draw.line((x, 0, x, HEIGHT), fill=(255, 255, 255, alpha), width=1)
    for y in range(0, HEIGHT, 56):
        alpha = 9 if y % 224 == 0 else 3
        draw.line((0, y, WIDTH, y), fill=(255, 255, 255, alpha), width=1)
    image.alpha_composite(overlay)


def draw_measurement_rectangles(image: Image.Image) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    rectangles = [
        (120, 118, 470, 268),
        (520, 78, 910, 198),
        (735, 240, 960, 376),
        (1030, 150, 1210, 360),
        (1332, 260, 1486, 392),
        (1540, 92, 1780, 202),
        (210, 500, 612, 704),
        (654, 422, 832, 590),
        (860, 602, 1236, 820),
        (1094, 470, 1196, 548),
        (1250, 450, 1512, 596),
        (1560, 430, 1715, 510),
        (72, 742, 332, 874),
        (404, 826, 636, 996),
        (720, 782, 862, 958),
        (1460, 768, 1764, 948),
    ]
    for i, box in enumerate(rectangles):
        alpha = 34 if i % 2 else 24
        draw.rectangle(box, outline=(255, 255, 255, alpha), width=1)
        x0, y0, x1, y1 = box
        tick = 18
        for x, y, sx, sy in [
            (x0, y0, tick, 0),
            (x0, y0, 0, tick),
            (x1, y0, -tick, 0),
            (x1, y0, 0, tick),
            (x0, y1, tick, 0),
            (x0, y1, 0, -tick),
            (x1, y1, -tick, 0),
            (x1, y1, 0, -tick),
        ]:
            draw.line((x, y, x + sx, y + sy), fill=(255, 255, 255, alpha + 12), width=1)
    image.alpha_composite(overlay)


def draw_formula_field(image: Image.Image) -> None:
    placements = [
        (116, 214, 21, 0.11, -0.8, 1.4),
        (1088, 282, 34, 0.22, 0.4, 1.0),
        (616, 438, 23, 0.13, -0.5, 1.8),
        (1090, 608, 29, 0.18, 0.7, 1.2),
        (56, 736, 18, 0.08, 0.4, 2.3),
        (784, 842, 23, 0.12, -0.4, 1.8),
        (1366, 782, 28, 0.16, 0.2, 1.1),
        (424, 594, 36, 0.2, -0.6, 0.7),
        (1466, 214, 19, 0.09, 0.2, 2.2),
        (1216, 936, 20, 0.1, -0.2, 2.0),
    ]
    for index, placement in enumerate(placements):
        x, y, size, opacity, rotation, blur_radius = placement
        formula = FORMULAS[index % len(FORMULAS)]
        rendered = render_formula(formula, size=size, opacity=opacity)
        if rotation:
            rendered = rendered.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
        if blur_radius:
            rendered = rendered.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        image.alpha_composite(rendered, (x, y))


def render_formula(formula: str, size: int, opacity: float) -> Image.Image:
    figure = plt.figure(figsize=(8, 1.4), dpi=180)
    figure.patch.set_alpha(0)
    figure.text(
        0.0,
        0.5,
        formula,
        color=(1, 1, 1, opacity),
        fontsize=size,
        va="center",
        ha="left",
    )
    buffer = BytesIO()
    figure.savefig(buffer, format="png", transparent=True, bbox_inches="tight", pad_inches=0.03)
    plt.close(figure)
    buffer.seek(0)
    formula_image = Image.open(buffer).convert("RGBA")
    bbox = formula_image.getbbox()
    if bbox is None:
        return Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    return formula_image.crop(bbox)


def draw_noise(image: Image.Image) -> None:
    noise = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    pixels = noise.load()
    for _ in range(24000):
        x = random.randrange(WIDTH)
        y = random.randrange(HEIGHT)
        alpha = random.randrange(8, 34)
        pixels[x, y] = (255, 255, 255, alpha)
    softened = noise.filter(ImageFilter.GaussianBlur(radius=0.35))
    image.alpha_composite(softened)


def draw_scanlines(image: Image.Image) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for y in range(0, HEIGHT, 7):
        draw.line((0, y, WIDTH, y), fill=(255, 255, 255, 4), width=1)
    image.alpha_composite(overlay)


def draw_vignette(image: Image.Image) -> None:
    radial = Image.new("L", (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(radial)
    draw.ellipse((-520, -300, WIDTH + 480, HEIGHT + 410), fill=255)
    radial = radial.filter(ImageFilter.GaussianBlur(radius=140))
    inverse = ImageChops.invert(radial)
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 110))
    vignette.putalpha(inverse.point(lambda value: int(value * 0.48)))
    image.alpha_composite(vignette)


if __name__ == "__main__":
    main()
