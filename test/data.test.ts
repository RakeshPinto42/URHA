import { beforeEach, describe, expect, it } from "vitest";
import { openDb, seed, syncContent } from "@/lib/db";
import * as data from "@/lib/data";
import { PHASES } from "@/lib/curriculum";
import { RESOURCES } from "@/lib/resources";
import { parseAudioForm, parseResourceForm, parseSettings, parseStep, parseTaskForm, parseUrl } from "@/lib/validate";
import { quoteForDay, QUOTES, resolveQuote } from "@/lib/quotes";
import { COLLECTIONS, passageText } from "@/lib/scripture";
import { REFLECTIONS } from "@/lib/reflections";

// Each test gets a fresh in-memory database through the same global the app uses.
const g = globalThis as unknown as { __urhaDb?: ReturnType<typeof openDb> };
beforeEach(() => {
  g.__urhaDb?.close();
  g.__urhaDb = openDb(":memory:");
});

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("seed", () => {
  it("seeds the full curriculum once", () => {
    const path = data.getPath();
    expect(path.phases).toHaveLength(7);
    const subCount = PHASES.flatMap((p) => p.topics.flatMap((t) => t.subtopics)).length;
    expect(path.overall.total).toBe(subCount);
    expect(data.getResources()).toHaveLength(RESOURCES.length);
    expect(path.currentPhaseId).toBe("p1");
    // Phase 1 topics have no prerequisites → ready; later ones are not started.
    expect(path.phases[0]!.topics.every((t) => t.status === "ready")).toBe(true);
    expect(path.phases[1]!.topics.find((t) => t.id === "backend-engineering")!.status).toBe("not-started");
    // Road covers 24 months and every subtopic is scheduled.
    expect(path.road).toHaveLength(24);
    expect(path.road.reduce((s, m) => s + m.total, 0)).toBe(subCount);
  });
  it("re-opening does not re-seed over user data", () => {
    const db = g.__urhaDb!;
    db.prepare("UPDATE topics SET title = 'Edited' WHERE id = 'mcp'").run();
    seed(db);
    expect(data.getPath().topicTitles.mcp).toBe("Edited");
  });
});

describe("progress", () => {
  const sub = "python-engineering:type-hints";
  it("proficiency requires evidence, at the DAL and in the database", () => {
    expect(() => data.setStep(sub, "proficient", true, null)).toThrow(/Evidence/);
    expect(() => g.__urhaDb!.prepare("INSERT INTO subtopic_progress (user_id, subtopic_id, exposed_at, practised_at, proficient_at) VALUES (1, ?, 'x', 'x', 'x')").run(sub)).toThrow(/CHECK/);
    data.setStep(sub, "proficient", true, "https://github.com/me/ledgersync/pull/3");
    const t = data.getPath().phases[0]!.topics.find((x) => x.id === "python-engineering")!;
    const s = t.subtopics.find((x) => x.id === sub)!;
    expect(s.progress).toEqual({ exposed: true, practised: true, proficient: true });
    expect(s.evidence).toContain("pull/3");
    expect(t.status).toBe("in-progress");
  });
  it("completing every subtopic of a topic makes dependants ready", () => {
    const path = data.getPath();
    for (const id of ["python-engineering", "sql-foundations"]) {
      path.phases[0]!.topics.find((t) => t.id === id)!.subtopics.forEach((s) => data.setStep(s.id, "practised", true, null));
    }
    const after = data.getPath();
    expect(after.phases[0]!.topics.find((t) => t.id === "python-engineering")!.status).toBe("completed");
    expect(after.phases[1]!.topics.find((t) => t.id === "backend-engineering")!.status).toBe("ready");
  });
  it("exposure alone never completes a topic", () => {
    data.getPath().phases[0]!.topics[0]!.subtopics.forEach((s) => data.setStep(s.id, "exposed", true, null));
    expect(data.getPath().phases[0]!.topics[0]!.status).toBe("in-progress");
  });
  it("unknown subtopics are rejected", () => {
    expect(() => data.setStep("nope:nope", "exposed", true, null)).toThrow(/not found/);
  });
});

describe("tasks", () => {
  const base = { title: "Write pytest fixtures", description: "", category: "practise" as const, phaseId: "p1", topicId: "software-engineering",
    skillId: "python", resourceId: null, priority: 1 as const, estMinutes: 60, dueDate: "2026-11-02", deliverable: "", recurrence: "none" as const };

  it("creates, completes with actual time and reports the week", () => {
    const id = data.createTask(base);
    data.setTaskStatus(id, "done", { actualMinutes: 75 }, "2026-11-03");
    const w = data.weekStats("2026-11-04");
    expect(w.actualMinutes).toBe(75);
    expect(w.plannedMinutes).toBe(60);
    expect(data.getTask(id)!.completedOn).toBe("2026-11-03");
  });
  it("recurring completion creates exactly one next occurrence", () => {
    const id = data.createTask({ ...base, recurrence: "weekly" });
    data.setTaskStatus(id, "done", {}, "2026-11-02");
    data.setTaskStatus(id, "done", {}, "2026-11-02"); // retry / double click
    const all = data.listTasks();
    expect(all).toHaveLength(2);
    expect(all.find((t) => t.id !== id)!.dueDate).toBe("2026-11-09");
    // reopening and completing again does not duplicate either
    data.setTaskStatus(id, "todo", {});
    data.setTaskStatus(id, "done", {}, "2026-11-02");
    expect(data.listTasks()).toHaveLength(2);
  });
  it("database rejects invalid categories even if validation is bypassed", () => {
    expect(() => data.createTask({ ...base, category: "watch" as never })).toThrow(/CHECK/);
  });
  it("blocked keeps its reason; leaving blocked clears it", () => {
    const id = data.createTask(base);
    data.setTaskStatus(id, "blocked", { blockedReason: "Waiting on Postgres install" });
    expect(data.getTask(id)!.blockedReason).toBe("Waiting on Postgres install");
    data.setTaskStatus(id, "in_progress", {});
    expect(data.getTask(id)!.blockedReason).toBe("");
  });
});

describe("validation at the boundary", () => {
  it("task form", () => {
    expect(parseTaskForm(fd({ title: "", category: "learn" })).ok).toBe(false);
    const r = parseTaskForm(fd({ title: "Read FastAPI docs", category: "learn", priority: "2", estMinutes: "45", dueDate: "2026-11-05", recurrence: "none" }));
    expect(r.ok && r.value.estMinutes).toBe(45);
    const rep = parseTaskForm(fd({ title: "x", category: "learn", recurrence: "weekly" }));
    expect(!rep.ok && rep.errors.dueDate).toBeTruthy();
    const bad = parseTaskForm(fd({ title: "x", category: "learn", estMinutes: "-5", dueDate: "2026-02-31", topicId: "../etc" }));
    expect(!bad.ok && Object.keys(bad.errors).sort()).toEqual(["dueDate", "estMinutes", "topicId"]);
  });
  it("proficient needs evidence; demonstrated is not a step", () => {
    expect(parseStep(fd({ subtopicId: "mcp:tools", step: "demonstrated", on: "1" })).ok).toBe(false);
    const r = parseStep(fd({ subtopicId: "mcp:tools", step: "proficient", on: "1" }));
    expect(r.ok).toBe(false);
  });
  it("urls: only http(s), no credentials; audio must be https", () => {
    expect(parseUrl("javascript:alert(1)")).toBe("invalid");
    expect(parseUrl("https://user:pw@example.com")).toBe("invalid");
    expect(parseUrl("http://example.com/a", { httpsOnly: true })).toBe("invalid");
    expect(parseUrl("")).toBeNull();
    expect(parseResourceForm(fd({ id: "r-mcp-docs", url: "data:text/html,x" })).ok).toBe(false);
    expect(parseAudioForm(fd({ passageId: "jn-15", url: "https://example.org/a.mp3", licence: "" })).ok).toBe(false);
  });
  it("settings", () => {
    expect(parseSettings(fd({ startDate: "2026-11-02", weeklyTargetHours: "11" })).ok).toBe(true);
    expect(parseSettings(fd({ startDate: "soon", weeklyTargetHours: "200" })).ok).toBe(false);
  });
});

describe("scripture and quotations are exact and attributed", () => {
  it("every passage has bundled text in both translations", () => {
    for (const c of COLLECTIONS) for (const p of c.passages) {
      for (const t of ["web", "kjv"] as const) {
        const txt = passageText(p.id, t);
        expect(txt, `${p.id} ${t}`).not.toBeNull();
        expect(txt!.verses.length).toBeGreaterThan(0);
      }
    }
  });
  it("James 1:5 WEB matches the public-domain text", () => {
    expect(passageText("jas-1-5", "web")!.verses[0]!.text).toBe(
      "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him.",
    );
  });
  it("every quote resolves with an attribution; URHA reflections are never attributed to people", () => {
    for (const q of QUOTES) {
      const r = resolveQuote(q);
      expect(r, q.id).not.toBeNull();
      expect(r!.attribution.length).toBeGreaterThan(2);
      if (q.type === "urha") expect(r!.attribution).toMatch(/^URHA/);
      if (q.type === "bible") expect(r!.attribution).toMatch(/\(WEB\)$/);
    }
    expect(quoteForDay("home", "2026-11-02")).not.toBeNull();
    expect(quoteForDay("home", "2026-11-02")!.id).not.toBe(quoteForDay("home", "2026-11-03")!.id);
  });
  it("every passage has a seven-question reflection that keeps its four layers distinct", () => {
    const ids = COLLECTIONS.flatMap((c) => c.passages.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length); // a passage belongs to one collection
    expect(Object.keys(REFLECTIONS).sort()).toEqual([...ids].sort());
    for (const [id, steps] of Object.entries(REFLECTIONS)) {
      expect(steps.map((s) => s.kind), id).toEqual(["summary", "context", "interpretation", "interpretation", "urha", "urha", "open"]);
      for (const s of steps) expect(s.text.length, id).toBeGreaterThan(30);
    }
  });
  it("has the eight curated collections, each with framing", async () => {
    const { COLLECTION_META } = await import("@/lib/collections");
    expect(COLLECTIONS.map((c) => c.id)).toEqual(["wisdom", "truth", "purpose", "teachings", "discipline", "compassion", "courage", "peace"]);
    for (const c of COLLECTIONS) expect(COLLECTION_META[c.id]?.questions.length, c.id).toBe(3);
  });
});

describe("meditation persistence", () => {
  it("listening progress never un-finishes; bookmarks toggle; reflections are kept", () => {
    data.saveListening("jn-15", "web", 5, true);
    data.saveListening("jn-15", "kjv", 2, false);
    const l = data.getListening()[0]!;
    expect(l).toMatchObject({ passageId: "jn-15", translation: "kjv", verseIndex: 2, finished: true });
    data.setBookmark("jn-15", true);
    data.setBookmark("jn-15", true);
    expect([...data.getBookmarks()]).toEqual(["jn-15"]);
    data.setBookmark("jn-15", false);
    expect(data.getBookmarks().size).toBe(0);
    data.addPassageReflection("jn-15", { stoodOut: "Abide", understood: "", questioned: "", apply: "", personal: "Stay with fewer things." });
    expect(data.getPassageReflections("jn-15")).toHaveLength(1);
    expect(data.getPassageReflections("jn-15")[0]!.personal).toBe("Stay with fewer things.");
    data.setCollectionNote("peace", "Two minutes before acting.");
    expect(data.getCollectionNote("peace")).toBe("Two minutes before acting.");
    data.setNarrationOffset("jas-1-5", 21.5);
    expect(data.getNarrationOffset("jas-1-5")).toBe(21.5);
    expect(() => data.setNarrationOffset("jas-1-5", -3)).toThrow(/CHECK/);
  });
  it("content sync adds a new curriculum subtopic to an older database without touching progress", () => {
    const db = g.__urhaDb!;
    data.setStep("python-engineering:type-hints", "practised", true, null);
    db.prepare("DELETE FROM subtopics WHERE id = 'sql-foundations:selective-pandas-for-loading-and-checking-data'").run();
    syncContent(db);
    expect(db.prepare("SELECT 1 FROM subtopics WHERE id = 'sql-foundations:selective-pandas-for-loading-and-checking-data'").get()).toBeTruthy();
    expect(data.getPath().phases[0]!.topics[0]!.subtopics.find((x) => x.id === "python-engineering:type-hints")!.progress.practised).toBe(true);
  });
});

describe("human narration index", () => {
  it("covers every book with the right chapter counts, and every curated passage", async () => {
    const { BOOKS, passageAudio } = await import("@/lib/narration");
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS.reduce((n, b) => n + b.chapters, 0)).toBe(1189);
    const counts = Object.fromEntries(BOOKS.map((b) => [b.book, b.chapters]));
    expect([counts.Genesis, counts.Psalms, counts.Isaiah, counts.Matthew, counts.Luke, counts.Revelation]).toEqual([50, 150, 66, 28, 24, 22]);
    for (const c of COLLECTIONS) for (const p of c.passages) {
      const a = passageAudio(p.query);
      expect(a, p.id).not.toBeNull();
      expect(a!.url.startsWith("https://ebible.org/eng-web/audio/")).toBe(true);
      if (a!.startVerse !== null && a!.startVerse > 1) expect(a!.startFraction!, p.id).toBeGreaterThan(0);
    }
    expect(decodeURIComponent(passageAudio("psalm 23")!.url)).toContain("Psalms-Twenty Three");
    const mt = passageAudio("matthew 14:22-33")!;
    expect(decodeURIComponent(mt.url)).toContain("Matthew-Chapter Fourteen");
    expect(mt.startFraction!).toBeGreaterThan(0.4);
    expect(mt.endFraction!).toBeGreaterThan(mt.startFraction!);
  });
});
