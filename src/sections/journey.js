import { gsap } from 'gsap'
import { $, $$ } from '../lib/utils.js'
import { getLenis } from '../lib/scroll.js'
import { createMana } from '../fx/mana.js'

const RANKS = [[95, 'S'], [70, 'A'], [45, 'B'], [25, 'C'], [10, 'D'], [0, 'E']]
const rankOf = (level) => RANKS.find(([min]) => level >= min)[1]
const pad2 = (v) => String(v).padStart(2, '0')

/**
 * 第四話 Arise — the journey as Solo Leveling's System. The stage pins and the scroll slides
 * a row of System windows past the reader. Everything follows the scroll directly — the
 * window in the middle comes into focus, the level counts and the EXP bar fills — so
 * nothing jumps; only transforms and opacity move, and the windows' contents never change
 * while they travel (no text effects), so they are never repainted mid-scroll. Without
 * motion (or JS) the windows are simply stacked.
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

  const levelEl = $('.journey__level', stage)
  const rankEl = $('.journey__rank-letter', stage)
  const xpBar = $('.journey__xp-bar i', stage)
  const levelUp = $('.journey__levelup', stage)
  const fill = $('.journey__axis-line i', stage)
  const nodes = $$('.journey__node', stage)
  const mana = createMana($('.journey__mana', stage), { count: 70 })

  const levels = cards.map((c) => +c.dataset.level)
  const setXp = gsap.quickSetter(xpBar, 'scaleX')
  const setFill = gsap.quickSetter(fill, 'scaleX')
  gsap.set(levelUp, { autoAlpha: 0 })

  // Card centres along the track, measured per layout (offsets ignore transforms).
  let centres = []
  let step = 1
  const measure = () => {
    centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2)
    step = centres[1] - centres[0] || 1
  }
  const distance = () => track.scrollWidth - viewport.clientWidth

  let active = -1
  let shownLevel = -1

  const activate = (i) => {
    const forward = i > active && active >= 0
    active = i
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i))
    nodes.forEach((b, k) => {
      b.classList.toggle('is-done', k < i)
      b.classList.toggle('is-active', k === i)
    })
    if (forward && levels[i] > levels[i - 1]) {
      mana.surge(0.5)
      gsap.killTweensOf(levelUp)
      gsap
        .timeline()
        .fromTo(levelUp, { autoAlpha: 0, y: 8, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.4)' })
        .to(levelUp, { autoAlpha: 0, y: -8, duration: 0.4, ease: 'power2.in' }, '+=0.7')
    }
  }

  const setLevel = (level) => {
    if (level === shownLevel) return
    shownLevel = level
    levelEl.textContent = pad2(level)
    const r = rankOf(level)
    if (rankEl.textContent !== r) {
      rankEl.textContent = r
      gsap.fromTo(rankEl, { scale: 1.4 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)', overwrite: true })
    }
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
    const lo = Math.floor(f)
    const hi = Math.min(N - 1, lo + 1)
    const t = f - lo
    setLevel(Math.round(levels[lo] + (levels[hi] - levels[lo]) * t))
    setXp(levels[hi] === levels[lo] ? 1 : t)
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
