import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'

/**
 * 第二話 — the capability map is drawn with the scroll: grid lines trace in, the shape
 * opens from the centre, and the meters fill to the same values.
 */
export function initSkills({ reduce }) {
  const section = $('#skills')
  if (!section) return
  const radar = $('.radar', section)
  const shape = $('.hex__shape', section)
  const lines = $$('.hex__ring, .hex__axis', section)
  const vertices = $$('.hex__vertex', section)
  const labels = $$('.hex__label', section)
  const fills = $$('.meter__fill', section)
  const vals = $$('.meter__val', section)
  const tip = $('.hex__tip', section)
  const finalPts = JSON.parse(shape.dataset.points)
  const finalVals = vals.map((v) => Number(v.textContent))

  // Tooltip on each vertex (hover + keyboard focus).
  const showTip = (g) => {
    const dot = $('.hex__dot', g).getBoundingClientRect()
    const box = radar.getBoundingClientRect()
    tip.textContent = g.getAttribute('aria-label')
    tip.style.left = `${dot.left + dot.width / 2 - box.left}px`
    tip.style.top = `${dot.top - box.top}px`
    tip.hidden = false
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
  }
  setShape()
  gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 })

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: radar, start: 'top 88%', end: 'center 62%', scrub: 0.6 },
    })
    .to(lines, { strokeDashoffset: 0, duration: 0.5, stagger: 0.03 })
    .from(labels, { autoAlpha: 0, duration: 0.2, stagger: 0.03 }, 0.25)
    .to(grow, { t: 1, duration: 0.6, ease: 'power2.out', onUpdate: setShape }, 0.4)

  // Meters fill and count once, as their list comes into view.
  const counter = { t: 0 }
  gsap.set(fills, { scaleX: 0 })
  gsap.to(counter, {
    t: 1,
    duration: 1.6,
    ease: 'expo.out',
    scrollTrigger: { trigger: $('.meters', section), start: 'top 80%', toggleActions: 'play none none reverse' },
    onUpdate: () => {
      fills.forEach((f, i) => gsap.set(f, { scaleX: (finalVals[i] / 100) * counter.t }))
      vals.forEach((v, i) => (v.textContent = Math.round(finalVals[i] * counter.t)))
    },
  })
}
