import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis = null

// ── Pages ─────────────────────────────────────────────────────────────────────
// Where the reader comes to rest. A chapter rests at its top; one taller than the screen also
// a screen further at a time, down to its last screen, so nothing is skipped. A pinned scene
// lists its own resting points instead (the title card, a project card, a System window,
// the poem, the finished reveal).
const custom = new Map() // chapter id → () => ({ stops: number[], edges?: number[] }) | null

export function setPages(id, fn) {
  custom.set(id, fn)
}

export const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY

const NAV = 88 // px kept clear under the nav bar when a block heads the screen

/** A stretch of flowing content: a page at its top, then up to a screen at a time down to
 *  its last screen. Each step lands on the start of a block (`marks`: the tops of the
 *  `[data-mark]` elements — a card, a row) so nothing rests cut in half; a last screen only
 *  a nudge past the one before is no page of its own. */
export function flowPages(top, bottom, marks = []) {
  const vh = window.innerHeight
  const last = bottom - vh
  if (last - top < vh * 0.3) return { stops: [top], edges: [] }
  const heads = marks.map((m) => m - NAV).sort((a, b) => a - b)
  const edges = []
  let y = top
  while (last - y > vh * 0.85) {
    const fit = heads.filter((m) => m > y + vh * 0.3 && m <= y + vh * 0.85).at(-1)
    y = fit ?? y + vh * 0.85
    edges.push(y)
  }
  if (last - y < vh * 0.3 && edges.length) edges.pop()
  edges.push(last)
  return { stops: [top], edges }
}

export const marksIn = (el) => [...el.querySelectorAll('[data-mark]')].map(pageTop)

function layout() {
  const max = lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight
  const clampY = (y) => Math.round(gsap.utils.clamp(0, max, y))
  const stops = []
  const anchors = {}
  document.querySelectorAll('section[data-chapter], footer[data-chapter]').forEach((el) => {
    const id = el.dataset.chapter
    let own = custom.get(id)?.()
    if (!own) {
      // Down to where the content ends: the chapter's bottom padding is only air.
      const host = el.closest('.pin-spacer') ?? el
      const top = pageTop(host)
      const air = parseFloat(getComputedStyle(el).paddingBottom) || 0
      own = flowPages(top, top + host.offsetHeight - Math.max(0, air - 48), marksIn(el))
    }
    const ys = [...own.stops, ...(own.edges ?? [])].map(clampY)
    anchors[id] = ys[0]
    stops.push(...ys)
  })
  stops.sort((a, b) => a - b)
  // Stops closer than a fifth of a screen are one stop.
  const merged = stops.filter((y, i) => i === 0 || y - stops[i - 1] > window.innerHeight * 0.2)
  return { stops: merged, anchors }
}

// ── Page turns ────────────────────────────────────────────────────────────────
// One gesture, one page: a notch of the wheel, a swipe, an arrow key glides to the next
// stop and settles there. The rest of the gesture (a trackpad's or a flick's momentum) is
// let go, so a single swipe never skips a page; a pause, or a fresh push, starts the next.
const QUIET = 180 // ms without wheel events that ends a gesture
const SWIPE = 36 // px a finger travels before the page turns
let turning = false

/** Glide to the next stop up (-1) or down (1) from where the page is now. */
function turn(dir) {
  const y = lenis.scroll
  const { stops } = layout()
  const target = dir > 0 ? stops.find((s) => s > y + 4) : stops.findLast((s) => s < y - 4)
  if (target !== undefined) glide(target)
}

function initTurns() {
  let armed = true
  let lastT = 0
  let lastAbs = 0
  let swipe = null // { travel, armed } while a finger is down

  const passThrough = (event) =>
    event.ctrlKey || // pinch zoom
    lenis.isStopped || // the menu is open (Lenis holds the page itself)
    event.composedPath().some((n) => n.hasAttribute?.('data-lenis-prevent'))

  const onWheel = (dy) => {
    const now = performance.now()
    const abs = Math.abs(dy)
    if (now - lastT > QUIET || (abs > lastAbs * 2 && abs > 30)) armed = true
    lastT = now
    lastAbs = abs
    if (!armed || turning) return
    armed = false
    turn(Math.sign(dy))
  }

  const onTouch = (event, dy) => {
    if (event.type === 'touchstart') swipe = { travel: 0, armed: true }
    else if (event.type === 'touchend') swipe = null
    else if (swipe) {
      swipe.travel += dy
      if (swipe.armed && !turning && Math.abs(swipe.travel) > SWIPE) {
        swipe.armed = false
        turn(Math.sign(swipe.travel))
      }
    }
  }

  // Runs before Lenis on every wheel and touch event; false keeps Lenis from scrolling.
  return ({ deltaX, deltaY, event }) => {
    if (passThrough(event)) return true
    const touch = event.type.startsWith('touch')
    if (touch) {
      if (event.type === 'touchmove' && Math.abs(deltaX) > Math.abs(deltaY)) return true // sideways
      if (event.type === 'touchmove' && event.cancelable) event.preventDefault()
      onTouch(event, deltaY)
    } else {
      if (event.cancelable) event.preventDefault()
      if (deltaY) onWheel(deltaY)
    }
    return false
  }
}

function initKeys() {
  addEventListener('keydown', (e) => {
    if (lenis.isStopped || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return
    const el = e.target
    if (el.closest?.('input, textarea, select, [contenteditable]')) return
    const onControl = el.closest?.('a, button')
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey && !onControl)
    const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey && !onControl)
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      glide(e.key === 'Home' ? 0 : lenis.limit)
    } else if (down || up) {
      e.preventDefault()
      if (!turning && !e.repeat) turn(down ? 1 : -1)
    }
  })
}

// Quick to answer the gesture, soft to land.
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

let release = 0

function glide(y, duration) {
  if (lenis.isStopped) return // Lenis would ignore it (and never report it done)
  const d = duration ?? gsap.utils.clamp(0.8, 1.6, 0.55 + (Math.abs(y - lenis.scroll) / window.innerHeight) * 0.3)
  const done = () => {
    clearTimeout(release)
    turning = false
  }
  turning = true
  clearTimeout(release)
  release = setTimeout(done, d * 1000 + 400) // never left waiting on a glide another one replaced
  lenis.scrollTo(y, { duration: d, easing: easeOut, onComplete: done })
}

// ── Smooth scroll ─────────────────────────────────────────────────────────────
export function initScroll(reduce) {
  if (reduce) return null
  let pageTurns = () => true
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95, virtualScroll: (data) => pageTurns(data) })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  pageTurns = initTurns()
  initKeys()
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
