"use client";
/**
 * The Cinematic Studio (docs/CINEMATIC_ENGINE_AUDIT.md): edit a scene without touching code.
 *
 * The scene JSON is the only state that matters. Every control turns into a pure edit from
 * lib/cinema-engine/editor.ts, which goes through history, so undo, redo, import and save
 * all work the same way, and the viewport simply syncs to the result.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAMERA_VIEWS, type CameraView } from "@/lib/cinema-engine/camera-views";
import {
  addLight, addObject, blankScene, commit, duplicateLight, duplicateObject, importScene, redo, removeLight, removeObject, renameObject,
  serializeScene, startHistory, undo, updateLight, updateObject, defaultPlacement, type History, type NewLight,
} from "@/lib/cinema-engine/editor";
import { SHAPES } from "@/lib/cinema-engine/generators";
import { TIERS, isTierId, pickTier, type TierId } from "@/lib/cinema-engine/quality";
import { parseScene, type CinemaLight, type CinemaObject, type CinemaScene, type Placement, type Vec3 } from "@/lib/cinema-engine/schema";
import { JOURNEY_GENERATORS } from "@/lib/journey/scene-objects";
import { AnimatedColor, AnimatedNumber, CheckField, ColorField, NumberField, ParamFields, Section, SelectField, TextField, Vec3Field } from "./fields";
import { StudioViewport, type GizmoMode, type ViewportHandle } from "./StudioViewport";

const KNOWN = Object.keys(JOURNEY_GENERATORS);
const BTN = "inline-flex h-8 items-center rounded border border-[#3a3f52] bg-[#1a1d29] px-2.5 text-[12px] text-[#efe9df] hover:bg-[#262a38] disabled:opacity-40 aria-pressed:border-[#d9b56f] aria-pressed:text-[#d9b56f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b56f]";
const ROW = "group flex h-8 items-center gap-1 px-2 text-[12px]";

const LIGHTS: { label: string; light: NewLight }[] = [
  { label: "Ambient", light: { type: "ambient", color: "#ffffff", intensity: 0.4 } },
  { label: "Directional", light: { type: "directional", color: "#fff1dc", intensity: 2, direction: [0.5, 0.8, 0.3] } },
  { label: "Point", light: { type: "point", color: "#ffb060", intensity: 60, position: [0, 12, 0], distance: 60 } },
  { label: "Spot", light: { type: "spot", color: "#ffffff", intensity: 300, position: [0, 30, 0], target: [0, 0, 0], angle: 0.5, penumbra: 0.4, distance: 120, castShadow: true } },
];

type Selection = { kind: "object" | "light"; id: string } | null;
type Notice = { kind: "ok" | "error"; text: string; details?: string[] } | null;

export default function Studio({ sceneIds }: { sceneIds: string[] }) {
  const [history, setHistory] = useState<History>(() => startHistory(blankScene()));
  const [saved, setSaved] = useState<string>(() => serializeScene(blankScene()));
  const [session, setSession] = useState("blank");
  const [fileId, setFileId] = useState<string | null>(null); // The saved file this scene came from.
  const [ids, setIds] = useState(sceneIds);
  const [selection, setSelection] = useState<Selection>(null);
  const [gizmo, setGizmo] = useState<GizmoMode>("translate");
  const [view, setView] = useState<CameraView>("orbit");
  const [tier, setTier] = useState<TierId>("medium");
  const [notice, setNotice] = useState<Notice>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [progress, setProgress] = useState(1);
  const viewport = useRef<ViewportHandle>(null);
  const importer = useRef<HTMLInputElement>(null);

  const scene = history.present;
  const dirty = serializeScene(scene) !== saved;
  const problems = useMemo(() => { const r = parseScene(scene); return r.ok ? [] : r.errors; }, [scene]);
  const edit = useCallback((next: CinemaScene, key: string | null = null) => setHistory((h) => commit(h, next, key)), []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const override = new URLSearchParams(window.location.search).get("cinema");
    setTier(pickTier({ renderer: gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : null, mobile: false, override }));
  }, []);

  const open = useCallback(async (id: string) => {
    if (dirty && !window.confirm("Discard the unsaved changes to this scene?")) return;
    try {
      const r = await fetch(`/cinema/scenes/${encodeURIComponent(id)}.json`, { cache: "no-store" });
      if (!r.ok) throw new Error(`The scene file could not be read (HTTP ${r.status}).`);
      const parsed = importScene(await r.text(), KNOWN);
      if (!parsed.ok) { setNotice({ kind: "error", text: `${id} has problems and was not opened.`, details: parsed.errors }); return; }
      setHistory(startHistory(parsed.scene));
      setSaved(serializeScene(parsed.scene));
      setSelection(null);
      setFileId(id);
      setSession(`${id}:${Date.now()}`);
      setNotice(null);
      setFailure(null);
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "The scene could not be opened." });
    }
  }, [dirty]);

  const newScene = () => {
    if (dirty && !window.confirm("Discard the unsaved changes to this scene?")) return;
    const s = blankScene();
    setHistory(startHistory(s));
    setSaved(serializeScene(s));
    setSelection(null);
    setFileId(null);
    setSession(`blank:${Date.now()}`);
  };

  const save = async () => {
    setNotice(null);
    // Saving over the file you opened is the point; saving over a different one is an accident.
    if (ids.includes(scene.id) && scene.id !== fileId && !window.confirm(`A scene called ${scene.id} already exists. Replace it?`)) return;
    const r = await fetch("/api/studio/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: serializeScene(scene) }).catch(() => null);
    if (!r) { setNotice({ kind: "error", text: "Saving failed: the server did not respond." }); return; }
    const body = await r.json().catch(() => ({})) as { error?: string; details?: string[]; saved?: string };
    if (!r.ok) { setNotice({ kind: "error", text: body.error ?? "Saving failed.", details: body.details }); return; }
    setSaved(serializeScene(scene));
    setFileId(scene.id);
    setIds((list) => [...new Set([...list, scene.id])].sort());
    setNotice({ kind: "ok", text: `Saved ${scene.id}.json` });
  };

  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([serializeScene(scene)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scene.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    if (file.size > 1_000_000) { setNotice({ kind: "error", text: "This file is too large to be a scene." }); return; }
    const parsed = importScene(await file.text(), KNOWN);
    if (!parsed.ok) { setNotice({ kind: "error", text: `${file.name} was not imported.`, details: parsed.errors }); return; }
    edit(parsed.scene); // An edit like any other, so importing can be undone.
    setSelection(null);
    setNotice({ kind: "ok", text: `Imported ${file.name}. Undo restores the previous scene.` });
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches?.("input, textarea, select")) return;
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") { e.preventDefault(); setHistory(e.shiftKey ? redo : undo); }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyY") { e.preventDefault(); setHistory(redo); }
    };
    const leave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", key);
    window.addEventListener("beforeunload", leave);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("beforeunload", leave); };
  }, [dirty]);

  const selectedObject = selection?.kind === "object" ? scene.objects.find((o) => o.id === selection.id) ?? null : null;
  const selectedLight = selection?.kind === "light" ? scene.lights.find((l) => l.id === selection.id) ?? null : null;

  const place = useCallback((id: string, placement: Placement) => setHistory((h) => commit(h, updateObject(h.present, id, { placement }))), []);
  const pick = useCallback((id: string | null) => setSelection(id ? { kind: "object", id } : null), []);
  const fail = useCallback((m: string) => setFailure(m), []);

  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-[#0b0d14] text-[#efe9df]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[#262a38] px-3 py-2">
        <h1 className="mr-2 text-[14px] font-semibold">Cinematic Studio</h1>
        <label className="flex items-center gap-1 text-[12px] text-[#b8ad9c]">
          <span>Scene</span>
          <select className={BTN} value="" onChange={(e) => { if (e.target.value) void open(e.target.value); }}>
            <option value="">Open…</option>
            {ids.map((id) => <option key={id}>{id}</option>)}
          </select>
        </label>
        <button type="button" className={BTN} onClick={newScene}>New</button>
        <button type="button" className={BTN} onClick={save} disabled={problems.length > 0}>Save</button>
        <button type="button" className={BTN} onClick={exportFile}>Export JSON</button>
        <button type="button" className={BTN} onClick={() => importer.current?.click()}>Import JSON</button>
        <input ref={importer} type="file" accept="application/json,.json" className="sr-only" aria-label="Import a scene file" tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importFile(f); }} />
        <span className="mx-1 h-5 w-px bg-[#262a38]" />
        <button type="button" className={BTN} disabled={!history.past.length} onClick={() => setHistory(undo)}>Undo</button>
        <button type="button" className={BTN} disabled={!history.future.length} onClick={() => setHistory(redo)}>Redo</button>
        <span className="ml-auto text-[12px] text-[#b8ad9c]" role="status">{scene.title}{dirty ? ", unsaved changes" : ""}</span>
        <a href="/" className={BTN}>Back to URHA</a>
      </header>

      {(notice || problems.length > 0) && (
        <div role="alert" className={`border-b border-[#262a38] px-3 py-1.5 text-[12px] ${notice?.kind === "ok" && !problems.length ? "text-[#9fd8a8]" : "text-[#f0b35a]"}`}>
          {problems.length > 0 ? `This scene cannot be saved yet: ${problems.join("; ")}` : notice?.text}
          {notice?.details && <ul className="mt-1 list-disc pl-5">{notice.details.slice(0, 6).map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside aria-label="Scene hierarchy" className="flex max-h-[34vh] w-full flex-none flex-col overflow-y-auto border-b border-[#262a38] lg:max-h-none lg:w-[240px] lg:border-b-0 lg:border-r">
          <Section title="Add">
            <div className="flex flex-wrap gap-1">
              {SHAPES.map((shape) => (
                <button key={shape} type="button" className={BTN} onClick={() => {
                  const next = addObject(scene, { id: shape, generator: "primitive", visible: true, placement: { ...defaultPlacement(), position: [0, 4, 0] }, params: { shape, size: 8, color: "#d9b56f", metalness: 0.3, roughness: 0.4, emissive: "#000000", emissiveIntensity: 0 } });
                  edit(next);
                  setSelection({ kind: "object", id: next.objects.at(-1)!.id });
                }}>{shape}</button>
              ))}
              <button type="button" className={BTN} onClick={() => {
                const next = addObject(scene, { id: "particles", generator: "particles", visible: true, params: { count: 300, color: "#ffd28a", area: 80, height: 24, size: 70 } });
                edit(next);
                setSelection({ kind: "object", id: next.objects.at(-1)!.id });
              }}>particles</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {LIGHTS.map(({ label, light }) => (
                <button key={label} type="button" className={BTN} onClick={() => {
                  const next = addLight(scene, light);
                  edit(next);
                  setSelection({ kind: "light", id: next.lights.at(-1)!.id });
                }}>{label}</button>
              ))}
            </div>
          </Section>

          <Section title={`Objects (${scene.objects.length})`}>
            <ul className="-mx-3">
              {scene.objects.map((o) => (
                <li key={o.id} className={`${ROW} ${selection?.id === o.id ? "bg-[#262a38]" : ""}`}>
                  <button type="button" className="min-w-0 flex-1 truncate text-left hover:underline" aria-pressed={selection?.id === o.id}
                    onClick={() => setSelection({ kind: "object", id: o.id })}>{o.id}</button>
                  <button type="button" className="text-[11px] text-[#b8ad9c] hover:text-white" aria-label={`${o.visible ? "Hide" : "Show"} ${o.id}`}
                    onClick={() => edit(updateObject(scene, o.id, { visible: !o.visible }))}>{o.visible ? "Hide" : "Show"}</button>
                  <button type="button" className="text-[11px] text-[#b8ad9c] hover:text-white" aria-label={`Duplicate ${o.id}`}
                    onClick={() => edit(duplicateObject(scene, o.id))}>Copy</button>
                  <button type="button" className="text-[11px] text-[#f0b35a] hover:text-white" aria-label={`Remove ${o.id}`}
                    onClick={() => { edit(removeObject(scene, o.id)); if (selection?.id === o.id) setSelection(null); }}>Remove</button>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={`Lights (${scene.lights.length})`}>
            <ul className="-mx-3">
              {scene.lights.map((l) => (
                <li key={l.id} className={`${ROW} ${selection?.id === l.id ? "bg-[#262a38]" : ""}`}>
                  <button type="button" className="min-w-0 flex-1 truncate text-left hover:underline" aria-pressed={selection?.id === l.id}
                    onClick={() => setSelection({ kind: "light", id: l.id })}>{l.id}</button>
                  <button type="button" className="text-[11px] text-[#b8ad9c] hover:text-white" aria-label={`Duplicate ${l.id}`}
                    onClick={() => edit(duplicateLight(scene, l.id))}>Copy</button>
                  <button type="button" className="text-[11px] text-[#f0b35a] hover:text-white" aria-label={`Remove ${l.id}`}
                    onClick={() => { edit(removeLight(scene, l.id)); if (selection?.id === l.id) setSelection(null); }}>Remove</button>
                </li>
              ))}
            </ul>
          </Section>
        </aside>

        <main className="relative isolate flex min-h-[320px] min-w-0 flex-1 flex-col">
          <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
            {(["translate", "rotate", "scale"] as const).map((m) => (
              <button key={m} type="button" className={BTN} aria-pressed={gizmo === m} onClick={() => setGizmo(m)}>{m === "translate" ? "Move" : m === "rotate" ? "Rotate" : "Scale"}</button>
            ))}
            <span className="w-2" />
            {CAMERA_VIEWS.map((v) => (
              <button key={v.id} type="button" className={BTN} aria-pressed={view === v.id} onClick={() => setView(v.id)}>{v.label}</button>
            ))}
            <span className="w-2" />
            <label className="flex items-center gap-1 rounded bg-[#0b0d14]/70 pl-2 text-[12px] text-[#b8ad9c]">
              Quality
              <select className={BTN} value={tier} onChange={(e) => { if (isTierId(e.target.value)) setTier(e.target.value); }}>
                {Object.keys(TIERS).map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>
          {failure ? (
            <div role="alert" className="grid flex-1 place-items-center p-6 text-center text-[14px] text-[#f0b35a]">
              <p>The preview could not start: {failure}<br />Your scene is safe, and you can still edit, save and export it.</p>
            </div>
          ) : (
            <div className="relative flex-1">
              <StudioViewport ref={viewport} scene={scene} session={session} tier={tier} selectedId={selection?.kind === "object" ? selection.id : null}
                gizmo={gizmo} view={view} onSelect={pick} onPlace={place} onFailure={fail} />
            </div>
          )}
          {!CAMERA_VIEWS.find((v) => v.id === view)?.orbits && (
            <p className="pointer-events-none absolute bottom-14 left-2 z-10 rounded bg-[#0b0d14]/70 px-2 py-1 text-[12px] text-[#b8ad9c]">
              {view === "third-person" && selection?.kind === "object" ? "W, A, S, D move the selected object. Q and E lower and raise it." : "W, A, S, D move. Q and E go down and up. Drag to look."}
            </p>
          )}
          <div className="z-10 flex items-center gap-2 border-t border-[#262a38] bg-[#0b0d14] px-3 py-2">
            <label className="flex flex-1 items-center gap-2 text-[12px] text-[#b8ad9c]">
              Timeline
              <input type="range" min={0} max={1} step={0.01} value={progress} className="flex-1 accent-[#d9b56f]"
                onChange={(e) => { const p = e.target.valueAsNumber; setProgress(p); viewport.current?.scrub(p); }} />
            </label>
            {scene.timelines.map((t) => (
              <button key={t.id} type="button" className={BTN} onClick={() => viewport.current?.play(t.id)}>Play {t.id}</button>
            ))}
          </div>
        </main>

        <aside aria-label="Inspector" className="max-h-[40vh] w-full flex-none overflow-y-auto border-t border-[#262a38] lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0">
          {selectedObject ? <ObjectInspector key={selectedObject.id} o={selectedObject} scene={scene} edit={edit} onRenamed={(id) => setSelection({ kind: "object", id })} />
            : selectedLight ? <LightInspector key={selectedLight.id} l={selectedLight} scene={scene} edit={edit} />
            : <SceneInspector scene={scene} edit={edit} currentView={() => viewport.current?.currentView() ?? null} />}
        </aside>
      </div>
    </div>
  );
}

type Edit = (next: CinemaScene, key?: string | null) => void;

function ObjectInspector({ o, scene, edit, onRenamed }: { o: CinemaObject; scene: CinemaScene; edit: Edit; onRenamed: (id: string) => void }) {
  const p = o.placement ?? defaultPlacement();
  const m = o.motion ?? {};
  const set = (patch: Partial<CinemaObject>, key: string) => edit(updateObject(scene, o.id, patch), `${o.id}.${key}`);
  const deg = (r: Vec3) => r.map((n) => Number(((n * 180) / Math.PI).toFixed(1))) as Vec3;
  const rad = (d: Vec3) => d.map((n) => Number(((n * Math.PI) / 180).toFixed(4))) as Vec3;
  return (
    <>
      <Section title="Object">
        <TextField label="Id" value={o.id} onChange={(v) => {
          const next = renameObject(scene, o.id, v.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^[^a-z]+/, "") || o.id);
          edit(next);
          onRenamed(next.objects.find((x) => x.params === o.params)?.id ?? o.id);
        }} />
        <p className="text-[12px] text-[#9a8f7f]">Type: {o.generator}</p>
        <CheckField label="Visible" value={o.visible} onChange={(visible) => set({ visible }, "visible")} />
      </Section>
      <Section title="Transform">
        <Vec3Field label="Position" value={p.position} onChange={(position) => set({ placement: { ...p, position } }, "position")} />
        <Vec3Field label="Rotation, degrees" value={deg(p.rotation)} step={5} onChange={(v) => set({ placement: { ...p, rotation: rad(v) } }, "rotation")} />
        <Vec3Field label="Scale" value={p.scale} step={0.1} onChange={(scale) => set({ placement: { ...p, scale } }, "scale")} />
      </Section>
      <Section title="Animation">
        <Vec3Field label="Spin, radians a second" value={m.spin ?? [0, 0, 0]} step={0.1} onChange={(spin) => set({ motion: { ...m, spin } }, "spin")} />
        <NumberField label="Float height" value={m.float?.height ?? 0} onChange={(height) => set({ motion: { ...m, float: { height, speed: m.float?.speed ?? 1 } } }, "floatHeight")} />
        <NumberField label="Float speed" value={m.float?.speed ?? 1} onChange={(speed) => set({ motion: { ...m, float: { height: m.float?.height ?? 0, speed } } }, "floatSpeed")} />
      </Section>
      {Object.keys(o.params).length > 0 && (
        <Section title="Material and settings">
          {o.generator === "primitive" && <SelectField label="shape" value={String(o.params.shape ?? "box")} options={SHAPES} onChange={(shape) => set({ params: { ...o.params, shape } }, "shape")} />}
          <ParamFields params={o.generator === "primitive" ? Object.fromEntries(Object.entries(o.params).filter(([k]) => k !== "shape")) : o.params}
            onChange={(next) => set({ params: o.generator === "primitive" ? { ...next, shape: o.params.shape } : next }, "params")} />
        </Section>
      )}
    </>
  );
}

function LightInspector({ l, scene, edit }: { l: CinemaLight; scene: CinemaScene; edit: Edit }) {
  const set = (patch: Record<string, unknown>, key: string) => edit(updateLight(scene, l.id, patch as Partial<CinemaLight>), `${l.id}.${key}`);
  return (
    <Section title={`${l.type} light: ${l.id}`}>
      {"color" in l && <ColorField label="Colour" value={l.color} onChange={(color) => set({ color }, "color")} />}
      {l.type === "hemisphere" && <>
        <ColorField label="Sky" value={l.sky} onChange={(sky) => set({ sky }, "sky")} />
        <ColorField label="Ground" value={l.ground} onChange={(ground) => set({ ground }, "ground")} />
      </>}
      <AnimatedNumber label="Intensity" value={l.intensity} onChange={(intensity) => set({ intensity }, "intensity")} />
      {l.type === "directional" && <>
        <Vec3Field label="Direction" value={l.direction} step={0.1} onChange={(direction) => set({ direction }, "direction")} />
        <CheckField label="Casts shadows" value={!!l.castShadow} onChange={(castShadow) => set({ castShadow }, "shadow")} />
      </>}
      {(l.type === "point" || l.type === "spot") && <>
        <Vec3Field label="Position" value={l.position} onChange={(position) => set({ position }, "position")} />
        <NumberField label="Distance" value={l.distance} onChange={(distance) => set({ distance }, "distance")} step={1} min={1} />
      </>}
      {l.type === "spot" && <>
        <Vec3Field label="Target" value={l.target} onChange={(target) => set({ target }, "target")} />
        <NumberField label="Angle, radians" value={l.angle} onChange={(angle) => set({ angle }, "angle")} step={0.05} min={0.05} max={1.57} />
        <NumberField label="Penumbra" value={l.penumbra} onChange={(penumbra) => set({ penumbra }, "penumbra")} step={0.05} min={0} max={1} />
        <CheckField label="Casts shadows" value={!!l.castShadow} onChange={(castShadow) => set({ castShadow }, "shadow")} />
      </>}
    </Section>
  );
}

function SceneInspector({ scene, edit, currentView }: { scene: CinemaScene; edit: Edit; currentView: () => { position: Vec3; target: Vec3 } | null }) {
  const env = scene.environment;
  const setEnv = (patch: Partial<CinemaScene["environment"]>, key: string) => edit({ ...scene, environment: { ...env, ...patch } }, `env.${key}`);
  const setCam = (patch: Partial<CinemaScene["camera"]>, key: string) => edit({ ...scene, camera: { ...scene.camera, ...patch } }, `camera.${key}`);
  return (
    <>
      <Section title="Scene">
        <TextField label="Title" value={scene.title} onChange={(title) => edit({ ...scene, title })} />
        <TextField label="File name" value={scene.id} onChange={(id) => edit({ ...scene, id: id.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} />
      </Section>
      <Section title="Camera">
        <NumberField label="Field of view" value={scene.camera.fov} onChange={(fov) => setCam({ fov }, "fov")} step={1} min={10} max={120} />
        <NumberField label="Movement speed" value={scene.camera.speed ?? 16} onChange={(speed) => setCam({ speed }, "speed")} step={1} min={1} />
        <button type="button" className={BTN} onClick={() => { const v = currentView(); if (v) setCam(v, "shot"); }}>Use this view as the scene&apos;s camera</button>
      </Section>
      <Section title="Fog and atmosphere">
        <AnimatedColor label="Fog colour" value={env.fog.color} onChange={(color) => setEnv({ fog: { ...env.fog, color } }, "fogColor")} />
        <NumberField label="Fog density" value={env.fog.density} onChange={(density) => setEnv({ fog: { ...env.fog, density } }, "fogDensity")} step={0.0002} min={0} />
      </Section>
      <Section title="Light response">
        <AnimatedNumber label="Exposure" value={env.exposure} onChange={(exposure) => setEnv({ exposure }, "exposure")} />
        <AnimatedNumber label="Reflections" value={env.reflections} onChange={(reflections) => setEnv({ reflections }, "reflections")} />
      </Section>
      <Section title="Bloom">
        <NumberField label="Strength" value={env.bloom.strength} onChange={(strength) => setEnv({ bloom: { ...env.bloom, strength } }, "bloomStrength")} step={0.02} min={0} />
        <NumberField label="Radius" value={env.bloom.radius} onChange={(radius) => setEnv({ bloom: { ...env.bloom, radius } }, "bloomRadius")} step={0.05} min={0} />
        <NumberField label="Threshold" value={env.bloom.threshold} onChange={(threshold) => setEnv({ bloom: { ...env.bloom, threshold } }, "bloomThreshold")} step={0.05} min={0} />
      </Section>
      <Section title="Timelines">
        {scene.timelines.map((t, i) => (
          <NumberField key={t.id} label={`${t.id}, seconds`} value={t.seconds} step={0.5} min={0.5}
            onChange={(seconds) => edit({ ...scene, timelines: scene.timelines.map((x, n) => (n === i ? { ...x, seconds } : x)) }, `timeline.${t.id}`)} />
        ))}
        <button type="button" className={BTN} onClick={() => edit({ ...scene, timelines: [...scene.timelines, { id: `timeline-${scene.timelines.length + 1}`, seconds: 5 }] })}>Add a timeline</button>
      </Section>
    </>
  );
}
