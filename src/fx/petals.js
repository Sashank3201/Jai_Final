import { fitCanvas, lerp, rand, pick, TAU, onResize } from '../lib/utils.js'
import { visibleLoop } from '../lib/ticker.js'

/**
 * Drifting petals / dandelion seeds with depth: near ones are bigger, faster and
 * shift more with the mouse, which sells the parallax over a flat painting.
 */
export function createPetals(canvas, { colors = ['#fffdf8', '#ffe4ec', '#fff3c4'], density = 1, wind = 1 } = {}) {
  let ctx, w, h
  let parts = []
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

  const spawn = (p, initial) => {
    p.z = rand(0.25, 1)
    p.size = lerp(1.6, 7.5, p.z * p.z)
    p.x = initial ? rand(0, w) : rand(-60, -10)
    p.y = initial ? rand(0, h) : rand(-h * 0.15, h * 0.85)
    p.vx = lerp(0.35, 1.6, p.z) * wind
    p.vy = lerp(0.12, 0.55, p.z)
    p.rot = rand(0, TAU)
    p.vr = rand(-0.03, 0.03)
    p.flip = rand(0, TAU)
    p.vf = rand(0.025, 0.07)
    p.sway = rand(0, TAU)
    p.color = pick(colors)
    p.alpha = lerp(0.45, 0.95, p.z)
    return p
  }

  const resize = () => {
    ;({ ctx, width: w, height: h } = fitCanvas(canvas))
    const count = Math.min(110, Math.round(((w * h) / 16000) * density))
    parts = Array.from({ length: count }, () => spawn({}, true))
  }

  const tick = (dt) => {
    mouse.x += (mouse.tx - mouse.x) * 0.05 * dt
    mouse.y += (mouse.ty - mouse.y) * 0.05 * dt
    ctx.clearRect(0, 0, w, h)
    for (const p of parts) {
      p.sway += 0.012 * dt
      p.x += (p.vx + Math.sin(p.sway) * 0.45) * dt
      p.y += (p.vy + Math.cos(p.sway * 0.7) * 0.2) * dt
      p.rot += p.vr * dt
      p.flip += p.vf * dt
      if (p.x > w + 40 || p.y > h + 40) spawn(p, false)
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x + mouse.x * p.z * 26, p.y + mouse.y * p.z * 16)
      ctx.rotate(p.rot)
      ctx.scale(1, Math.sin(p.flip))
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, TAU)
      ctx.fill()
      ctx.restore()
    }
  }

  resize()
  onResize(resize)
  visibleLoop(canvas, tick)

  return {
    /** -1..1 normalised pointer position */
    setPointer(nx, ny) {
      mouse.tx = nx
      mouse.ty = ny
    },
  }
}
