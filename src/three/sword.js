import * as THREE from 'three'
import { gsap } from 'gsap'
import { buildSword } from './swordModel.js'
import { createSwordUniforms } from './dissolve.js'
import { createAura, createParticles, createTrail, createGetsuga } from './effects.js'
import { BLADE, HANDLE, bladePoint } from './profile.js'

const SWING_AXIS = new THREE.Vector3(0.12, 0.22, 1).normalize()
const RAISE = -0.35 // radians: the blade lifts before the cut
const CUT = 2.55 // radians: where the cut ends
const HILT_SHARE = -HANDLE.pommel / (BLADE.length - HANDLE.pommel) // pommel→guard, of the whole weapon
const GRIP = (HANDLE.end - HANDLE.guard) / 2 // the middle of the grip
const AURA_Z = 0.05 // the reiatsu plane sits just behind the blade's far flat
const rand = (a, b) => a + Math.random() * (b - a)

/**
 * 天逆鉾 — Toji's Inverted Spear of Heaven, chain and all, rendered behind the hero name.
 *   canvas   the WebGL canvas (full hero size)
 *   nameEl   the element the blade passes behind
 *   cardEl   the next chapter's title, which the blade re-forms behind after the cut
 *   envImage the hero painting, used as the reflection environment
 *   fx       { raise, swing, wave, gone, card } (0..1 each) and `visible`, driven by the
 *            hero's scroll timeline
 *   still    render a single, fully formed frame (reduced motion)
 */
export function createSword({
  canvas,
  nameEl,
  cardEl = null,
  envImage,
  fx = { raise: 0, swing: 0, wave: 0, gone: 0, card: 0, visible: true },
  still = false,
}) {
  const mobile = matchMedia('(max-width: 720px)').matches
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 8)

  // The lacquer reflects the hero painting itself, so the blade belongs to this sky.
  // Copy it into a canvas first: an <img> reports its layout size, not the decoded file's,
  // and uploading with the wrong size fails.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envCanvas = document.createElement('canvas')
  envCanvas.width = 1024
  envCanvas.height = 512
  const envCtx = envCanvas.getContext('2d')
  // Muted, so the edge reflects the sky and the meadow as light, not as a stripe of green.
  envCtx.filter = 'saturate(0.55)'
  envCtx.drawImage(envImage, 0, 0, envCanvas.width, envCanvas.height)
  const envTex = new THREE.CanvasTexture(envCanvas)
  envTex.mapping = THREE.EquirectangularReflectionMapping
  envTex.colorSpace = THREE.SRGBColorSpace
  const envMap = pmrem.fromEquirectangular(envTex).texture
  envTex.dispose()
  pmrem.dispose()

  const key = new THREE.DirectionalLight('#fff3e2', 2.4)
  key.position.set(-3, 5, 5)
  const fill = new THREE.DirectionalLight('#a9c8ff', 0.7)
  fill.position.set(4, -2, 3)
  const rim = new THREE.DirectionalLight('#ff3a1c', 1.3) // a hint of reiatsu on the spine; aimed per pose
  scene.add(key, fill, rim)

  // ── The sword ──────────────────────────────────────────────────────────────
  const uniforms = createSwordUniforms()
  const { sword, links, linkSpacing, pommel } = buildSword(uniforms, envMap)
  const aura = createAura(uniforms)
  sword.add(aura.mesh)

  const root = new THREE.Group() // sits at the grip: the pivot for the cut
  const base = new THREE.Group() // orientation + scale from the layout
  const roller = new THREE.Group() // idle roll around the blade's own axis
  roller.add(sword)
  base.add(roller)
  root.add(base)
  scene.add(root)
  links.forEach((l) => scene.add(l))

  const embers = createParticles({ max: mobile ? 260 : 520, additive: true })
  const smoke = createParticles({ max: mobile ? 90 : 180, additive: false })
  scene.add(smoke.points, embers.points)

  const trail = createTrail()
  const getsuga = createGetsuga()
  scene.add(trail.mesh, getsuga.mesh)

  // ── Layout: two poses ──────────────────────────────────────────────────────
  // hero: threaded behind the name. card: re-formed behind the next chapter's title card.
  const makePose = () => ({ q: new THREE.Quaternion(), scale: 1, pivot: new THREE.Vector3(), basePos: new THREE.Vector3(), auraZ: -AURA_Z, rim: new THREE.Vector3() })
  const poses = { hero: makePose(), card: makePose() }
  let activePose = null
  const L = { e1: new THREE.Vector3(), e2: new THREE.Vector3(), r1: 1, target: new THREE.Vector3() } // the cut
  const unproject = (px, py, z, W, H) => {
    const p = new THREE.Vector3((px / W) * 2 - 1, -((py / H) * 2 - 1), 0.5).unproject(camera)
    const dir = p.sub(camera.position).normalize()
    return camera.position.clone().add(dir.multiplyScalar((z - camera.position.z) / dir.z))
  }

  const toCamDir = (p) => camera.position.clone().sub(p).normalize()

  /** Orient the sword so its guard sits at `guard` and its tip at `tip` (world space). */
  function solvePose(pose, tip, guard) {
    // Basis: x along the blade, the flat facing the camera, spine kept on the upper side.
    const x = tip.clone().sub(guard).normalize()
    const toCam = camera.position.clone().sub(guard).normalize()
    const z0 = toCam.sub(x.clone().multiplyScalar(toCam.dot(x))).normalize()
    const y = new THREE.Vector3().crossVectors(x, z0).normalize()
    if (y.y < 0) y.negate()
    const z = new THREE.Vector3().crossVectors(x, y)
    pose.q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
    // The reiatsu plane must sit BEHIND the blade as the camera sees it; the blade's local
    // +z faces the camera in some poses and away from it in others.
    pose.auraZ = z.dot(toCamDir(guard)) > 0 ? -AURA_Z : AURA_Z
    // The rim light comes from above the spine and from behind, so it glints along the
    // spine and edge. A fixed light would catch the guard's flat face in some poses and
    // paint the black tsuba red.
    pose.rim.copy(y).multiplyScalar(0.6).addScaledVector(toCamDir(guard), -0.8).multiplyScalar(5)
    pose.scale = tip.distanceTo(guard) / BLADE.length
    const toWorld = (v) => v.clone().multiplyScalar(pose.scale).applyQuaternion(pose.q).add(guard)
    pose.pivot.copy(toWorld(new THREE.Vector3(GRIP, 0, 0))) // the grip: the cut pivots here
    pose.basePos.copy(toWorld(new THREE.Vector3(0, 0, 0)).sub(pose.pivot))
  }

  function applyPose(name) {
    const p = poses[name]
    base.quaternion.copy(p.q)
    base.scale.setScalar(p.scale)
    base.position.copy(p.basePos)
    aura.mesh.position.z = p.auraZ
    rim.position.copy(p.rim)
    links.forEach((l) => l.scale.setScalar(p.scale))
    if (activePose !== name) {
      chainReset = true
      embers.clear()
      smoke.clear()
    }
    activePose = name
    return p
  }

  const shortQuery = matchMedia('(orientation: landscape) and (max-height: 520px)')
  const sizeKey = () => `${canvas.clientWidth}x${canvas.clientHeight}:${shortQuery.matches}`
  let laidOut = ''

  function layout() {
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    if (!W || !H) return
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    // unproject() reads matrixWorld, which the renderer only refreshes when it renders —
    // layout can run before the first frame, so refresh it here.
    camera.updateMatrixWorld()
    const projScale = (H * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    embers.uniforms.uScale.value = projScale
    smoke.uniforms.uScale.value = projScale

    const box = (el) => {
      let left = 0
      let top = 0
      for (let e = el; e && e !== canvas.offsetParent; e = e.offsetParent) {
        left += e.offsetLeft
        top += e.offsetTop
      }
      return { left, right: left + el.offsetWidth, cy: top + el.offsetHeight / 2, bottom: top + el.offsetHeight }
    }
    const wide = W / H > 0.9
    // The tip recedes into the painting (z < 0) and the guard comes forward, so the blade
    // reads in perspective and the guard is seen from the hilt side.
    const n = box(nameEl)
    // Desktop: the blade lies behind the name, pointing up and back into the sky; the guard
    // sits just past the seal, the hilt and chain below and to the right.
    // Phones: the spear comes down out of the open sky — hilt and chain up to the right,
    // tip ending just behind the start of the name — so it never crosses the tagline.
    // A phone on its side is too short for either: there it hangs in the empty sky on the
    // right, its tip by the seal.
    // (The hero keeps a 600px minimum height, so measure the window, as hero.css does.)
    const short = shortQuery.matches
    const V = Math.min(H, window.innerHeight)
    const heroTip = short
      ? unproject(n.right + 0.12 * W, n.cy - 0.02 * V, -0.5, W, H)
      : wide
        ? unproject(n.left + 0.24 * (n.right - n.left), n.cy - 0.1 * H, -0.25, W, H)
        : unproject(0.08 * W, n.cy - 0.03 * H, -0.4, W, H)
    const heroGuard = short
      ? unproject(0.67 * W, n.cy - 0.1 * V, 0.1, W, H)
      : wide
        ? unproject(n.right + 0.085 * W, n.cy + 0.06 * H, 0.1, W, H)
        : unproject(0.52 * W, n.cy - 0.19 * H, 0.05, W, H)
    solvePose(poses.hero, heroTip, heroGuard)

    // The card: the spear rests beneath the title like a blade on a stand — hilt and
    // chain on the left, the blade rising slightly to the right — clear of the type.
    // (Crossing the title, the black letters were lost against the dark blade.)
    const k = box(cardEl ?? nameEl)
    const sub = cardEl?.closest('.hero__card')?.querySelector('.hero__card-sub')
    const rest = (sub ? box(sub).bottom : k.cy + 0.1 * V) + (wide ? 0.12 : 0.08) * V
    const [from, to] = wide ? [0.28 * W, 0.72 * W] : [0.1 * W, 0.9 * W] // pommel … tip
    const cardTip = unproject(to, rest - 0.03 * V, -0.15, W, H)
    const cardGuard = unproject(from + HILT_SHARE * (to - from), rest, 0.15, W, H)
    solvePose(poses.card, cardTip, cardGuard)

    // The plane of the cut (hero pose), for the trail and the crescent.
    const P = poses.hero
    const tipRel = heroTip.clone().sub(P.pivot)
    const inPlane = tipRel.clone().sub(SWING_AXIS.clone().multiplyScalar(tipRel.dot(SWING_AXIS)))
    L.r1 = inPlane.length()
    L.e1.copy(inPlane).normalize()
    L.e2.crossVectors(SWING_AXIS, L.e1)
    trail.mesh.position.copy(P.pivot)
    trail.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(L.e1, L.e2, SWING_AXIS))
    trail.mesh.scale.setScalar(L.r1 / 0.95)
    trail.uniforms.uR0.value = 0.42
    trail.uniforms.uR1.value = 0.95
    L.target.copy(unproject(W * 0.5, H * 0.4, -24, W, H))

    activePose = null
    chainReset = true
    laidOut = sizeKey()
    if (still) render(0)
  }

  // ── Chain: verlet rope hanging from the pommel ─────────────────────────────
  const N = links.length + 1
  const pts = Array.from({ length: N }, () => ({ p: new THREE.Vector3(), o: new THREE.Vector3() }))
  let chainReset = true
  const anchor = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const xAxis = new THREE.Vector3(1, 0, 0)
  const qa = new THREE.Quaternion()
  const qb = new THREE.Quaternion()

  function stepChain(dt) {
    anchor.copy(pommel)
    sword.localToWorld(anchor)
    const spacing = linkSpacing * poses[activePose ?? 'hero'].scale
    if (chainReset) {
      pts.forEach((pt, i) => {
        pt.p.set(anchor.x + i * spacing * 0.3, anchor.y - i * spacing, anchor.z)
        pt.o.copy(pt.p)
      })
      chainReset = false
    }
    const g = -16 * dt * dt
    for (let i = 1; i < N; i++) {
      const pt = pts[i]
      tmp.copy(pt.p).sub(pt.o).multiplyScalar(0.985)
      pt.o.copy(pt.p)
      pt.p.add(tmp)
      pt.p.y += g
    }
    for (let it = 0; it < 8; it++) {
      pts[0].p.copy(anchor)
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i].p
        const b = pts[i + 1].p
        tmp.copy(b).sub(a)
        const d = tmp.length() || 1e-6
        const diff = (d - spacing) / d
        if (i === 0) b.sub(tmp.multiplyScalar(diff))
        else {
          tmp.multiplyScalar(diff * 0.5)
          a.add(tmp)
          b.sub(tmp)
        }
      }
    }
    links.forEach((l, i) => {
      const a = pts[i].p
      const b = pts[i + 1].p
      l.position.copy(a).add(b).multiplyScalar(0.5)
      tmp.copy(b).sub(a).normalize()
      qa.setFromUnitVectors(xAxis, tmp)
      qb.setFromAxisAngle(xAxis, (i % 2) * Math.PI * 0.5)
      l.quaternion.copy(qa).multiply(qb)
    })
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const state = { intro: still ? 1 : 0, glint: -1, glintK: 0, aura: 0.45 }
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  const qSwing = new THREE.Quaternion()
  const qTilt = new THREE.Quaternion()
  const eTilt = new THREE.Euler()
  const v = new THREE.Vector3()
  const vel = new THREE.Vector3()
  let time = 0
  let nextGlint = 6

  function glint() {
    state.glintK = 1
    gsap.fromTo(state, { glint: -0.15 }, { glint: 1.15, duration: 0.85, ease: 'power2.inOut', onComplete: () => (state.glintK = 0) })
  }

  function spawnAlongBlade(u, sAcross, cb) {
    bladePoint(Math.min(1, Math.max(0, u)), sAcross, v)
    sword.localToWorld(v)
    cb(v)
  }

  function render(dt) {
    // After the cut the blade burns away, then re-forms behind the title card.
    const onCard = fx.card > 0.001
    const P = applyPose(onCard ? 'card' : 'hero')
    const s = P.scale
    time += dt
    uniforms.uTime.value = time
    uniforms.uReveal.value = onCard ? fx.card : state.intro * (1 - fx.gone)

    // Pose: idle float + roll, pointer tilt, then the scrubbed raise → cut.
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3)
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3)
    const angle = THREE.MathUtils.lerp(RAISE * fx.raise, CUT, fx.swing)
    qSwing.setFromAxisAngle(SWING_AXIS, onCard ? 0 : angle)
    eTilt.set(pointer.sy * 0.07, pointer.sx * 0.12, 0)
    qTilt.setFromEuler(eTilt)
    root.quaternion.copy(qTilt).multiply(qSwing)
    root.position.copy(P.pivot)
    if (!still) root.position.y += Math.sin(time * 0.9) * 0.035 * s
    roller.rotation.x = still ? 0.12 : Math.sin(time * 0.55) * 0.24 + pointer.sy * 0.15

    root.updateMatrixWorld(true)

    // The world frame the dissolve is measured in: pommel → tip.
    const o = uniforms.uOrigin.value.set(HANDLE.pommel, 0, 0)
    sword.localToWorld(o)
    const tipW = v.set(BLADE.length, 0, 0)
    sword.localToWorld(tipW)
    uniforms.uAxis.value.copy(tipW).sub(o)
    uniforms.uSpan.value = uniforms.uAxis.value.length()
    uniforms.uAxis.value.normalize()

    // Glint every few seconds once the blade is whole.
    const whole = onCard ? fx.card >= 0.999 : state.intro >= 1 && fx.gone < 0.01
    if (!still && whole) {
      nextGlint -= dt
      if (nextGlint <= 0) {
        glint()
        nextGlint = rand(7, 10)
      }
    }
    uniforms.uGlint.value = state.glint
    uniforms.uGlintStrength.value = state.glintK

    // Reiatsu
    const charge = onCard ? 0 : fx.raise * (1 - fx.swing * 0.5)
    aura.uniforms.uAura.value = onCard ? 0.45 : (0.45 + 0.75 * charge + 0.4 * fx.swing) * (1 - fx.gone)

    if (!still && dt > 0) {
      const formed = uniforms.uReveal.value
      const live = formed > 0.02
      const emberRate = (16 + 260 * charge + 160 * fx.swing * (1 - fx.swing)) * (live ? 1 : 0)
      const smokeRate = 14 * charge * (live ? 1 : 0) // smoke only while the blade charges
      for (let k = 0; k < Math.floor(emberRate * dt + Math.random()); k++) {
        spawnAlongBlade(Math.random() * Math.min(1, formed * 1.15), Math.random() < 0.7 ? rand(0, 0.25) : rand(0.8, 1), (at) =>
          embers.spawn(at, vel.set(rand(-0.25, 0.25), rand(0.15, 0.6), rand(-0.1, 0.1)).multiplyScalar(s), {
            ttl: rand(0.6, 1.6),
            size: rand(0.016, 0.034) * s,
            heat: Math.random(),
          }),
        )
      }
      for (let k = 0; k < Math.floor(smokeRate * dt + Math.random()); k++) {
        spawnAlongBlade(Math.random() * Math.min(1, formed * 1.15), Math.random(), (at) =>
          smoke.spawn(at, vel.set(rand(-0.08, 0.08), rand(0.1, 0.3), 0).multiplyScalar(s), {
            ttl: rand(1.4, 2.6),
            size: rand(0.16, 0.32) * s,
            heat: rand(0.2, 0.9),
          }),
        )
      }
      // The burning front sheds sparks while the blade forms or dissolves.
      const forming = (state.intro > 0 && state.intro < 1) || (fx.card > 0.001 && fx.card < 1)
      const burning = !onCard && fx.gone > 0 && fx.gone < 1
      if (forming || burning) {
        const frontU = ((formed * 1.24 - 0.12) * (BLADE.length - HANDLE.pommel) + HANDLE.pommel - BLADE.start) / (BLADE.length - BLADE.start)
        for (let k = 0; k < 6; k++) {
          spawnAlongBlade(frontU + rand(-0.03, 0.03), Math.random(), (at) =>
            embers.spawn(at, vel.set(rand(-0.5, 0.5), rand(0.1, 0.9), rand(-0.3, 0.3)).multiplyScalar(s), {
              ttl: rand(0.4, 1.1),
              size: rand(0.02, 0.045) * s,
              heat: rand(0.5, 1),
            }),
          )
        }
      }
      embers.update(dt, time, { buoyancy: 0.5 * s, drag: 0.97 })
      smoke.update(dt, time, { buoyancy: 0.12 * s, drag: 0.985, grow: 1.6 })
      stepChain(Math.min(dt, 1 / 30))
    } else {
      stepChain(1 / 60)
    }

    // The cut: a trail behind the blade, then Getsuga Tenshō flies into the painting.
    trail.uniforms.uTime.value = time
    trail.uniforms.uFrom.value = RAISE
    trail.uniforms.uTo.value = angle
    trail.uniforms.uOpacity.value = Math.min(1, fx.swing * 5) * (1 - THREE.MathUtils.smoothstep(fx.wave, 0.15, 0.55))
    trail.mesh.visible = !onCard && fx.swing > 0.001 && trail.uniforms.uOpacity.value > 0.001

    const w = fx.wave
    getsuga.mesh.visible = !onCard && w > 0.001 && w < 0.999
    if (getsuga.mesh.visible) {
      const a0 = (RAISE + CUT) * 0.55
      const start = poses.hero.pivot.clone().addScaledVector(L.e1, Math.cos(a0) * L.r1 * 0.7).addScaledVector(L.e2, Math.sin(a0) * L.r1 * 0.7)
      const k = 1 - Math.pow(1 - w, 2.2)
      getsuga.mesh.position.lerpVectors(start, L.target, k)
      // Face the camera, convex side leading toward the horizon.
      const sp = start.clone().project(camera)
      const tp = L.target.clone().project(camera)
      getsuga.mesh.quaternion.copy(camera.quaternion)
      getsuga.mesh.rotateZ(Math.atan2((tp.y - sp.y) / camera.aspect, tp.x - sp.x) - Math.PI / 2)
      getsuga.mesh.scale.setScalar(L.r1 * 1.9)
      getsuga.uniforms.uTime.value = time
      getsuga.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(w, 0, 0.08) * (1 - THREE.MathUtils.smoothstep(w, 0.7, 1))
    }

    renderer.render(scene, camera)
  }

  // ── Loop ───────────────────────────────────────────────────────────────────
  // No IntersectionObserver here: the hero is pinned, which confuses it. The hero tells
  // us when it is on screen (fx.visible), and between the burn-out and the card there is
  // nothing to draw.
  let idle = false
  const tick = (_t, deltaMs) => {
    if (document.hidden) return
    const between = fx.gone >= 0.999 && fx.card <= 0.001 && (fx.wave <= 0.001 || fx.wave >= 0.999)
    if (fx.visible === false || between) {
      if (!idle) {
        embers.clear()
        smoke.clear()
        renderer.clear()
        idle = true
      }
      return
    }
    idle = false
    render(Math.min(deltaMs / 1000, 1 / 20))
  }

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  })
  let rt
  window.addEventListener('resize', () => {
    clearTimeout(rt)
    // Mobile toolbars sliding in and out fire resize too, but the hero is sized to the
    // largest viewport (lvh), so nothing has moved: keep the embers and the chain as they are.
    rt = setTimeout(() => sizeKey() !== laidOut && layout(), 120)
  })

  layout()
  if (!still) gsap.ticker.add(tick)

  return {
    layout,
    /** Burn the blade into being from the pommel to the tip, then let light run along the edge. */
    materialize(duration = 1.9) {
      return gsap
        .timeline()
        .fromTo(state, { intro: 0 }, { intro: 1, duration, ease: 'power2.inOut' })
        .add(glint, '-=0.05')
    },
    glint,
  }
}
