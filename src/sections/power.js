import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'

const fmt = (n) => Math.round(n).toLocaleString('en-US')

/** 第六話 — the numbers count up once, as the row comes into view. */
export function initPower({ reduce }) {
  const section = $('#power')
  if (!section || reduce) return
  const nums = $$('[data-count]', section)
  const targets = nums.map((n) => Number(n.dataset.count))
  const c = { t: 0 }
  const render = () => nums.forEach((n, i) => (n.textContent = fmt(targets[i] * c.t)))
  render()

  gsap.to(c, {
    t: 1,
    duration: 2,
    ease: 'expo.out',
    onUpdate: render,
    scrollTrigger: { trigger: $('.impact', section), start: 'top 80%', once: true },
  })
}
