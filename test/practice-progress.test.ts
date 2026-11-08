import { describe, expect, it } from "vitest";
import { parseAttempt, practiceByDiscipline, practiceStatus, recentPasses, recordAttempt } from "@/lib/practice/progress";
import { EXERCISES } from "@/lib/practice/exercises";
import { getDb } from "@/lib/db";

const good = { exerciseId: "sql-revenue", passed: false, checksPassed: 2, checksTotal: 4, seconds: 0.4, code: "SELECT 1" };

describe("recording practice in the database", () => {
  it("migrates to a version with the practice table", () => {
    const tables = getDb().prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[];
    expect(tables.map((t) => t.name)).toContain("practice_attempts");
  });

  it("refuses what is not a real attempt", () => {
    expect(parseAttempt({ ...good, exerciseId: "nope" }).ok).toBe(false);
    expect(parseAttempt({ ...good, passed: true }).ok).toBe(false); // a pass needs every check
    expect(parseAttempt({ ...good, checksPassed: 5 }).ok).toBe(false);
    expect(parseAttempt({ ...good, code: "x".repeat(50_001) }).ok).toBe(false);
    expect(parseAttempt({ ...good, seconds: -1 }).ok).toBe(false);
    expect(parseAttempt({ ...good, passed: "yes" }).ok).toBe(false);
  });

  it("keeps every attempt, marks a pass once any passes, and resumes from the latest code", () => {
    recordAttempt({ ...good, code: "first" });
    recordAttempt({ ...good, passed: true, checksPassed: 4, code: "second" });
    recordAttempt({ ...good, checksPassed: 1, code: "third" });
    const s = practiceStatus()["sql-revenue"]!;
    expect(s.attempts).toBe(3);
    expect(s.passed).toBe(true);
    expect(s.bestChecks).toBe(4);
    expect(s.lastCode).toBe("third");
    expect(recentPasses().map((p) => p.exerciseId)).toContain("sql-revenue");
  });

  it("counts passes by discipline against everything available", () => {
    const d = practiceByDiscipline();
    expect(d.sql.passed).toBe(1);
    expect(d.sql.total).toBe(EXERCISES.filter((e) => e.discipline === "sql").length);
    expect(d.python.passed).toBe(0);
  });
});
