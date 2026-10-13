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

export function chapterHead(id, { light = false } = {}) {
  const c = chapterById[id]
  return `<header class="chead${light ? ' chead--light' : ''}">
    <span class="chead__no" aria-hidden="true">${esc(c.no)}</span>
    <h2 class="chead__title"><span class="chead__title-text" data-split>${esc(c.title)}</span></h2>
    <span class="chead__sub">${esc(c.sub)}</span>
  </header>`
}

export const arrow = `<svg class="ico-arrow" viewBox="0 0 64 24" aria-hidden="true"><path d="M2 12h54M44 3l14 9-14 9" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="square"/></svg>`

export const external = `<svg class="ico-ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h8v8M13 3 3 13" fill="none" stroke="currentColor" stroke-width="2"/></svg>`

export const volleyball = `<svg class="ico-ball" viewBox="-50 -50 100 100" aria-hidden="true">
  <circle r="46" fill="#fff8ec" stroke="#111" stroke-width="5"/>
  <path d="M-6-45C-30-20-30 20-8 44M-44 10C-10 2 26 14 40 30M-28-36C2-28 30-6 44 18" fill="none" stroke="#111" stroke-width="4.5"/>
  <path d="M-6-45C-30-20-30 20-8 44" fill="none" stroke="#ff6b00" stroke-width="2.5" transform="translate(9 0)"/>
</svg>`

export const shuriken = `<svg class="ico-shuriken" viewBox="-50 -50 100 100" aria-hidden="true">
  <path d="M0-48 10-10 48 0 10 10 0 48-10 10-48 0-10-10Z" fill="currentColor"/>
  <circle r="7" fill="var(--paper)"/>
</svg>`
