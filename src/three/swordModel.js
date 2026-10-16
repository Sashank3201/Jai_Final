import * as THREE from 'three'
import { BLADE, HANDLE, OUTLINE } from './profile.js'
import { patchDissolve } from './dissolve.js'

// ── Blade ─────────────────────────────────────────────────────────────────────
// A flat slab of the outline in profile.js, chamfered all round to its edges. The bevel is
// offset inward, so the edges sit exactly on the outline and the flats are inset from it.
// Group 0 is the two flats, group 1 the chamfers.
const BLADE_T = 0.024 // half-thickness at the flats
const BEVEL = 0.035

function bladeGeometry() {
  const shape = new THREE.Shape(OUTLINE.map(([x, y]) => new THREE.Vector2(x, y)))
  const depth = 0.008
  const g = new THREE.ExtrudeGeometry(shape, {
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

function roundedRect(w, h, r) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -h / 2)
  s.lineTo(w / 2 - r, -h / 2)
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  s.lineTo(w / 2, h / 2 - r)
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  s.lineTo(-w / 2 + r, h / 2)
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  s.lineTo(-w / 2, -h / 2 + r)
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  return s
}

// The engraving on the base plate: a framed slot with three ticks either side.
function engraving(frameMat, slotMat) {
  const face = new THREE.Group()
  const frameShape = roundedRect(0.25, 0.085, 0.03)
  frameShape.holes.push(roundedRect(0.19, 0.035, 0.0175))
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.004, bevelEnabled: false, curveSegments: 4 })
  face.add(new THREE.Mesh(frameGeo, frameMat))
  face.add(new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(0.2, 0.045, 0.02), 4), slotMat))
  const tickGeo = new THREE.BoxGeometry(0.016, 0.03, 0.008)
  for (const x of [-0.07, 0, 0.07]) {
    for (const y of [-0.068, 0.068]) {
      const tick = new THREE.Mesh(tickGeo, frameMat)
      tick.position.set(x, y, 0)
      face.add(tick)
    }
  }
  face.position.set(0.42, -0.06, BLADE_T)
  face.children[1].position.z = 0.001
  const back = face.clone()
  back.position.z = -BLADE_T
  back.scale.z = -1
  return [face, back]
}

// Fine streaks along the blade, for the flats' roughness: the grinding marks of the forge.
function brushedTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#c8c8c8'
  g.fillRect(0, 0, c.width, c.height)
  for (let i = 0; i < 260; i++) {
    const v = 150 + Math.floor(Math.random() * 105)
    g.fillStyle = `rgb(${v},${v},${v})`
    g.globalAlpha = 0.3 + Math.random() * 0.5
    g.fillRect(Math.random() * c.width - 128, Math.random() * c.height, 128 + Math.random() * 512, 0.6 + Math.random() * 1.4)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(0.5, 2) // cap UVs are in weapon units: one tile spans 2 × 0.5
  tex.anisotropy = 8
  return tex
}

// ── Guard ─────────────────────────────────────────────────────────────────────
// A thick, rounded-square tsuba of dark green iron, its long side across the blade, with a
// raised panel on each face (the step reads as the groove round the anime's guard).
function slab(shape, halfT, bevel) {
  const depth = 2 * (halfT - bevel)
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 10,
  })
  g.translate(0, 0, -depth / 2)
  g.rotateY(Math.PI / 2) // face along the blade axis: the shape's x runs along z
  return g
}

function guardGeometry() {
  return [slab(roundedRect(0.5, 0.8, 0.13), HANDLE.guard, 0.016), slab(roundedRect(0.41, 0.71, 0.09), HANDLE.guard + 0.01, 0.008)]
}

// ── Grip: tsuka-ito, wine-red silk wound in crossing bands ───────────────────
// Two families of bands cross on a diamond lattice, a crossing every quarter tile across
// and every half tile down. Like a real wrap, the band on top alternates from one crossing
// to the next along the grip, and the diamonds between the bands are left open.
function wrapTexture() {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.fillStyle = '#16060a'
  g.fillRect(0, 0, S, S)
  const W = S * 0.25 // band width, edge to edge
  const bands = (dir) => {
    for (let k = -4; k <= 6; k++) {
      const x0 = -S
      const x1 = 2 * S
      const y0 = dir * x0 + (k * S) / 2
      const y1 = dir * x1 + (k * S) / 2
      const len = Math.hypot(x1 - x0, y1 - y0)
      const ux = (x1 - x0) / len
      const uy = (y1 - y0) / len
      const stroke = (style, width, offset = 0) => {
        g.strokeStyle = style
        g.lineWidth = width
        g.beginPath()
        g.moveTo(x0 - uy * offset, y0 + ux * offset)
        g.lineTo(x1 - uy * offset, y1 + ux * offset)
        g.stroke()
      }
      stroke('#2a0b11', W)
      stroke('#5c1b25', W * 0.82)
      stroke('#7e2e38', W * 0.24, -W * 0.18) // light catches one side of the flat silk
      // the twist of the silk, in fine strokes across the band
      g.strokeStyle = 'rgba(24, 5, 9, 0.4)'
      g.lineWidth = 2
      for (let t = 0; t < len; t += 12) {
        const cx = x0 + ux * t
        const cy = y0 + uy * t
        g.beginPath()
        g.moveTo(cx - uy * W * 0.4 + ux * 4, cy + ux * W * 0.4 + uy * 4)
        g.lineTo(cx + uy * W * 0.4 - ux * 4, cy - ux * W * 0.4 - uy * 4)
        g.stroke()
      }
    }
  }
  bands(1)
  bands(-1)
  // Crossings sit at (i, j) quarter-tiles with i + j even; the rising band goes back on top
  // at every other one. Each is clipped to its own diamond, so neighbours are untouched.
  g.save()
  g.beginPath()
  const d = (W / Math.SQRT2) * 1.08
  for (let i = 0; i < 4; i++) {
    for (let j = i % 2; j < 4; j += 2) {
      if (((i + j) / 2) % 2) continue
      for (const ox of [-S, 0, S]) {
        for (const oy of [-S, 0, S]) {
          const cx = (i * S) / 4 + ox
          const cy = (j * S) / 4 + oy
          g.moveTo(cx + d, cy)
          g.lineTo(cx, cy + d)
          g.lineTo(cx - d, cy)
          g.lineTo(cx, cy - d)
          g.closePath()
        }
      }
    }
  }
  g.clip()
  bands(1)
  g.restore()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 4) // four crossings round the grip, eight down its front
  tex.anisotropy = 8
  return tex
}

// The pommel cap's profile (radius, length), swept round the grip's axis.
const KASHIRA = [
  [1, 0],
  [1.03, 0.45],
  [0.97, 0.8],
  [0.8, 0.96],
  [0.45, 1],
  [0, 1],
].map(([r, h]) => new THREE.Vector2(r, h))

// ── Assembly ──────────────────────────────────────────────────────────────────
export function buildSword(uniforms, envMap) {
  const steel = ({ glint, ...params }) =>
    patchDissolve(new THREE.MeshPhysicalMaterial({ metalness: 1, envMap, ...params }), uniforms, { glint })
  // Dark, brushed flats so the light name reads over the blade (a flat mirror would flash
  // white all over whenever it faced the key light); polished chamfers catch the sky.
  const brushed = brushedTexture()
  const flatMat = steel({ color: '#30343a', roughness: 0.5, roughnessMap: brushed, envMapIntensity: 0.9, glint: 0.6 })
  const edgeMat = steel({ color: '#d4d9e0', roughness: 0.14, envMapIntensity: 1.8, glint: 1.4 })
  const guardMat = steel({ color: '#6c7568', metalness: 0.65, roughness: 0.45, envMapIntensity: 0.9, glint: 0.3 })
  const brassMat = steel({ color: '#bcae55', metalness: 0.85, roughness: 0.36, envMapIntensity: 1.1, glint: 0.5 })
  const chainMat = steel({ color: '#8a9099', roughness: 0.28, envMapIntensity: 1.3, glint: 0.4 })
  const slotMat = patchDissolve(new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.7 }), uniforms, { glint: 0 })
  const wrap = wrapTexture()
  const gripMat = patchDissolve(
    new THREE.MeshStandardMaterial({ map: wrap, bumpMap: wrap, bumpScale: 1.2, roughness: 0.8, metalness: 0, envMap, envMapIntensity: 0.5 }),
    uniforms,
    { glint: 0 },
  )

  const sword = new THREE.Group()
  sword.add(new THREE.Mesh(bladeGeometry(), [flatMat, edgeMat]))
  sword.add(...engraving(edgeMat, slotMat))
  sword.add(...guardGeometry().map((geo) => new THREE.Mesh(geo, guardMat)))

  // Down the hilt, from the guard: seppa (washer), fuchi (collar), the wrapped tsuka, and
  // the kashira (pommel cap) with the ring the chain hangs from — all fittings in brass.
  // Each part is a unit solid round the y axis, laid along the grip (to −x) from `from`.
  const along = (geo, from, to, ry, rz, mat) => {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.scale.set(ry, from - to, rz)
    mesh.rotation.z = Math.PI / 2 // the solid's +y end points down the grip, to −x
    mesh.position.set(from, 0, 0)
    sword.add(mesh)
  }
  const tube = (segs = 40) => new THREE.CylinderGeometry(1, 1, 1, segs).translate(0, 0.5, 0)
  const seppa = -HANDLE.guard - 0.014
  const fuchi = seppa - 0.07
  along(tube(), -HANDLE.guard, seppa, 0.14, 0.115, brassMat)
  along(tube(), seppa, fuchi, 0.11, 0.09, brassMat)
  along(tube(48), fuchi, HANDLE.end, 0.1, 0.08, gripMat)
  const capEnd = HANDLE.end - 0.08
  along(new THREE.LatheGeometry(KASHIRA, 40), HANDLE.end, capEnd, 0.106, 0.086, brassMat)
  along(tube(16), capEnd + 0.01, capEnd - 0.035, 0.028, 0.028, brassMat) // the eye the ring runs through

  const R = 0.105
  const t = 0.019
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, t, 12, 40), brassMat)
  ring.position.set(capEnd - 0.03 - R - t, 0, 0)
  ring.rotation.x = 0.35 // a little turned, so it reads as a ring from the hilt side too
  sword.add(ring)

  // Chain links (simulated in world space by the scene, see sword.js). The last link is
  // snapped open: only a little of the chain came with the blade.
  const linkGeo = new THREE.TorusGeometry(0.044, 0.014, 10, 24)
  linkGeo.scale(1.5, 1, 1)
  const brokenGeo = new THREE.TorusGeometry(0.044, 0.014, 10, 24, Math.PI * 1.55)
  brokenGeo.scale(1.5, 1, 1)
  const links = Array.from({ length: 7 }, (_, i) => new THREE.Mesh(i === 6 ? brokenGeo : linkGeo, chainMat))

  // The chain hangs from the far side of the ring.
  return { sword, links, linkSpacing: 0.088, pommel: new THREE.Vector3(ring.position.x - R, 0, 0) }
}
