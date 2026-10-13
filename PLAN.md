# Portfolio "VOL. 01" — Master Plan

> A portfolio you **read** like a manga volume. Every scroll turns a page.

## 1. The Big Idea

The whole site is one manga volume (第1巻). Each section is a chapter (第○話) and every chapter
is an homage "arc" to a different anime. Your three paintings carry the timeline: the story
starts at **noon** and ends under the **stars**.

| Time of day | Image | Where it lives |
|---|---|---|
| Noon, open sky | `meadow-day` (clouds + hills) | **Hero / Prologue** |
| Golden afternoon | `meadow-peaks` (snowy peaks + trees) | **Colour spread** interlude (巻頭カラー) |
| Night | `valley-night` (flower valley + sparkles) | **Domain Expansion / Contact** finale |

One visual language ties all the anime together: black ink, screentone dots, panel borders,
focus (speed) lines, katakana sound effects, vertical Japanese text, hanko (red seal) stamps.

## 2. Reading Order (sections)

| # | Chapter | Anime homage | Content | Signature scroll moment |
|---|---|---|---|---|
| 0 | Loader — Vol.01 cover | Manga cover | Name, volume no., loading counter | Cover splits into panels and flies off |
| — | **序章 Prologue (Hero)** | JoJo / general manga | Name, role, tagline | Painting shatters into manga panels, turns from colour to ink (screentone), panels fly away to reveal Chapter 1 |
| 1 | 第1話 Romance Dawn | **One Piece** | About me | WANTED poster swings in, bounty counts up, "DEAD" crossed out → "HIRE" |
| 2 | 第2話 Fly High | **Haikyuu!!** | Skills | Volleyball is tossed + spiked into the stat hexagon (ドゴッ!), radar chart fills |
| 3 | 第3話 Bankai | **Bleach** | Tech arsenal | Stark black page, chapter poem, tech cards "released" with a katana slash, spirit-pressure particles |
| — | 巻頭カラー Colour spread | — | A quote / breathing room | Afternoon painting expands from a tiny panel to full-bleed |
| 4 | 第4話 Mission Log | **Naruto** | Projects | Horizontal scroll of mission scrolls (S/A/B ranks), shuriken progress |
| 5 | 第5話 Arise | **Solo Leveling** | Journey / experience | Blue "System" windows pop up, EXP bar + level + rank E→S climb as you scroll |
| 6 | 第6話 Over 9000 | **Dragon Ball** | Numbers / achievements | Scouter scans, counters race, "IT'S OVER 9000!!", scouter cracks |
| 7 | 第7話 Domain Expansion | **Jujutsu Kaisen** | Contact | Screen goes black, 領域展開 slams in, the night valley expands as a domain, contact appears |
| — | 完 The End | — | Footer | "Thank you for reading", next-volume preview, read again ↺ |

## 3. Things that change while scrolling (global)

- **Accent colour** of the whole site shifts per chapter (red → orange → white → orange → blue → gold → purple).
- **Cursor** changes per chapter (ink dot → volleyball → spirit glow → spinning shuriken …).
- **Chapter HUD** (bottom-left) flips to the current chapter number in kanji + page number.
- **Reading progress** bar along the edge.
- **目次 Index** menu: full-screen manga table of contents to jump to any chapter.
- Smooth scrolling (Lenis) synced with GSAP ScrollTrigger for scrubbed, pinned scenes.

## 4. Tech

- **Vite** + vanilla JS modules → static site, deploy to Vercel / Netlify / GitHub Pages.
- **GSAP 3 + ScrollTrigger + SplitText + MotionPath** for the scroll choreography.
- **Lenis** for smooth scroll.
- **Canvas 2D** effects: petals, focus lines, spirit pressure, night sparkles.
- **Content in one file**: `src/data/profile.js`. HTML is pre-rendered from it at build time (SEO-friendly, no flash).
- **Images**: originals (5120×2868, ~20 MB each) → AVIF/WebP at 960/1600/2560 px, plus a generated
  black-and-white **screentone "manga" version** of each painting for the colour → ink effects.
- **Fonts** (self-hosted via Fontsource): Dela Gothic One (manga display + katakana), Yuji Boku
  (brush kanji), Shippori Mincho (poems/quotes), Alfa Slab One (wanted poster), Space Grotesk (body).

## 5. Quality bar

- `prefers-reduced-motion` → no pinning / shattering, simple fades, everything still readable.
- Mobile: horizontal sections become vertical, heavy effects scaled down, touch has no custom cursor.
- Canvases pause when off-screen; device-pixel-ratio capped; images lazy-loaded below the fold.
- Semantic headings, alt text, keyboard focus styles; decorative Japanese text is `aria-hidden`.
- No official anime artwork or logos — every motif is an original homage (shapes, colours, SFX,
  typography), so the site is safe to publish.

## 6. Phases

1. **Foundation** — project setup, image pipeline, design tokens, fonts, smooth scroll, cursor, nav/HUD/menu, loader.
2. **Hero** — the shatter-into-manga scene, petals, focus lines, title slam.
3. **Chapters 1–7 + colour spread + 完** with placeholder content.
4. **Polish** — responsive pass, reduced motion, performance, screenshots.
5. **Your bio** — swap placeholders in `src/data/profile.js` (name, katakana name, role, about, skills,
   projects, journey, numbers, contact, photo).
6. **Ship** — deploy (Vercel / Netlify / GitHub Pages), OG image, favicon.

## 7. What I need from you later

- Name (+ katakana if you have a preference), role/title, one-line tagline
- About-me paragraphs, location, a photo for the WANTED poster
- Skills with rough levels (6 for the hexagon + full tech list)
- Projects: title, one-liner, stack, links, image (optional), year
- Experience / education timeline
- Fun numbers (projects shipped, years coding, cups of chai…)
- Email + social links

---

# v2 — 愛蔵版 "Collector's Edition" (approved)

Same story and transitions, shot like an anime film title sequence / art book instead of a comic strip.
Anime is the cinematography, not the costume.

**Design system:** ink, warm paper, one vermillion accent (朱). Geist (sans), Geist Mono (labels),
Shippori Mincho (Japanese accents); the Yuji Boku brush only for 卍解, 領域展開 and 完. Hairlines,
manga panel grid, screentone only as texture, no outlines or hard shadows, calmer easing.
Chapter headings lead with what the section *is* (Profile, Capabilities…) and keep the anime
chapter name as the subtitle.

| Step | Scope | Status |
|---|---|---|
| 1 | Design system, chrome (loader/nav/HUD/menu/cursor), Hero, Profile, Contact, footer | ✅ done |
| 2 | Capabilities (fine-line hexagon), Core Stack (Bankai, quiet), Selected Work case studies, Journey timeline, Impact numbers | next |
| 3 | Innovation layer: "Ask Jai" RAG assistant (needs an LLM API key on Vercel), in-browser AI demo, WebGL "manga lens" in the hero | |
| 4 | Performance (subset CJK fonts), OG image, accessibility pass | |

**Still needed from Jai:** real bio sentences, 2–3 real projects with outcomes, GitHub/LinkedIn,
résumé PDF, location (optional), yes/no on "Ask Jai".
