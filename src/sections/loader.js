import { gsap } from 'gsap'
import { $, $$, imageReady } from '../lib/utils.js'
import { lockScroll } from '../lib/scroll.js'
import { conceal, decode } from '../fx/glitch.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const frames = (n) => new Promise((r) => (function f(k) { k ? requestAnimationFrame(() => f(k - 1)) : r() })(n))

/**
 * The volume cover. The count glides on time, not in steps: it eases toward 100, slowing
 * gently if the hero art or fonts are still on their way. At 100 the cover holds still
 * while `beforeOpen` does the page's heavy one-off work (building the sword, measuring the
 * scroll scenes), so nothing that moves ever waits on it. Then the cover shatters open and
 * `onOpen` starts the hero. Resolves once the shards are gone.
 */
export function runLoader({ reduce }, { beforeOpen = () => {}, onOpen = () => {} } = {}) {
  const el = $('[data-loader]')
  if (!el) return Promise.resolve(beforeOpen()).then(onOpen)

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
  let shown = -1
  const render = () => {
    bar.style.transform = `scaleX(${progress.p})`
    const n = Math.round(progress.p * 100)
    if (n !== shown) count.textContent = String((shown = n)).padStart(3, '0')
  }

  const assets = Promise.all([document.fonts?.ready ?? Promise.resolve(), imageReady($('.hero__fallback img'))])
  let ready = false
  let easing = false

  return new Promise((resolve) => {
    const run = gsap.to(progress, {
      p: 1,
      duration: reduce ? 0.4 : 2.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        render()
        // Still loading past halfway? Ease off rather than stop dead at some number.
        if (!ready && !easing && run.progress() > 0.5) {
          easing = true
          gsap.to(run, { timeScale: 0.08, duration: 0.9, ease: 'power2.out' })
        }
      },
      onComplete: () => hold().then(open).then(resolve),
    })

    const go = () => {
      if (ready) return
      ready = true
      gsap.to(run, { timeScale: 1, duration: 0.5, ease: 'power2.inOut', overwrite: true })
    }
    assets.then(go, go)
    wait(7000).then(go) // never hold the reader hostage to a slow asset
  })

  // At 100, while nothing moves: the heavy work, then a couple of clean frames.
  async function hold() {
    await Promise.race([Promise.resolve().then(beforeOpen), wait(2500)])
    await frames(2)
  }

  function open() {
    return new Promise((resolve) => {
      gsap
        .timeline({ onComplete: () => (el.remove(), resolve()) })
        .to(cover, { yPercent: -12, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
        .add(() => {
          el.style.background = 'transparent'
          lockScroll(false)
          onOpen()
        })
        .to(s1, { xPercent: -105, duration: 1.1, ease: 'expo.inOut' }, '<-0.05')
        .to(s2, { xPercent: 105, yPercent: -40, duration: 1.1, ease: 'expo.inOut' }, '<0.06')
        .to(s3, { xPercent: 60, yPercent: 105, duration: 1.1, ease: 'expo.inOut' }, '<0.06')
    })
  }
}
