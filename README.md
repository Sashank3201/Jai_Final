# VOL.01 — a manga-style portfolio

A portfolio you read like a manga volume. Every section is a chapter, each one an homage to a
different anime, and the story moves from noon to night as you scroll.

| Chapter | Homage | Section |
|---|---|---|
| 序章 Prologue | JoJo / manga | Hero — a greeting; the spear cuts, the painting shatters into manga panels and turns to screentone ink, and your full name is revealed |
| 第一話 Romance Dawn | One Piece | About Me — photo, bio, facts |
| 第二話 Bankai | Bleach | Technical Skills — blades released with a katana slash, then the chapter poem |
| 第三話 Mission Log | Naruto | Projects — horizontal track of mission cards |
| 第四話 Arise | Solo Leveling | Experience — System windows, level / rank / EXP climb as you scroll |
| 第五話 Domain Expansion | Jujutsu Kaisen | Contact Me — 領域展開 opens the night valley |
| 完 | — | Footer |

The page turns like a book: one notch of the wheel, one swipe or one arrow key glides to the
next page and settles there — the title card, a section, a project card, a System window, the
poem. A trackpad's momentum never skips a page. A section taller than the screen is turned a
screen at a time, each step landing on the start of a block (mark it with `data-mark`).

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
the cover's greeting, about, tech arsenal, projects, journey, contact links. The HTML is generated
from that file at build time, so you never need to touch the markup.

- Photo for the WANTED poster: put it in `public/images/` and set `photo: 'images/me.webp'`.
- Project screenshots: set `image` on each project (otherwise a manga focus-line panel is drawn).
- Link previews: set `site` to the deployed address (e.g. `https://you.vercel.app`) so LinkedIn,
  WhatsApp and X show the `public/og.jpg` card. Re-shoot it at 1200×630 if you change the hero.
- Chapter titles, colours and order: [`src/data/chapters.js`](src/data/chapters.js).

### Swapping the paintings

The originals are not committed (they are ~20 MB each). Put PNGs in `assets-src/` and run:

```bash
pip install pillow numpy
npm run images
```

This writes AVIF/WebP at 960/1600/2560 px plus a generated black-and-white screentone
("manga ink") version of the hero (a 4-colour PNG) into `public/images/`. File names map to sections:
`meadow-day` → hero, `valley-night` → domain expansion.

## Stack

Vite · GSAP (ScrollTrigger, SplitText) · Lenis · Canvas 2D · Fontsource fonts.
Respects `prefers-reduced-motion` (no pinning or effects, everything static and readable).

All anime motifs are original fan homages — no official artwork or logos are used.
