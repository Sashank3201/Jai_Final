import * as THREE from 'three'
import { patchDissolve } from './dissolve.js'

// 釈魂刀 — the Split Soul Katana, Toji's other blade, as the anime draws it: a long, gently
// curved single edge whose point sweeps up to the spine; grey steel with a pale bevel along
// the edge; a long tassel of silver-white hair tied on where a guard would be; a grip bound in
// sage cloth like a bandage, thick at the blade and slimmer toward the end, which is finished
// with a gathered maroon collar and a fringe of pale strips. Units are weapon-local, as for
// the spear (profile.js): x runs from the base of the blade (0) to the point
// (KATANA.length), y across it, the spine on +y.
export const KATANA = {
  length: 2.9, // base of the blade → point
  grip: -1.12, // end of the cloth binding; the collar and the fringe follow
  pommel: -1.36, // end of the fringe
}

const L = KATANA.length
const SORI = 0.22 // the curve: the point rises toward the spine side
const SWEEP = 0.7 * L // where the edge leaves its line and sweeps up to the point
const bow = (x) => SORI * (x / L) ** 2
const spineAt = (x) => 0.115 + bow(x)
const bellyAt = (x) => -(0.13 + 0.045 * (x / L) ** 1.4) + bow(x)

/** The edge, base → point: a long, steady line, then a long sweep up to a sharp point on
 *  the spine. */
const EDGE = (() => {
  const pts = Array.from({ length: 25 }, (_, i) => new THREE.Vector2((i / 24) * SWEEP, bellyAt((i / 24) * SWEEP)))
  const from = pts.at(-1)
  const sweep = new THREE.QuadraticBezierCurve(from.clone(), new THREE.Vector2(0.86 * L, from.y + 0.08), new THREE.Vector2(L, spineAt(L)))
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

/** The flats, as drawn: grey steel, and a pale bevel from the edge to a straight line along
 *  the blade, inked where it meets the body and widening over the point, so the tip is pale
 *  all over; a bright line at the very edge. The canvas spans x = 0 … L and y = Y0 … Y0 + SPAN
 *  (ExtrudeGeometry gives the flats the outline's own coordinates as UVs). */
const Y0 = -0.2
const SPAN = 0.58

function bladeTexture() {
  const W = 2048
  const H = 384
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const px = (x) => (x / L) * W
  const py = (y) => H - ((y - Y0) / SPAN) * H // the canvas's top row is the spine side
  g.fillStyle = '#6a6c73'
  g.fillRect(0, 0, W, H)

  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let k = 0; k < 200; k++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '255, 255, 255' : '0, 0, 0'}, ${0.02 + rnd() * 0.03})`
    g.fillRect(rnd() * W - 200, rnd() * H, 200 + rnd() * 900, 1 + rnd() * 2)
  }

  /** The line `k` of the way from the edge to the spine; over the point it reaches the spine. */
  const line = (k) =>
    Array.from({ length: 301 }, (_, i) => {
      const x = (i / 300) * L
      const e = edgeAt(x)
      const over = THREE.MathUtils.smoothstep(x, 0.8 * L, 0.96 * L)
      return [px(x), py(e + (k + (1 - k) * over) * (spineAt(x) - e))]
    })
  const fillTo = (pts, color) => {
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, H)
    pts.forEach(([x, y]) => g.lineTo(x, y))
    g.lineTo(W, H)
    g.closePath()
    g.fill()
  }
  const bevel = line(0.42)
  g.filter = 'blur(1.5px)'
  fillTo(bevel, '#d3d4d8')
  g.filter = 'none'
  g.strokeStyle = 'rgba(38, 39, 44, 0.55)'
  g.lineWidth = 2.5
  g.beginPath()
  bevel.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.stroke()
  fillTo(line(0.07), '#f2f3f5')

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.repeat.set(1 / L, 1 / SPAN)
  tex.offset.set(0, -Y0 / SPAN)
  return tex
}

// ── Grip and fittings ─────────────────────────────────────────────────────────
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

/** The binding, as drawn: sage cloth wound on like a bandage. Each strip's edge is a thin dark
 *  line running round the grip, a little irregular and broken, with the odd crease branching
 *  off it. One tile is three turns and goes once round the grip; the edge is one continuous
 *  helix, so it meets itself across the seam. */
function gripTexture() {
  return tile(512, 192, (g, w, h) => {
    let seed = 5
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    g.fillStyle = '#868a6a'
    g.fillRect(0, 0, w, h)
    for (let k = 0; k < 120; k++) {
      g.fillStyle = `rgba(${rnd() < 0.5 ? '255, 255, 240' : '40, 44, 24'}, 0.05)`
      g.beginPath()
      g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 4 + rnd() * 12, 0, 0, Math.PI * 2)
      g.fill()
    }
    const turn = h / 3
    g.strokeStyle = '#34352a'
    g.lineCap = 'round'
    {
      const [p1, p2, p3] = [rnd(), rnd(), rnd()].map((p) => p * Math.PI * 2)
      // t runs along the helix: one unit a turn, three to the tile.
      const at = (t) => [
        (t % 1) * w,
        t * turn + 7 * Math.sin((2 * Math.PI * t) / 3 + p1) + 4 * Math.sin(2 * Math.PI * t + p2) + 2.5 * Math.sin(4 * Math.PI * t + p3),
      ]
      const strokes = []
      for (let t = 0; t < 3; ) {
        const len = 0.15 + rnd() * 0.35
        strokes.push([t, Math.min(3, t + len), 3.5 + rnd() * 1.5])
        t += len + (rnd() < 0.35 ? 0.02 + rnd() * 0.04 : 0)
      }
      const creases = Array.from({ length: 2 }, () => ({ t: rnd() * 3, dx: (rnd() - 0.5) * 50, dy: 10 + rnd() * 16 }))
      for (const shift of [-h, 0, h]) {
        for (const [t0, t1, width] of strokes) {
          g.lineWidth = width
          g.beginPath()
          let last = -1
          for (let t = t0; t <= t1 + 1e-6; t += 0.01) {
            const [x, y] = at(t)
            if (last < 0 || x < last) g.moveTo(x, y + shift) // a fresh stroke, or round the seam
            else g.lineTo(x, y + shift)
            last = x
          }
          g.stroke()
        }
        g.lineWidth = 3
        for (const { t, dx, dy } of creases) {
          const [x, y] = at(t)
          g.beginPath()
          g.moveTo(x, y + shift)
          g.quadraticCurveTo(x + dx * 0.3, y + shift + dy * 0.6, x + dx, y + shift + dy)
          g.stroke()
        }
      }
    }
  })
}

/** Maroon cloth gathered into folds that run along the grip. */
function collarTexture() {
  return tile(256, 64, (g, w, h) => {
    g.fillStyle = '#6c4447'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 10; i++) {
      const x = (i + 0.5) * (w / 10)
      g.fillStyle = 'rgba(30, 12, 14, 0.55)'
      g.fillRect(x - 3, 0, 6, h)
      g.fillStyle = 'rgba(255, 222, 222, 0.08)'
      g.fillRect(x + 4, 0, 8, h)
    }
  })
}

// ── Hair ──────────────────────────────────────────────────────────────────────
/** Appends a strand along a curve, tapering to a point, in one colour. `sides` round it; `flat`
 *  thins it along `outward` (projected square to the curve), so a lock lies flat like a ribbon
 *  on the outside of its bundle. */
function addStrand(curve, radius, color, out, { N = 5, sides = 3, flat = 1, outward = null } = {}) {
  const t = curve.getTangent(0)
  const a = outward ? outward.clone() : new THREE.Vector3().crossVectors(t, Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0))
  a.addScaledVector(t, -a.dot(t)).normalize()
  const b = new THREE.Vector3()
  const rings = []
  for (let i = 0; i <= N; i++) {
    const p = curve.getPoint(i / N)
    curve.getTangent(i / N, t)
    a.addScaledVector(t, -a.dot(t)).normalize() // keep the frame from twisting along the strand
    b.crossVectors(t, a)
    const r = radius * (1 - (i / N) * 0.92)
    rings.push(Array.from({ length: sides }, (_, k) => {
      const th = (k * 2 * Math.PI) / sides
      const n = a.clone().multiplyScalar(Math.cos(th) / flat).addScaledVector(b, Math.sin(th)).normalize()
      return { p: p.clone().addScaledVector(a, Math.cos(th) * r * flat).addScaledVector(b, Math.sin(th) * r), n }
    }))
  }
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < sides; k++) {
      const a0 = rings[i][k]
      const a1 = rings[i][(k + 1) % sides]
      const b0 = rings[i + 1][k]
      const b1 = rings[i + 1][(k + 1) % sides]
      for (const v of [a0, a1, b0, a1, b1, b0]) {
        out.pos.push(v.p.x, v.p.y, v.p.z)
        out.nrm.push(v.n.x, v.n.y, v.n.z)
        out.col.push(color.r, color.g, color.b)
      }
    }
  }
}

// The tassel of silver-white hair tied on where a guard would be: tied round the top of the
// grip, rising in a soft dome over it and falling in long, thick locks that end in uneven
// points. It is built hanging along −y (the edge side), its tie round the x axis; the scene
// turns it so it always hangs straight down, and lets it sway.
const TIE = { from: 0.02, to: -0.12, r: 0.112 } // the cord the hair is tied with, round the grip

function tasselGeometry() {
  let seed = 23
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const light = new THREE.Color('#e4e3de')
  const mid = new THREE.Color('#bdbcb6')
  const dark = new THREE.Color('#8f8e89')
  const middle = (TIE.from + TIE.to) / 2
  // As drawn, the hair gathers into clumps that each end in one point: seven down each face of
  // the bundle (front and back), spread across it, of uneven length.
  const clumps = [-1, 1].map((side) =>
    Array.from({ length: 7 }, (_, i) => ({
      x: middle + (i / 6 - 0.5) * 0.56 + (rnd() - 0.5) * 0.05,
      z: side * (0.05 + rnd() * 0.09),
      drop: 0.66 + rnd() * 0.34,
    })),
  )
  const out = { pos: [], nrm: [], col: [] }
  const lock = (radius, colour, ribbon, crown = false) => {
    const a = crown ? (rnd() - 0.5) * 2.2 : rnd() * Math.PI * 2 // round the grip; 0 is the top
    const x = TIE.to + rnd() * (TIE.from - TIE.to)
    const n = new THREE.Vector3(0, Math.cos(a), Math.sin(a))
    const side = Math.abs(Math.sin(a)) > 0.05 ? Math.sign(Math.sin(a)) : rnd() < 0.5 ? -1 : 1
    const c = clumps[side > 0 ? 1 : 0][Math.floor(rnd() * 7)]
    const root = new THREE.Vector3(x, 0, 0).addScaledVector(n, TIE.r * 0.95)
    // Up and out of the tie (over the top, a full dome), down either side of the grip, and in
    // to the point of its clump.
    const over = root.clone().addScaledVector(n, 0.14 + rnd() * 0.08).add(new THREE.Vector3(0, 0.14 * Math.max(0, n.y), 0))
    const drop = crown ? 0.22 + rnd() * 0.16 : c.drop
    const fall = new THREE.Vector3(x + (c.x - x) * 0.6 + (rnd() - 0.5) * 0.08, -drop * 0.42, side * (0.1 + Math.abs(n.z) * 0.12) + (rnd() - 0.5) * 0.05)
    const end = crown
      ? new THREE.Vector3(x + (c.x - x) * 0.5, -drop, side * (0.13 + rnd() * 0.05))
      : new THREE.Vector3(c.x + (rnd() - 0.5) * 0.04, -drop + (rnd() - 0.5) * 0.04, c.z + (rnd() - 0.5) * 0.03)
    // The bundle is wide across the grip's length and shallow through it: its locks lie on
    // its front and back faces, so they face out that way.
    const outward = new THREE.Vector3((end.x - middle) * 0.3, 0, side * Math.max(Math.abs(end.z), 0.05))
    addStrand(new THREE.CubicBezierCurve3(root, over, fall, end), radius, colour, out, ribbon ? { N: 8, sides: 4, flat: 0.3, outward } : { N: 8 })
  }
  for (let k = 0; k < 220; k++) {
    const shade = rnd()
    lock(0.06 + rnd() * 0.035, shade < 0.12 ? dark : light.clone().lerp(mid, shade ** 2), true)
  }
  // Short locks over the top, so the hair rises in a crown over the grip before it falls.
  for (let k = 0; k < 40; k++) lock(0.055 + rnd() * 0.03, light.clone().lerp(mid, rnd() ** 2), true, true)
  for (let k = 0; k < 12; k++) lock(0.007 + rnd() * 0.005, light, false) // a few loose hairs
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(out.nrm, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3))
  return geo
}

// ── Assembly ──────────────────────────────────────────────────────────────────
/** The katana, laid along +x from the base of its blade, the grip to −x, and its tassel (a
 *  child of the katana pivoting on the tie, for the scene to keep hanging straight down). It
 *  takes its own dissolve uniforms (createSwordUniforms), so it burns into being pommel → point. */
export function buildKatana(uniforms, envMap) {
  const steel = ({ glint, ...params }) =>
    patchDissolve(new THREE.MeshPhysicalMaterial({ metalness: 1, envMap, ...params }), uniforms, { glint })
  const cloth = (params) => patchDissolve(new THREE.MeshStandardMaterial({ metalness: 0, envMap, envMapIntensity: 0.3, ...params }), uniforms, { glint: 0 })
  const flatMat = steel({ map: bladeTexture(), metalness: 0.6, roughness: 0.36, envMapIntensity: 1, glint: 0.8 })
  const edgeMat = steel({ color: '#e2e7ec', roughness: 0.12, envMapIntensity: 1.8, glint: 1.4 })
  const grip = gripTexture()
  grip.repeat.set(1, 1.7) // about five turns down the grip
  const gripMat = cloth({ map: grip, roughness: 0.92 })
  const collar = collarTexture()
  const collarMat = cloth({ map: collar, bumpMap: collar, bumpScale: 1.5, roughness: 0.85 })
  const paleMat = cloth({ color: '#cfccc4', roughness: 0.9 })
  const tieMat = cloth({ color: '#3b3631', roughness: 0.8 })
  const hairMat = cloth({ vertexColors: true, roughness: 0.75, emissive: '#3a3a37', envMapIntensity: 0 })

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
  along(tube(0.78, 48), -0.1, KATANA.grip, 0.105, 0.088, gripMat) // thick at the blade, slimmer toward the end
  along(tube(), TIE.from, TIE.to, TIE.r, TIE.r * 0.88, tieMat)

  // The end: a collar of maroon cloth gathered round the grip, flaring into a soft rolled rim,
  // and out of it a fringe of short pale strips in two tiers, on a pale core.
  const rim = KATANA.grip - 0.08
  const cup = [[1, 0], [1.08, 0.35], [1.2, 0.7], [1.3, 0.9], [1.22, 1]].map(([r, h]) => new THREE.Vector2(r, h))
  along(new THREE.LatheGeometry(cup, 40), KATANA.grip, rim, 0.082, 0.069, collarMat)
  const roll = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 10, 40), collarMat)
  roll.scale.set(0.103, 0.088, 0.103) // the torus lies in its xy plane: turn it round the grip
  roll.rotation.y = Math.PI / 2
  roll.position.x = rim + 0.006
  katana.add(roll)
  along(tube(0.9, 24), rim + 0.02, KATANA.pommel + 0.03, 0.05, 0.045, paleMat)
  const strip = (len) => new THREE.BoxGeometry(len, 0.01, 0.03).translate(-len / 2, 0, 0) // hangs from its +x end
  const qa = new THREE.Quaternion()
  const qs = new THREE.Quaternion()
  const X = new THREE.Vector3(1, 0, 0)
  const Z = new THREE.Vector3(0, 0, 1)
  for (const [at, len, r, splay, turn] of [
    [rim + 0.01, 0.09, 0.064, 0.08, 0],
    [rim - 0.075, 0.065, 0.054, 0.22, 0.5],
  ]) {
    for (let k = 0; k < 12; k++) {
      const a = ((k + turn) / 12) * Math.PI * 2
      const piece = new THREE.Mesh(strip(len), paleMat)
      piece.quaternion.copy(qa.setFromAxisAngle(X, a)).multiply(qs.setFromAxisAngle(Z, -splay)) // round the axis, leaning out
      piece.position.set(at, r * Math.cos(a), r * Math.sin(a) * 0.86)
      katana.add(piece)
    }
  }

  const tassel = new THREE.Mesh(tasselGeometry(), hairMat)
  katana.add(tassel)

  return { katana, tassel }
}
