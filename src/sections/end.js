import { gsap } from 'gsap'
import { $ } from '../lib/utils.js'

/** 完 — the closing seal is stamped, the last lines settle. */
export function initEnd({ reduce }) {
  const section = $('#end')
  if (!section || reduce) return
  gsap
    .timeline({
      defaults: { ease: 'expo.out' },
      scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' },
    })
    .from($('.end__kan', section), { autoAlpha: 0, scale: 1.5, rotate: -30, duration: 0.6, ease: 'power4.out' })
    .from([$('.end__thanks', section), $('.end__note', section), $('.end__top', section)], { autoAlpha: 0, y: 20, duration: 1.1, stagger: 0.08 }, 0.15)
}
