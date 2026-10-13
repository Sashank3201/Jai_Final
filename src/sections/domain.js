import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { createSparkles } from '../fx/sparkles.js'

/** 第7話 — Jujutsu Kaisen: 領域展開. The night valley opens as a domain around the reader. */
export function initDomain({ reduce }) {
  const section = $('#contact')
  if (!section) return
  const image = $('.domain__image', section)
  const kanji = $$('.domain__kanji span', section)
  const en = $('.domain__en', section)
  const name = $('.domain__name', section)
  const intro = $('.domain__intro', section)
  const card = $('.domain__card', section)
  const ring = $('.domain__ring', section)
  const sparkles = $('.domain__sparkles', section)
  const copy = $('.domain__copy', section)

  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy)
      copy.textContent = 'Copied! コピー'
      copy.classList.add('is-copied')
    } catch {
      copy.textContent = 'Press Ctrl+C'
    }
    setTimeout(() => {
      copy.textContent = 'Copy'
      copy.classList.remove('is-copied')
    }, 1800)
  })

  const vmax = (k) => Math.max(window.innerWidth, window.innerHeight) * k

  createSparkles(sparkles)
  if (reduce) return

  gsap.set(image, { clipPath: 'circle(0% at 50% 50%)' })
  gsap.set(sparkles, { autoAlpha: 0 })
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: section, start: 'top top', end: '+=220%', pin: true, scrub: 0.7 },
  })
  tl.from(kanji, { scale: 2.8, autoAlpha: 0, filter: 'blur(14px)', duration: 0.12, stagger: 0.09, ease: 'expo.out' })
    .fromTo(ring, { width: 10, height: 10, autoAlpha: 0 }, { width: 120, height: 120, autoAlpha: 1, duration: 0.15 }, 0.1)
    .from(en, { autoAlpha: 0, letterSpacing: '1.4em', duration: 0.2 }, 0.3)
    .to(image, { clipPath: 'circle(75% at 50% 50%)', duration: 0.35, ease: 'power2.in' }, 0.48)
    .to(ring, { width: () => vmax(1.6), height: () => vmax(1.6), duration: 0.35, ease: 'power2.in' }, 0.48)
    .to(ring, { autoAlpha: 0, duration: 0.08 }, 0.78)
    .to(sparkles, { autoAlpha: 1, duration: 0.2 }, 0.72)
    .to(intro, { y: () => -window.innerHeight * 0.06, scale: 0.86, duration: 0.2 }, 0.8)
    .from(name, { autoAlpha: 0, y: 20, duration: 0.12 }, 0.84)
    .from(card, { autoAlpha: 0, y: 70, duration: 0.18, ease: 'power2.out' }, 0.9)
    .to({}, { duration: 0.15 })
}
