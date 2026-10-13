"""Turn the source paintings into web-ready images.

For every PNG in assets-src/ this writes to public/images/:
  <name>-<w>.avif / .webp       colour versions at 960, 1600 and 2560 px wide
  <name>-ink-<w>.webp           a black-and-white screentone ("manga ink") version
                                (only for images listed in INK_FOR)

Usage:  python3 scripts/process_images.py      (or: npm run images)
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "images"

WIDTHS = (960, 1600, 2560)
INK_WIDTHS = (1600, 2560)
INK_FOR = {"meadow-day"}  # the hero is the only scene that turns to ink
PAPER = (244, 239, 228)
INK = (17, 17, 19)


def save_colour(img: Image.Image, name: str) -> None:
    for w in WIDTHS:
        h = round(img.height * w / img.width)
        im = img.resize((w, h), Image.LANCZOS)
        im.save(OUT / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
        im.save(OUT / f"{name}-{w}.avif", "AVIF", quality=58, speed=4)


def mangaize(img: Image.Image, cell: float) -> Image.Image:
    """Screentone conversion at the source resolution (downsampled later for anti-aliasing)."""
    grey = img.convert("L")
    soft = np.asarray(grey.filter(ImageFilter.GaussianBlur(cell * 0.45)), dtype=np.float32) / 255.0

    # Tone curve: lift contrast so the result reads as ink, not as a grey photo.
    tone = np.clip((soft - 0.10) / 0.80, 0.0, 1.0) ** 1.15
    dark = 1.0 - tone

    # Classic AM halftone: dots on a 45° grid whose area follows the darkness.
    h, w = dark.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    c = s = np.float32(np.sqrt(0.5))
    u = (xx * c + yy * s) / cell
    v = (-xx * s + yy * c) / cell
    fu = u - np.floor(u) - 0.5
    fv = v - np.floor(v) - 0.5
    dist = np.sqrt(fu * fu + fv * fv)
    radius = np.sqrt(dark / np.pi)
    ink = dist < radius
    ink |= dark > 0.84          # solid blacks
    ink &= dark > 0.14          # clean paper highlights

    # Ink outlines from the luminance gradient of a heavier blur.
    edge_src = np.asarray(grey.filter(ImageFilter.GaussianBlur(cell * 0.9)), dtype=np.float32)
    gy, gx = np.gradient(edge_src)
    mag = np.hypot(gx, gy)
    ink |= mag > np.percentile(mag, 95.5)

    out = np.where(ink, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "L")


def save_ink(img: Image.Image, name: str) -> None:
    # Dot cell of 16 px at 5120 wide -> 8 px at 2560 -> 5 px at 1600: a fine screentone.
    cell = img.width / 320
    ink = mangaize(img, cell)
    for w in INK_WIDTHS:
        h = round(img.height * w / img.width)
        im = ink.resize((w, h), Image.LANCZOS)
        im = ImageOps.colorize(im, black=INK, white=PAPER)
        im.save(OUT / f"{name}-ink-{w}.webp", "WEBP", quality=82, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sources = sorted(SRC.glob("*.png"))
    if not sources:
        raise SystemExit(f"No PNGs found in {SRC}")
    for path in sources:
        name = path.stem
        img = Image.open(path).convert("RGB")
        print(f"{name}: {img.width}x{img.height}")
        save_colour(img, name)
        if name in INK_FOR:
            save_ink(img, name)
    for f in sorted(OUT.iterdir()):
        print(f"  {f.name:32} {f.stat().st_size / 1024:8.0f} KB")


if __name__ == "__main__":
    main()
