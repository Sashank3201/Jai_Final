import { gsap } from 'gsap'
import { $, $$, imageReady } from '../lib/utils.js'
import { lockScroll } from '../lib/scroll.js'
import { conceal, decode } from '../fx/glitch.js'

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

  // The name decodes out of katakana noise once its typeface has arrived.
  const nameGlitch = $('.loader__name .glitch', el)
  if (!reduce && nameGlitch) {
    conceal(nameGlitch)
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => decode(nameGlitch, { duration: 1 }))
  }

  const progress = { p: 0 }
  const render = () => {
    bar.style.transform = `scaleX(${progress.p})`
    count.textContent = String(Math.round(progress.p * 100)).padStart(3, '0')
  }

  const tasks = [document.fonts?.ready ?? Promise.resolve(), imageReady($('.hero__fallback img'))]
  let done = 0
  const bump = () => {
    done++
    gsap.to(progress, { p: 0.15 + (done / tasks.length) * 0.75, duration: 0.6, ease: 'power2.out', onUpdate: render, overwrite: true })
  }
  tasks.forEach((t) => t.then(bump, bump))
  gsap.to(progress, { p: 0.15, duration: 0.5, onUpdate: render })

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
