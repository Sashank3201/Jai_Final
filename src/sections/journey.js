import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { getLenis, pageTop, setPages } from '../lib/scroll.js'
import { createMana } from '../fx/mana.js'

/**
 * 第四話 — the experience timeline. The stage pins and the scroll slides a row of glowing
 * windows past the reader. Everything follows the scroll directly — the window in the
 * middle comes into focus and the milestone axis fills — so nothing jumps; only transforms
 * and opacity move, and the windows' contents never change while they travel (no text
 * effects), so they are never repainted mid-scroll. Without motion (or JS) the windows are
 * simply stacked.
 */
export function initJourney({ reduce }) {
  const section = $('#journey')
  if (!section || reduce) return
  const stage = $('.journey__stage', section)
  const viewport = $('.journey__viewport', stage)
  const track = $('.journey__track', stage)
  const cards = $$('.quest', track)
  const N = cards.length
  if (N < 2) return
  section.classList.add('is-scene')

  const fill = $('.journey__axis-line i', stage)
  const nodes = $$('.journey__node', stage)
  const mana = createMana($('.journey__mana', stage), { count: 70 })

  const setFill = gsap.quickSetter(fill, 'scaleX')

  // Card centres along the track, measured per layout (offsets ignore transforms).
  let centres = []
  let step = 1
  const measure = () => {
    centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2)
    step = centres[1] - centres[0] || 1
  }
  const distance = () => track.scrollWidth - viewport.clientWidth

  let active = -1

  const activate = (i) => {
    const forward = i > active && active >= 0
    active = i
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i))
    nodes.forEach((b, k) => {
      b.classList.toggle('is-done', k < i)
      b.classList.toggle('is-active', k === i)
    })
    if (forward) mana.surge(0.5)
  }

  // Runs on every frame the track moves.
  const update = () => {
    const x = gsap.getProperty(track, 'x')
    const mid = viewport.clientWidth / 2
    cards.forEach((c, k) => {
      const a = Math.min(1, Math.abs((centres[k] + x - mid) / step))
      c.style.transform = `scale(${1 - 0.1 * a})`
      c.style.opacity = 1 - 0.62 * a
    })
    const f = gsap.utils.clamp(0, N - 1, (mid - x - centres[0]) / step) // the card at the centre, fractional
    const i = Math.round(f)
    if (i !== active) activate(i)
    setFill(f / (N - 1))
    mana.setLevel(0.25 + 0.75 * (f / (N - 1)))
  }

  measure()
  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    onUpdate: update,
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      anticipatePin: 1, // a fast swipe doesn't overshoot the pin and jump back
      scrub: 0.5,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure()
        update()
      },
    },
  })
  update()

  // A page per milestone, after the chapter heading.
  setPages('journey', () => {
    const st = tween.scrollTrigger
    const top = pageTop(section)
    const head = st.start - top > window.innerHeight * 0.3 ? [top] : []
    return { stops: [...head, ...cards.map((_, i) => st.start + (i / (N - 1)) * (st.end - st.start))] }
  })

  // The axis jumps straight to a milestone.
  nodes.forEach((b) =>
    b.addEventListener('click', () => {
      const st = tween.scrollTrigger
      const y = st.start + (+b.dataset.step / (N - 1)) * (st.end - st.start)
      const lenis = getLenis()
      lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' })
    }),
  )
}
