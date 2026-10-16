import * as THREE from 'three'

export const NOISE_GLSL = /* glsl */ `
float dsHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dsNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dsHash(i), dsHash(i + vec3(1, 0, 0)), f.x), mix(dsHash(i + vec3(0, 1, 0)), dsHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dsHash(i + vec3(0, 0, 1)), dsHash(i + vec3(1, 0, 1)), f.x), mix(dsHash(i + vec3(0, 1, 1)), dsHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`

/**
 * Uniforms shared by every part of the sword. The sword materialises from the pommel to
 * the tip as uReveal goes 0 → 1 (and burns away tip-first as it returns to 0); uGlint is
 * a light sweep along the blade.
 */
export function createSwordUniforms() {
  return {
    uReveal: { value: 0 },
    uTime: { value: 0 },
    uOrigin: { value: new THREE.Vector3() }, // pommel, world space
    uAxis: { value: new THREE.Vector3(1, 0, 0) }, // pommel → tip, world space
    uSpan: { value: 1 }, // pommel → tip distance, world space
    uGlint: { value: -1 },
    uGlintStrength: { value: 0 },
    uBurn: { value: new THREE.Color('#ff3a1c') },
  }
}

/** Patches a built-in material with the dissolve front, burning edge and glint. */
export function patchDissolve(material, uniforms, { glint = 1 } = {}) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDsWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDsWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vDsWorld;
uniform float uReveal; uniform float uTime; uniform vec3 uOrigin; uniform vec3 uAxis; uniform float uSpan;
uniform float uGlint; uniform float uGlintStrength; uniform vec3 uBurn;
${NOISE_GLSL}`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
float dsT = dot(vDsWorld - uOrigin, uAxis) / uSpan;
float dsN = dsNoise(vDsWorld * 9.0 / uSpan * 3.0 + vec3(0.0, uTime * 0.7, 0.0));
float dsFront = uReveal * 1.24 - 0.12 - dsT - (dsN - 0.5) * 0.16;
if (dsFront < 0.0) discard;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
float dsBurn = (1.0 - smoothstep(0.0, 0.045, dsFront)) * (1.0 - step(0.999, uReveal));
totalEmissiveRadiance += mix(uBurn, vec3(1.0, 0.72, 0.4), dsBurn * dsBurn) * dsBurn * 7.0;
float dsG = exp(-pow((dsT - uGlint) * 16.0, 2.0)) * uGlintStrength * ${glint.toFixed(2)};
totalEmissiveRadiance += vec3(1.0, 0.97, 0.93) * dsG * 4.0;`,
      )
  }
  material.customProgramCacheKey = () => `blade-dissolve-${glint}`
  return material
}
