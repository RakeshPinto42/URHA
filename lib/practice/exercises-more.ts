/**
 * The second half of the practice bank: the steps between and beyond the first 32, and the
 * market track on real NSE prices (public/practice/data/market_prices.csv, built by
 * `npm run practice:market`). Same rules: checks compute their own expectations from the data.
 */
import type { Exercise } from "./exercises";

const py = String.raw;

const NOTES = `id,note
1,"Customer jane.doe@example.com called about invoice INV-UK-5021"
2,"Refund to card 4111 1111 1111 1111 approved by finance"
3,"Phone +44 20 7946 0958, ask for the ledger extract"
4,"Order reference 1234 5678 9012 3456 is not a card"
5,"IBAN GB82WEST12345698765432 for the supplier payment"
6,"No personal data in this note about accruals"
`;

export const MORE_EXERCISES: readonly Exercise[] = [
  /* ---------------------------------------------------------------- Python */
  {
    id: "py-batches", discipline: "python", level: "intermediate", topicId: "python-engineering", language: "python", after: ["py-decimal"],
    title: "Stream a ledger in batches",
    brief: "Write a generator `batches(rows, size)` that yields lists of at most `size` rows without building them all first. Use it to total gl_2025.csv by account into `totals` (account to amount, rounded to 2 places) in batches of 250.",
    datasets: ["gl_2025.csv"],
    starter: py`import csv

def batches(rows, size):
    return []

totals = {}
with open("gl_2025.csv", newline="") as f:
    for batch in batches(csv.DictReader(f), 250):
        pass

print(len(totals), "accounts")
`,
    checks: py`import csv, types
gen = batches(iter(range(7)), 3)
expect("batches is a generator", isinstance(gen, types.GeneratorType), "Use yield, so a huge file never sits in memory at once.")
expect("It yields full batches and a short last one", list(batches(iter(range(7)), 3)) == [[0, 1, 2], [3, 4, 5], [6]])
want = {}
for r in csv.DictReader(open("gl_2025.csv")):
    want[r["account"]] = round(want.get(r["account"], 0) + float(r["amount"]), 2)
expect("Totals by account match the ledger", isinstance(totals, dict) and set(totals) == set(want) and all(abs(totals[k] - v) < 0.02 for k, v in want.items()))`,
    hints: ["Collect rows into a list; when it reaches size, yield it and start a new one.", "After the loop, yield what is left if it is not empty.", "Account codes are text in a CSV; keep them as the dict keys."],
    explanation: "Generators keep memory flat however large the extract. Finance files grow every month; code that loads everything at once eventually fails on the year-end file.",
    solution: py`import csv
def batches(rows, size):
    batch = []
    for r in rows:
        batch.append(r)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch
totals = {}
with open("gl_2025.csv", newline="") as f:
    for batch in batches(csv.DictReader(f), 250):
        for r in batch:
            totals[r["account"]] = round(totals.get(r["account"], 0) + float(r["amount"]), 2)
`,
  },
  {
    id: "py-retry", discipline: "python", level: "advanced", topicId: "python-engineering", language: "python", after: ["py-batches"],
    title: "Retry a flaky API call properly",
    brief: "Write `with_retry(fn, attempts=4, base=0.5, sleep=time.sleep)`: call fn; on TransientError wait base, then 2x base, then 4x base and so on, up to `attempts` calls in all, then re-raise. Any other exception is raised at once. Return fn's result.",
    datasets: [],
    starter: py`import time

class TransientError(Exception):
    pass

def with_retry(fn, attempts=4, base=0.5, sleep=time.sleep):
    return fn()
`,
    checks: py`waits = []
calls = {"n": 0}
def flaky():
    calls["n"] += 1
    if calls["n"] < 3: raise TransientError("rate limited")
    return "ok"
expect("Returns the result once the call succeeds", with_retry(flaky, sleep=waits.append) == "ok")
expect("Waits 0.5 then 1.0 seconds between tries", waits == [0.5, 1.0], "Double the wait each time: base * 2 ** attempt.")
waits.clear(); calls["n"] = -100
try:
    with_retry(flaky, attempts=3, sleep=waits.append); gave_up = False
except TransientError:
    gave_up = True
expect("Gives up after the last attempt and re-raises", gave_up and len(waits) == 2)
def broken(): raise ValueError("bad request")
waits.clear()
try:
    with_retry(broken, sleep=waits.append); fast = False
except ValueError:
    fast = waits == []
expect("Other errors are raised at once, without retrying", fast, "Retrying a bad request only repeats it: catch TransientError alone.")`,
    hints: ["Loop over range(attempts) and try fn() inside.", "Catch only TransientError; on the last attempt, raise.", "Pass sleep in, so tests run instantly with a fake one."],
    explanation: "Rate limits and timeouts are routine with finance APIs and LLM providers. Exponential backoff on transient errors only, with a cap, keeps jobs reliable without hammering the service or masking real bugs.",
    solution: py`import time
class TransientError(Exception):
    pass
def with_retry(fn, attempts=4, base=0.5, sleep=time.sleep):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            sleep(base * 2 ** i)
`,
  },

  /* ---------------------------------------------------------------- SQL */
  {
    id: "sql-ageing", discipline: "sql", level: "intermediate", topicId: "sql-foundations", language: "sql", after: ["sql-unreceived"],
    title: "Age receivables with CASE",
    brief: "For invoices with no paid date, age them at 31 December 2025 by days past due into buckets current, 1-30, 31-60, 61-90 and 90+. Return entity, bucket, invoices (a count) and amount, ordered by entity then bucket in that order.",
    datasets: ["ar_invoices.csv"],
    starter: `SELECT entity, COUNT(*) AS invoices, SUM(amount) AS amount
FROM ar_invoices
WHERE paid IS NULL
GROUP BY entity
`,
    checks: py`import pandas as pd
ar = pd.read_csv("ar_invoices.csv", parse_dates=["due"])
o = ar[ar.paid.isna()].copy()
late = (pd.Timestamp("2025-12-31") - o.due).dt.days
o["bucket"] = pd.cut(late, [-10**6, 0, 30, 60, 90, 10**6], labels=["current", "1-30", "31-60", "61-90", "90+"])
want = o.groupby(["entity", "bucket"], observed=True).agg(invoices=("amount", "size"), amount=("amount", "sum")).reset_index()
expect("Columns are entity, bucket, invoices, amount", list(result.columns) == ["entity", "bucket", "invoices", "amount"])
expect(f"{len(want)} entity-bucket rows", len(result) == len(want), "julianday('2025-12-31') - julianday(due) is days past due.")
expect("Buckets in age order within each entity", len(result) == len(want) and list(zip(result.entity, result.bucket)) == list(zip(want.entity, want.bucket.astype(str))), "Order by a CASE that maps each bucket to 1 to 5.")
expect("Counts and amounts match", len(result) == len(want) and list(result.invoices) == list(want.invoices) and all(abs(a - b) < 0.05 for a, b in zip(result.amount, want.amount)))`,
    hints: ["Compute days in a CTE: julianday('2025-12-31') - julianday(due) AS late.", "CASE WHEN late <= 0 THEN 'current' WHEN late <= 30 THEN '1-30' … END", "ORDER BY entity, CASE bucket WHEN 'current' THEN 1 … END"],
    explanation: "CASE turns a continuous measure into the categories a business reports in. Ordering by a mapped CASE keeps buckets in age order rather than alphabetical, which is where hand-built reports go wrong.",
    solution: `WITH o AS (SELECT entity, amount, julianday('2025-12-31') - julianday(due) AS late FROM ar_invoices WHERE paid IS NULL),
b AS (SELECT entity, amount, CASE WHEN late <= 0 THEN 'current' WHEN late <= 30 THEN '1-30' WHEN late <= 60 THEN '31-60' WHEN late <= 90 THEN '61-90' ELSE '90+' END AS bucket FROM o)
SELECT entity, bucket, COUNT(*) AS invoices, ROUND(SUM(amount), 2) AS amount FROM b
GROUP BY entity, bucket
ORDER BY entity, CASE bucket WHEN 'current' THEN 1 WHEN '1-30' THEN 2 WHEN '31-60' THEN 3 WHEN '61-90' THEN 4 ELSE 5 END`,
  },
  {
    id: "sql-margin", discipline: "sql", level: "advanced", topicId: "finance-data-modelling", language: "sql", after: ["sql-running"],
    title: "Months that fell below the year's margin",
    brief: "For each entity and month, compute gross margin percent: (revenue minus cost of sales) over revenue, with revenue as accounts 4000 and 4100 made positive and cost of sales as account 5000. Return entity, period, margin_pct (1 place) and year_avg (the entity's average monthly margin_pct, 1 place), only for months below year_avg, ordered by entity and period.",
    datasets: ["gl_2025.csv"],
    starter: `SELECT entity, period, SUM(amount) AS total
FROM gl_2025
GROUP BY entity, period
`,
    checks: py`import pandas as pd
gl = pd.read_csv("gl_2025.csv")
rev = -gl[gl.account.isin([4000, 4100])].groupby(["entity", "period"]).amount.sum()
cogs = gl[gl.account == 5000].groupby(["entity", "period"]).amount.sum()
m = ((rev - cogs) / rev * 100).rename("margin").reset_index()
m["avg"] = m.groupby("entity").margin.transform("mean")
want = m[m.margin < m.avg].sort_values(["entity", "period"])
expect("Columns are entity, period, margin_pct, year_avg", list(result.columns) == ["entity", "period", "margin_pct", "year_avg"])
expect(f"{len(want)} months fall below their entity's average", len(result) == len(want), "Compare each month with AVG(margin_pct) OVER (PARTITION BY entity).")
expect("The right months", len(result) == len(want) and list(zip(result.entity, result.period)) == list(zip(want.entity, want.period)))
expect("Margins are right to one place", len(result) == len(want) and all(abs(a - round(b, 1)) <= 0.051 for a, b in zip(result.margin_pct, want.margin)))`,
    hints: ["Build monthly revenue and cost of sales with conditional sums: SUM(CASE WHEN account = 5000 THEN amount END).", "Compute margin_pct in one CTE, then AVG(margin_pct) OVER (PARTITION BY entity) in the next.", "Filter on the window result in an outer query: a WHERE cannot see a window function directly."],
    explanation: "Window functions compare each row with its group without collapsing it. Exception reporting (the months that fell below the run rate) is exactly that shape, and the outer-query filter is the step most people miss.",
    solution: `WITH m AS (
  SELECT entity, period,
         -SUM(CASE WHEN account IN (4000, 4100) THEN amount ELSE 0 END) AS revenue,
         SUM(CASE WHEN account = 5000 THEN amount ELSE 0 END) AS cogs
  FROM gl_2025 GROUP BY entity, period),
p AS (SELECT entity, period, (revenue - cogs) * 100.0 / revenue AS margin FROM m),
w AS (SELECT entity, period, margin, AVG(margin) OVER (PARTITION BY entity) AS avg_margin FROM p)
SELECT entity, period, ROUND(margin, 1) AS margin_pct, ROUND(avg_margin, 1) AS year_avg
FROM w WHERE margin < avg_margin ORDER BY entity, period`,
  },

  /* ---------------------------------------------------------------- Pandas */
  {
    id: "pd-pivot", discipline: "pandas", level: "foundation", topicId: "pandas-analysis", language: "python", after: ["pd-monthly"],
    title: "An operating cost pivot",
    brief: "From gl_2025.csv, build `pivot`: UK operating costs (accounts 6100 to 6500) with accounts as rows, months (the period column) as columns, and a Total row and column, using pivot_table.",
    datasets: ["gl_2025.csv"],
    starter: py`import pandas as pd

gl = pd.read_csv("gl_2025.csv")

pivot = None
print(pivot)
`,
    checks: py`import pandas as pd
gl = pd.read_csv("gl_2025.csv")
uk = gl[(gl.entity == "UK") & gl.account.between(6100, 6500)]
ok = isinstance(pivot, pd.DataFrame)
expect("A DataFrame with a Total row and column", ok and "Total" in pivot.index.map(str) and "Total" in pivot.columns.map(str), "pivot_table(..., margins=True, margins_name=\"Total\").")
expect("Twelve month columns plus Total", ok and len(pivot.columns) == 13)
expect("Five cost accounts plus Total", ok and len(pivot.index) == 6)
expect("The grand total is every UK operating cost", ok and abs(float(pivot.loc["Total", "Total"]) - uk.amount.sum()) < 0.05)`,
    hints: ["Filter with gl.account.between(6100, 6500) and gl.entity == \"UK\".", "pivot_table(index=\"account\", columns=\"period\", values=\"amount\", aggfunc=\"sum\").", "margins=True adds the totals; margins_name names them."],
    explanation: "The pivot is how a month-by-account view is built in one line. Margins give the cross-check totals a reviewer looks for before trusting the detail.",
    solution: py`import pandas as pd
gl = pd.read_csv("gl_2025.csv")
uk = gl[(gl.entity == "UK") & gl.account.between(6100, 6500)]
pivot = uk.pivot_table(index="account", columns="period", values="amount", aggfunc="sum", fill_value=0, margins=True, margins_name="Total")
`,
  },

  /* ---------------------------------------------------------------- Data engineering (ETL) */
  {
    id: "etl-load", discipline: "data", level: "foundation", topicId: "data-pipelines", language: "python", after: ["de-validate"],
    title: "Extract, type and load to a database",
    brief: "Read ap_invoices.csv, convert received, due and paid to dates and amount to a number, add days_to_pay (paid minus received, empty when unpaid), and load it into a SQLite table named ap in an in-memory database held in `con`. The table must hold every invoice.",
    datasets: ["ap_invoices.csv"],
    starter: py`import sqlite3
import pandas as pd

con = sqlite3.connect(":memory:")
ap = pd.read_csv("ap_invoices.csv")

# transform, then load into a table named ap
`,
    checks: py`import pandas as pd
src = pd.read_csv("ap_invoices.csv")
n = con.execute("SELECT COUNT(*) FROM ap").fetchone()[0] if con.execute("SELECT name FROM sqlite_master WHERE name = 'ap'").fetchone() else -1
expect("A table named ap exists", n != -1, "DataFrame.to_sql(\"ap\", con, index=False).")
expect(f"Every one of the {len(src)} invoices is loaded", n == len(src))
cols = [r[1] for r in con.execute("PRAGMA table_info(ap)")] if n != -1 else []
expect("days_to_pay is a column", "days_to_pay" in cols)
paid = src.dropna(subset=["paid"])
want = (pd.to_datetime(paid.paid) - pd.to_datetime(paid.received)).dt.days.mean()
got = con.execute("SELECT AVG(days_to_pay) FROM ap WHERE days_to_pay IS NOT NULL").fetchone()[0] if "days_to_pay" in cols else None
expect(f"Average days to pay is {want:.1f}", got is not None and abs(got - want) < 0.01, "(paid - received).dt.days; unpaid rows stay empty, not zero.")`,
    hints: ["pd.to_datetime on each date column; errors=\"coerce\" turns blanks into NaT.", "days_to_pay = (ap.paid - ap.received).dt.days", "SQLite has no date type: store dates as ISO text with dt.strftime(\"%Y-%m-%d\") before to_sql."],
    explanation: "Typing on the way in is the heart of ETL: dates as dates, money as numbers, derived fields computed once. A blank paid date must stay unknown, never zero, or every average downstream is wrong.",
    solution: py`import sqlite3
import pandas as pd
con = sqlite3.connect(":memory:")
ap = pd.read_csv("ap_invoices.csv")
for c in ["received", "due", "paid"]:
    ap[c] = pd.to_datetime(ap[c], errors="coerce")
ap["amount"] = pd.to_numeric(ap["amount"])
ap["days_to_pay"] = (ap.paid - ap.received).dt.days
for c in ["received", "due", "paid"]:
    ap[c] = ap[c].dt.strftime("%Y-%m-%d")
ap.to_sql("ap", con, index=False)
`,
  },
  {
    id: "etl-quality", discipline: "data", level: "intermediate", topicId: "data-pipelines", language: "python", after: ["etl-load"],
    title: "A data-quality scorecard",
    brief: "Score gl_2025.csv on four dimensions, each the share of rows that pass, from 0 to 1: completeness (no blank field), validity (account exists in coa.csv), uniqueness (no other row with the same entity, posted date, account, amount and description), and consistency (period equals the posted month). Build `scores`, a dict with those four keys.",
    datasets: ["gl_2025.csv", "coa.csv"],
    starter: py`import pandas as pd

gl = pd.read_csv("gl_2025.csv", dtype=str)
coa = pd.read_csv("coa.csv", dtype=str)

scores = {"completeness": 0.0, "validity": 0.0, "uniqueness": 0.0, "consistency": 0.0}
print(scores)
`,
    checks: py`import pandas as pd
gl = pd.read_csv("gl_2025.csv", dtype=str, keep_default_na=False); coa = pd.read_csv("coa.csv", dtype=str)
want = {
  "completeness": float((gl != "").all(axis=1).mean()),
  "validity": float(gl.account.isin(coa.account).mean()),
  "uniqueness": float((~gl.duplicated(subset=["entity", "posted", "account", "amount", "description"], keep=False)).mean()),
  "consistency": float((gl.period == gl.posted.str[:7]).mean()),
}
ok = isinstance(scores, dict) and set(scores) == set(want)
expect("The four dimensions", ok)
for k, v in want.items():
    expect(f"{k} is {v:.4f}", ok and abs(float(scores[k]) - v) < 1e-6, "Uniqueness counts both copies of a duplicate as failing: duplicated(keep=False).")`,
    hints: ["Read as text so nothing is coerced: dtype=str.", "A boolean Series' mean is the share of True.", "duplicated(subset=[...], keep=False) marks every copy, not just the later ones."],
    explanation: "A scorecard turns 'the data looks fine' into numbers you can track and alert on. Choosing the definition, such as whether both copies of a duplicate fail, is a decision to make once and write down.",
    solution: py`import pandas as pd
gl = pd.read_csv("gl_2025.csv", dtype=str, keep_default_na=False)
coa = pd.read_csv("coa.csv", dtype=str)
scores = {
  "completeness": float((gl != "").all(axis=1).mean()),
  "validity": float(gl.account.isin(coa.account).mean()),
  "uniqueness": float((~gl.duplicated(subset=["entity", "posted", "account", "amount", "description"], keep=False)).mean()),
  "consistency": float((gl.period == gl.posted.str[:7]).mean()),
}
`,
  },
  {
    id: "etl-control", discipline: "data", level: "advanced", topicId: "data-pipelines", language: "python", after: ["etl-quality", "de-incremental"],
    title: "A load-reconciliation control",
    brief: "`target` is what a pipeline loaded from gl_2025.csv; something went wrong. Reconcile source and target by entity and period on row count and total amount, and build `breaks`: a DataFrame of entity, period, source_rows, target_rows, source_amount and target_amount for every pair that differs. Then name the cause in `missing` (entry_ids in the source but not the target) and `doubled` (entry_ids loaded more than once).",
    datasets: ["gl_2025.csv"],
    starter: py`import pandas as pd

source = pd.read_csv("gl_2025.csv")
# The pipeline's output, with its faults:
target = pd.concat([source.drop(index=[10, 500]), source.iloc[[42, 42, 900]]]).reset_index(drop=True)

breaks = None
missing = doubled = []
`,
    checks: py`import pandas as pd
source = pd.read_csv("gl_2025.csv")
bad = {(source.entity[i], source.period[i]) for i in [10, 500, 42, 900]}
ok = isinstance(breaks, pd.DataFrame) and {"entity", "period", "source_rows", "target_rows", "source_amount", "target_amount"} <= set(breaks.columns)
expect("breaks has the six columns", ok)
expect(f"{len(bad)} entity-periods break", ok and set(zip(breaks.entity, breaks.period)) == bad, "Group both sides by entity and period, join, and keep rows where counts or totals differ.")
expect("The two dropped rows are named", sorted(missing) == sorted([source.entry_id[10], source.entry_id[500]]))
expect("The doubled rows are named", sorted(set(doubled)) == sorted({source.entry_id[42], source.entry_id[900]}), "value_counts() over entry_id, greater than 1.")`,
    hints: ["Aggregate each side: groupby([\"entity\", \"period\"]).agg(rows=(\"amount\", \"size\"), amount=(\"amount\", \"sum\")).", "Outer-join the two summaries and compare with a small tolerance for the amounts.", "Missing: set(source.entry_id) - set(target.entry_id). Doubled: target.entry_id.value_counts() > 1."],
    explanation: "Every production load needs a control that proves source equals target. Counts and totals by a business key catch drops and duplicates the moment they happen, not at month end.",
    solution: py`import pandas as pd
source = pd.read_csv("gl_2025.csv")
target = pd.concat([source.drop(index=[10, 500]), source.iloc[[42, 42, 900]]]).reset_index(drop=True)
agg = lambda d: d.groupby(["entity", "period"]).agg(rows=("amount", "size"), amount=("amount", "sum"))
m = agg(source).join(agg(target), lsuffix="_s", rsuffix="_t", how="outer").fillna(0).reset_index()
m = m[(m.rows_s != m.rows_t) | ((m.amount_s - m.amount_t).abs() > 0.005)]
breaks = m.rename(columns={"rows_s": "source_rows", "rows_t": "target_rows", "amount_s": "source_amount", "amount_t": "target_amount"})
missing = sorted(set(source.entry_id) - set(target.entry_id))
counts = target.entry_id.value_counts()
doubled = sorted(counts[counts > 1].index)
`,
  },

  /* ---------------------------------------------------------------- AI */
  {
    id: "ai-budget", discipline: "ai", level: "intermediate", topicId: "llm-engineering", language: "python", after: ["ai-validate"],
    title: "Pack data into prompts under a token budget",
    brief: "An LLM call allows 900 tokens of data. Estimate tokens as ceil(words x 1.3). Write `pack(lines, budget)` that groups text lines into batches, in order, each within the budget, never splitting a line, and raising ValueError for a single line over budget. Then pack every GL description line (\"entry_id account amount description\") of the UK into `packs`.",
    datasets: ["gl_2025.csv"],
    starter: py`import csv, math

def tokens(text):
    return math.ceil(len(text.split()) * 1.3)

def pack(lines, budget):
    return [lines]

rows = [r for r in csv.DictReader(open("gl_2025.csv")) if r["entity"] == "UK"]
lines = [f'{r["entry_id"]} {r["account"]} {r["amount"]} {r["description"]}' for r in rows]
packs = pack(lines, 900)
print(len(packs), "calls")
`,
    checks: py`import math
t = lambda s: math.ceil(len(s.split()) * 1.3)
expect("Every pack is within the budget", isinstance(packs, list) and all(sum(t(x) for x in p) <= 900 for p in packs))
expect("Nothing is lost or reordered", [x for p in packs for x in p] == lines)
expect("Packs are full: none could have taken the next line", all(sum(t(x) for x in packs[i]) + t(packs[i + 1][0]) > 900 for i in range(len(packs) - 1)), "Start a new pack only when the next line would not fit.")
try:
    pack(["word " * 800], 900); raised = False
except ValueError:
    raised = True
expect("A line too big for any call is refused, not truncated", raised)`,
    hints: ["Keep a running token count for the current pack.", "If adding the next line would pass the budget, close the pack first.", "Check each line on its own against the budget before packing it."],
    explanation: "Context windows and per-call costs make batching a real engineering problem. Packing greedily without splitting records keeps each call meaningful, and refusing an oversize record is better than silently truncating it.",
    solution: py`import csv, math
def tokens(text):
    return math.ceil(len(text.split()) * 1.3)
def pack(lines, budget):
    out, cur, used = [], [], 0
    for line in lines:
        n = tokens(line)
        if n > budget:
            raise ValueError("line over budget")
        if cur and used + n > budget:
            out.append(cur); cur, used = [], 0
        cur.append(line); used += n
    if cur: out.append(cur)
    return out
rows = [r for r in csv.DictReader(open("gl_2025.csv")) if r["entity"] == "UK"]
lines = [f'{r["entry_id"]} {r["account"]} {r["amount"]} {r["description"]}' for r in rows]
packs = pack(lines, 900)
`,
  },
  {
    id: "ai-redact", discipline: "ai", level: "advanced", topicId: "ai-security", language: "python", after: ["ai-guard"],
    title: "Redact personal data before it reaches a model",
    brief: "Write `redact(text)` replacing emails with [EMAIL], phone numbers with [PHONE], IBANs with [IBAN], and card numbers with [CARD], where a card is 13 to 19 digits (spaces allowed) that pass the Luhn check. Digits that fail Luhn, such as an order reference, stay. Build `clean`: notes.csv's notes, redacted, in order.",
    datasets: [], files: { "notes.csv": NOTES },
    starter: py`import csv, re

def redact(text: str) -> str:
    return text

clean = [redact(r["note"]) for r in csv.DictReader(open("notes.csv"))]
print("\n".join(clean))
`,
    checks: py`expect("Emails are redacted", "[EMAIL]" in clean[0] and "@" not in clean[0])
expect("A real card number is redacted", "[CARD]" in clean[1] and "4111" not in clean[1], "Strip spaces, then run the Luhn check on the digits.")
expect("Phone numbers are redacted", "[PHONE]" in clean[2] and "7946" not in clean[2])
expect("A 16-digit order reference that fails Luhn is kept", "1234 5678 9012 3456" in clean[3], "Luhn is what tells a card from any other long number.")
expect("IBANs are redacted", "[IBAN]" in clean[4] and "GB82" not in clean[4])
expect("Text without personal data is unchanged", clean[5] == "No personal data in this note about accruals")
expect("Invoice references are not mistaken for personal data", "INV-UK-5021" in clean[0])`,
    hints: ["Luhn: from the right, double every second digit, subtract 9 if over 9, and the sum must divide by 10.", "Find card candidates with re.finditer(r\"\\b(?:\\d[ -]?){12,18}\\d\\b\", text) and replace only those that pass.", "Do IBANs before phones, and let a phone start only with + or 0, so a long reference is never taken for one."],
    explanation: "Sending raw notes to a hosted model can leak personal data. Redacting first is a basic control; a validity check like Luhn keeps it from over-redacting references the model needs.",
    solution: py`import csv, re
def luhn(digits):
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9: d -= 9
        total += d
    return total % 10 == 0
def redact(text):
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[EMAIL]", text)
    text = re.sub(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b", "[IBAN]", text)
    def card(m):
        d = re.sub(r"\D", "", m.group(0))
        return "[CARD]" if 13 <= len(d) <= 19 and luhn(d) else m.group(0)
    text = re.sub(r"\b(?:\d[ -]?){12,18}\d\b", card, text)
    text = re.sub(r"(?:\+\d{1,3}|\b0)[\d ()-]{8,14}\d", "[PHONE]", text)
    return text
clean = [redact(r["note"]) for r in csv.DictReader(open("notes.csv"))]
`,
  },

  /* ---------------------------------------------------------------- Finance automation */
  {
    id: "fa-exposure", discipline: "finance", level: "foundation", topicId: "fpa-analytics", language: "python", after: ["fa-accruals"],
    title: "Open currency exposure",
    brief: "At year end, each entity holds open receivables and payables in its own currency. Build `exposure`: a dict of currency to net open position (open AR minus open AP, received or issued in 2025), rounded to 2 places.",
    datasets: ["ar_invoices.csv", "ap_invoices.csv"],
    starter: py`import pandas as pd

ar = pd.read_csv("ar_invoices.csv")
ap = pd.read_csv("ap_invoices.csv")

exposure = {}
print(exposure)
`,
    checks: py`import pandas as pd
ar = pd.read_csv("ar_invoices.csv"); ap = pd.read_csv("ap_invoices.csv")
a = ar[ar.paid.isna() & ar.issued.str.startswith("2025")].groupby("currency").amount.sum()
p = ap[ap.paid.isna() & ap.received.str.startswith("2025")].groupby("currency").amount.sum()
want = a.sub(p, fill_value=0).round(2)
expect("One figure per currency", isinstance(exposure, dict) and set(exposure) == set(want.index))
expect("Net positions are right", isinstance(exposure, dict) and all(abs(exposure.get(k, 0) - v) < 0.02 for k, v in want.items()), "Only 2025 items: January 2026 invoices are next year's exposure.")
expect("Every figure is rounded to two places", isinstance(exposure, dict) and all(round(v, 2) == v for v in exposure.values()))`,
    hints: ["Open means the paid column is empty.", "Group each side by currency, then subtract with fill_value=0 so a currency on one side only still appears.", "Round at the end."],
    explanation: "Net exposure by currency is the starting point for every hedging conversation: what is owed to us and by us in each currency, before any rate is applied.",
    solution: py`import pandas as pd
ar = pd.read_csv("ar_invoices.csv"); ap = pd.read_csv("ap_invoices.csv")
a = ar[ar.paid.isna() & ar.issued.str.startswith("2025")].groupby("currency").amount.sum()
p = ap[ap.paid.isna() & ap.received.str.startswith("2025")].groupby("currency").amount.sum()
exposure = a.sub(p, fill_value=0).round(2).to_dict()
`,
  },
  {
    id: "fa-days", discipline: "finance", level: "intermediate", topicId: "fpa-analytics", language: "python", after: ["fa-exposure"],
    title: "Working-capital days",
    brief: "For each entity in 2025, compute DSO (open receivables at year end over the year's revenue from ar_invoices, times 365) and DPO (open payables received in 2025 over the year's AP spend, times 365), both rounded to 1 place. Build `days`: a DataFrame indexed by entity with columns dso and dpo, and `slowest_collector`: the entity with the highest DSO.",
    datasets: ["ar_invoices.csv", "ap_invoices.csv"],
    starter: py`import pandas as pd

ar = pd.read_csv("ar_invoices.csv")
ap = pd.read_csv("ap_invoices.csv")

days = None
slowest_collector = None
`,
    checks: py`import pandas as pd
ar = pd.read_csv("ar_invoices.csv"); ap = pd.read_csv("ap_invoices.csv")
ar25 = ar[ar.issued.str.startswith("2025")]; ap25 = ap[ap.received.str.startswith("2025")]
dso = (ar25[ar25.paid.isna()].groupby("entity").amount.sum() / ar25.groupby("entity").amount.sum() * 365).round(1)
dpo = (ap25[ap25.paid.isna()].groupby("entity").amount.sum() / ap25.groupby("entity").amount.sum() * 365).round(1)
ok = isinstance(days, pd.DataFrame) and {"dso", "dpo"} <= set(days.columns)
expect("days has dso and dpo by entity", ok and set(days.index) == set(dso.index))
expect("DSO is right for every entity", ok and all(abs(days.loc[k, "dso"] - v) <= 0.051 for k, v in dso.items()))
expect("DPO is right for every entity", ok and all(abs(days.loc[k, "dpo"] - v) <= 0.051 for k, v in dpo.fillna(0).items() if k in days.index))
expect(f"The slowest collector is {dso.idxmax()}", slowest_collector == dso.idxmax())`,
    hints: ["Restrict both files to 2025 first.", "Open over total, by entity, times 365.", "idxmax() gives the index label of the largest value."],
    explanation: "DSO and DPO turn ledgers into the days that drive cash. This simple year-end form is a starting point; real analysis uses averages over the period, which the same code can be extended to do.",
    solution: py`import pandas as pd
ar = pd.read_csv("ar_invoices.csv"); ap = pd.read_csv("ap_invoices.csv")
ar25 = ar[ar.issued.str.startswith("2025")]; ap25 = ap[ap.received.str.startswith("2025")]
dso = ar25[ar25.paid.isna()].groupby("entity").amount.sum() / ar25.groupby("entity").amount.sum() * 365
dpo = ap25[ap25.paid.isna()].groupby("entity").amount.sum() / ap25.groupby("entity").amount.sum() * 365
days = pd.DataFrame({"dso": dso.round(1), "dpo": dpo.round(1)}).fillna(0)
slowest_collector = days.dso.idxmax()
`,
  },

  /* ---------------------------------------------------------------- Real market data */
  {
    id: "mk-rsi", discipline: "pandas", level: "intermediate", topicId: "pandas-analysis", language: "python", after: ["pd-fx"], market: true,
    title: "Reproduce Rare Stocks' RSI on real prices",
    brief: "market_prices.csv holds real NSE prices (adj_close is adjusted for bonuses and splits). For RELIANCE, compute the 14-session RSI with Wilder's smoothing, as Rare Stocks does, and the 50-session simple average, on adj_close. Build `latest`: a dict with rsi14 and sma50 for the last session, each rounded to 2 places.",
    datasets: ["market_prices.csv"],
    starter: py`import pandas as pd

px = pd.read_csv("market_prices.csv", parse_dates=["date"])
rel = px[px.symbol == "RELIANCE"].set_index("date").adj_close

latest = {"rsi14": None, "sma50": None}
print(latest)
`,
    checks: py`import pandas as pd
px = pd.read_csv("market_prices.csv"); c = px[px.symbol == "RELIANCE"].adj_close.tolist()
g = [max(c[i] - c[i - 1], 0) for i in range(1, len(c))]; l = [max(c[i - 1] - c[i], 0) for i in range(1, len(c))]
ag, al = sum(g[:14]) / 14, sum(l[:14]) / 14
for i in range(14, len(g)):
    ag = (ag * 13 + g[i]) / 14; al = (al * 13 + l[i]) / 14
rsi = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
sma = sum(c[-50:]) / 50
expect("latest has rsi14 and sma50", isinstance(latest, dict) and latest.get("rsi14") is not None and latest.get("sma50") is not None)
expect(f"The 50-session average is {sma:.2f}", isinstance(latest, dict) and latest.get("sma50") is not None and abs(latest["sma50"] - sma) < 0.02)
expect(f"Wilder's RSI(14) is {rsi:.2f}", isinstance(latest, dict) and latest.get("rsi14") is not None and abs(latest["rsi14"] - rsi) < 0.05, "Seed with the simple average of the first 14 gains and losses, then smooth: (prev x 13 + new) / 14. A plain rolling mean gives a different number.")`,
    hints: ["diff() gives the daily change; clip(lower=0) the gains and -clip(upper=0) the losses.", "Wilder's smoothing is ewm(alpha=1/14, adjust=False) seeded with the first 14-session mean; a loop is clearer.", "rolling(50).mean() for the average."],
    explanation: "Reproducing an indicator from first principles is how you validate the tool that shows it. The common bug, a simple rolling mean instead of Wilder's smoothing, gives a different RSI that still looks plausible.",
    solution: py`import pandas as pd
px = pd.read_csv("market_prices.csv")
c = px[px.symbol == "RELIANCE"].adj_close.tolist()
gains = [max(c[i] - c[i - 1], 0) for i in range(1, len(c))]
losses = [max(c[i - 1] - c[i], 0) for i in range(1, len(c))]
ag, al = sum(gains[:14]) / 14, sum(losses[:14]) / 14
for i in range(14, len(gains)):
    ag = (ag * 13 + gains[i]) / 14
    al = (al * 13 + losses[i]) / 14
rsi = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
latest = {"rsi14": round(rsi, 2), "sma50": round(sum(c[-50:]) / 50, 2)}
`,
  },
  {
    id: "mk-drawdown", discipline: "pandas", level: "advanced", topicId: "fpa-analytics", language: "python", after: ["mk-rsi"], market: true,
    title: "Maximum drawdown across real stocks",
    brief: "For every symbol in market_prices.csv, compute the maximum drawdown on adj_close: the largest fall from a running peak, as a negative percentage. Build `drawdowns`: a Series by symbol, rounded to 1 place, sorted from the worst, and `worst`: the symbol with the deepest drawdown.",
    datasets: ["market_prices.csv"],
    starter: py`import pandas as pd

px = pd.read_csv("market_prices.csv", parse_dates=["date"])

drawdowns = None
worst = None
`,
    checks: py`import pandas as pd
px = pd.read_csv("market_prices.csv").sort_values(["symbol", "date"])
want = {}
for s, g in px.groupby("symbol"):
    peak, worst_dd = 0, 0
    for v in g.adj_close:
        peak = max(peak, v); worst_dd = min(worst_dd, (v / peak - 1) * 100)
    want[s] = round(worst_dd, 1)
ok = isinstance(drawdowns, pd.Series)
expect("A Series with one drawdown per symbol", ok and set(drawdowns.index) == set(want))
expect("Every drawdown is right to one place", ok and all(abs(drawdowns[k] - v) <= 0.11 for k, v in want.items()), "Use adj_close: on raw close a bonus issue looks like a 50% crash.")
expect("Sorted from the worst", ok and list(drawdowns.values) == sorted(drawdowns.values))
expect(f"The worst is {min(want, key=want.get)}", worst == min(want, key=want.get))`,
    hints: ["Within each symbol: cummax() is the running peak.", "Drawdown = adj_close / running peak - 1, times 100; its min() is the maximum drawdown.", "groupby(\"symbol\").apply(...) then sort_values()."],
    explanation: "Drawdown is how investors feel risk. Computing it on unadjusted prices is the classic error: a bonus or split appears as a crash that never happened, which is why Rare Stocks adjusts every price first.",
    solution: py`import pandas as pd
px = pd.read_csv("market_prices.csv", parse_dates=["date"]).sort_values(["symbol", "date"])
dd = px.groupby("symbol").adj_close.apply(lambda s: ((s / s.cummax() - 1) * 100).min())
drawdowns = dd.round(1).sort_values()
worst = drawdowns.index[0]
`,
  },
  {
    id: "mk-backtest", discipline: "finance", level: "advanced", topicId: "fpa-analytics", language: "python", after: ["mk-drawdown"], market: true,
    title: "Backtest a moving-average rule without looking ahead",
    brief: "For ICICIBANK on adj_close, hold the stock on a day only if yesterday's close was above yesterday's 50-session average (otherwise hold cash at 0%). Build `strategy` and `buy_hold`: total returns in percent over every session from the 51st onward, rounded to 1 place. The signal must use only information available before each day.",
    datasets: ["market_prices.csv"],
    starter: py`import pandas as pd

px = pd.read_csv("market_prices.csv", parse_dates=["date"])
s = px[px.symbol == "ICICIBANK"].set_index("date").adj_close

strategy = buy_hold = None
`,
    checks: py`import pandas as pd
px = pd.read_csv("market_prices.csv")
c = px[px.symbol == "ICICIBANK"].adj_close.tolist()
sma = [None] * len(c)
for i in range(49, len(c)): sma[i] = sum(c[i - 49:i + 1]) / 50
strat = hold = 1.0
for t in range(50, len(c)):
    r = c[t] / c[t - 1]
    hold *= r
    if c[t - 1] > sma[t - 1]: strat *= r
want_s, want_h = round((strat - 1) * 100, 1), round((hold - 1) * 100, 1)
expect(f"Buy and hold returned {want_h}%", buy_hold is not None and abs(float(buy_hold) - want_h) <= 0.11)
expect(f"The rule returned {want_s}%", strategy is not None and abs(float(strategy) - want_s) <= 0.11, "Shift the signal by one day: today's position is decided by yesterday's close and average. Using today's close is look-ahead, and flatters the rule.")
expect("The rule sat out some sessions, so it differs from holding throughout", strategy is not None and buy_hold is not None and float(strategy) != float(buy_hold))`,
    hints: ["signal = (s > s.rolling(50).mean()).shift(1) decides today's position from yesterday.", "Daily returns: s.pct_change(); the strategy earns them only where the signal is True.", "Total return: (1 + returns).prod() - 1, from the 51st session on."],
    explanation: "Look-ahead is the most common way a backtest lies: deciding today's trade with today's close. The one-day shift is the whole difference between a rule you could have traded and one you could not. Rare Stocks' own validation follows the same discipline.",
    solution: py`import pandas as pd
px = pd.read_csv("market_prices.csv", parse_dates=["date"])
s = px[px.symbol == "ICICIBANK"].set_index("date").adj_close.reset_index(drop=True)
signal = (s > s.rolling(50).mean()).shift(1, fill_value=False)
r = s.pct_change()
window = range(50, len(s))
buy_hold = round(((1 + r.iloc[50:]).prod() - 1) * 100, 1)
strategy = round(((1 + r.iloc[50:].where(signal.iloc[50:], 0.0)).prod() - 1) * 100, 1)
`,
  },
];
