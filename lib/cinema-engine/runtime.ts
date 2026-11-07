/**
 * The cinema runtime: turns a scene file into a running three.js scene, and tears it down
 * completely. Knows nothing of React or of any particular world. A world supplies generators.
 *
 * Rendering is physically based: tone mapped, with soft shadows from the sun, reflections
 * captured from the scene's own sky (nothing to download), and bloom, each scaled by the
 * quality tier. Under a still request it draws only when something changes.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FrameWatch, TIERS, nextTierDown, type Tier, type TierId } from "./quality";
import { ends, resolveNumber, type CinemaLight, type CinemaObject, type CinemaScene, type Vec3 } from "./schema";

/** What a generator receives each frame. */
export type Frame = { dt: number; time: number; progress: number; still: boolean; camera: THREE.Camera };

export type Built = {
  object: THREE.Object3D;
  update?: (f: Frame) => void;
  /** Disposes anything the generic scene walk cannot reach. */
  dispose?: () => void;
};

export type BuildContext = { tier: Tier; data: unknown; state: Record<string, unknown>; invalidate: () => void };
export type Generator = (params: Record<string, unknown>, ctx: BuildContext) => Built;
export type Generators = Record<string, Generator>;

export type Shot = { position: Vec3; target: Vec3 };

export type CinemaOptions = {
  canvas: HTMLCanvasElement;
  scene: CinemaScene;
  generators: Generators;
  tier: TierId;
  still: boolean;
  data?: unknown;
  /** Runs after the camera moves, before drawing: the place to project HTML labels. */
  onFrame?: (camera: THREE.PerspectiveCamera) => void;
  /** The device cannot run even the lowest tier. The host should show its poster. */
  onTooSlow?: () => void;
  onContextLost?: () => void;
  /** False keeps the chosen tier whatever the frame rate. */
  watchFrames?: boolean;
};

const textureSlots = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "envMap", "bumpMap"] as const;

/** Frees everything an object owns on the GPU. Exported so it can be tested without one. */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of materials) {
      for (const slot of textureSlots) (m as unknown as Record<string, THREE.Texture | undefined>)[slot]?.dispose?.();
      m.dispose();
    }
    (node as THREE.InstancedMesh).dispose?.();
  });
}

export class CinemaRuntime {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  private scene = new THREE.Scene();
  private clock = new THREE.Timer();
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private built: { spec: CinemaObject; built: Built }[] = [];
  private lights: { spec: CinemaLight; light: THREE.Light }[] = [];
  private sun: THREE.DirectionalLight | null = null;
  private pmrem: THREE.PMREMGenerator;
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private fogFrom = new THREE.Color();
  private fogTo = new THREE.Color();
  private watch = new FrameWatch();
  private tier: Tier;
  private ctx: BuildContext;
  private raf = 0;
  private running = false;
  private dirty = true;
  private disposed = false;
  private progress = 1;
  private timelineRate = 0;
  private capturedAt = -1;
  private time = 0;
  private goalPos = new THREE.Vector3();
  private goalTarget = new THREE.Vector3();
  private target = new THREE.Vector3();
  private sway = new THREE.Vector3();
  private flySpeed = 1.9;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private lost = (e: Event) => { e.preventDefault(); this.opts.onContextLost?.(); };

  constructor(private opts: CinemaOptions) {
    const { canvas, scene: spec } = opts;
    this.tier = TIERS[opts.tier];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    // Neutral keeps authored colour saturated, which ACES drains. These worlds are meant to be vivid.
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.enabled = this.tier.shadowMap > 0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.pixelRatio));
    canvas.addEventListener("webglcontextlost", this.lost);

    this.camera = new THREE.PerspectiveCamera(spec.camera.fov, 1, spec.camera.near, spec.camera.far);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.ctx = { tier: this.tier, data: opts.data, state: {}, invalidate: () => this.invalidate() };

    const [fogFrom, fogTo] = ends(spec.environment.fog.color);
    this.fogFrom.set(fogFrom);
    this.fogTo.set(fogTo);
    this.scene.fog = new THREE.FogExp2(fogTo, spec.environment.fog.density);
    this.scene.background = new THREE.Color(fogTo);

    for (const l of spec.lights) this.addLight(l);
    for (const o of spec.objects) {
      const make = opts.generators[o.generator];
      if (!make) throw new Error(`Scene "${spec.id}" uses unknown generator "${o.generator}"`);
      const built = make(o.params, this.ctx);
      built.object.visible = o.visible;
      built.object.name = o.id;
      this.scene.add(built.object);
      this.built.push({ spec: o, built });
    }
    this.buildPipeline();
    this.step(0);
    this.captureEnvironment();
    if (!opts.still) this.start();
  }

  private addLight(l: CinemaLight) {
    let light: THREE.Light;
    if (l.type === "hemisphere") light = new THREE.HemisphereLight(l.sky, l.ground, 1);
    else if (l.type === "point") {
      if (!this.tier.pointLights) return;
      light = new THREE.PointLight(l.color, 1, l.distance);
      light.position.set(...l.position);
    } else {
      const sun = new THREE.DirectionalLight(l.color, 1);
      sun.position.set(...l.direction).normalize().multiplyScalar(220);
      if (l.castShadow && this.tier.shadowMap) {
        this.sun = sun;
        sun.castShadow = true;
        sun.shadow.mapSize.set(this.tier.shadowMap, this.tier.shadowMap);
        const cam = sun.shadow.camera;
        cam.left = cam.bottom = -150; cam.right = cam.top = 150; cam.near = 10; cam.far = 620;
        sun.shadow.bias = -0.0004;
        sun.shadow.normalBias = 0.5;
        this.scene.add(sun.target);
      }
      light = sun;
    }
    this.scene.add(light);
    this.lights.push({ spec: l, light });
  }

  private buildPipeline() {
    const bloom = this.opts.scene.environment.bloom;
    this.composer?.dispose();
    this.composer = null;
    this.bloom?.dispose();
    this.bloom = null;
    if (this.tier.bloomScale === 0) return;
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(Math.max(size.x, 1), Math.max(size.y, 1), { type: THREE.HalfFloatType, samples: this.tier.msaa });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const res = new THREE.Vector2(size.x * this.tier.bloomScale, size.y * this.tier.bloomScale);
    this.bloom = new UnrealBloomPass(res, bloom.strength, bloom.radius, bloom.threshold);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  /** Lights the scene from its own sky, so materials reflect what you can see. */
  private captureEnvironment() {
    const source = this.built.find((b) => b.spec.environmentSource);
    if (!source) return;
    const hidden = this.scene.children.filter((c) => c !== source.built.object && c.visible);
    hidden.forEach((c) => { c.visible = false; });
    const fog = this.scene.fog;
    this.scene.fog = null;
    const next = this.pmrem.fromScene(this.scene, 0.03, 1, 1000);
    this.scene.fog = fog;
    hidden.forEach((c) => { c.visible = true; });
    this.scene.environment = next.texture;
    this.envTarget?.dispose();
    this.envTarget = next;
    this.capturedAt = this.progress;
  }

  private ease = (t: number) => t * t * (3 - 2 * t);

  private applyProgress() {
    const e = this.ease(this.progress);
    const env = this.opts.scene.environment;
    (this.scene.fog as THREE.FogExp2).color.copy(this.fogFrom).lerp(this.fogTo, e);
    this.renderer.toneMappingExposure = resolveNumber(env.exposure, e);
    this.scene.environmentIntensity = resolveNumber(env.reflections, e);
    for (const { spec, light } of this.lights) light.intensity = resolveNumber(spec.intensity, e);
  }

  private step(dt: number) {
    if (this.timelineRate > 0 && this.progress < 1) {
      this.progress = Math.min(1, this.progress + dt * this.timelineRate);
      if (this.progress === 1) this.timelineRate = 0;
      this.dirty = true;
      // Keep reflections in step with the light as it changes, without recapturing every frame.
      if (Math.abs(this.progress - this.capturedAt) > 0.2 || this.progress === 1) this.captureEnvironment();
    }
    this.applyProgress();

    if (!this.opts.still) {
      const k = 1 - Math.exp(-Math.min(dt, 0.05) * this.flySpeed);
      this.camera.position.lerp(this.goalPos, k);
      this.target.lerp(this.goalTarget, k);
      // A slow breath, so the world is alive at rest.
      this.sway.set(Math.sin(this.time * 0.21) * 0.6, Math.sin(this.time * 0.17 + 1) * 0.35, 0);
      this.camera.position.add(this.sway);
      this.camera.lookAt(this.target);
      this.camera.position.sub(this.sway);
    } else this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();

    if (this.sun) {
      // The shadow follows what the camera is looking at, so its detail is spent where you see it.
      const offset = this.sun.position.clone().sub(this.sun.target.position);
      this.sun.target.position.copy(this.target);
      this.sun.position.copy(this.target).add(offset);
      this.sun.target.updateMatrixWorld();
    }

    const frame: Frame = { dt, time: this.time, progress: this.ease(this.progress), still: this.opts.still, camera: this.camera };
    for (const { built } of this.built) built.update?.(frame);
    this.opts.onFrame?.(this.camera);
  }

  private draw() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  private loop = (now: number) => {
    if (this.disposed || !this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    this.clock.update(now);
    const dt = Math.min(this.clock.getDelta(), 0.25);
    this.time += dt;
    this.step(dt);
    this.draw();
    this.dirty = false;
    if (this.opts.watchFrames === false) return;
    const verdict = this.watch.record(dt * 1000, nextTierDown(this.tier.id) === null);
    if (verdict === "step-down") this.setTier(nextTierDown(this.tier.id)!);
    if (verdict === "too-slow") this.opts.onTooSlow?.();
  };

  start() {
    if (this.running || this.disposed || this.opts.still) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Draws once. How a still scene shows a change. */
  invalidate() {
    if (this.disposed) return;
    this.dirty = true;
    if (this.running) return;
    requestAnimationFrame(() => {
      if (this.disposed || this.running || !this.dirty) return;
      this.step(0);
      this.draw();
      this.dirty = false;
    });
  }

  setTier(id: TierId) {
    this.tier = TIERS[id];
    this.ctx.tier = this.tier;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.pixelRatio));
    if (this.tier.shadowMap === 0 && this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = false;
      this.scene.traverse((n) => {
        const m = (n as THREE.Mesh).material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.needsUpdate = true; });
      });
    }
    this.buildPipeline();
    this.fit();
  }

  get tierId() { return this.tier.id; }

  /** Moves the camera to a shot: at once when `cut`, otherwise flying with damping. */
  shot(shot: Shot, opts: { cut?: boolean; speed?: number } = {}) {
    this.goalPos.set(...shot.position);
    this.goalTarget.set(...shot.target);
    this.flySpeed = opts.speed ?? 1.9;
    if (opts.cut || this.opts.still) {
      this.camera.position.copy(this.goalPos);
      this.target.copy(this.goalTarget);
    }
    this.invalidate();
  }

  /** Plays a named timeline from its start. A still scene jumps to its end. */
  play(id: string) {
    const t = this.opts.scene.timelines.find((x) => x.id === id);
    if (!t) throw new Error(`Scene "${this.opts.scene.id}" has no timeline "${id}"`);
    if (this.opts.still) return;
    this.progress = 0;
    this.timelineRate = 1 / t.seconds;
    this.captureEnvironment();
  }

  setState(state: Record<string, unknown>) {
    Object.assign(this.ctx.state, state);
    this.invalidate();
  }

  fit() {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  /** The `pickId` of what is under a canvas point, walking up from the mesh hit. */
  pick(clientX: number, clientY: number): string | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = this.built.filter((b) => b.built.object.userData.pickable).map((b) => b.built.object);
    for (const hit of this.raycaster.intersectObjects(targets, true)) {
      for (let n: THREE.Object3D | null = hit.object; n; n = n.parent) {
        if (typeof n.userData.pickId === "string") return n.userData.pickId;
      }
    }
    return null;
  }

  /** Counts of live GPU resources: what the leak check watches. */
  info() {
    const m = this.renderer.info.memory;
    return { geometries: m.geometries, textures: m.textures, tier: this.tier.id };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.lost);
    for (const { built } of this.built) {
      built.dispose?.();
      disposeObject(built.object);
    }
    for (const { light } of this.lights) (light as THREE.DirectionalLight).shadow?.map?.dispose();
    this.built = [];
    this.envTarget?.dispose();
    this.pmrem.dispose();
    this.bloom?.dispose();
    this.composer?.dispose();
    this.scene.clear();
    this.renderer.dispose();
    // Browsers cap live contexts at about 16, so a context must end with its scene, not at garbage collection.
    this.renderer.forceContextLoss();
  }
}
