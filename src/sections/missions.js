import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { setPages } from '../lib/scroll.js'

/** 第三話 — case-study cards ride a horizontal track. The track's slide is the whole motion:
 *  no per-card effects run while it moves. Stacked on phones, each card rises in once. */
export function initMissions({ reduce }) {
  const section = $('#projects')
  if (!section) return
  const track = $('.missions__track', section)
  const works = $$('.work', section)
  const count = $('.missions__count', section)
  const bar = $('.missions__bar i', section)

  const mm = gsap.matchMedia()
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)' }, (ctx) => {
    if (reduce || ctx.conditions.mobile) {
      section.classList.add('is-stacked')
      // One move per card, opacity and transform only.
      if (!reduce)
        works.forEach((w) =>
          gsap.from(w, {
            autoAlpha: 0,
            y: 28,
            duration: 0.8,
            ease: 'expo.out',
            scrollTrigger: { trigger: w, start: 'top 88%', toggleActions: 'play none none reverse' },
          }),
        )
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
        scrub: true, // the page's glide is already eased; smoothing on top only trails it
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(bar, { scaleX: self.progress })
          const i = String(Math.min(works.length, Math.floor(self.progress * works.length) + 1)).padStart(2, '0')
          if (count.textContent !== i) count.textContent = i // only when it changes: no relayout per frame
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
      // Each card turns in a little over a second, easing in as well as out: a quick start
      // on a sideways slide reads as a jolt.
      return {
        stops: [...stops.filter((y) => st.end - y > window.innerHeight * 0.2), st.end],
        spans: [{ from: st.start, to: st.end, duration: 1.1 }],
      }
    })
    return () => setPages('projects', null)
  })
}
