import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { patchDissolve } from './dissolve.js'

// 釈魂刀 — the Split Soul Katana, Toji's other blade: a long single edge that broadens toward
// the point, where the edge sweeps up to meet the spine; dark steel with a bright polished
// edge; a thick white fur collar where a guard would be; a pale grip bound in olive-gold
// cord, and a red pommel cap. Units are weapon-local, as for the spear (profile.js): x runs
// from the base of the blade (0) to the point (KATANA.length), y across it, the spine on +y.
export const KATANA = {
  length: 2.9, // base of the blade → point
  grip: -1.15, // end of the wrapped grip
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

/** A pale grip bound in olive-gold cord, the bands spiralling down it, each shadowed where it
 *  overlaps the next. Tiles seamlessly: the stripes repeat every half tile across and along. */
function wrapTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')
  g.fillStyle = '#d9d4c7'
  g.fillRect(0, 0, S, S)
  const period = S / (2 * Math.SQRT2)
  g.translate(S / 2, S / 2)
  g.rotate(-Math.PI / 4)
  for (let y = -S; y < S; y += period) {
    g.fillStyle = '#8b7a3a'
    g.fillRect(-S, y, 2 * S, period * 0.42)
    g.fillStyle = 'rgba(52, 40, 14, 0.55)'
    g.fillRect(-S, y + period * 0.42 - 4, 2 * S, 4)
    g.fillStyle = 'rgba(255, 246, 214, 0.35)'
    g.fillRect(-S, y + 2, 2 * S, 3)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 5)
  tex.anisotropy = 4
  return tex
}

// ── Fur ───────────────────────────────────────────────────────────────────────
// A thick collar of white fur round the base of the blade: a lumpy core buried under soft,
// rounded tufts that overlap into a cloud, and a fringe of fine strands hanging toward the
// blade. One mesh.
const FUR = new THREE.Vector3(0.22, 0.27, 0.22) // the core's radii: along the blade, across, through

function furGeometry() {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const up = new THREE.Vector3(0, 1, 0)
  const toBlade = new THREE.Vector3(1, 0, 0)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const n = new THREE.Vector3()
  const d = new THREE.Vector3()
  const at = new THREE.Vector3()
  const size = new THREE.Vector3()
  const jitter = () => new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)
  /** A random direction; `u` is its component along the blade. */
  const around = (u) => {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    return n.set(u, r * Math.cos(a), r * Math.sin(a))
  }
  const place = (geo, dir, root, r, len) => {
    q.setFromUnitVectors(up, dir)
    return geo.clone().applyMatrix4(m.compose(root, q, size.set(r, len, r)))
  }
  const tuft = new THREE.IcosahedronGeometry(1, 1).translate(0, 0.5, 0) // stands on its root
  const strand = new THREE.ConeGeometry(1, 1, 4, 1).translate(0, 0.5, 0)
  tuft.deleteAttribute('uv')
  strand.deleteAttribute('uv')
  const parts = []
  for (let k = 0; k < 480; k++) {
    around(rnd() * 2 - 1)
    d.copy(n).addScaledVector(toBlade, 0.2 + rnd() * 0.4).add(jitter().multiplyScalar(0.4)).normalize()
    at.copy(n).multiply(FUR).multiplyScalar(0.8)
    parts.push(place(tuft, d, at, 0.025 + rnd() * 0.02, 0.08 + rnd() * 0.07 + Math.max(0, n.x) * 0.05))
  }
  for (let k = 0; k < 420; k++) {
    around(0.1 + rnd() * 0.9)
    d.copy(n).addScaledVector(toBlade, 0.8 + rnd() * 0.8).add(jitter().multiplyScalar(0.5)).normalize()
    at.copy(n).multiply(FUR).multiplyScalar(0.95)
    parts.push(place(strand, d, at, 0.008 + rnd() * 0.008, 0.12 + rnd() * 0.14))
  }
  // The core: lumpy, and buried. Each face has its own copies of its corners, so the lump is
  // hashed from the position and the copies move together.
  const core = new THREE.IcosahedronGeometry(1, 3)
  const pos = core.attributes.position
  for (let i = 0; i < pos.count; i++) {
    at.fromBufferAttribute(pos, i)
    const h = Math.sin(at.x * 127.1 + at.y * 311.7 + at.z * 74.7) * 43758.5453
    at.multiplyScalar(0.88 + 0.22 * (h - Math.floor(h))).multiply(FUR)
    pos.setXYZ(i, at.x, at.y, at.z)
  }
  core.deleteAttribute('uv')
  core.computeVertexNormals()
  return mergeGeometries([...parts, core].map((g) => (g.index ? g.toNonIndexed() : g)))
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
  const wrap = wrapTexture()
  const gripMat = patchDissolve(
    new THREE.MeshStandardMaterial({ map: wrap, bumpMap: wrap, bumpScale: 1.5, roughness: 0.8, metalness: 0, envMap, envMapIntensity: 0.4 }),
    uniforms,
    { glint: 0 },
  )
  const furMat = patchDissolve(
    new THREE.MeshStandardMaterial({ color: '#fbf9f4', emissive: '#7a766c', roughness: 1, metalness: 0 }),
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
  along(tube(0.88, 48), -0.1, KATANA.grip, 0.095, 0.078, gripMat) // from inside the fur, tapering a little to the pommel
  along(tube(), KATANA.grip, KATANA.grip - 0.06, 0.086, 0.072, capMat)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat)
  dome.scale.set(0.086, KATANA.grip - 0.06 - KATANA.pommel, 0.072)
  dome.rotation.z = Math.PI / 2
  dome.position.x = KATANA.grip - 0.06
  katana.add(dome)

  const fur = new THREE.Mesh(furGeometry(), furMat)
  fur.position.x = -0.04
  katana.add(fur)

  return { katana }
}
