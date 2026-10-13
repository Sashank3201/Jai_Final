import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis = null

export function initScroll(reduce) {
  if (reduce) return null
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const getLenis = () => lenis

export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target) : target
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { duration: immediate ? 0 : 1.8, immediate, easing: (t) => 1 - Math.pow(1 - t, 4) })
  } else {
    el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' })
  }
}

export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start()
  else document.documentElement.style.overflow = locked ? 'hidden' : ''
}
