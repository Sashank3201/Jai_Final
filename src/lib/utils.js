export const TAU = Math.PI * 2
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const rand = (min, max) => min + Math.random() * (max - min)
export const pick = (arr) => arr[(Math.random() * arr.length) | 0]

export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
export const isFinePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches
export const isDesktop = () => matchMedia('(min-width: 900px)').matches

/** Size a canvas to its CSS box, honouring devicePixelRatio (capped for performance). */
export function fitCanvas(canvas, maxDpr = 1.75) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width, height, dpr }
}

/** Calls cb(true/false) as the element enters/leaves the viewport. */
export function onVisibility(el, cb, rootMargin = '100px') {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { rootMargin })
  io.observe(el)
  return () => io.disconnect()
}

export function imageReady(img) {
  if (!img) return Promise.resolve()
  if (img.complete && img.naturalWidth) return img.decode?.().catch(() => {}) ?? Promise.resolve()
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  })
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Debounced window resize. */
export function onResize(cb, wait = 150) {
  let t
  const handler = () => {
    clearTimeout(t)
    t = setTimeout(cb, wait)
  }
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}
