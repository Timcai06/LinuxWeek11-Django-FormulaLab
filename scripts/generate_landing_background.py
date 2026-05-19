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
    r"$\int_0^\pi e^x \sin x\,dx = \frac{1+e^\pi}{2}$",
    r"$\sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6}$",
    r"$\frac{\partial u}{\partial t} = \alpha \Delta u$",
    r"$\lim_{x\to0}\frac{\sin x}{x}=1$",
    r"$\nabla\cdot\vec{E}=\frac{\rho}{\varepsilon_0}$",
    r"$\mathcal{L}\{f(t)\}=\int_0^\infty f(t)e^{-st}\,dt$",
    r"$P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}$",
    r"$\sigma(x)=\frac{1}{1+e^{-x}}$",
    r"$\oint_{\partial\Omega}\omega=\int_\Omega d\omega$",
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
        (1030, 150, 1210, 360),
        (1540, 92, 1780, 202),
        (210, 500, 612, 704),
        (860, 602, 1236, 820),
        (1250, 450, 1512, 596),
        (1560, 430, 1715, 510),
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
        (210, 238, 28, 0.18, -1.2),
        (1180, 318, 31, 0.16, 0.4),
        (520, 512, 38, 0.17, -0.8),
        (1290, 690, 32, 0.13, 1.0),
        (90, 784, 24, 0.12, 0.3),
        (830, 904, 30, 0.14, -0.5),
        (1380, 916, 28, 0.10, 0.7),
    ]
    for index, placement in enumerate(placements):
        x, y, size, opacity, rotation = placement
        formula = FORMULAS[index % len(FORMULAS)]
        rendered = render_formula(formula, size=size, opacity=opacity)
        if rotation:
            rendered = rendered.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
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
    draw.ellipse((-420, -260, WIDTH + 220, HEIGHT + 360), fill=255)
    radial = radial.filter(ImageFilter.GaussianBlur(radius=120))
    inverse = ImageChops.invert(radial)
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 150))
    vignette.putalpha(inverse.point(lambda value: int(value * 0.78)))
    image.alpha_composite(vignette)


if __name__ == "__main__":
    main()
