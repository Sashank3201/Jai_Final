import { gsap } from 'gsap'
import { $ } from '../lib/utils.js'

/** 完 — the closing stamp. */
export function initEnd({ reduce }) {
  const section = $('#end')
  if (!section || reduce) return
  gsap
    .timeline({ scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' } })
    .from($('.end__kan', section), { scale: 2.6, rotate: -50, autoAlpha: 0, duration: 0.8, ease: 'back.out(2.4)' })
    .from($('.end__thanks', section), { y: 30, autoAlpha: 0, duration: 0.6 }, '<0.3')
    .from($('.end__preview', section), { y: 30, autoAlpha: 0, duration: 0.6 }, '<0.15')
    .from($('.end__again', section), { scale: 0.6, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)' }, '<0.15')
}
