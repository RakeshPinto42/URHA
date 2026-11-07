# URHA — Curated curriculum map

Generated 2026-11-01 by `npm run curriculum:doc`. Do not edit by hand.

Videos verified against YouTube public metadata on 2026-11-01 (title, channel, duration, chapters). Documentation links checked on 2026-11-01. **258 subtopics; 195 video-led, 63 docs-led; 142 with a supplement; about 86 h of focused watching and 207 h of exercises.** Every subtopic: one primary resource, an optional supplement, an exercise with practice minutes.

## Phase 1 — Python, Engineering Foundations and Data Access (months 1–2)

**Exit gate:** Independently understand, modify, debug and test the application.

### Python engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Python fundamentals where gaps exist | [The Python Tutorial](https://docs.python.org/3/tutorial/) · Python Software Foundation (docs) | [Python Tutorial for Beginners 8: Functions](https://www.youtube.com/watch?v=9Os0o3wzS_I) · Corey Schafer · 22 min | Write a 30-line script that reads a bank CSV, totals by currency and prints a report. Revisit only the tutorial chapters you hesitated on. | 45 min |
| Data structures and collections | [Python Tutorial for Beginners 4: Lists, Tuples, and Sets](https://www.youtube.com/watch?v=W8KRzm-HUcc) · Corey Schafer · 29 min | [Python Tutorial for Beginners 5: Dictionaries - Working with Key-Value Pairs](https://www.youtube.com/watch?v=daefaLgNkw0) · Corey Schafer · 10 min | Hold a day of ledger lines as list[dict]; de-duplicate with a set of (date, amount, ref) tuples; total by account in a dict. | 40 min |
| Functions and modular programming | [Python Tutorial for Beginners 8: Functions](https://www.youtube.com/watch?v=9Os0o3wzS_I) · Corey Schafer · 22 min | [Python tutorial: Modules and packages](https://docs.python.org/3/tutorial/modules.html) · Python Software Foundation (docs) | Split the report script into pure functions (parse, validate, summarise) with no global state. | 45 min |
| Object-oriented programming | [Python OOP Tutorial 1: Classes and Instances](https://www.youtube.com/watch?v=ZDa-Z5JzLYM) · Corey Schafer · 15 min | [Python OOP Tutorial 2: Class Variables](https://www.youtube.com/watch?v=BJ-VvGyQxho) · Corey Schafer · 12 min | Create LedgerLine and BankLine classes with a method that returns their match key. | 45 min |
| Classes, inheritance and composition | [Python OOP Tutorial 4: Inheritance - Creating Subclasses](https://www.youtube.com/watch?v=RSl87lqOXDE) · Corey Schafer · 20 min | [Python OOP Tutorial 3: classmethods and staticmethods](https://www.youtube.com/watch?v=rq8cL2XMM5M) · Corey Schafer · 15 min | Build a Reconciler that has a matcher strategy (composition); swap exact matching for tolerance matching without subclassing. | 60 min |
| Exception handling | [Python Tutorial: Using Try/Except Blocks for Error Handling](https://www.youtube.com/watch?v=NIWwJbo-9_8) · Corey Schafer · 11 min | [Python tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) · Python Software Foundation (docs) | Define ValidationError carrying row number and reason; collect all errors instead of stopping at the first bad row. | 40 min |
| Type hints | [Python Tutorial: Type Hints - From Basic Annotations to Advanced Generics](https://www.youtube.com/watch?v=RwH2UzC2rIo) · Corey Schafer · 41 min | [The REAL Reason You Should Use Type Hints in Python](https://www.youtube.com/watch?v=0oBLMwHdZ2Y) · ArjanCodes · 13 min | Annotate the loader fully and make `mypy --strict` pass. | 45 min |
| Modules and packages | [Python Tutorial for Beginners 9: Import Modules and Exploring The Standard Library](https://www.youtube.com/watch?v=CqvZ3vGoGs0) · Corey Schafer · 22 min | [src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) · Python Packaging Authority (docs) | Restructure into a src/ledgersync package and run it with `python -m ledgersync`. | 40 min |
| Decorators and generators concepts | [Python Tutorial: Decorators - Dynamically Alter The Functionality Of Your Functions](https://www.youtube.com/watch?v=FsAPt_9Bf3U) · Corey Schafer · 30 min | [Python Tutorial: Generators - How to use them and the benefits you receive](https://www.youtube.com/watch?v=bD05uGo_sVI) · Corey Schafer · 11 min | Write a @timed decorator, and a generator that streams a 1,000,000-row CSV without loading it into memory. | 60 min |
| JSON processing | [Python Tutorial: Working with JSON Data using the json Module](https://www.youtube.com/watch?v=9N6a-VLBa2I) · Corey Schafer · 21 min | [json — JSON encoder and decoder](https://docs.python.org/3/library/json.html) · Python Software Foundation (docs) | Export validation errors as JSON and load them back into typed objects. | 30 min |
| Virtual environments | [Python Tutorial: VENV (Mac & Linux) - How to Use Virtual Environments with the Built-In venv Module](https://www.youtube.com/watch?v=Kg1Yvry_Ydk) · Corey Schafer · 14 min | [venv — Creation of virtual environments](https://docs.python.org/3/library/venv.html) · Python Software Foundation (docs) | Create and activate a venv on Windows; confirm `sys.prefix` points inside it. | 20 min |
| Dependency management | [Python Tutorial: UV - A Faster, All-in-One Package Manager to Replace Pip and Venv](https://www.youtube.com/watch?v=AMdG7IjgSPM) · Corey Schafer · 27 min | [uv documentation](https://docs.astral.sh/uv/) · Astral (docs) | Move the project to uv: pyproject.toml, `uv add`, and a committed uv.lock. | 40 min |
| Async programming fundamentals | [Python Tutorial: AsyncIO - Complete Guide to Asynchronous Programming with Animations](https://www.youtube.com/watch?v=oAkLSJNr5zY) · Corey Schafer · 103 min | [asyncio — Asynchronous I/O](https://docs.python.org/3/library/asyncio.html) · Python Software Foundation (docs) | Fetch three exchange-rate endpoints concurrently with asyncio.gather; compare with the sequential timing. | 60 min |
| File handling | [Python Tutorial: File Objects - Reading and Writing to Files](https://www.youtube.com/watch?v=Uh2ebFW8OYM) · Corey Schafer · 25 min | [Python Tutorial: Context Managers - Efficiently Managing Resources](https://www.youtube.com/watch?v=-aKFBoZpiqA) · Corey Schafer · 21 min | Read inputs with pathlib and context managers; write a dated report without overwriting an existing one. | 30 min |
| Environment variables | [The Twelve-Factor App: Config](https://12factor.net/config) · Adam Wiggins (docs) | — | Read DB_URL and LOG_LEVEL from the environment; fail at start-up with a clear message if DB_URL is missing. | 20 min |
| Application configuration | [Pydantic Settings](https://pydantic.dev/docs/validation/latest/concepts/pydantic_settings/) · Pydantic (docs) | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=32033s) · freeCodeCamp.org · 8:53:53–9:21:20 · 27 min | Create a typed Settings class (pydantic-settings) with defaults, .env support and validation. | 40 min |

### Software engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Git and GitHub | [Lecture 6: Version Control (git) (2020)](https://www.youtube.com/watch?v=2sjqTHE0zok) · Missing Semester · 85 min | [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow) · GitHub (docs) | Initialise the repository, make small meaningful commits and push to a private GitHub repository. | 45 min |
| Branching and merging | [Pro Git: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) · Scott Chacon, Ben Straub (docs) | — | Create a feature branch, cause a merge conflict on purpose, resolve it, then open and merge a pull request. | 45 min |
| Project structure | [src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) · Python Packaging Authority (docs) | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=176s) · mCoding · 2:56–8:35 · 6 min | Adopt a src/ layout with tests/ beside it; document the structure in the README. | 30 min |
| Debugging | [How to Debug Python with VSCode](https://www.youtube.com/watch?v=w8QHoVam1-I) · Jayanam · 6 min | [Python debugging in VS Code](https://code.visualstudio.com/docs/python/debugging) · Microsoft (docs) | Use a conditional breakpoint to stop on the row where a running total turns negative. | 30 min |
| Logging | [Python Tutorial: Logging Advanced - Loggers, Handlers, and Formatters](https://www.youtube.com/watch?v=jxmzY9soFXg) · Corey Schafer · 20 min | [Logging in Python  //  Learn Python Programming  (Computer Science)](https://www.youtube.com/watch?v=g8nQ90Hk328) · Socratica · 8 min | Configure file and console handlers; log each rejected row at WARNING with its reason. | 40 min |
| pytest | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0) · freeCodeCamp.org · 0:00–29:49 · 30 min | — | Write five tests for the validator, including one that expects an exception with pytest.raises. | 45 min |
| Fixtures | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=1789s) · freeCodeCamp.org · 29:49–41:10 · 11 min | [pytest: How to use fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html) · pytest-dev (docs) | Create a fixture that builds a small sample ledger and use it in three tests. | 30 min |
| Parameterised tests | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=2470s) · freeCodeCamp.org · 41:10–55:24 · 14 min | [pytest: How to parametrize](https://docs.pytest.org/en/stable/how-to/parametrize.html) · pytest-dev (docs) | Parametrise date-format validation with ten valid and invalid cases. | 30 min |
| Mocking | [Pytest Tutorial – How to Test Python Code](https://www.youtube.com/watch?v=cHYq1MRoyI0&t=3324s) · freeCodeCamp.org · 55:24–1:13:16 · 18 min | [How to use Python's unittest.mock.patch](https://www.youtube.com/watch?v=WFRljVPHrkE) · redshiftzero · 8 min | Mock the exchange-rate HTTP call so tests run offline; assert it was called with the right currency. | 45 min |
| Code quality | [Ruff documentation](https://docs.astral.sh/ruff/) · Astral (docs) | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=515s) · mCoding · 8:35–10:58 · 2 min | Add ruff and mypy, fix every finding, and run both in CI. | 40 min |
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
| PostgreSQL | [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html) · PostgreSQL Global Development Group (docs) | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=8651s) · freeCodeCamp.org · 2:24:11–3:12:10 · 48 min | Install PostgreSQL locally; create the ledgersync database and a least-privilege application user. | 45 min |
| Relational data modelling | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=3962s) · Ansh Lamba · 1:06:02–2:21:29 · 75 min | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=8489s) · Ansh Lamba · 2:21:29–2:47:08 · 26 min | Draw the ER diagram for entities, accounts, transactions and matches; normalise it to 3NF. | 60 min |
| Keys and constraints | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=5227s) · Ansh Lamba · 1:27:07–1:50:51 · 24 min | [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) · PostgreSQL Global Development Group (docs) | Add primary, foreign, unique and CHECK constraints; prove each by inserting a row it must reject. | 45 min |
| Transactions | [Relational Database ACID Transactions (Explained by Example)](https://www.youtube.com/watch?v=pomxJOFVcQs) · Hussein Nasser · 43 min | [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) · PostgreSQL Global Development Group (docs) | Load a file in one transaction; inject a failure halfway and prove nothing was committed. | 45 min |
| Indexing fundamentals | [Database Indexing Explained (with PostgreSQL)](https://www.youtube.com/watch?v=-qNSXK7s7_w) · Hussein Nasser · 18 min | [SQL Full Course for Beginners (30 Hours) – From Zero to Hero](https://www.youtube.com/watch?v=SSKVgrwhzus&t=66222s) · Data with Baraa · 18:23:42–20:20:31 · 117 min | EXPLAIN ANALYZE the unmatched-lines query before and after adding an index; record the timings. | 45 min |
| Database connectivity | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=14301s) · freeCodeCamp.org · 3:58:21–4:31:18 · 33 min | [Psycopg 3 documentation](https://www.psycopg.org/psycopg3/docs/) · Psycopg (docs) | Connect with psycopg 3 using parameterised queries only; insert validated rows in batches. | 45 min |
| Selective pandas for loading and checking data | [Python Pandas Tutorial (Part 1): Getting Started with Data Analysis - Installation and Loading Data](https://www.youtube.com/watch?v=ZyhVh-qRZPA) · Corey Schafer · 23 min | [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html) · pandas (docs) | Load a bank CSV with pandas, clean dates and amounts, merge it with the ledger extract and write the result to PostgreSQL. | 60 min |

## Phase 2 — APIs, Integrations and LLM Applications (months 3–4)

**Exit gate:** Build and test an API-driven LLM application with reliable structured outputs, error handling and cost visibility.

### Backend engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| HTTP fundamentals | [An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) · MDN Web Docs (docs) | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=3454s) · freeCodeCamp.org · 57:34–1:07:29 · 10 min | Use curl against a public API; explain every status code and header you see. | 30 min |
| REST architecture | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=2363s) · freeCodeCamp.org · 39:23–57:34 · 18 min | [FastAPI Tutorial — User Guide](https://fastapi.tiangolo.com/tutorial/) · FastAPI (docs) | Design resource URLs and methods for imports, transactions and matches as an OpenAPI sketch. | 40 min |
| FastAPI | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=2181s) · freeCodeCamp.org · 36:21–2:21:34 · 105 min | — | Build the first LedgerSync endpoints (list, get, create transactions) with in-memory storage. | 90 min |
| Pydantic | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=4049s) · freeCodeCamp.org · 1:07:29–1:22:45 · 15 min | [Pydantic documentation](https://pydantic.dev/docs/validation/latest/get-started/) · Pydantic (docs) | Model TransactionIn/Out with validators for amount precision and ISO currency codes. | 45 min |
| Request and response validation | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=19701s) · freeCodeCamp.org · 5:28:21–5:50:08 · 22 min | — | Add response_model to every endpoint so internal fields never leak; test a 422 response. | 40 min |
| API routing | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=22633s) · freeCodeCamp.org · 6:17:13–6:32:49 · 16 min | — | Split the endpoints into routers (imports, transactions, matches) with prefixes and tags. | 30 min |
| Dependency injection | [FastAPI: Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) · FastAPI (docs) | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=26003s) · freeCodeCamp.org · 7:13:23–7:25:21 · 12 min | Provide the database session and current user through Depends; override both in tests. | 45 min |
| SQLAlchemy | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=16278s) · freeCodeCamp.org · 4:31:18–5:28:21 · 57 min | [SQLAlchemy 2.0 ORM Crash Course - Manage Relational Databases with Python (SQLAlchemy 2.0)](https://www.youtube.com/watch?v=XWtj4zLl_tg) · Ssali Jonathan · 63 min | Replace in-memory storage with SQLAlchemy 2.0 models and one session per request. | 90 min |
| Alembic | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=37818s) · freeCodeCamp.org · 10:30:18–11:13:50 · 44 min | [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html) · SQLAlchemy (docs) | Generate the initial migration, add a column in a second migration, then downgrade it. | 45 min |
| Authentication | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=21008s) · freeCodeCamp.org · 5:50:08–6:17:13 · 27 min | — | Add registration with hashed passwords; test that a wrong password is refused. | 60 min |
| OAuth2 | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=25798s) · freeCodeCamp.org · 7:09:58–7:13:23 · 3 min | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | Implement the OAuth2 password flow with OAuth2PasswordBearer and explain why it suits first-party clients only. | 45 min |
| JWT | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=23569s) · freeCodeCamp.org · 6:32:49–7:09:58 · 37 min | [RFC 7519: JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519) · IETF (docs) | Issue short-lived JWTs; write a test proving an expired token is rejected. | 45 min |
| OIDC fundamentals | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | [How OpenID Connect works](https://openid.net/developers/how-connect-works/) · OpenID Foundation (docs) | Draw the authorisation-code + PKCE flow with Entra ID as LedgerSync's identity provider. | 45 min |
| API testing | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=54367s) · freeCodeCamp.org · 15:06:07–16:22:09 · 76 min | [FastAPI: Testing](https://fastapi.tiangolo.com/tutorial/testing/) · FastAPI (docs) | Write API tests against a disposable test database with fixtures in conftest.py. | 90 min |
| Webhooks | [About webhooks](https://docs.github.com/en/webhooks/about-webhooks) · GitHub (docs) | — | Add an endpoint for 'import completed' events that verifies an HMAC signature and is safe to receive twice. | 45 min |
| Retries | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | Wrap the exchange-rate client in retries with exponential backoff and jitter; cap attempts and log each retry. | 40 min |
| Idempotency | [What Is Idempotency? Idempotency Keys, Deduplication & Retries Explained](https://www.youtube.com/watch?v=jfHBrweuKRA) · The Right Trade-off · 3 min | [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · Stripe (docs) | Accept an Idempotency-Key on imports so a repeated POST returns the original result. | 60 min |
| Error handling | [FastAPI: Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/) · FastAPI (docs) | — | Map domain exceptions to 400/404/409 with consistent error bodies via exception handlers. | 40 min |

### LLM engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| LLM architecture and fundamentals | [[1hr Talk] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) · Andrej Karpathy · 0:00–21:05 · 21 min | [Transformers, the tech behind LLMs / Deep Learning Chapter 5](https://www.youtube.com/watch?v=wjZofJX0v4M) · 3Blue1Brown · 27 min | Explain pre-training, fine-tuning and inference on one page, in plain words, for a finance colleague. | 60 min |
| Tokens and context windows | [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI&t=467s) · Andrej Karpathy · 7:47–14:27 · 7 min | [Claude: Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) · Anthropic (docs) | Count the tokens of a month-end variance prompt with the provider's counting API; estimate cost on two model sizes. | 30 min |
| Model selection | [Claude: Models overview](https://platform.claude.com/docs/en/models/overview) · Anthropic (docs) | [Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi](https://www.youtube.com/watch?v=2ld7cR9y0Po) · Optimized AI Conference · 20 min | Run the same variance task on a small and a large model; table quality, latency and cost. | 45 min |
| Temperature and sampling | [Transformers, the tech behind LLMs / Deep Learning Chapter 5](https://www.youtube.com/watch?v=wjZofJX0v4M&t=1342s) · 3Blue1Brown · 22:22–26:03 · 4 min | [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI&t=1561s) · Andrej Karpathy · 26:01–31:09 · 5 min | Run a classification prompt ten times at temperature 0 and 1; measure how often the label changes. | 30 min |
| Context limitations | [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI&t=4832s) · Andrej Karpathy · 1:20:32–1:46:56 · 26 min | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | Give the model a policy too long to fit; show what goes wrong, then fix it by selecting only relevant sections. | 45 min |
| Model cost and latency | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=443s) · AI Jason · 7:23–19:26 · 12 min | — | Log tokens in/out, latency and cost per call; produce a cost summary per endpoint. | 45 min |
| OpenAI APIs | [Python + AI: Function calling & structured outputs](https://www.youtube.com/watch?v=4rFVLMBwjGY) · Microsoft Reactor · 63 min | [OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling) · OpenAI (docs) | Call the OpenAI API with the official Python SDK and return a typed result. | 45 min |
| Anthropic APIs | [Claude API: Messages](https://platform.claude.com/docs/en/api/messages) · Anthropic (docs) | — | Call the Claude Messages API with the official SDK; handle a stop_reason of max_tokens. | 45 min |
| API authentication | [Claude API: Messages](https://platform.claude.com/docs/en/api/messages) · Anthropic (docs) | [The Twelve-Factor App: Config](https://12factor.net/config) · Adam Wiggins (docs) | Load provider keys from the environment only; prove no key appears in logs, errors or the repository. | 20 min |
| Streaming | [Claude: Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming) · Anthropic (docs) | — | Stream a long explanation token by token; handle a dropped connection mid-stream. | 40 min |
| Structured outputs | [Pydantic is all you need: Jason Liu](https://www.youtube.com/watch?v=yj-wSRJwrrc) · AI Engineer · 18 min | [Claude: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · Anthropic (docs) | Return variance explanations as a Pydantic model; retry on validation failure. | 60 min |
| JSON schemas | [OpenAI: Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) · OpenAI (docs) | [Pydantic is all you need: Jason Liu](https://www.youtube.com/watch?v=yj-wSRJwrrc) · AI Engineer · 18 min | Generate a JSON Schema from the Pydantic model and use it as the response schema. | 30 min |
| Function calling | [Python + AI: Function calling & structured outputs](https://www.youtube.com/watch?v=4rFVLMBwjGY) · Microsoft Reactor · 63 min | [OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling) · OpenAI (docs) | Define get_account_balance for the model to call; execute it and return the result. | 45 min |
| Tool calling | [Claude: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · Anthropic (docs) | — | Implement the full Claude tool-use loop: tool_use → run tool → tool_result → final answer. | 60 min |
| Provider abstraction | [Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi](https://www.youtube.com/watch?v=2ld7cR9y0Po) · Optimized AI Conference · 20 min | — | Write an LLMClient protocol with OpenAI and Anthropic implementations, chosen by configuration. | 60 min |
| Model error handling | [Claude API: Errors](https://platform.claude.com/docs/en/api/errors) · Anthropic (docs) | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | Handle 429, 500 and overloaded errors distinctly; retry only the retryable ones. | 40 min |
| Rate limits | [Claude API: Rate limits](https://platform.claude.com/docs/en/api/rate-limits) · Anthropic (docs) | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | Read rate-limit headers and throttle concurrency during a batch run. | 40 min |

### Prompt and context engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| System instructions | [Prompting 101 / Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) · Anthropic · 25 min | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Write the variance analyst's system prompt: role, audience, tone and what it must never do. | 30 min |
| Prompt structure | [Prompting 101 / Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) · Anthropic · 25 min | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | Restructure the prompt into tagged sections: context, data, instructions, output format. | 30 min |
| Few-shot prompting | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | [Prompting 101 / Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) · Anthropic · 25 min | Add three anonymised real examples; measure accuracy with and without them on 20 cases. | 45 min |
| Context construction | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | — | Build context from the ledger, the prior month and the policy excerpt; drop what the task does not need. | 45 min |
| Output constraints | [Claude: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · Anthropic (docs) | [Pydantic is all you need: Jason Liu](https://www.youtube.com/watch?v=yj-wSRJwrrc) · AI Engineer · 18 min | Constrain output to a schema with an explicit 'insufficient data' option instead of guessing. | 30 min |
| Grounding | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | — | Require every figure to cite a row id from the provided data; reject answers with uncited numbers. | 45 min |
| Prompt testing | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE&t=925s) · Hamel Husain · 15:25–23:41 · 8 min | [Claude: Define success and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) · Anthropic (docs) | Create 20 pass/fail-labelled cases and run them on every prompt change. | 60 min |
| Prompt injection fundamentals | [Prompt Injection, explained](https://www.youtube.com/watch?v=FgxwCaL6UTA) · Simon Willison · 12 min | [[1hr Talk] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g&t=3090s) · Andrej Karpathy · 51:30–56:23 · 5 min | Plant an instruction in a transaction memo field; demonstrate the attack, then mitigate it. | 45 min |

## Phase 3 — RAG and Enterprise Knowledge Systems (months 5–6)

**Exit gate:** Demonstrate retrieval quality, source grounding, access-aware search and measurable answer quality.

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
| Grounded generation | [Claude: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) · Anthropic (docs) | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | Answer only from context and say 'not in the documents' otherwise; test with an unanswerable question. | 45 min |
| Source citations | [Learn RAG From Scratch – Python AI Tutorial from a LangChain Engineer](https://www.youtube.com/watch?v=sVcwVQRHIc8) · freeCodeCamp.org · 153 min | — | Return chunk ids for each sentence and render them as numbered citations. | 60 min |
| Document references | [How to Get Your Data Ready for AI Agents (Docs, PDFs, Websites)](https://www.youtube.com/watch?v=9lBTS5dM27c&t=1191s) · Dave Ebbelaar · 19:51–25:00 · 5 min | — | Show title, section and page for each citation and open the exact page from the answer. | 30 min |
| Access-aware retrieval | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=763s) · Google for Developers · 12:43–16:13 · 4 min | [Azure RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview) · Microsoft (docs) | Filter by the caller's entitlements before ranking; prove a restricted policy never leaks. | 60 min |
| Retrieval quality | [AI Agent Evaluation with RAGAS](https://www.youtube.com/watch?v=-_52DIIOsCE&t=556s) · James Briggs · 9:16–15:52 · 7 min | — | Compute context recall and context precision on the 30-question set. | 45 min |
| RAG evaluation | [AI Agent Evaluation with RAGAS](https://www.youtube.com/watch?v=-_52DIIOsCE) · James Briggs · 20 min | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE) · Hamel Husain · 28 min | Add faithfulness and answer relevancy, with a pass threshold for each. | 60 min |
| Failure analysis | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=360s) · Hamel Husain · 6:00–19:31 · 14 min | — | Tag 20 wrong answers as retrieval, context, generation or data failures; fix the largest category. | 90 min |

## Phase 4 — Agentic AI, LangGraph and MCP (months 7–9)

**Exit gate:** Demonstrate a stateful, observable agent workflow with controlled tools, persistence and human approval.

### Agent engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Workflows versus agents | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ&t=400s) · Anthropic · 6:40–9:30 · 3 min | — | Classify each investigation step as fixed workflow or agent decision, with a reason for each. | 30 min |
| Agent loops | [Andrew Ng Explores The Rise Of AI Agents And Agentic Reasoning / BUILD 2024 Keynote](https://www.youtube.com/watch?v=KrRD7r7y7NY) · Snowflake Inc. · 27 min | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ) · Anthropic · 19 min | Write a minimal agent loop (model → tool → observe) without a framework, with a step limit. | 60 min |
| Planning and execution | [Andrew Ng Explores The Rise Of AI Agents And Agentic Reasoning / BUILD 2024 Keynote](https://www.youtube.com/watch?v=KrRD7r7y7NY) · Snowflake Inc. · 27 min | — | Have the agent plan first, then execute, re-planning when a tool fails. | 60 min |
| Tool selection | [Claude: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · Anthropic (docs) | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=339s) · Aishwarya Srinivasan · 5:39–7:37 · 2 min | Write tool descriptions precise enough that the right tool is chosen in 9 of 10 test prompts. | 45 min |
| Tool calling | [Claude: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · Anthropic (docs) | — | Add three ledger tools with strict input schemas; log every call with inputs and outputs. | 45 min |
| State management | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=457s) · Aishwarya Srinivasan · 7:37–9:57 · 2 min | — | Define investigation state as a typed object; make every step a pure state transition. | 45 min |
| Context management | [Context Engineering for Agents](https://www.youtube.com/watch?v=4GiqzUHD5AA) · LangChain · 22 min | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ&t=855s) · Anthropic · 14:15–15:00 · 1 min | Summarise and trim tool outputs so a 20-step run stays within budget. | 45 min |
| Memory | [Agent Memory EXPLAINED - Complete Architecture](https://www.youtube.com/watch?v=aYfZN8t6AQs) · Hugging Face · 29 min | — | Store resolved exceptions as long-term memory and retrieve similar past cases. | 60 min |
| Human-in-the-loop | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s) · Dave Ebbelaar · 25 min | — | Pause before every write action and require approve/reject with a reason. | 45 min |
| Workflow orchestration | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=597s) · Aishwarya Srinivasan · 9:57–12:23 · 2 min | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo) · Concept && Coding - by Shrayansh · 30 min | Orchestrate gather → analyse → recommend with explicit transitions and timeouts. | 45 min |
| Failure recovery | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1023s) · Aishwarya Srinivasan · 17:03–18:42 · 2 min | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | Simulate a tool timeout mid-run; resume from the last good state without repeating side effects. | 60 min |

### LangGraph

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Nodes and edges | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | — | Build a three-node graph (gather, analyse, recommend) with explicit edges. | 45 min |
| Graph state | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | — | Define a TypedDict state with reducers for accumulated evidence. | 45 min |
| Conditional routing | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | — | Route to 'escalate' above a variance threshold, otherwise to 'auto-resolve'. | 30 min |
| Checkpointing | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | Add a checkpointer; stop the process mid-run and resume from the checkpoint. | 45 min |
| Persistence | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | — | Use a PostgreSQL-backed checkpointer so runs survive restarts. | 60 min |
| Interrupts | [LangGraph: Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) · LangChain (docs) | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s) · Dave Ebbelaar · 25 min | Interrupt before 'post adjustment' and resume with the reviewer's decision. | 45 min |
| Human approval | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s&t=470s) · Dave Ebbelaar · 7:50–10:15 · 2 min | [LangGraph: Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) · LangChain (docs) | Build an approval endpoint that resumes the graph with approve or reject. | 45 min |
| Long-running workflows | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s&t=1154s) · Dave Ebbelaar · 19:14–22:59 · 4 min | — | Run the graph as a background job; expose its status and current node through the API. | 60 min |
| Recovery and resumability | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | Kill the worker during a tool call; prove the run resumes without duplicating the call. | 60 min |
| Agent testing | [Agentic Evaluations at Scale, For Everybody — Nicholas Kang & Michael Aaron, Google DeepMind](https://www.youtube.com/watch?v=Ubwb6NzegyA) · AI Engineer · 20 min | [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) · LangChain (docs) | Test the graph with stubbed tools: assert the path taken in three scenarios. | 60 min |

### MCP

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| MCP architecture | [Building with MCP and the Claude API](https://www.youtube.com/watch?v=aZLr962R6Ag&t=30s) · Anthropic · 0:30–5:00 · 5 min | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | Diagram host, client and server for LedgerSync with Claude Desktop, marking trust boundaries. | 30 min |
| Hosts, clients and servers | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | — | Explain in writing which process holds credentials in each role, and why. | 20 min |
| Tools | [Build Anything With a CUSTOM MCP Server - Python Tutorial](https://www.youtube.com/watch?v=-8k9lGpGQ6g&t=249s) · Tech With Tim · 4:09–7:25 · 3 min | [MCP: Build a server](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server) · Model Context Protocol (docs) | Expose get_unmatched_items as an MCP tool with a strict schema. | 45 min |
| Resources | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | — | Expose policy documents as MCP resources with URIs and MIME types. | 30 min |
| Prompts | [MCP: Architecture overview](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) · Model Context Protocol (docs) | — | Publish a 'monthly variance review' prompt template from the server. | 30 min |
| Server development | [Build Anything With a CUSTOM MCP Server - Python Tutorial](https://www.youtube.com/watch?v=-8k9lGpGQ6g) · Tech With Tim · 26 min | [MCP: Build a server](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server) · Model Context Protocol (docs) | Build the LedgerSync MCP server in Python with logging and input validation. | 90 min |
| Client integration | [Build Anything With a CUSTOM MCP Server - Python Tutorial](https://www.youtube.com/watch?v=-8k9lGpGQ6g&t=299s) · Tech With Tim · 4:59–10:28 · 5 min | [Building with MCP and the Claude API](https://www.youtube.com/watch?v=aZLr962R6Ag&t=640s) · Anthropic · 10:40–11:50 · 1 min | Connect the server to Claude Desktop and to your own Python client. | 45 min |
| Authentication and permission boundaries | [MCP specification (2026-07-28): Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) · Model Context Protocol (docs) | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=1085s) · Google for Developers · 18:05–19:22 · 1 min | Separate read and write tools by scope; refuse write calls without the required scope. | 60 min |
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

## Phase 5 — AI Evaluation, Security and Deployment (months 10–12)

**Exit gate:** Demonstrate repeatable evaluation, security controls and a working deployment.

### AI evaluation

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Evaluation fundamentals | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE) · Hamel Husain · 28 min | [Claude: Define success and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) · Anthropic (docs) | Write the variance analyst's success criteria as measurable statements. | 30 min |
| Golden datasets | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE&t=568s) · Hamel Husain · 9:28–15:25 · 6 min | — | Build a golden set of 50 labelled, anonymised cases from real closes. | 120 min |
| Test-case design | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE&t=925s) · Hamel Husain · 15:25–18:57 · 4 min | — | Cover normal, edge, adversarial and 'insufficient data' cases. | 45 min |
| Deterministic evaluation | [Claude: Define success and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) · Anthropic (docs) | — | Add code checks: schema valid, numbers trace to inputs, citations exist. | 45 min |
| LLM-as-judge | [3. Tutorial: How to create an LLM judge and align with human labels](https://www.youtube.com/watch?v=kP_aaFnXLmY) · Evidently AI · 24 min | — | Build a judge for 'correct and specific'; measure its agreement with your own labels. | 90 min |
| RAG evaluation | [AI Agent Evaluation with RAGAS](https://www.youtube.com/watch?v=-_52DIIOsCE) · James Briggs · 20 min | — | Run RAGAS on the policy assistant nightly and store results by commit. | 45 min |
| Agent trajectory evaluation | [Agentic Evaluations at Scale, For Everybody — Nicholas Kang & Michael Aaron, Google DeepMind](https://www.youtube.com/watch?v=Ubwb6NzegyA) · AI Engineer · 20 min | — | Score whether the agent called the right tools in the right order across 15 scenarios. | 60 min |
| Regression testing | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=1171s) · Hamel Husain · 19:31–25:48 · 6 min | — | Fail CI when a prompt or model change drops any metric below its threshold. | 45 min |
| Quality thresholds | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=1548s) · Hamel Husain · 25:48–27:19 · 2 min | [LLM Evals: Common Mistakes](https://www.youtube.com/watch?v=GL0XhAj5LPE) · Hamel Husain · 28 min | Set and document a threshold per metric, with the reasoning for each. | 30 min |
| Evaluation automation | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4) · Hamel Husain · 27 min | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=1278s) · mCoding · 21:18–25:22 · 4 min | Run the eval suite in GitHub Actions on every pull request. | 60 min |

### Observability

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Langfuse | [10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management](https://www.youtube.com/watch?v=2E8iTvGo9Hs) · Langfuse · 10 min | — | Self-host or sign up for Langfuse and send the first trace from LedgerSync. | 45 min |
| Tracing | [Langfuse Intro - Observability & Tracing Deep Dive](https://www.youtube.com/watch?v=pTneXS_m1rk) · Langfuse · 11 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Trace one request end to end (API → retrieval → LLM → tools) as nested spans. | 45 min |
| Prompt versioning | [10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management](https://www.youtube.com/watch?v=2E8iTvGo9Hs&t=325s) · Langfuse · 5:25–7:00 · 2 min | — | Move prompts into Langfuse prompt management; deploy a version, then roll it back. | 30 min |
| Token usage | [10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management](https://www.youtube.com/watch?v=2E8iTvGo9Hs&t=49s) · Langfuse · 0:49–2:33 · 2 min | — | Report tokens in and out per trace and per user. | 20 min |
| Cost tracking | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=1166s) · AI Jason · 19:26–27:20 · 8 min | [10 min Walkthrough of Langfuse – Open Source LLM Observability, Evaluation, and Prompt Management](https://www.youtube.com/watch?v=2E8iTvGo9Hs) · Langfuse · 10 min | Build a weekly cost report by endpoint and model from traces. | 45 min |
| Latency monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | — | Track p50/p95 latency per step and find the slowest span. | 30 min |
| Error analysis | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4&t=360s) · Hamel Husain · 6:00–19:31 · 14 min | — | Tag failed traces by cause and count each category. | 45 min |
| Performance monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Define three service-level indicators and alert when one breaches. | 45 min |

### Security

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| OWASP LLM Top 10 | [OWASP's Top 10 Ways to Attack LLMs: AI Vulnerabilities Exposed](https://www.youtube.com/watch?v=gUNXZMcd2jU) · IBM Technology · 25 min | — | Map each of the ten risks to LedgerSync with its mitigation or accepted risk. | 60 min |
| Direct prompt injection | [Prompt Injection, explained](https://www.youtube.com/watch?v=FgxwCaL6UTA) · Simon Willison · 12 min | [Advanced Guardrails for AI Agents / Full Tutorial](https://www.youtube.com/watch?v=rMUycP_cp9g) · James Briggs · 22 min | Red-team the chat endpoint with ten direct injections; record which succeed. | 45 min |
| Indirect prompt injection | [[1hr Talk] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g&t=3090s) · Andrej Karpathy · 51:30–56:23 · 5 min | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=311s) · Google for Developers · 5:11–10:18 · 5 min | Plant an injection inside a policy PDF; prove the assistant does not follow it. | 45 min |
| Sensitive data exposure | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=176s) · Google for Developers · 2:56–4:10 · 1 min | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=618s) · Google for Developers · 10:18–12:43 · 2 min | Redact account numbers and names before text reaches the model; test with realistic samples. | 45 min |
| Data leakage | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=618s) · Google for Developers · 10:18–12:43 · 2 min | — | Check that logs, traces and prompts contain no secrets or unredacted personal data. | 30 min |
| RBAC | [Azure RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview) · Microsoft (docs) | — | Define viewer, analyst, approver and admin roles; enforce them on every endpoint. | 45 min |
| Least privilege | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=763s) · Google for Developers · 12:43–16:13 · 4 min | — | Give the app, the agent and migrations separate database roles with minimal grants. | 30 min |
| Secrets management | [Azure Key Vault overview](https://learn.microsoft.com/en-us/azure/key-vault/general/overview) · Microsoft (docs) | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=973s) · Google for Developers · 16:13–18:05 · 2 min | Move every secret out of .env into a secret store; rotate one key without downtime. | 45 min |
| Input and output validation | [Advanced Guardrails for AI Agents / Full Tutorial](https://www.youtube.com/watch?v=rMUycP_cp9g) · James Briggs · 22 min | — | Validate inputs (size, type, injection markers) and outputs (schema, personal data) at every boundary. | 45 min |
| Access-controlled retrieval | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=763s) · Google for Developers · 12:43–16:13 · 4 min | — | Enforce document permissions inside the retrieval query, not after generation. | 45 min |
| Audit logging | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1340s) · Aishwarya Srinivasan · 22:20–25:33 · 3 min | — | Log every privileged action with actor and outcome in an append-only log. | 30 min |

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
| Basic recovery procedures | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | — | Back up PostgreSQL, destroy the database, restore it, and time the drill. | 60 min |

## Phase 6 — Advanced Architecture, Integrations and Reliability (months 13–18)

**Exit gate:** Independently explain and troubleshoot the application's components, integrations, failure modes and trade-offs.

### Advanced application architecture

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Modular architecture | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Draw LedgerSync's modules and dependencies; remove one cyclic dependency. | 45 min |
| Service boundaries | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Decide which modules become services and which stay together; write the ADR. | 45 min |
| Separation of concerns | [Visualising software architecture with the C4 model - Simon Brown, Agile on the Beach 2019](https://www.youtube.com/watch?v=x2-rSnhpw0g) · Agile on the Beach · 36 min | — | Separate API, domain and data layers so domain code imports neither FastAPI nor SQLAlchemy. | 60 min |
| API architecture | [FastAPI Tutorial — User Guide](https://fastapi.tiangolo.com/tutorial/) · FastAPI (docs) | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=256s) · Concept && Coding - by Shrayansh · 4:16–8:46 · 5 min | Version the API and document the breaking-change policy. | 45 min |
| Event-driven integration concepts | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo) · Concept && Coding - by Shrayansh · 30 min | — | Publish 'import.completed' events and let a separate consumer start matching. | 60 min |
| Background processing | [Queue-Based Load Leveling pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) · Microsoft (docs) | [How to Build Human-in-the-Loop for AI Agents (Practical Guide)](https://www.youtube.com/watch?v=7GOxUgVTz3s&t=1154s) · Dave Ebbelaar · 19:14–22:59 · 4 min | Move long imports to a queue worker; the API returns 202 with a status URL. | 60 min |
| Asynchronous workflows | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=986s) · Concept && Coding - by Shrayansh · 16:26–20:20 · 4 min | [Python Tutorial: AsyncIO - Complete Guide to Asynchronous Programming with Animations](https://www.youtube.com/watch?v=oAkLSJNr5zY) · Corey Schafer · 103 min | Make agent runs asynchronous and stream status to the client. | 45 min |
| Workflow orchestration | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=597s) · Aishwarya Srinivasan · 9:57–12:23 · 2 min | — | Coordinate import → match → investigate as a durable workflow with per-step retries. | 60 min |
| Data and application integration patterns | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=1220s) · Concept && Coding - by Shrayansh · 20:20–29:34 · 9 min | — | Choose batch file, API pull or event push for each data source; justify in an ADR. | 45 min |

### Enterprise integrations

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Identity providers | [Microsoft Entra Overview - AZ-900 Certification Course - January 2023 New](https://www.youtube.com/watch?v=bSIF_GjaCmo) · John Savill's Technical Training · 12 min | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | Register LedgerSync as an application in an Entra test tenant. | 45 min |
| External APIs | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | Integrate one external API with timeouts, retries and contract tests. | 60 min |
| Webhooks | [About webhooks](https://docs.github.com/en/webhooks/about-webhooks) · GitHub (docs) | — | Consume a webhook from a SaaS sandbox; verify signatures and handle out-of-order delivery. | 45 min |
| Business application integrations | [Event Driven Architecture (EDA) Introduction](https://www.youtube.com/watch?v=QNfIUIZQ9Vo&t=1547s) · Concept && Coding - by Shrayansh · 25:47–29:34 · 4 min | — | Integrate an ERP extract (CSV or API sandbox) as a second ledger source. | 90 min |
| Enterprise data sources | [Database Design & Data Modeling Full Course For Beginners [2026]](https://www.youtube.com/watch?v=_jf7KZqne-8&t=1734s) · Ansh Lamba · 28:54–40:47 · 12 min | — | Connect a read-only warehouse or replica; never write to a system of record. | 45 min |
| Permission-aware tool access | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=824s) · Google for Developers · 13:44–16:13 · 2 min | — | Call downstream APIs on behalf of the user with delegated tokens, not a shared super-key. | 60 min |
| System-to-system communication | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | [Entra: Add app roles to your application](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps) · Microsoft (docs) | Use client credentials with app roles for service-to-service calls; test a missing role. | 45 min |

### Reliability engineering

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Retries and backoff | [Retry Strategies: Exponential Backoff & Jitter Explained](https://www.youtube.com/watch?v=NByH-cau97A) · CodeLucky · 4 min | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | Centralise the retry policy with jitter; prove there is no retry storm under failure. | 30 min |
| Idempotency | [What Is Idempotency? Idempotency Keys, Deduplication & Retries Explained](https://www.youtube.com/watch?v=jfHBrweuKRA) · The Right Trade-off · 3 min | [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · Stripe (docs) | Audit every write path for idempotency and fix the ones that are not. | 45 min |
| Timeouts | [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) · Microsoft (docs) | — | Set connect and read timeouts on every outbound call; test against a hanging dependency. | 30 min |
| Rate limiting | [Rate Limiting pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern) · Microsoft (docs) | — | Rate-limit the public API per user; return 429 with Retry-After. | 45 min |
| Model fallback | [Multi-LLM Routing Strategies for Gen AI - Ethan Ferdosi](https://www.youtube.com/watch?v=2ld7cR9y0Po) · Optimized AI Conference · 20 min | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA&t=591s) · AI Jason · 9:51–10:35 · 1 min | Fall back to a second model on error or timeout; log which model served each request. | 45 min |
| Circuit breakers | [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) · Microsoft (docs) | — | Wrap the LLM provider in a circuit breaker; show it opening and half-opening under failure. | 60 min |
| State recovery | [3 ingredients for building reliable enterprise agents - Harrison Chase, LangChain/LangGraph](https://www.youtube.com/watch?v=kTnfJszFxCg) · AI Engineer · 21 min | [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · LangChain (docs) | Recover every in-flight agent run after a crash using checkpoints. | 45 min |
| Backups and restores | [Azure Database for PostgreSQL flexible server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) · Microsoft (docs) | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | Automate nightly backups; restore to a new instance and verify row counts. | 60 min |
| Incident handling | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | — | Run a game-day: break the LLM provider, follow your incident process, write the review. | 90 min |
| Operational runbooks | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | — | Write runbooks for the top three failure modes, each testable by someone else. | 60 min |

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

## Phase 7 — Enterprise AI Architecture and Production Ownership (months 19–24)

**Exit gate:** Design, defend, deploy and operate a business AI solution, explaining architecture choices, security, cost, reliability and measurable business value.

### Cloud and production

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Azure fundamentals | [Learn Azure in 2026](https://www.youtube.com/watch?v=usvlTo0TDoA) · John Savill's Technical Training · 29 min | — | Create a resource group, a budget alert and a naming convention for LedgerSync. | 45 min |
| Azure Container Apps | [Azure Container Apps (2025 Edition)](https://www.youtube.com/watch?v=LogxM4r2a58) · Agentic Intelligence w/ Michael Levan · 13 min | — | Deploy the API image to Container Apps with ingress and a health probe. | 60 min |
| Managed PostgreSQL | [Azure Database for PostgreSQL flexible server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) · Microsoft (docs) | — | Provision Flexible Server with private networking; run Alembic migrations against it. | 60 min |
| GitHub Actions | [GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker](https://www.youtube.com/watch?v=R8_veQiYBjI) · TechWorld with Nana · 33 min | [GitHub Actions documentation](https://docs.github.com/en/actions) · GitHub (docs) | Build, test and push images to a registry from GitHub Actions. | 45 min |
| CI/CD pipelines | [Automated Testing in Python with pytest, tox, and GitHub Actions](https://www.youtube.com/watch?v=DhUpxWjOhME&t=1278s) · mCoding · 21:18–25:22 · 4 min | [Python API Development - Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA&t=63255s) · freeCodeCamp.org · 17:34:15–18:49:10 · 75 min | Promote the same image from dev to prod behind a manual approval. | 60 min |
| Environment separation | [The Twelve-Factor App: Config](https://12factor.net/config) · Adam Wiggins (docs) | — | Separate dev and prod resources, secrets and databases; prove dev cannot reach prod data. | 45 min |
| Secrets management | [Azure Key Vault overview](https://learn.microsoft.com/en-us/azure/key-vault/general/overview) · Microsoft (docs) | — | Read secrets from Key Vault with a managed identity; no secret in the pipeline or image. | 45 min |
| Deployment strategies | [Azure Container Apps: Blue-green deployment](https://learn.microsoft.com/en-us/azure/container-apps/blue-green-deployment) · Microsoft (docs) | [Azure Container Apps: Revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions) · Microsoft (docs) | Release blue-green with traffic splitting between revisions. | 60 min |
| Rollbacks | [Azure Container Apps: Revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions) · Microsoft (docs) | — | Roll back a bad release on purpose and time it. | 30 min |
| Production monitoring | [LLM Observability: The Breakdown](https://www.youtube.com/watch?v=Q9zd548hqiQ) · The New Stack · 26 min | [How Tracing works with OpenTelemetry](https://www.youtube.com/watch?v=LQOeaxfiAt8) · That DevOps Guy · 20 min | Dashboards and alerts for errors, latency, cost and eval scores in production. | 60 min |

### Enterprise identity and security

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| Microsoft Entra ID | [Microsoft Entra Overview - AZ-900 Certification Course - January 2023 New](https://www.youtube.com/watch?v=bSIF_GjaCmo) · John Savill's Technical Training · 12 min | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs) · Militas Aurelius · 31 min | Set up a test tenant with users and groups that mirror finance roles. | 45 min |
| OAuth2 and OIDC integration | [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) · OktaDev · 62 min | [How OpenID Connect works](https://openid.net/developers/how-connect-works/) · OpenID Foundation (docs) | Replace local login with Entra sign-in using authorisation code + PKCE. | 90 min |
| RBAC | [Entra: Add app roles to your application](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps) · Microsoft (docs) | [Azure RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview) · Microsoft (docs) | Define app roles in Entra and map them to LedgerSync permissions. | 45 min |
| Tenant isolation | [Architect multitenant solutions on Azure](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/overview) · Microsoft (docs) | — | Design how two business units' data stay isolated; choose and justify the model. | 60 min |
| Identity and access management | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs&t=505s) · Militas Aurelius · 8:25–22:53 · 14 min | — | Apply a Conditional Access policy requiring MFA for approvers. | 45 min |
| Data security | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | [Azure Key Vault overview](https://learn.microsoft.com/en-us/azure/key-vault/general/overview) · Microsoft (docs) | Encrypt data at rest and in transit; document who owns each key. | 45 min |
| Auditability | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs&t=1466s) · Militas Aurelius · 24:26–29:45 · 5 min | — | Trace who accessed what and when, from sign-in logs to the app's audit trail. | 45 min |
| Secure integration patterns | [How to secure your AI Agents: A Technical Deep-dive](https://www.youtube.com/watch?v=jZXvqEqJT7o&t=1085s) · Google for Developers · 18:05–22:25 · 4 min | — | Review each integration's auth method, scope and secret handling; fix the weakest. | 45 min |

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
| Scalability | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | [Queue-Based Load Leveling pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) · Microsoft (docs) | Load-test the API to its limit and identify the bottleneck. | 60 min |
| Reliability | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) · Microsoft (docs) | Map each component's failure modes and mitigations. | 45 min |
| Maintainability | [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/) · Microsoft (docs) | — | Measure test coverage, type coverage and dependency freshness; set targets. | 30 min |
| Cost and latency trade-offs | [The REAL cost of LLM (And How to reduce 78%+ of Cost)](https://www.youtube.com/watch?v=lHxl5SchjPA) · AI Jason · 27 min | [Agentic AI System Design Explained in 27 Minutes](https://www.youtube.com/watch?v=mwN75EiGfCE&t=1122s) · Aishwarya Srinivasan · 18:42–20:42 · 2 min | Present three architecture options with estimated cost and latency. | 45 min |
| Technical debt | [#113 - Architecture Decision Record (ADR) - Michael Keeling](https://www.youtube.com/watch?v=-JqraBhrrjI) · Tech Lead Journal · 41 min | — | Keep a debt register with impact and cost; schedule the top item. | 30 min |

### AI governance and operating model

| Subtopic | Primary | If it helps | Exercise | Practice |
|---|---|---|---|---|
| AI governance | [The Five Must-Haves of an AI Governance Framework](https://www.youtube.com/watch?v=NrkJLbn3dDE) · SANS Institute · 29 min | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) · NIST (docs) | Draft LedgerSync's AI governance policy: owners, risk tiers and approvals. | 60 min |
| Data governance | [Data Governance Overview](https://www.youtube.com/watch?v=EI8R5UuZt4U) · Informatica Support · 23 min | — | Classify each data source by sensitivity and owner; record retention rules. | 45 min |
| Responsible AI | [Responsible AI: why businesses need reliable AI governance](https://www.youtube.com/watch?v=MluoD8Z1ARQ) · IBM Technology · 27 min | [Microsoft Responsible AI](https://www.microsoft.com/en-us/ai/responsible-ai) · Microsoft (docs) | Assess the variance analyst's fairness, transparency and accountability risks. | 45 min |
| Privacy and compliance considerations | [Data Governance Overview](https://www.youtube.com/watch?v=EI8R5UuZt4U) · Informatica Support · 23 min | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) · NIST (docs) | Document lawful basis, retention and residency for each use of personal data. | 45 min |
| Model lifecycle management | [Claude: Models overview](https://platform.claude.com/docs/en/models/overview) · Anthropic (docs) | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) · NIST (docs) | Define how a model change is proposed, evaluated, approved and rolled out, and how a deprecated model is replaced. | 45 min |
| Evaluation governance | [How to Automate AI Evals (Correctly)](https://www.youtube.com/watch?v=tqUDjc1HzO4) · Hamel Husain · 27 min | — | Make eval results a required approval artefact for every model or prompt change. | 30 min |
| Access reviews | [Entra ID (Azure AD) -  Deep Dive](https://www.youtube.com/watch?v=cE3IiHGuHvs) · Militas Aurelius · 31 min | [Entra: Add app roles to your application](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps) · Microsoft (docs) | Run a quarterly access review: export assignments, confirm or revoke each. | 30 min |
| Operational ownership | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | — | Write the RACI for running LedgerSync in production. | 30 min |
| Business value measurement | [The Five Must-Haves of an AI Governance Framework](https://www.youtube.com/watch?v=NrkJLbn3dDE) · SANS Institute · 29 min | — | Measure hours saved per close from real usage logs against the baseline. | 60 min |
| Production support | [Site Reliability Engineering: Managing Incidents](https://sre.google/sre-book/managing-incidents/) · Google (docs) | — | Set up the support process: intake, triage, service levels and escalation. | 45 min |

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
