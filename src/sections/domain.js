import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { setPages } from '../lib/scroll.js'
import { createSparkles } from '../fx/sparkles.js'
import { conceal, decode, onHover } from '../fx/glitch.js'

/** 第五話 — 領域展開. The night valley opens as a domain around the reader, then the contact card. */
export function initDomain({ reduce }) {
  const section = $('#contact')
  if (!section) return
  const image = $('.domain__image', section)
  const kanji = $$('.domain__kanji span', section)
  const en = $('.domain__en', section)
  const intro = $('.domain__intro', section)
  const card = $('.domain__card', section)
  const cardParts = [...card.children]
  const ring = $('.domain__ring', section)
  const sparkles = $('.domain__sparkles', section)
  const copy = $('.domain__copy', section)

  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy)
      copy.textContent = 'Copied'
      copy.classList.add('is-copied')
    } catch {
      copy.textContent = 'Press Ctrl+C'
    }
    setTimeout(() => {
      copy.textContent = 'Copy'
      copy.classList.remove('is-copied')
    }, 1800)
  })

  createSparkles(sparkles)
  if (reduce) {
    // Static layout: the title sits above the card, where the animation would leave it.
    gsap.set(intro, { y: -window.innerHeight * 0.3, scale: 0.62 })
    return
  }

  const vmax = (k) => Math.max(window.innerWidth, window.innerHeight) * k

  const heading = $('.domain__heading .glitch', section)
  conceal(heading)
  onHover($('.domain__heading', section), heading)

  gsap.set(image, { clipPath: 'circle(0% at 50% 50%)' })
  gsap.set(sparkles, { autoAlpha: 0 })
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: section, start: 'top top', end: '+=200%', pin: true, scrub: 0.8 },
  })
  // The page rests once the reveal is done and the contact card is up.
  setPages('contact', () => ({ stops: [tl.scrollTrigger.end] }))
  tl.from(kanji, { autoAlpha: 0, yPercent: 30, filter: 'blur(12px)', duration: 0.14, stagger: 0.08, ease: 'power3.out' })
    .fromTo(ring, { width: 10, height: 10, autoAlpha: 0 }, { width: 140, height: 140, autoAlpha: 1, duration: 0.15 }, 0.1)
    .from(en, { autoAlpha: 0, letterSpacing: '1.2em', duration: 0.2 }, 0.28)
    .to(image, { clipPath: 'circle(75% at 50% 50%)', duration: 0.35, ease: 'power2.in' }, 0.46)
    .to(ring, { width: () => vmax(1.6), height: () => vmax(1.6), duration: 0.35, ease: 'power2.in' }, 0.46)
    .to(ring, { autoAlpha: 0, duration: 0.08 }, 0.76)
    .to(sparkles, { autoAlpha: 1, duration: 0.2 }, 0.7)
    .to(intro, { y: () => -window.innerHeight * 0.3, scale: 0.62, duration: 0.22, ease: 'power2.inOut' }, 0.78)
    .from(card, { autoAlpha: 0, y: 60, duration: 0.18, ease: 'power2.out' }, 0.86)
    .from(cardParts, { autoAlpha: 0, y: 16, duration: 0.12, stagger: 0.02, ease: 'power2.out' }, 0.9)
    .call(() => decode(heading, { duration: 1 }), null, 0.92)
    .to({}, { duration: 0.12 })
}
