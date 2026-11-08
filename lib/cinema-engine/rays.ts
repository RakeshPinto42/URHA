/**
 * Light shafts: a screen-space pass that smears the brightest pixels away from the sun, so
 * anything standing in front of it casts real shafts. The cost is `samples` lookups a pixel,
 * set by the quality tier, and the shafts fade out as the sun leaves the frame.
 */
import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export function raysPass(samples: number): ShaderPass {
  return new ShaderPass({
    name: "RaysShader",
    uniforms: {
      tDiffuse: { value: null },
      uSun: { value: new THREE.Vector2(0.5, 0.5) },
      uStrength: { value: 0 },
      uColor: { value: new THREE.Color("#fff0d0") },
    },
    defines: { SAMPLES: samples },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uStrength; uniform vec3 uColor; varying vec2 vUv;
      // Interleaved gradient noise: a few samples read as a smooth shaft instead of as bands.
      float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
      void main() {
        vec4 base = texture2D(tDiffuse, vUv);
        if (uStrength <= 0.001) { gl_FragColor = base; return; }
        vec2 stepUv = (uSun - vUv) * 0.92 / float(SAMPLES);
        vec2 p = vUv + stepUv * ign(gl_FragCoord.xy);
        float weight = 1.0, sum = 0.0, total = 0.0;
        for (int i = 0; i < SAMPLES; i++) {
          vec3 c = min(texture2D(tDiffuse, p).rgb, vec3(6.0));
          sum += max(dot(c, vec3(0.3, 0.55, 0.15)) - 1.05, 0.0) * weight;
          total += weight;
          weight *= 0.965;
          p += stepUv;
        }
        gl_FragColor = vec4(base.rgb + uColor * (sum / total) * uStrength, base.a);
      }`,
  });
}
