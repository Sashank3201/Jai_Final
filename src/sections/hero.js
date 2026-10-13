import { gsap } from 'gsap'
import { $, $$, fitCanvas, imageReady, loadImage, onResize, rand } from '../lib/utils.js'
import { createPetals } from '../fx/petals.js'
import { createFocusLines } from '../fx/focusLines.js'

// A manga page layout in percent coordinates. Shared edges tile the screen exactly,
// so at rest the panels read as one painting; on scroll they split along these cuts.
const PANELS = [
  [[0, 0], [60, 0], [54, 33.68], [0, 38]],
  [[60, 0], [100, 0], [100, 30], [54, 33.68]],
  [[0, 38], [30, 35.6], [36, 72.16], [0, 70]],
  [[30, 35.6], [72, 32.24], [66, 73.96], [36, 72.16]],
  [[72, 32.24], [100, 30], [100, 76], [66, 73.96]],
  [[0, 70], [44, 72.64], [50, 100], [0, 100]],
  [[44, 72.64], [100, 76], [100, 100], [50, 100]],
]
// Order in which panels turn to ink and then fly off.
const INK_ORDER = [3, 0, 4, 2, 1, 6, 5]
const FLY_ORDER = [0, 1, 4, 6, 5, 2, 3]

const centroid = (pts) => pts.reduce((a, [x, y]) => [a[0] + x / pts.length, a[1] + y / pts.length], [0, 0])

/** Shrinks a convex polygon by moving every edge inward by d pixels (uniform manga gutters). */
function inset(pts, d) {
  if (d <= 0) return pts
  const n = pts.length
  let area = 0
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % n]
    area += x1 * y2 - x2 * y1
  }
  const sign = area > 0 ? 1 : -1
  const lines = pts.map(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % n]
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const nx = (-(y2 - y1) / len) * sign
    const ny = ((x2 - x1) / len) * sign
    return [x1 + nx * d, y1 + ny * d, x2 + nx * d, y2 + ny * d]
  })
  return lines.map((l1, i) => {
    const l0 = lines[(i - 1 + n) % n]
    const [ax, ay, bx, by] = l0
    const [cx, cy, dx, dy] = l1
    const den = (ax - bx) * (cy - dy) - (ay - by) * (cx - dx)
    if (Math.abs(den) < 1e-6) return [cx, cy]
    const t = ((ax - cx) * (cy - dy) - (ay - cy) * (cx - dx)) / den
    return [ax + t * (bx - ax), ay + t * (by - ay)]
  })
}

export function initHero({ reduce }) {
  const hero = $('.hero')
  if (!hero) return { intro: () => {} }
  const stage = $('.hero__stage', hero)
  const canvas = $('.hero__canvas', hero)
  const linesCanvas = $('.hero__lines', hero)
  const petalsCanvas = $('.hero__petals', hero)
  const content = $('.hero__content', hero)
  const card = $('.hero__card', hero)
  const fallbackImg = $('.hero__fallback img', hero)

  const chars = $$('.hero__char', hero)
  const sfx = $('.hero__sfx', hero)
  const seal = $('.hero__seal', hero)
  const eyebrow = $$('.hero__eyebrow span', hero)
  const caption = $('.hero__caption', hero)
  const tbc = $('.hero__tbc', hero)
  const scrollHint = $('.hero__scroll', hero)

  if (reduce) {
    gsap.set(card, { autoAlpha: 0 })
    return { intro: () => {} }
  }

  // ── Canvas renderer ─────────────────────────────────────────────────────────
  const state = {
    zoom: 1.16,
    gap: 0,
    mx: 0,
    my: 0,
    ink: PANELS.map(() => ({ v: 0 })),
    fly: PANELS.map(() => ({ v: 0 })),
  }
  const flyParams = PANELS.map((pts) => {
    const [cx, cy] = centroid(pts)
    const dx = cx - 50
    const dy = cy - 50
    const len = Math.hypot(dx, dy) || 1
    return { dx: dx / len, dy: dy / len, rot: rand(-28, 28), dist: rand(0.85, 1.25) }
  })
  let ctx, w, h
  let colorImg = null
  let inkImg = null
  let dirty = true
  const pointer = { x: 0, y: 0 }

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas, 2))
    dirty = true
  }

  const coverRect = (img) => {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * state.zoom
    const dw = img.naturalWidth * s
    const dh = img.naturalHeight * s
    return [(w - dw) / 2 + state.mx, (h - dh) / 2 + state.my, dw, dh]
  }

  const draw = () => {
    if (!colorImg || !ctx) return
    ctx.clearRect(0, 0, w, h)
    const rect = coverRect(colorImg)
    const resting = state.gap < 0.001 && state.fly.every((f) => f.v < 0.001) && state.ink.every((k) => k.v < 0.001)
    if (resting) {
      ctx.drawImage(colorImg, ...rect)
      return
    }
    const gutter = state.gap * Math.max(6, Math.min(w, h) * 0.013)
    const border = state.gap * 3.2
    PANELS.forEach((poly, i) => {
      const fly = state.fly[i].v
      if (fly >= 1) return
      const pts = inset(
        poly.map(([x, y]) => [(x / 100) * w, (y / 100) * h]),
        gutter,
      )
      const [cx, cy] = centroid(pts)
      const f = flyParams[i]
      const travel = fly * fly * Math.hypot(w, h) * f.dist
      ctx.save()
      ctx.translate(cx + f.dx * travel, cy + f.dy * travel)
      ctx.rotate((f.rot * fly * Math.PI) / 180)
      ctx.scale(1 - fly * 0.18, 1 - fly * 0.18)
      ctx.translate(-cx, -cy)

      const path = new Path2D()
      pts.forEach(([x, y], j) => (j ? path.lineTo(x, y) : path.moveTo(x, y)))
      path.closePath()

      if (state.gap > 0.01) {
        ctx.save()
        ctx.translate(gutter * 0.9, gutter * 0.9)
        ctx.globalAlpha = Math.min(1, state.gap * 1.2) * 0.9
        ctx.fillStyle = '#111113'
        ctx.fill(path)
        ctx.restore()
      }

      ctx.save()
      ctx.clip(path)
      ctx.drawImage(colorImg, ...rect)
      if (state.ink[i].v > 0.001) {
        ctx.globalAlpha = state.ink[i].v
        if (inkImg) {
          ctx.drawImage(inkImg, ...rect)
        } else {
          ctx.fillStyle = '#f4efe4'
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
      }
      ctx.restore()

      if (border > 0.05) {
        ctx.lineWidth = border
        ctx.strokeStyle = '#111113'
        ctx.lineJoin = 'miter'
        ctx.stroke(path)
      }
      ctx.restore()
    })
  }

  gsap.ticker.add(() => {
    state.mx += (pointer.x * -16 - state.mx) * 0.06
    state.my += (pointer.y * -10 - state.my) * 0.06
    if (Math.abs(pointer.x * -16 - state.mx) > 0.05) dirty = true
    if (dirty) {
      draw()
      dirty = false
    }
  })

  resize()
  onResize(resize)

  imageReady(fallbackImg).then(async () => {
    const src = fallbackImg.currentSrc || fallbackImg.src
    colorImg = await loadImage(src).catch(() => null)
    if (!colorImg) return
    hero.classList.add('is-canvas')
    dirty = true
    // The ink version is only needed once the reader scrolls — fetch it after first paint.
    const big = window.innerWidth * Math.min(devicePixelRatio || 1, 2) > 1800
    loadImage(`images/meadow-day-ink-${big ? 2560 : 1600}.webp`)
      .then((img) => {
        inkImg = img
        dirty = true
      })
      .catch(() => {})
  })

  // ── FX layers ───────────────────────────────────────────────────────────────
  const petals = createPetals(petalsCanvas, { density: 0.9 })
  const lines = createFocusLines(linesCanvas)

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    petals.setPointer(pointer.x, pointer.y)
    gsap.to(content, { x: pointer.x * 10, y: pointer.y * 6, duration: 1.2, ease: 'power3.out', overwrite: 'auto' })
  })

  // ── Initial (pre-intro) state ───────────────────────────────────────────────
  gsap.set(chars, { yPercent: 120, scale: 2.2, autoAlpha: 0 })
  gsap.set(sfx, { scale: 3, autoAlpha: 0 })
  gsap.set(seal, { x: 60, rotate: 25, autoAlpha: 0 })
  gsap.set(eyebrow, { y: -24, autoAlpha: 0 })
  gsap.set(caption, { clipPath: 'inset(0 100% 0 0)' })
  gsap.set([tbc, scrollHint], { autoAlpha: 0 })
  gsap.set(card, { autoAlpha: 0, scale: 0.85 })

  // ── Scroll: the painting becomes a manga page, then the page is torn apart ──
  const redraw = () => (dirty = true)
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=230%',
      pin: true,
      scrub: 0.7,
      onUpdate: redraw,
    },
  })
  tl.to(content, { autoAlpha: 0, scale: 1.18, yPercent: -8, duration: 0.22, ease: 'power2.in' }, 0)
    .to(linesCanvas, { opacity: 0, duration: 0.15 }, 0)
    .to(state, { gap: 1, duration: 0.22, ease: 'power2.inOut', onUpdate: redraw }, 0.06)
    .to(state, { zoom: 1.0, duration: 0.3, onUpdate: redraw }, 0)
  INK_ORDER.forEach((panel, k) => {
    tl.to(state.ink[panel], { v: 1, duration: 0.12, ease: 'power1.inOut', onUpdate: redraw }, 0.16 + k * 0.035)
  })
  FLY_ORDER.forEach((panel, k) => {
    tl.to(state.fly[panel], { v: 1, duration: 0.3, ease: 'power2.in', onUpdate: redraw }, 0.52 + k * 0.045)
  })
  tl.to(petalsCanvas, { autoAlpha: 0, duration: 0.2 }, 0.45)
    .to(card, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.62)
    .to({}, { duration: 0.12 })

  // ── Intro (plays when the loader opens) ─────────────────────────────────────
  const intro = () => {
    const t = gsap.timeline({ defaults: { ease: 'expo.out' } })
    t.to(state, { zoom: 1, duration: 2.2, onUpdate: redraw }, 0)
      .fromTo(linesCanvas, { opacity: 0 }, { opacity: 0.85, duration: 0.25, ease: 'power2.out' }, 0.35)
      .fromTo(lines, { intensity: 1 }, { intensity: 0.2, duration: 1.6, ease: 'power2.out' }, 0.35)
      .to(linesCanvas, { opacity: 0.32, duration: 1.4 }, 0.9)
      .to(chars, { yPercent: 0, scale: 1, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: 'back.out(2.2)' }, 0.4)
      .fromTo(
        stage,
        { x: 0, y: 0 },
        { keyframes: { x: [-10, 9, -6, 4, 0], y: [6, -5, 3, -2, 0] }, duration: 0.4, ease: 'none' },
        0.4 + chars.length * 0.09 + 0.15,
      )
      .to(sfx, { scale: 1, autoAlpha: 1, duration: 0.7, ease: 'back.out(3)' }, '<')
      .to(seal, { x: 0, rotate: 0, autoAlpha: 1, duration: 0.9 }, '<0.1')
      .to(eyebrow, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, '<0.1')
      .to(caption, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut' }, '<0.15')
      .to([tbc, scrollHint], { autoAlpha: 1, duration: 0.8 }, '<0.5')
      .fromTo(tbc, { x: 60 }, { x: 0, duration: 1 }, '<')
    return t
  }

  return { intro }
}
