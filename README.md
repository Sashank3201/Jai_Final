# VOL.01 — a manga-style portfolio

A portfolio you read like a manga volume. Every section is a chapter, and the story moves
from noon to night as you scroll.

| Chapter | Section |
|---|---|
| 序章 Prologue | Hero — the painting shatters into manga panels and turns to screentone ink |
| 第一話 | Profile — photo, bio, facts |
| 第二話 | Technical Skills — the stack, released row by row, then a closing poem |
| 第三話 | Projects — a horizontal track of project cards |
| 第四話 | Experience — a timeline of glowing windows along a milestone axis |
| 第五話 | Contact Me — the night valley opens in a ring, then the contact card |
| 完 | Footer |

The page snaps: each scroll settles on the next page — a section, a project card, a milestone.
A section taller than the screen is read freely between its first and last screen.

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
about, tech arsenal, projects, journey, contact links. The HTML is generated
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
`meadow-day` → hero, `valley-night` → domain expansion.

## Stack

Vite · GSAP (ScrollTrigger, SplitText) · Lenis · Canvas 2D · Fontsource fonts.
Respects `prefers-reduced-motion` (no pinning or effects, everything static and readable).

All anime motifs are original fan homages — no official artwork or logos are used.
