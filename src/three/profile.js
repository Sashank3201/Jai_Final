// The blade's silhouette, shared by the geometry (JS) and the reiatsu aura (GLSL) so
// the flames hug the exact same outline. Units are sword-local: x runs from the guard
// (0) to the tip (LENGTH); the cutting edge sits at y ≈ 0 and the spine above it.

export const BLADE = {
  length: 2.9,
  base: 0.112, // width at the guard
  tip: 0.084, // width where the kissaki (tip section) begins
  sori: 0.11, // curvature: how far the tip rises toward the spine side
  kissaki: 0.075, // fraction of the length taken by the tip section
  start: 0.07, // the blade emerges from the habaki here
}

export const HANDLE = {
  fuchi: -0.035,
  end: -0.98, // end of the wrapped grip
  pommel: -1.05, // end of the kashira cap — the chain hangs from here
}

const widthAt = (u) => BLADE.base + (BLADE.tip - BLADE.base) * Math.min(1, u / (1 - BLADE.kissaki))

/** Edge and spine heights at u ∈ [0, 1] along the blade. */
export function profileAt(u) {
  const yc = BLADE.sori * Math.pow(Math.min(1, Math.max(0, u)), 1.8)
  const uk = 1 - BLADE.kissaki
  if (u <= uk) return { edge: yc, spine: yc + widthAt(u) }
  // Kissaki: the edge sweeps up in a circular arc (fukura) to meet the spine.
  const v = Math.min(1, (u - uk) / BLADE.kissaki)
  const hk = widthAt(uk)
  const yt = hk * 0.82
  return { edge: yc + yt * (1 - Math.sqrt(Math.max(0, 1 - v * v))), spine: yc + hk - (hk - yt) * v * v }
}

/** Half-thickness at the shinogi ridge (the blade's thickest line). */
export function thicknessAt(u) {
  const uk = 1 - BLADE.kissaki
  const t = 0.017 + (0.011 - 0.017) * u
  if (u <= uk) return t
  const v = Math.min(1, (u - uk) / BLADE.kissaki)
  return t * Math.pow(1 - v, 0.7)
}

/** A point on the blade surface in sword-local space: u along, s across (0 edge → 1 spine). */
export function bladePoint(u, s, out) {
  const { edge, spine } = profileAt(u)
  out.set(BLADE.start + u * (BLADE.length - BLADE.start), edge + (spine - edge) * s, 0)
  return out
}

// The same profile in GLSL (keep in sync with profileAt above).
export const PROFILE_GLSL = /* glsl */ `
uniform float uLen; uniform float uStart; uniform float uBaseW; uniform float uTipW; uniform float uSori; uniform float uKis;
float bladeWidth(float u) { return uBaseW + (uTipW - uBaseW) * min(1.0, u / (1.0 - uKis)); }
vec2 bladeProfile(float u) {
  float yc = uSori * pow(clamp(u, 0.0, 1.0), 1.8);
  float uk = 1.0 - uKis;
  if (u <= uk) return vec2(yc, yc + bladeWidth(u));
  float v = clamp((u - uk) / uKis, 0.0, 1.0);
  float hk = bladeWidth(uk);
  float yt = hk * 0.82;
  return vec2(yc + yt * (1.0 - sqrt(max(0.0, 1.0 - v * v))), yc + hk - (hk - yt) * v * v);
}
`

export const profileUniforms = () => ({
  uLen: { value: BLADE.length },
  uStart: { value: BLADE.start },
  uBaseW: { value: BLADE.base },
  uTipW: { value: BLADE.tip },
  uSori: { value: BLADE.sori },
  uKis: { value: BLADE.kissaki },
})
