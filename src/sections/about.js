import { gsap } from 'gsap'
import { $, isFinePointer } from '../lib/utils.js'

/** 第1話 — the WANTED poster swings onto the wall and the bounty counts up. */
export function initAbout() {
  const section = $('#about')
  if (!section) return
  const poster = $('.wanted', section)
  const don = $('.sfx--don', section)
  const bounty = $('[data-bounty]', section)
  const hire = $('.wanted__hire', section)
  const target = Number(bounty.dataset.bounty) || 0
  const counter = { v: 0 }

  gsap.set(don, { scale: 0, autoAlpha: 0 })
  gsap.set(hire, { clipPath: 'inset(0 100% 0 0)' })
  bounty.textContent = '0'

  const tl = gsap.timeline({
    scrollTrigger: { trigger: poster, start: 'top 80%', toggleActions: 'play none none reverse' },
  })
  tl.from(poster, {
    y: -140,
    rotate: -24,
    autoAlpha: 0,
    transformOrigin: '50% 0%',
    duration: 1.6,
    ease: 'elastic.out(1, 0.45)',
  })
    .to(don, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(3)' }, 0.35)
    .to(
      counter,
      {
        v: target,
        duration: 1.8,
        ease: 'expo.out',
        onUpdate: () => (bounty.textContent = Math.round(counter.v).toLocaleString('en-US')),
      },
      0.5,
    )
    .to(hire, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.inOut' }, 1.1)

  // Gentle 3D tilt toward the pointer.
  if (isFinePointer()) {
    const rx = gsap.quickTo(poster, 'rotationX', { duration: 0.8, ease: 'power3.out' })
    const ry = gsap.quickTo(poster, 'rotationY', { duration: 0.8, ease: 'power3.out' })
    const wrap = poster.parentElement
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      ry(nx * 18)
      rx(-ny * 14)
    })
    wrap.addEventListener('pointerleave', () => {
      rx(0)
      ry(0)
    })
  }
}
