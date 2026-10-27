import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { patchDissolve } from './dissolve.js'

// 釈魂刀 — the Split Soul Katana, Toji's other blade: a long, broad, gently curved single
// edge with a clipped point, a white fur tuft where a guard would be, and a dark grip bound
// in gold cord. Units are weapon-local, as for the spear (profile.js): x runs from the base
// of the blade (0) to the point (KATANA.length), y across it, the edge on −y.
export const KATANA = {
  length: 2.9, // base of the blade → point
  grip: -1.05, // end of the wrapped grip
  pommel: -1.17, // end of the pommel cap
}

const L = KATANA.length
const SORI = 0.16 // the curve: how far the point rises toward the spine side
const CLIP = 0.42 // the spine stops this far short of the point; a straight cut runs down to it
const bow = (x) => SORI * (x / L) ** 2
const spineAt = (x) => 0.13 - 0.015 * (x / L) + bow(x)
const edgeAt = (x) => -(0.17 - 0.02 * (x / L)) + bow(x)
const Y0 = -0.2 // the flats' texture spans y = Y0 … Y0 + SPAN
const SPAN = 0.5

// ── Blade ─────────────────────────────────────────────────────────────────────
// A flat slab of the outline, chamfered all round like the spear's: group 0 is the two
// flats, group 1 the chamfers. The outline runs counter-clockwise: along the edge to the
// point, back up the clip, and down the spine.
const BLADE_T = 0.02 // half-thickness at the flats
const BEVEL = 0.03

function bladeGeometry() {
  const N = 32
  const pts = []
  for (let i = 0; i <= N; i++) pts.push(new THREE.Vector2((i / N) * L, edgeAt((i / N) * L)))
  for (let i = N; i >= 0; i--) pts.push(new THREE.Vector2((i / N) * (L - CLIP), spineAt((i / N) * (L - CLIP))))
  const depth = 0.006
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
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

/** The flats: dark steel with a bright, wavy-tempered edge (hamon) and the soul's flame
 *  swirls running down the middle. The canvas spans x = 0 … L and y = Y0 … Y0 + SPAN. */
function bladeTexture() {
  const W = 2048
  const H = 384
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const px = (x) => (x / L) * W
  const py = (y) => H - ((y - Y0) / SPAN) * H // the canvas's top row is the spine side
  g.fillStyle = '#2a2e34'
  g.fillRect(0, 0, W, H)

  // The hamon: bright steel from the edge up to a wavy temper line.
  g.beginPath()
  g.moveTo(0, H)
  for (let i = 0; i <= 400; i++) {
    const x = (i / 400) * L
    const k = 0.34 + 0.07 * Math.sin(x * 9.5) + 0.035 * Math.sin(x * 23 + 1.3)
    g.lineTo(px(x), py(edgeAt(x) + k * (spineAt(Math.min(x, L - CLIP)) - edgeAt(x))))
  }
  g.lineTo(W, H)
  g.closePath()
  const temper = g.createLinearGradient(0, 0, 0, H)
  temper.addColorStop(0, '#9aa3ad')
  temper.addColorStop(1, '#c9d0d8')
  g.fillStyle = temper
  g.fill()

  // The soul's swirls: flame-like strokes flowing toward the point.
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  g.lineCap = 'round'
  for (let k = 0; k < 70; k++) {
    const x0 = rnd() * (L - 0.5) + 0.12
    const len = 0.12 + rnd() * 0.35
    const t = 0.42 + rnd() * 0.4 // across the blade, from the edge (0) to the spine (1)
    const amp = 0.008 + rnd() * 0.02
    const freq = 18 + rnd() * 30
    g.strokeStyle = `rgba(214, 222, 232, ${0.25 + rnd() * 0.35})`
    g.lineWidth = 1.5 + rnd() * 3
    g.beginPath()
    for (let i = 0; i <= 40; i++) {
      const x = x0 + (i / 40) * len
      const across = edgeAt(x) + t * (spineAt(Math.min(x, L - CLIP)) - edgeAt(x))
      const y = across + amp * Math.sin(i * 0.15 * freq * len) * (1 - i / 40)
      i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))
    }
    g.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  // ExtrudeGeometry gives the flats the shape's own coordinates as UVs: map them onto the canvas.
  tex.repeat.set(1 / L, 1 / SPAN)
  tex.offset.set(0, -Y0 / SPAN)
  return tex
}

/** Black grip bound in gold cord, crossing in diamonds; repeats round and along the grip. */
function wrapTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const g = c.getContext('2d')
  g.fillStyle = '#0d0d0f'
  g.fillRect(0, 0, S, S)
  g.strokeStyle = '#b39a4c'
  g.lineWidth = S * 0.2
  g.lineCap = 'butt'
  for (const d of [-S, 0, S]) {
    g.beginPath()
    g.moveTo(d, 0)
    g.lineTo(d + S, S)
    g.stroke()
    g.beginPath()
    g.moveTo(d + S, 0)
    g.lineTo(d, S)
    g.stroke()
  }
  // The cord's twist, so it reads as cord rather than paint.
  g.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  g.lineWidth = 2
  for (let i = -S; i < 2 * S; i += 9) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i + S * 0.4, S)
    g.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 8)
  tex.anisotropy = 4
  return tex
}

// ── Fur ───────────────────────────────────────────────────────────────────────
// The tuft round the base of the blade: a soft core and a few hundred tapering strands,
// most swept back toward the grip, merged into one mesh.
function furGeometry() {
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const up = new THREE.Vector3(0, 1, 0)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const d = new THREE.Vector3()
  const at = new THREE.Vector3()
  const parts = []
  for (let k = 0; k < 220; k++) {
    const len = 0.14 + rnd() * 0.26
    const geo = new THREE.ConeGeometry(0.008 + rnd() * 0.012, len, 5, 1)
    geo.translate(0, len / 2, 0) // the base at the root, tapering outward
    const a = rnd() * Math.PI * 2
    const back = -0.65 + rnd() * 0.9 // along the axis: mostly back toward the grip
    d.set(back, Math.cos(a), Math.sin(a) * 0.8).normalize()
    q.setFromUnitVectors(up, d)
    at.set(-0.07 + rnd() * 0.14, Math.cos(a) * 0.075, Math.sin(a) * 0.06)
    m.compose(at, q, new THREE.Vector3(1, 1, 1))
    geo.applyMatrix4(m)
    parts.push(geo)
  }
  const core = new THREE.IcosahedronGeometry(1, 2)
  core.scale(0.13, 0.15, 0.13)
  // A lumpy surface, so the core reads as fur, not a ball. Each face has its own copies of
  // its corners, so the lump is hashed from the position: the copies move together.
  const pos = core.attributes.position
  for (let i = 0; i < pos.count; i++) {
    at.fromBufferAttribute(pos, i)
    const h = Math.sin(at.x * 127.1 + at.y * 311.7 + at.z * 74.7) * 43758.5453
    at.multiplyScalar(0.9 + 0.25 * (h - Math.floor(h)))
    pos.setXYZ(i, at.x, at.y, at.z)
  }
  core.deleteAttribute('uv')
  core.computeVertexNormals()
  parts.forEach((p) => p.deleteAttribute('uv'))
  return mergeGeometries([...parts.map((p) => p.toNonIndexed()), core.index ? core.toNonIndexed() : core])
}

// ── Assembly ──────────────────────────────────────────────────────────────────
/** The katana, laid along +x from the base of its blade, grip to −x. Shares the spear's
 *  dissolve uniforms, so it burns into being (pommel → point) the same way. */
export function buildKatana(uniforms, envMap) {
  const steel = ({ glint, ...params }) =>
    patchDissolve(new THREE.MeshPhysicalMaterial({ metalness: 1, envMap, ...params }), uniforms, { glint })
  const flatMat = steel({ map: bladeTexture(), roughness: 0.34, envMapIntensity: 1, glint: 0.8 })
  const edgeMat = steel({ color: '#dfe4ea', roughness: 0.12, envMapIntensity: 1.8, glint: 1.4 })
  const darkMat = steel({ color: '#2a2b2f', metalness: 0.8, roughness: 0.42, envMapIntensity: 0.8, glint: 0.3 })
  const brassMat = steel({ color: '#8c7740', metalness: 0.85, roughness: 0.38, envMapIntensity: 1, glint: 0.4 })
  const gripMat = patchDissolve(
    new THREE.MeshStandardMaterial({ map: wrapTexture(), roughness: 0.75, metalness: 0, envMap, envMapIntensity: 0.4 }),
    uniforms,
    { glint: 0 },
  )
  const furMat = patchDissolve(
    new THREE.MeshStandardMaterial({ color: '#f4f1ea', emissive: '#3b3934', roughness: 1, metalness: 0 }),
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
    return mesh
  }
  const tube = (segs = 40) => new THREE.CylinderGeometry(1, 1, 1, segs).translate(0, 0.5, 0)
  along(tube(), 0.1, -0.02, 0.105, 0.05, brassMat) // the habaki, a collar gripping the blade's base
  along(tube(), -0.02, -0.09, 0.088, 0.072, darkMat) // the fuchi
  along(tube(48), -0.09, KATANA.grip, 0.078, 0.064, gripMat)
  along(tube(), KATANA.grip, KATANA.grip - 0.05, 0.084, 0.07, darkMat) // the kashira
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), darkMat)
  cap.scale.set(0.084, KATANA.grip - 0.05 - KATANA.pommel, 0.07) // a domed end
  cap.rotation.z = Math.PI / 2
  cap.position.x = KATANA.grip - 0.05
  katana.add(cap)

  const fur = new THREE.Mesh(furGeometry(), furMat)
  fur.position.x = -0.02
  katana.add(fur)

  return { katana, pommel: new THREE.Vector3(KATANA.pommel, 0, 0), tip: new THREE.Vector3(L, 0, 0) }
}
