import { gsap } from 'gsap'
import { onVisibility } from './utils.js'

/**
 * Runs `tick(dt)` on the GSAP ticker only while `el` is on screen and the tab is visible.
 * dt is normalised to 60fps frames (1 = 16.7ms) and clamped so a hitch never teleports particles.
 */
export function visibleLoop(el, tick) {
  let visible = false
  let last = 0
  const fn = (time) => {
    const now = time * 1000
    const dt = last ? Math.min((now - last) / 16.667, 3) : 1
    last = now
    tick(dt)
  }
  const set = (v) => {
    if (v === visible) return
    visible = v
    last = 0
    v ? gsap.ticker.add(fn) : gsap.ticker.remove(fn)
  }
  onVisibility(el, set)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gsap.ticker.remove(fn)
    } else if (visible) {
      last = 0
      gsap.ticker.add(fn)
    }
  })
  return { isVisible: () => visible }
}
