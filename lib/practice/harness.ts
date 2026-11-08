/**
 * The Python that wraps a practice run. Shared by the browser worker and the tests, so what is
 * proven in the tests is exactly what runs for the learner.
 */
import type { Exercise } from "./exercises";

/** SQL exercises: every CSV in the working folder becomes a table, then the query runs. */
export const SQL_HARNESS = `import sqlite3, os, pandas as pd
__con = sqlite3.connect(":memory:")
for __f in sorted(os.listdir(".")):
    if __f.endswith(".csv"):
        pd.read_csv(__f).to_sql(__f[:-4], __con, index=False)
result = pd.read_sql_query(__sql, __con)
print(result.head(25).to_string(index=False))
if len(result) > 25:
    print(f"... {len(result)} rows in all")
`;

/** The checks' helper, defined before the checks run. */
export const EXPECT = `_results = []
def expect(label, condition, hint=""):
    _results.append((str(label), bool(condition), str(hint)))
`;

/** What to run for an exercise: Python as written, or SQL through the harness. */
export function runPlan(e: Pick<Exercise, "language">, code: string): { code: string; sql: string | null } {
  return e.language === "sql" ? { code: SQL_HARNESS, sql: code } : { code, sql: null };
}
