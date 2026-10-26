import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { setPages } from '../lib/scroll.js'

/** 第三話 — case-study cards ride a horizontal track; each cover opens as it arrives. */
export function initMissions({ reduce }) {
  const section = $('#projects')
  if (!section) return
  const track = $('.missions__track', section)
  const works = $$('.work', section)
  const count = $('.missions__count', section)
  const bar = $('.missions__bar i', section)

  const reveal = (w, scrollTrigger) => {
    const cover = $('.work__cover', w)
    gsap
      .timeline({ scrollTrigger, defaults: { ease: 'expo.out' } })
      .from(cover, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
      .from($$('.work__body > *', w), { autoAlpha: 0, y: 14, duration: 0.8, stagger: 0.05 }, 0.45)
  }

  const mm = gsap.matchMedia()
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)' }, (ctx) => {
    if (reduce || ctx.conditions.mobile) {
      section.classList.add('is-stacked')
      if (!reduce) works.forEach((w) => reveal(w, { trigger: w, start: 'top 82%', toggleActions: 'play none none reverse' }))
      return () => section.classList.remove('is-stacked')
    }
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
    const scroller = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(bar, { scaleX: self.progress })
          const i = Math.min(works.length, Math.floor(self.progress * works.length) + 1)
          count.textContent = String(i).padStart(2, '0')
        },
      },
    })
    // A page per card: the track rests with each card where the first one started.
    setPages('projects', () => {
      const st = scroller.scrollTrigger
      const d = distance()
      if (!st || !d) return null
      const left = works[0].offsetLeft
      const stops = works.map((w) => st.start + Math.min(1, (w.offsetLeft - left) / d) * (st.end - st.start))
      return { stops: [...stops.filter((y) => st.end - y > window.innerHeight * 0.2), st.end] }
    })
    works.forEach((w, i) => {
      if (i === 0) reveal(w, { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' })
      else reveal(w, { trigger: w, containerAnimation: scroller, start: 'left 90%', toggleActions: 'play none none reverse' })
    })
    return () => setPages('projects', null)
  })
}
