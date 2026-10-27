import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, fitCanvas, imageReady, loadImage, onResize, rand } from '../lib/utils.js'
import { setPages } from '../lib/scroll.js'
import { createPetals } from '../fx/petals.js'
import { conceal, decode } from '../fx/glitch.js'

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
// The centre panel leaves first, opening a window onto the next chapter's title card.
const FLY_ORDER = [3, 0, 1, 4, 6, 5, 2]

// three.js (r163+) renders with WebGL 2 only; without it, skip the sword chunk entirely.
function hasWebGL() {
  try {
    return !!(window.WebGL2RenderingContext && document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
}

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
  const swordCanvas = $('.hero__sword', hero)

  const cardGlitch = $$('.hero__card .glitch', hero)
  const scrollHint = $('.hero__scroll', hero)

  // The cover has no words, so the top bar's name and the page counter stay off it until
  // the reader moves (index.html sets the class before the first paint).
  const root = document.documentElement
  const atCover = () => root.classList.toggle('is-cover', window.scrollY < 2)
  window.addEventListener('scroll', atCover, { passive: true })
  atCover()

  // 天逆鉾 — Three.js is loaded on demand so the first paint stays light.
  // raise → swing → wave (the slash flies off) → gone (burns away) → card (re-forms behind the
  // next chapter's title card). `visible` stops the render loop once the hero is off screen.
  const swordFx = { raise: 0, swing: 0, wave: 0, gone: 0, card: 0, visible: true }
  const swordReady = hasWebGL()
    ? Promise.all([import('../three/sword.js'), imageReady(fallbackImg)])
        .then(([m]) =>
          m.createSword({
            canvas: swordCanvas,
            cardEl: $('.hero__card-title', hero),
            envImage: fallbackImg,
            fx: swordFx,
            still: reduce,
          }),
        )
        .catch((err) => {
          console.warn('Sword disabled:', err)
          return null
        })
    : Promise.resolve(null)
  // The title card's width settles once its typeface arrives; rest the spear beneath it again.
  document.fonts?.ready.then(() => swordReady.then((s) => s?.layout()))

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
    // Mobile toolbars sliding in and out fire resize without changing the (lvh-sized)
    // stage; resizing the canvas anyway would blank it for a frame.
    const box = canvas.getBoundingClientRect()
    if (ctx && box.width === w && box.height === h) return
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

  // The <picture> picks the framing (phones held upright get the portrait painting) and
  // swaps it when the screen turns; the canvas follows whichever painting it chose.
  // Each framing has its own screentone version (scripts/process_images.py → INK_FOR).
  const inkFor = (src) => {
    if (src.includes('meadow-day-portrait')) return 'images/meadow-day-portrait-ink-1176.png'
    const big = window.innerWidth * Math.min(devicePixelRatio || 1, 2) > 1800
    return `images/meadow-day-ink-${big ? 2560 : 1600}.png`
  }
  let artSrc = ''
  const loadArt = async () => {
    const src = fallbackImg.currentSrc || fallbackImg.src
    if (!src || src === artSrc) return
    artSrc = src
    const img = await loadImage(src).catch(() => null)
    if (!img || src !== artSrc) return
    colorImg = img
    inkImg = null
    hero.classList.add('is-canvas')
    dirty = true
    // The ink version is only needed once the reader scrolls — fetch it after first paint.
    loadImage(inkFor(src))
      .then((ink) => {
        if (src !== artSrc) return
        inkImg = ink
        dirty = true
      })
      .catch(() => {})
  }
  imageReady(fallbackImg).then(loadArt)
  fallbackImg.addEventListener('load', loadArt)

  // ── Atmosphere: a few drifting petals, and a slow parallax on the scroll cue ─
  const petals = createPetals(petalsCanvas, { density: 0.45, colors: ['#fbfaf7', '#fff1f0', '#fdf6e3'] })

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    petals.setPointer(pointer.x, pointer.y)
    gsap.to(content, { x: pointer.x * 6, y: pointer.y * 4, duration: 1.6, ease: 'power3.out', overwrite: 'auto' })
  })

  // ── Initial (pre-intro) state ───────────────────────────────────────────────
  cardGlitch.forEach(conceal)
  gsap.set(scrollHint, { autoAlpha: 0, y: 14 })
  gsap.set(shade, { autoAlpha: 0 })
  gsap.set(card, { autoAlpha: 0, y: 30 })

  // ── Scroll: the painting becomes a manga page, then the page comes apart ────
  const redraw = () => (dirty = true)
  // First the blade lifts and cuts — the slash flies into the painting — and the
  // page splits along the cut into manga panels, turns to ink and comes apart.
  // The shade is derived from the timeline's position on every update rather than tweened:
  // a scrubbed tween on it could lock in a stale start value and leave the hero unshaded
  // after scrolling back up. The intro owns it until it has faded in.
  let shadeReady = false
  const SHADE_FROM = 0.12
  const SHADE_LEN = 0.14
  const syncShade = () => {
    if (!shadeReady) return
    const k = gsap.utils.clamp(0, 1, (tl.time() - SHADE_FROM) / SHADE_LEN)
    gsap.set(shade, { autoAlpha: 1 - k })
  }
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: syncShade,
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=260%',
      pin: true,
      scrub: 0.8,
      onUpdate: redraw,
    },
  })
  // Two pages: the cover, and the title card at the end of the cut, the spear resting
  // beneath the full name. The turn between them is slow, so the cut plays out.
  setPages('prologue', () => {
    const st = tl.scrollTrigger
    return { stops: [st.start, st.end], spans: [{ from: st.start, to: st.end, duration: 3.6 }] }
  })
  tl.to(swordFx, { raise: 1, duration: 0.05, ease: 'power2.out' }, 0)
    .to(swordFx, { swing: 1, duration: 0.045, ease: 'power3.in' }, 0.05)
    .to(swordFx, { wave: 1, duration: 0.17, ease: 'none' }, 0.08)
    .to(swordFx, { gone: 1, duration: 0.18, ease: 'power1.in' }, 0.12)
    .to(content, { autoAlpha: 0, yPercent: -6, duration: 0.09, ease: 'power2.in' }, 0.03)
    // (the shade fades from SHADE_FROM, when the page splits — see syncShade above; the
    // intro already settles the zoom, so it isn't scrubbed here either)
    .to(state, { gap: 1, duration: 0.22, ease: 'power2.inOut', onUpdate: redraw }, 0.1)
  INK_ORDER.forEach((panel, k) => {
    tl.to(state.ink[panel], { v: 1, duration: 0.12, ease: 'power1.inOut', onUpdate: redraw }, 0.2 + k * 0.035)
  })
  FLY_ORDER.forEach((panel, k) => {
    tl.to(state.fly[panel], { v: 1, duration: 0.3, ease: 'power2.in', onUpdate: redraw }, 0.56 + k * 0.045)
  })
  tl.to(petalsCanvas, { autoAlpha: 0, duration: 0.2 }, 0.49)
    .to(swordFx, { card: 1, duration: 0.22, ease: 'power1.out' }, 0.66)
    .to(card, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.74)
    .call(() => cardGlitch.forEach((g) => decode(g, { duration: 0.9 })), null, 0.76)
    .to({}, { duration: 0.12 })

  // ── Intro (plays as the loader opens): the painting settles, the spear burns into
  // being, and once it has formed, the cue to scroll ───────────────────────────
  const intro = () => {
    const t = gsap.timeline({ defaults: { ease: 'expo.out' } })
    t.to(state, { zoom: 1, duration: 2.8, onUpdate: redraw }, 0)
      .to(shade, {
        autoAlpha: 1,
        duration: 1.6,
        ease: 'power2.out',
        onComplete: () => {
          shadeReady = true
          syncShade() // in case the reader scrolled during the intro
        },
      }, 0.2)
      .call(() => swordReady.then((s) => s?.materialize()), null, 0.35)
      .to(scrollHint, { autoAlpha: 1, y: 0, duration: 1.4 }, 1.9)
    return t
  }

  // Keep the sword's render loop running only while the pinned hero is on screen.
  ScrollTrigger.create({
    trigger: hero.parentElement,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (swordFx.visible = self.isActive),
  })

  return { intro }
}
