# VOL.01 — a manga-style portfolio

A portfolio you read like a manga volume. Every section is a chapter, each one an homage to a
different anime, and the story moves from noon to night as you scroll.

| Chapter | Homage | Section |
|---|---|---|
| 序章 Prologue | JoJo / manga | Hero — the painting shatters into manga panels and turns to screentone ink |
| 第一話 Romance Dawn | One Piece | About — WANTED poster with a live bounty counter |
| 第二話 Fly High | Haikyuu!! | Skills — a volleyball is spiked into the stat hexagon |
| 第三話 Bankai | Bleach | Tech arsenal — chapter poem, blades released with a katana slash |
| 巻頭カラー | — | Colour spread interlude |
| 第四話 Mission Log | Naruto | Projects — horizontal scroll of S/A/B-rank mission scrolls |
| 第五話 Arise | Solo Leveling | Journey — System windows, level / rank / EXP climb as you scroll |
| 第六話 Over 9000 | Dragon Ball | Numbers — the scouter reads your stats until it cracks |
| 第七話 Domain Expansion | Jujutsu Kaisen | Contact — 領域展開 opens the night valley |
| 完 | — | Footer |

See [PLAN.md](PLAN.md) for the full design plan.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve the build
```

## Make it yours

**All content lives in [`src/data/profile.js`](src/data/profile.js)** — name, katakana name, role,
about, skills, tech arsenal, projects, journey, numbers, contact links. The HTML is generated
from that file at build time, so you never need to touch the markup.

- Photo for the WANTED poster: put it in `public/images/` and set `photo: 'images/me.webp'`.
- Project screenshots: set `image` on each project (otherwise a manga focus-line panel is drawn).
- Chapter titles, colours and order: [`src/data/chapters.js`](src/data/chapters.js).

### Swapping the paintings

The originals are not committed (they are ~20 MB each). Put PNGs in `assets-src/` and run:

```bash
pip install pillow numpy
npm run images
```

This writes AVIF/WebP at 960/1600/2560 px plus a generated black-and-white screentone
("manga ink") version of each image into `public/images/`. File names map to sections:
`meadow-day` → hero, `meadow-peaks` → colour spread, `valley-night` → domain expansion.

## Stack

Vite · GSAP (ScrollTrigger, SplitText) · Lenis · Canvas 2D · Fontsource fonts.
Respects `prefers-reduced-motion` (no pinning or effects, everything static and readable).

All anime motifs are original fan homages — no official artwork or logos are used.
