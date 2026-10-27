import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { patchDissolve } from './dissolve.js'

// 釈魂刀 — the Split Soul Katana, Toji's other blade: a long single edge that broadens toward
// the point, where the edge sweeps up to meet the spine; dark steel with a bright polished
// edge; a collar of fine white hair where a guard would be; a grip wrapped in pale cloth
// and bound with a thin olive-gold cord, ending in a red knob. Units are weapon-local, as for the spear (profile.js): x runs
// from the base of the blade (0) to the point (KATANA.length), y across it, the spine on +y.
export const KATANA = {
  length: 2.9, // base of the blade → point
  grip: -1.05, // end of the cloth wrap; the red-wrapped knob follows
  pommel: -1.29, // end of the pommel cap
}

const L = KATANA.length
const SORI = 0.12 // the curve: the point rises toward the spine side
const SWEEP = 0.68 * L // where the edge leaves the belly and sweeps up to the point
const bow = (x) => SORI * (x / L) ** 2
const spineAt = (x) => 0.13 + bow(x)
const bellyAt = (x) => -(0.15 + 0.17 * (x / L) ** 1.4) + bow(x)

/** The edge, base → point: a belly broadening toward the point, then the sweep up to it. */
const EDGE = (() => {
  const pts = Array.from({ length: 25 }, (_, i) => new THREE.Vector2((i / 24) * SWEEP, bellyAt((i / 24) * SWEEP)))
  const from = pts.at(-1)
  const sweep = new THREE.QuadraticBezierCurve(from.clone(), new THREE.Vector2(0.88 * L, from.y - 0.005), new THREE.Vector2(L, spineAt(L)))
  return [...pts, ...sweep.getPoints(20).slice(1)]
})()

/** The edge's height at x (the outline above is monotonic in x). */
function edgeAt(x) {
  const i = Math.max(1, EDGE.findIndex((p) => p.x >= x))
  const a = EDGE[i - 1]
  const b = EDGE[Math.min(i, EDGE.length - 1)]
  return b.x === a.x ? b.y : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y)
}

// ── Blade ─────────────────────────────────────────────────────────────────────
// A flat slab of the outline, chamfered all round like the spear's: group 0 is the two
// flats, group 1 the chamfers. Counter-clockwise: along the edge to the point, then back
// down the spine.
const BLADE_T = 0.02 // half-thickness at the flats
const BEVEL = 0.028

function bladeGeometry() {
  const spine = Array.from({ length: 32 }, (_, i) => new THREE.Vector2(L * (1 - (i + 1) / 32), spineAt(L * (1 - (i + 1) / 32))))
  const depth = 0.006
  const g = new THREE.ExtrudeGeometry(new THREE.Shape([...EDGE, ...spine]), {
    depth,
    bevelEnabled: true,
    bevelThickness: BLADE_T - depth / 2,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
    bevelSegments: 1,
    curveSegments: 1,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

/** The flats: brushed dark steel, and a bright polished band along the edge whose soft,
 *  gently waving boundary narrows to nothing at the point. The canvas spans x = 0 … L and
 *  y = Y0 … Y0 + SPAN (ExtrudeGeometry gives the flats the outline's own coordinates as UVs). */
const Y0 = -0.22
const SPAN = 0.5

function bladeTexture() {
  const W = 2048
  const H = 384
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const px = (x) => (x / L) * W
  const py = (y) => H - ((y - Y0) / SPAN) * H // the canvas's top row is the spine side
  g.fillStyle = '#3a3e45'
  g.fillRect(0, 0, W, H)

  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let k = 0; k < 260; k++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '255, 255, 255' : '0, 0, 0'}, ${0.03 + rnd() * 0.05})`
    g.fillRect(rnd() * W - 200, rnd() * H, 200 + rnd() * 900, 1 + rnd() * 2)
  }

  const band = (k) => {
    g.beginPath()
    g.moveTo(0, H)
    for (let i = 0; i <= 300; i++) {
      const x = (i / 300) * L
      const e = edgeAt(x)
      const wave = 1 + 0.12 * Math.sin(x * 7) + 0.06 * Math.sin(x * 17 + 2)
      g.lineTo(px(x), py(e + k * wave * (spineAt(x) - e)))
    }
    g.lineTo(W, H)
    g.closePath()
  }
  g.filter = 'blur(4px)'
  g.fillStyle = '#c3cad2'
  band(0.32)
  g.fill()
  g.filter = 'blur(1.5px)'
  g.fillStyle = '#eef2f5'
  band(0.1)
  g.fill()
  g.filter = 'none'

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.repeat.set(1 / L, 1 / SPAN)
  tex.offset.set(0, -Y0 / SPAN)
  return tex
}

/** Cloth wound round the grip strip over strip, each strip shading into the crease where the
 *  next overlaps it, with a faint weave; `cord` binds a thin cord along each seam. Tiles
 *  seamlessly: the strips repeat every half tile across and along. */
function clothTexture({ base, shade, cord = null }) {
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')
  g.fillStyle = base
  g.fillRect(0, 0, S, S)
  g.globalAlpha = 0.1
  g.fillStyle = shade
  for (let i = 0; i < S; i += 4) {
    g.fillRect(0, i, S, 1)
    g.fillRect(i, 0, 1, S)
  }
  g.globalAlpha = 1
  const period = S / (2 * Math.SQRT2)
  g.translate(S / 2, S / 2)
  g.rotate(-Math.PI / 4)
  for (let y = -S; y < S; y += period) {
    const strip = g.createLinearGradient(0, y, 0, y + period)
    strip.addColorStop(0, 'rgba(255, 255, 255, 0.22)')
    strip.addColorStop(0.7, 'rgba(255, 255, 255, 0)')
    strip.addColorStop(1, shade)
    g.fillStyle = strip
    g.fillRect(-S, y, 2 * S, period)
    if (cord) {
      g.fillStyle = cord
      g.fillRect(-S, y + period - 12, 2 * S, 10)
      g.fillStyle = 'rgba(40, 30, 10, 0.6)'
      g.fillRect(-S, y + period - 3, 2 * S, 2)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

// ── Fur ───────────────────────────────────────────────────────────────────────
// A collar of fine white hair round the base of the blade, swept back toward the grip as in
// the anime: a slim core under a pelt of thin strands, each curving out of the core and
// back, tapering to a point. One mesh.
const FUR = new THREE.Vector3(0.13, 0.16, 0.14) // the core's radii: along the blade, across, through

/** Appends a thin three-sided strand along a quadratic curve, tapering to a point. */
function addStrand(curve, radius, pos, nrm) {
  const N = 5
  const t = curve.getTangent(0)
  const a = new THREE.Vector3().crossVectors(t, Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize()
  const b = new THREE.Vector3()
  const rings = []
  for (let i = 0; i <= N; i++) {
    const p = curve.getPoint(i / N)
    curve.getTangent(i / N, t)
    a.addScaledVector(t, -a.dot(t)).normalize() // keep the frame from twisting along the strand
    b.crossVectors(t, a)
    const r = radius * (1 - (i / N) * 0.92)
    rings.push([0, 1, 2].map((k) => {
      const n = a.clone().multiplyScalar(Math.cos((k * 2 * Math.PI) / 3)).addScaledVector(b, Math.sin((k * 2 * Math.PI) / 3))
      return { p: p.clone().addScaledVector(n, r), n }
    }))
  }
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) {
      const a0 = rings[i][k]
      const a1 = rings[i][(k + 1) % 3]
      const b0 = rings[i + 1][k]
      const b1 = rings[i + 1][(k + 1) % 3]
      for (const v of [a0, a1, b0, a1, b1, b0]) {
        pos.push(v.p.x, v.p.y, v.p.z)
        nrm.push(v.n.x, v.n.y, v.n.z)
      }
    }
  }
}

function furGeometry() {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const back = new THREE.Vector3(-1, 0, 0) // toward the grip
  const pos = []
  const nrm = []
  for (let k = 0; k < 1400; k++) {
    const u = rnd() * 1.7 - 0.7 // along the blade: fewer roots on the grip's side
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    const n = new THREE.Vector3(u, r * Math.cos(a), r * Math.sin(a))
    const len = 0.12 + rnd() * 0.18
    const root = n.clone().multiply(FUR).multiplyScalar(0.9)
    const bend = root.clone().addScaledVector(n, len * 0.5)
    const tip = root
      .clone()
      .addScaledVector(n, len * (0.35 + rnd() * 0.25))
      .addScaledVector(back, len * (0.5 + rnd() * 0.5))
      .add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(len * 0.25))
    addStrand(new THREE.QuadraticBezierCurve3(root, bend, tip), 0.005 + rnd() * 0.006, pos, nrm)
  }
  const strands = new THREE.BufferGeometry()
  strands.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  strands.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  // The core: lumpy, and buried. Each face has its own copies of its corners, so the lump is
  // hashed from the position and the copies move together.
  const core = new THREE.IcosahedronGeometry(1, 3)
  const at = new THREE.Vector3()
  const cp = core.attributes.position
  for (let i = 0; i < cp.count; i++) {
    at.fromBufferAttribute(cp, i)
    const h = Math.sin(at.x * 127.1 + at.y * 311.7 + at.z * 74.7) * 43758.5453
    at.multiplyScalar(0.88 + 0.22 * (h - Math.floor(h))).multiply(FUR)
    cp.setXYZ(i, at.x, at.y, at.z)
  }
  core.deleteAttribute('uv')
  core.computeVertexNormals()
  return mergeGeometries([strands, core.index ? core.toNonIndexed() : core])
}

// ── Assembly ──────────────────────────────────────────────────────────────────
/** The katana, laid along +x from the base of its blade, the grip to −x. It takes its own
 *  dissolve uniforms (createSwordUniforms), so it burns into being pommel → point. */
export function buildKatana(uniforms, envMap) {
  const steel = ({ glint, ...params }) =>
    patchDissolve(new THREE.MeshPhysicalMaterial({ metalness: 1, envMap, ...params }), uniforms, { glint })
  const flatMat = steel({ map: bladeTexture(), metalness: 0.7, roughness: 0.34, envMapIntensity: 1, glint: 0.8 })
  const edgeMat = steel({ color: '#e2e7ec', roughness: 0.12, envMapIntensity: 1.8, glint: 1.4 })
  const capMat = steel({ color: '#8e2318', metalness: 0.35, roughness: 0.45, envMapIntensity: 0.7, glint: 0.2 })
  const wrap = clothTexture({ base: '#ddd6c6', shade: 'rgba(70, 58, 38, 0.5)', cord: '#8b7a3a' })
  wrap.repeat.set(2, 5)
  const redWrap = clothTexture({ base: '#8e2318', shade: 'rgba(40, 6, 4, 0.6)' })
  redWrap.repeat.set(2, 1)
  const gripMat = patchDissolve(
    new THREE.MeshStandardMaterial({ map: wrap, bumpMap: wrap, bumpScale: 1.5, roughness: 0.85, metalness: 0, envMap, envMapIntensity: 0.4 }),
    uniforms,
    { glint: 0 },
  )
  const redMat = patchDissolve(
    new THREE.MeshStandardMaterial({ map: redWrap, bumpMap: redWrap, bumpScale: 1.2, roughness: 0.85, metalness: 0, envMap, envMapIntensity: 0.4 }),
    uniforms,
    { glint: 0 },
  )
  const furMat = patchDissolve(
    new THREE.MeshStandardMaterial({ color: '#f6f2ea', emissive: '#8a867b', roughness: 1, metalness: 0 }),
    uniforms,
    { glint: 0 },
  )

  const katana = new THREE.Group()
  katana.add(new THREE.Mesh(bladeGeometry(), [flatMat, edgeMat]))

  // Laid along the grip (to −x) from `from`: a unit solid round the y axis, as in swordModel.js.
  const along = (geo, from, to, ry, rz, mat) => {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.scale.set(ry, from - to, rz)
    mesh.rotation.z = Math.PI / 2
    mesh.position.set(from, 0, 0)
    katana.add(mesh)
  }
  const tube = (top = 1, segs = 40) => new THREE.CylinderGeometry(top, 1, 1, segs).translate(0, 0.5, 0)
  along(tube(0.88, 48), -0.1, KATANA.grip, 0.095, 0.078, gripMat) // from inside the fur, tapering a little
  // The knob, as on the replica: the end of the grip wrapped in red cloth, then a small red
  // bulb with four little points.
  const knob = KATANA.grip - 0.11
  along(tube(1.08), KATANA.grip, knob, 0.084, 0.069, redMat)
  const bulb = [[0.95, 0], [1.15, 0.25], [1.2, 0.5], [1.05, 0.75], [0.7, 0.92], [0, 1]].map(([r, h]) => new THREE.Vector2(r, h))
  along(new THREE.LatheGeometry(bulb, 32), knob, knob - 0.09, 0.08, 0.068, capMat)
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) * (Math.PI / 2)
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.06, 8), capMat)
    point.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.7, 0.7 * Math.cos(a), 0.7 * Math.sin(a)).normalize())
    point.position.set(knob - 0.075, 0.06 * Math.cos(a), 0.05 * Math.sin(a))
    katana.add(point)
  }

  const fur = new THREE.Mesh(furGeometry(), furMat)
  fur.position.x = -0.04
  katana.add(fur)

  return { katana }
}
