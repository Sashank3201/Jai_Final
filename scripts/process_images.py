"""Turn the source paintings into web-ready images.

For every PNG in assets-src/ this writes to public/images/:
  <name>-<w>.avif / .webp       colour versions at 960, 1600 and 2560 px wide
                                (or the widths listed for it in WIDTHS_FOR)
  <name>-ink-<w>.png            a black-and-white screentone ("manga ink") version
                                (only for images listed in INK_FOR)

For every PNG in assets-src/photos/ (e.g. your WANTED-poster portrait):
  <name>.webp                   one 900 px wide version

Usage:  python3 scripts/process_images.py              (or: npm run images)
        python3 scripts/process_images.py meadow-day-portrait   (only the named sources)
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
PHOTOS = SRC / "photos"
OUT = ROOT / "public" / "images"

WIDTHS = (960, 1600, 2560)
# The phone paintings (*-portrait) are small: never upscale the colour art.
WIDTHS_FOR = {name: (720, 941) for name in ("meadow-day-portrait", "meadow-peaks-portrait", "valley-night-portrait")}
# Only the hero turns to ink. `cells` is how many screentone dots fit across the width, so
# both versions show dots of about the same size on screen; `upscale` paints a small
# source at a higher resolution first, so its dots and outlines stay crisp; `gamma` < 1
# lifts a darker painting (deep sky, saturated grass) to the same key as the other.
INK_FOR = {
    "meadow-day": {"widths": (1600, 2560), "cells": 320, "upscale": 1, "gamma": 1.0},
    "meadow-day-portrait": {"widths": (1176,), "cells": 103, "upscale": 3, "gamma": 0.45},
}
PHOTO_WIDTH = 900
PAPER = (244, 239, 228)
INK = (17, 17, 19)
# Ink is two colours plus anti-aliased edges, so a 4-colour PNG (paper -> ink) keeps it
# pixel-sharp at about a quarter of the size of a lossy WebP.
INK_PALETTE = Image.new("P", (1, 1))
INK_PALETTE.putpalette(
    [round(p + (k - p) * t) for t in (0, 1 / 3, 2 / 3, 1) for p, k in zip(PAPER, INK)] + [0] * (252 * 3)
)


def save_colour(img: Image.Image, name: str) -> None:
    for w in WIDTHS_FOR.get(name, WIDTHS):
        h = round(img.height * w / img.width)
        im = img.resize((w, h), Image.LANCZOS)
        im.save(OUT / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
        im.save(OUT / f"{name}-{w}.avif", "AVIF", quality=58, speed=4)


def mangaize(img: Image.Image, cell: float, gamma: float = 1.0) -> Image.Image:
    """Screentone conversion at the source resolution (downsampled later for anti-aliasing)."""
    grey = img.convert("L")
    if gamma != 1.0:
        grey = grey.point([round(255 * (v / 255) ** gamma) for v in range(256)])
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
    # meadow-day: a dot cell of 16 px at 5120 wide -> 8 px at 2560 -> 5 px at 1600.
    spec = INK_FOR[name]
    if spec["upscale"] > 1:
        img = img.resize((img.width * spec["upscale"], img.height * spec["upscale"]), Image.LANCZOS)
    ink = mangaize(img, img.width / spec["cells"], spec["gamma"])
    for w in spec["widths"]:
        h = round(img.height * w / img.width)
        im = ink.resize((w, h), Image.LANCZOS)
        im = ImageOps.colorize(im, black=INK, white=PAPER)
        im = im.quantize(palette=INK_PALETTE, dither=Image.Dither.NONE)
        im.save(OUT / f"{name}-ink-{w}.png", optimize=True)


def save_photo(img: Image.Image, name: str) -> None:
    w = min(PHOTO_WIDTH, img.width)
    im = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    sources = sorted(p for p in SRC.glob("*.png") if not only or p.stem in only)
    photos = sorted(p for p in PHOTOS.glob("*.png") if not only or p.stem in only)
    if not sources and not photos:
        raise SystemExit(f"No PNGs found in {SRC}")
    for path in photos:
        print(f"photo {path.stem}")
        save_photo(Image.open(path).convert("RGB"), path.stem)
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
