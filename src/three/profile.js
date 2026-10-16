// The Inverted Spear of Heaven's silhouette, shared by the geometry, the embers and the
// reiatsu aura so they all hug the same outline. Units are weapon-local: x runs from the
// guard (0) to the tip (BLADE.length); y runs across the blade, the hooked prong on +y.

export const BLADE = {
  length: 2.0, // guard → tip
  start: 0.04, // the blade leaves the guard here
}

export const HANDLE = {
  guard: 0.05, // half the guard's thickness
  end: -1.34, // end of the wrapped grip, where the pommel cap begins
  pommel: -1.68, // far side of the pommel ring — the chain hangs from here
}

// The slot between the main blade and the prong closes in a half circle.
const SLOT = { x: 0.7, y0: 0.02, y1: 0.075 }
const slotEnd = Array.from({ length: 7 }, (_, i) => {
  const r = (SLOT.y1 - SLOT.y0) / 2
  const a = -Math.PI / 2 - (i / 6) * Math.PI // from the slot's lower side round to its upper side
  return [SLOT.x + Math.cos(a) * r, SLOT.y0 + r + Math.sin(a) * r]
})

/**
 * The blade's outline, counter-clockwise. A broad base plate splits into the long main
 * blade (−y), cut off in a chisel point, and the short prong (+y), whose point sits on its
 * outer edge; a narrow slot runs between them. The small steps and nicks along the outer
 * edges are the ones in the manga drawing.
 */
export const OUTLINE = [
  [BLADE.start, -0.27],
  [0.16, -0.27],
  [0.19, -0.31],
  [0.56, -0.31],
  [0.59, -0.285],
  [0.63, -0.31],
  [1.1, -0.296],
  [1.13, -0.27],
  [1.17, -0.293],
  [1.8, -0.26],
  [BLADE.length, SLOT.y0], // the point
  ...slotEnd,
  [1.04, SLOT.y1],
  [1.18, 0.315], // the prong's point
  [0.4, 0.255],
  [0.36, 0.27],
  [0.2, 0.27],
  [0.17, 0.24],
  [BLADE.start, 0.24],
]

export const BOUNDS = OUTLINE.reduce(
  (b, [x, y]) => ({ x0: Math.min(b.x0, x), x1: Math.max(b.x1, x), y0: Math.min(b.y0, y), y1: Math.max(b.y1, y) }),
  { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity },
)

/** Signed distance from (x, y) to the outline: negative inside the blade. */
export function outlineDistance(x, y) {
  let d = Infinity
  let inside = false
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [ax, ay] = OUTLINE[j]
    const [bx, by] = OUTLINE[i]
    const ex = bx - ax
    const ey = by - ay
    const t = Math.min(1, Math.max(0, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)))
    d = Math.min(d, Math.hypot(x - ax - ex * t, y - ay - ey * t))
    if (ay > y !== by > y && x < ax + ((y - ay) / (by - ay)) * ex) inside = !inside
  }
  return inside ? -d : d
}

/** A point on the blade in weapon-local space: u along (0 guard → 1 tip), s across (0 → 1). */
export function bladePoint(u, s, out) {
  const x = BLADE.start + Math.min(1, Math.max(0, u)) * (BLADE.length - BLADE.start)
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [ax, ay] = OUTLINE[j]
    const [bx, by] = OUTLINE[i]
    if (ax <= x !== bx <= x) {
      const y = ay + ((x - ax) / (bx - ax)) * (by - ay)
      lo = Math.min(lo, y)
      hi = Math.max(hi, y)
    }
  }
  if (lo > hi) lo = hi = SLOT.y0 // at the very point
  return out.set(x, lo + (hi - lo) * s, 0)
}
