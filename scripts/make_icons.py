"""App icons for the PWA: the red hanko seal with the initial, as in the favicon and nav.

Writes to public/icons/:
  icon-192.png, icon-512.png     the seal on transparency (browsers, install dialogs)
  icon-maskable-512.png          full-bleed red with a round seal inside the safe zone
                                 (Android crops it to its own shape)
  apple-touch-icon.png           180 px, full-bleed (iOS rounds the corners itself)

Usage:  python3 scripts/make_icons.py [initial]      (default: J)
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons"
FONT = ROOT / "node_modules/@fontsource/shippori-mincho/files/shippori-mincho-latin-800-normal.woff"
SHU = (210, 60, 42)  # --shu, the seal colour
PAPER = (255, 244, 236)
SS = 4  # supersampling, for clean edges


def glyph(draw, size, letter, height, centre):
    """Draws the letter so its ink box is `height` tall, centred on `centre`."""
    probe = ImageFont.truetype(str(FONT), 1000)
    l, t, r, b = probe.getbbox(letter)
    font = ImageFont.truetype(str(FONT), round(1000 * height / (b - t)))
    l, t, r, b = font.getbbox(letter)
    cx, cy = centre
    draw.text((cx - (l + r) / 2, cy - (t + b) / 2), letter, font=font, fill=PAPER)


def seal(px, letter):
    """The favicon's seal: a rounded red square with an inner cream rule, on transparency."""
    S = px * SS
    u = S / 64
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((4 * u, 4 * u, 60 * u, 60 * u), radius=8 * u, fill=SHU)
    d.rounded_rectangle((9 * u, 9 * u, 55 * u, 55 * u), radius=5 * u, outline=PAPER, width=round(3 * u))
    glyph(d, S, letter, 30 * u, (32 * u, 32.5 * u))
    return im.resize((px, px), Image.LANCZOS)


def maskable(px, letter):
    """Full-bleed red; a round seal well inside the 80 % safe zone."""
    S = px * SS
    im = Image.new("RGBA", (S, S), SHU + (255,))
    d = ImageDraw.Draw(im)
    r = S * 0.34
    w = round(S * 0.03)
    d.ellipse((S / 2 - r, S / 2 - r, S / 2 + r, S / 2 + r), outline=PAPER, width=w)
    glyph(d, S, letter, S * 0.36, (S / 2, S * 0.505))
    return im.resize((px, px), Image.LANCZOS)


def apple(px, letter):
    """Full-bleed red with the inner rule; iOS adds the rounded corners."""
    S = px * SS
    im = Image.new("RGBA", (S, S), SHU + (255,))
    d = ImageDraw.Draw(im)
    m = S * 0.12
    d.rounded_rectangle((m, m, S - m, S - m), radius=S * 0.08, outline=PAPER, width=round(S * 0.045))
    glyph(d, S, letter, S * 0.42, (S / 2, S * 0.505))
    return im.resize((px, px), Image.LANCZOS).convert("RGB")


def main():
    letter = sys.argv[1] if len(sys.argv) > 1 else "J"
    OUT.mkdir(parents=True, exist_ok=True)
    seal(192, letter).save(OUT / "icon-192.png", optimize=True)
    seal(512, letter).save(OUT / "icon-512.png", optimize=True)
    maskable(512, letter).save(OUT / "icon-maskable-512.png", optimize=True)
    apple(180, letter).save(OUT / "apple-touch-icon.png", optimize=True)
    for f in sorted(OUT.iterdir()):
        print(f"  {f.name:24} {f.stat().st_size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()
