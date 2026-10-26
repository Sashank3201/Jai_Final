import { gsap } from 'gsap'
import { $, $$, isFinePointer } from '../lib/utils.js'
import { flowPages, marksIn, pageTop, setPages } from '../lib/scroll.js'
import { createReiatsu } from '../fx/reiatsu.js'

/** 第二話 — 卍解 and the core stack, released row by row, then the chapter poem on a black page. */
export function initArsenal({ reduce }) {
  const section = $('#arsenal')
  if (!section) return
  const poem = $('.arsenal__poem', section)
  const lines = $$('.poem__line', section)
  const sign = $('.poem__sign', section)
  const kanji = $$('.arsenal__kanji span', section)
  const bankaiName = $('.arsenal__bankai', section)
  const rows = $$('.stack__row', section)
  const canvas = $('.arsenal__reiatsu', section)

  if (!isFinePointer()) {
    // No hover on touch screens: release each row as it crosses the middle of the screen.
    rows.forEach((r) =>
      gsap.timeline({
        scrollTrigger: { trigger: r, start: 'top 60%', end: 'bottom 40%', toggleClass: { targets: r, className: 'is-released' } },
      }),
    )
  }

  if (reduce) return

  // Faint embers: a quiet atmosphere, with a small flare when a row is released.
  const reiatsu = createReiatsu(canvas, { ambient: 0.25, colors: ['#d23c2a', '#ff7a63', '#f2efe8'] })
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect()
    reiatsu.setPointer(e.clientX - r.left, e.clientY - r.top, true)
  })
  section.addEventListener('pointerleave', () => reiatsu.setPointer(0, 0, false))
  rows.forEach((row) =>
    row.addEventListener('pointerenter', () => {
      const r = row.getBoundingClientRect()
      const c = canvas.getBoundingClientRect()
      reiatsu.burst(r.left - c.left + r.width * 0.2, r.top - c.top + r.height / 2, 24)
    }),
  )

  // The poem: each line surfaces out of the dark while the page is held, one line a turn.
  const verse = gsap.timeline({ scrollTrigger: { trigger: poem, start: 'top top', end: '+=300%', pin: true, scrub: 0.6 } })
  lines.forEach((line, i) => {
    verse.from(line, { autoAlpha: 0, y: 40, filter: 'blur(12px)', duration: 0.5, ease: 'power2.out' }, i * 0.6)
    if (i < lines.length - 1) verse.addLabel(`line${i}`, '>')
  })
  verse
    .from(sign, { autoAlpha: 0, x: -30, duration: 0.4 }, '>-0.1')
    .to({}, { duration: 0.4 })
    .addLabel('held', '-=0.2')
    .to([lines, sign], { autoAlpha: 0, y: -30, filter: 'blur(8px)', duration: 0.5, stagger: 0.05 })

  // The stack turns a screen at a time; the poem rests after each line, then mid-hold
  // with every line (and the signature) on the page.
  const rests = [...lines.slice(0, -1).map((_, i) => `line${i}`), 'held'].map((l) => verse.labels[l] / verse.duration())
  setPages('arsenal', () => {
    const st = verse.scrollTrigger
    const body = flowPages(pageTop(section), st.start, marksIn(section))
    const at = (f) => st.start + f * (st.end - st.start)
    return {
      stops: [...body.stops, ...rests.map(at)],
      edges: body.edges,
      spans: [{ from: st.start, to: st.end, duration: 1.4 }],
    }
  })

  // 卍解 resolves out of a blur, then the bankai's name.
  gsap
    .timeline({ scrollTrigger: { trigger: kanji[0], start: 'top 80%', toggleActions: 'play none none reverse' } })
    .from(kanji, { autoAlpha: 0, scale: 1.25, filter: 'blur(16px)', duration: 1.1, stagger: 0.12, ease: 'expo.out' })
    .from(bankaiName, { autoAlpha: 0, y: -24, duration: 0.9, ease: 'expo.out' }, 0.4)

  gsap.from(rows, {
    autoAlpha: 0,
    y: 18,
    duration: 0.9,
    stagger: 0.05,
    ease: 'expo.out',
    scrollTrigger: { trigger: $('.stack', section), start: 'top 85%', toggleActions: 'play none none reverse' },
  })
}
