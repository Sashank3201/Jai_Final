import { gsap } from 'gsap'
import { $, $$, isFinePointer } from '../lib/utils.js'
import { createReiatsu } from '../fx/reiatsu.js'
import { shake } from './reveal.js'

/** 第3話 — Bleach: the chapter poem on a black page, then the blades are released. */
export function initArsenal({ reduce }) {
  const section = $('#arsenal')
  if (!section) return
  const intro = $('.arsenal__intro', section)
  const lines = $$('.poem__line', section)
  const sign = $('.poem__sign', section)
  const kanji = $$('.arsenal__kanji span', section)
  const blades = $$('.blade', section)
  const canvas = $('.arsenal__reiatsu', section)

  const touch = !isFinePointer()
  if (touch) {
    // No hover on touch screens: release each blade as it reaches the middle of the screen.
    blades.forEach((b) => {
      gsap.timeline({
        scrollTrigger: { trigger: b, start: 'top 62%', end: 'bottom 38%', toggleClass: { targets: b, className: 'is-released' } },
      })
    })
  }

  if (reduce) return

  const reiatsu = createReiatsu(canvas)
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect()
    reiatsu.setPointer(e.clientX - r.left, e.clientY - r.top, true)
  })
  section.addEventListener('pointerleave', () => reiatsu.setPointer(0, 0, false))
  blades.forEach((b) => {
    const release = () => {
      const r = b.getBoundingClientRect()
      const c = canvas.getBoundingClientRect()
      reiatsu.burst(r.left - c.left + r.width / 2, r.top - c.top + r.height / 2)
    }
    b.addEventListener('pointerenter', release)
    b.addEventListener('focus', release)
  })

  // The poem: each line surfaces out of the dark while the page is held.
  const poemTl = gsap.timeline({
    scrollTrigger: { trigger: intro, start: 'top top', end: '+=120%', pin: true, scrub: 0.6 },
  })
  poemTl
    .from(lines, { autoAlpha: 0, y: 40, filter: 'blur(12px)', duration: 0.5, stagger: 0.35, ease: 'power2.out' })
    .from(sign, { autoAlpha: 0, x: -30, duration: 0.4 }, '>-0.1')
    .to({}, { duration: 0.4 })
    .to([lines, sign], { autoAlpha: 0, y: -30, filter: 'blur(8px)', duration: 0.5, stagger: 0.05 })

  // 卍解 slams in with a flash.
  gsap
    .timeline({ scrollTrigger: { trigger: kanji[0], start: 'top 80%', toggleActions: 'play none none reverse' } })
    .from(kanji, { scale: 3.2, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: 'expo.out' })
    .from($('.arsenal__bankai', section), { autoAlpha: 0, y: -40, duration: 0.6, ease: 'power3.out' }, 0.45)
    .add(() => shake(section.querySelector('.arsenal__body'), 8), 0.3)

  // Blades are drawn one after another with a cut.
  gsap.from(blades, {
    clipPath: 'inset(0 100% 0 0)',
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.inOut',
    scrollTrigger: { trigger: $('.blades', section), start: 'top 82%', toggleActions: 'play none none reverse' },
  })
}
