import { fitCanvas, rand, TAU, onResize } from '../lib/utils.js'
import { visibleLoop } from '../lib/ticker.js'

/**
 * Blue mana rising through the gate (Solo Leveling). setLevel(0…1) thickens the stream as
 * the reader levels up; surge() floods it upward for a moment.
 */
export function createMana(canvas, { count = 110 } = {}) {
  let ctx, w, h
  let motes = []
  let level = 0.2
  let shown = 0.2 // eases toward level
  let boost = 0 // decays after a surge
  let t = 0

  const spawn = (m, anywhere) => {
    m.x = rand(0, w)
    m.y = anywhere ? rand(0, h) : h + rand(0, 40)
    m.vy = rand(0.35, 1.1)
    m.vx = rand(-0.1, 0.1)
    m.size = rand(0.7, 2.1)
    m.glow = rand(0.5, 1)
    m.phase = rand(0, TAU)
    return m
  }

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas, 1.5))
    const n = Math.round(count * Math.min(1.3, Math.max(0.45, (w * h) / (1440 * 900))))
    motes = Array.from({ length: n }, () => spawn({}, true))
  }

  const tick = (dt) => {
    t += dt
    shown += (level - shown) * 0.04 * dt
    boost *= Math.pow(0.975, dt)
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const speed = 0.5 + shown * 0.9 + boost * 4
    const active = Math.round(motes.length * Math.min(1, 0.3 + shown * 0.7 + boost))
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i]
      m.y -= m.vy * speed * dt
      m.x += (m.vx + Math.sin(t * 0.02 + m.phase) * 0.12) * dt
      if (m.y < -12) spawn(m, false)
      if (i >= active) continue
      // Fade in from the floor and out toward the top; flicker like embers.
      const life = Math.min(1, (h - m.y) / (h * 0.15)) * Math.min(1, m.y / (h * 0.3))
      const a = life * m.glow * (0.45 + 0.55 * Math.abs(Math.sin(t * 0.05 + m.phase)))
      if (a < 0.02) continue
      const r = m.size * (1 + boost * 0.8)
      ctx.globalAlpha = a * 0.22
      ctx.fillStyle = '#3d8bff'
      ctx.beginPath()
      ctx.arc(m.x, m.y, r * 4, 0, TAU)
      ctx.fill()
      ctx.globalAlpha = a
      ctx.fillStyle = '#c9ecff'
      ctx.fillRect(m.x - r * 0.5, m.y - r * 1.6, r, r * 3.2)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  resize()
  onResize(resize)
  visibleLoop(canvas, tick)

  return {
    setLevel: (v) => (level = Math.max(0, Math.min(1, v))),
    surge: (k = 1) => (boost = Math.max(boost, k)),
  }
}
