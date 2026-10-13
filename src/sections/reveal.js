import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { conceal, decode, burst, onHover } from '../fx/glitch.js'

/** Chapter headings: the ruled kicker draws in, the title decodes out of katakana noise. */
export function initChapterHeads() {
  $$('.chead').forEach((head) => {
    const title = $('.chead__title .glitch', head)
    const kicker = $$('.chead__kicker > span:not(.rule)', head)
    const rule = $('.chead__kicker .rule', head)
    conceal(title)
    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      scrollTrigger: {
        trigger: head,
        start: 'top 84%',
        toggleActions: 'play none none reverse',
        onEnter: () => decode(title, { duration: 1 }),
        onEnterBack: () => burst(title),
      },
    })
    tl.from(rule, { scaleX: 0, transformOrigin: 'left center', duration: 1.4 }, 0).from(
      kicker,
      { autoAlpha: 0, y: 8, duration: 0.8, stagger: 0.06 },
      0,
    )
    onHover(head, title)
  })
}
