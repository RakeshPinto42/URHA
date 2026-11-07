/**
 * Stage 1 blueprint: the six-phase learning sequence required by docs/PRD.md §4.
 *
 * TRANSITIONAL. The app does not read this file. Stage 3 folds it into lib/curriculum.ts
 * and deletes it, so there is never a second live curriculum (PRD §13). Until then it is
 * checked against the current curriculum by test/blueprint.test.ts, which proves that
 * every existing subtopic is carried or knowingly dropped.
 *
 * Plain data and pure functions with no imports, so scripts can run it directly.
 */

/* ------------------------------------------------------------------ the learner */

/** PRD §2 and §9. Stage 3 stores this as the career profile. */
export const CAREER_PROFILE = {
  destination: "Enterprise AI Solutions Architect",
  background: "About 8 years of FP&A and Commercial Finance; MBA in Finance; SAP ECC, JDE; Excel/VBA automation.",
  startingLevel: "Basic Python, SQL, Power BI and Power Query; familiar with Pandas; exposure to APIs, LLMs, LangChain, LangGraph and Streamlit.",
  weeklyHours: { min: 8, max: 10 },
  weekdayHours: [1, 1.5],
  weekendHours: [2, 3],
} as const;

/** PRD §3. Reached with evidence, never a job qualification or guarantee. */
export const CAREER_MILESTONES = [
  { id: "m1", ord: 1, title: "Finance Data & AI Solutions Engineer", afterPhase: "p3", proof: ["P1", "P2", "P3"],
    summary: "Build finance data pipelines, analytics solutions, AI applications and automation systems." },
  { id: "m2", ord: 2, title: "Finance AI Solutions Architect", afterPhase: "p5", proof: ["P3", "P4"],
    summary: "Design and own end-to-end AI solutions for finance, including data architecture, AI applications, integrations, security and deployment." },
  { id: "m3", ord: 3, title: "Enterprise AI Solutions Architect", afterPhase: "p6", proof: ["P5"],
    summary: "Extend architecture capabilities across enterprise functions, platforms, governance, security, infrastructure and operations." },
] as const;

/* ------------------------------------------------------------------ shape */

export type ProjectId = "P1" | "P2" | "P3" | "P4" | "P5";

/** Subtopics a topic takes from the current curriculum, by its current topic id. */
export type Carry = { from: string; take: "all" | string[] };

export type BlueprintTopic = {
  id: string; // an existing id wherever the topic survives, so its progress and assessment follow it
  title: string;
  why: string; // PRD §1, "why is this skill important?"
  finance: string; // PRD §1, "how can I apply this to finance?"
  prerequisites: string[];
  skills: string[];
  carries: Carry[];
  adds: string[]; // new subtopics, written fresh in this blueprint
  project?: ProjectId;
};

export type BlueprintModule = { id: string; title: string; topics: BlueprintTopic[] };

/** What the PRD says must run through every phase, not wait for the last one (§4, §11). */
export type Threads = { security: string; testing: string; git: string; documentation: string; architecture: string };

export type BlueprintPhase = {
  id: string; ord: number; title: string; months: [number, number];
  outcome: string; exitGate: string; projects: ProjectId[]; threads: Threads; modules: BlueprintModule[];
};

/* ------------------------------------------------------------------ the sequence */

export const BLUEPRINT: BlueprintPhase[] = [
  {
    id: "p1", ord: 1, title: "Programming, SQL and databases", months: [1, 3],
    outcome: "Write, test and debug real Python against a real PostgreSQL database, without leaning on an AI assistant to explain it.",
    exitGate: "Independently understand, modify, debug and test a small application you wrote.",
    projects: [],
    threads: {
      security: "Secrets in environment variables, never in code; parameterised queries.",
      testing: "pytest from the first validator onward.",
      git: "Every exercise lives in a repository with feature branches.",
      documentation: "A README that lets someone else run your project.",
      architecture: "Why separate parsing, validation and storage.",
    },
    modules: [
      { id: "programming", title: "Programming", topics: [
        { id: "python-foundations", title: "Python foundations", skills: ["python"], prerequisites: [],
          why: "Everything later is built in Python, and you need to read and fix it yourself, not only prompt for it.",
          finance: "Replace a VBA macro: read a GL extract, total by account and write a report.",
          carries: [{ from: "python-engineering", take: ["Python fundamentals where gaps exist", "Data structures and collections", "Functions and modular programming", "Exception handling", "File handling", "JSON processing", "Virtual environments"] }],
          adds: ["Reading error messages and tracebacks", "Writing code without an AI assistant"] },
        { id: "python-engineering", title: "Python engineering", skills: ["python"], prerequisites: ["python-foundations"],
          why: "Moves you from scripts that work once to software that others can trust and change.",
          finance: "Model ledger and budget lines as typed classes that validate themselves.",
          carries: [{ from: "python-engineering", take: ["Object-oriented programming", "Classes, inheritance and composition", "Type hints", "Modules and packages", "Decorators and generators concepts", "Dependency management", "Async programming fundamentals", "Environment variables", "Application configuration"] }],
          adds: [] },
      ] },
      { id: "engineering-habits", title: "Engineering habits", topics: [
        { id: "software-engineering", title: "Software engineering", skills: ["python"], prerequisites: ["python-foundations"],
          why: "Version control, tests and debugging are what separate an engineer from someone generating code.",
          finance: "Test a variance calculation against a hand-checked month, so a change cannot silently alter a reported number.",
          carries: [{ from: "software-engineering", take: "all" }], adds: [] },
      ] },
      { id: "databases", title: "Databases", topics: [
        { id: "sql-foundations", title: "SQL and database foundations", skills: ["sql"], prerequisites: ["python-foundations"],
          why: "Finance data lives in relational systems, and every later phase queries it.",
          finance: "Find unmatched transactions with an anti-join and build running balances with window functions.",
          carries: [{ from: "sql-foundations", take: ["SQL fundamentals and advanced querying", "Joins and anti-joins", "Aggregations", "CASE and NULL handling", "CTEs and subqueries", "Window functions", "PostgreSQL", "Relational data modelling", "Keys and constraints", "Transactions", "Indexing fundamentals", "Database connectivity"] }],
          adds: [] },
      ] },
    ],
  },
  {
    id: "p2", ord: 2, title: "Data engineering and finance analytics", months: [4, 7],
    outcome: "Take raw GL, budget and forecast data to a validated model and a working FP&A report.",
    exitGate: "Run a reproducible pipeline from raw extracts to a Power BI report, and prove its totals reconcile to source.",
    projects: ["P1", "P2"],
    threads: {
      security: "Synthetic or anonymised data only; row-level security in Power BI.",
      testing: "Data validation rules and reconciliation checks that fail loudly.",
      git: "Pipelines and notebooks under version control.",
      documentation: "A data dictionary and a lineage note for every model.",
      architecture: "Choosing PostgreSQL or Databricks for a workload, and saying why.",
    },
    modules: [
      { id: "data-wrangling", title: "Data wrangling", topics: [
        { id: "pandas-analysis", title: "Pandas for finance data", skills: ["python", "data"], prerequisites: ["python-engineering", "sql-foundations"],
          why: "The everyday tool for cleaning and shaping data before it reaches a model or a database.",
          finance: "Reshape a messy trial balance and join it to a chart of accounts.",
          carries: [{ from: "sql-foundations", take: ["Selective pandas for loading and checking data"] }],
          adds: ["DataFrames and indexing", "Cleaning and type conversion", "Merging and reshaping", "Grouping and aggregation", "Dates and period handling", "Pandas or SQL: choosing the right tool"] },
        { id: "data-pipelines", title: "Data ingestion and validation", skills: ["data"], prerequisites: ["pandas-analysis", "software-engineering"],
          why: "An AI system is only as trustworthy as the data pipeline underneath it.",
          finance: "Load GL actuals, budgets and forecasts, rejecting rows that break accounting rules.",
          carries: [], project: "P1",
          adds: ["Extract, load and transform", "Incremental loads", "Schema validation", "Data quality rules", "Reconciliation checks", "Pipeline logging and reruns"] },
      ] },
      { id: "finance-data-platform", title: "Finance data platform", topics: [
        { id: "finance-data-modelling", title: "Finance data modelling", skills: ["data", "sql"], prerequisites: ["data-pipelines"],
          why: "Good models make every report and AI answer simpler and more correct.",
          finance: "Design facts and dimensions for GL, budget, forecast, entity, cost centre and period.",
          carries: [], project: "P1",
          adds: ["Facts and dimensions", "Star schemas", "Chart of accounts hierarchies", "Slowly changing dimensions", "Actuals, budget and forecast versions", "Currency and period conventions"] },
        { id: "databricks-pyspark", title: "Databricks and PySpark", skills: ["data"], prerequisites: ["finance-data-modelling"],
          why: "Enterprises run data at a scale a laptop and pandas cannot, and this is the primary platform in your stack.",
          finance: "Rebuild the GL pipeline as bronze, silver and gold tables.",
          carries: [],
          adds: ["Distributed processing concepts", "Databricks workspace and notebooks", "PySpark DataFrames", "Delta tables", "Medallion architecture", "Jobs and scheduling"] },
      ] },
      { id: "finance-analytics", title: "Finance analytics", topics: [
        { id: "power-bi", title: "Power BI", skills: ["analytics"], prerequisites: ["finance-data-modelling"],
          why: "It is how finance leaders actually see your work, and the model behind it is real engineering.",
          finance: "Build an actual-versus-budget report on your own semantic model.",
          carries: [], project: "P2",
          adds: ["Power Query transformations", "Semantic models and relationships", "DAX measures", "Time intelligence", "Report design for finance", "Row-level security"] },
        { id: "fpa-analytics", title: "FP&A and commercial analytics", skills: ["analytics", "python"], prerequisites: ["power-bi"],
          why: "This is where your finance judgement becomes a differentiator nobody else can copy.",
          finance: "Explain margin movement through price, volume and mix.",
          carries: [], project: "P2",
          adds: ["Variance analysis in code", "Price, volume and mix", "Forecasting methods", "Forecast accuracy", "Customer profitability", "Margin analytics"] },
      ] },
    ],
  },
  {
    id: "p3", ord: 3, title: "Applied AI and RAG", months: [8, 11],
    outcome: "Build a finance knowledge assistant that answers from approved documents with citations you can check.",
    exitGate: "Demonstrate retrieval quality, source grounding, access-aware search and measured answer quality.",
    projects: ["P3"],
    threads: {
      security: "Prompt injection basics and access-aware retrieval.",
      testing: "Prompt test sets and retrieval evaluation.",
      git: "Prompts are versioned like code.",
      documentation: "Record what each model call costs and why it was chosen.",
      architecture: "When RAG is the right answer, and when it is not.",
    },
    modules: [
      { id: "llm-foundations", title: "LLM foundations", topics: [
        { id: "llm-engineering", title: "LLM engineering", skills: ["llm", "structured"], prerequisites: ["python-engineering", "data-pipelines"],
          why: "You need to call models deliberately, knowing what they cost and how they fail.",
          finance: "Generate a variance commentary as schema-validated output with its cost logged.",
          carries: [{ from: "llm-engineering", take: ["LLM architecture and fundamentals", "Tokens and context windows", "Model selection", "Temperature and sampling", "Context limitations", "Model cost and latency", "OpenAI APIs", "API authentication", "Streaming", "Structured outputs", "JSON schemas", "Function calling", "Tool calling", "Provider abstraction", "Model error handling", "Rate limits"] }],
          adds: ["Azure OpenAI"] },
        { id: "prompt-engineering", title: "Prompt and context engineering", skills: ["prompt"], prerequisites: ["llm-engineering"],
          why: "Reliable output comes from the context you construct, not from clever wording.",
          finance: "Write a tested prompt for variance analysis using real close scenarios.",
          carries: [{ from: "prompt-engineering", take: "all" }], adds: [] },
      ] },
      { id: "api-essentials-module", title: "Serving AI", topics: [
        // Taught here, not in phase 5, because P3 and P4 need a real service. The PRD's phase order is kept: phase 5 adds production depth.
        { id: "api-essentials", title: "API essentials", skills: ["apis"], prerequisites: ["python-engineering", "sql-foundations"],
          why: "P3 needs an access-controlled service and P4 needs tools, so the basics cannot wait for phase 5.",
          finance: "Expose variance results through a validated FastAPI endpoint.",
          carries: [{ from: "backend-engineering", take: ["HTTP fundamentals", "REST architecture", "FastAPI", "Pydantic", "Request and response validation", "API routing", "Error handling", "API testing"] }],
          adds: [] },
      ] },
      { id: "rag", title: "Knowledge systems", topics: [
        { id: "knowledge-ingestion", title: "Knowledge ingestion", skills: ["rag"], prerequisites: ["python-engineering", "llm-engineering"],
          why: "Retrieval cannot recover what ingestion lost.",
          finance: "Ingest accounting policies and close checklists with source and owner metadata.",
          carries: [{ from: "knowledge-ingestion", take: "all" }], adds: [], project: "P3" },
        { id: "retrieval-engineering", title: "Retrieval engineering", skills: ["rag", "sql"], prerequisites: ["sql-foundations", "knowledge-ingestion"],
          why: "Answer quality is mostly retrieval quality, and it can be measured.",
          finance: "Measure which chunking finds the right policy paragraph most often.",
          carries: [{ from: "retrieval-engineering", take: "all" }], adds: [], project: "P3" },
        { id: "rag-architecture", title: "RAG architecture", skills: ["rag", "eval"], prerequisites: ["retrieval-engineering", "prompt-engineering", "api-essentials"],
          why: "A finance answer without a checkable source cannot be trusted.",
          finance: "A policy assistant that cites the paragraph, respects entity access and refuses when unsure.",
          carries: [{ from: "rag-architecture", take: "all" }], adds: [], project: "P3" },
      ] },
    ],
  },
  {
    id: "p4", ord: 4, title: "AI agents and evaluation", months: [12, 15],
    outcome: "Build a stateful finance agent with controlled tools, human approval and measured quality.",
    exitGate: "Demonstrate an observable agent workflow with persistence, human approval and repeatable evaluation.",
    projects: ["P4"],
    threads: {
      security: "Tool permissions, approval gates and audit trails.",
      testing: "Agent tests, failure injection and regression evaluation.",
      git: "Evaluation runs tied to the commit that produced them.",
      documentation: "A design note for each agent: what is fixed, what is agentic, where a human approves.",
      architecture: "Workflow or agent: deciding, and defending the decision.",
    },
    modules: [
      { id: "agents", title: "Agents", topics: [
        { id: "agent-engineering", title: "Agent engineering", skills: ["agents", "structured"], prerequisites: ["rag-architecture"],
          why: "Most tasks need a workflow, not an agent, and knowing the difference is architecture.",
          finance: "Design a variance investigation: fixed steps, agentic steps and human approval.",
          carries: [{ from: "agent-engineering", take: "all" }], adds: [], project: "P4" },
        { id: "langgraph", title: "LangGraph", skills: ["agents"], prerequisites: ["agent-engineering"],
          why: "Real work is long-running and interruptible, so state has to survive.",
          finance: "A reconciliation agent that pauses for approval and resumes after a crash.",
          carries: [{ from: "langgraph", take: "all" }], adds: [], project: "P4" },
        { id: "mcp", title: "MCP", skills: ["mcp"], prerequisites: ["api-essentials", "agent-engineering"],
          why: "A standard way to give agents tools, inside permission boundaries.",
          finance: "Read-only ledger lookups, and a separately permissioned proposal tool.",
          carries: [{ from: "mcp", take: "all" }], adds: [] },
        { id: "reliable-agents", title: "Reliable agent execution", skills: ["agents", "security"], prerequisites: ["langgraph", "mcp"],
          why: "In finance an agent must never act twice or act unapproved.",
          finance: "An audit trail for every action, sufficient for a controller's review.",
          carries: [{ from: "reliable-agents", take: "all" }], adds: [], project: "P4" },
      ] },
      { id: "evaluation", title: "Evaluation", topics: [
        { id: "observability", title: "AI observability", skills: ["eval"], prerequisites: ["llm-engineering"],
          why: "You cannot improve or defend what you cannot see.",
          finance: "Show cost, latency and tokens per reconciliation run.",
          carries: [{ from: "observability", take: ["Tracing", "Prompt versioning", "Token usage", "Cost tracking", "Latency monitoring", "Error analysis", "Performance monitoring"] }],
          adds: ["LangSmith"] },
        { id: "ai-evaluation", title: "AI evaluation", skills: ["eval"], prerequisites: ["rag-architecture", "langgraph", "observability"],
          why: "Quality has to be measured against datasets and thresholds, not impressions.",
          finance: "A golden dataset of past variances that blocks a worse prompt.",
          carries: [{ from: "ai-evaluation", take: "all" }], adds: [], project: "P4" },
        { id: "advanced-rag-agents", title: "Advanced RAG and agent design", skills: ["rag", "agents"], prerequisites: ["rag-architecture", "ai-evaluation"],
          why: "With evaluation in place, you can improve quality and prove it.",
          finance: "Improve one measured metric while holding cost per close run flat.",
          carries: [{ from: "advanced-rag-agents", take: "all" }], adds: [] },
      ] },
    ],
  },
  {
    id: "p5", ord: 5, title: "Software engineering, integration and cloud", months: [16, 20],
    outcome: "Run a secured, integrated solution on Azure through a repeatable delivery pipeline.",
    exitGate: "Deploy through a pipeline with rollback, infrastructure as code, tracing and a tested recovery.",
    projects: ["P5"],
    threads: {
      security: "OWASP LLM Top 10, least privilege, secrets management.",
      testing: "Tests run in the pipeline and block a deploy.",
      git: "Pull requests, protected branches and GitHub Actions.",
      documentation: "Runbooks and incident reviews.",
      architecture: "Service boundaries, and the failure modes of each dependency.",
    },
    modules: [
      { id: "production-backend", title: "Production backend", topics: [
        { id: "backend-engineering", title: "Backend engineering", skills: ["apis"], prerequisites: ["api-essentials"],
          why: "Moves your API from a demo to something that survives real use.",
          finance: "Idempotent imports, so re-posting a journal file cannot double-count it.",
          carries: [{ from: "backend-engineering", take: ["Dependency injection", "SQLAlchemy", "Alembic", "Authentication", "OAuth2", "JWT", "OIDC fundamentals", "Webhooks", "Retries", "Idempotency"] }],
          adds: [] },
        { id: "ai-security", title: "Security", skills: ["security"], prerequisites: ["backend-engineering", "rag-architecture"],
          why: "Finance data is sensitive, and LLMs add new ways for it to leak.",
          finance: "Plant an injection in a policy document and prove the assistant ignores it.",
          carries: [{ from: "ai-security", take: "all" }], adds: [] },
        { id: "enterprise-integrations", title: "Enterprise integrations", skills: ["apis", "security"], prerequisites: ["backend-engineering", "ai-security"],
          why: "Real value sits in the systems a business already runs.",
          finance: "Connect to an ERP-style extract with service-to-service authentication.",
          carries: [{ from: "enterprise-integrations", take: "all" }], adds: [], project: "P5" },
      ] },
      { id: "delivery", title: "Delivery and cloud", topics: [
        { id: "deployment-foundations", title: "Deployment foundations", skills: ["architecture"], prerequisites: ["software-engineering", "backend-engineering"],
          why: "Nothing delivers value while it runs only on your laptop.",
          finance: "Run the reconciliation stack in containers and rehearse a restore.",
          carries: [{ from: "deployment-foundations", take: "all" }], adds: [] },
        { id: "cloud-production", title: "Cloud and production", skills: ["architecture"], prerequisites: ["deployment-foundations"],
          why: "Azure is your primary cloud, and owning production is the job.",
          finance: "Deploy with separate dev and prod, then roll back on purpose.",
          carries: [{ from: "cloud-production", take: "all" }], adds: ["Azure architecture patterns"], project: "P5" },
        { id: "infrastructure-as-code", title: "Infrastructure as code", skills: ["architecture"], prerequisites: ["cloud-production"],
          why: "Repeatable environments are how you pass audit and recover quickly.",
          finance: "Rebuild the finance environment from code, with every change reviewed.",
          carries: [], project: "P5",
          adds: ["Terraform fundamentals", "State and backends", "Modules and environments", "Azure resources with Terraform", "Reviewing and applying changes"] },
      ] },
      { id: "operating", title: "Operating the system", topics: [
        { id: "telemetry", title: "Telemetry and monitoring", skills: ["eval", "architecture"], prerequisites: ["deployment-foundations", "observability"],
          why: "Production problems must be seen across the whole system, not only the model.",
          finance: "Trace one month-end run from upload to answer.",
          carries: [], project: "P5",
          adds: ["OpenTelemetry fundamentals", "Traces, metrics and logs", "Instrumenting a FastAPI service", "Dashboards and alerts", "Service-level objectives"] },
        { id: "reliability-engineering", title: "Reliability engineering", skills: ["architecture"], prerequisites: ["deployment-foundations", "reliable-agents"],
          why: "A close cannot wait because a model provider is down.",
          finance: "Fall back cleanly during a simulated outage at month end.",
          carries: [{ from: "reliability-engineering", take: "all" }], adds: [] },
      ] },
    ],
  },
  {
    id: "p6", ord: 6, title: "Enterprise AI solutions architecture", months: [21, 24],
    outcome: "Design, defend, deploy and operate an enterprise AI solution, explaining its trade-offs in cost, security and business value.",
    exitGate: "Defend the reference solution's decisions to a technical reviewer and to a finance executive.",
    projects: ["P5"],
    threads: {
      security: "Identity, tenant isolation and access reviews.",
      testing: "Disaster-recovery and load tests with recorded results.",
      git: "Architecture decisions stored and reviewed beside the code.",
      documentation: "C4 diagrams, ADRs and the operating model.",
      architecture: "Architecture as a decision-making discipline, with alternatives weighed.",
    },
    modules: [
      { id: "architecture-practice", title: "Architecture practice", topics: [
        { id: "architecture-foundations", title: "Requirements and architecture thinking", skills: ["architecture"], prerequisites: ["reliability-engineering"],
          why: "Architecture starts from what the business needs, not from technology names.",
          finance: "Turn a CFO's request into testable functional and non-functional requirements.",
          carries: [], project: "P5",
          adds: ["Requirements engineering", "Functional and non-functional requirements", "Stakeholders and constraints", "Quality attribute trade-offs"] },
        { id: "enterprise-architecture", title: "Enterprise architecture", skills: ["architecture"], prerequisites: ["architecture-foundations"],
          why: "You will have to explain and defend decisions to engineers and to executives.",
          finance: "Justify build versus buy for a reconciliation tool.",
          carries: [{ from: "enterprise-architecture", take: "all" }], adds: [], project: "P5" },
        { id: "advanced-architecture", title: "Application architecture", skills: ["architecture"], prerequisites: ["architecture-foundations"],
          why: "Boundaries decide what stays easy to change.",
          finance: "Move long imports and agent runs into background workers.",
          carries: [{ from: "advanced-architecture", take: "all" }], adds: [] },
        { id: "data-architecture", title: "Data architecture", skills: ["architecture", "data"], prerequisites: ["architecture-foundations", "databricks-pyspark"],
          why: "Data decisions outlive every application built on them.",
          finance: "Decide where finance master data lives and who owns it.",
          carries: [], adds: ["Data domains and ownership", "Operational and analytical stores", "Data lineage", "Data contracts", "Master data for finance"] },
      ] },
      { id: "enterprise-foundations", title: "Enterprise foundations", topics: [
        { id: "network-fundamentals", title: "Network fundamentals", skills: ["architecture"], prerequisites: ["cloud-production"],
          why: "Enterprise security reviews begin with how traffic flows.",
          finance: "Keep the finance database off the public internet.",
          carries: [], adds: ["IP, DNS and TLS", "Virtual networks and subnets", "Private endpoints", "Firewalls and gateways"] },
        { id: "enterprise-identity", title: "Enterprise identity and security", skills: ["security"], prerequisites: ["ai-security", "enterprise-integrations"],
          why: "In an enterprise, identity is the security boundary.",
          finance: "Map Entra groups to finance roles and run an access review.",
          carries: [{ from: "enterprise-identity", take: "all" }], adds: [], project: "P5" },
        { id: "resilience-scale", title: "Resilience and scale", skills: ["architecture"], prerequisites: ["reliability-engineering"],
          why: "Month end is a predictable peak, and recovery targets must be agreed in advance.",
          finance: "Set recovery targets for the close process and test them.",
          carries: [], adds: ["Disaster recovery", "Recovery objectives", "Scalability", "Performance and load testing"] },
      ] },
      { id: "governance-value", title: "Governance and value", topics: [
        { id: "ai-governance", title: "AI governance and operating model", skills: ["security", "architecture"], prerequisites: ["ai-evaluation", "ai-security"],
          why: "Owning AI in production means answering for it.",
          finance: "A model change process gated by evaluation, fit for audit.",
          carries: [{ from: "ai-governance", take: "all" }], adds: [], project: "P5" },
        { id: "finops-value", title: "FinOps and business value", skills: ["architecture"], prerequisites: ["cloud-production", "ai-governance"],
          why: "This is where your finance background makes you unusual among architects.",
          finance: "Build the total cost of ownership and ROI case for the reference solution.",
          carries: [], project: "P5",
          adds: ["FinOps", "Total cost of ownership", "ROI and business value", "Cost allocation and showback"] },
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ what leaves, and where things go */

/** Subtopics deliberately not carried. Anything not listed here must be carried (tested). */
export const DROPPED: { topic: string; subtopic: string; reason: string }[] = [
  { topic: "llm-engineering", subtopic: "Anthropic APIs", reason: "PRD §11 names OpenAI API / Azure OpenAI as the one primary stack." },
  { topic: "observability", subtopic: "Langfuse", reason: "PRD §11 names LangSmith." },
];

export const PROJECTS: { id: ProjectId; title: string; phases: string[] }[] = [
  { id: "P1", title: "Finance Data Foundation", phases: ["p2"] },
  { id: "P2", title: "FP&A and Commercial Intelligence", phases: ["p2"] },
  { id: "P3", title: "Finance Knowledge Assistant", phases: ["p3"] },
  { id: "P4", title: "Finance Workflow Agent", phases: ["p4"] },
  { id: "P5", title: "Enterprise AI Reference Solution", phases: ["p5", "p6"] },
];

/** LedgerSync is retired by name (owner's decision, 2026-11-07); its milestones move here. P2 is new. */
export const LEDGERSYNC_MOVES: Record<string, ProjectId> = {
  "ls-01": "P1", "ls-02": "P1", "ls-03": "P5", "ls-04": "P4", "ls-05": "P3",
  "ls-06": "P4", "ls-07": "P4", "ls-08": "P5", "ls-09": "P5", "ls-10": "P5",
};

/** PRD §11: where each item of the primary stack is first taught. */
export const STACK: { item: string; topic: string; subtopic: string }[] = [
  { item: "Python", topic: "python-foundations", subtopic: "Python fundamentals where gaps exist" },
  { item: "SQL", topic: "sql-foundations", subtopic: "SQL fundamentals and advanced querying" },
  { item: "PostgreSQL", topic: "sql-foundations", subtopic: "PostgreSQL" },
  { item: "Pandas", topic: "pandas-analysis", subtopic: "DataFrames and indexing" },
  { item: "Databricks and PySpark", topic: "databricks-pyspark", subtopic: "PySpark DataFrames" },
  { item: "Power BI", topic: "power-bi", subtopic: "Semantic models and relationships" },
  { item: "FastAPI", topic: "api-essentials", subtopic: "FastAPI" },
  { item: "OpenAI API / Azure OpenAI", topic: "llm-engineering", subtopic: "Azure OpenAI" },
  { item: "pgvector", topic: "retrieval-engineering", subtopic: "PostgreSQL with pgvector" },
  { item: "LangGraph", topic: "langgraph", subtopic: "Nodes and edges" },
  { item: "REST APIs", topic: "api-essentials", subtopic: "REST architecture" },
  { item: "MCP", topic: "mcp", subtopic: "MCP architecture" },
  { item: "Microsoft Azure", topic: "cloud-production", subtopic: "Azure fundamentals" },
  { item: "Docker", topic: "deployment-foundations", subtopic: "Docker" },
  { item: "GitHub", topic: "software-engineering", subtopic: "Git and GitHub" },
  { item: "GitHub Actions", topic: "cloud-production", subtopic: "GitHub Actions" },
  { item: "LangSmith", topic: "observability", subtopic: "LangSmith" },
  { item: "OpenTelemetry", topic: "telemetry", subtopic: "OpenTelemetry fundamentals" },
  { item: "Terraform", topic: "infrastructure-as-code", subtopic: "Terraform fundamentals" },
];

/** PRD §12: the enterprise architecture coverage the final curriculum must have. */
export const ARCHITECTURE_TRACK: { item: string; topic: string; subtopic: string }[] = [
  { item: "Requirements engineering", topic: "architecture-foundations", subtopic: "Requirements engineering" },
  { item: "Functional and non-functional requirements", topic: "architecture-foundations", subtopic: "Functional and non-functional requirements" },
  { item: "Architecture diagrams", topic: "enterprise-architecture", subtopic: "System design" },
  { item: "C4 model", topic: "enterprise-architecture", subtopic: "C4 diagrams" },
  { item: "Architecture Decision Records", topic: "enterprise-architecture", subtopic: "Architecture Decision Records" },
  { item: "Data architecture", topic: "data-architecture", subtopic: "Data domains and ownership" },
  { item: "Application architecture", topic: "advanced-architecture", subtopic: "Modular architecture" },
  { item: "Integration architecture", topic: "enterprise-integrations", subtopic: "Business application integrations" },
  { item: "Cloud architecture", topic: "cloud-production", subtopic: "Azure architecture patterns" },
  { item: "Identity and access management", topic: "enterprise-identity", subtopic: "Identity and access management" },
  { item: "Network fundamentals", topic: "network-fundamentals", subtopic: "IP, DNS and TLS" },
  { item: "Security and privacy", topic: "ai-governance", subtopic: "Privacy and compliance considerations" },
  { item: "Reliability and disaster recovery", topic: "resilience-scale", subtopic: "Disaster recovery" },
  { item: "Scalability and performance", topic: "resilience-scale", subtopic: "Scalability" },
  { item: "Observability", topic: "telemetry", subtopic: "Traces, metrics and logs" },
  { item: "AI governance", topic: "ai-governance", subtopic: "AI governance" },
  { item: "AI evaluation", topic: "ai-evaluation", subtopic: "Evaluation fundamentals" },
  { item: "FinOps", topic: "finops-value", subtopic: "FinOps" },
  { item: "Total cost of ownership", topic: "finops-value", subtopic: "Total cost of ownership" },
  { item: "ROI and business value", topic: "finops-value", subtopic: "ROI and business value" },
];

/* ------------------------------------------------------------------ helpers */

export const allTopics = (phases: BlueprintPhase[] = BLUEPRINT): (BlueprintTopic & { phaseId: string; moduleId: string })[] =>
  phases.flatMap((p) => p.modules.flatMap((m) => m.topics.map((t) => ({ ...t, phaseId: p.id, moduleId: m.id }))));

/** Topic titles → subtopic titles, resolving what each topic carries. */
export function subtopicsOf(topic: BlueprintTopic, current: Record<string, string[]>): string[] {
  const carried = topic.carries.flatMap((c) => (c.take === "all" ? current[c.from] ?? [] : c.take));
  return [...carried, ...topic.adds];
}

/* ------------------------------------------------------------------ study load */

/**
 * Assumptions behind the load check, all stated so they can be challenged. Measured values
 * come from lib/learning-map.ts and data/videos-verified.json; the rest are planning estimates.
 */
export const LOAD = {
  watchFactor: 1.25,          // pausing, rewinding and taking notes at this starting level
  practiseFactor: 1.5,        // PRD §2: not an experienced engineer, so exercises take longer than their estimate
  newWatchMinutes: 25,        // a new subtopic, until Stage 2 finds its real video
  newPractiseMinutes: 45,     // a new subtopic, until Stage 4 writes its exercise
  docsPrimaryWatchMinutes: 20,// a docs-primary subtopic, once Stage 2 gives it a video
  assessmentHours: 3,         // one practical assessment per topic
  revisionShare: 0.1,         // revision on top of the above (PRD §9)
  projectHours: { P1: 25, P2: 25, P3: 25, P4: 25, P5: 50 } as Record<ProjectId, number>, // integration beyond topic exercises
} as const;

/** Minutes for one current subtopic. `watch` is null when its primary resource is documentation. */
export type Measured = { watch: number | null; practise: number };

export type PhaseLoad = {
  id: string; title: string; months: number; weeks: number;
  watchHours: number; practiseHours: number; assessmentHours: number; projectHours: number; revisionHours: number;
  totalHours: number; hoursPerWeek: number; estimatedShare: number;
};

const WEEKS_PER_MONTH = 52 / 12;

/** `actualWatch` holds real video minutes by "blueprintTopic::subtopic" from Stage 2, replacing the estimates. */
export function phaseLoads(measured: Record<string, Record<string, Measured>>, phases: BlueprintPhase[] = BLUEPRINT, actualWatch: Record<string, number> = {}): PhaseLoad[] {
  return phases.map((p) => {
    let watch = 0, practise = 0, estimated = 0;
    const topics = p.modules.flatMap((m) => m.topics);
    for (const t of topics) {
      for (const c of t.carries) {
        const entries = c.take === "all" ? Object.keys(measured[c.from] ?? {}) : c.take;
        for (const title of entries) {
          const m = measured[c.from]?.[title];
          if (!m) throw new Error(`No measured time for "${title}" in ${c.from}`);
          const real = m.watch ?? actualWatch[`${t.id}::${title}`] ?? null;
          const w = real ?? LOAD.docsPrimaryWatchMinutes;
          if (real === null) estimated += w * LOAD.watchFactor;
          watch += w * LOAD.watchFactor;
          practise += m.practise * LOAD.practiseFactor;
        }
      }
      for (const title of t.adds) {
        const real = actualWatch[`${t.id}::${title}`] ?? null;
        watch += (real ?? LOAD.newWatchMinutes) * LOAD.watchFactor;
        practise += LOAD.newPractiseMinutes * LOAD.practiseFactor;
        estimated += (real === null ? LOAD.newWatchMinutes * LOAD.watchFactor : 0) + LOAD.newPractiseMinutes * LOAD.practiseFactor;
      }
    }
    const assessment = topics.length * LOAD.assessmentHours;
    const project = PROJECTS.filter((x) => x.phases.includes(p.id))
      .reduce((n, x) => n + LOAD.projectHours[x.id] / x.phases.length, 0);
    const base = watch / 60 + practise / 60 + assessment + project;
    const revision = base * LOAD.revisionShare;
    const total = base + revision;
    const months = p.months[1] - p.months[0] + 1;
    const weeks = months * WEEKS_PER_MONTH;
    return {
      id: p.id, title: p.title, months, weeks,
      watchHours: watch / 60, practiseHours: practise / 60, assessmentHours: assessment, projectHours: project, revisionHours: revision,
      totalHours: total, hoursPerWeek: total / weeks,
      estimatedShare: (estimated / 60 + assessment + project + revision) / total,
    };
  });
}
