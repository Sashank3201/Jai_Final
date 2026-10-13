import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$ } from '../lib/utils.js'

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

/** 第五話 — the rail tracks the year (and, quietly, a System level/rank) as the timeline is read. */
export function initJourney({ reduce }) {
  const section = $('#journey')
  if (!section) return
  const list = $('.journey__list', section)
  const entries = $$('.entry', list)
  const year = $('.journey__year', section)
  const level = $('.journey__level', section)
  const rank = $('.journey__rank', section)
  const track = $('.journey__track i', section)
  let shownYear = year.textContent

  const setYear = (y) => {
    if (y === shownYear) return
    shownYear = y
    if (reduce) {
      year.textContent = y
      return
    }
    gsap
      .timeline()
      .to(year, { yPercent: -30, autoAlpha: 0, duration: 0.18, ease: 'power2.in' })
      .add(() => (year.textContent = y))
      .fromTo(year, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' })
  }

  ScrollTrigger.create({
    trigger: list,
    start: 'top 60%',
    end: 'bottom 55%',
    onUpdate: (self) => {
      const p = self.progress
      gsap.set(track, { scaleX: p })
      level.textContent = String(Math.max(1, Math.round(1 + p * 98))).padStart(2, '0')
      rank.textContent = RANKS[Math.min(RANKS.length - 1, Math.floor(p * RANKS.length))]
    },
  })

  entries.forEach((entry) => {
    ScrollTrigger.create({
      trigger: entry,
      start: 'top 58%',
      end: 'bottom 58%',
      onToggle: (self) => self.isActive && setYear(entry.dataset.year),
    })
  })

  if (reduce) return

  entries.forEach((entry) => {
    gsap.from(entry.querySelectorAll('.entry__year, .entry__body > *'), {
      autoAlpha: 0,
      y: 16,
      duration: 0.9,
      stagger: 0.06,
      ease: 'expo.out',
      scrollTrigger: { trigger: entry, start: 'top 82%', toggleActions: 'play none none reverse' },
    })
  })
}
