import { fitCanvas, rand, pick, TAU, onResize } from '../lib/utils.js'
import { visibleLoop } from '../lib/ticker.js'

/**
 * Night sky twinkles (4-point stars) + drifting fireflies over the valley.
 */
export function createSparkles(canvas, { stars = 70, flies = 40 } = {}) {
  let ctx, w, h
  let starList = []
  let flyList = []
  let t = 0

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas, 1.5))
    const scale = Math.min(1.4, (w * h) / (1440 * 900))
    starList = Array.from({ length: Math.round(stars * scale) }, () => ({
      x: rand(0, w),
      y: rand(h * 0.08, h * 0.95),
      size: rand(2, 7),
      phase: rand(0, TAU),
      speed: rand(0.02, 0.06),
      color: pick(['#ffffff', '#fff3c4', '#e6dbff']),
    }))
    flyList = Array.from({ length: Math.round(flies * scale) }, () => ({
      x: rand(0, w),
      y: rand(h * 0.45, h),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.35, -0.05),
      phase: rand(0, TAU),
      size: rand(1.2, 2.8),
    }))
  }

  const tick = (dt) => {
    t += dt
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    for (const s of starList) {
      const a = Math.max(0, Math.sin(s.phase + t * s.speed))
      if (a < 0.05) continue
      const r = s.size * (0.6 + a * 0.6)
      ctx.globalAlpha = a
      ctx.strokeStyle = s.color
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(s.x - r, s.y)
      ctx.lineTo(s.x + r, s.y)
      ctx.moveTo(s.x, s.y - r)
      ctx.lineTo(s.x, s.y + r)
      ctx.stroke()
      ctx.fillStyle = s.color
      ctx.beginPath()
      ctx.arc(s.x, s.y, 1.1, 0, TAU)
      ctx.fill()
    }
    for (const f of flyList) {
      f.x += (f.vx + Math.sin(t * 0.02 + f.phase) * 0.3) * dt
      f.y += f.vy * dt
      if (f.y < h * 0.3) {
        f.y = h + 10
        f.x = rand(0, w)
      }
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.03 + f.phase))
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 6)
      g.addColorStop(0, `rgba(230, 255, 170, ${a})`)
      g.addColorStop(1, 'rgba(230, 255, 170, 0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.size * 6, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  resize()
  onResize(resize)
  visibleLoop(canvas, tick)
}
