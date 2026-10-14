import { gsap } from 'gsap'
import { $, $$, imageReady } from '../lib/utils.js'
import { lockScroll } from '../lib/scroll.js'
import { burst } from '../fx/glitch.js'

// The bar's CSS creep before this script arrives (see .loader__bar i in chrome.css).
const CREEP = { to: 0.35, delay: 300, duration: 6000, curve: [0.1, 0.6, 0.3, 1] }

/** cubic-bezier(x1, y1, x2, y2) as a function of progress, like CSS's. */
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  return (x) => {
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = ((ax * t + bx) * t + cx) * t - x
      const slope = (3 * ax * t + 2 * bx) * t + cx
      if (Math.abs(err) < 1e-5 || !slope) break
      t -= err / slope
    }
    t = Math.min(1, Math.max(0, t))
    return ((ay * t + by) * t + cy) * t
  }
}

/** Where the CSS creep has got to. It runs on the compositor while the page is busy, so
 *  reading the computed style here would return a stale value: work it out from the clock. */
function creptSoFar(bar) {
  const anim = bar.getAnimations?.()[0]
  if (!anim || anim.startTime == null) return 0
  const x = (performance.now() - anim.startTime - CREEP.delay) / CREEP.duration
  return CREEP.to * cubicBezier(...CREEP.curve)(Math.min(1, Math.max(0, x)))
}

/** The volume cover: counts up while the hero art + fonts load, then shatters open. */
export function runLoader({ reduce }) {
  const el = $('[data-loader]')
  if (!el) return Promise.resolve()

  const bar = $('.loader__bar i', el)
  const count = $('.loader__num', el)
  const cover = $('.loader__cover', el)
  const [s1, s2, s3] = $$('.loader__shard', el)

  lockScroll(true)
  window.scrollTo(0, 0)

  // The page painted the cover before this script arrived (the bar creeping in CSS); take
  // over from wherever the bar has got to, so nothing jumps back.
  const crept = creptSoFar(bar)
  bar.style.animation = 'none'
  el.classList.add('is-live')

  // The name has been showing since the first paint: a quick glitch tear says it's alive.
  const nameGlitch = $('.loader__name .glitch', el)
  if (!reduce && nameGlitch) setTimeout(() => burst(nameGlitch, 420), 150)

  const progress = { p: crept }
  const render = () => {
    bar.style.transform = `scaleX(${progress.p})`
    count.textContent = String(Math.round(progress.p * 100)).padStart(3, '0')
  }

  const tasks = [document.fonts?.ready ?? Promise.resolve(), imageReady($('.hero__fallback img'))]
  let done = 0
  const bump = () => {
    done++
    const p = Math.max(progress.p, 0.15 + (done / tasks.length) * 0.75)
    gsap.to(progress, { p, duration: 0.6, ease: 'power2.out', onUpdate: render, overwrite: true })
  }
  render()
  tasks.forEach((t) => t.then(bump, bump))
  gsap.to(progress, { p: Math.max(progress.p, 0.15), duration: 0.5, onUpdate: render })

  const ready = Promise.all(tasks)
  const minTime = new Promise((r) => setTimeout(r, reduce ? 200 : 1500))
  const timeout = new Promise((r) => setTimeout(r, 7000))

  return Promise.race([Promise.all([ready, minTime]), timeout]).then(
    () =>
      new Promise((resolve) => {
        const tl = gsap.timeline({
          onComplete: () => {
            el.remove()
          },
        })
        tl.to(progress, { p: 1, duration: 0.45, ease: 'power2.inOut', onUpdate: render, overwrite: true })
          .to(cover, { yPercent: -12, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
          .add(() => {
            el.style.background = 'transparent'
            lockScroll(false)
            resolve()
          })
          .to(s1, { xPercent: -105, duration: 1.1, ease: 'expo.inOut' }, '<-0.05')
          .to(s2, { xPercent: 105, yPercent: -40, duration: 1.1, ease: 'expo.inOut' }, '<0.06')
          .to(s3, { xPercent: 60, yPercent: 105, duration: 1.1, ease: 'expo.inOut' }, '<0.06')
      }),
  )
}
