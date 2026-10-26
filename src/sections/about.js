import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { $, $$ } from '../lib/utils.js'

/** 第一話 — the profile: the print develops, the text sets line by line, the seal is stamped. */
export function initAbout({ reduce }) {
  const section = $('#about')
  if (!section || reduce) return
  const frame = $('.about__frame', section)
  const img = $('img', frame)
  const lines = $$('[data-lines]', section)
  const seal = $('.about__seal', section)
  const signature = $('.about__signature', section)
  const rows = $$('.databook__row', section)
  const chips = $$('.chips li', section)

  // The print is revealed like a sheet being drawn out of a sleeve, with a slow inner parallax.
  gsap.fromTo(
    frame,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.6,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: frame, start: 'top 85%', toggleActions: 'play none none reverse' },
    },
  )
  if (img) {
    gsap.fromTo(
      img,
      { scale: 1.18, yPercent: -4 },
      { scale: 1.04, yPercent: 4, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
  }

  // Body copy sets in line by line from behind a mask.
  // autoSplit re-splits (and rebuilds the tween) when fonts load or the width changes.
  lines.forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.2,
          stagger: 0.09,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
        }),
    })
  })

  const sign = gsap.timeline({
    scrollTrigger: { trigger: seal, start: 'top 88%', toggleActions: 'play none none reverse' },
  })
  sign.from(seal, { autoAlpha: 0, scale: 1.6, rotate: -18, duration: 0.5, ease: 'power4.out' })
  if (signature) sign.from(signature, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power2.inOut' }, 0.15)

  gsap.from([...rows, ...chips], {
    autoAlpha: 0,
    y: 14,
    duration: 0.8,
    stagger: 0.05,
    ease: 'power3.out',
    scrollTrigger: { trigger: rows[0], start: 'top 90%', toggleActions: 'play none none reverse' },
  })
}
