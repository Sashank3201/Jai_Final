import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { $, $$ } from '../lib/utils.js'

/** Chapter headings: the 第○話 tag drops in, the title letters punch up from below. */
export function initChapterHeads() {
  $$('.chead').forEach((head) => {
    const title = $('[data-split]', head)
    const split = SplitText.create(title, { type: 'chars', charsClass: 'chead__char' })
    const tl = gsap.timeline({
      scrollTrigger: { trigger: head, start: 'top 82%', toggleActions: 'play none none reverse' },
    })
    tl.from($('.chead__no', head), { scaleY: 0, transformOrigin: 'top', duration: 0.5, ease: 'power3.out' })
      .from(split.chars, { yPercent: 115, rotate: 8, duration: 0.7, stagger: 0.025, ease: 'back.out(1.8)' }, '<0.1')
      .from($('.chead__sub', head), { autoAlpha: 0, x: -20, duration: 0.5 }, '<0.3')
  })
}

/** Manga panels/bubbles that pop in as they enter. */
export function initPops() {
  $$('[data-pop]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 50,
      scale: 0.86,
      rotate: gsap.utils.random(-4, 4),
      duration: 0.8,
      ease: 'back.out(1.7)',
      scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
    })
  })
}

/** A quick camera shake, for impacts. */
export function shake(el, strength = 10) {
  return gsap.fromTo(
    el,
    { x: 0, y: 0 },
    {
      keyframes: {
        x: [-strength, strength * 0.9, -strength * 0.6, strength * 0.4, 0],
        y: [strength * 0.6, -strength * 0.5, strength * 0.3, -strength * 0.2, 0],
      },
      duration: 0.4,
      ease: 'none',
    },
  )
}
