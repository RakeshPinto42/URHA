/**
 * General-purpose objects any scene can use: shapes with real materials, and particles.
 * World-specific generators live with their world, as lib/journey/scene-objects.ts does.
 * No browser APIs, so each can be built and disposed in a test.
 */
import * as THREE from "three";
import type { Generator, Generators } from "./runtime";

const num = (v: unknown, fallback: number) => (typeof v === "number" ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);

export const SHAPES = ["box", "sphere", "cylinder", "cone", "torus", "plane"] as const;

function shape(kind: string, size: number): THREE.BufferGeometry {
  switch (kind) {
    case "sphere": return new THREE.SphereGeometry(size / 2, 48, 32);
    case "cylinder": return new THREE.CylinderGeometry(size / 2, size / 2, size, 48);
    case "cone": return new THREE.ConeGeometry(size / 2, size, 48);
    case "torus": return new THREE.TorusGeometry(size / 2, size / 6, 24, 72);
    case "plane": return new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2);
    default: return new THREE.BoxGeometry(size, size, size);
  }
}

/** A shape with a physically based material: base colour, metallic, roughness, emissive. */
const primitive: Generator = (p) => {
  const mesh = new THREE.Mesh(
    shape(str(p.shape, "box"), num(p.size, 4)),
    new THREE.MeshStandardMaterial({
      color: str(p.color, "#c8ccd8"), metalness: num(p.metalness, 0.1), roughness: num(p.roughness, 0.5),
      emissive: str(p.emissive, "#000000"), emissiveIntensity: num(p.emissiveIntensity, 0),
    }),
  );
  mesh.castShadow = str(p.shape, "box") !== "plane";
  mesh.receiveShadow = true;
  return { object: mesh };
};

/** A drifting cloud of glowing points. */
const particles: Generator = (p, ctx) => {
  const N = Math.round(num(p.count, 300) * ctx.tier.particles);
  const area = num(p.area, 60), height = num(p.height, 20);
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    // Deterministic, so a scene looks the same each time it opens.
    const r = (k: number) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
    pos.set([(r(1) - 0.5) * area, r(2) * height, (r(3) - 0.5) * area], i * 3);
    seed[i] = r(4) * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(str(p.color, "#ffd28a")).multiplyScalar(3) }, uSize: { value: num(p.size, 70) } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uSize; attribute float aSeed; varying float vA;
      void main() {
        vec3 q = position;
        q.x += sin(uTime * 0.3 + aSeed) * 0.9; q.y += sin(uTime * 0.21 + aSeed * 1.7) * 0.7; q.z += cos(uTime * 0.17 + aSeed) * 0.9;
        vec4 mv = modelViewMatrix * vec4(q, 1.0);
        gl_PointSize = clamp(uSize / -mv.z, 2.0, 12.0);
        vA = 0.55 + 0.45 * sin(uTime * 0.8 + aSeed * 3.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.1, 0.5, d)) * vA);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  return { object: points, update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; } };
};

export const COMMON_GENERATORS: Generators = { primitive, particles };
