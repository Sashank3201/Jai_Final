import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { chapters, chapterById } from '../data/chapters.js'
import { $, $$, isFinePointer } from '../lib/utils.js'
import { scrollToTarget, lockScroll } from '../lib/scroll.js'

// ── Custom cursor ─────────────────────────────────────────────────────────────
export function initCursor({ reduce }) {
  const cursor = $('.cursor')
  if (!cursor || reduce || !isFinePointer()) return
  document.documentElement.classList.add('has-cursor')
  const ring = $('.cursor__ring', cursor)
  const dot = $('.cursor__dot', cursor)
  const label = $('.cursor__label', cursor)

  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })
  const labelX = gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3.out' })
  const labelY = gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3.out' })
  const dotX = gsap.quickSetter(dot, 'x', 'px')
  const dotY = gsap.quickSetter(dot, 'y', 'px')

  gsap.set(cursor, { autoAlpha: 0 })
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    gsap.to(cursor, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' })
    dotX(e.clientX)
    dotY(e.clientY)
    ringX(e.clientX)
    ringY(e.clientY)
    labelX(e.clientX)
    labelY(e.clientY)
  })
  document.addEventListener('pointerleave', () => gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }))

  const interactive = 'a, button, [data-cursor], [tabindex="0"]'
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest(interactive)
    cursor.classList.toggle('is-hover', !!t)
    const text = t?.getAttribute('data-cursor') ?? ''
    label.textContent = text
    label.classList.toggle('has-text', !!text)
  })
}

// ── Chapter tracking: HUD, accent colour, cursor personality ─────────────────
export function initChapters() {
  const root = document.documentElement
  const body = document.body
  const hudKanji = $('.hud__kanji span')
  const hudNo = $('.hud__no')
  const hudTitle = $('.hud__title')
  const hudPage = $('.hud__page-n')
  let current = null

  const set = (id) => {
    if (id === current) return
    const c = chapterById[id]
    if (!c) return
    const dir = current && chapterById[current].page > c.page ? -1 : 1
    current = id
    body.dataset.theme = c.theme
    gsap.to(root, { '--accent': c.accent, duration: 0.8, ease: 'power2.out' })
    gsap
      .timeline()
      .to([hudKanji, hudTitle, hudNo], { yPercent: -110 * dir, autoAlpha: 0, duration: 0.2, ease: 'power2.in' })
      .add(() => {
        hudKanji.textContent = c.mark
        hudNo.textContent = c.no
        hudTitle.textContent = c.title
        hudPage.textContent = String(c.page).padStart(2, '0')
      })
      .fromTo(
        [hudKanji, hudTitle, hudNo],
        { yPercent: 110 * dir, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.04 },
      )
  }

  chapters.forEach((c) => {
    const el = document.getElementById(c.id)
    if (!el) return
    const trigger = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
    ScrollTrigger.create({
      trigger,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && set(c.id),
    })
  })
  set('prologue')

  const bar = $('.progress span')
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => gsap.set(bar, { scaleY: self.progress }),
  })
}

// ── Nav + 目次 menu + in-page links ───────────────────────────────────────────
export function initNav({ reduce }) {
  const menu = $('#menu')
  const btn = $('.nav__menu')
  const inner = $('.menu__inner', menu)
  const items = $$('.menu__list li', menu)
  let open = false
  let lastFocus = null

  const show = () => {
    open = true
    lastFocus = document.activeElement
    menu.hidden = false
    btn.setAttribute('aria-expanded', 'true')
    lockScroll(true)
    if (!reduce) {
      gsap.fromTo(
        inner,
        { yPercent: 6, rotate: -2, autoAlpha: 0 },
        { yPercent: 0, rotate: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' },
      )
      gsap.fromTo(items, { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out', delay: 0.1 })
    }
    $('a', menu)?.focus({ preventScroll: true })
  }

  const hide = (restoreFocus = true) => {
    if (!open) return
    open = false
    btn.setAttribute('aria-expanded', 'false')
    lockScroll(false)
    const done = () => {
      menu.hidden = true
      if (restoreFocus) lastFocus?.focus?.({ preventScroll: true })
    }
    if (reduce) done()
    else gsap.to(inner, { yPercent: 4, autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: done })
  }

  btn.addEventListener('click', () => (open ? hide() : show()))
  menu.addEventListener('click', (e) => {
    if (e.target.classList.contains('menu__bg')) hide()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) hide()
    if (e.key === 'Tab' && open) {
      const focusables = [...$$('a', menu), btn]
      const i = focusables.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        focusables.at(-1).focus()
      } else if (!e.shiftKey && i === focusables.length - 1) {
        e.preventDefault()
        focusables[0].focus()
      }
    }
  })

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-goto]')
    if (!link) return
    e.preventDefault()
    const id = link.getAttribute('data-goto')
    const wasOpen = open
    hide(false)
    setTimeout(() => scrollToTarget(id), wasOpen ? 320 : 0)
  })
}
