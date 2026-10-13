import { chapterById } from '../data/chapters.js'

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c])

export const IMG = { width: 2560, height: 1434, widths: [960, 1600, 2560] }

const srcset = (name, ext) => IMG.widths.map((w) => `images/${name}-${w}.${ext} ${w}w`).join(', ')

export function picture(name, { alt = '', cls = '', sizes = '100vw', eager = false } = {}) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"'
  return `<picture class="${cls}">
    <source type="image/avif" srcset="${srcset(name, 'avif')}" sizes="${sizes}">
    <img src="images/${name}-1600.webp" srcset="${srcset(name, 'webp')}" sizes="${sizes}" alt="${esc(alt)}" width="${IMG.width}" height="${IMG.height}" ${loading} decoding="async">
  </picture>`
}

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

/** A red hanko seal; four characters read right column first, like a real 印. */
export const seal = (text, size, cls = '') =>
  `<span class="seal ${cls}" style="--size:${size}px" aria-hidden="true"><span class="seal__text">${esc(text)}</span></span>`

export const arrow = `<svg class="ico-arrow" viewBox="0 0 64 24" aria-hidden="true"><path d="M2 12h54M44 3l14 9-14 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>`

export const external = `<svg class="ico-ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h8v8M13 3 3 13" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
