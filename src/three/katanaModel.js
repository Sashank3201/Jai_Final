import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { patchDissolve } from './dissolve.js'

// 釈魂刀 — the Split Soul Katana, Toji's other blade: a long single edge that broadens toward
// the point, where the edge sweeps up to meet the spine; dark steel with a bright polished
// edge; a dense tuft of cream and grey fur where a guard would be; a grip of olive cloth
// bound criss-cross with a dark thread, ending in a knot of dark red cloth round a pale tip.
// Units are weapon-local, as for the spear (profile.js): x runs from the base of the blade
// (0) to the point (KATANA.length), y across it, the spine on +y.
export const KATANA = {
  length: 2.9, // base of the blade → point
  grip: -1.25, // end of the olive wrap; the red knot follows
  pommel: -1.45, // end of the pale tip
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

/** A canvas tile and the texture made from it, repeating both ways. */
function tile(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

/** A flat colour with a faint weave over it: the grain of the cloth. */
function weave(g, w, h, base, thread) {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  g.fillStyle = thread
  for (let i = 0; i < w; i += 4) g.fillRect(i, 0, 1, h)
  for (let i = 0; i < h; i += 4) g.fillRect(0, i, w, 1)
}

/** The grip, as in the anime: olive cloth bound with a thin dark thread wound criss-cross. One
 *  tile is one turn round the grip, so the texture repeats once round and many times along it.
 *  The thread's two strands cross on the grip's top and bottom edges (u = ¼ and ¾), so seen
 *  from the front they zigzag down its length. */
function gripTexture() {
  return tile(512, 128, (g, w, h) => {
    weave(g, w, h, '#8a7442', 'rgba(60, 46, 18, 0.12)')
    g.strokeStyle = '#2b2012'
    g.lineWidth = 9
    for (let k = -1; k <= 1; k++) {
      g.beginPath()
      g.moveTo(0, k * h)
      g.lineTo(w, k * h + h)
      g.moveTo(0, k * h + h / 2)
      g.lineTo(w, k * h - h / 2)
      g.stroke()
    }
  })
}

/** Dark red cloth for the knot, with the fold of each wrap. */
function knotTexture() {
  return tile(128, 128, (g, w, h) => {
    weave(g, w, h, '#6b2420', 'rgba(20, 4, 2, 0.18)')
    g.strokeStyle = 'rgba(25, 6, 4, 0.6)'
    g.lineWidth = 6
    for (let k = -1; k <= 1; k++) {
      g.beginPath()
      g.moveTo(0, k * h)
      g.lineTo(w, k * h + h)
      g.stroke()
    }
  })
}

// ── Fur ───────────────────────────────────────────────────────────────────────
// The tuft round the base of the blade, as in the anime: a dense mane of cream and warm grey
// hair, rounded where the blade comes out of it and swept back over the top of the grip,
// ending in pointed locks. A body of fur, and locks laid over it from front to back, some
// standing off at the ends; one mesh, coloured per lock.
const MANE = [
  [0.15, 0],
  [0.13, 0.09],
  [0.09, 0.155],
  [0.03, 0.19],
  [-0.04, 0.2],
  [-0.12, 0.18],
  [-0.2, 0.15],
  [-0.27, 0.12],
  [-0.32, 0.1],
  [-0.33, 0],
] // the body's radius along the weapon, [x, r], from the blade side back
const GRIP_R = 0.1 // past the body, the locks lie on the grip

/** The radius of the fur's surface at x: the body, or the grip behind it. */
function maneAt(x) {
  if (x <= -0.32) return GRIP_R
  const i = MANE.findIndex(([mx]) => mx <= x)
  if (i <= 0) return 0
  const [x0, r0] = MANE[i - 1]
  const [x1, r1] = MANE[i]
  const r = r0 + ((x - x0) / (x1 - x0)) * (r1 - r0)
  return x < -0.22 ? Math.max(r, GRIP_R) : r
}

/** Appends a three-sided strand along a quadratic curve, tapering to a point, in one colour. */
function addStrand(curve, radius, color, pos, nrm, col) {
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
        col.push(color.r, color.g, color.b)
      }
    }
  }
}

function furGeometry() {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const cream = new THREE.Color('#ece0c2')
  const grey = new THREE.Color('#b29a7c')
  const around = (x, a, r) => new THREE.Vector3(x, r * Math.cos(a), r * Math.sin(a))
  const pos = []
  const nrm = []
  const col = []
  // Locks, rooted mostly toward the front, laid back over the body and past it onto the grip.
  for (let k = 0; k < 650; k++) {
    const x0 = 0.12 - rnd() ** 1.4 * 0.3
    const a = rnd() * Math.PI * 2
    const len = 0.16 + rnd() * 0.2
    const twist = (rnd() - 0.5) * 0.5
    const xm = x0 - len * 0.45
    const lift = rnd() < 0.2 ? 0.03 + rnd() * 0.06 : rnd() * 0.015
    const curve = new THREE.QuadraticBezierCurve3(
      around(x0, a, maneAt(x0) * 0.9),
      around(xm, a + twist / 2, maneAt(xm) * 1.1 + 0.012),
      around(x0 - len, a + twist, maneAt(x0 - len) * 1.08 + lift),
    )
    addStrand(curve, 0.035 + rnd() * 0.025, cream.clone().lerp(grey, rnd() ** 1.3), pos, nrm, col)
  }
  // Stray hairs off the back, for the ragged outline.
  for (let k = 0; k < 60; k++) {
    const x0 = -0.03 - rnd() * 0.22
    const a = rnd() * Math.PI * 2
    const len = 0.16 + rnd() * 0.14
    const curve = new THREE.QuadraticBezierCurve3(
      around(x0, a, maneAt(x0) * 0.95),
      around(x0 - len / 2, a, maneAt(x0 - len / 2) * 1.15 + 0.02),
      around(x0 - len, a + (rnd() - 0.5) * 0.4, maneAt(x0 - len) * 1.1 + 0.04 + rnd() * 0.08),
    )
    addStrand(curve, 0.006 + rnd() * 0.005, rnd() < 0.5 ? grey : cream, pos, nrm, col)
  }
  const locks = new THREE.BufferGeometry()
  locks.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  locks.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  locks.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))

  // The body: the profile turned round the weapon's axis (the lathe's y becomes x), a little
  // lumpy, and a shade darker than the locks over it.
  const body = new THREE.LatheGeometry([...MANE].reverse().map(([x, r]) => new THREE.Vector2(r, x)), 48)
  const bp = body.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < bp.count; i++) {
    v.fromBufferAttribute(bp, i)
    const h = Math.sin(v.x * 127.1 + v.y * 311.7 + v.z * 74.7) * 43758.5453
    const k = 0.94 + 0.12 * (h - Math.floor(h))
    bp.setXYZ(i, v.x * k, v.y, v.z * k)
  }
  body.rotateZ(-Math.PI / 2)
  body.deleteAttribute('uv')
  body.computeVertexNormals()
  const flat = body.toNonIndexed()
  const shade = new THREE.Color('#cdbb98')
  flat.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: flat.attributes.position.count }, () => [shade.r, shade.g, shade.b]).flat(), 3))
  return mergeGeometries([locks, flat])
}

// ── Assembly ──────────────────────────────────────────────────────────────────
/** The katana, laid along +x from the base of its blade, the grip to −x. It takes its own
 *  dissolve uniforms (createSwordUniforms), so it burns into being pommel → point. */
export function buildKatana(uniforms, envMap) {
  const steel = ({ glint, ...params }) =>
    patchDissolve(new THREE.MeshPhysicalMaterial({ metalness: 1, envMap, ...params }), uniforms, { glint })
  const cloth = (params) => patchDissolve(new THREE.MeshStandardMaterial({ metalness: 0, envMap, envMapIntensity: 0.3, ...params }), uniforms, { glint: 0 })
  const flatMat = steel({ map: bladeTexture(), metalness: 0.7, roughness: 0.34, envMapIntensity: 1, glint: 0.8 })
  const edgeMat = steel({ color: '#e2e7ec', roughness: 0.12, envMapIntensity: 1.8, glint: 1.4 })
  const grip = gripTexture()
  grip.repeat.set(1, 14)
  const knot = knotTexture()
  knot.repeat.set(2, 1)
  const gripMat = cloth({ map: grip, roughness: 0.9 })
  const knotMat = cloth({ map: knot, bumpMap: knot, bumpScale: 1.2, roughness: 0.85 })
  const tipMat = cloth({ color: '#d9c9a5', roughness: 0.6 })
  const furMat = cloth({ vertexColors: true, roughness: 0.95, emissive: '#3c362b', envMapIntensity: 0 })

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
  along(tube(1, 48), -0.1, KATANA.grip, 0.095, 0.078, gripMat) // from inside the fur

  // The knob: the end bound in dark red cloth and tied off in a knot, its loose ends flaring
  // round a small pale tip.
  const tie = KATANA.grip - 0.07
  along(tube(1.12), KATANA.grip, tie, 0.095, 0.078, knotMat)
  const bulb = [[1, 0], [1.22, 0.3], [1.26, 0.6], [1.08, 0.88], [0.75, 1]].map(([r, h]) => new THREE.Vector2(r, h))
  along(new THREE.LatheGeometry(bulb, 32), tie, tie - 0.07, 0.106, 0.087, knotMat)
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.4
    const dir = new THREE.Vector3(-0.55, Math.cos(a), Math.sin(a)).normalize()
    const end = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.05, 8), knotMat)
    end.scale.set(1, 1, 0.35) // a flap of cloth, not a spike
    end.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    end.position.set(tie - 0.06, 0.075 * Math.cos(a), 0.065 * Math.sin(a)).addScaledVector(dir, 0.03)
    katana.add(end)
  }
  const tip = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.03, 4, 12), tipMat)
  tip.rotation.z = Math.PI / 2
  tip.position.x = tie - 0.09
  katana.add(tip)

  katana.add(new THREE.Mesh(furGeometry(), furMat))

  return { katana }
}
