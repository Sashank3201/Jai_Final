import * as THREE from 'three'
import { BLADE, BOUNDS, HANDLE, outlineDistance } from './profile.js'
import { NOISE_GLSL } from './dissolve.js'

// The distance to the blade's outline, baked once into a texture for the flames to read.
function outlineField(x0, y0, w, h, range) {
  const W = 256
  const H = Math.round((W * h) / w)
  const data = new Uint8Array(W * H)
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const d = outlineDistance(x0 + ((i + 0.5) / W) * w, y0 + ((j + 0.5) / H) * h)
      data[j * W + i] = Math.round(255 * Math.min(1, Math.max(0, d) / range))
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.UnsignedByteType)
  tex.unpackAlignment = 1
  tex.magFilter = tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

// ── Reiatsu aura: black flames with a red fringe, hugging the blade's outline ─────
export function createAura(uniforms) {
  const pad = 0.34
  const x0 = BLADE.start - pad
  const y0 = BOUNDS.y0 - pad
  const w = BOUNDS.x1 + pad - x0
  const h = BOUNDS.y1 + pad - y0
  const geo = new THREE.PlaneGeometry(w, h, 1, 1)
  const offset = new THREE.Vector2(x0 + w / 2, y0 + h / 2)
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide, // the sword's local +z faces away from the camera
    uniforms: {
      uTime: uniforms.uTime,
      uReveal: uniforms.uReveal,
      uAura: { value: 0.45 },
      uOffset: { value: offset },
      uField: { value: outlineField(x0, y0, w, h, pad) },
      uFieldBox: { value: new THREE.Vector4(x0, y0, w, h) },
      uPad: { value: pad },
      uStart: { value: BLADE.start },
      uLen: { value: BLADE.length },
      uHandle: { value: -HANDLE.pommel },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uOffset;
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy + uOffset;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${NOISE_GLSL}
      uniform float uTime; uniform float uReveal; uniform float uAura; uniform float uHandle;
      uniform sampler2D uField; uniform vec4 uFieldBox; uniform float uPad; uniform float uStart; uniform float uLen;
      varying vec2 vLocal;
      float fbm(vec3 p) { return dsNoise(p) * 0.6 + dsNoise(p * 2.1 + 3.7) * 0.3 + dsNoise(p * 4.3 + 7.1) * 0.1; }
      void main() {
        float x = vLocal.x; float y = vLocal.y;
        float d = texture2D(uField, (vLocal - uFieldBox.xy) / uFieldBox.zw).r * uPad;
        // Flames lick outward and drift toward the tip.
        float n = fbm(vec3(x * 4.0 - uTime * 0.9, y * 7.0 - uTime * 2.2, uTime * 0.3));
        float reach = (0.02 + 0.16 * n * n) * (0.25 + uAura);
        float glow = 1.0 - smoothstep(0.0, reach, d);
        glow *= glow * (3.0 - 2.0 * glow);
        float t = clamp(d / reach, 0.0, 1.0);
        vec3 col = mix(vec3(0.02, 0.0, 0.012), vec3(0.95, 0.1, 0.05), smoothstep(0.05, 0.6, t));
        // Only where the sword has already materialised, and not round the guard.
        float revealT = (x + uHandle) / (uLen + uHandle);
        float shown = smoothstep(0.0, 0.06, uReveal * 1.24 - 0.12 - revealT);
        float a = glow * min(1.0, uAura) * shown * smoothstep(uStart, uStart + 0.06, x);
        gl_FragColor = vec4(col, a);
      }`,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(offset.x, offset.y, -0.05)
  mesh.renderOrder = -1
  return { mesh, uniforms: mat.uniforms }
}

// ── Particles: hot embers (additive) and black reiatsu smoke (normal) ─────────────
export function createParticles({ max, additive }) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(max * 3)
  const size = new Float32Array(max)
  const alpha = new Float32Array(max)
  const heat = new Float32Array(max)
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('aHeat', new THREE.BufferAttribute(heat, 1).setUsage(THREE.DynamicDrawUsage))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uScale: { value: 400 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aAlpha; attribute float aHeat;
      uniform float uScale;
      varying float vAlpha; varying float vHeat;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / -mv.z;
        vAlpha = aAlpha; vHeat = aHeat;
      }`,
    fragmentShader: additive
      ? /* glsl */ `
      varying float vAlpha; varying float vHeat;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d); a *= a;
        vec3 c = mix(vec3(0.9, 0.1, 0.03), vec3(1.0, 0.78, 0.45), vHeat);
        gl_FragColor = vec4(c, a * vAlpha);
      }`
      : /* glsl */ `
      varying float vAlpha; varying float vHeat;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = exp(-d * d * 4.0) * (1.0 - smoothstep(0.85, 1.0, d));
        vec3 c = mix(vec3(0.03, 0.0, 0.02), vec3(0.45, 0.04, 0.04), vHeat);
        gl_FragColor = vec4(c, a * vAlpha * 0.2);
      }`,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false

  const p = Array.from({ length: max }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, ttl: 1, size: 0, heat: 0, seed: 0 }))
  let cursor = 0

  return {
    points,
    uniforms: mat.uniforms,
    spawn(at, vel, { ttl = 1.5, size = 0.02, heat = 0.5 } = {}) {
      const q = p[cursor]
      cursor = (cursor + 1) % max
      Object.assign(q, { alive: true, x: at.x, y: at.y, z: at.z, vx: vel.x, vy: vel.y, vz: vel.z, life: 0, ttl, size, heat, seed: Math.random() * 100 })
    },
    clear() {
      p.forEach((q) => (q.alive = false))
      alpha.fill(0)
      geo.attributes.aAlpha.needsUpdate = true
    },
    update(dt, t, { buoyancy = 0.6, drag = 0.96, grow = 0 } = {}) {
      for (let i = 0; i < max; i++) {
        const q = p[i]
        if (!q.alive) {
          alpha[i] = 0
          continue
        }
        q.life += dt
        const k = q.life / q.ttl
        if (k >= 1) {
          q.alive = false
          alpha[i] = 0
          continue
        }
        const dragK = Math.pow(drag, dt * 60)
        q.vx = q.vx * dragK + Math.sin(t * 2.3 + q.seed) * 0.12 * dt
        q.vy = q.vy * dragK + buoyancy * dt
        q.vz *= dragK
        q.x += q.vx * dt
        q.y += q.vy * dt
        q.z += q.vz * dt
        pos[i * 3] = q.x
        pos[i * 3 + 1] = q.y
        pos[i * 3 + 2] = q.z
        size[i] = q.size * (1 + grow * k)
        alpha[i] = Math.sin(Math.PI * Math.min(1, k * 1.4)) * (additive ? 0.6 + 0.4 * Math.sin(t * 30 + q.seed) : 1)
        heat[i] = q.heat * (1 - k)
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.aSize.needsUpdate = true
      geo.attributes.aAlpha.needsUpdate = true
      geo.attributes.aHeat.needsUpdate = true
    },
  }
}

// ── Swing trail: the arc the blade cuts, a pale smear of speed lines ─────────────
export function createTrail() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uFrom: { value: 0 }, uTo: { value: 0 }, uR0: { value: 0.3 }, uR1: { value: 1 }, uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE_GLSL}
      uniform float uFrom; uniform float uTo; uniform float uR0; uniform float uR1; uniform float uOpacity; uniform float uTime;
      varying vec2 vP;
      void main() {
        float r = length(vP);
        float a = atan(vP.y, vP.x);
        float sweep = uTo - uFrom;
        if (sweep <= 0.001) discard;
        float da = mod(a - uFrom + 12.566370614, 6.283185307);
        if (da > sweep) discard;
        float k = da / sweep;                       // 0 at the start of the cut → 1 at the blade
        float radial = smoothstep(uR0, uR1, r) * (1.0 - smoothstep(uR1, uR1 * 1.03, r));
        // Speed lines: thin streaks that follow the arc, densest at the tip's path.
        float streak = smoothstep(0.45, 0.85, dsNoise(vec3(r * 60.0, 0.0, uTime * 0.6)));
        float rim = smoothstep(uR1 * 0.93, uR1, r) * radial;
        float body = radial * pow(k, 3.0) * (0.25 + 0.75 * max(streak, rim));
        vec3 col = mix(vec3(0.66, 0.73, 0.82), vec3(1.0), rim);
        gl_FragColor = vec4(col, body * uOpacity * 0.6);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
  mesh.renderOrder = 2
  return { mesh, uniforms: mat.uniforms }
}

// ── The slash: a thin crescent of white light. The Inverted Spear carries no cursed
// energy, so there is no wave of power, only the line of the cut flying on into the sky.
export function createSlash() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE_GLSL}
      uniform float uTime; uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv;
        // Crescent = inside the outer circle and outside the inner one. The circles sit close,
        // so it is a hairline at the tips and only slightly fuller in the middle.
        float dOut = 0.45 - length(p - vec2(0.5, 0.16));
        float dIn = length(p - vec2(0.5, 0.125)) - 0.45;
        float m = min(dOut, dIn);
        float core = smoothstep(0.0, 0.004, m);
        float glow = (1.0 - smoothstep(0.0, 0.035, abs(m))) * 0.45;
        float flicker = 0.85 + 0.15 * dsNoise(vec3(p * vec2(30.0, 6.0), uTime * 6.0));
        vec3 col = mix(vec3(0.62, 0.8, 1.0), vec3(1.0), core);
        gl_FragColor = vec4(col, max(core, glow) * flicker * uOpacity);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), mat)
  mesh.renderOrder = 3
  return { mesh, uniforms: mat.uniforms }
}
