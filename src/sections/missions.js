import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'

/** 第4話 — mission scrolls ride a horizontal track and unroll as they arrive. */
export function initMissions({ reduce }) {
  const section = $('#projects')
  if (!section) return
  const track = $('.missions__track', section)
  const missions = $$('.mission', section)
  const star = $('.missions__progress .ico-shuriken', section)
  const count = $('.missions__count b', section)
  const bar = $('.missions__bar i', section)

  const unroll = (m, scrollTrigger) => {
    const paper = $('.mission__paper', m)
    const rod = $$('.mission__rod', m)[1]
    gsap
      .timeline({ scrollTrigger })
      .from(paper, { clipPath: 'inset(0 100% 0 0)', duration: 0.8, ease: 'power3.inOut' })
      .from(rod, { x: () => -paper.offsetWidth, duration: 0.8, ease: 'power3.inOut' }, 0)
      .from($$('.mission__head, .mission__art, .mission__title, .mission__sum', m), { autoAlpha: 0, y: 16, duration: 0.4, stagger: 0.06 }, 0.45)
  }

  const mm = gsap.matchMedia()
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)' }, (ctx) => {
    if (reduce || ctx.conditions.mobile) {
      section.classList.add('is-stacked')
      if (!reduce) missions.forEach((m) => unroll(m, { trigger: m, start: 'top 80%', toggleActions: 'play none none reverse' }))
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
          gsap.set(star, { rotate: self.progress * 1440 })
          gsap.set(bar, { scaleX: self.progress })
          const i = Math.min(missions.length, Math.floor(self.progress * missions.length) + 1)
          count.textContent = String(i).padStart(2, '0')
        },
      },
    })
    missions.forEach((m, i) => {
      if (i === 0) unroll(m, { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' })
      else unroll(m, { trigger: m, containerAnimation: scroller, start: 'left 88%', toggleActions: 'play none none reverse' })
    })
  })
}
