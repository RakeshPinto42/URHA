/**
 * The cinema runtime: turns a scene file into a running three.js scene, and tears it down
 * completely. Knows nothing of React or of any particular world. A world supplies generators.
 *
 * Rendering is physically based: tone mapped, with soft shadows from the sun, reflections
 * captured from the scene's own sky (nothing to download), and bloom, each scaled by the
 * quality tier. Under a still request it draws only when something changes.
 */
import * as THREE from "three";
import type { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FrameWatch, ResolutionGovernor, TIERS, nextTierDown, type Tier, type TierId } from "./quality";
import { diffScene } from "./editor";
import { raysPass } from "./rays";
import { ends, resolveNumber, type CinemaLight, type CinemaObject, type CinemaScene, type Vec3 } from "./schema";

/** What a generator receives each frame. */
export type Frame = { dt: number; time: number; progress: number; still: boolean; camera: THREE.Camera };

export type Built = {
  object: THREE.Object3D;
  update?: (f: Frame) => void;
  /** Disposes anything the generic scene walk cannot reach. */
  dispose?: () => void;
};

/** How generators reach files. Supplied by the host, so generators stay free of browser APIs. */
export type AssetSource = {
  models: { acquire: (src: string) => Promise<THREE.Object3D>; release: (src: string) => void };
  /** `data` textures hold numbers, not colours: normal and roughness maps. */
  loadTexture: (src: string, opts?: { data?: boolean }) => Promise<THREE.Texture>;
};

export type BuildContext = {
  tier: Tier; data: unknown; state: Record<string, unknown>; invalidate: () => void;
  assets?: AssetSource;
  /** A file failed. The object shows a marker, and the rest of the scene carries on. */
  assetFailed?: (src: string, why: string) => void;
};
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
  /** The first picture has been drawn, so the host can reveal it. */
  onFirstFrame?: () => void;
  /** False keeps the chosen tier whatever the frame rate. */
  watchFrames?: boolean;
  /** The host moves the camera itself, as the Studio does. */
  freeCamera?: boolean;
  assets?: AssetSource;
  onAssetError?: (src: string, why: string) => void;
};

const textureSlots = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "envMap", "bumpMap"] as const;

/**
 * Frees everything an object owns on the GPU. Exported so it can be tested without one.
 * Parts marked `sharedAsset` belong to the asset cache, which frees them when the last user lets go.
 */
export function disposeObject(root: THREE.Object3D, opts: { includeShared?: boolean } = {}) {
  const walk = (node: THREE.Object3D) => {
    if (node.userData.sharedAsset && !opts.includeShared) return;
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of materials) {
      for (const slot of textureSlots) (m as unknown as Record<string, THREE.Texture | undefined>)[slot]?.dispose?.();
      m.dispose();
    }
    (node as THREE.InstancedMesh).dispose?.();
    node.children.forEach(walk);
  };
  walk(root);
}

export class CinemaRuntime {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  private scene = new THREE.Scene();
  private clock = new THREE.Timer();
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private rays: ShaderPass | null = null;
  private lean = new THREE.Vector2();
  private leanGoal = new THREE.Vector2();
  private sunPoint = new THREE.Vector3();
  private rendered = false;
  private governor = new ResolutionGovernor();
  private frameNo = 0;
  private shadowAt = new THREE.Vector3(Infinity, 0, 0);
  /** Each object sits in a holder, so a placement never fights a generator's own positioning. */
  private built: { spec: CinemaObject; built: Built; holder: THREE.Group }[] = [];
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
  private fogScale = 1;
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
    // Shadows are redrawn on a cadence, not every frame: see draw().
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.pixelRatio));
    canvas.addEventListener("webglcontextlost", this.lost);

    this.camera = new THREE.PerspectiveCamera(spec.camera.fov, 1, spec.camera.near, spec.camera.far);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.ctx = { tier: this.tier, data: opts.data, state: {}, invalidate: () => this.invalidate(), assets: opts.assets, assetFailed: opts.onAssetError };

    const [fogFrom, fogTo] = ends(spec.environment.fog.color);
    this.fogFrom.set(fogFrom);
    this.fogTo.set(fogTo);
    this.scene.fog = new THREE.FogExp2(fogTo, spec.environment.fog.density);
    this.scene.background = new THREE.Color(fogTo);

    for (const l of spec.lights) this.addLight(l);
    for (const o of spec.objects) this.buildObject(o);
    this.linkParents();
    this.applyMaterials();
    this.buildPipeline();
    this.step(0);
    this.captureEnvironment();
    if (!opts.still) this.start();
  }

  private buildObject(o: CinemaObject) {
    const make = this.opts.generators[o.generator];
    if (!make) throw new Error(`Scene "${this.opts.scene.id}" uses unknown generator "${o.generator}"`);
    const built = make(o.params, this.ctx);
    const holder = new THREE.Group();
    holder.name = o.id;
    holder.add(built.object);
    this.scene.add(holder);
    const entry = { spec: o, built, holder };
    this.built.push(entry);
    this.place(entry);
  }

  /** A scene's settings over the shared materials a world's generators made. */
  private applyMaterials() {
    const shared = this.ctx.state.__mats as Record<string, THREE.MeshStandardMaterial> | undefined;
    if (!shared) return;
    for (const [name, m] of Object.entries(this.opts.scene.materials ?? {})) {
      const target = shared[name];
      if (!target) continue;
      if (m.color) target.color.set(m.color);
      if (m.roughness !== undefined) target.roughness = m.roughness;
      if (m.metalness !== undefined) target.metalness = m.metalness;
    }
  }

  /** Holders hang from their parents' holders, so a parent carries its children. */
  private linkParents() {
    for (const { spec, holder } of this.built) {
      const parent = spec.parent ? this.built.find((b) => b.spec.id === spec.parent)?.holder : null;
      const wanted = parent ?? this.scene;
      if (holder.parent !== wanted) wanted.add(holder);
    }
  }

  private place(entry: { spec: CinemaObject; holder: THREE.Group }) {
    const { spec, holder } = entry;
    holder.visible = spec.visible;
    const p = spec.placement;
    holder.position.set(...(p?.position ?? [0, 0, 0]));
    holder.rotation.set(...(p?.rotation ?? [0, 0, 0]));
    holder.scale.set(...(p?.scale ?? [1, 1, 1]));
  }

  private removeObject(id: string) {
    const i = this.built.findIndex((b) => b.spec.id === id);
    if (i < 0) return;
    const { built, holder } = this.built[i]!;
    for (const child of [...holder.children]) if (child !== built.object) this.scene.add(child); // Linked again after the edit.
    built.dispose?.();
    disposeObject(built.object);
    holder.removeFromParent();
    this.built.splice(i, 1);
  }

  private addLight(l: CinemaLight) {
    let light: THREE.Light;
    if (l.type === "ambient") light = new THREE.AmbientLight(l.color, 1);
    else if (l.type === "hemisphere") light = new THREE.HemisphereLight(l.sky, l.ground, 1);
    else if (l.type === "spot") {
      const spot = new THREE.SpotLight(l.color, 1, l.distance, l.angle, l.penumbra);
      spot.position.set(...l.position);
      spot.target.position.set(...l.target);
      this.scene.add(spot.target);
      if (l.castShadow && this.tier.shadowMap) { spot.castShadow = true; spot.shadow.mapSize.set(this.tier.shadowMap / 2, this.tier.shadowMap / 2); }
      light = spot;
    } else if (l.type === "point") {
      light = new THREE.PointLight(l.color, 1, l.distance);
      light.position.set(...l.position);
    } else {
      const sun = new THREE.DirectionalLight(l.color, 1);
      sun.position.set(...l.direction).normalize().multiplyScalar(220);
      if (l.castShadow && this.tier.shadowMap) {
        const range = this.opts.scene.environment.shadowRange ?? 150;
        sun.position.multiplyScalar(range / 150);
        this.sun = sun;
        sun.castShadow = true;
        sun.shadow.mapSize.set(this.tier.shadowMap, this.tier.shadowMap);
        const cam = sun.shadow.camera;
        cam.left = cam.bottom = -range; cam.right = cam.top = range; cam.near = 10; cam.far = range * 4.2;
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
    this.rays?.dispose();
    this.rays = null;
    if (this.tier.bloomScale === 0) return;
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(Math.max(size.x, 1), Math.max(size.y, 1), { type: THREE.HalfFloatType, samples: this.tier.msaa });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const rays = this.opts.scene.environment.rays;
    if (rays && this.tier.rays > 0) {
      this.rays = raysPass(this.tier.rays);
      this.rays.uniforms.uColor!.value.set(rays.color);
      this.composer.addPass(this.rays);
    }
    const res = new THREE.Vector2(size.x * this.tier.bloomScale, size.y * this.tier.bloomScale);
    this.bloom = new UnrealBloomPass(res, bloom.strength, bloom.radius, bloom.threshold);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  /** Lights the scene from its own sky, so materials reflect what you can see. */
  private captureEnvironment() {
    const source = this.built.find((b) => b.spec.environmentSource);
    if (!source) return;
    const hidden = this.scene.children.filter((c) => c !== source.holder && c.visible);
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

    if (this.opts.freeCamera) {
      // The host owns the camera.
    } else if (!this.opts.still) {
      const k = 1 - Math.exp(-Math.min(dt, 0.05) * this.flySpeed);
      this.camera.position.lerp(this.goalPos, k);
      this.target.lerp(this.goalTarget, k);
      // A slow breath, so the world is alive at rest.
      this.sway.set(Math.sin(this.time * 0.21) * 0.6, Math.sin(this.time * 0.17 + 1) * 0.35, 0);
      this.lean.lerp(this.leanGoal, 1 - Math.exp(-Math.min(dt, 0.05) * 3));
      this.sway.x += this.lean.x;
      this.sway.y += this.lean.y;
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
    for (const { built, spec, holder } of this.built) {
      built.update?.(frame);
      if (this.opts.still || !spec.motion) continue;
      const s = spec.motion.spin;
      if (s) { holder.rotation.x += s[0] * dt; holder.rotation.y += s[1] * dt; holder.rotation.z += s[2] * dt; }
      const f = spec.motion.float;
      if (f) holder.position.y = (spec.placement?.position[1] ?? 0) + Math.sin(this.time * f.speed) * f.height;
    }
    this.opts.onFrame?.(this.camera);
  }

  /** Aims the shaft pass at the sun, and fades it as the sun leaves the frame. */
  private aimRays() {
    const spec = this.opts.scene.environment.rays;
    if (!spec || !this.rays) return;
    this.camera.updateMatrixWorld();
    this.sunPoint.set(...spec.direction).normalize().multiplyScalar(800).add(this.camera.position).project(this.camera);
    const behind = this.sunPoint.z > 1;
    const off = Math.max(Math.abs(this.sunPoint.x), Math.abs(this.sunPoint.y));
    this.rays.uniforms.uSun!.value.set(this.sunPoint.x * 0.5 + 0.5, this.sunPoint.y * 0.5 + 0.5);
    this.rays.uniforms.uStrength!.value = behind ? 0 : spec.strength * Math.min(Math.max((1.6 - off) / 0.6, 0), 1);
  }

  private draw() {
    this.aimRays();
    this.frameNo += 1;
    // Shadows are redrawn when the view they cover moves, and otherwise only on the tier's slow cadence:
    // nothing that casts one moves at rest, and an every-other-frame pass makes uneven frames.
    const moved = this.sun ? this.sun.target.position.distanceToSquared(this.shadowAt) > 1 : false;
    if (!this.running || moved || this.frameNo % this.tier.shadowEvery === 1 || this.tier.shadowEvery <= 1) {
      this.renderer.shadowMap.needsUpdate = true;
      if (this.sun) this.shadowAt.copy(this.sun.target.position);
    }
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    if (!this.rendered) { this.rendered = true; this.opts.onFirstFrame?.(); }
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
    const scale = this.governor.record(dt * 1000);
    if (scale !== null) this.applyResolution();
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

  /** The pixel ratio: the tier's cap, scaled by what the frame rate allows. */
  private applyResolution() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.pixelRatio) * this.governor.scale);
    this.fit();
  }

  setTier(id: TierId) {
    this.tier = TIERS[id];
    this.ctx.tier = this.tier;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.tier.pixelRatio) * this.governor.scale);
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

  /** A small camera offset that follows the pointer, in world units. */
  setLean(x: number, y: number) { this.leanGoal.set(x, y); }

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

  /** Moves to an edited scene, doing only what changed, so editing stays fast. */
  sync(next: CinemaScene) {
    const d = diffScene(this.opts.scene, next);
    this.opts.scene = next;
    let recapture = false;
    for (const id of d.removeObjects) this.removeObject(id);
    for (const o of d.rebuildObjects) {
      this.removeObject(o.id);
      this.buildObject(o);
      recapture ||= !!o.environmentSource;
    }
    for (const o of d.addObjects) { this.buildObject(o); recapture ||= !!o.environmentSource; }
    for (const o of d.placeObjects) {
      const entry = this.built.find((b) => b.spec.id === o.id);
      if (entry) { entry.spec = o; this.place(entry); }
    }
    for (const id of d.removeLights) {
      const i = this.lights.findIndex((l) => l.spec.id === id);
      if (i < 0) continue;
      const { light } = this.lights[i]!;
      if (light === this.sun) { this.scene.remove(this.sun.target); this.sun = null; }
      if (light instanceof THREE.SpotLight) { this.scene.remove(light.target); light.dispose(); }
      (light as THREE.DirectionalLight).shadow?.map?.dispose();
      this.scene.remove(light);
      this.lights.splice(i, 1);
    }
    for (const l of d.addLights) this.addLight(l);
    this.linkParents();
    if (d.environment) {
      const env = next.environment;
      const [from, to] = ends(env.fog.color);
      this.fogFrom.set(from);
      this.fogTo.set(to);
      (this.scene.fog as THREE.FogExp2).density = env.fog.density * this.fogScale;
      if (this.bloom) { this.bloom.strength = env.bloom.strength; this.bloom.radius = env.bloom.radius; this.bloom.threshold = env.bloom.threshold; }
      if (env.rays && this.rays) this.rays.uniforms.uColor!.value.set(env.rays.color);
      else if (!!env.rays !== !!this.rays) this.buildPipeline();
    }
    if (d.camera) {
      this.camera.fov = next.camera.fov;
      this.camera.near = next.camera.near;
      this.camera.far = next.camera.far;
      this.camera.updateProjectionMatrix();
    }
    if (d.materials) this.applyMaterials();
    if (recapture) this.captureEnvironment();
    this.invalidate();
  }

  /** The holder of an object, for tools that move it. */
  holder(id: string): THREE.Object3D | null {
    return this.built.find((b) => b.spec.id === id)?.holder ?? null;
  }

  /** Adds an editing aid to the scene. It stays out of reflections, and the host disposes it. */
  addHelper(o: THREE.Object3D) { this.scene.add(o); }
  removeHelper(o: THREE.Object3D) { this.scene.remove(o); }

  /** Thins the fog for a distant viewpoint, without touching the scene. A way of looking, not an edit. */
  setFogScale(scale: number) {
    (this.scene.fog as THREE.FogExp2).density = this.opts.scene.environment.fog.density * scale;
    this.fogScale = scale;
    this.invalidate();
  }

  /** Where the shadow detail goes, when the host owns the camera. */
  focus(point: THREE.Vector3) { this.target.copy(point); }

  /** Sets the timeline position directly, for scrubbing in the Studio. */
  setProgress(p: number) {
    this.timelineRate = 0;
    this.progress = Math.min(Math.max(p, 0), 1);
    this.captureEnvironment();
    this.invalidate();
  }

  /** The object under a canvas point, ignoring the sky. */
  pickObject(clientX: number, clientY: number): string | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const holders = this.built.filter((b) => !b.spec.environmentSource && b.spec.visible).map((b) => b.holder);
    const hit = this.raycaster.intersectObjects(holders, true)[0];
    // The innermost holder, so clicking a child selects the child and not its parent.
    for (let n: THREE.Object3D | null = hit?.object ?? null; n; n = n.parent) {
      if (holders.includes(n as THREE.Group)) return n.name;
    }
    return null;
  }

  /** The `pickId` of what is under a canvas point, walking up from the mesh hit. */
  pick(clientX: number, clientY: number): string | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = this.built.filter((b) => b.built.object.userData.pickable).map((b) => b.holder);
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
    return { geometries: m.geometries, textures: m.textures, tier: this.tier.id, resolution: this.governor.scale, pixelRatio: this.renderer.getPixelRatio() };
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
    this.rays?.dispose();
    this.composer?.dispose();
    this.scene.clear();
    this.renderer.dispose();
    // Browsers cap live contexts at about 16, so a context must end with its scene, not at garbage collection.
    this.renderer.forceContextLoss();
  }
}
