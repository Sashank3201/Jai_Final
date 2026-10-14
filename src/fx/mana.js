import { fitCanvas, rand, TAU, onResize } from '../lib/utils.js'
import { visibleLoop } from '../lib/ticker.js'

/** A soft blue glow, drawn once and stamped for every mote (far cheaper than arcs). */
function glowSprite() {
  const S = 32
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  r.addColorStop(0, 'rgba(201, 236, 255, 1)')
  r.addColorStop(0.18, 'rgba(159, 220, 255, 0.85)')
  r.addColorStop(0.45, 'rgba(61, 139, 255, 0.25)')
  r.addColorStop(1, 'rgba(61, 139, 255, 0)')
  g.fillStyle = r
  g.fillRect(0, 0, S, S)
  return c
}

/**
 * Blue mana rising (Solo Leveling). setLevel(0…1) thickens the stream as the reader levels
 * up; surge() floods it upward for a moment. Drawn at 1× resolution: soft glows don't
 * need more, and it keeps phones smooth.
 */
export function createMana(canvas, { count = 70 } = {}) {
  let ctx, w, h
  let motes = []
  let level = 0.2
  let shown = 0.2 // eases toward level
  let boost = 0 // decays after a surge
  let t = 0
  const sprite = glowSprite()

  const spawn = (m, anywhere) => {
    m.x = rand(0, w)
    m.y = anywhere ? rand(0, h) : h + rand(0, 40)
    m.vy = rand(0.35, 1.1)
    m.vx = rand(-0.1, 0.1)
    m.size = rand(5, 13)
    m.glow = rand(0.5, 1)
    m.phase = rand(0, TAU)
    return m
  }

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas, 1))
    const n = Math.round(count * Math.min(1.2, Math.max(0.5, (w * h) / (1440 * 900))))
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
      if (m.y < -16) spawn(m, false)
      if (i >= active) continue
      // Fade in from the floor and out toward the top; flicker like embers.
      const life = Math.min(1, (h - m.y) / (h * 0.15)) * Math.min(1, m.y / (h * 0.3))
      const a = life * m.glow * (0.45 + 0.55 * Math.abs(Math.sin(t * 0.05 + m.phase)))
      if (a < 0.02) continue
      const s = m.size * (1 + boost * 0.6)
      ctx.globalAlpha = a
      ctx.drawImage(sprite, m.x - s / 2, m.y - s / 2, s, s)
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
