import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { BLADE, HANDLE, profileAt, thicknessAt } from './profile.js'
import { patchDissolve } from './dissolve.js'

// ── Blade ─────────────────────────────────────────────────────────────────────
// Shinogi-zukuri cross-section, from the spine round to the edge and back:
//   0 mune ridge · 1 mune bevel · 2 shinogi ridge · 3 hamon line · 4 cutting edge
// Faces 3→4 and 4→5 (the ha, between the hamon line and the edge) get the steel material.
const SECTION = 8
const EDGE_FACES = new Set([3, 4])

function sectionAt(u) {
  const { edge, spine } = profileAt(u)
  const w = spine - edge
  const ts = thicknessAt(u)
  const tm = ts * 0.62
  const s = edge + w * 0.66
  const e = edge + (s - edge) * 0.3
  const m = w * 0.07
  return [
    [spine, 0],
    [spine - m, tm],
    [s, ts],
    [e, ts * 0.3],
    [edge, 0],
    [e, -ts * 0.3],
    [s, -ts],
    [spine - m, -tm],
  ]
}

function bladeGeometry() {
  const stations = []
  const uk = 1 - BLADE.kissaki
  for (let i = 0; i <= 120; i++) stations.push((i / 120) * uk)
  for (let i = 1; i <= 40; i++) stations.push(uk + (i / 40) * BLADE.kissaki)
  const xs = stations.map((u) => BLADE.start + u * (BLADE.length - BLADE.start))
  const sections = stations.map(sectionAt)

  const positions = []
  const indices = []
  const groups = [[], []] // body, edge index ranges
  for (let f = 0; f < SECTION; f++) {
    const a = f
    const b = (f + 1) % SECTION
    const first = positions.length / 3
    sections.forEach((sec, i) => {
      positions.push(xs[i], sec[a][0], sec[a][1], xs[i], sec[b][0], sec[b][1])
    })
    // Winding: make the first quad's normal point away from the section centre.
    const s0 = sections[0]
    const mid = [(s0[a][0] + s0[b][0]) / 2, (s0[a][1] + s0[b][1]) / 2]
    const cen = [(s0[0][0] + s0[4][0]) / 2, 0]
    const out = [mid[0] - cen[0], mid[1] - cen[1]]
    const along = [xs[1] - xs[0], 0, 0]
    const across = [0, s0[b][0] - s0[a][0], s0[b][1] - s0[a][1]]
    // n = along × across, only its (y, z) matter
    const n = [along[1] * across[2] - along[2] * across[1], along[2] * across[0] - along[0] * across[2], along[0] * across[1] - along[1] * across[0]]
    const flip = n[1] * out[0] + n[2] * out[1] < 0
    const start = indices.length
    for (let i = 0; i < sections.length - 1; i++) {
      const A = first + i * 2
      const B = A + 1
      const C = A + 2
      const D = A + 3
      // (A, C, B) faces along n = along × across; (A, B, C) faces the other way.
      if (flip) indices.push(A, B, C, B, D, C)
      else indices.push(A, C, B, B, C, D)
    }
    groups[EDGE_FACES.has(f) ? 1 : 0].push([start, indices.length - start])
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  groups.forEach((list, mat) => list.forEach(([s, c]) => g.addGroup(s, c, mat)))
  g.computeVertexNormals()
  return g
}

// ── Guard ─────────────────────────────────────────────────────────────────────
// Tensa Zangetsu's tsuba is a manji. The sword is always seen from the hilt side, which
// mirrors whatever is drawn here — so the outline is drawn mirrored, and the viewer sees
// the Buddhist 卍 (arms turning counter-clockwise), never its mirror image.
function manjiShape(a = 0.19, w = 0.058, b = 0.15) {
  const h = w / 2
  const pts = [
    [h, a], [-b, a], [-b, a - w], [-h, a - w], [-h, h], [-a, h], [-a, -b], [-a + w, -b], [-a + w, -h], [-h, -h],
    [-h, -a], [b, -a], [b, -a + w], [h, -a + w], [h, -h], [a, -h], [a, b], [a - w, b], [a - w, h], [h, h],
  ]
  return new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(-x, y)))
}

// A classic rounded-square tsuba with softly pinched sides (mokkō-like).
function plainShape(r = 0.15) {
  const s = new THREE.Shape()
  const n = 64
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2
    const k = r * (1 - 0.08 * Math.cos(4 * t)) // four gentle lobes
    const x = Math.cos(t) * k
    const y = Math.sin(t) * k * 1.12
    i ? s.lineTo(x, y) : s.moveTo(x, y)
  }
  return s
}

function guardGeometry(style) {
  const depth = 0.026
  const g = new THREE.ExtrudeGeometry(style === 'plain' ? plainShape() : manjiShape(), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 1,
  })
  g.translate(0, 0, -depth / 2)
  g.rotateY(Math.PI / 2) // face along the blade axis
  return g
}

// ── Grip wrap (tsuka-ito) ─────────────────────────────────────────────────────
function wrapTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.fillStyle = '#060607'
  g.fillRect(0, 0, S, S)
  // Two silk bands crossing on the diagonal, tiled so the pattern wraps seamlessly.
  const band = (x0, y0, x1, y1) => {
    for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
      g.save()
      g.translate(ox, oy)
      g.lineCap = 'butt'
      g.strokeStyle = '#141417'
      g.lineWidth = S * 0.3
      g.beginPath()
      g.moveTo(x0, y0)
      g.lineTo(x1, y1)
      g.stroke()
      g.strokeStyle = '#26262b'
      g.lineWidth = S * 0.12
      g.stroke()
      // twisted-silk texture: fine strokes across the band
      g.strokeStyle = 'rgba(0,0,0,0.55)'
      g.lineWidth = 1.2
      const len = Math.hypot(x1 - x0, y1 - y0)
      const ux = (x1 - x0) / len
      const uy = (y1 - y0) / len
      for (let t = 0; t < len; t += 7) {
        const cx = x0 + ux * t
        const cy = y0 + uy * t
        g.beginPath()
        g.moveTo(cx - uy * S * 0.14 + ux * 3, cy + ux * S * 0.14 + uy * 3)
        g.lineTo(cx + uy * S * 0.14 - ux * 3, cy - ux * S * 0.14 - uy * 3)
        g.stroke()
      }
      g.restore()
    }
  }
  band(0, 0, S, S)
  band(S, 0, 0, S)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 6)
  tex.anisotropy = 8
  return tex
}

// ── Assembly ──────────────────────────────────────────────────────────────────
export function buildSword(uniforms, envMap, { guard: guardStyle = 'manji' } = {}) {
  const lacquer = (extra = {}) =>
    new THREE.MeshPhysicalMaterial({
      color: '#0d0e11',
      metalness: 0.8,
      roughness: 0.34,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMap,
      envMapIntensity: 1.5,
      ...extra,
    })

  const bodyMat = patchDissolve(lacquer(), uniforms, { glint: 0.5 })
  const edgeMat = patchDissolve(
    new THREE.MeshPhysicalMaterial({ color: '#9aa1ab', metalness: 1, roughness: 0.17, envMap, envMapIntensity: 1.8 }),
    uniforms,
    { glint: 1.4 },
  )
  // Black-lacquered fittings: soft highlights only, so the guard reads black, not silver.
  const fittingMat = patchDissolve(
    lacquer({ color: '#09090b', metalness: 0.55, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.25, envMapIntensity: 0.42 }),
    uniforms,
    { glint: 0.2 },
  )
  const wrap = wrapTexture()
  const gripMat = patchDissolve(
    new THREE.MeshStandardMaterial({ map: wrap, bumpMap: wrap, bumpScale: 2.2, roughness: 0.78, metalness: 0.15, envMap, envMapIntensity: 0.6 }),
    uniforms,
    { glint: 0 },
  )

  const sword = new THREE.Group()
  const mid = BLADE.base / 2

  const blade = new THREE.Mesh(bladeGeometry(), [bodyMat, edgeMat])
  sword.add(blade)

  // Habaki (blade collar)
  const habaki = new THREE.Mesh(new RoundedBoxGeometry(0.12, BLADE.base * 1.16, 0.05, 3, 0.012), fittingMat)
  habaki.position.set(0.075, mid, 0)
  sword.add(habaki)

  // Seppa washers either side of the guard
  for (const x of [0.021, -0.021]) {
    const seppa = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.01, 32), fittingMat)
    seppa.scale.set(0.085, 1, 0.06)
    seppa.rotation.z = Math.PI / 2
    seppa.position.set(x, mid, 0)
    sword.add(seppa)
  }

  // 卍 tsuba
  const guard = new THREE.Mesh(guardGeometry(guardStyle), fittingMat)
  guard.position.set(0, mid, 0)
  sword.add(guard)

  // Fuchi (collar), tsuka (grip), kashira (pommel cap)
  const fuchi = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), fittingMat)
  fuchi.scale.set(0.058, 0.05, 0.046)
  fuchi.rotation.z = Math.PI / 2
  fuchi.position.set(HANDLE.fuchi - 0.025, mid, 0)
  sword.add(fuchi)

  const gripLen = HANDLE.fuchi - 0.05 - HANDLE.end
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 40, 1), gripMat)
  grip.scale.set(0.054, gripLen, 0.042)
  grip.rotation.z = Math.PI / 2
  grip.position.set(HANDLE.end + gripLen / 2, mid, 0)
  sword.add(grip)

  const kashira = new THREE.Mesh(new RoundedBoxGeometry(HANDLE.end - HANDLE.pommel, 0.112, 0.088, 4, 0.03), fittingMat)
  kashira.position.set((HANDLE.end + HANDLE.pommel) / 2, mid, 0)
  sword.add(kashira)

  // Chain links (simulated in world space by the scene, see sword.js)
  const linkGeo = new THREE.TorusGeometry(0.026, 0.0075, 10, 24)
  linkGeo.scale(1.5, 1, 1)
  const brokenGeo = new THREE.TorusGeometry(0.026, 0.0075, 10, 24, Math.PI * 1.55)
  brokenGeo.scale(1.5, 1, 1)
  const links = Array.from({ length: 7 }, (_, i) => new THREE.Mesh(i === 6 ? brokenGeo : linkGeo, fittingMat))

  return { sword, links, pommel: new THREE.Vector3(HANDLE.pommel - 0.01, mid, 0) }
}
