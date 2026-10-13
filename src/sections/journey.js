import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$ } from '../lib/utils.js'

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

/** 第5話 — Solo Leveling: System windows open as you read; level, rank and EXP climb. */
export function initJourney({ reduce }) {
  const section = $('#journey')
  if (!section) return
  const list = $('.journey__list', section)
  const wins = $$('.syswin', list)
  const status = $('.status', section)
  const level = $('.status__level', section)
  const rank = $('.status__rank', section)
  const title = $('.status__title', section)
  const exp = $('.status__exp i', section)
  const final = $('.journey__final', section)
  const titles = JSON.parse(list.dataset.titles || '[]')
  let lastStep = -1

  ScrollTrigger.create({
    trigger: list,
    start: 'top 65%',
    end: 'bottom 55%',
    onUpdate: (self) => {
      const p = self.progress
      level.textContent = String(Math.max(1, Math.round(1 + p * 98)))
      rank.textContent = RANKS[Math.min(RANKS.length - 1, Math.floor(p * RANKS.length))]
      const steps = Math.max(1, titles.length)
      const step = Math.min(steps - 1, Math.floor(p * steps))
      gsap.set(exp, { scaleX: (p * steps) % 1 || (p >= 1 ? 1 : 0) })
      if (step !== lastStep) {
        lastStep = step
        title.textContent = titles[step] ?? ''
        if (!reduce) {
          gsap.fromTo(
            status,
            { boxShadow: '0 0 60px rgba(76, 201, 255, 0.9), inset 0 0 40px rgba(76, 201, 255, 0.5)' },
            { boxShadow: '0 0 24px rgba(76, 201, 255, 0.28), inset 0 0 26px rgba(76, 201, 255, 0.12)', duration: 0.8 },
          )
        }
      }
    },
  })

  if (reduce) return

  wins.forEach((win) => {
    gsap
      .timeline({ scrollTrigger: { trigger: win, start: 'top 82%', toggleActions: 'play none none reverse' } })
      .from(win, { scaleY: 0.02, scaleX: 0.6, autoAlpha: 0, duration: 0.45, ease: 'expo.out' })
      .from(win.children, { autoAlpha: 0, x: -12, duration: 0.3, stagger: 0.05 }, 0.2)
      .fromTo(win, { x: -6 }, { keyframes: { x: [5, -3, 2, 0] }, duration: 0.25, ease: 'none' }, 0.15)
  })

  gsap
    .timeline({ scrollTrigger: { trigger: final, start: 'top 80%', toggleActions: 'play none none reverse' } })
    .from(final, { scaleY: 0.02, autoAlpha: 0, duration: 0.5, ease: 'expo.out' })
    .from($('span', final), { letterSpacing: '0.8em', autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, 0.3)
}
