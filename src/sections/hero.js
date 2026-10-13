import { gsap } from 'gsap'
import { $, $$, fitCanvas, imageReady, loadImage, onResize, rand } from '../lib/utils.js'
import { createPetals } from '../fx/petals.js'
import { conceal, decode, idle, onHover } from '../fx/glitch.js'

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
  const canvas = $('.hero__canvas', hero)
  const petalsCanvas = $('.hero__petals', hero)
  const shade = $('.hero__shade', hero)
  const content = $('.hero__content', hero)
  const card = $('.hero__card', hero)
  const fallbackImg = $('.hero__fallback img', hero)

  const nameEl = $('.hero__name', hero)
  const nameGlitch = $('.hero__name .glitch', hero)
  const cardGlitch = $('.hero__card .glitch', hero)
  const seal = $('.hero__seal', hero)
  const eyebrow = $('.hero__eyebrow', hero)
  const role = $('.hero__role', hero)
  const tagline = $('.hero__tagline', hero)
  const ctas = $$('.hero__cta .btn', hero)
  const vert = $('.hero__vert', hero)
  const scrollHint = $('.hero__scroll', hero)

  if (reduce) {
    gsap.set(card, { autoAlpha: 0 })
    return { intro: () => {} }
  }

  // ── Canvas renderer ─────────────────────────────────────────────────────────
  const state = {
    zoom: 1.14,
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
    return { dx: dx / len, dy: dy / len, rot: rand(-14, 14), dist: rand(0.85, 1.2) }
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
    const gutter = state.gap * Math.max(6, Math.min(w, h) * 0.012)
    const border = state.gap * 1.6
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
      ctx.scale(1 - fly * 0.14, 1 - fly * 0.14)
      ctx.translate(-cx, -cy)

      const path = new Path2D()
      pts.forEach(([x, y], j) => (j ? path.lineTo(x, y) : path.moveTo(x, y)))
      path.closePath()

      ctx.save()
      ctx.clip(path)
      ctx.drawImage(colorImg, ...rect)
      if (state.ink[i].v > 0.001) {
        ctx.globalAlpha = state.ink[i].v
        if (inkImg) {
          ctx.drawImage(inkImg, ...rect)
        } else {
          ctx.fillStyle = '#f2efe8'
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
      }
      ctx.restore()

      if (border > 0.05) {
        ctx.lineWidth = border
        ctx.strokeStyle = '#0d0d0f'
        ctx.lineJoin = 'miter'
        ctx.stroke(path)
      }
      ctx.restore()
    })
  }

  gsap.ticker.add(() => {
    state.mx += (pointer.x * -14 - state.mx) * 0.05
    state.my += (pointer.y * -8 - state.my) * 0.05
    if (Math.abs(pointer.x * -14 - state.mx) > 0.05) dirty = true
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

  // ── Atmosphere: a few drifting petals, and a slow parallax on the type ──────
  const petals = createPetals(petalsCanvas, { density: 0.45, colors: ['#fbfaf7', '#fff1f0', '#fdf6e3'] })

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    petals.setPointer(pointer.x, pointer.y)
    gsap.to(content, { x: pointer.x * 6, y: pointer.y * 4, duration: 1.6, ease: 'power3.out', overwrite: 'auto' })
  })

  // ── Initial (pre-intro) state ───────────────────────────────────────────────
  const fades = [eyebrow, role, tagline, ...ctas, vert, scrollHint]
  conceal(nameGlitch)
  conceal(cardGlitch)
  gsap.set(seal, { autoAlpha: 0, scale: 1.6, rotate: -16 })
  gsap.set(fades, { autoAlpha: 0, y: 14 })
  gsap.set(shade, { autoAlpha: 0 })
  gsap.set(card, { autoAlpha: 0, y: 30 })

  // ── Scroll: the painting becomes a manga page, then the page comes apart ────
  const redraw = () => (dirty = true)
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=230%',
      pin: true,
      scrub: 0.8,
      onUpdate: redraw,
    },
  })
  tl.to(content, { autoAlpha: 0, yPercent: -6, duration: 0.2, ease: 'power2.in' }, 0)
    .to(shade, { autoAlpha: 0, duration: 0.2 }, 0)
    .to(state, { gap: 1, duration: 0.22, ease: 'power2.inOut', onUpdate: redraw }, 0.06)
    .to(state, { zoom: 1.0, duration: 0.3, onUpdate: redraw }, 0)
  INK_ORDER.forEach((panel, k) => {
    tl.to(state.ink[panel], { v: 1, duration: 0.12, ease: 'power1.inOut', onUpdate: redraw }, 0.16 + k * 0.035)
  })
  FLY_ORDER.forEach((panel, k) => {
    tl.to(state.fly[panel], { v: 1, duration: 0.3, ease: 'power2.in', onUpdate: redraw }, 0.52 + k * 0.045)
  })
  tl.to(petalsCanvas, { autoAlpha: 0, duration: 0.2 }, 0.45)
    .to(card, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.62)
    .call(() => decode(cardGlitch, { duration: 0.9 }), null, 0.64)
    .to({}, { duration: 0.12 })

  // ── Intro (plays as the loader opens): a film's opening title ───────────────
  const intro = () => {
    const t = gsap.timeline({ defaults: { ease: 'expo.out' } })
    t.to(state, { zoom: 1, duration: 2.8, onUpdate: redraw }, 0)
      .to(shade, { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0.2)
      .to(eyebrow, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.45)
      .to(role, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.55)
      .call(() => decode(nameGlitch, { duration: 1.3 }).then(() => idle(nameGlitch, { min: 6, max: 11 })), null, 0.6)
      .to(seal, { autoAlpha: 1, scale: 1, rotate: -4, duration: 0.55, ease: 'power4.out' }, 1.15)
      .to(tagline, { autoAlpha: 1, y: 0, duration: 1.2 }, 1.0)
      .to(ctas, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 1.15)
      .to([vert, scrollHint], { autoAlpha: 1, y: 0, duration: 1.4 }, 1.3)
    return t
  }

  onHover(nameEl, nameGlitch)

  return { intro }
}
