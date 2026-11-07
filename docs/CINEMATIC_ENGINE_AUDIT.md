# 3D cinematic engine: audit and plan

Phases 1 to 3 of the owner's brief of 2026-11-07, dated the same day. Nothing in this document has been built. **Building starts when §8 is answered.**

## 1. Bottom line

- **The owner's criticism is correct.** URHA has one real 3D scene, built to be cheap, and its other "cinematic" surfaces are 2D paintings with a shader on top. That is the "static images pretending to be 3D" the brief rejects.
- **The foundation is reusable.** three.js and React Three Fiber are already installed, and `three` already ships the GLTF, Draco, transform, orbit and bloom tools. The engine and editor may need **no new runtime dependency**.
- **One decision blocks a sensible start.** Workbench and the Investment Hub exist only in `Nex_Ra_2.0`, which has no 3D at all, uses React 18 and Next 14, and has 216 uncommitted changes (§8).
- **Recommendation:** build a small scene engine that does not depend on React, in URHA first, and upgrade the Home journey as its first real scene. It is then portable to `Nex_Ra_2.0`.

## 2. What exists today

| Surface | Where | What it really is |
|---|---|---|
| The journey | Home, My Path | Real 3D: procedural terrain, trees, water, sky and landmarks. `components/journey/JourneyScene.tsx`, 815 lines |
| Living pictures | Section bands, Meditation | A 2D painting with a raw WebGL shader over it. **Not 3D** |
| Glass window | Home | CSS and GSAP |
| Section wipe | Between sections | CSS panes and GSAP |

| Stack item | URHA | `Nex_Ra_2.0` |
|---|---|---|
| Next and React | 16 and 19 | 14 and 18 |
| three.js and React Three Fiber | Installed | **Neither** |
| Animation | framer-motion, GSAP | framer-motion |
| Database | SQLite | Separate |
| Modules | Home, Path, Academy, Meditation | Academy, Workbench, Wealth (Investment Hub), Career, Music |

## 3. Why it feels flat

Each of these was a deliberate cost decision in `JOURNEY.md` §3, for an integrated GPU and ordinary phones. They were right for that budget and wrong for this brief.

| Cause | Effect you see |
|---|---|
| `meshLambertMaterial` only, with no physically based materials | Nothing has a highlight or a sense of material |
| No shadow maps | Objects float: nothing is anchored to the ground |
| No environment map or reflections | The lake and surfaces do not reflect the world |
| `flat` renderer, with no tone mapping | Colour clips instead of rolling off, so light has no range |
| No post-processing or bloom | Glows are sprites, not light |
| Terrain with smooth vertex colours | The land looks airbrushed, without surface detail |
| Primitive landmarks and no GLB models | Everything reads as a toy |
| A damped camera between fixed shots | The world is viewed, not moved through |
| Hard-coded scene | Every change needs a code edit, so no Studio is possible |

## 4. Reuse or replace

| Existing | Decision |
|---|---|
| three.js, React Three Fiber | Keep |
| Terrain, path and landmark geometry (`lib/journey/world.ts`) | Keep as procedural object types in the new scene format |
| Sky, water and beam shaders | Keep and upgrade |
| `Journey.tsx` wrapper: lazy loading, off-screen pause, WebGL fallback, Pause animation | Keep: this is the fallback system the brief asks for |
| Lambert materials, sprite glows, `flat` | Replace |
| Hard-coded scene composition | Replace with a JSON scene |
| Living pictures | Keep for now, as the low-tier fallback. Replace on a screen once it has a real scene |
| Navigation, sections, Meditation, progress data | Untouched |

## 5. Proposed architecture

```
public/cinema/scenes/*.json      Scene files: the single source of a cinematic
public/cinema/assets/*.glb       Optimised models

lib/cinema-engine/               No React. Portable to Nex_Ra_2.0.
  schema.ts                      Types and validation of scene JSON
  runtime.ts                     Builds, updates and fully disposes a scene
  loaders.ts                     GLTF and Draco, with a shared cache
  camera.ts                      Modes, paths, transitions
  quality.ts                     Picks high, medium, low or poster

components/cinema/               React wrappers only
  CinemaScene.tsx                Mounts a scene on any page
app/studio/                      The editor, local only
```

**Dependencies.** No new runtime dependency is expected. `GLTFLoader`, `DRACOLoader`, `TransformControls`, `OrbitControls` and the bloom pass all ship inside `three`. `@react-three/drei` stays out, for the reasons in `JOURNEY.md` §3. One development-only tool is added for assets: `@gltf-transform/cli` (MIT).

**A framework-free engine** is the key choice. React Three Fiber 9 needs React 19, which `Nex_Ra_2.0` does not have. Raw `three` works in both, so modules there can share the engine without an upgrade.

**Studio storage.** Scene files live in the repository, so they are versioned, and JSON import and export work on the same format. The Studio is available only in development. URHA has no login, so a hosted build must not expose an editor that writes files.

**Security.** Imported JSON is untrusted: it is validated against the schema, and assets may only come from local paths. The current content security policy needs one change for Draco, which uses WebAssembly: `'wasm-unsafe-eval'` in `script-src`. The decoder is served locally (1.8 MB, already in `three`).

## 6. Performance plan

| Tier | When | Includes |
|---|---|---|
| High | Dedicated GPU | Shadows, environment reflections, bloom, full particles |
| Medium | Integrated GPU | Shadows at low resolution, bloom at half resolution, fewer particles |
| Low | Phones and weak GPUs | No shadows or bloom, simplified geometry |
| Poster | No WebGL, reduced motion, or a sustained low frame rate | Still image or living picture, with full functionality |

- The tier is chosen on load and steps down automatically if the frame rate stays low.
- Scenes load lazily, and only one runs at a time. Rendering stops off-screen and in hidden tabs, as it does now.
- Every scene switch disposes geometry, materials, textures and render targets. A test will mount and unmount a scene repeatedly and check that `renderer.info` returns to its baseline.

**Reference machine:** GTX 1650, with a Radeon integrated GPU (`JOURNEY.md` §1). My test browser renders in software, so **I cannot measure real frame rates**. The owner will need to judge smoothness on their own machine.

## 7. Asset pipeline

`npm run assets:optimize` runs `gltf-transform` to de-duplicate, resize textures, convert them to WebP and apply Draco where suitable, writing to `public/cinema/assets/`. Each asset's source and licence go in `public/cinema/credits.json` and appear on `/credits`, as the paintings do today.

[optimizeglb.com](https://optimizeglb.com/) stays useful for one-off files: by its own description it runs in the browser and does not upload models. It advises enabling Draco only when the target loader supports it, which this engine will.

Sources, each confirmed reachable today. **Licences must be checked per asset before use.**

| Source | Use |
|---|---|
| [Poly Haven HDRIs](https://polyhaven.com/hdris) and [models](https://polyhaven.com/models) | Environment lighting and models |
| [ambientCG](https://ambientcg.com/) | Surface textures |
| [Kenney](https://kenney.nl/assets) | Low-poly models |
| [Quaternius](https://quaternius.com/) | Low-poly models |
| [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) | Test models for the loader and Studio |

## 8. Decisions needed

1. **Where is the engine built?** Recommended: URHA first, as a framework-free engine, then ported. Building in `Nex_Ra_2.0` first means adding three.js beside 216 uncommitted changes.
2. **Does this come before or after Stage 4 of the career PRD?** The two do not conflict. Recommended: finish Stage 3, then do the engine's first two steps below, because the upgrade is what the owner has asked about most.
3. **What look should the world have?** The brief asks for a "futuristic AI operating system", while URHA's identity is a dawn journey through stained glass. Options: keep the journey and render it with real materials and light; or a futuristic world for the work modules while Meditation keeps its calm. Recommended: both, using one scene per module, which the engine supports.

## 9. Implementation plan

The brief's phases 4 to 7, in order. Each step ends with something visible.

| Step | Work | Done when |
|---|---|---|
| 1 | Engine core: schema, runtime, disposal, quality tiers | The Well loads from JSON and looks the same |
| 2 | Real rendering: PBR, shadows, tone mapping, environment map, bloom | The Home journey has real light and depth, on all tiers |
| 3 | Studio: hierarchy, transforms, lights, materials, cameras | A scene can be edited without touching code |
| 4 | Export and import | A scene round-trips through JSON exactly (tested) |
| 5 | GLB pipeline and first real models | Primitive landmarks are replaced by optimised models |
| 6 | Animation: object, camera and sequences | Home's sunrise is authored in the Studio |
| 7 | Module scenes | Academy gets its own world; Workbench and Investment Hub follow the decision in §8 |
| 8 | Performance, memory and regression tests | Disposal test passes; every existing screen still works |
