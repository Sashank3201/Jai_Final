import { fitCanvas, rand, pick, TAU, onResize } from '../lib/utils.js'
import { visibleLoop } from '../lib/ticker.js'

/**
 * Spiritual pressure (霊圧): embers that rise from the pointer and from the floor,
 * flaring when a row is released. `ambient` scales the embers drifting up from the floor.
 */
export function createReiatsu(canvas, { colors = ['#ff4b2b', '#ff7a5c', '#ffd6cc', '#ffffff'], ambient = 0.6 } = {}) {
  let ctx, w, h
  const parts = []
  const pointer = { x: -999, y: -999, active: false }

  const emit = (x, y, n, power = 1) => {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: rand(-0.8, 0.8) * power,
        vy: rand(-3.2, -0.8) * power,
        life: 1,
        decay: rand(0.012, 0.03),
        size: rand(1, 3.4) * power,
        color: pick(colors),
      })
    }
  }

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas, 1.5))
  }

  const tick = (dt) => {
    ctx.clearRect(0, 0, w, h)
    if (Math.random() < ambient * dt) emit(rand(0, w), h + 6, 1, 0.8)
    if (pointer.active && Math.random() < 0.5) emit(pointer.x, pointer.y, 1, 0.8)
    ctx.globalCompositeOperation = 'lighter'
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.x += (p.vx + Math.sin(p.y * 0.02) * 0.4) * dt
      p.y += p.vy * dt
      p.vy *= 0.995
      p.life -= p.decay * dt
      if (p.life <= 0) {
        parts.splice(i, 1)
        continue
      }
      ctx.globalAlpha = p.life * 0.85
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    if (parts.length > 900) parts.splice(0, parts.length - 900)
  }

  resize()
  onResize(resize)
  visibleLoop(canvas, tick)

  return {
    setPointer(x, y, active = true) {
      pointer.x = x
      pointer.y = y
      pointer.active = active
    },
    burst(x, y, n = 70) {
      emit(x, y, n, 1.4)
    },
  }
}
