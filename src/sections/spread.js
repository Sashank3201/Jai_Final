import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { createPetals } from '../fx/petals.js'

/** 巻頭カラー — the afternoon painting bursts out of a single small panel to full bleed. */
export function initSpread({ reduce }) {
  const section = $('#spread')
  if (!section) return
  const frame = $('.spread__frame', section)
  const pic = $('picture', frame)
  const quote = $$('.spread__quote span', section)
  const label = $('.spread__label', section)

  if (reduce) return

  createPetals($('.spread__petals', section), {
    colors: ['#ffffff', '#ffd6e0', '#fff1b8', '#ffe8f0'],
    density: 0.7,
    wind: 1.3,
  })

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top top', end: '+=170%', pin: true, scrub: 0.7 },
    })
    .fromTo(frame, { clipPath: 'inset(30% 34% 30% 34%)', rotate: -3 }, { clipPath: 'inset(0% 0% 0% 0%)', rotate: 0, duration: 1, ease: 'power2.inOut' })
    .fromTo(pic, { scale: 1.45 }, { scale: 1.05, duration: 1.2, ease: 'power2.out' }, 0)
    .from(label, { x: -40, autoAlpha: 0, duration: 0.3 }, 0.7)
    .from(quote, { yPercent: 110, autoAlpha: 0, duration: 0.4, stagger: 0.14, ease: 'power3.out' }, 0.8)
    .to(pic, { scale: 1, duration: 0.6 }, 1.2)
    .to(quote, { y: -30, duration: 0.6 }, 1.2)
}
