import { fitCanvas, lerp, rand, TAU, onResize } from '../lib/utils.js'
import { visibleLoop } from '../lib/ticker.js'

/**
 * Manga 集中線 (focus lines): ink wedges converging on a point, redrawn ~12x a second
 * so they shimmer like hand-inked lines. `intensity` (0..1) pulls them toward the centre.
 */
export function createFocusLines(canvas, { centerY = 0.42, count = 170, color = '#111113' } = {}) {
  let ctx, w, h
  let since = 0
  const state = { intensity: 0.4 }

  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    if (state.intensity <= 0.01) return
    const cx = w / 2
    const cy = h * centerY
    const R = Math.hypot(w, h)
    const inner = lerp(0.95, 0.38, state.intensity)
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU)
      const k = inner * rand(0.82, 1.3)
      const ix = cx + Math.cos(a) * (w / 2) * k
      const iy = cy + Math.sin(a) * (h / 2) * k
      const spread = rand(0.0015, 0.011)
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a - spread) * R, cy + Math.sin(a - spread) * R)
      ctx.lineTo(cx + Math.cos(a + spread) * R, cy + Math.sin(a + spread) * R)
      ctx.lineTo(ix, iy)
      ctx.closePath()
      ctx.fill()
    }
  }

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas, 1.5))
    draw()
  }

  resize()
  onResize(resize)
  visibleLoop(canvas, (dt) => {
    since += dt
    if (since < 5) return
    since = 0
    if (parseFloat(getComputedStyle(canvas).opacity) > 0.01) draw()
  })

  return state
}
