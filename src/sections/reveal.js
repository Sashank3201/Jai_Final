import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { $, $$ } from '../lib/utils.js'

/** Chapter headings: the ruled kicker draws in, the title letters rise from behind a mask. */
export function initChapterHeads() {
  $$('.chead').forEach((head) => {
    const title = $('[data-split]', head)
    const kicker = $$('.chead__kicker > span:not(.rule)', head)
    const rule = $('.chead__kicker .rule', head)
    const split = SplitText.create(title, { type: 'chars', charsClass: 'chead__char' })
    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      scrollTrigger: { trigger: head, start: 'top 84%', toggleActions: 'play none none reverse' },
    })
    tl.from(rule, { scaleX: 0, transformOrigin: 'left center', duration: 1.4 }, 0)
      .from(kicker, { autoAlpha: 0, y: 8, duration: 0.8, stagger: 0.06 }, 0)
      .from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.022 }, 0.1)
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
