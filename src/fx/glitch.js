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
  build(el).forEach((s) => (s.style.opacity = '0'))
}

export function reveal(el) {
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
  const widths = chars.map((s) => s.getBoundingClientRect().width)
  chars.forEach((s, i) => {
    s.style.width = `${widths[i]}px`
    s.style.opacity = '0'
  })
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
        resolve()
      } else {
        el._raf = requestAnimationFrame(frame)
      }
    }
    el._raf = requestAnimationFrame(frame)
  })
}

/** A short RGB-split tear, with a couple of letters briefly corrupted. */
export function burst(el, ms = 360) {
  if (el._bursting) return
  el._bursting = true
  el.classList.add('is-glitching')
  const chars = build(el).filter((s) => !s.classList.contains('is-noise'))
  const victims = chars.sort(() => Math.random() - 0.5).slice(0, Math.min(2, chars.length))
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
  }, ms * 0.45)
  setTimeout(() => {
    el.classList.remove('is-glitching')
    el._bursting = false
  }, ms)
}

/** Burst when the pointer enters `trigger`. */
export function onHover(trigger, el, ms = 320) {
  trigger.addEventListener('pointerenter', () => burst(el, ms))
}

/** Occasional unprompted bursts while the element is on screen. */
export function idle(el, { min = 5, max = 10 } = {}) {
  let visible = false
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(el)
  const tick = () => {
    if (visible && !document.hidden) burst(el, 260 + Math.random() * 220)
    setTimeout(tick, (min + Math.random() * (max - min)) * 1000)
  }
  setTimeout(tick, (min + Math.random() * (max - min)) * 1000)
}
