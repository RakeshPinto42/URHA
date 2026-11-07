# URHA — Curated curriculum map

Generated 2026-11-07 by `npm run curriculum:doc`. Do not edit by hand.

Videos verified against YouTube public metadata on 2026-11-07 (title, channel, duration, chapters). Documentation links checked on 2026-11-01. **328 subtopics; 325 video-led, 3 pending; 203 with a supplement; about 139 h of focused watching and 260 h of exercises.** Every subtopic: one primary resource, an optional supplement, an exercise with practice minutes.

## Phase 1 — Programming, SQL and databases (months 1–3)

**Exit gate:** Independently understand, modify, debug and test a small application you wrote.

### Python foundations

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Python fundamentals where gaps exist | [Learn Python - Full Course for Beginners [Tutorial]](https://www.youtube.com/watch?v=rfscVS0vtbw) · freeCodeCamp.org · 267 min | [The Python Tutorial](https://docs.python.org/3/tutorial/) · Python Software Foundation (docs) | Write a 30-line script that reads a bank CSV, totals by currency and prints a report. Revisit only the tutorial chapters you hesitated on. | 45 min |
| Data structures and collections | [Python Tutorial for Beginners 4: Lists, Tuples, and Sets](https://www.youtube.com/watch?v=W8KRzm-HUcc) · Corey Schafer · 29 min | [Python Tutorial for Beginners 5: Dictionaries - Working with Key-Value Pairs](https://www.youtube.com/watch?v=daefaLgNkw0) · Corey Schafer · 10 min | Hold a day of ledger lines as list[dict]; de-duplicate with a set of (date, amount, ref) tuples; total by account in a dict. | 40 min |
| Functions and modular programming | [Python Tutorial for Beginners 8: Functions](https://www.youtube.com/watch?v=9Os0o3wzS_I) · Corey Schafer · 22 min | [Python tutorial: Modules and packages](https://docs.python.org/3/tutorial/modules.html) · Python Software Foundation (docs) | Split the report script into pure functions (parse, validate, summarise) with no global state. | 45 min |
| Exception handling | [Python Tutorial: Using Try/Except Blocks for Error Handling](https://www.youtube.com/watch?v=NIWwJbo-9_8) · Corey Schafer · 11 min | [Python tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) · Python Software Foundation (docs) | Define ValidationError carrying row number and reason; collect all errors instead of stopping at the first bad row. | 40 min |
| File handling | [Python Tutorial: File Objects - Reading and Writing to Files](https://www.youtube.com/watch?v=Uh2ebFW8OYM) · Corey Schafer · 25 min | [Python Tutorial: Context Managers - Efficiently Managing Resources](https://www.youtube.com/watch?v=-aKFBoZpiqA) · Corey Schafer · 21 min | Read inputs with pathlib and context managers; write a dated report without overwriting an existing one. | 30 min |
| JSON processing | [Python Tutorial: Working with JSON Data using the json Module](https://www.youtube.com/watch?v=9N6a-VLBa2I) · Corey Schafer · 21 min | [json — JSON encoder and decoder](https://docs.python.org/3/library/json.html) · Python Software Foundation (docs) | Export validation errors as JSON and load them back into typed objects. | 30 min |
| Virtual environments | [Python Tutorial: VENV (Mac & Linux) - How to Use Virtual Environments with the Built-In venv Module](https://www.youtube.com/watch?v=Kg1Yvry_Ydk) · Corey Schafer · 14 min | [venv — Creation of virtual environments](https://docs.python.org/3/library/venv.html) · Python Software Foundation (docs) | Create and activate a venv on Windows; confirm `sys.prefix` points inside it. | 20 min |
| Reading error messages and tracebacks | [Traceback (most recent call last): Python's tracebacks explained](https://www.youtube.com/watch?v=Qmj5UQRkL4s) · Python Morsels · 4 min | [Read Python Error Tracebacks Like a Pro: The 5 Most Common Errors](https://www.youtube.com/watch?v=qgUS3QyPgdM) · Data Science for Everyone · 16 min | Break one of your scripts in three different ways, then find each fault from the traceback alone before changing any code. | 30 min |
| Writing code without an AI assistant | — | — | Rewrite a 30-line script from a blank file with the assistant switched off, then compare it with the original and list what you had to look up. | 45 min |

### Python engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Object-oriented programming | [Python OOP Tutorial 1: Classes and Instances](https://www.youtube.com/watch?v=ZDa-Z5JzLYM) · Corey Schafer · 15 min | [Python OOP Tutorial 2: Class Variables](https://www.youtube.com/watch?v=BJ-VvGyQxho) · Corey Schafer · 12 min | Create LedgerLine and BankLine classes with a method that returns their match key. | 45 min |
| Classes, inheritance and composition | [Python OOP Tutorial 4: Inheritance - Creating Subclasses](https://www.youtube.com/watch?v=RSl87lqOXDE) · Corey Schafer · 20 min | [Python OOP Tutorial 3: classmethods and staticmethods](https://www.youtube.com/watch?v=rq8cL2XMM5M) · Corey Schafer · 15 min | Build a Reconciler that has a matcher strategy (composition); swap exact matching for tolerance matching without subclassing. | 60 min |
| Type hints | [Python Tutorial: Type Hints - From Basic Annotations to Advanced Generics](https://www.youtube.com/watch?v=RwH2UzC2rIo) · Corey Schafer · 41 min | [The REAL Reason You Should Use Type Hints in Python](https://www.youtube.com/watch?v=0oBLMwHdZ2Y) · ArjanCodes · 13 min | Annotate the loader fully and make `mypy --strict` pass. | 45 min |
| Modules and packages | [Python Tutorial for Beginners 9: Import Modules and Exploring The Standard Library](https://www.youtube.com/watch?v=CqvZ3vGoGs0) · Corey Schafer · 22 min | [src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) · Python Packaging Authority (docs) | Restructure into a src/ledgersync package and run it with `python -m ledgersync`. | 40 min |
| Decorators and generators concepts | [Python Tutorial: Decorators - Dynamically Alter The Functionality Of Your Functions](https://www.youtube.com/watch?v=FsAPt_9Bf3U) · Corey Schafer · 30 min | [Python Tutorial: Generators - How to use them and the benefits you receive](https://www.youtube.com/watch?v=bD05uGo_sVI) · Corey Schafer · 11 min | Write a @timed decorator, and a generator that streams a 1,000,000-row CSV without loading it into memory. | 60 min |
| Dependency management | [Python Tutorial: UV - A Faster, All-in-One Package Manager to Replace Pip and Venv](https://www.youtube.com/watch?v=AMdG7IjgSPM) · Corey Schafer · 27 min | [uv documentation](https://docs.astral.sh/uv/) · Astral (docs) | Move the project to uv: pyproject.toml, `uv add`, and a committed uv.lock. | 40 min |
| Async programming fundamentals | [Python Tutorial: AsyncIO - Complete Guide to Asynchronous Programming with Animations](https://www.youtube.com/watch?v=oAkLSJNr5zY) · Corey Schafer · 103 min | [asyncio — Asynchronous I/O](https://docs.python.org/3/library/asyncio.html) · Python Software Foundation (docs) | Fetch three exchange-rate endpoints concurrently with asyncio.gather; compare with the sequential timing. | 60 min |
| Environment variables | [Python Quick Tip: Hiding Passwords and Secret Keys in Environment Variables (Mac & Linux)](https://www.youtube.com/watch?v=5iWhQWVXosU) · Corey Schafer · 5 min | [Hiding Passwords and Secret Keys in Environment Variables (Windows)](https://www.youtube.com/watch?v=sX_T0thJTss) · Techie Coder · 4 min | Read DB_URL and LOG_LEVEL from the environment; fail at start-up with a clear message if DB_URL is missing. | 20 min |
| Application configuration | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=32033s) · freeCodeCamp.org · 8:53:53–9:21:20 · 27 min | [FastAPI Settings: Why You Should Use Pydantic-Settings](https://www.youtube.com/watch?v=iDgbS3RTkTE) · Analytics Vidhya · 5 min | Create a typed Settings class (pydantic-settings) with defaults, .env support and validation. | 40 min |

### Software engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Git and GitHub | [Lecture 6: Version Control (git) (2020)](https://www.youtube.com/watch?v=2sjqTHE0zok) · Missing Semester · 85 min | [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow) · GitHub (docs) | Initialise the repository, make small meaningful commits and push to a private GitHub repository. | 45 min |
| Branching and merging | [Git Branching and Merging Tutorial for Beginners: Create, Switch & Merge](https://www.youtube.com/watch?v=7YovOpvO3S0) · freeplacementcourse · 12 min | [Git Branching and Merging - Detailed Tutorial](https://www.youtube.com/watch?v=Q1kHG842HoI) · SuperSimpleDev · 54 min | Create a feature branch, cause a merge conflict on purpose, resolve it, then open and merge a pull request. | 45 min |
| Project structure | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=176s) · mCoding · 2:56–8:35 · 6 min | [src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) · Python Packaging Authority (docs) | Adopt a src/ layout with tests/ beside it; document the structure in the README. | 30 min |
| Debugging | [How to Debug Python with VSCode](https://www.youtube.com/watch?v=w8QHoVam1-I) · Jayanam · 6 min | [Python debugging in VS Code](https://code.visualstudio.com/docs/python/debugging) · Microsoft (docs) | Use a conditional breakpoint to stop on the row where a running total turns negative. | 30 min |
| Logging | [Python Tutorial: Logging Advanced - Loggers, Handlers, and Formatters](https://www.youtube.com/watch?v=jxmzY9soFXg) · Corey Schafer · 20 min | [Logging in Python  //  Learn Python Programming  (Computer Science)](https://www.youtube.com/watch?v=g8nQ90Hk328) · Socratica · 8 min | Configure file and console handlers; log each rejected row at WARNING with its reason. | 40 min |
| pytest | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0) · freeCodeCamp.org · 0:00–29:49 · 30 min | — | Write five tests for the validator, including one that expects an exception with pytest.raises. | 45 min |
| Fixtures | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=1789s) · freeCodeCamp.org · 29:49–41:10 · 11 min | [pytest: How to use fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html) · pytest-dev (docs) | Create a fixture that builds a small sample ledger and use it in three tests. | 30 min |
| Parameterised tests | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=2470s) · freeCodeCamp.org · 41:10–55:24 · 14 min | [pytest: How to parametrize](https://docs.pytest.org/en/stable/how-to/parametrize.html) · pytest-dev (docs) | Parametrise date-format validation with ten valid and invalid cases. | 30 min |
| Mocking | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=3324s) · freeCodeCamp.org · 55:24–1:13:16 · 18 min | [How to use Python's unittest.mock.patch](https://www.youtube.com/watch?v=WFRljVPHrkE) · redshiftzero · 8 min | Mock the exchange-rate HTTP call so tests run offline; assert it was called with the right currency. | 45 min |
| Code quality | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=515s) · mCoding · 8:35–10:58 · 2 min | [Ruff documentation](https://docs.astral.sh/ruff/) · Astral (docs) | Add ruff and mypy, fix every finding, and run both in CI. | 40 min |
| Reading and reviewing AI-generated code | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=4396s) · freeCodeCamp.org · 1:13:16–1:28:38 · 15 min | [The REAL Reason You Should Use Type Hints in Python](https://www.youtube.com/watch?v=0oBLMwHdZ2Y) · ArjanCodes · 13 min | Ask an assistant for a matching function; review it line by line and write tests that expose at least two defects. Record them. | 60 min |

### SQL and database foundations

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| SQL fundamentals and advanced querying | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=2041s) · Data with Baraa · 34:01–1:32:31 · 59 min | [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html) · PostgreSQL Global Development Group (docs) | Query the ledger: filter by period, sort by amount, return the top ten exceptions. | 60 min |
| Joins and anti-joins | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=10077s) · Data with Baraa · 2:47:57–4:02:09 · 74 min | — | Find unmatched bank lines with LEFT JOIN … IS NULL and with NOT EXISTS; compare their plans. | 60 min |
| Aggregations | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=31416s) · Data with Baraa · 8:43:36–8:50:11 · 7 min | — | Totals by account and month with GROUP BY, and HAVING for variances over a threshold. | 40 min |
| CASE and NULL handling | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=25146s) · Data with Baraa · 6:59:06–8:43:36 · 105 min | — | Classify debit/credit with CASE; use COALESCE so a missing reference does not break matching. | 45 min |
| CTEs and subqueries | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=46684s) · Data with Baraa · 12:58:04–15:35:02 · 157 min | [PostgreSQL: WITH Queries (CTEs)](https://www.postgresql.org/docs/current/queries-with.html) · PostgreSQL Global Development Group (docs) | Rewrite a nested-subquery reconciliation report as a readable chain of CTEs. | 60 min |
| Window functions | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=31811s) · Data with Baraa · 8:50:11–12:40:34 · 230 min | [PostgreSQL: Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html) · PostgreSQL Global Development Group (docs) | Running balance per account with SUM() OVER (PARTITION BY … ORDER BY …); rank the largest variances per month. | 90 min |
| PostgreSQL | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=8651s) · freeCodeCamp.org · 2:24:11–3:12:10 · 48 min | [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html) · PostgreSQL Global Development Group (docs) | Install PostgreSQL locally; create the ledgersync database and a least-privilege application user. | 45 min |
| Relational data modelling | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=3962s) · Ansh Lamba · 1:06:02–2:21:29 · 75 min | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=8489s) · Ansh Lamba · 2:21:29–2:47:08 · 26 min | Draw the ER diagram for entities, accounts, transactions and matches; normalise it to 3NF. | 60 min |
| Keys and constraints | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=5227s) · Ansh Lamba · 1:27:07–1:50:51 · 24 min | [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) · PostgreSQL Global Development Group (docs) | Add primary, foreign, unique and CHECK constraints; prove each by inserting a row it must reject. | 45 min |
| Transactions | [Relational Database ACID Transactions (Explained by Example)](https://www.youtube.com/watch?v=pomxJOFVcQs) · Hussein Nasser · 43 min | [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) · PostgreSQL Global Development Group (docs) | Load a file in one transaction; inject a failure halfway and prove nothing was committed. | 45 min |
| Indexing fundamentals | [Database Indexing Explained (with PostgreSQL)](https://www.youtube.com/watch?v=-qNSXK7s7_w) · Hussein Nasser · 18 min | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=66222s) · Data with Baraa · 18:23:42–20:20:31 · 117 min | EXPLAIN ANALYZE the unmatched-lines query before and after adding an index; record the timings. | 45 min |
| Database connectivity | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=14301s) · freeCodeCamp.org · 3:58:21–4:31:18 · 33 min | [Psycopg 3 documentation](https://www.psycopg.org/psycopg3/docs/) · Psycopg (docs) | Connect with psycopg 3 using parameterised queries only; insert validated rows in batches. | 45 min |

## Phase 2 — Data engineering and finance analytics (months 4–7)

**Exit gate:** Run a reproducible pipeline from raw extracts to a Power BI report, and prove its totals reconcile to source.

### Pandas for finance data

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Selective pandas for loading and checking data | [Python Pandas Tutorial (Part 1): Getting Started with Data Analysis - Installation and Loading Data](https://www.youtube.com/watch?v=ZyhVh-qRZPA) · Corey Schafer · 23 min | [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html) · pandas (docs) | Load a bank CSV with pandas, clean dates and amounts, merge it with the ledger extract and write the result to PostgreSQL. | 60 min |
| DataFrames and indexing | [Learn Pandas in Under 3 Hours / Filtering, Joins, Indexing, Data Cleaning, Visualizations](https://www.youtube.com/watch?v=Mdq1WWSdUtw&t=30s) · Alex The Analyst · 0:30–41:33 · 41 min | — | Load a GL extract and select one cost centre's lines by label and by position. | 30 min |
| Cleaning and type conversion | [Learn Pandas in Under 3 Hours / Filtering, Joins, Indexing, Data Cleaning, Visualizations](https://www.youtube.com/watch?v=Mdq1WWSdUtw&t=5385s) · Alex The Analyst · 1:29:45–2:07:53 · 38 min | — | Fix mixed date formats, stray spaces and text amounts in a messy extract, and record each rule you applied. | 45 min |
| Merging and reshaping | [Learn Pandas in Under 3 Hours / Filtering, Joins, Indexing, Data Cleaning, Visualizations](https://www.youtube.com/watch?v=Mdq1WWSdUtw&t=3132s) · Alex The Analyst · 52:12–1:13:29 · 21 min | — | Join transactions to a chart of accounts, find what failed to join, and pivot the result to accounts by month. | 45 min |
| Grouping and aggregation | [Learn Pandas in Under 3 Hours / Filtering, Joins, Indexing, Data Cleaning, Visualizations](https://www.youtube.com/watch?v=Mdq1WWSdUtw&t=2493s) · Alex The Analyst · 41:33–52:12 · 11 min | — | Total spend by cost centre and quarter, and check the grand total against source. | 30 min |
| Dates and period handling | [Python Pandas Tutorial (Part 10): Working with Dates and Time Series Data](https://www.youtube.com/watch?v=UFuo7EHI8zc) · Corey Schafer · 36 min | — | Convert posting dates to fiscal periods and resample to monthly totals. | 30 min |
| Pandas or SQL: choosing the right tool | [Pandas vs SQL - What's The Difference?](https://www.youtube.com/watch?v=4GhcNuOXJLU) · The Comparison Channel · 5 min | [Pandas vs SQL for Data Analytics](https://www.youtube.com/watch?v=9n7nJF38mfY) · Fahd Mirza · 5 min | Solve one report in both pandas and SQL, then write down which you would keep and why. | 30 min |

### Data ingestion and validation

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Extract, load and transform | [SQL Data Warehouse from Scratch / Full Hands-On Data Engineering Project](https://www.youtube.com/watch?v=9GVqKuTVANE&t=581s) · Data with Baraa · 9:41–20:29 · 11 min | — | Sketch your P1 pipeline's stages and build the first extract and load. | 60 min |
| Incremental loads | [How to build ETL pipeline with Incremental Data Load with Python / Python /  ETL](https://www.youtube.com/watch?v=a_T8xRaCO60) · BI Insights Inc · 6 min | [Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass](https://www.youtube.com/watch?v=7pee6_Sq3VY&t=14322s) · Ansh Lamba · 3:58:42–4:05:56 · 7 min | Change your load to bring in only rows posted since the last run. | 60 min |
| Schema validation | [Python Pydantic Tutorial: Complete Data Validation Course (Used by FastAPI)](https://www.youtube.com/watch?v=M81pfi64eeM) · Corey Schafer · 89 min | — | Define Pydantic models for a GL line and reject invalid rows with a reason. | 45 min |
| Data quality rules | [How to test your Data Pipelines with Great Expectations](https://www.youtube.com/watch?v=7UQ91Ib7PtU) · BI Insights Inc · 9 min | — | Write rules that fail the pipeline when debits and credits do not balance or a period is missing. | 45 min |
| Reconciliation checks | [ETL Testing:Mastering Source vs Target Validation in SQL: Complete Guide](https://www.youtube.com/watch?v=ZfboXQua0io) · SRTechnologies Ravindra Reddy · 15 min | [Part 0: [INTRO]Automation Data Reconciliation & Testing (That Actually Works)](https://www.youtube.com/watch?v=8llaSKq6Mxo) · ETL and Data Pipeline Testing · 7 min | After each load, compare row counts and totals by account between source and target, and write the differences to a table. | 60 min |
| Pipeline logging and reruns | [Idempotent Data Pipelines / Building Reliable & Fault-Tolerant Data Workflows / Uplatz](https://www.youtube.com/watch?v=GcU2vxYrA3g) · Uplatz · 9 min | [Data ingestion pipeline with built-in error handling](https://www.youtube.com/watch?v=Ne9GAuuKLdc) · CloverDX · 7 min | Log each run's counts and outcome, then rerun the pipeline and prove nothing doubled. | 45 min |

### Finance data modelling

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Facts and dimensions | [Data Modeling in Power BI Full Course for Beginners (5 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=pQSMbRA3O6g&t=890s) · Data with Baraa · 14:50–18:45 · 4 min | — | List the facts and dimensions in your GL, budget and forecast data, stating the grain of each fact. | 30 min |
| Star schemas | [Data Modeling in Power BI Full Course for Beginners (5 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=pQSMbRA3O6g&t=1125s) · Data with Baraa · 18:45–27:42 · 9 min | [SQL Data Warehouse from Scratch / Full Hands-On Data Engineering Project](https://www.youtube.com/watch?v=9GVqKuTVANE&t=12737s) · Data with Baraa · 3:32:17–3:34:06 · 2 min | Draw and create a star schema for GL actuals in PostgreSQL. | 60 min |
| Chart of accounts hierarchies | [Power BI Parent Child Chart of Accounts with DAX](https://www.youtube.com/watch?v=xBlu6QmInY4) · Control Over Reports B.V. · 13 min | [Power BI Parent Child Chart of Accounts with M (Power Query)](https://www.youtube.com/watch?v=YiTyWUeuwKI) · Control Over Reports B.V. · 16 min | Model your chart of accounts as a parent-child hierarchy and flatten it for reporting. | 60 min |
| Slowly changing dimensions | [SCD Type 1 and Type 2 using SQL / Implementation of Slowly Changing Dimensions](https://www.youtube.com/watch?v=kii_Kukh4po) · Ankit Bansal · 29 min | [SCD: Slowly changing dimensions explained with real examples](https://www.youtube.com/watch?v=XqdZF0DJpUs) · Tech Coach · 26 min | Track a cost centre's change of owner as a Type 2 dimension, so old reports stay correct. | 60 min |
| Actuals, budget and forecast versions | — | — | Add a version dimension so one fact table holds actuals, budget and two forecast versions, and query each against the others. | 60 min |
| Currency and period conventions | [Simple Currency Conversion in Power BI w/DAX](https://www.youtube.com/watch?v=i8WKBiTHqVI) · Enterprise DNA · 13 min | [How to Create Fiscal Dates Table in Power BI / Power BI CalendarAuto Function](https://www.youtube.com/watch?v=Y1jqDcYsTEc) · Data Science Tutorials · 7 min | Add a rates table and a fiscal calendar, then report one entity in both local and group currency. | 60 min |

### Databricks and PySpark

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Distributed processing concepts | [Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass](https://www.youtube.com/watch?v=7pee6_Sq3VY&t=421s) · Ansh Lamba · 7:01–19:38 · 13 min | — | Explain in writing why a Spark job splits work across a cluster, and when your data would not need it. | 30 min |
| Databricks workspace and notebooks | [Databricks Tutorial for Beginners 2026 / Free Edition + Full 101 Guide](https://www.youtube.com/watch?v=SelEvwHQQ2Y&t=175s) · First Principles Data Engineering · 2:55–7:40 · 5 min | [Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass](https://www.youtube.com/watch?v=7pee6_Sq3VY&t=2436s) · Ansh Lamba · 40:36–1:08:49 · 28 min | Set up the free edition and run a first notebook against your GL sample. | 45 min |
| PySpark DataFrames | [Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass](https://www.youtube.com/watch?v=7pee6_Sq3VY&t=6679s) · Ansh Lamba · 1:51:19–2:09:25 · 18 min | — | Rewrite your pandas monthly summary in PySpark and compare the two. | 60 min |
| Delta tables | [Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass](https://www.youtube.com/watch?v=7pee6_Sq3VY&t=7765s) · Ansh Lamba · 2:09:25–3:02:30 · 53 min | [Delta Lake Databricks (From Zero to Pro in 4 HOURS) / Delta Lake Pyspark](https://www.youtube.com/watch?v=O18afGTGoIU) · Ansh Lamba · 240 min | Store GL data as a Delta table, correct a posting, and use time travel to view the earlier state. | 45 min |
| Medallion architecture | [Databricks Tutorial for Beginners 2026 / Free Edition + Full 101 Guide](https://www.youtube.com/watch?v=SelEvwHQQ2Y&t=835s) · First Principles Data Engineering · 13:55–17:15 · 3 min | [Databricks tutorial - an intro to the medallion architecture](https://www.youtube.com/watch?v=u3MSka3WLpE) · Kokchun Coding Tutorials · 7 min | Lay out bronze, silver and gold tables for P1 and say what each layer guarantees. | 45 min |
| Jobs and scheduling | [Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass](https://www.youtube.com/watch?v=7pee6_Sq3VY&t=14756s) · Ansh Lamba · 4:05:56–4:14:35 · 9 min | — | Schedule your notebook as a job and handle a failed run. | 30 min |

### Power BI

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Power Query transformations | [Power BI Full Course / Master DAX, Data Preparation, Modeling & Visualization](https://www.youtube.com/watch?v=wJjKyIt2lBM&t=6000s) · DataCamp · 1:40:00–2:08:25 · 28 min | — | Clean a budget file in Power Query with steps someone else could follow. | 45 min |
| Semantic models and relationships | [Data Modeling in Power BI Full Course for Beginners (5 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=pQSMbRA3O6g&t=1662s) · Data with Baraa · 27:42–1:02:47 · 35 min | — | Load your star schema and set the relationships, cardinality and filter direction. | 45 min |
| DAX measures | [Power BI Full Course / Master DAX, Data Preparation, Modeling & Visualization](https://www.youtube.com/watch?v=wJjKyIt2lBM&t=2246s) · DataCamp · 37:26–59:56 · 23 min | — | Write measures for actuals, budget, variance and variance percentage. | 60 min |
| Time intelligence | [Power BI Full Course / Master DAX, Data Preparation, Modeling & Visualization](https://www.youtube.com/watch?v=wJjKyIt2lBM&t=3596s) · DataCamp · 59:56–1:07:22 · 7 min | — | Add year-to-date and prior-year comparisons using a date table. | 45 min |
| Report design for finance | [Power BI Full Course / Master DAX, Data Preparation, Modeling & Visualization](https://www.youtube.com/watch?v=wJjKyIt2lBM&t=4311s) · DataCamp · 1:11:51–1:29:00 · 17 min | [Power BI Tutorial for Beginners (Step-by-Step in 30 Minutes)](https://www.youtube.com/watch?v=OmW9YvxSl1E) · Guy in a Cube · 31 min | Design one page a finance leader could read in a minute, removing everything that does not help. | 45 min |
| Row-level security | [Data Modeling in Power BI Full Course for Beginners (5 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=pQSMbRA3O6g&t=7738s) · Data with Baraa · 2:08:58–2:40:08 · 31 min | — | Restrict each entity's users to their own data and test it as a role. | 30 min |

### FP&A and commercial analytics

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Variance analysis in code | [Budget vs Actual in Python: Build a Real Finance Tool in 20 Minutes](https://www.youtube.com/watch?v=6NJ3pcGpkBQ) · AutoSolve · 35 min | — | Build an actual-versus-budget report in pandas with materiality thresholds. | 60 min |
| Price, volume and mix | [Price Volume Mix (PVM) for Revenue Variance Analysis](https://www.youtube.com/watch?v=23tkOExq7t0) · KnowledgeBank by obviEnce · 16 min | [Price Volume Mix Analysis in Power BI: Complete PVM Tutorial](https://www.youtube.com/watch?v=cRDPoVkfJvE) · Zebra BI · 22 min | Build a price, volume and mix bridge in code and check it sums to the total change. | 60 min |
| Forecasting methods | [Time Series Forecasting in Python – Tutorial for Beginners](https://www.youtube.com/watch?v=fxx_E0ojKrc) · freeCodeCamp.org · 93 min | [Time Series Analysis Crash Course: Predict the Future with Python](https://www.youtube.com/watch?v=eKiXtGzEjos&t=6116s) · Data Heroes · 1:41:56–2:45:44 · 64 min | Compare a naive forecast with exponential smoothing on monthly revenue. | 60 min |
| Forecast accuracy | [Calculating Measurement Error using Python](https://www.youtube.com/watch?v=CNn3TwL4ZZ0) · Stephanie Powers · 15 min | — | Backtest your forecast and report MAPE, then say where the measure misleads. | 45 min |
| Customer profitability | [Customer Profitability Analysis (Activity Based Costing)](https://www.youtube.com/watch?v=dO45fx-Ll2Q) · Edspira · 10 min | — | Assign cost-to-serve to customers and rank them by true profitability. | 60 min |
| Margin analytics | [Price Volume Mix PVM for Gross Margin Variance Analysis](https://www.youtube.com/watch?v=nVl6JGJEKqI) · KnowledgeBank by obviEnce · 14 min | [Analyze Margin Changes Over Time - Analytics With Power BI & DAX](https://www.youtube.com/watch?v=llNNuR-x8yE) · Enterprise DNA · 7 min | Analyse gross margin by product and customer, and identify the main drivers of movement. | 45 min |

## Phase 3 — Applied AI and RAG (months 8–11)

**Exit gate:** Demonstrate retrieval quality, source grounding, access-aware search and measured answer quality.

### LLM engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| LLM architecture and fundamentals | [[1hr Talk] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) · Andrej Karpathy · 0:00–21:05 · 21 min | [Transformers, the tech behind LLMs / Deep Learning Chapter 5](https://www.youtube.com/watch?v=wjZofJX0v4M) · 3Blue1Brown · 27 min | Explain pre-training, fine-tuning and inference on one page, in plain words, for a finance colleague. | 60 min |
| Tokens and context windows | [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI&t=467s) · Andrej Karpathy · 7:47–14:27 · 7 min | [Claude: Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) · Anthropic (docs) | Count the tokens of a month-end variance prompt with the provider's counting API; estimate cost on two model sizes. | 30 min |
| Model selection | [Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi](https://www.youtube.com/watch?v=2ld7cR9y0Po) · Optimized AI Conference · 20 min | [Claude: Models overview](https://platform.claude.com/docs/en/models/overview) · Anthropic (docs) | Run the same variance task on a small and a large model; table quality, latency and cost. | 45 min |
| Temperature and sampling | [Transformers, the tech behind LLMs / Deep Learning Chapter 5](https://www.youtube.com/watch?v=wjZofJX0v4M&t=1342s) · 3Blue1Brown · 22:22–26:03 · 4 min | [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI&t=1561s) · Andrej Karpathy · 26:01–31:09 · 5 min | Run a classification prompt ten times at temperature 0 and 1; measure how often the label changes. | 30 min |
| Context limitations | [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI&t=4832s) · Andrej Karpathy · 1:20:32–1:46:56 · 26 min | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | Give the model a policy too long to fit; show what goes wrong, then fix it by selecting only relevant sections. | 45 min |
| Model cost and latency | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=443s) · AI Jason · 7:23–19:26 · 12 min | — | Log tokens in/out, latency and cost per call; produce a cost summary per endpoint. | 45 min |
| OpenAI APIs | [Python + AI: Function calling & structured outputs](https://www.youtube.com/watch?v=4rFVLMBwjGY) · Microsoft Reactor · 63 min | [OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling) · OpenAI (docs) | Call the OpenAI API with the official Python SDK and return a typed result. | 45 min |
| API authentication | [How to setup Azure OpenAI service and use it in Python](https://www.youtube.com/watch?v=50ZwmkCvE88) · SL7 Tech · 16 min | [Claude API: Messages](https://platform.claude.com/docs/en/api/messages) · Anthropic (docs) | Load provider keys from the environment only; prove no key appears in logs, errors or the repository. | 20 min |
| Streaming | [How to Stream OpenAI Responses in Python (Sync & Async)](https://www.youtube.com/watch?v=FJJn3ZVm3VA) · Raj Kapadia · 16 min | [Claude: Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming) · Anthropic (docs) | Stream a long explanation token by token; handle a dropped connection mid-stream. | 40 min |
| Structured outputs | [Pydantic is all you need: Jason Liu](https://www.youtube.com/watch?v=yj-wSRJwrrc) · AI Engineer · 18 min | [Claude: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · Anthropic (docs) | Return variance explanations as a Pydantic model; retry on validation failure. | 60 min |
| JSON schemas | [Pydantic is all you need: Jason Liu](https://www.youtube.com/watch?v=yj-wSRJwrrc) · AI Engineer · 18 min | [OpenAI: Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) · OpenAI (docs) | Generate a JSON Schema from the Pydantic model and use it as the response schema. | 30 min |
| Function calling | [Python + AI: Function calling & structured outputs](https://www.youtube.com/watch?v=4rFVLMBwjGY) · Microsoft Reactor · 63 min | [OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling) · OpenAI (docs) | Define get_account_balance for the model to call; execute it and return the result. | 45 min |
| Tool calling | [Python + AI: Function calling & structured outputs](https://www.youtube.com/watch?v=4rFVLMBwjGY) · Microsoft Reactor · 63 min | [Claude: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · Anthropic (docs) | Implement the full Claude tool-use loop: tool_use → run tool → tool_result → final answer. | 60 min |
| Provider abstraction | [Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi](https://www.youtube.com/watch?v=2ld7cR9y0Po) · Optimized AI Conference · 20 min | — | Write an LLMClient protocol with OpenAI and Anthropic implementations, chosen by configuration. | 60 min |
| Model error handling | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Claude API: Errors](https://platform.claude.com/docs/en/api/errors) · Anthropic (docs) | Handle 429, 500 and overloaded errors distinctly; retry only the retryable ones. | 40 min |
| Rate limits | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Claude API: Rate limits](https://platform.claude.com/docs/en/api/rate-limits) · Anthropic (docs) | Read rate-limit headers and throttle concurrency during a batch run. | 40 min |
| Azure OpenAI | [How to setup Azure OpenAI service and use it in Python](https://www.youtube.com/watch?v=50ZwmkCvE88) · SL7 Tech · 16 min | — | Create a deployment and move your variance commentary call onto Azure OpenAI. | 45 min |

### Prompt and context engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| System instructions | [Prompting 101 / Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) · Anthropic · 25 min | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Write the variance analyst's system prompt: role, audience, tone and what it must never do. | 30 min |
| Prompt structure | [Prompting 101 / Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) · Anthropic · 25 min | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Restructure the prompt into tagged sections: context, data, instructions, output format. | 30 min |
| Few-shot prompting | [Prompting 101 / Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) · Anthropic · 25 min | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Add three anonymised real examples; measure accuracy with and without them on 20 cases. | 45 min |
| Context construction | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | — | Build context from the ledger, the prior month and the policy excerpt; drop what the task does not need. | 45 min |
| Output constraints | [Pydantic is all you need: Jason Liu](https://www.youtube.com/watch?v=yj-wSRJwrrc) · AI Engineer · 18 min | [Claude: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · Anthropic (docs) | Constrain output to a schema with an explicit 'insufficient data' option instead of guessing. | 30 min |
| Grounding | — | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Require every figure to cite a row id from the provided data; reject answers with uncited numbers. | 45 min |
| Prompt testing | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE&t=925s) · Hamel Husain · 15:25–23:41 · 8 min | [Claude: Define success and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) · Anthropic (docs) | Create 20 pass/fail-labelled cases and run them on every prompt change. | 60 min |
| Prompt injection fundamentals | [Prompt Injection, explained](https://www.youtube.com/watch?v=FgxwCaL6UTA) · Simon Willison · 12 min | [[1hr Talk] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g&t=3090s) · Andrej Karpathy · 51:30–56:23 · 5 min | Plant an instruction in a transaction memo field; demonstrate the attack, then mitigate it. | 45 min |

### API essentials

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| HTTP fundamentals | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=3454s) · freeCodeCamp.org · 57:34–1:07:29 · 10 min | [HTTP Crash Course / How The Web Works / 15 Minutes](https://www.youtube.com/watch?v=kiVGRA0HiqQ) · WolfDenCode · 14 min | Use curl against a public API; explain every status code and header you see. | 30 min |
| REST architecture | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=2363s) · freeCodeCamp.org · 39:23–57:34 · 18 min | [FastAPI Tutorial — User Guide](https://fastapi.tiangolo.com/tutorial/) · FastAPI (docs) | Design resource URLs and methods for imports, transactions and matches as an OpenAPI sketch. | 40 min |
| FastAPI | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=2181s) · freeCodeCamp.org · 36:21–2:21:34 · 105 min | — | Build the first LedgerSync endpoints (list, get, create transactions) with in-memory storage. | 90 min |
| Pydantic | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=4049s) · freeCodeCamp.org · 1:07:29–1:22:45 · 15 min | [Pydantic documentation](https://pydantic.dev/docs/validation/latest/get-started/) · Pydantic (docs) | Model TransactionIn/Out with validators for amount precision and ISO currency codes. | 45 min |
| Request and response validation | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=19701s) · freeCodeCamp.org · 5:28:21–5:50:08 · 22 min | — | Add response_model to every endpoint so internal fields never leak; test a 422 response. | 40 min |
| API routing | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=22633s) · freeCodeCamp.org · 6:17:13–6:32:49 · 16 min | — | Split the endpoints into routers (imports, transactions, matches) with prefixes and tags. | 30 min |
| Error handling | [Error Handling (How to create Custom Error Handlers and Exceptions) - FastAPI Beyond CRUD (Part 16)](https://www.youtube.com/watch?v=jYbNq6QAQNI) · Ssali Jonathan · 34 min | [FastAPI: Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/) · FastAPI (docs) | Map domain exceptions to 400/404/409 with consistent error bodies via exception handlers. | 40 min |
| API testing | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=54367s) · freeCodeCamp.org · 15:06:07–16:22:09 · 76 min | [FastAPI: Testing](https://fastapi.tiangolo.com/tutorial/testing/) · FastAPI (docs) | Write API tests against a disposable test database with fixtures in conftest.py. | 90 min |

### Knowledge ingestion

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| PDF extraction | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=45s) · Dave Ebbelaar · 0:45–6:12 · 5 min | — | Extract text and tables from three policy PDFs; compare a simple extractor with a layout-aware one. | 60 min |
| Document processing | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=135s) · Dave Ebbelaar · 2:15–9:10 · 7 min | — | Convert PDFs and HTML into one normalised Markdown format with headings preserved. | 45 min |
| Text normalisation | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=372s) · Dave Ebbelaar · 6:12–9:10 · 3 min | — | Normalise whitespace, hyphenation and headers/footers; write a test for each rule. | 40 min |
| Metadata extraction | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=550s) · Dave Ebbelaar · 9:10–14:22 · 5 min | — | Attach source, page, section, owner and access level to every chunk. | 40 min |
| Document ingestion pipelines | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c) · Dave Ebbelaar · 25 min | — | Make ingestion idempotent: re-running on unchanged files changes nothing. | 60 min |
| Excel, CSV and structured-data ingestion | [Python Pandas Tutorial (Part 1): Getting Started with Data Analysis - Installation and Loading Data](https://www.youtube.com/watch?v=ZyhVh-qRZPA) · Corey Schafer · 23 min | [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html) · pandas (docs) | Ingest the close-checklist spreadsheet as typed records, one per row. | 45 min |

### Retrieval engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Embeddings | [Embeddings & Cosine Similarity Explained / Semantic Search, Vector Database & RAG with Examples](https://www.youtube.com/watch?v=rq5pF1iPcZI) · PM Expert · 9 min | [Transformers, the tech behind LLMs / Deep Learning Chapter 5](https://www.youtube.com/watch?v=wjZofJX0v4M&t=747s) · 3Blue1Brown · 12:27–20:22 · 8 min | Embed 20 policy sentences; inspect the nearest neighbours of three questions. | 40 min |
| Vector representations | [Transformers, the tech behind LLMs / Deep Learning Chapter 5](https://www.youtube.com/watch?v=wjZofJX0v4M&t=747s) · 3Blue1Brown · 12:27–20:22 · 8 min | [Embeddings & Cosine Similarity Explained / Semantic Search, Vector Database & RAG with Examples](https://www.youtube.com/watch?v=rq5pF1iPcZI) · PM Expert · 9 min | Tabulate cosine similarities between related and unrelated finance terms. | 30 min |
| Similarity search | [Embeddings & Cosine Similarity Explained / Semantic Search, Vector Database & RAG with Examples](https://www.youtube.com/watch?v=rq5pF1iPcZI) · PM Expert · 9 min | [PGVector: Turn PostgreSQL Into A Vector Database](https://www.youtube.com/watch?v=j1QcPSLj7u0) · NeuralNine · 20 min | Implement top-k cosine search in plain Python, then in pgvector; compare the results. | 45 min |
| Chunking strategies | [The 5 Levels Of Text Splitting For Retrieval](https://www.youtube.com/watch?v=8OJC21T2SL4) · Greg Kamradt · 69 min | [Semantic Chunking for RAG](https://www.youtube.com/watch?v=TcRRfcbsApw) · James Briggs · 30 min | Compare fixed, recursive and semantic chunking on one policy; record recall@5 on 20 questions. | 90 min |
| Metadata filtering | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=862s) · Dave Ebbelaar · 14:22–22:16 · 8 min | — | Filter by entity and effective date before ranking; prove out-of-scope documents never appear. | 45 min |
| PostgreSQL with pgvector | [PGVector: Turn PostgreSQL Into A Vector Database](https://www.youtube.com/watch?v=j1QcPSLj7u0) · NeuralNine · 20 min | — | Create a vector column with an HNSW index; time queries at 10,000 chunks. | 60 min |
| Semantic search | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | — | Build a semantic search endpoint returning chunks with scores and sources. | 60 min |
| Hybrid search | [Hybrid Search in RAG Explained / BM25 + Semantic Search + RRF (Complete Guide)](https://www.youtube.com/watch?v=D8LmsEOJvPI) · Yash Patil · 29 min | [PostgreSQL: Full Text Search](https://www.postgresql.org/docs/current/textsearch.html) · PostgreSQL Global Development Group (docs) | Combine PostgreSQL full-text search and vector search with Reciprocal Rank Fusion; measure the gain. | 90 min |
| Reranking fundamentals | [RAG But Better: Rerankers with Cohere AI](https://www.youtube.com/watch?v=Uh9bYiVrW_s) · James Briggs · 24 min | — | Rerank the top 30 candidates; compare precision@5 with and without it. | 45 min |

### RAG architecture

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Retrieval pipelines | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | — | Wire query → retrieve → filter → rerank → assemble as separate, testable functions. | 60 min |
| Context assembly | [Semantic Chunking for RAG](https://www.youtube.com/watch?v=TcRRfcbsApw&t=737s) · James Briggs · 12:17–20:27 · 8 min | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | Assemble context within a token budget, ordered by relevance, with source headers. | 45 min |
| Grounded generation | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Answer only from context and say 'not in the documents' otherwise; test with an unanswerable question. | 45 min |
| Source citations | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | — | Return chunk ids for each sentence and render them as numbered citations. | 60 min |
| Document references | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=1191s) · Dave Ebbelaar · 19:51–25:00 · 5 min | — | Show title, section and page for each citation and open the exact page from the answer. | 30 min |
| Access-aware retrieval | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=763s) · Google for Developers · 12:43–16:13 · 4 min | [Azure RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview) · Microsoft (docs) | Filter by the caller's entitlements before ranking; prove a restricted policy never leaks. | 60 min |
| Retrieval quality | [AI Agent Evaluation with RAGAS](https://www.youtube.com/watch?v=-_52DIIOsCE&t=556s) · James Briggs · 9:16–15:52 · 7 min | — | Compute context recall and context precision on the 30-question set. | 45 min |
| RAG evaluation | [AI Agent Evaluation with RAGAS](https://www.youtube.com/watch?v=-_52DIIOsCE) · James Briggs · 20 min | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE) · Hamel Husain · 28 min | Add faithfulness and answer relevancy, with a pass threshold for each. | 60 min |
| Failure analysis | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=360s) · Hamel Husain · 6:00–19:31 · 14 min | — | Tag 20 wrong answers as retrieval, context, generation or data failures; fix the largest category. | 90 min |

## Phase 4 — AI agents and evaluation (months 12–15)

**Exit gate:** Demonstrate an observable agent workflow with persistence, human approval and repeatable evaluation.

### Agent engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Workflows versus agents | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ&t=400s) · Anthropic · 6:40–9:30 · 3 min | — | Classify each investigation step as fixed workflow or agent decision, with a reason for each. | 30 min |
| Agent loops | [Andrew Ng Explores The Rise Of AI Agents And Agentic Reasoning / BUILD 2024 Keynote](https://www.youtube.com/watch?v=KrRD7r7y7NY) · Snowflake Inc. · 27 min | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ) · Anthropic · 19 min | Write a minimal agent loop (model → tool → observe) without a framework, with a step limit. | 60 min |
| Planning and execution | [Andrew Ng Explores The Rise Of AI Agents And Agentic Reasoning / BUILD 2024 Keynote](https://www.youtube.com/watch?v=KrRD7r7y7NY) · Snowflake Inc. · 27 min | — | Have the agent plan first, then execute, re-planning when a tool fails. | 60 min |
| Tool selection | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=339s) · Aishwarya Srinivasan · 5:39–7:37 · 2 min | [Claude: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · Anthropic (docs) | Write tool descriptions precise enough that the right tool is chosen in 9 of 10 test prompts. | 45 min |
| Tool calling | [Python + AI: Function calling & structured outputs](https://www.youtube.com/watch?v=4rFVLMBwjGY) · Microsoft Reactor · 63 min | [Claude: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · Anthropic (docs) | Add three ledger tools with strict input schemas; log every call with inputs and outputs. | 45 min |
| State management | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=457s) · Aishwarya Srinivasan · 7:37–9:57 · 2 min | — | Define investigation state as a typed object; make every step a pure state transition. | 45 min |
| Context management | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ&t=855s) · Anthropic · 14:15–15:00 · 1 min | Summarise and trim tool outputs so a 20-step run stays within budget. | 45 min |
| Memory | [Agent Memory EXPLAINED - Complete Architecture](https://www.youtube.com/watch?v=aYfZN8t6AQs) · Hugging Face · 29 min | — | Store resolved exceptions as long-term memory and retrieve similar past cases. | 60 min |
| Human-in-the-loop | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s) · Dave Ebbelaar · 25 min | — | Pause before every write action and require approve/reject with a reason. | 45 min |
| Workflow orchestration | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=597s) · Aishwarya Srinivasan · 9:57–12:23 · 2 min | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo) · Concept && Coding - by Shrayansh · 30 min | Orchestrate gather → analyse → recommend with explicit transitions and timeouts. | 45 min |
| Failure recovery | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1023s) · Aishwarya Srinivasan · 17:03–18:42 · 2 min | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | Simulate a tool timeout mid-run; resume from the last good state without repeating side effects. | 60 min |

### LangGraph

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Nodes and edges | [LangGraph Tutorial: Understanding Nodes, Edges, and State Management](https://www.youtube.com/watch?v=FVuv5MPBzPI) · Analytics Vidhya · 15 min | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | Build a three-node graph (gather, analyse, recommend) with explicit edges. | 45 min |
| Graph state | [LangGraph Tutorial: Understanding Nodes, Edges, and State Management](https://www.youtube.com/watch?v=FVuv5MPBzPI) · Analytics Vidhya · 15 min | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | Define a TypedDict state with reducers for accumulated evidence. | 45 min |
| Conditional routing | [LangGraph Tutorial 102: Add Tools, Nodes, Conditional & Normal Edges, Memory, Langchain & Langsmith](https://www.youtube.com/watch?v=pDuNkb6VWaM) · HTMLFiveDev · 21 min | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | Route to 'escalate' above a variance threshold, otherwise to 'auto-resolve'. | 30 min |
| Checkpointing | [LangGraph - Persistence & Human-in-the-Loop Workflow](https://www.youtube.com/watch?v=9BPCV5TYPmg) · Coding Crash Courses · 18 min | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | Add a checkpointer; stop the process mid-run and resume from the checkpoint. | 45 min |
| Persistence | [LangGraph - Persistence & Human-in-the-Loop Workflow](https://www.youtube.com/watch?v=9BPCV5TYPmg) · Coding Crash Courses · 18 min | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | Use a PostgreSQL-backed checkpointer so runs survive restarts. | 60 min |
| Interrupts | [LangGraph interrupt: Making it easier to build human-in-the-loop agents](https://www.youtube.com/watch?v=6t7YJcEFUIY) · LangChain · 8 min | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s) · Dave Ebbelaar · 25 min | Interrupt before 'post adjustment' and resume with the reviewer's decision. | 45 min |
| Human approval | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s&t=470s) · Dave Ebbelaar · 7:50–10:15 · 2 min | [LangGraph: Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) · LangChain (docs) | Build an approval endpoint that resumes the graph with approve or reject. | 45 min |
| Long-running workflows | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s&t=1154s) · Dave Ebbelaar · 19:14–22:59 · 4 min | — | Run the graph as a background job; expose its status and current node through the API. | 60 min |
| Recovery and resumability | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | Kill the worker during a tool call; prove the run resumes without duplicating the call. | 60 min |
| Agent testing | [Agentic Evaluations at Scale, For Everybody — Nicholas Kang & Michael Aaron, Google DeepMind](https://www.youtube.com/watch?v=Ubwb6NzegyA) · AI Engineer · 20 min | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | Test the graph with stubbed tools: assert the path taken in three scenarios. | 60 min |

### MCP

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| MCP architecture | [Building with MCP and the Claude API](https://www.youtube.com/watch?v=aZLr962R6Ag&t=30s) · Anthropic · 0:30–5:00 · 5 min | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | Diagram host, client and server for LedgerSync with Claude Desktop, marking trust boundaries. | 30 min |
| Hosts, clients and servers | [Ultimate MCP Tutorial / Learn Model Context Protocol and Deploy your MCP Server](https://www.youtube.com/watch?v=DAuZuj0BUZA&t=143s) · Lama Dev · 2:23–5:30 · 3 min | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | Explain in writing which process holds credentials in each role, and why. | 20 min |
| Tools | [Build Anything With a CUSTOM MCP Server - Python Tutorial](https://www.youtube.com/watch?v=-8k9lGpGQ6g&t=249s) · Tech With Tim · 4:09–7:25 · 3 min | [MCP: Build a server](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server) · Model Context Protocol (docs) | Expose get_unmatched_items as an MCP tool with a strict schema. | 45 min |
| Resources | [Ultimate MCP Tutorial / Learn Model Context Protocol and Deploy your MCP Server](https://www.youtube.com/watch?v=DAuZuj0BUZA&t=1281s) · Lama Dev · 21:21–26:49 · 5 min | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | Expose policy documents as MCP resources with URIs and MIME types. | 30 min |
| Prompts | [Ultimate MCP Tutorial / Learn Model Context Protocol and Deploy your MCP Server](https://www.youtube.com/watch?v=DAuZuj0BUZA&t=1609s) · Lama Dev · 26:49–30:20 · 4 min | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | Publish a 'monthly variance review' prompt template from the server. | 30 min |
| Server development | [Build Anything With a CUSTOM MCP Server - Python Tutorial](https://www.youtube.com/watch?v=-8k9lGpGQ6g) · Tech With Tim · 26 min | [MCP: Build a server](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server) · Model Context Protocol (docs) | Build the LedgerSync MCP server in Python with logging and input validation. | 90 min |
| Client integration | [Build Anything With a CUSTOM MCP Server - Python Tutorial](https://www.youtube.com/watch?v=-8k9lGpGQ6g&t=299s) · Tech With Tim · 4:59–10:28 · 5 min | [Building with MCP and the Claude API](https://www.youtube.com/watch?v=aZLr962R6Ag&t=640s) · Anthropic · 10:40–11:50 · 1 min | Connect the server to Claude Desktop and to your own Python client. | 45 min |
| Authentication and permission boundaries | [Ultimate MCP Tutorial / Learn Model Context Protocol and Deploy your MCP Server](https://www.youtube.com/watch?v=DAuZuj0BUZA&t=4870s) · Lama Dev · 1:21:10–1:35:13 · 14 min | [MCP Security Fundamentals Course](https://www.youtube.com/watch?v=gYXLRMycVMk) · freeCodeCamp.org · 130 min | Separate read and write tools by scope; refuse write calls without the required scope. | 60 min |
| MCP integration with applications and agents | [Building with MCP and the Claude API](https://www.youtube.com/watch?v=aZLr962R6Ag&t=640s) · Anthropic · 10:40–14:20 · 4 min | — | Let the LangGraph agent call the MCP tools instead of in-process functions. | 60 min |

### Reliable agent execution

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Tool permissions | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=250s) · Google for Developers · 4:10–5:11 · 1 min | — | Map each agent role to the tools it may call; test a denied call. | 30 min |
| Approval gates | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=916s) · Aishwarya Srinivasan · 15:16–17:03 · 2 min | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s) · Dave Ebbelaar · 25 min | Require approval for any action above a monetary threshold; record approver and time. | 30 min |
| Input validation | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=311s) · Google for Developers · 5:11–10:18 · 5 min | [Advanced Guardrails for AI Agents / Full Tutorial](https://www.youtube.com/watch?v=rMUycP_cp9g) · James Briggs · 22 min | Validate every tool argument with Pydantic before execution; reject and log anything else. | 30 min |
| Idempotency | [What Is Idempotency? Idempotency Keys, Deduplication & Retries Explained](https://www.youtube.com/watch?v=jfHBrweuKRA) · The Right Trade-off · 3 min | [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · Stripe (docs) | Give each write tool an idempotency key derived from run id and step. | 30 min |
| Retries | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | Retry transient tool failures with backoff; never retry a non-idempotent call without its key. | 30 min |
| Audit trails | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1340s) · Aishwarya Srinivasan · 22:20–25:33 · 3 min | — | Write an append-only audit table: actor, tool, inputs, outputs, approval, time. | 45 min |
| Safe execution | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o) · Google for Developers · 24 min | — | Run tools with a least-privilege database role; prove the agent cannot DELETE. | 45 min |
| Failure handling | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | — | Define retry, escalate or stop for each failure class and test every path. | 45 min |

### AI observability

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Tracing | [LangSmith 101 for AI Observability / Full Walkthrough](https://www.youtube.com/watch?v=Iyc80hY2yYk) · James Briggs · 9 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Trace one request end to end (API → retrieval → LLM → tools) as nested spans. | 45 min |
| Prompt versioning | [LangSmith 101 for AI Observability / Full Walkthrough](https://www.youtube.com/watch?v=Iyc80hY2yYk) · James Briggs · 9 min | — | Move prompts into LangSmith prompt management; deploy a version, then roll it back. | 30 min |
| Token usage | [LangSmith 101 for AI Observability / Full Walkthrough](https://www.youtube.com/watch?v=Iyc80hY2yYk) · James Briggs · 9 min | — | Report tokens in and out per trace and per user. | 20 min |
| Cost tracking | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=1166s) · AI Jason · 19:26–27:20 · 8 min | [LangSmith 101 for AI Observability / Full Walkthrough](https://www.youtube.com/watch?v=Iyc80hY2yYk) · James Briggs · 9 min | Build a weekly cost report by endpoint and model from traces. | 45 min |
| Latency monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | — | Track p50/p95 latency per step and find the slowest span. | 30 min |
| Error analysis | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=360s) · Hamel Husain · 6:00–19:31 · 14 min | — | Tag failed traces by cause and count each category. | 45 min |
| Performance monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Define three service-level indicators and alert when one breaches. | 45 min |
| LangSmith | [LangSmith 101 for AI Observability / Full Walkthrough](https://www.youtube.com/watch?v=Iyc80hY2yYk) · James Briggs · 9 min | — | Trace your assistant's calls in LangSmith and find the slowest step. | 45 min |

### AI evaluation

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Evaluation fundamentals | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE) · Hamel Husain · 28 min | [Claude: Define success and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) · Anthropic (docs) | Write the variance analyst's success criteria as measurable statements. | 30 min |
| Golden datasets | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE&t=568s) · Hamel Husain · 9:28–15:25 · 6 min | — | Build a golden set of 50 labelled, anonymised cases from real closes. | 120 min |
| Test-case design | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE&t=925s) · Hamel Husain · 15:25–18:57 · 4 min | — | Cover normal, edge, adversarial and 'insufficient data' cases. | 45 min |
| Deterministic evaluation | [Promptfoo Assertions Overview](https://www.youtube.com/watch?v=jpY8ECnAosU) · Jason Koo · 8 min | [Claude: Define success and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) · Anthropic (docs) | Add code checks: schema valid, numbers trace to inputs, citations exist. | 45 min |
| LLM-as-judge | [3. Tutorial: How to create an LLM judge and align with human labels](https://www.youtube.com/watch?v=kP_aaFnXLmY) · Evidently AI · 24 min | — | Build a judge for 'correct and specific'; measure its agreement with your own labels. | 90 min |
| RAG evaluation | [AI Agent Evaluation with RAGAS](https://www.youtube.com/watch?v=-_52DIIOsCE) · James Briggs · 20 min | — | Run RAGAS on the policy assistant nightly and store results by commit. | 45 min |
| Agent trajectory evaluation | [Agentic Evaluations at Scale, For Everybody — Nicholas Kang & Michael Aaron, Google DeepMind](https://www.youtube.com/watch?v=Ubwb6NzegyA) · AI Engineer · 20 min | — | Score whether the agent called the right tools in the right order across 15 scenarios. | 60 min |
| Regression testing | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=1171s) · Hamel Husain · 19:31–25:48 · 6 min | — | Fail CI when a prompt or model change drops any metric below its threshold. | 45 min |
| Quality thresholds | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=1548s) · Hamel Husain · 25:48–27:19 · 2 min | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE) · Hamel Husain · 28 min | Set and document a threshold per metric, with the reasoning for each. | 30 min |
| Evaluation automation | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4) · Hamel Husain · 27 min | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=1278s) · mCoding · 21:18–25:22 · 4 min | Run the eval suite in GitHub Actions on every pull request. | 60 min |

### Advanced RAG and agent design

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Retrieval optimisation | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | [The 5 Levels Of Text Splitting For Retrieval](https://www.youtube.com/watch?v=8OJC21T2SL4) · Greg Kamradt · 69 min | Tune chunk size, k and filters against the eval set; keep the best configuration. | 60 min |
| Hybrid retrieval | [Hybrid Search in RAG Explained / BM25 + Semantic Search + RRF (Complete Guide)](https://www.youtube.com/watch?v=D8LmsEOJvPI) · Yash Patil · 29 min | — | Tune the Reciprocal Rank Fusion weighting between keyword and vector results. | 45 min |
| Reranking | [RAG But Better: Rerankers with Cohere AI](https://www.youtube.com/watch?v=Uh9bYiVrW_s&t=1314s) · James Briggs · 21:54–23:42 · 2 min | — | Weigh the reranker's cost and latency against its quality gain; decide whether it stays. | 30 min |
| Query transformation | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | — | Add query rewriting and multi-query retrieval; measure the change in recall. | 60 min |
| Agent evaluation | [Agentic Evaluations at Scale, For Everybody — Nicholas Kang & Michael Aaron, Google DeepMind](https://www.youtube.com/watch?v=Ubwb6NzegyA) · AI Engineer · 20 min | — | Extend trajectory evals to 30 scenarios, including failure paths. | 60 min |
| Workflow optimisation | [The Multi-Agent Architecture That Actually Ships — Luke Alvoeiro, Factory](https://www.youtube.com/watch?v=ow1we5PzK-o&t=557s) · AI Engineer · 9:17–11:22 · 2 min | — | Remove one agent step that the evals show adds no value. | 45 min |
| Human approval design | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s&t=615s) · Dave Ebbelaar · 10:15–12:33 · 2 min | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=916s) · Aishwarya Srinivasan · 15:16–17:03 · 2 min | Redesign approval so a reviewer can decide in under a minute with the evidence in view. | 45 min |
| Tool reliability | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=339s) · Aishwarya Srinivasan · 5:39–7:37 · 2 min | — | Add contract tests for every tool; fail fast on schema drift. | 45 min |
| Cost and latency optimisation | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=443s) · AI Jason · 7:23–19:26 · 12 min | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1122s) · Aishwarya Srinivasan · 18:42–20:42 · 2 min | Cut cost per run by 30% (caching, smaller model, trimmed context) without lowering eval scores. | 60 min |

## Phase 5 — Software engineering, integration and cloud (months 16–20)

**Exit gate:** Deploy through a pipeline with rollback, infrastructure as code, tracing and a tested recovery.

### Backend engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Dependency injection | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=26003s) · freeCodeCamp.org · 7:13:23–7:25:21 · 12 min | [FastAPI: Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) · FastAPI (docs) | Provide the database session and current user through Depends; override both in tests. | 45 min |
| SQLAlchemy | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=16278s) · freeCodeCamp.org · 4:31:18–5:28:21 · 57 min | [SQLAlchemy 2.0 ORM Crash Course - Manage Relational Databases with Python (SQLAlchemy 2.0)](https://www.youtube.com/watch?v=XWtj4zLl_tg) · Ssali Jonathan · 63 min | Replace in-memory storage with SQLAlchemy 2.0 models and one session per request. | 90 min |
| Alembic | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=37818s) · freeCodeCamp.org · 10:30:18–11:13:50 · 44 min | [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html) · SQLAlchemy (docs) | Generate the initial migration, add a column in a second migration, then downgrade it. | 45 min |
| Authentication | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=21008s) · freeCodeCamp.org · 5:50:08–6:17:13 · 27 min | — | Add registration with hashed passwords; test that a wrong password is refused. | 60 min |
| OAuth2 | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=25798s) · freeCodeCamp.org · 7:09:58–7:13:23 · 3 min | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | Implement the OAuth2 password flow with OAuth2PasswordBearer and explain why it suits first-party clients only. | 45 min |
| JWT | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=23569s) · freeCodeCamp.org · 6:32:49–7:09:58 · 37 min | [RFC 7519: JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519) · IETF (docs) | Issue short-lived JWTs; write a test proving an expired token is rejected. | 45 min |
| OIDC fundamentals | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | [How OpenID Connect works](https://openid.net/developers/how-connect-works/) · OpenID Foundation (docs) | Draw the authorisation-code + PKCE flow with Entra ID as LedgerSync's identity provider. | 45 min |
| Webhooks | [What is a Webhook? Webhooks Explained for Beginners](https://www.youtube.com/watch?v=nGnybXRCy7E) · AppUnits AI · 9 min | [About webhooks](https://docs.github.com/en/webhooks/about-webhooks) · GitHub (docs) | Add an endpoint for 'import completed' events that verifies an HMAC signature and is safe to receive twice. | 45 min |
| Retries | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | Wrap the exchange-rate client in retries with exponential backoff and jitter; cap attempts and log each retry. | 40 min |
| Idempotency | [What Is Idempotency? Idempotency Keys, Deduplication & Retries Explained](https://www.youtube.com/watch?v=jfHBrweuKRA) · The Right Trade-off · 3 min | [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · Stripe (docs) | Accept an Idempotency-Key on imports so a repeated POST returns the original result. | 60 min |

### Security

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| OWASP LLM Top 10 | [OWASP's Top 10 Ways to Attack LLMs: AI Vulnerabilities Exposed](https://www.youtube.com/watch?v=gUNXZMcd2jU) · IBM Technology · 25 min | — | Map each of the ten risks to LedgerSync with its mitigation or accepted risk. | 60 min |
| Direct prompt injection | [Prompt Injection, explained](https://www.youtube.com/watch?v=FgxwCaL6UTA) · Simon Willison · 12 min | [Advanced Guardrails for AI Agents / Full Tutorial](https://www.youtube.com/watch?v=rMUycP_cp9g) · James Briggs · 22 min | Red-team the chat endpoint with ten direct injections; record which succeed. | 45 min |
| Indirect prompt injection | [[1hr Talk] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g&t=3090s) · Andrej Karpathy · 51:30–56:23 · 5 min | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=311s) · Google for Developers · 5:11–10:18 · 5 min | Plant an injection inside a policy PDF; prove the assistant does not follow it. | 45 min |
| Sensitive data exposure | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=176s) · Google for Developers · 2:56–4:10 · 1 min | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=618s) · Google for Developers · 10:18–12:43 · 2 min | Redact account numbers and names before text reaches the model; test with realistic samples. | 45 min |
| Data leakage | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=618s) · Google for Developers · 10:18–12:43 · 2 min | — | Check that logs, traces and prompts contain no secrets or unredacted personal data. | 30 min |
| RBAC | [Role-Based Access Control Using Dependency Injection (User Roles) - FastAPI Beyond CRUD (Part 13)](https://www.youtube.com/watch?v=_k2M-LpxId8) · Ssali Jonathan · 32 min | [FastAPI Role-Based Authorization (RBAC) / Secure APIs with Roles](https://www.youtube.com/watch?v=nnHO4ORP_6M) · Programming Guide · 21 min | Define viewer, analyst, approver and admin roles; enforce them on every endpoint. | 45 min |
| Least privilege | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=763s) · Google for Developers · 12:43–16:13 · 4 min | — | Give the app, the agent and migrations separate database roles with minimal grants. | 30 min |
| Secrets management | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=973s) · Google for Developers · 16:13–18:05 · 2 min | [Azure Key Vault Tutorial: Stop Leaking Your Secrets!](https://www.youtube.com/watch?v=3-glyvBK8fM) · m365 Show | M365, Azure Cloud, Power Platform & AI · 18 min | Move every secret out of .env into a secret store; rotate one key without downtime. | 45 min |
| Input and output validation | [Advanced Guardrails for AI Agents / Full Tutorial](https://www.youtube.com/watch?v=rMUycP_cp9g) · James Briggs · 22 min | — | Validate inputs (size, type, injection markers) and outputs (schema, personal data) at every boundary. | 45 min |
| Access-controlled retrieval | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=763s) · Google for Developers · 12:43–16:13 · 4 min | — | Enforce document permissions inside the retrieval query, not after generation. | 45 min |
| Audit logging | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1340s) · Aishwarya Srinivasan · 22:20–25:33 · 3 min | — | Log every privileged action with actor and outcome in an append-only log. | 30 min |

### Enterprise integrations

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Identity providers | [Microsoft Entra Overview - AZ-900 Certification Course - January 2023 New](https://www.youtube.com/watch?v=bSIF_GjaCmo) · John Savill's Technical Training · 12 min | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | Register LedgerSync as an application in an Entra test tenant. | 45 min |
| External APIs | [HTTPX Tutorial - A next-generation HTTP client for Python](https://www.youtube.com/watch?v=qAh5dDODJ5k) · Patrick Loeber · 11 min | [Rest API Authentication with Python.](https://www.youtube.com/watch?v=2zYJMI_OPIY) · Automation Experts · 19 min | Integrate one external API with timeouts, retries and contract tests. | 60 min |
| Webhooks | [Webhooks for Beginners - Full Course](https://www.youtube.com/watch?v=41NOoEz3Tzc) · freeCodeCamp.org · 149 min | [About webhooks](https://docs.github.com/en/webhooks/about-webhooks) · GitHub (docs) | Consume a webhook from a SaaS sandbox; verify signatures and handle out-of-order delivery. | 45 min |
| Business application integrations | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=1547s) · Concept && Coding - by Shrayansh · 25:47–29:34 · 4 min | — | Integrate an ERP extract (CSV or API sandbox) as a second ledger source. | 90 min |
| Enterprise data sources | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=1734s) · Ansh Lamba · 28:54–40:47 · 12 min | — | Connect a read-only warehouse or replica; never write to a system of record. | 45 min |
| Permission-aware tool access | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=824s) · Google for Developers · 13:44–16:13 · 2 min | — | Call downstream APIs on behalf of the user with delegated tokens, not a shared super-key. | 60 min |
| System-to-system communication | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | [Entra: Add app roles to your application](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps) · Microsoft (docs) | Use client credentials with app roles for service-to-service calls; test a missing role. | 45 min |

### Deployment foundations

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Linux and CLI fundamentals | [Lecture 1: Course Overview + The Shell (2020)](https://www.youtube.com/watch?v=Z56Jmr9Z34Q) · Missing Semester · 48 min | — | Do the Missing Semester shell exercises; script a log search with grep and pipes. | 60 min |
| Docker | [Docker Tutorial for Beginners [FULL COURSE in 3 Hours]](https://www.youtube.com/watch?v=3c-iBn73dDE&t=118s) · TechWorld with Nana · 1:58–1:06:39 · 65 min | [This Is How You Write an Efficient Python Dockerfile](https://www.youtube.com/watch?v=tc713anE3UY) · ArjanCodes · 19 min | Containerise the API with a multi-stage Dockerfile under 200 MB. | 90 min |
| Containerisation | [This Is How You Write an Efficient Python Dockerfile](https://www.youtube.com/watch?v=tc713anE3UY) · ArjanCodes · 19 min | [Docker Tutorial for Beginners [FULL COURSE in 3 Hours]](https://www.youtube.com/watch?v=3c-iBn73dDE&t=6122s) · TechWorld with Nana · 1:42:02–2:04:36 · 23 min | Run the container as a non-root user; load secrets via mounts, never image layers. | 45 min |
| Environment configuration | [Docker Tutorial for Beginners [FULL COURSE in 3 Hours]](https://www.youtube.com/watch?v=3c-iBn73dDE&t=5389s) · TechWorld with Nana · 1:29:49–1:42:02 · 12 min | [Docker Compose](https://docs.docker.com/compose/) · Docker (docs) | Compose the API, PostgreSQL and a worker with an environment file per stage. | 60 min |
| Cloud deployment fundamentals | [Learn Azure in 2026](https://www.youtube.com/watch?v=usvlTo0TDoA) · John Savill's Technical Training · 29 min | — | Get Azure access, explore the portal and Cloud Shell, deploy a container to a sandbox. | 60 min |
| CI/CD fundamentals | [GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker](https://www.youtube.com/watch?v=R8_veQiYBjI) · TechWorld with Nana · 33 min | [GitHub Actions documentation](https://docs.github.com/en/actions) · GitHub (docs) | Create a workflow that builds and tests on every push. | 45 min |
| Automated testing before deployment | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=1278s) · mCoding · 21:18–25:22 · 4 min | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=63255s) · freeCodeCamp.org · 17:34:15–18:23:42 · 49 min | Block the deploy job unless tests and evals pass. | 45 min |
| Application monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Expose health and readiness endpoints; send logs and traces to one place. | 45 min |
| Basic recovery procedures | [Backing Up a Postgres Database with pg_dump and pg_restore](https://www.youtube.com/watch?v=WB6WzuFHcP8) · WittCode · 7 min | [How to backup a Docker Volume for an existing Postgres SQL database running as a Docker Container](https://www.youtube.com/watch?v=oUbal7sUduo) · TPPZ builds things · 21 min | Back up PostgreSQL, destroy the database, restore it, and time the drill. | 60 min |

### Cloud and production

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Azure fundamentals | [Learn Azure in 2026](https://www.youtube.com/watch?v=usvlTo0TDoA) · John Savill's Technical Training · 29 min | — | Create a resource group, a budget alert and a naming convention for LedgerSync. | 45 min |
| Azure Container Apps | [Azure Container Apps (2025 Edition)](https://www.youtube.com/watch?v=LogxM4r2a58) · Agentic Intelligence w/ Michael Levan · 13 min | — | Deploy the API image to Container Apps with ingress and a health probe. | 60 min |
| Managed PostgreSQL | [How to create an Azure Database for PostgreSQL Flexible server in Azure portal](https://www.youtube.com/watch?v=a7ZTOtQyGrE) · Cloud Nerchuko · 7 min | [Azure Database for PostgreSQL flexible server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) · Microsoft (docs) | Provision Flexible Server with private networking; run Alembic migrations against it. | 60 min |
| GitHub Actions | [GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker](https://www.youtube.com/watch?v=R8_veQiYBjI) · TechWorld with Nana · 33 min | [GitHub Actions documentation](https://docs.github.com/en/actions) · GitHub (docs) | Build, test and push images to a registry from GitHub Actions. | 45 min |
| CI/CD pipelines | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=1278s) · mCoding · 21:18–25:22 · 4 min | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=63255s) · freeCodeCamp.org · 17:34:15–18:49:10 · 75 min | Promote the same image from dev to prod behind a manual approval. | 60 min |
| Environment separation | [GitHub Actions -  Getting Started With Environments](https://www.youtube.com/watch?v=5XfgT9A9PHw) · Mickey Gousset · 12 min | [Deploying to Environments with GitHub Actions (#212)](https://www.youtube.com/watch?v=EOlm3ft0VPo) · Asp.Net Monsters · 14 min | Separate dev and prod resources, secrets and databases; prove dev cannot reach prod data. | 45 min |
| Secrets management | [Azure Key Vault Tutorial: Stop Leaking Your Secrets!](https://www.youtube.com/watch?v=3-glyvBK8fM) · m365 Show | M365, Azure Cloud, Power Platform & AI · 18 min | [Azure Key Vault Complete Tutorial / Azure Devops / .Net Core](https://www.youtube.com/watch?v=k3NOiynQD5E) · AzureTeach•Net · 68 min | Read secrets from Key Vault with a managed identity; no secret in the pipeline or image. | 45 min |
| Deployment strategies | [Deployment Strategies Explained: Blue-Green vs. Canary vs. Rolling](https://www.youtube.com/watch?v=H5z70EBtEow) · CodeLucky · 4 min | [Azure Pipelines Deployment Strategies Explained / Blue-Green, Canary / AZ-400 DevOps Engineer](https://www.youtube.com/watch?v=uzlr9HC0Fuo) · Skilltech Club · 33 min | Release blue-green with traffic splitting between revisions. | 60 min |
| Rollbacks | [How to update your Azure Container Apps using Revisions](https://www.youtube.com/watch?v=jFa4Rd-c4wA) · Will Velida · 14 min | [Traffic Splitting in Azure Container Apps / Step-by-Step Lab Demo](https://www.youtube.com/watch?v=k29K-GkJApE) · MadeForCloud · 7 min | Roll back a bad release on purpose and time it. | 30 min |
| Production monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Dashboards and alerts for errors, latency, cost and eval scores in production. | 60 min |
| Azure architecture patterns | [Microsoft Azure Well-Architected Framework](https://www.youtube.com/watch?v=dT233xJ3xPs) · Microsoft Reactor · 57 min | — | Review your design against the Well-Architected pillars and record three changes. | 45 min |

### Infrastructure as code

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Terraform fundamentals | [Learn Terraform on Azure — Beginner Course](https://www.youtube.com/watch?v=KWpIzjHyC68) · Adeel Automates · 0:00–27:56 · 28 min | — | Create a resource group and storage account with Terraform. | 45 min |
| State and backends | [Learn Terraform on Azure — Beginner Course](https://www.youtube.com/watch?v=KWpIzjHyC68&t=2267s) · Adeel Automates · 37:47–50:45 · 13 min | [Terraform with Azure Tutorial for Beginners / Remote State, Modules & HCP Terraform [HINDI]](https://www.youtube.com/watch?v=Rpl_OB62Y_c&t=4620s) · M Prashant · 1:17:00–1:27:16 · 10 min | Move state to a remote backend and explain what would break without it. | 45 min |
| Modules and environments | [Terraform with Azure Tutorial for Beginners / Remote State, Modules & HCP Terraform [HINDI]](https://www.youtube.com/watch?v=Rpl_OB62Y_c&t=10750s) · M Prashant · 2:59:10–3:46:51 · 48 min | — | Extract a module and use it for separate dev and prod environments. | 60 min |
| Azure resources with Terraform | [Terraform with Azure Tutorial for Beginners / Remote State, Modules & HCP Terraform [HINDI]](https://www.youtube.com/watch?v=Rpl_OB62Y_c&t=2764s) · M Prashant · 46:04–1:04:35 · 19 min | — | Define your Container App and PostgreSQL server in code. | 60 min |
| Reviewing and applying changes | [Learn Terraform on Azure — Beginner Course](https://www.youtube.com/watch?v=KWpIzjHyC68&t=1676s) · Adeel Automates · 27:56–37:47 · 10 min | — | Read a plan, spot a destructive change, and stop it before applying. | 30 min |

### Telemetry and monitoring

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| OpenTelemetry fundamentals | [OpenTelemetry: How distributed tracing really works with Python, FastAPI and requests](https://www.youtube.com/watch?v=azyVG0T1aVc) · Adam Gardner · 9 min | — | Explain spans and context propagation by drawing one request through your services. | 30 min |
| Traces, metrics and logs | [12. Metrics, Logs & Traces (Observability Explained)](https://www.youtube.com/watch?v=6YCrvZRFfmA) · Arpit Vaish · 6 min | [Observability and Its Pillars Explained / Logs, Metrics & Traces Simplified](https://www.youtube.com/watch?v=rJfZyA831fI) · OpenObserve · 6 min | For one failure, say which of the three signals would find it, and why. | 30 min |
| Instrumenting a FastAPI service | [OpenTelemetry FastAPI Tutorial: Get GREAT App Performance NOW!](https://www.youtube.com/watch?v=m28TTogdcbk) · Eric Roby · 15 min | — | Add OpenTelemetry to your API and view a trace. | 60 min |
| Dashboards and alerts | [Building custom metrics dashboards for Python programs with Azure App Insights and OpenTelemetry](https://www.youtube.com/watch?v=34np53BGv3o) · Joe Freeman: Software Craft, Org Stuff, Tech Stuff · 9 min | — | Build a dashboard for latency, errors and cost, with one alert that matters. | 60 min |
| Service-level objectives | [10   SRE Fundamentals — SLIs, SLOs & Error Budgets](https://www.youtube.com/watch?v=ywNR71uGvHI) · Scott Benson · 8 min | [Alerting on SLOs and Error Budget Policies / Ricardo Castro / Conf42 SRE 2022](https://www.youtube.com/watch?v=30s_Jsa29M0) · Conf42 · 26 min | Set an availability objective for your API and work out its error budget. | 30 min |

### Reliability engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Retries and backoff | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | Centralise the retry policy with jitter; prove there is no retry storm under failure. | 30 min |
| Idempotency | [What Is Idempotency? Idempotency Keys, Deduplication & Retries Explained](https://www.youtube.com/watch?v=jfHBrweuKRA) · The Right Trade-off · 3 min | [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · Stripe (docs) | Audit every write path for idempotency and fix the ones that are not. | 45 min |
| Timeouts | [Circuit Breaker Pattern Explained: Timeouts, Retries and Fallbacks](https://www.youtube.com/watch?v=rvKKj7JU92g&t=294s) · System Design Lab · 4:54–8:00 · 3 min | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | Set connect and read timeouts on every outbound call; test against a hanging dependency. | 30 min |
| Rate limiting | [Rate Limiting Explained: Token Bucket vs Sliding Window / System Design By Microsoft SWE](https://www.youtube.com/watch?v=COQNpbNGFJU) · Mayank Joshi · 15 min | [Rate Limiting in Distributed Systems: Token Bucket & Leaky Bucket Algorithms Explained](https://www.youtube.com/watch?v=8GaI0HCOkUE) · CodeLucky · 6 min | Rate-limit the public API per user; return 429 with Retry-After. | 45 min |
| Model fallback | [Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi](https://www.youtube.com/watch?v=2ld7cR9y0Po) · Optimized AI Conference · 20 min | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=591s) · AI Jason · 9:51–10:35 · 1 min | Fall back to a second model on error or timeout; log which model served each request. | 45 min |
| Circuit breakers | [Circuit Breaker Pattern Explained: Timeouts, Retries and Fallbacks](https://www.youtube.com/watch?v=rvKKj7JU92g&t=665s) · System Design Lab · 11:05–21:41 · 11 min | [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) · Microsoft (docs) | Wrap the LLM provider in a circuit breaker; show it opening and half-opening under failure. | 60 min |
| State recovery | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | Recover every in-flight agent run after a crash using checkpoints. | 45 min |
| Backups and restores | [Recover Deleted Azure PostgreSQL Database (Flexible Server)](https://www.youtube.com/watch?v=MJ8VTwTvMSo) · Kris Turk · 6 min | [Azure Database for PostgreSQL flexible server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) · Microsoft (docs) | Automate nightly backups; restore to a new instance and verify row counts. | 60 min |
| Incident handling | [Incident Management in SRE Explained (Google SRE Book)](https://www.youtube.com/watch?v=NUmOZ3nnS7I) · Tech Tutorials with Piyush · 19 min | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | Run a game-day: break the LLM provider, follow your incident process, write the review. | 90 min |
| Operational runbooks | [Workshop: How to Create A Streamlined Incident Management Runbook](https://www.youtube.com/watch?v=duCnHhtdvOg) · Blameless · 56 min | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | Write runbooks for the top three failure modes, each testable by someone else. | 60 min |

## Phase 6 — Enterprise AI solutions architecture (months 21–24)

**Exit gate:** Defend the reference solution's decisions to a technical reviewer and to a finance executive.

### Requirements and architecture thinking

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Requirements engineering | [Requirements Elicitation](https://www.youtube.com/watch?v=pSQRetBoaRE) · UVA CS 3240 · 24 min | [Requirements Gathering & Analysis in Software Development Life Cycle (SDLC) / Free Tutorial 2021](https://www.youtube.com/watch?v=t1EW7F_TU_U) · Woodsy Spark Insights · 9 min | Interview a stakeholder, real or role-played, and write what they actually need. | 60 min |
| Functional and non-functional requirements | [Software Architecture in Golang: Quality Attributes, Non-Functional Requirements and ilities](https://www.youtube.com/watch?v=pPHgT-p2Pco) · Mario Carrion · 7 min | — | Write five of each for your reference solution, making every one testable. | 45 min |
| Stakeholders and constraints | [Stakeholders & Requirement Gathering Basics / Business Analyst Beginner Guide](https://www.youtube.com/watch?v=rgE2qkvUJGs) · Wise Flame · 5 min | [How to Gather Requirements as a Business Analyst / Requirement Gathering Techniques](https://www.youtube.com/watch?v=uAHeTzmc_2g) · The Business Analysis Doctor - IIBA Certification · 9 min | Map stakeholders, their concerns and the constraints that bind the design. | 30 min |
| Quality attribute trade-offs | [Software Architecture in Golang: Quality Attributes, Non-Functional Requirements and ilities](https://www.youtube.com/watch?v=pPHgT-p2Pco) · Mario Carrion · 7 min | — | Pick two qualities in conflict in your design and record which won and why. | 30 min |

### Enterprise architecture

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| System design | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE) · Aishwarya Srinivasan · 27 min | — | Write a one-page system design: goals, constraints, components, data flow. | 60 min |
| C4 diagrams | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | [The C4 model](https://c4model.com/) · Simon Brown (docs) | Draw context, container and component diagrams for LedgerSync. | 90 min |
| Architecture Decision Records | [Lesson 55 - Architecture Decision Records](https://www.youtube.com/watch?v=LMBqGPLvonU) · Software Architecture Monday · 10 min | [#113 - Architecture Decision Record (ADR) - Michael Keeling](https://www.youtube.com/watch?v=-JqraBhrrjI) · Tech Lead Journal · 41 min | Write five ADRs for decisions you have already made. | 60 min |
| Component architecture | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Decompose the API container into components with clear responsibilities. | 45 min |
| Data flows | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=1734s) · Ansh Lamba · 28:54–40:47 · 12 min | Draw the data flow from source systems to answers, marking where personal data travels. | 45 min |
| API boundaries | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=256s) · Concept && Coding - by Shrayansh · 4:16–15:28 · 11 min | — | Define which modules may call which APIs and enforce it with an import rule. | 45 min |
| Build versus buy | [#113 - Architecture Decision Record (ADR) - Michael Keeling](https://www.youtube.com/watch?v=-JqraBhrrjI) · Tech Lead Journal · 41 min | — | Write a build-versus-buy ADR for the vector store (pgvector or a managed service). | 45 min |
| Scalability | [Microsoft Azure Well-Architected Framework](https://www.youtube.com/watch?v=dT233xJ3xPs) · Microsoft Reactor · 57 min | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | Load-test the API to its limit and identify the bottleneck. | 60 min |
| Reliability | [Microsoft Azure Well-Architected Framework](https://www.youtube.com/watch?v=dT233xJ3xPs) · Microsoft Reactor · 57 min | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | Map each component's failure modes and mitigations. | 45 min |
| Maintainability | [Cohesion and Coupling: Write BETTER PYTHON CODE Part 1](https://www.youtube.com/watch?v=eiDyK_ofPPM) · ArjanCodes · 26 min | [Coupling 101: Design Choices That Make or Break Your Code](https://www.youtube.com/watch?v=MM9VQp-k0JQ) · ArjanCodes · 21 min | Measure test coverage, type coverage and dependency freshness; set targets. | 30 min |
| Cost and latency trade-offs | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA) · AI Jason · 27 min | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1122s) · Aishwarya Srinivasan · 18:42–20:42 · 2 min | Present three architecture options with estimated cost and latency. | 45 min |
| Technical debt | [#113 - Architecture Decision Record (ADR) - Michael Keeling](https://www.youtube.com/watch?v=-JqraBhrrjI) · Tech Lead Journal · 41 min | — | Keep a debt register with impact and cost; schedule the top item. | 30 min |

### Application architecture

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Modular architecture | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Draw LedgerSync's modules and dependencies; remove one cyclic dependency. | 45 min |
| Service boundaries | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Decide which modules become services and which stay together; write the ADR. | 45 min |
| Separation of concerns | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Separate API, domain and data layers so domain code imports neither FastAPI nor SQLAlchemy. | 60 min |
| API architecture | [9 Must-Know REST API Design Principles for Developers](https://www.youtube.com/watch?v=pJ83mmqcvoQ) · ByteMonk · 10 min | [REST API Design Like a Senior Engineer (REST, GraphQL, Networking, Pagination, Auth, Security)](https://www.youtube.com/watch?v=BvtIqaiabJA) · System Design Lab · 145 min | Version the API and document the breaking-change policy. | 45 min |
| Event-driven integration concepts | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo) · Concept && Coding - by Shrayansh · 30 min | — | Publish 'import.completed' events and let a separate consumer start matching. | 60 min |
| Background processing | [Background Tasks with FastAPI Background Tasks and Celery + Redis - FastAPI Beyond CRUD (Part 20)](https://www.youtube.com/watch?v=eAHAKowv6hk) · Ssali Jonathan · 45 min | [FastAPI BackgroundTasks vs. Celery: Which One to Choose?](https://www.youtube.com/watch?v=31pLwWmsu3w) · Analytics Vidhya · 4 min | Move long imports to a queue worker; the API returns 202 with a status URL. | 60 min |
| Asynchronous workflows | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=986s) · Concept && Coding - by Shrayansh · 16:26–20:20 · 4 min | [Python Tutorial: AsyncIO - Complete Guide to Asynchronous Programming with Animations](https://www.youtube.com/watch?v=oAkLSJNr5zY) · Corey Schafer · 103 min | Make agent runs asynchronous and stream status to the client. | 45 min |
| Workflow orchestration | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=597s) · Aishwarya Srinivasan · 9:57–12:23 · 2 min | — | Coordinate import → match → investigate as a durable workflow with per-step retries. | 60 min |
| Data and application integration patterns | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=1220s) · Concept && Coding - by Shrayansh · 20:20–29:34 · 9 min | — | Choose batch file, API pull or event push for each data source; justify in an ADR. | 45 min |

### Data architecture

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Data domains and ownership | [Data Mesh 101 - Zhamak Dehghani](https://www.youtube.com/watch?v=346N_pCtYZU&t=994s) · DataTalksClub ⬛ · 16:34–25:26 · 9 min | [Data Mesh 101: Data Ownership by Domain](https://www.youtube.com/watch?v=vM1g2rzLkI4) · Confluent, an IBM Company · 7 min | Assign an owner to each data domain in your solution. | 30 min |
| Operational and analytical stores | [SQL Data Warehouse from Scratch / Full Hands-On Data Engineering Project](https://www.youtube.com/watch?v=9GVqKuTVANE&t=170s) · Data with Baraa · 2:50–9:41 · 7 min | — | Decide what lives in each store for your solution, with the reason. | 30 min |
| Data lineage | [What is Data Lineage? / Data Engineering in Five Minutes](https://www.youtube.com/watch?v=p11p1IzfGFE) · Softwire · 5 min | — | Trace one reported number from the dashboard back to its source file. | 45 min |
| Data contracts | [Data Contracts Explained: Stop Broken Pipelines Before They Start](https://www.youtube.com/watch?v=LfM0eVrK7Bo) · The Data Signal · 4 min | — | Write a contract between your pipeline and your report, stating what cannot change without notice. | 45 min |
| Master data for finance | [What is Master Data Management? MDM Explained for Beginners](https://www.youtube.com/watch?v=_6qLg1XuvYI) · The Data and AI Guy · 14 min | — | Decide where your chart of accounts and cost centres are mastered, and how changes reach other systems. | 45 min |

### Network fundamentals

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| IP, DNS and TLS | [Networking Basics: IP, DNS, HTTP/HTTPS & Ports for Modern Systems / Uplatz](https://www.youtube.com/watch?v=qAkbEfe0bPA) · Uplatz · 8 min | [SSL, TLS, HTTPS Explained](https://www.youtube.com/watch?v=j9QmMEWmcfo) · ByteByteGo · 6 min | Trace how a browser reaches your API, from name to encrypted connection. | 30 min |
| Virtual networks and subnets | [Azure Virtual Network Overview](https://www.youtube.com/watch?v=7rzawA--r20) · John Savill's Technical Training · 53 min | [Azure Networking for Beginners / Complete Hands-on Labs Masterclass](https://www.youtube.com/watch?v=DFdOi0QVso4&t=40s) · A Guide to Cloud & AI · 0:40–8:32 · 8 min | Design a virtual network with separate subnets for app and data. | 45 min |
| Private endpoints | [Why Azure Private Endpoints Exist (The Problem Nobody Explains) / Complete Demo + DNS Deep Dive](https://www.youtube.com/watch?v=1yey_ANEOeo) · Cloud With Aarya · 14 min | [Private Endpoint DNS Exploration](https://www.youtube.com/watch?v=rXbamGNz-xQ) · John Savill's Technical Training · 8 min | Put your database behind a private endpoint and confirm public access fails. | 45 min |
| Firewalls and gateways | [Azure Networking for Beginners / Complete Hands-on Labs Masterclass](https://www.youtube.com/watch?v=DFdOi0QVso4&t=6833s) · A Guide to Cloud & AI · 1:53:53–2:13:09 · 19 min | — | Decide what should sit in front of your API, and write the rules. | 30 min |

### Enterprise identity and security

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Microsoft Entra ID | [Microsoft Entra Overview - AZ-900 Certification Course - January 2023 New](https://www.youtube.com/watch?v=bSIF_GjaCmo) · John Savill's Technical Training · 12 min | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs) · Militas Aurelius · 31 min | Set up a test tenant with users and groups that mirror finance roles. | 45 min |
| OAuth2 and OIDC integration | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | [How OpenID Connect works](https://openid.net/developers/how-connect-works/) · OpenID Foundation (docs) | Replace local login with Entra sign-in using authorisation code + PKCE. | 90 min |
| RBAC | [Azure Role-Based Access Control Deep Dive](https://www.youtube.com/watch?v=qFoHDTxkQII) · John Savill's Technical Training · 35 min | [Azure RBAC Tutorial: Roles, Scope & Access Control Explained (2026)](https://www.youtube.com/watch?v=1kSur3me2jU) · Bits&Breach · 15 min | Define app roles in Entra and map them to LedgerSync permissions. | 45 min |
| Tenant isolation | [Designing Scalable Multi-Tenant Architectures with PostgreSQL for SaaS Solutions](https://www.youtube.com/watch?v=9Nayh0FPv0A) · Postgres Conference · 41 min | [PostgreSQL RLS for Safer Multi-Tenant SaaS](https://www.youtube.com/watch?v=DabJ0hxiXAo) · International PHP Conference · 8 min | Design how two business units' data stay isolated; choose and justify the model. | 60 min |
| Identity and access management | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs&t=505s) · Militas Aurelius · 8:25–22:53 · 14 min | — | Apply a Conditional Access policy requiring MFA for approvers. | 45 min |
| Data security | [Azure Storage and Disk Encryption Deep Dive](https://www.youtube.com/watch?v=EOXgzTqceok) · John Savill's Technical Training · 35 min | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | Encrypt data at rest and in transit; document who owns each key. | 45 min |
| Auditability | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs&t=1466s) · Militas Aurelius · 24:26–29:45 · 5 min | — | Trace who accessed what and when, from sign-in logs to the app's audit trail. | 45 min |
| Secure integration patterns | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=1085s) · Google for Developers · 18:05–22:25 · 4 min | — | Review each integration's auth method, scope and secret handling; fix the weakest. | 45 min |

### Resilience and scale

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Disaster recovery | [RTO and RPO Explained - why are they important concepts in Disaster Recovery](https://www.youtube.com/watch?v=McBnARj4xlU) · DisasterRecoveryPro · 10 min | — | Write a recovery plan for the loss of your database at month end. | 45 min |
| Recovery objectives | [What is RPO and RTO in Disaster Recovery (DR)?](https://www.youtube.com/watch?v=8fVIEKJb-s0) · SrcCodes · 2 min | — | Agree recovery time and data-loss targets for the close, and test one. | 30 min |
| Scalability | [Microsoft Azure Well-Architected Framework](https://www.youtube.com/watch?v=dT233xJ3xPs) · Microsoft Reactor · 57 min | — | Find what limits your API first, and how you would remove that limit. | 30 min |
| Performance and load testing | [Locust in 30 Minutes: Install, 10-Line Test, Web UI, First Load (Beginner Friendly)](https://www.youtube.com/watch?v=u6VW-HqxOjg) · José Cruz (IT Architect) · 36 min | — | Load test your API at expected month-end peak and record the results. | 60 min |

### AI governance and operating model

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| AI governance | [The Five Must-Haves of an AI Governance Framework](https://www.youtube.com/watch?v=NrkJLbn3dDE) · SANS Institute · 29 min | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) · NIST (docs) | Draft LedgerSync's AI governance policy: owners, risk tiers and approvals. | 60 min |
| Data governance | [Data Governance Overview](https://www.youtube.com/watch?v=EI8R5UuZt4U) · Informatica Support · 23 min | — | Classify each data source by sensitivity and owner; record retention rules. | 45 min |
| Responsible AI | [Responsible AI: why businesses need reliable AI governance](https://www.youtube.com/watch?v=MluoD8Z1ARQ) · IBM Technology · 27 min | [Microsoft Responsible AI](https://www.microsoft.com/en-us/ai/responsible-ai) · Microsoft (docs) | Assess the variance analyst's fairness, transparency and accountability risks. | 45 min |
| Privacy and compliance considerations | [Data Governance Overview](https://www.youtube.com/watch?v=EI8R5UuZt4U) · Informatica Support · 23 min | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) · NIST (docs) | Document lawful basis, retention and residency for each use of personal data. | 45 min |
| Model lifecycle management | [DevOps in the era of generative AI: foundations of LLMOps](https://www.youtube.com/watch?v=K2gknZ2ubW4) · Microsoft Reactor · 38 min | [Claude: Models overview](https://platform.claude.com/docs/en/models/overview) · Anthropic (docs) | Define how a model change is proposed, evaluated, approved and rolled out, and how a deprecated model is replaced. | 45 min |
| Evaluation governance | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4) · Hamel Husain · 27 min | — | Make eval results a required approval artefact for every model or prompt change. | 30 min |
| Access reviews | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs) · Militas Aurelius · 31 min | [Entra: Add app roles to your application](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps) · Microsoft (docs) | Run a quarterly access review: export assignments, confirm or revoke each. | 30 min |
| Operational ownership | [You Build It, You Run It: The Preferred Ownership Model for Engineering Teams / Dan Bennett /](https://www.youtube.com/watch?v=aW3r_eGXLnI) · Eficode · 41 min | [What is You Build It You Run It?](https://www.youtube.com/watch?v=-5rPZmMp7qE) · You Build It You Run It - Bethan Timmins · 5 min | Write the RACI for running LedgerSync in production. | 30 min |
| Business value measurement | [The Five Must-Haves of an AI Governance Framework](https://www.youtube.com/watch?v=NrkJLbn3dDE) · SANS Institute · 29 min | — | Measure hours saved per close from real usage logs against the baseline. | 60 min |
| Production support | [Production Support L1 L2 L3 Explained / Real-Time Roles & Daily Tasks 🔥/ L2 Support Daily Routine](https://www.youtube.com/watch?v=CirUgMfkwKk) · Sai Vinod Irala · 23 min | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | Set up the support process: intake, triage, service levels and escalation. | 45 min |

### FinOps and business value

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| FinOps | [FinOps and Cost Optimization in Azure](https://www.youtube.com/watch?v=_hxYKakfbtQ) · Cloud Lunch and Learn · 52 min | [FinOps Explained in 5 Minutes / What is FinOps?](https://www.youtube.com/watch?v=gWDTRf_kGHI) · Anglepoint · 5 min | Review your Azure bill and set one budget and one alert. | 30 min |
| Total cost of ownership | [Cloud Total Cost of Ownership / How to Understand Your Cloud Total Cost of Ownership TCO / Flexera](https://www.youtube.com/watch?v=5HscS50lt_s) · Flexera | ITAM, FinOps & SaaS Management · 7 min | [Azure TCO Calculator Explained / Estimate Cloud Costs & Save Smart](https://www.youtube.com/watch?v=4Gnixbx_qMs) · Cloud360 Training · 10 min | Calculate three-year cost including people, not only cloud. | 60 min |
| ROI and business value | [How to Calculate AI ROI Before You Invest](https://www.youtube.com/watch?v=DYJqOe4RXxY) · DigitSense · 6 min | [How to Calculate ROI on AI Projects: A Framework for Enterprise Leaders](https://www.youtube.com/watch?v=jeBJpbDL5q0) · Technijian · 2 min | Estimate hours saved per close and turn that into an ROI case, stating your assumptions. | 60 min |
| Cost allocation and showback | [Cost Allocation Models and Chargeback](https://www.youtube.com/watch?v=UbMjxagpZl4) · FinOps Foundation · 43 min | [How to create a cost allocation rule with Azure Cost Management](https://www.youtube.com/watch?v=nYzIIs2mx9Q) · Microsoft Cost Management · 4 min | Tag resources and report cost by department. | 30 min |

## Video reasons

| Video | Why it is included |
|---|---|
| Python Tutorial for Beginners 4: Lists, Tuples, and Sets — Corey Schafer | Lists, tuples and sets with their trade-offs, quickly. Use only where gaps exist. |
| Python Tutorial for Beginners 5: Dictionaries - Working with Key-Value Pairs — Corey Schafer | Dictionaries in ten minutes: the structure behind every JSON payload you will handle. |
| Python Tutorial for Beginners 8: Functions — Corey Schafer | Functions, arguments and return values, the unit every module is built from. |
| Python Tutorial for Beginners 9: Import Modules and Exploring The Standard Library — Corey Schafer | Imports, sys.path and the standard library: how Python finds your code. |
| Python OOP Tutorial 1: Classes and Instances — Corey Schafer | First of a six-part OOP series that is still the clearest available. |
| Python OOP Tutorial 2: Class Variables — Corey Schafer | Class versus instance state: a frequent source of shared-state bugs. |
| Python OOP Tutorial 3: classmethods and staticmethods — Corey Schafer | classmethods as alternative constructors, e.g. building a row from a CSV line. |
| Python OOP Tutorial 4: Inheritance - Creating Subclasses — Corey Schafer | Inheritance done carefully; pair it with the composition exercise. |
| Python OOP Tutorial 5: Special (Magic/Dunder) Methods — Corey Schafer | Dunder methods make domain objects (money, ledger lines) behave naturally. |
| Python OOP Tutorial 6: Property Decorators - Getters, Setters, and Deleters — Corey Schafer | Properties for validated, derived attributes. |
| Python Tutorial: Using Try/Except Blocks for Error Handling — Corey Schafer | try/except/else/finally, and raising your own exceptions. |
| Python Tutorial: Type Hints - From Basic Annotations to Advanced Generics — Corey Schafer | Current (2025) end-to-end guide: annotations to generics, with mypy. |
| The REAL Reason You Should Use Type Hints in Python — ArjanCodes | Why types matter in code review: the engineering argument, briefly. |
| Python Tutorial: Decorators - Dynamically Alter The Functionality Of Your Functions — Corey Schafer | Decorators from closures upwards; needed to read FastAPI and pytest code. |
| Python Tutorial: Generators - How to use them and the benefits you receive — Corey Schafer | Generators for streaming large files row by row. |
| Python Tutorial: Working with JSON Data using the json Module — Corey Schafer | Loading and writing JSON, the format of every API and LLM response. |
| Python Tutorial: File Objects - Reading and Writing to Files — Corey Schafer | Reading and writing files safely with context managers. |
| Python Tutorial: Context Managers - Efficiently Managing Resources — Corey Schafer | Context managers: the pattern behind files, transactions and locks. |
| Python Tutorial: VENV (Mac & Linux) - How to Use Virtual Environments with the Built-In venv Module — Corey Schafer | How virtual environments isolate dependencies (Mac/Linux shown; concepts identical on Windows). |
| Python Tutorial: UV - A Faster, All-in-One Package Manager to Replace Pip and Venv — Corey Schafer | uv (2025): one tool for environments, dependencies and lock files. The current practice. |
| Python Tutorial: AsyncIO - Complete Guide to Asynchronous Programming with Animations — Corey Schafer | Animated, current (2025) explanation of the event loop, tasks and when not to use asyncio. |
| Logging in Python  //  Learn Python Programming  (Computer Science) — Socratica | Eight-minute introduction to the logging module. |
| Python Tutorial: Logging Advanced - Loggers, Handlers, and Formatters — Corey Schafer | Loggers, handlers and formatters: production logging structure. |
| Python Pandas Tutorial (Part 1): Getting Started with Data Analysis - Installation and Loading Data — Corey Schafer | Selective pandas: loading data and DataFrame basics, applied to reconciliation extracts. |
| Lecture 6: Version Control (git) (2020) — Missing Semester | Git's data model (snapshots, commits, refs). Understanding the model ends Git confusion. |
| Lecture 1: Course Overview + The Shell (2020) — Missing Semester | The shell from first principles: the base for Docker, CI and servers. |
| How to Debug Python with VSCode — Jayanam | Six minutes: breakpoints, stepping and variables in VS Code. |
| Pytest Tutorial – How to Test Python Code — freeCodeCamp.org | The freeCodeCamp pytest course from the original plan; chaptered for fixtures, parametrize and mocking. |
| Python Tutorial: Unit Testing Your Code with the unittest Module — Corey Schafer | Includes unittest.mock patching of an external request. |
| How to use Python's unittest.mock.patch — redshiftzero | Short and precise on the 'where to patch' rule that trips most people. |
| SQL Full Course for Beginners (30 Hours) – From Zero to Hero — Data with Baraa | Data with Baraa's SQL course: use only the chaptered sections mapped to each subtopic. |
| Database Design & Data Modeling Full Course For Beginners [2026] — Ansh Lamba | Data modelling and normalisation, chaptered; take only the relational sections. |
| Relational Database ACID Transactions (Explained by Example) — Hussein Nasser | Hussein Nasser on ACID with examples: what a transaction really guarantees. |
| Database Indexing Explained (with PostgreSQL) — Hussein Nasser | How PostgreSQL uses (and ignores) indexes, with EXPLAIN. |
| SQLAlchemy 2.0 ORM Crash Course - Manage Relational Databases with Python (SQLAlchemy 2.0) — Ssali Jonathan | SQLAlchemy 2.0-style ORM, chaptered. |
| TUTORIAL: SQLAlchemy 2.0 — Six Feet Up | SQLAlchemy 2.0 tutorial walk-through by its author, Mike Bayer. |
| Python API Development - Comprehensive Course for Beginners — freeCodeCamp.org | freeCodeCamp's 19-hour FastAPI course, chaptered. Every Phase 2 backend subtopic maps to a section. |
| OAuth 2.0 and OpenID Connect (in plain English) — OktaDev | OAuth 2.0 and OIDC in plain English (OktaDev); still the reference explanation. |
| What Is Idempotency? Idempotency Keys, Deduplication & Retries Explained — The Right Trade-off | Three-minute idempotency keys explainer. |
| Retry Strategies: Exponential Backoff & Jitter Explained — CodeLucky | Exponential backoff with jitter, briefly. |
| [1hr Talk] Intro to Large Language Models — Andrej Karpathy | Karpathy's one-hour mental model of LLMs, including tool use and security. |
| Deep Dive into LLMs like ChatGPT — Andrej Karpathy | Karpathy's deep dive: tokens, pre-training, post-training, hallucination. Use the mapped chapters. |
| Let's build the GPT Tokenizer — Andrej Karpathy | Optional depth: why tokenisation explains odd model behaviour and cost. |
| Transformers, the tech behind LLMs / Deep Learning Chapter 5 — 3Blue1Brown | 3Blue1Brown's visual explanation of what happens inside a transformer. |
| Python + AI: Function calling & structured outputs — Microsoft Reactor | Microsoft Reactor: function calling and structured outputs in Python. |
| Pydantic is all you need: Jason Liu — AI Engineer | Jason Liu on Pydantic as the contract for LLM outputs. |
| Prompting 101 / Code w/ Claude — Anthropic | Anthropic's own Prompting 101 workshop: building a prompt from scratch. |
| Context Engineering for Agents — LangChain | Context engineering: selecting, compressing and isolating context. |
| Prompt Injection, explained — Simon Willison | Simon Willison, who named prompt injection, explaining why it is hard. |
| How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites) — Dave Ebbelaar | Parsing PDFs and documents into clean input, chaptered. |
| Embeddings & Cosine Similarity Explained / Semantic Search, Vector Database & RAG with Examples — PM Expert | Embeddings and cosine similarity in under ten minutes. |
| The 5 Levels Of Text Splitting For Retrieval — Greg Kamradt | Greg Kamradt's five levels of text splitting. |
| Semantic Chunking for RAG — James Briggs | Semantic chunking compared with fixed-size chunks. |
| PGVector: Turn PostgreSQL Into A Vector Database — NeuralNine | pgvector in practice: vectors next to your relational data. |
| Hybrid Search in RAG Explained / BM25 + Semantic Search + RRF (Complete Guide) — Yash Patil | BM25 + vector + Reciprocal Rank Fusion, explained end to end. |
| RAG But Better: Rerankers with Cohere AI — James Briggs | Two-stage retrieval with a reranker. |
| Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer — freeCodeCamp.org | RAG from scratch (LangChain engineer): indexing, query transformation, routing. |
| AI Agent Evaluation with RAGAS — James Briggs | Measuring retrieval and answer quality with RAGAS metrics. |
| Building more effective AI agents — Anthropic | Anthropic on building effective agents: workflows versus agents, tools, failure. |
| Andrew Ng Explores The Rise Of AI Agents And Agentic Reasoning / BUILD 2024 Keynote — Snowflake Inc. | Andrew Ng's four agentic patterns: reflection, tool use, planning, multi-agent. |
| Agent Memory EXPLAINED - Complete Architecture — Hugging Face | Short- and long-term agent memory architecture. |
| 3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph — AI Engineer | Harrison Chase (LangGraph) on reliable enterprise agents. |
| How to Build Human-in-the-Loop for AI Agents (Practical Guide) — Dave Ebbelaar | Human-in-the-loop approval for agents, practically. |
| Building with MCP and the Claude API — Anthropic | Anthropic: building with MCP and the Claude API, chaptered. |
| Build Anything With a CUSTOM MCP Server - Python Tutorial — Tech With Tim | Writing a custom MCP server in Python. |
| Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi — Optimized AI Conference | Routing work across models for cost and quality. |
| LLM Evals: Common Mistakes — Hamel Husain | Hamel Husain on the common mistakes in LLM evals. |
| How to Automate AI Evals (Correctly) — Hamel Husain | Turning error analysis into automated evaluators (2026). |
| 3. Tutorial: How to create an LLM judge and align with human labels — Evidently AI | Building an LLM judge and aligning it with human labels. |
| Agentic Evaluations at Scale, For Everybody — Nicholas Kang & Michael Aaron, Google DeepMind — AI Engineer | Google DeepMind on evaluating multi-step agents. |
| How Tracing works with OpenTelemetry — That DevOps Guy | How distributed tracing works (OpenTelemetry), the model Langfuse builds on. |
| LLM Observability: The Breakdown — The New Stack | What to monitor in LLM systems: quality, drift, cost and latency. |
| 10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management — Langfuse | Official ten-minute Langfuse tour: tracing, prompts, evals, datasets. |
| Langfuse Intro - Observability & Tracing Deep Dive — Langfuse | Official deep dive on Langfuse tracing. |
| Advanced Guardrails for AI Agents / Full Tutorial — James Briggs | Guardrails against misuse, leakage and prompt attacks, in code. |
| OWASP's Top 10 Ways to Attack LLMs: AI Vulnerabilities Exposed — IBM Technology | IBM's walk-through of the OWASP Top 10 for LLMs. |
| Data Governance Overview — Informatica Support | Data governance concepts and roles. |
| Responsible AI: why businesses need reliable AI governance — IBM Technology | Responsible AI governance in business terms. |
| Docker Tutorial for Beginners [FULL COURSE in 3 Hours] — TechWorld with Nana | TechWorld with Nana's Docker course, chaptered (Compose, Dockerfile, volumes). |
| This Is How You Write an Efficient Python Dockerfile — ArjanCodes | Small, cache-friendly Python images (2025). |
| GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker — TechWorld with Nana | GitHub Actions concepts and a CI/CD pipeline with Docker. |
| Automated Testing in Python with pytest, tox, and GitHub Actions — mCoding | Running pytest in GitHub Actions before anything ships. |
| Learn Azure in 2026 — John Savill's Technical Training | John Savill (2026) on how to learn Azure efficiently: access, portal, Cloud Shell, Microsoft Learn and certifications. |
| Azure Container Apps (2025 Edition) — Agentic Intelligence w/ Michael Levan | Azure Container Apps hands-on (CLI, portal, image deployment). |
| Microsoft Entra Overview - AZ-900 Certification Course - January 2023 New — John Savill's Technical Training | John Savill's Entra overview. |
| Entra ID (Azure AD) -  Deep Dive — Militas Aurelius | Entra ID components in depth, chaptered. |
| The REAL cost of LLM (And How to reduce 78%+ of Cost) — AI Jason | Where LLM cost comes from and how to cut it. |
| Agentic AI System Design Explained in 27 Minutes — Aishwarya Srinivasan | End-to-end agentic system design in 27 minutes. |
| Event Driven Architecture (EDA) Introduction — Concept && Coding - by Shrayansh | Event-driven architecture: events, queues, pub/sub. |
| The Multi-Agent Architecture That Actually Ships — Luke Alvoeiro, Factory — AI Engineer | How a production multi-agent system is structured. |
| How to secure your AI Agents: A Technical Deep-dive — Google for Developers | Securing agents: identity, permissions, sandboxing, injection defence. |
| The Five Must-Haves of an AI Governance Framework — SANS Institute | SANS: the must-haves of an AI governance framework. |
| Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019 — Agile on the Beach | Simon Brown, creator of the C4 model, presenting it. |
| Lesson 55 - Architecture Decision Records — Software Architecture Monday | Mark Richards: ADRs in ten minutes. |
| #113 - Architecture Decision Record (ADR) - Michael Keeling — Tech Lead Journal | Michael Keeling on ADR practice in teams. |
| SQL Data Warehouse from Scratch / Full Hands-On Data Engineering Project — Data with Baraa | A complete warehouse built by hand, with ETL, layers and star schema all in timestamped chapters. |
| Learn Pandas in Under 3 Hours / Filtering, Joins, Indexing, Data Cleaning, Visualizations — Alex The Analyst | One clear pandas course from a channel you named, chaptered by exactly the skills this module needs. |
| Python Pandas Tutorial (Part 10): Working with Dates and Time Series Data — Corey Schafer | Corey Schafer's focused lesson on dates, which finance periods depend on. |
| Python Quick Tip: Hiding Passwords and Secret Keys in Environment Variables (Mac & Linux) — Corey Schafer | Short and practical. It shows Mac and Linux, so use the Windows alternative on your machine. |
| Hiding Passwords and Secret Keys in Environment Variables (Windows) — Techie Coder | The same technique on Windows, which is what you run. |
| FastAPI Settings: Why You Should Use Pydantic-Settings — Analytics Vidhya | Shows why configuration belongs in one validated settings object. |
| Python Pydantic Tutorial: Complete Data Validation Course (Used by FastAPI) — Corey Schafer | A full, recent Pydantic course from a trusted teacher; this is the validation layer FastAPI uses too. |
| How to build ETL pipeline with Incremental Data Load with Python / Python /  ETL — BI Insights Inc | A short, direct example of loading only what changed. |
| How to test your Data Pipelines with Great Expectations — BI Insights Inc | Practical data-quality rules that fail a pipeline loudly. |
| Databricks Tutorial (From Zero to Hero) / Azure Databricks Masterclass — Ansh Lamba | A long Azure-based Databricks course, so it matches your primary cloud, with precise chapters. |
| Databricks Tutorial for Beginners 2026 / Free Edition + Full 101 Guide — First Principles Data Engineering | Recent, short and uses the free edition, so you can start without an Azure bill. |
| Databricks tutorial - an intro to the medallion architecture — Kokchun Coding Tutorials | A second short view of the same pattern, from a practical angle. |
| Delta Lake Databricks (From Zero to Pro in 4 HOURS) / Delta Lake Pyspark — Ansh Lamba | Goes deeper on Delta Lake than the main course when you need it. |
| Data Modeling in Power BI Full Course for Beginners (5 Hours) – From Zero to Hero — Data with Baraa | A recent modelling course from a channel you named, with a dedicated row-level security chapter. |
| Power BI Full Course / Master DAX, Data Preparation, Modeling & Visualization — DataCamp | One compact course that covers Power Query, DAX and report design with chapters. |
| Power BI Tutorial for Beginners (Step-by-Step in 30 Minutes) — Guy in a Cube | A recent Guy in a Cube walkthrough, from a channel you named. |
| Learn Terraform on Azure — Beginner Course — Adeel Automates | A recent Azure-specific beginner course, chaptered around the core Terraform workflow. |
| Terraform with Azure Tutorial for Beginners / Remote State, Modules & HCP Terraform [HINDI] — M Prashant | A very recent Azure course that reaches remote state, workspaces and modules. |
| OpenTelemetry: How distributed tracing really works with Python, FastAPI and requests — Adam Gardner | Explains how distributed tracing really works, using Python and FastAPI. |
| OpenTelemetry FastAPI Tutorial: Get GREAT App Performance NOW! — Eric Roby | A hands-on walkthrough of instrumenting FastAPI. |
| Building custom metrics dashboards for Python programs with Azure App Insights and OpenTelemetry — Joe Freeman: Software Craft, Org Stuff, Tech Stuff | The only lead tying OpenTelemetry to Azure App Insights dashboards, your primary cloud. |
| LangGraph interrupt: Making it easier to build human-in-the-loop agents — LangChain | From LangChain itself, so it reflects how interrupts are meant to work. |
| LangGraph - Persistence & Human-in-the-Loop Workflow — Coding Crash Courses | Covers persistence and human approval together, as your agent will use them. |
| LangGraph Tutorial: Understanding Nodes, Edges, and State Management — Analytics Vidhya | A focused first lesson on exactly the three core ideas. |
| LangGraph Tutorial 102: Add Tools, Nodes, Conditional & Normal Edges, Memory, Langchain & Langsmith — HTMLFiveDev | Adds conditional edges to a working graph. |
| LangSmith 101 for AI Observability / Full Walkthrough — James Briggs | A short walkthrough of tracing from a teacher already used in this curriculum. |
| How to Stream OpenAI Responses in Python (Sync & Async) — Raj Kapadia | Short, and covers both sync and async streaming. |
| How to setup Azure OpenAI service and use it in Python — SL7 Tech | Sets up the Azure service, keys and deployments, then calls it from Python. |
| FinOps and Cost Optimization in Azure — Cloud Lunch and Learn | A full session on FinOps and cost optimisation in Azure specifically. |
| FinOps Explained in 5 Minutes / What is FinOps? — Anglepoint | A five-minute orientation before the longer session. |
| What is RPO and RTO in Disaster Recovery (DR)? — SrcCodes | A short, clear definition of the two recovery targets. |
| RTO and RPO Explained - why are they important concepts in Disaster Recovery — DisasterRecoveryPro | Explains why recovery objectives matter, in plain language. |
| Circuit Breaker Pattern Explained: Timeouts, Retries and Fallbacks — System Design Lab | A recent, detailed treatment of timeouts and circuit breakers, including when not to use them. |
| Locust in 30 Minutes: Install, 10-Line Test, Web UI, First Load (Beginner Friendly) — José Cruz (IT Architect) | Load testing in Python from a blank file. |
| Ultimate MCP Tutorial / Learn Model Context Protocol and Deploy your MCP Server — Lama Dev | One well-chaptered course covering every MCP building block, including auth. |
| MCP Security Fundamentals Course — freeCodeCamp.org | A recent, dedicated security course for when you need depth. |
| Price Volume Mix (PVM) for Revenue Variance Analysis — KnowledgeBank by obviEnce | A finance-first explanation of price, volume and mix. |
| Price Volume Mix PVM for Gross Margin Variance Analysis — KnowledgeBank by obviEnce | Extends the same method to gross margin. |
| Price Volume Mix Analysis in Power BI: Complete PVM Tutorial — Zebra BI | The same analysis in Power BI, which suits your P2 project. |
| Data Mesh 101 - Zhamak Dehghani — DataTalksClub ⬛ | Zhamak Dehghani, who defined data mesh, on DataTalksClub, a channel you named. |
| Data Mesh 101: Data Ownership by Domain — Confluent, an IBM Company | A ten-minute summary of the same idea. |
| Azure Networking for Beginners / Complete Hands-on Labs Masterclass — A Guide to Cloud & AI | Hands-on Azure networking labs with chapters for each service. |
| Azure Virtual Network Overview — John Savill's Technical Training | John Savill's overview of virtual networks. Already a trusted source in this curriculum. |
| Why Azure Private Endpoints Exist (The Problem Nobody Explains) / Complete Demo + DNS Deep Dive — Cloud With Aarya | Starts from the problem private endpoints solve, which is how an architect should learn them. |
| Private Endpoint DNS Exploration — John Savill's Technical Training | Goes into the DNS side once you understand the basics. |
| Software Architecture in Golang: Quality Attributes, Non-Functional Requirements and ilities — Mario Carrion | The clearest short lead on quality attributes. Its examples use Go, but the ideas carry over. |
| SCD Type 1 and Type 2 using SQL / Implementation of Slowly Changing Dimensions — Ankit Bansal | Implements Type 1 and Type 2 in SQL, which is what you will write. |
| SCD: Slowly changing dimensions explained with real examples — Tech Coach | Explains the concept first, with real examples. |
| What is a Webhook? Webhooks Explained for Beginners — AppUnits AI | A short, recent explanation of the idea. |
| Webhooks for Beginners - Full Course — freeCodeCamp.org | A full course that reaches retries, idempotency and security. |
| Calculating Measurement Error using Python — Stephanie Powers | Computes MAD, MSE and MAPE in Python rather than only defining them. |
| Analyze Margin Changes Over Time - Analytics With Power BI & DAX — Enterprise DNA | Margin movement over time in Power BI and DAX. |
| What is Data Lineage? / Data Engineering in Five Minutes — Softwire | A five-minute definition, enough before you draw lineage for your own model. |
| Data Contracts Explained: Stop Broken Pipelines Before They Start — The Data Signal | A short, recent explanation tied to broken pipelines. |
| Networking Basics: IP, DNS, HTTP/HTTPS & Ports for Modern Systems / Uplatz — Uplatz | Covers IP, DNS, HTTPS and ports in one short lesson. |
| SSL, TLS, HTTPS Explained — ByteByteGo | ByteByteGo's short, visual explanation of TLS. |
| Role-Based Access Control Using Dependency Injection (User Roles) - FastAPI Beyond CRUD (Part 13) — Ssali Jonathan | RBAC through FastAPI dependencies, in the stack you are using. |
| FastAPI Role-Based Authorization (RBAC) / Secure APIs with Roles — Programming Guide | A recent alternative focused on roles alone. |
| Incident Management in SRE Explained (Google SRE Book) — Tech Tutorials with Piyush | Follows the Google SRE book from first alert to postmortem. |
| Workshop: How to Create A Streamlined Incident Management Runbook — Blameless | A full workshop on writing a runbook. |
| How to create an Azure Database for PostgreSQL Flexible server in Azure portal — Cloud Nerchuko | A recent walkthrough of the managed PostgreSQL you will deploy to. |
| Recover Deleted Azure PostgreSQL Database (Flexible Server) — Kris Turk | A concrete recovery case on the same service. |
| How to update your Azure Container Apps using Revisions — Will Velida | Revisions are the rollback mechanism in Azure Container Apps. |
| Traffic Splitting in Azure Container Apps / Step-by-Step Lab Demo — MadeForCloud | A lab on splitting traffic between revisions. |
| Deployment Strategies Explained: Blue-Green vs. Canary vs. Rolling — CodeLucky | A compact comparison of the three main strategies. |
| Azure Pipelines Deployment Strategies Explained / Blue-Green, Canary / AZ-400 DevOps Engineer — Skilltech Club | The same strategies in a longer Azure-based session. |
| Azure Key Vault Tutorial: Stop Leaking Your Secrets! — m365 Show | M365, Azure Cloud, Power Platform & AI | A very recent Key Vault tutorial with chapters. |
| Azure Key Vault Complete Tutorial / Azure Devops / .Net Core — AzureTeach•Net | A longer tutorial if you want full depth. |
| Microsoft Azure Well-Architected Framework — Microsoft Reactor | Microsoft's own session on the framework behind Azure architecture decisions. |
| 10   SRE Fundamentals — SLIs, SLOs & Error Budgets — Scott Benson | SLIs, SLOs and error budgets in one short lesson. |
| Alerting on SLOs and Error Budget Policies / Ricardo Castro / Conf42 SRE 2022 — Conf42 | Takes SLOs into alerting. |
| HTTP Crash Course / How The Web Works / 15 Minutes — WolfDenCode | A short, chaptered first look at HTTP. |
| Git Branching and Merging Tutorial for Beginners: Create, Switch & Merge — freeplacementcourse | Recent and focused on the commands you need. |
| Git Branching and Merging - Detailed Tutorial — SuperSimpleDev | A fuller alternative. YouTube blocks embedding, so it opens on YouTube. |
| Learn Python - Full Course for Beginners [Tutorial] — freeCodeCamp.org | A full beginner course. Use only the parts where you have gaps, as you already know basic Python. |
| Traceback (most recent call last): Python's tracebacks explained — Python Morsels | A short, focused lesson on exactly this skill. |
| Read Python Error Tracebacks Like a Pro: The 5 Most Common Errors — Data Science for Everyone | Recent, and walks through the five most common errors. |
| Pandas vs SQL - What's The Difference? — The Comparison Channel | A short direct comparison of the two tools. |
| Pandas vs SQL for Data Analytics — Fahd Mirza | A second short view, from data analytics. |
| ETL Testing:Mastering Source vs Target Validation in SQL: Complete Guide — SRTechnologies Ravindra Reddy | Source-to-target checks in SQL, the same logic as a finance reconciliation. |
| Part 0: [INTRO]Automation Data Reconciliation & Testing (That Actually Works) — ETL and Data Pipeline Testing | An introduction to automating those checks. |
| Idempotent Data Pipelines / Building Reliable & Fault-Tolerant Data Workflows / Uplatz — Uplatz | Covers recovering from failure without duplicating data, which is what a safe rerun means. |
| Data ingestion pipeline with built-in error handling — CloverDX | Shows an ingestion pipeline with logging and error handling built in. |
| Power BI Parent Child Chart of Accounts with DAX — Control Over Reports B.V. | A chart of accounts specifically, in the tool your P2 project uses. |
| Power BI Parent Child Chart of Accounts with M (Power Query) — Control Over Reports B.V. | The same task in Power Query. |
| Simple Currency Conversion in Power BI w/DAX — Enterprise DNA | Practical currency conversion with chapters. |
| How to Create Fiscal Dates Table in Power BI / Power BI CalendarAuto Function — Data Science Tutorials | Covers the period side of the unit: a fiscal date table. |
| Budget vs Actual in Python: Build a Real Finance Tool in 20 Minutes — AutoSolve | Budget versus actual built in Python, the skill this unit names. |
| Time Series Forecasting in Python – Tutorial for Beginners — freeCodeCamp.org | A recent beginner tutorial from freeCodeCamp. |
| Time Series Analysis Crash Course: Predict the Future with Python — Data Heroes | Timestamped chapters on exponential smoothing when you want depth. |
| Customer Profitability Analysis (Activity Based Costing) — Edspira | Customer profitability through activity-based costing, from a respected accounting teacher. |
| Error Handling (How to create Custom Error Handlers and Exceptions) - FastAPI Beyond CRUD (Part 16) — Ssali Jonathan | Custom exceptions and handlers in FastAPI, in a series already used here. |
| Promptfoo Assertions Overview — Jason Koo | Shows concrete assertion checks. Promptfoo is only the example; the idea is what matters. |
| HTTPX Tutorial - A next-generation HTTP client for Python — Patrick Loeber | A clear look at the modern Python HTTP client. |
| Rest API Authentication with Python. — Automation Experts | Adds the authentication methods external APIs use. |
| Backing Up a Postgres Database with pg_dump and pg_restore — WittCode | A short, complete backup and restore, including deliberately breaking a database. |
| How to backup a Docker Volume for an existing Postgres SQL database running as a Docker Container — TPPZ builds things | The same recovery for a containerised database. |
| GitHub Actions -  Getting Started With Environments — Mickey Gousset | A focused introduction to separate deployment environments in GitHub Actions. |
| Deploying to Environments with GitHub Actions (#212) — Asp.Net Monsters | A second worked deployment example. |
| 12. Metrics, Logs & Traces (Observability Explained) — Arpit Vaish | Short, recent and chaptered around all three signals. |
| Observability and Its Pillars Explained / Logs, Metrics & Traces Simplified — OpenObserve | A second short view of the three pillars. |
| Rate Limiting Explained: Token Bucket vs Sliding Window / System Design By Microsoft SWE — Mayank Joshi | Compares the two main algorithms. |
| Rate Limiting in Distributed Systems: Token Bucket & Leaky Bucket Algorithms Explained — CodeLucky | A distributed-systems view of the same topic. |
| Requirements Elicitation — UVA CS 3240 | A university software engineering lecture on eliciting requirements. |
| Requirements Gathering & Analysis in Software Development Life Cycle (SDLC) / Free Tutorial 2021 — Woodsy Spark Insights | A shorter summary of the same stage. |
| Stakeholders & Requirement Gathering Basics / Business Analyst Beginner Guide — Wise Flame | A short, recent lesson joining stakeholders to requirements. |
| How to Gather Requirements as a Business Analyst / Requirement Gathering Techniques — The Business Analysis Doctor - IIBA Certification | A business analyst's view of the same work. |
| Cohesion and Coupling: Write BETTER PYTHON CODE Part 1 — ArjanCodes | ArjanCodes, a channel you named, on the two ideas behind maintainable code, in Python. |
| Coupling 101: Design Choices That Make or Break Your Code — ArjanCodes | A newer treatment from the same teacher. |
| 9 Must-Know REST API Design Principles for Developers — ByteMonk | Nine design principles, including versioning and pagination, in ten minutes. |
| REST API Design Like a Senior Engineer (REST, GraphQL, Networking, Pagination, Auth, Security) — System Design Lab | A long, chaptered course for depth. Very recent. |
| Background Tasks with FastAPI Background Tasks and Celery + Redis - FastAPI Beyond CRUD (Part 20) — Ssali Jonathan | Moves from FastAPI background tasks to Celery, which is the decision you will face. |
| FastAPI BackgroundTasks vs. Celery: Which One to Choose? — Analytics Vidhya | A short guide to choosing between them. |
| What is Master Data Management? MDM Explained for Beginners — The Data and AI Guy | Recent and well chaptered. It is not finance-specific, so apply it to accounts and cost centres yourself. |
| Azure Role-Based Access Control Deep Dive — John Savill's Technical Training | John Savill on Azure roles, already a trusted source in this curriculum. |
| Azure RBAC Tutorial: Roles, Scope & Access Control Explained (2026) — Bits&Breach | A recent, shorter walkthrough. |
| Designing Scalable Multi-Tenant Architectures with PostgreSQL for SaaS Solutions — Postgres Conference | A PostgreSQL talk on multi-tenant design, on your database. |
| PostgreSQL RLS for Safer Multi-Tenant SaaS — International PHP Conference | How row-level security enforces the boundary inside the database. |
| Azure Storage and Disk Encryption Deep Dive — John Savill's Technical Training | John Savill on encryption and customer-managed keys in Azure. |
| DevOps in the era of generative AI: foundations of LLMOps — Microsoft Reactor | A Microsoft session on the foundations of LLMOps. |
| You Build It, You Run It: The Preferred Ownership Model for Engineering Teams / Dan Bennett / — Eficode | A full session on teams owning what they run. |
| What is You Build It You Run It? — You Build It You Run It - Bethan Timmins | A short definition first. |
| Production Support L1 L2 L3 Explained / Real-Time Roles & Daily Tasks 🔥/ L2 Support Daily Routine — Sai Vinod Irala | Real roles and daily tasks at each support level. |
| Cloud Total Cost of Ownership / How to Understand Your Cloud Total Cost of Ownership TCO / Flexera — Flexera | ITAM, FinOps & SaaS Management | A short structured explanation with chapters. |
| Azure TCO Calculator Explained / Estimate Cloud Costs & Save Smart — Cloud360 Training | Shows the Azure calculator for your primary cloud. |
| How to Calculate AI ROI Before You Invest — DigitSense | Frames ROI before investment, which is when a CFO asks. |
| How to Calculate ROI on AI Projects: A Framework for Enterprise Leaders — Technijian | A very short framework for enterprise leaders. |
| Cost Allocation Models and Chargeback — FinOps Foundation | From the FinOps Foundation itself. |
| How to create a cost allocation rule with Azure Cost Management — Microsoft Cost Management | Microsoft's own walkthrough of an allocation rule. |
