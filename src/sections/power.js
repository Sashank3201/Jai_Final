import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { shake } from './reveal.js'

const fmt = (n) => Math.round(n).toLocaleString('en-US')

/** 第6話 — Dragon Ball: the scouter reads the numbers until it breaks. */
export function initPower({ reduce }) {
  const section = $('#power')
  if (!section) return
  const stats = $$('[data-count]', section)
  const total = $('[data-power]', section)
  const over = $('.power__over', section)
  const read = $('.scouter__read', section)
  const num = $('.scouter__num', section)
  const crack = $$('.scouter__crack path', section)
  const lens = $('.scouter__lens', section)

  if (reduce) return

  const targets = stats.map((s) => Number(s.dataset.count))
  const totalTarget = Number(total.dataset.power)
  const c = { total: 0 }
  const counters = targets.map(() => ({ v: 0 }))
  const render = () => {
    stats.forEach((s, i) => (s.textContent = fmt(counters[i].v)))
    total.textContent = fmt(c.total)
    num.textContent = String(Math.round(c.total)).padStart(4, '0')
  }
  render()
  gsap.set(over, { scale: 0, autoAlpha: 0 })

  gsap
    .timeline({
      scrollTrigger: { trigger: section, start: 'top 55%', toggleActions: 'play none none reset' },
      onStart: () => (read.textContent = 'SCANNING…'),
    })
    .to(counters, { v: (i) => targets[i], duration: 1.6, ease: 'power3.out', stagger: 0.15, onUpdate: render })
    .to(c, { total: totalTarget, duration: 2.2, ease: 'expo.in', onUpdate: render }, 0.3)
    .add(() => (read.textContent = 'ERROR!! ERROR!!'))
    .to(crack, { strokeDashoffset: 0, duration: 0.25, ease: 'power4.out' })
    .fromTo(lens, { backgroundColor: 'rgba(255,60,60,0.0)' }, { backgroundColor: 'rgba(255,60,60,0.45)', duration: 0.1, yoyo: true, repeat: 3 }, '<')
    .add(() => shake(section, 14), '<')
    .to(over, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(3)' }, '<')
}
