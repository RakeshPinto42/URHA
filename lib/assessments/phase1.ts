/**
 * Phase 1 assessments: Python engineering, software engineering, SQL foundations.
 * Exit gate: "Independently understand, modify, debug and test the application."
 */
import type { Assessment } from "./types";

export const PYTHON_ENGINEERING: Assessment = {
  id: "python-engineering",
  version: 1,
  topicId: "python-engineering",
  skills: ["python"],
  title: "Python engineering: a validated loader",
  summary: "Design choices, defects and a small data-processing function with validation, error handling and tests.",
  objectives: [
    "Choose composition over inheritance where behaviour varies.",
    "Recognise common Python defects (mutable defaults, swallowed exceptions).",
    "Process large inputs without loading them into memory.",
    "Write a typed, validated, tested data-processing function.",
  ],
  difficulty: "foundation",
  passPercent: 70,
  minutes: 120,
  items: [
    {
      id: "py-1", type: "mcq", points: 2, revise: ["classes-inheritance-and-composition"],
      prompt: "A Reconciler must match ledger lines to bank lines exactly today, and with a ±0.01 tolerance for some clients later. Which design keeps the Reconciler unchanged when the tolerance rule arrives?",
      options: [
        "Subclass Reconciler as ToleranceReconciler and override match()",
        "Give Reconciler a matcher object (a strategy) and pass in an ExactMatcher or a ToleranceMatcher",
        "Add a `tolerance: bool` flag to Reconciler.match() and branch on it",
        "Copy Reconciler into a second module for the tolerance clients",
      ],
      correct: [1],
      explain: "Composition: the varying behaviour lives in a small object you pass in, so new rules add a class instead of editing or subclassing the Reconciler.",
    },
    {
      id: "py-2", type: "debug", language: "python", points: 2, revise: ["functions-and-modular-programming", "exception-handling"],
      prompt: "collect_errors() is called once per row. After three bad rows in one file, a second file starts with three errors already in its list. Why?",
      code: `def collect_errors(row: dict, errors: list[str] = []) -> list[str]:
    if row.get("amount") is None:
        errors.append(f"row {row['n']}: missing amount")
    return errors`,
      options: [
        "The default list is created once, when the function is defined, and shared by every call that omits `errors`",
        "f-strings are evaluated lazily, so earlier messages are re-used",
        "`row.get` returns a reference into the previous row",
        "Type hints make the list global",
      ],
      correct: [0],
      explain: "Use `errors: list[str] | None = None` and create the list inside the function.",
    },
    {
      id: "py-3", type: "mcq", points: 2, revise: ["decorators-and-generators-concepts", "file-handling"],
      prompt: "A bank file has 1,000,000 rows. Which approach totals the amounts with constant memory?",
      options: [
        "rows = f.readlines(); total = sum(parse(r) for r in rows)",
        "total = sum(parse(line) for line in f)  # f opened with `with open(...)`",
        "rows = list(csv.reader(f)); total = sum(parse(r) for r in rows)",
        "data = f.read().split('\\n'); total = sum(map(parse, data))",
      ],
      correct: [1],
      explain: "Iterating the file object with a generator expression reads one line at a time; the others build the whole file in memory first.",
    },
    {
      id: "py-4", type: "debug", language: "python", points: 2, revise: ["exception-handling", "software-engineering:logging"],
      prompt: "What is wrong with this parsing step?",
      code: `for n, raw in enumerate(lines, start=1):
    try:
        amount = Decimal(raw["amount"])
    except Exception:
        pass
    totals[raw["account"]] += amount`,
      options: [
        "Nothing: Decimal never raises",
        "The broad except hides the reason and the row, and `amount` keeps the previous row's value (or is undefined on row 1)",
        "Decimal should be float for money",
        "enumerate must start at 0",
      ],
      correct: [1],
      explain: "Catch the specific error (decimal.InvalidOperation), record row number and reason, and skip the row explicitly.",
    },
    {
      id: "py-5", type: "concept", points: 4, revise: ["async-programming-fundamentals"], evidence: "text",
      prompt: "LedgerSync needs rates from three exchange-rate APIs before each run. Explain whether you would use asyncio, threads or sequential calls, and why. Mention what happens when one API is slow or fails.",
      rubric: [
        { id: "choice", label: "Sound choice for I/O-bound work", points: 2, descriptor: "Chooses concurrency (asyncio.gather or threads) and explains the calls are I/O-bound, not CPU-bound." },
        { id: "failure", label: "Failure handling", points: 2, descriptor: "Timeouts per call, what happens to the other two results, and whether the run proceeds with stale or missing rates." },
      ],
      guidance: "Full marks need a timeout per request and a stated policy for a failed source (e.g. gather with return_exceptions=True, then fall back or stop).",
    },
    {
      id: "py-6", type: "code", points: 12, required: true, evidence: "url-and-text",
      revise: ["exception-handling", "type-hints", "json-processing", "software-engineering:pytest"],
      prompt: "Build `load_bank_lines(path) -> tuple[list[BankLine], list[ValidationError]]`. It reads a CSV of date, amount, reference and currency. It rejects bad rows with their row number and reason, never stops at the first bad row, and is fully typed. Add pytest tests covering a clean file, three kinds of bad row and an empty file. Submit the repository or commit link, and paste the pytest and `mypy --strict` output.",
      rubric: [
        { id: "correct", label: "Correct results", points: 4, descriptor: "Valid rows are parsed with the right types (Decimal amounts, real dates); bad rows are rejected, never silently fixed." },
        { id: "errors", label: "Error handling", points: 3, descriptor: "Errors carry row number and reason; all errors are collected; unexpected exceptions are not swallowed." },
        { id: "typing", label: "Types", points: 2, descriptor: "mypy --strict passes; no Any leaks through the public function." },
        { id: "tests", label: "Tests", points: 3, descriptor: "Clean file, ≥3 distinct bad-row cases and an empty file are tested; tests pass in the pasted output." },
      ],
      guidance: "Run the tests yourself before scoring. The submission must be the learner's own work: an AI-generated answer with no understanding shown cannot pass (ask them to explain one design choice).",
    },
  ],
};

export const SOFTWARE_ENGINEERING: Assessment = {
  id: "software-engineering",
  version: 1,
  topicId: "software-engineering",
  skills: ["python"],
  title: "Software engineering: tests, review and delivery",
  summary: "Testing technique, reviewing AI-generated code for defects, and a working CI pipeline.",
  objectives: [
    "Use fixtures, parametrisation and mocks correctly.",
    "Find defects in plausible-looking generated code and prove them with tests.",
    "Run linting, type checks and tests automatically on every push.",
  ],
  difficulty: "foundation",
  passPercent: 70,
  minutes: 120,
  items: [
    {
      id: "se-1", type: "debug", language: "python", points: 2, revise: ["mocking"],
      prompt: "The test still calls the real API. Why?",
      code: `# ledgersync/rates.py
from httpx import get

def rate(ccy: str) -> float:
    return get(f"https://fx.example/{ccy}").json()["rate"]

# tests/test_rates.py
from unittest.mock import patch
from ledgersync.rates import rate

@patch("httpx.get")
def test_rate(mock_get):
    mock_get.return_value.json.return_value = {"rate": 1.17}
    assert rate("EUR") == 1.17`,
      options: [
        "patch must be used as a context manager, not a decorator",
        "rates.py imported `get` into its own namespace, so the test must patch `ledgersync.rates.get`",
        "return_value cannot be chained",
        "httpx cannot be mocked",
      ],
      correct: [1],
      explain: "Patch where the name is looked up, not where it is defined.",
    },
    {
      id: "se-2", type: "mcq", points: 2, revise: ["fixtures", "parameterised-tests"],
      prompt: "Which TWO statements about pytest are true?",
      options: [
        "A fixture with scope=\"function\" is rebuilt for every test that uses it",
        "@pytest.mark.parametrize runs one test that loops over the cases, stopping at the first failure",
        "@pytest.mark.parametrize creates a separate test per case, each reported on its own",
        "Fixtures can only return values, never clean up after a test",
      ],
      correct: [0, 2],
      explain: "Each parametrised case is its own test; fixtures can yield and clean up after the yield.",
    },
    {
      id: "se-3", type: "mcq", points: 2, revise: ["branching-and-merging", "git-and-github"],
      prompt: "You pushed a feature branch that a colleague has checked out. You now want main's latest changes in it. What is safest?",
      options: [
        "Rebase on main and force-push",
        "Merge main into the branch (or rebase only if nobody else uses it), then push normally",
        "Delete the remote branch and push a new one",
        "Copy the changed files by hand",
      ],
      correct: [1],
      explain: "Rewriting a shared branch's history breaks your colleague's copy; merging keeps it intact.",
    },
    {
      id: "se-4", type: "code", points: 8, required: true, evidence: "url-and-text", revise: ["reading-and-reviewing-ai-generated-code", "pytest"],
      prompt: "An assistant wrote this matcher. Find at least two real defects, write failing tests that prove each one, then fix it. Submit the commit link and paste the test output before and after the fix.",
      context: `def match(ledger, bank, tolerance=0.01):
    matched = []
    for l in ledger:
        for b in bank:
            if abs(l["amount"] - b["amount"]) < tolerance and l["ref"] == b["ref"]:
                matched.append((l, b))
    return matched`,
      rubric: [
        { id: "defects", label: "Real defects found", points: 4, descriptor: "At least two of: one bank line can match several ledger lines; None == None matches unreferenced lines; < excludes an exact tolerance edge; float money arithmetic; O(n×m) cost." },
        { id: "tests", label: "Tests prove them", points: 2, descriptor: "Each defect has a test that failed before the fix and passes after." },
        { id: "fix", label: "Fix is correct", points: 2, descriptor: "The fix removes the defects without breaking ordinary matches." },
      ],
      guidance: "Do not award the defects criterion for style comments; each defect must change a result.",
    },
    {
      id: "se-5", type: "project", points: 6, evidence: "url", revise: ["code-quality", "project-structure"],
      prompt: "Link a CI run (e.g. GitHub Actions) that runs ruff, mypy and pytest on push for LedgerSync, and a run where a deliberate failure was caught.",
      rubric: [
        { id: "pipeline", label: "Pipeline runs the three checks", points: 3, descriptor: "ruff, mypy and pytest all run on push or pull request." },
        { id: "caught", label: "A failure was caught", points: 3, descriptor: "A linked red run shows the pipeline stopping a defect." },
      ],
    },
  ],
};

export const SQL_FOUNDATIONS: Assessment = {
  id: "sql-foundations",
  version: 1,
  topicId: "sql-foundations",
  skills: ["sql"],
  title: "SQL: reconcile an unfamiliar ledger",
  summary: "Given an unfamiliar finance dataset: join tables, find unmatched transactions, use CTEs and window functions, and explain the result.",
  objectives: [
    "Find unmatched rows with anti-joins, handling NULL correctly.",
    "Aggregate by account and month.",
    "Compute running balances with window functions.",
    "Reconcile totals with CTEs and explain the differences in business terms.",
  ],
  difficulty: "intermediate",
  passPercent: 70,
  minutes: 90,
  items: [
    {
      id: "sql-1", type: "sql", fixture: "recon", points: 4, required: true, ordered: true, revise: ["joins-and-anti-joins", "case-and-null-handling"],
      prompt: "Return the entry_id of every ledger entry with no matching bank line, ordered by entry_id. A match needs the same account_id, the same amount and the same reference; treat two missing references as equal.",
      reference: `SELECT e.entry_id FROM ledger_entries e
        WHERE NOT EXISTS (SELECT 1 FROM bank_lines b WHERE b.account_id = e.account_id AND b.amount = e.amount AND b.reference IS e.reference)
        ORDER BY e.entry_id`,
      explain: "NOT EXISTS (or LEFT JOIN … IS NULL) finds the unmatched rows; `=` never matches two NULLs, so use `IS` or COALESCE for the reference.",
    },
    {
      id: "sql-2", type: "sql", fixture: "recon", points: 3, ordered: true, revise: ["aggregations"],
      prompt: "Ledger totals by account and month. Columns: account_id, month ('YYYY-MM'), total rounded to 2 decimals. Order by account_id, then month.",
      reference: `SELECT account_id, substr(entry_date, 1, 7) AS month, ROUND(SUM(amount), 2) AS total
        FROM ledger_entries GROUP BY account_id, month ORDER BY account_id, month`,
      explain: "GROUP BY both the account and the month expression.",
    },
    {
      id: "sql-3", type: "sql", fixture: "recon", points: 4, required: true, ordered: true, revise: ["window-functions"],
      prompt: "Running ledger balance per account. Columns: account_id, entry_id, balance (rounded to 2 decimals) — the sum of that account's amounts up to and including this entry, in entry_date then entry_id order. Order the output by account_id, entry_date, entry_id.",
      reference: `SELECT account_id, entry_id,
          ROUND(SUM(amount) OVER (PARTITION BY account_id ORDER BY entry_date, entry_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS balance
        FROM ledger_entries ORDER BY account_id, entry_date, entry_id`,
      explain: "SUM() OVER (PARTITION BY account ORDER BY date, id) gives a running total per account.",
    },
    {
      id: "sql-4", type: "sql", fixture: "recon", points: 4, required: true, ordered: true, revise: ["ctes-and-subqueries", "joins-and-anti-joins"],
      prompt: "Accounts whose ledger and bank totals disagree. Columns: account_id, ledger_total, bank_total, difference (ledger minus bank), each rounded to 2 decimals. Leave out accounts that agree. Order by account_id. Use CTEs.",
      reference: `WITH l AS (SELECT account_id, SUM(amount) AS t FROM ledger_entries GROUP BY account_id),
             b AS (SELECT account_id, SUM(amount) AS t FROM bank_lines GROUP BY account_id)
        SELECT a.account_id, ROUND(COALESCE(l.t, 0), 2) AS ledger_total, ROUND(COALESCE(b.t, 0), 2) AS bank_total,
               ROUND(COALESCE(l.t, 0) - COALESCE(b.t, 0), 2) AS difference
        FROM accounts a LEFT JOIN l USING (account_id) LEFT JOIN b USING (account_id)
        WHERE ROUND(COALESCE(l.t, 0) - COALESCE(b.t, 0), 2) <> 0 ORDER BY a.account_id`,
      explain: "One CTE per side, joined from accounts so an account with rows on only one side still appears.",
    },
    {
      id: "sql-5", type: "mcq", points: 2, revise: ["case-and-null-handling"],
      prompt: "`SELECT entry_id FROM ledger_entries WHERE reference NOT IN (SELECT reference FROM bank_lines)` returns no rows at all, although some references are clearly missing from the bank. Why?",
      options: [
        "NOT IN cannot be used with a subquery",
        "The subquery returns a NULL reference, so `x NOT IN (…, NULL)` is never true",
        "The tables use different collations",
        "NOT IN only compares the first row",
      ],
      correct: [1],
      explain: "With a NULL in the list, NOT IN evaluates to unknown for every row. Use NOT EXISTS.",
    },
    {
      id: "sql-6", type: "debug", language: "sql", points: 2, revise: ["joins-and-anti-joins"],
      prompt: "This is meant to list every account with its February bank total, including accounts with no February lines. Accounts with no February lines disappear. Why?",
      code: `SELECT a.account_id, SUM(b.amount) AS feb_total
FROM accounts a LEFT JOIN bank_lines b ON b.account_id = a.account_id
WHERE b.value_date >= '2026-02-01' AND b.value_date < '2026-03-01'
GROUP BY a.account_id;`,
      options: [
        "SUM ignores NULL, so the account is dropped",
        "The WHERE filter on b rejects the NULL rows the LEFT JOIN produced; move the date conditions into the ON clause",
        "GROUP BY must include b.amount",
        "Dates cannot be compared as text",
      ],
      correct: [1],
      explain: "Filtering the outer table's columns in WHERE turns the LEFT JOIN into an inner join.",
    },
    {
      id: "sql-7", type: "scenario", points: 6, required: true, evidence: "text", revise: ["joins-and-anti-joins", "ctes-and-subqueries"],
      prompt: "Using your queries, explain each difference you found to the finance controller: which entries or bank lines cause it, the likely business reason, and the action you would take. Paste the supporting query output.",
      rubric: [
        { id: "trace", label: "Every difference traced", points: 3, descriptor: "Each account's difference is fully explained by specific entry_ids and line_ids, and the amounts add up." },
        { id: "reason", label: "Plausible business reasons", points: 2, descriptor: "E.g. a short-paid invoice, an unrecorded bank charge or interest, a payment not yet cleared." },
        { id: "action", label: "Sensible action", points: 1, descriptor: "Who to ask, what to post, or what to wait for; no forced matching." },
      ],
      guidance: "OPS-GBP 123.50 = INV-1003 short-paid by 200.00 (entry 5 vs line 105), SUP-81 −89.00 not yet in the bank (entry 14), bank charge −12.50 not in the ledger (line 108). OPS-EUR 1,335.00 = EU-503 1,430.00 not received (entry 11), interest 95.00 not in the ledger (line 114).",
    },
  ],
};
