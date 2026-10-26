import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis = null

// ── Pages ─────────────────────────────────────────────────────────────────────
// Where the scroll may come to rest. By default a chapter rests at its top, and one taller
// than the screen also on its last screen (an edge). A pinned scene lists its own resting
// points instead (a project card, a System window, the finished reveal).
const custom = new Map() // chapter id → () => ({ stops: number[], edges?: number[] }) | null

export function setPages(id, fn) {
  custom.set(id, fn)
}

export const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY

/** A stretch of flowing content: a page at its top, an edge on its last screen. */
export function flowPages(top, bottom) {
  const last = bottom - window.innerHeight
  return { stops: [top], edges: last > top + 8 ? [last] : [] }
}

function layout() {
  const max = lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight
  const clampY = (y) => Math.round(gsap.utils.clamp(0, max, y))
  const pages = []
  const edges = []
  const anchors = {}
  document.querySelectorAll('section[data-chapter], footer[data-chapter]').forEach((el) => {
    const id = el.dataset.chapter
    let own = custom.get(id)?.()
    if (!own) {
      const host = el.closest('.pin-spacer') ?? el
      const top = pageTop(host)
      own = flowPages(top, top + host.offsetHeight)
    }
    const stops = own.stops.map(clampY)
    anchors[id] = stops[0]
    pages.push(...stops)
    edges.push(...(own.edges ?? []).map(clampY))
  })
  const sorted = (ys) => [...new Set(ys)].sort((a, b) => a - b)
  return { pages: sorted(pages), all: sorted([...pages, ...edges]), anchors }
}

// ── Snapping ──────────────────────────────────────────────────────────────────
// The page stays wherever the reader leaves it. It settles only when they stop just short
// of a page (or a section's last screen) in the direction they were going, or when they
// flick: then it glides on to the next page. Never while a finger is on the screen.
const FLICK = 1.2 // px per ms: a quick spin of the wheel or a swipe; one notch is ~0.45
const NEAR = 0.22 // of the screen's height, ahead of the reader
const OVERSHOOT = 0.05 // of the screen's height, behind them
let snapping = false

function initSnap() {
  let touching = false
  let dir = 1
  let peak = 0
  let rest = 0 // where the reader last came to rest: a flick turns one page from here
  let sample = { y: 0, t: 0 }
  let timer = 0

  const settle = () => {
    const flick = peak > FLICK
    peak = 0
    if (snapping || touching || lenis.isStopped) return
    const y = lenis.scroll
    const vh = window.innerHeight
    const { pages, all } = layout()
    const ahead = (s) => (s - y) * dir
    let target
    if (flick) {
      // The next page from where the flick began; if it carried well past that, the next
      // page from where it ended.
      target = dir > 0 ? pages.find((s) => s > rest + 2) : pages.findLast((s) => s < rest - 2)
      if (target !== undefined && -ahead(target) > 0.5 * vh) {
        const onward = pages.filter((s) => ahead(s) > -OVERSHOOT * vh)
        target = dir > 0 ? onward[0] : onward.at(-1)
      }
    }
    if (target === undefined) {
      const near = all.filter((s) => ahead(s) <= NEAR * vh && ahead(s) >= -OVERSHOOT * vh)
      target = near.sort((a, b) => Math.abs(a - y) - Math.abs(b - y))[0]
    }
    if (target !== undefined && Math.abs(target - y) > 2) glide(target)
    rest = target ?? y
  }
  const settleSoon = () => {
    clearTimeout(timer)
    timer = setTimeout(settle, 140)
  }

  lenis.on('scroll', (l) => {
    if (!snapping) {
      if (l.direction) dir = l.direction
      // Speed over at least 50 ms: scroll events can arrive in bursts.
      const now = performance.now()
      const dt = now - sample.t
      if (dt > 200) sample = { y: l.scroll, t: now }
      else if (dt >= 50) {
        peak = Math.max(peak, Math.abs(l.scroll - sample.y) / dt)
        sample = { y: l.scroll, t: now }
      }
    }
    settleSoon()
  })
  // The reader takes over: a glide in progress gives way to them.
  const takeOver = () => {
    if (snapping) rest = lenis.scroll
    snapping = false
  }
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
