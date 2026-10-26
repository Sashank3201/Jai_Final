import { gsap } from 'gsap'
import { $, $$, isFinePointer } from '../lib/utils.js'
import { flowPages, pageTop, setPages } from '../lib/scroll.js'
import { createReiatsu } from '../fx/reiatsu.js'

/** 第二話 — the core stack on a black page, released row by row, then the chapter poem. */
export function initArsenal({ reduce }) {
  const section = $('#arsenal')
  if (!section) return
  const poem = $('.arsenal__poem', section)
  const lines = $$('.poem__line', section)
  const sign = $('.poem__sign', section)
  const rows = $$('.stack__row', section)
  const canvas = $('.arsenal__embers', section)

  if (!isFinePointer()) {
    // No hover on touch screens: release each row as it crosses the middle of the screen.
    rows.forEach((r) =>
      gsap.timeline({
        scrollTrigger: { trigger: r, start: 'top 60%', end: 'bottom 40%', toggleClass: { targets: r, className: 'is-released' } },
      }),
    )
  }

  if (reduce) return

  // The stack is read freely; the poem is a page of its own.
  setPages('arsenal', () => {
    const top = pageTop(section)
    const poemTop = pageTop(poem)
    const body = flowPages(top, poemTop)
    return { stops: [...body.stops, poemTop], free: body.free }
  })

  // Faint embers: a quiet atmosphere, with a small flare when a row is released.
  const embers = createReiatsu(canvas, { ambient: 0.25, colors: ['#d23c2a', '#ff7a63', '#f2efe8'] })
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect()
    embers.setPointer(e.clientX - r.left, e.clientY - r.top, true)
  })
  section.addEventListener('pointerleave', () => embers.setPointer(0, 0, false))
  rows.forEach((row) =>
    row.addEventListener('pointerenter', () => {
      const r = row.getBoundingClientRect()
      const c = canvas.getBoundingClientRect()
      embers.burst(r.left - c.left + r.width * 0.2, r.top - c.top + r.height / 2, 24)
    }),
  )

  gsap.from(rows, {
    autoAlpha: 0,
    y: 18,
    duration: 0.9,
    stagger: 0.05,
    ease: 'expo.out',
    scrollTrigger: { trigger: $('.stack', section), start: 'top 85%', toggleActions: 'play none none reverse' },
  })

  // The poem: each line surfaces out of the dark as the page arrives.
  gsap
    .timeline({ scrollTrigger: { trigger: poem, start: 'top 55%', toggleActions: 'play none none reverse' } })
    .from(lines, { autoAlpha: 0, y: 40, filter: 'blur(12px)', duration: 0.9, stagger: 0.2, ease: 'power2.out' })
    .from(sign, { autoAlpha: 0, x: -30, duration: 0.8, ease: 'power2.out' }, '>-0.4')
}
