import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$ } from '../lib/utils.js'
import { getLenis } from '../lib/scroll.js'
import { createMana } from '../fx/mana.js'
import { conceal, decode, reveal } from '../fx/glitch.js'

const pad2 = (v) => String(v).padStart(2, '0')

/**
 * 第五話 Arise — the journey as Solo Leveling's System. The stage pins, and each milestone
 * opens as a System window in front of a gate. Between milestones the EXP bar fills with
 * the scroll; when it tops out: LEVEL UP, the rank climbs, and the next quest opens.
 * Without motion (or without JS) the quests are simply a stack of System windows.
 */
export function initJourney({ reduce }) {
  const section = $('#journey')
  if (!section || reduce) return
  const stage = $('.journey__stage', section)
  const quests = $$('.quest', stage)
  const n = quests.length
  if (!n) return
  section.classList.add('is-scene')

  const ghost = $('.journey__ghost', stage)
  const gate = $('.journey__gate', stage)
  const beam = $('.journey__beam', stage)
  const levelEl = $('.journey__level', stage)
  const rankEl = $('.journey__rank-letter', stage)
  const rankBox = $('.journey__rank', stage)
  const xp = $('.journey__xp-bar i', stage)
  const levelUp = $('.journey__levelup', stage)
  const steps = $$('.journey__step', stage)
  const dots = $$('.journey__dots li', stage)
  const final = $('.journey__final', stage)
  const finalText = $('.journey__final-text .glitch', stage)
  const mana = createMana($('.journey__mana', stage))

  const data = quests.map((q) => ({
    year: q.dataset.year,
    level: +q.dataset.level,
    rank: q.dataset.rank,
    win: $('.quest__window', q),
    title: $('.quest__title .glitch', q),
    parts: $$('.quest__head, .quest__place, .quest__text, .quest__reward', q),
  }))

  gsap.set(quests, { autoAlpha: 0 })
  data.forEach((d) => conceal(d.title))
  gsap.set([levelUp, final], { autoAlpha: 0 })
  conceal(finalText)

  // ── One milestone at a time ─────────────────────────────────────────────────
  let current = -1
  const shownLevel = { v: data[0].level }
  const setLevel = (to, animate) => {
    gsap.killTweensOf(shownLevel)
    if (!animate) {
      shownLevel.v = to
      levelEl.textContent = pad2(to)
      return
    }
    gsap.to(shownLevel, {
      v: to,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => (levelEl.textContent = pad2(Math.round(shownLevel.v))),
    })
  }

  const setRank = (r) => {
    if (rankEl.textContent === r) return
    gsap
      .timeline()
      .to(rankBox, { scale: 1.18, duration: 0.14, ease: 'power2.out' })
      .add(() => (rankEl.textContent = r))
      .to(rankBox, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
  }

  const setGhost = (year) => {
    if (ghost.textContent === year) return
    gsap
      .timeline()
      .to(ghost, { autoAlpha: 0, yPercent: -4, duration: 0.25, ease: 'power2.in' })
      .add(() => (ghost.textContent = year))
      .fromTo(ghost, { autoAlpha: 0, yPercent: 4 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: 'expo.out' })
  }

  function show(i, { animate = true } = {}) {
    if (i === current) return
    const dir = i > current ? 1 : -1
    const prev = data[current]
    const next = data[i]
    current = i

    steps.forEach((s, k) => {
      s.classList.toggle('is-done', k < i)
      s.classList.toggle('is-active', k === i)
    })
    dots.forEach((d, k) => {
      d.classList.toggle('is-done', k < i)
      d.classList.toggle('is-active', k === i)
    })
    mana.setLevel(0.2 + 0.8 * (i / Math.max(1, n - 1)))

    if (prev) {
      const out = quests[data.indexOf(prev)]
      gsap.killTweensOf(out)
      gsap.to(out, { autoAlpha: 0, y: -28 * dir, filter: 'blur(8px)', duration: 0.35, ease: 'power2.in' })
    }

    const q = quests[i]
    gsap.killTweensOf([q, next.win, ...next.parts])
    if (!animate) {
      gsap.set(q, { autoAlpha: 1, y: 0, filter: 'none' })
      gsap.set(next.win, { clipPath: 'none' })
      gsap.set(next.parts, { autoAlpha: 1, y: 0 })
      reveal(next.title)
      setLevel(next.level, false)
      rankEl.textContent = next.rank
      ghost.textContent = next.year
      return
    }

    // The window opens out of a line of light, then its text arrives.
    const at = prev ? 0.18 : 0
    gsap.set(q, { autoAlpha: 1, y: 0, filter: 'none' })
    gsap.set(next.parts, { autoAlpha: 0, y: 10 })
    conceal(next.title)
    gsap.fromTo(beam, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.3, delay: at, ease: 'power3.out' })
    gsap.to(beam, { autoAlpha: 0, duration: 0.45, delay: at + 0.3 })
    gsap.fromTo(
      next.win,
      // (negative insets keep the corner brackets, which sit just outside the window)
      { clipPath: 'inset(49.6% -3% 49.6% -3%)' },
      { clipPath: 'inset(-4% -3% -4% -3%)', duration: 0.65, delay: at + 0.12, ease: 'expo.inOut', clearProps: 'clipPath' },
    )
    gsap.to(next.parts, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, delay: at + 0.45, ease: 'expo.out' })
    decode(next.title, { duration: 0.85, delay: at + 0.5 })
    gsap.fromTo(gate, { scale: 1.07, filter: 'brightness(1.6)' }, { scale: 1, filter: 'brightness(1)', duration: 1.4, ease: 'expo.out' })

    setLevel(next.level, true)
    setRank(next.rank)
    setGhost(next.year)
    if (dir > 0 && prev) {
      mana.surge(0.6)
      gsap
        .timeline()
        .fromTo(levelUp, { autoAlpha: 0, scale: 0.6, y: 8 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(2.4)' })
        .to(levelUp, { autoAlpha: 0, y: -10, duration: 0.5, ease: 'power2.in' }, '+=0.75')
    }
  }

  // ── The finale: the last title is acquired ─────────────────────────────────
  let arisen = false
  const arise = (on) => {
    if (on === arisen) return
    arisen = on
    section.classList.toggle('is-arise', on)
    gsap.killTweensOf(final)
    if (on) {
      mana.surge(1.4)
      gsap.fromTo(final, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' })
      decode(finalText, { duration: 1.1, delay: 0.1 })
      gsap.fromTo(gate, { scale: 1.12, filter: 'brightness(2)' }, { scale: 1, filter: 'brightness(1)', duration: 1.8, ease: 'expo.out' })
    } else {
      gsap.to(final, { autoAlpha: 0, duration: 0.3 })
      conceal(finalText)
    }
  }

  // ── Scroll: each milestone gets a stretch of the pin; EXP fills across it ───
  const UNITS = n + 0.8 // the last stretch holds the finale
  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${Math.round(UNITS * 0.85 * window.innerHeight)}`,
    pin: true,
    onUpdate: (self) => {
      const u = self.progress * UNITS
      const i = Math.min(n - 1, Math.floor(u))
      show(i)
      gsap.set(xp, { scaleX: i < n - 1 ? u - i : 1 })
      arise(u >= n + 0.15)
    },
  })

  // The first window opens as the stage comes up, before the pin takes hold.
  ScrollTrigger.create({
    trigger: stage,
    start: 'top 55%',
    onEnter: () => current < 0 && show(0),
    onLeaveBack: () => {
      gsap.to(quests, { autoAlpha: 0, duration: 0.3 })
      data.forEach((d) => conceal(d.title))
      current = -1
    },
  })

  // The quest log jumps straight to a milestone.
  const goTo = (i) => {
    const y = st.start + ((i + 0.35) / UNITS) * (st.end - st.start)
    const lenis = getLenis()
    lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: 'smooth' })
  }
  steps.forEach((s) => s.addEventListener('click', () => goTo(+s.dataset.step)))

  // Arriving mid-scene (a reload, or the 目次 index), show where the reader is without replaying.
  if (st.progress > 0) show(Math.min(n - 1, Math.floor(st.progress * UNITS)), { animate: false })
}
