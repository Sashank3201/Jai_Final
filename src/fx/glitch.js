// Glitch type: letters decode out of katakana noise, and RGB-split bursts tear the line.
// Markup: <span class="sr-only">Text</span><span class="glitch" data-text="Text" aria-hidden="true">Text</span>
// (the visible layer is decorative; the sr-only copy is what assistive tech reads).

const POOL = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン01<>/#%&'
const noise = () => POOL[(Math.random() * POOL.length) | 0]

/** Splits the text into word-wrapped character spans once. */
function build(el) {
  if (el._chars) return el._chars
  const text = el.dataset.text ?? el.textContent
  el.dataset.text = text
  el.textContent = ''
  const chars = []
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue
    if (/^\s+$/.test(part)) {
      el.append(document.createTextNode(' '))
      continue
    }
    const word = document.createElement('span')
    word.className = 'g-word'
    for (const c of part) {
      const s = document.createElement('span')
      s.className = 'g-ch'
      s.textContent = c
      s._final = c
      word.append(s)
      chars.push(s)
    }
    el.append(word)
  }
  el._chars = chars
  return chars
}

/** Hide the letters until decode() runs (avoids a flash of the final text). */
export function conceal(el) {
  el._concealed = true
  build(el).forEach((s) => (s.style.opacity = '0'))
}

export function reveal(el) {
  el._concealed = false
  cancelAnimationFrame(el._raf)
  build(el).forEach((s) => {
    s.textContent = s._final
    s.classList.remove('is-noise')
    s.style.opacity = ''
    s.style.width = ''
  })
}

/** Letters flicker through katakana noise and lock in, roughly left to right. */
export function decode(el, { duration = 1.1, delay = 0 } = {}) {
  const chars = build(el)
  cancelAnimationFrame(el._raf)
  // Lock each letter's width so the wider/narrower noise glyphs never reflow the line.
  chars.forEach((s) => {
    s.style.width = ''
    s.textContent = s._final
  })
  // Measured boxes include any scale on the element or its ancestors; divide it back out,
  // or a headline decoded mid-zoom would lock its letters too narrow and snap at the end.
  const box = el.getBoundingClientRect().width
  const scale = el.offsetWidth && box ? box / el.offsetWidth : 1
  const widths = chars.map((s) => s.getBoundingClientRect().width / scale)
  chars.forEach((s, i) => {
    s.style.width = `${widths[i]}px`
    s.style.opacity = '0'
  })
  el._decoding = true
  const n = chars.length
  const lockAt = chars.map((_, i) => (i / n) * duration * 0.6 + Math.random() * duration * 0.4)
  const start = performance.now() + delay * 1000
  let lastSwap = 0
  return new Promise((resolve) => {
    const frame = (t) => {
      const e = (t - start) / 1000
      if (e < 0) {
        el._raf = requestAnimationFrame(frame)
        return
      }
      const swap = t - lastSwap > 50
      if (swap) lastSwap = t
      let done = true
      chars.forEach((s, i) => {
        s.style.opacity = ''
        if (e < lockAt[i]) {
          done = false
          if (swap) {
            s.textContent = noise()
            s.classList.add('is-noise')
          }
        } else if (s.classList.contains('is-noise')) {
          s.textContent = s._final
          s.classList.remove('is-noise')
        }
      })
      if (done) {
        chars.forEach((s) => (s.style.width = ''))
        el._decoding = false
        el._concealed = false
        resolve()
      } else {
        el._raf = requestAnimationFrame(frame)
      }
    }
    el._raf = requestAnimationFrame(frame)
  })
}

/** A short RGB-split tear, with a few letters briefly corrupted. */
export function burst(el, ms = 360) {
  if (!el || el._bursting || el._concealed || el._decoding) return
  el._bursting = true
  el.classList.add('is-glitching')
  const chars = build(el).filter((s) => !s.classList.contains('is-noise'))
  const count = Math.min(chars.length, Math.max(2, Math.round(chars.length * 0.25)))
  const victims = chars.sort(() => Math.random() - 0.5).slice(0, count)
  const locked = victims.map((s) => s.getBoundingClientRect().width)
  victims.forEach((s, i) => {
    s.style.width = `${locked[i]}px`
    s.textContent = noise()
    s.classList.add('is-noise')
  })
  setTimeout(() => {
    victims.forEach((s) => {
      s.textContent = s._final
      s.classList.remove('is-noise')
      s.style.width = ''
    })
  }, ms * 0.55)
  setTimeout(() => {
    el.classList.remove('is-glitching')
    el._bursting = false
  }, ms)
}

/** The classic glitch rhythm: tear — beat — tear harder. */
export function stutter(el) {
  if (!el || el._stuttering) return
  el._stuttering = true
  burst(el, 140)
  setTimeout(() => burst(el, 90), 230)
  setTimeout(() => burst(el, 380), 420)
  setTimeout(() => (el._stuttering = false), 900)
}

/** On screen and not faded out. (Rect-based: IntersectionObserver misreads pinned scenes.) */
export function isShown(el) {
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.bottom < 0 || r.top > window.innerHeight) return false
  return el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true
}

/** Burst when the pointer enters `trigger` (a tap on touch screens). */
export function onHover(trigger, el) {
  trigger.addEventListener('pointerenter', () => stutter(el))
  trigger.addEventListener('pointerdown', (e) => e.pointerType !== 'mouse' && stutter(el))
}

/** Unprompted glitches every few seconds while the element is on screen. */
export function idle(el, { min = 3, max = 6 } = {}) {
  if (el._idle) return // one idle loop per element
  el._idle = true
  const tick = () => {
    if (!document.hidden && isShown(el)) Math.random() < 0.6 ? stutter(el) : burst(el, 300 + Math.random() * 260)
    setTimeout(tick, (min + Math.random() * (max - min)) * 1000)
  }
  setTimeout(tick, (1.2 + Math.random() * 1.6) * 1000)
}

/** Scrolling fast tears every glitch headline on screen — the page reacts to the reader. */
export function onFastScroll(getVelocity, { threshold = 1400, cooldown = 650 } = {}) {
  let last = 0
  return () => {
    const now = performance.now()
    if (now - last < cooldown || Math.abs(getVelocity()) < threshold) return
    last = now
    document.querySelectorAll('.glitch').forEach((el) => isShown(el) && burst(el, 260 + Math.random() * 160))
  }
}
