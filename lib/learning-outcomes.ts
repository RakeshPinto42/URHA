/**
 * The learning outcome of each subtopic: what you can do afterwards, written as the end of
 * "You will be able to …". Same order as lib/learning-map.ts; test/learning-map.test.ts
 * fails if a topic's list and its map entries drift apart.
 */
export const LEARNING_OUTCOMES: Record<string, string[]> = {
  "python-foundations": [
    "write a small script from a blank file without looking up basic syntax",
    "choose the right built-in collection for a job and say why",
    "break a script into pure functions that can be tested separately",
    "report every bad row with its reason instead of stopping or hiding the failure",
    "read and write files safely without overwriting earlier output",
    "move typed data in and out of JSON without losing validation",
    "isolate a project's interpreter and prove which one is running",
    "read a traceback from the bottom up and find the failing line",
    "write a short program from a blank file without assistance"
  ],
  "python-engineering": [
    "model real records as classes with their own behaviour",
    "use composition to change behaviour without touching the class that uses it",
    "annotate code so a strict type checker passes",
    "lay out a project as an importable, runnable package",
    "wrap functions with decorators and process huge files in constant memory",
    "manage dependencies with a lockfile that reproduces the environment",
    "run I/O-bound calls concurrently and show the time saved",
    "configure an application from the environment and fail clearly when a value is missing",
    "load typed, validated settings from one place"
  ],
  "software-engineering": [
    "keep a project in Git with a history others can follow",
    "work on branches, resolve conflicts and merge through a pull request",
    "structure a repository so its code and tests are easy to find",
    "find a defect with the debugger instead of print statements",
    "log what happened at the right level so a failure can be diagnosed later",
    "write pytest tests that cover both success and expected failure",
    "share test setup through fixtures",
    "cover many input cases with one parameterised test",
    "test code that calls external services without the network",
    "enforce formatting, linting and types automatically",
    "review generated code critically and prove its defects with tests"
  ],
  "sql-foundations": [
    "answer a business question with a filtered, sorted query",
    "find what is unmatched between two tables, two ways",
    "summarise data by group and flag groups over a threshold",
    "handle missing values on purpose rather than by accident",
    "turn a nested query into a readable chain of CTEs",
    "compute running balances and rankings with window functions",
    "set up PostgreSQL with a least-privilege application user",
    "model a business domain in third normal form",
    "make the database reject invalid data with constraints",
    "keep a multi-step load atomic and prove a failure commits nothing",
    "read a query plan and show what an index changed",
    "call PostgreSQL from Python safely with parameterised queries"
  ],
  "pandas-analysis": [
    "load and clean tabular data with pandas where it is the right tool",
    "select the rows and columns you need from a DataFrame",
    "turn a messy extract into correctly typed data",
    "join tables and reshape them without silently losing rows",
    "group and total data and prove the totals are right",
    "convert dates into fiscal periods",
    "choose between pandas and SQL for a task and defend the choice"
  ],
  "data-pipelines": [
    "explain ETL and ELT and build a first load",
    "load only what has changed since the last run",
    "reject invalid records with a clear reason",
    "write data quality rules that fail loudly",
    "prove loaded data reconciles to source",
    "make a pipeline safe to rerun and easy to diagnose"
  ],
  "finance-data-modelling": [
    "separate facts from dimensions and state a fact's grain",
    "design a star schema for finance data",
    "model and flatten a chart of accounts hierarchy",
    "keep the history of a changing dimension",
    "hold actuals, budgets and forecast versions in one model",
    "report in several currencies across fiscal periods"
  ],
  "databricks-pyspark": [
    "explain when distributed processing is worth using",
    "work in a Databricks workspace and notebook",
    "transform data with PySpark DataFrames",
    "use Delta tables, including time travel",
    "structure a pipeline into bronze, silver and gold layers",
    "schedule a job and handle its failure"
  ],
  "power-bi": [
    "build repeatable transformations in Power Query",
    "build a semantic model with correct relationships",
    "write DAX measures for variance reporting",
    "compare periods with time intelligence",
    "design a report a finance leader can read quickly",
    "restrict report data by user role"
  ],
  "fpa-analytics": [
    "automate variance analysis in Python",
    "explain a change through price, volume and mix",
    "choose and apply a simple forecasting method",
    "measure forecast accuracy and know its limits",
    "calculate profitability by customer",
    "identify what is driving margin movement"
  ],
  "llm-engineering": [
    "explain how an LLM is trained and used in plain language",
    "estimate a prompt's tokens and cost before sending it",
    "choose a model from measured quality, latency and cost",
    "use temperature deliberately and measure its effect on consistency",
    "work within a context window by selecting what matters",
    "track the cost and latency of every call",
    "call the OpenAI API from Python and return typed results",
    "keep provider keys out of code, logs and errors",
    "stream responses and recover from a dropped connection",
    "get validated structured data from a model, retrying on failure",
    "use a JSON Schema as the contract for a model's response",
    "let a model request a function and return the result to it",
    "run a complete tool-use loop to a final answer",
    "swap model providers through configuration alone",
    "handle each class of provider error differently",
    "stay inside rate limits during batch work",
    "call a model through Azure OpenAI"
  ],
  "prompt-engineering": [
    "write a system prompt that sets role, audience and limits",
    "structure a prompt so context, data and instructions stay separate",
    "use examples and measure whether they actually help",
    "assemble only the context a task needs",
    "constrain output and give the model a way to say it does not know",
    "require every claim to trace back to provided data",
    "test prompt changes against a labelled case set",
    "demonstrate a prompt injection and mitigate it"
  ],
  "api-essentials": [
    "read any HTTP exchange and explain its status codes and headers",
    "design resource-oriented URLs and methods for a real domain",
    "build working endpoints with FastAPI",
    "validate data at the boundary with Pydantic models",
    "control exactly what an API accepts and returns",
    "organise a growing API into routers",
    "turn domain failures into consistent API error responses",
    "test an API against a disposable database"
  ],
  "knowledge-ingestion": [
    "extract text and tables from PDFs and judge which extractor to use",
    "convert mixed documents into one structured format",
    "clean extracted text with tested rules",
    "attach the metadata that citations and access control depend on",
    "build an ingestion pipeline that is safe to run again",
    "ingest spreadsheets as typed records"
  ],
  "retrieval-engineering": [
    "explain what embeddings capture by inspecting real neighbours",
    "reason about similarity scores between terms",
    "implement top-k similarity search by hand and in pgvector",
    "choose a chunking strategy from measured recall",
    "guarantee out-of-scope documents are filtered before ranking",
    "run an indexed vector search in PostgreSQL at a realistic size",
    "serve semantic search with scores and sources",
    "combine keyword and vector search and measure the gain",
    "decide whether reranking earns its place from measured precision"
  ],
  "rag-architecture": [
    "build retrieval as separate, testable stages",
    "fit the most useful context within a token budget",
    "generate answers only from context and admit when it is missing",
    "cite the exact source of each sentence",
    "take a reader from an answer to the exact page behind it",
    "prove a restricted document can never reach an unauthorised user",
    "measure retrieval with context recall and precision",
    "evaluate answers for faithfulness and relevancy against thresholds",
    "classify RAG failures and fix the largest cause first"
  ],
  "agent-engineering": [
    "decide when a fixed workflow beats an agent, with reasons",
    "write an agent loop without a framework, with a hard step limit",
    "separate planning from execution and re-plan on failure",
    "write tool descriptions a model reliably chooses from",
    "define tools with strict inputs and log every call",
    "model an agent's work as typed state transitions",
    "keep long runs within a context budget",
    "reuse past resolutions through long-term memory",
    "put a person in front of every write action",
    "orchestrate multi-step work with explicit transitions and timeouts",
    "resume a failed run without repeating side effects"
  ],
  "langgraph": [
    "build a graph from explicit nodes and edges",
    "define graph state and how it accumulates",
    "route a run conditionally on its state",
    "stop a run and resume it from a checkpoint",
    "make runs survive restarts with durable storage",
    "pause a graph for a decision and resume with it",
    "expose human approval through an API",
    "run a graph in the background and report its progress",
    "prove a killed run resumes without duplicating a call",
    "test a graph's path with stubbed tools"
  ],
  "mcp": [
    "explain MCP's architecture and mark its trust boundaries",
    "say which process holds credentials in each role, and why",
    "expose a capability as a strictly typed MCP tool",
    "publish documents as MCP resources",
    "publish reusable prompt templates from a server",
    "build a validated, logged MCP server in Python",
    "connect a server to a desktop host and to your own client",
    "separate read and write access and refuse out-of-scope calls",
    "let an agent use MCP tools in place of in-process functions"
  ],
  "reliable-agents": [
    "limit each agent role to the tools it may use",
    "gate high-value actions behind recorded approval",
    "reject invalid tool arguments before anything runs",
    "make write tools safe to call twice",
    "retry tool failures without duplicating effects",
    "keep an append-only record of what an agent did",
    "run tools with least privilege and prove what they cannot do",
    "define and test retry, escalate or stop for each failure class"
  ],
  "observability": [
    "follow one request through every step of an AI system",
    "version prompts and roll one back",
    "report token use per request and per user",
    "show what each endpoint and model costs",
    "find the slowest step from latency percentiles",
    "group failures by cause and count them",
    "define service levels and alert on a breach",
    "trace LLM calls in LangSmith"
  ],
  "ai-evaluation": [
    "turn a vague goal into measurable success criteria",
    "build a labelled golden dataset from real cases",
    "design cases that cover normal, edge and adversarial input",
    "catch failures with deterministic checks before using a model",
    "build an LLM judge and measure how far to trust it",
    "evaluate a RAG system on a schedule and track results by commit",
    "score whether an agent took the right steps, not just the final answer",
    "stop a release when a metric drops",
    "set and defend a threshold for each metric",
    "run evaluations automatically on every change"
  ],
  "advanced-rag-agents": [
    "tune retrieval settings against an evaluation set",
    "tune how keyword and vector results combine",
    "decide from cost, latency and quality whether a reranker stays",
    "improve recall with query rewriting and measure it",
    "evaluate agents across failure paths as well as success",
    "remove agent steps that evaluations show add nothing",
    "design approvals a reviewer can decide quickly and well",
    "catch tool schema drift with contract tests",
    "lower cost per run without lowering evaluation scores"
  ],
  "backend-engineering": [
    "inject sessions and users so they can be replaced in tests",
    "persist data with SQLAlchemy models and a session per request",
    "evolve a schema with migrations in both directions",
    "store credentials safely and refuse wrong passwords",
    "implement an OAuth2 flow and say where it does not apply",
    "issue and verify short-lived tokens, including rejecting expired ones",
    "explain the authorisation-code flow with PKCE end to end",
    "receive webhooks that are verified and safe to deliver twice",
    "retry transient failures with backoff, jitter and a limit",
    "make a repeated POST return the original result"
  ],
  "ai-security": [
    "assess an application against the OWASP LLM Top 10",
    "attack your own chat endpoint and record what succeeds",
    "defend against instructions hidden inside retrieved content",
    "redact sensitive data before it reaches a model",
    "audit logs, traces and prompts for leaks",
    "enforce roles on every endpoint",
    "separate database roles so each process has minimal rights",
    "move secrets into a store and rotate one without downtime",
    "validate inputs and outputs at every boundary",
    "enforce document permissions inside the retrieval query",
    "record every privileged action in an append-only log"
  ],
  "enterprise-integrations": [
    "register an application with an enterprise identity provider",
    "integrate an external API with timeouts, retries and contract tests",
    "consume webhooks despite retries and out-of-order delivery",
    "bring data in from a business system such as an ERP",
    "read from enterprise data sources without risking the system of record",
    "call downstream systems as the user rather than with a shared key",
    "authenticate service-to-service calls with scoped credentials"
  ],
  "deployment-foundations": [
    "work confidently in a Linux shell and script routine searches",
    "package an application in a small multi-stage image",
    "run containers without root and keep secrets out of images",
    "run a multi-service stack with configuration per environment",
    "deploy a container to Azure",
    "build and test automatically on every push",
    "block a deploy unless tests and evals pass",
    "expose health checks and centralise logs and traces",
    "restore a destroyed database and know how long it takes"
  ],
  "cloud-production": [
    "set up Azure resources with naming, ownership and budget alerts",
    "deploy a container to Azure Container Apps with health probes",
    "run managed PostgreSQL privately and migrate it",
    "build and publish images from GitHub Actions",
    "promote one image through environments with approval",
    "keep development and production fully separated",
    "read secrets through managed identity with none in the pipeline",
    "release with traffic splitting between versions",
    "roll back a bad release quickly and know how long it takes",
    "monitor errors, latency, cost and quality in production",
    "review a design against Azure's architecture pillars"
  ],
  "infrastructure-as-code": [
    "define Azure resources in Terraform",
    "manage Terraform state safely",
    "reuse infrastructure across environments",
    "define a real application environment in code",
    "review a plan before applying it"
  ],
  "telemetry": [
    "explain how a trace follows a request",
    "choose the right signal to investigate a problem",
    "instrument a FastAPI service",
    "build a dashboard and a useful alert",
    "set a service-level objective and its error budget"
  ],
  "reliability-engineering": [
    "apply one retry policy that cannot cause a retry storm",
    "audit write paths and make them idempotent",
    "bound every outbound call with timeouts",
    "protect an API with per-user rate limits",
    "fall back to another model and record which one answered",
    "stop calling a failing dependency with a circuit breaker",
    "recover in-flight runs after a crash",
    "automate backups and verify a restore",
    "run an incident from detection to written review",
    "write runbooks someone else can follow"
  ],
  "architecture-foundations": [
    "draw out what a stakeholder actually needs",
    "write testable functional and non-functional requirements",
    "map stakeholders and constraints",
    "reason about trade-offs between qualities"
  ],
  "enterprise-architecture": [
    "explain a system's design on one page",
    "communicate architecture with C4 diagrams",
    "record decisions so others can understand them later",
    "split a container into components with clear responsibilities",
    "map how data moves, including where personal data travels",
    "define API boundaries and enforce them automatically",
    "make and record a build-versus-buy decision",
    "find a system's bottleneck under load",
    "map failure modes and mitigations for each component",
    "measure maintainability and set targets",
    "present architecture options with cost and latency trade-offs",
    "track technical debt and schedule paying it down"
  ],
  "advanced-architecture": [
    "map a system's modules and remove a cyclic dependency",
    "decide where service boundaries belong and record why",
    "keep domain code free of framework and database imports",
    "version an API and manage breaking changes",
    "decouple steps with published events",
    "move long work to a worker and report progress",
    "run agent work asynchronously and stream its status",
    "coordinate multi-step work as a durable workflow",
    "choose an integration pattern for each data source and justify it"
  ],
  "data-architecture": [
    "assign clear ownership of data domains",
    "separate operational and analytical data",
    "trace a number back to its source",
    "define a data contract between teams",
    "decide where finance master data lives"
  ],
  "network-fundamentals": [
    "explain how a request reaches a service securely",
    "design a simple Azure network",
    "reach a service without public exposure",
    "choose the right network controls"
  ],
  "enterprise-identity": [
    "configure Entra ID users and groups for business roles",
    "add enterprise sign-in with authorisation code and PKCE",
    "map identity-provider roles to application permissions",
    "choose and defend a tenant isolation model",
    "apply Conditional Access to sensitive roles",
    "encrypt data at rest and in transit and name who owns each key",
    "trace who accessed what, from sign-in to application action",
    "review an integration's security and fix its weakest point"
  ],
  "resilience-scale": [
    "write a disaster recovery plan",
    "set and test recovery objectives",
    "identify what limits a system's scale",
    "run and interpret a load test"
  ],
  "ai-governance": [
    "write an AI governance policy with owners and risk tiers",
    "classify data by sensitivity, owner and retention",
    "assess fairness, transparency and accountability risks",
    "document the lawful basis for each use of personal data",
    "manage a model's change and retirement through a defined process",
    "make evaluation results a required approval artefact",
    "run an access review and act on it",
    "define who is responsible for running a system in production",
    "measure business value from real usage against a baseline",
    "set up support with intake, triage and escalation"
  ],
  "finops-value": [
    "apply FinOps practices to a real bill",
    "calculate total cost of ownership",
    "build an honest ROI case",
    "allocate cloud cost to departments"
  ]
};
