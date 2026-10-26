import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis = null

// ── Pages ─────────────────────────────────────────────────────────────────────
// Where the scroll may come to rest. By default a chapter rests at its top; one taller than
// the screen also rests on its last screen and is read freely in between. A pinned scene
// lists its own resting points instead (a project card, a milestone, the finished reveal).
const custom = new Map() // chapter id → () => ({ stops: number[], free?: [from, to][] }) | null

export function setPages(id, fn) {
  custom.set(id, fn)
}

export const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY

/** A stretch of flowing content: rest at its top and on its last screen, read freely between. */
export function flowPages(top, bottom) {
  const last = bottom - window.innerHeight
  return last > top + 8 ? { stops: [top, last], free: [[top, last]] } : { stops: [top], free: [] }
}

function layout() {
  const max = lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight
  const clampY = (y) => Math.round(gsap.utils.clamp(0, max, y))
  const stops = []
  const free = []
  const anchors = {}
  document.querySelectorAll('section[data-chapter], footer[data-chapter]').forEach((el) => {
    const id = el.dataset.chapter
    let pages = custom.get(id)?.()
    if (!pages) {
      const host = el.closest('.pin-spacer') ?? el
      const top = pageTop(host)
      pages = flowPages(top, top + host.offsetHeight)
    }
    const own = pages.stops.map(clampY)
    anchors[id] = own[0]
    stops.push(...own)
    free.push(...(pages.free ?? []))
  })
  stops.sort((a, b) => a - b)
  return { stops: stops.filter((y, i) => i === 0 || y - stops[i - 1] > 4), free, anchors }
}

// ── Snapping ──────────────────────────────────────────────────────────────────
// Once the scroll comes to rest, it glides on to the next page in the direction the reader
// was going (or back, if they barely moved). Never while a finger is on the screen.
let snapping = false

function initSnap() {
  let touching = false
  let dir = 1
  let timer = 0

  const settle = () => {
    if (snapping || touching || lenis.isStopped) return
    const y = lenis.scroll
    const { stops, free } = layout()
    if (free.some(([a, b]) => y > a + 2 && y < b - 2)) return
    const next = stops.find((s) => s >= y - 2)
    const prev = stops.findLast((s) => s <= y + 2)
    if (next === undefined || prev === undefined || Math.abs(next - y) <= 2 || Math.abs(y - prev) <= 2) return
    const nudge = Math.min(window.innerHeight * 0.05, (next - prev) * 0.25)
    const target = dir > 0 ? (y - prev > nudge ? next : prev) : next - y > nudge ? prev : next
    glide(target)
  }
  const settleSoon = () => {
    clearTimeout(timer)
    timer = setTimeout(settle, 140)
  }

  lenis.on('scroll', (l) => {
    if (!snapping && l.direction) dir = l.direction
    settleSoon()
  })
  // The reader takes over: a glide in progress gives way to them.
  const takeOver = () => (snapping = false)
  addEventListener('wheel', takeOver, { passive: true })
  addEventListener('keydown', takeOver)
  addEventListener('touchstart', () => ((touching = true), takeOver()), { passive: true })
  addEventListener('touchend', () => ((touching = false), settleSoon()), { passive: true })
}

const easeOut = (t) => 1 - Math.pow(1 - t, 4)

function glide(y, duration) {
  snapping = true
  const d = duration ?? gsap.utils.clamp(0.6, 1.5, 0.5 + (Math.abs(y - lenis.scroll) / window.innerHeight) * 0.22)
  lenis.scrollTo(y, { duration: d, easing: easeOut, onComplete: () => (snapping = false) })
}

// ── Smooth scroll ─────────────────────────────────────────────────────────────
export function initScroll(reduce) {
  if (reduce) return null
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  initSnap()
  return lenis
}

export const getLenis = () => lenis

/** Go to a chapter's first page (for a pinned scene, the start of the scene, not its end). */
export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target) : target
  if (!el) return
  const id = el.dataset.chapter
  const y = id ? layout().anchors[id] : pageTop(el.closest('.pin-spacer') ?? el)
  if (lenis) {
    if (immediate) lenis.scrollTo(y, { immediate: true })
    else glide(y, 1.8)
  } else {
    window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
  }
}

export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start()
  else document.documentElement.style.overflow = locked ? 'hidden' : ''
}
