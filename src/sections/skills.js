import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { shake } from './reveal.js'

/**
 * 第2話 — a volleyball is tossed and spiked into the stat hexagon, which then fills.
 * Everything is scrubbed to scroll, so the reader controls the rally.
 */
export function initSkills({ reduce }) {
  const section = $('#skills')
  if (!section) return
  const pin = $('.skills__pin', section)
  const grid = $('.skills__grid', section)
  const hexwrap = $('.hexwrap', section)
  const shape = $('.hex__shape', section)
  const vertices = $$('.hex__vertex', section)
  const ball = $('.skills__ball', section)
  const impact = $('.hexwrap__impact', section)
  const spike = $('.sfx--spike', section)
  const fills = $$('.meter__fill', section)
  const vals = $$('.meter__val', section)
  const tip = $('.hex__tip', section)
  const finalPts = JSON.parse(shape.dataset.points)
  const finalVals = vals.map((v) => Number(v.textContent))

  // Tooltip on each vertex (hover + keyboard focus).
  const showTip = (g) => {
    const i = Number(g.dataset.i)
    const dot = $('.hex__dot', g).getBoundingClientRect()
    const box = hexwrap.getBoundingClientRect()
    tip.textContent = g.getAttribute('aria-label')
    tip.style.left = `${dot.left + dot.width / 2 - box.left}px`
    tip.style.top = `${dot.top - box.top}px`
    tip.hidden = false
    vertices.forEach((v, j) => v.classList.toggle('is-active', j === i))
  }
  const hideTip = () => (tip.hidden = true)
  vertices.forEach((g) => {
    g.addEventListener('pointerenter', () => showTip(g))
    g.addEventListener('focus', () => showTip(g))
    g.addEventListener('pointerleave', hideTip)
    g.addEventListener('blur', hideTip)
  })

  if (reduce) return

  const grow = { t: 0 }
  const setShape = () => {
    const pts = finalPts.map(([x, y]) => [x * grow.t, y * grow.t])
    shape.setAttribute('points', pts.map((p) => p.join(',')).join(' '))
    vertices.forEach((g, i) => {
      $$('circle', g).forEach((c) => {
        c.setAttribute('cx', pts[i][0])
        c.setAttribute('cy', pts[i][1])
      })
    })
    fills.forEach((f, i) => gsap.set(f, { scaleX: (finalVals[i] / 100) * grow.t }))
    vals.forEach((v, i) => (v.textContent = Math.round(finalVals[i] * grow.t)))
  }
  setShape()
  gsap.set(ball, { autoAlpha: 1, x: -200, y: -200 })

  // Ball path relative to the pinned container, recomputed on refresh.
  const pathPoints = () => {
    const p = pin.getBoundingClientRect()
    const h = hexwrap.getBoundingClientRect()
    const b = ball.getBoundingClientRect()
    const cx = h.left - p.left + h.width / 2 - b.width / 2
    const cy = h.top - p.top + h.height / 2 - b.height / 2
    const start = { x: -b.width * 1.5, y: h.bottom - p.top + 40 }
    const apex = { x: cx - h.width * 0.55, y: h.top - p.top - Math.min(260, h.height * 0.6) }
    return { start, apex, end: { x: cx, y: cy } }
  }
  let pts = pathPoints()

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: grid,
      start: 'top 92%',
      end: 'top 30%',
      scrub: 0.8,
      invalidateOnRefresh: true,
      onRefresh: () => (pts = pathPoints()),
    },
  })
  const toss = { t: 0 }
  tl.to(toss, {
    t: 1,
    duration: 0.6,
    onUpdate: () => {
      // Quadratic Bézier: start → apex (toss), then apex → hexagon (spike) — sharper second half.
      const t = toss.t
      const a = pts.start
      const c = pts.apex
      const e = pts.end
      let x, y
      if (t < 0.6) {
        const k = t / 0.6
        x = a.x + (c.x - a.x) * k
        y = a.y + (c.y - a.y) * (1 - (1 - k) * (1 - k))
      } else {
        const k = (t - 0.6) / 0.4
        x = c.x + (e.x - c.x) * k
        y = c.y + (e.y - c.y) * k * k
      }
      gsap.set(ball, { x, y, rotate: t * 900, scale: 1 + Math.sin(t * Math.PI) * 0.25 })
    },
  })
    .to(ball, { scale: 0.2, autoAlpha: 0, duration: 0.05 })
    .fromTo(impact, { scale: 0.2, autoAlpha: 1 }, { scale: 9, autoAlpha: 0, duration: 0.18 }, '<')
    .fromTo(spike, { scale: 2.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.08, ease: 'back.out(3)' }, '<')
    .to(grow, { t: 1, duration: 0.3, ease: 'back.out(1.6)', onUpdate: setShape }, '<0.02')

  // Impact shake fires once per pass, independent of scrub smoothing.
  let shaken = false
  tl.eventCallback('onUpdate', () => {
    const p = tl.progress()
    if (p > 0.64 && !shaken) {
      shaken = true
      shake(hexwrap, 9)
    } else if (p < 0.55) {
      shaken = false
    }
  })
}
