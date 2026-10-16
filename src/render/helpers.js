import { chapterById } from '../data/chapters.js'

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c])

// Each painting's size and the widths scripts/process_images.py writes for it.
const IMG = { width: 2560, height: 1434, widths: [960, 1600, 2560] }
const PORTRAIT_IMG = { width: 941, height: 1672, widths: [720, 941] }
const img = (name) => (name.endsWith('-portrait') ? PORTRAIT_IMG : IMG)

/** `sizes` for a 16:9 image covering the viewport: taller-than-16:9 screens crop it by height. */
export const COVER_SIZES = '(max-aspect-ratio: 16/9) 178vh, 100vw'

/** Phones held upright get portrait paintings (`<name>-portrait`). Keep in step with hero.css. */
export const PORTRAIT = '(max-width: 760px) and (max-aspect-ratio: 4/5)'
export const portraitArt = (name) => ({
  name: `${name}-portrait`,
  media: PORTRAIT,
  sizes: '(max-aspect-ratio: 941/1672) 56.3vh, 100vw', // covering the screen, like COVER_SIZES
})
export const HERO_PORTRAIT = portraitArt('meadow-day')

const srcset = (name, ext) => img(name).widths.map((w) => `images/${name}-${w}.${ext} ${w}w`).join(', ')

/** `art` swaps in a differently framed painting wherever `art.media` matches. */
export function picture(name, { alt = '', cls = '', sizes = '100vw', eager = false, art = null } = {}) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"'
  const { width, height } = img(name)
  const artSources = art
    ? ['avif', 'webp']
        .map((ext) => `<source media="${art.media}" type="image/${ext}" srcset="${srcset(art.name, ext)}" sizes="${art.sizes}" width="${img(art.name).width}" height="${img(art.name).height}">`)
        .join('\n    ')
    : ''
  return `<picture class="${cls}">
    ${artSources}
    <source type="image/avif" srcset="${srcset(name, 'avif')}" sizes="${sizes}">
    <img src="images/${name}-1600.webp" srcset="${srcset(name, 'webp')}" sizes="${sizes}" alt="${esc(alt)}" width="${width}" height="${height}" ${loading} decoding="async">
  </picture>`
}

/** Preloads for the hero painting, one per framing, so each screen fetches only its own. */
export const heroPreload = () =>
  [
    { media: `not all and ${PORTRAIT}`, name: 'meadow-day', sizes: COVER_SIZES },
    { media: PORTRAIT, name: HERO_PORTRAIT.name, sizes: HERO_PORTRAIT.sizes },
  ]
    .map(
      (p) => `<link rel="preload" as="image" type="image/avif" media="${p.media}"
      imagesrcset="${srcset(p.name, 'avif')}"
      imagesizes="${p.sizes}" fetchpriority="high" />`,
    )
    .join('\n    ')

/** Accessible glitch text: a hidden plain copy for screen readers, a decorative layer to animate. */
export const glitchText = (text, { dark = false } = {}) =>
  `<span class="sr-only">${esc(text)}</span><span class="glitch${dark ? ' glitch--dark' : ''}" data-text="${esc(text)}" aria-hidden="true">${esc(text)}</span>`

export function chapterHead(id, { light = false } = {}) {
  const c = chapterById[id]
  return `<header class="chead${light ? ' chead--light' : ''}">
    <p class="chead__kicker kicker" aria-hidden="true">
      <span class="chead__no">${esc(c.no)}</span><span>${esc(c.num)}</span><span class="rule"></span><span>${esc(c.title)}</span>
    </p>
    <h2 class="chead__title">${glitchText(c.label, { dark: light })}</h2>
  </header>`
}

/** A red hanko seal; four characters read right column first, like a real 印. Three
 *  characters are cut the way a 三字印 is: the first alone down the right column. */
export const seal = (text, size, cls = '') => {
  const chars = [...text]
  const inner = chars.length === 3 ? chars.map((c) => `<span>${esc(c)}</span>`).join('') : esc(text)
  return `<span class="seal ${cls}" style="--size:${size}px" aria-hidden="true"><span class="seal__text${chars.length === 3 ? ' seal__text--3' : ''}">${inner}</span></span>`
}

export const arrow = `<svg class="ico-arrow" viewBox="0 0 64 24" aria-hidden="true"><path d="M2 12h54M44 3l14 9-14 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>`

export const external = `<svg class="ico-ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h8v8M13 3 3 13" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
