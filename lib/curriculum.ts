/**
 * URHA curriculum — seed data and source of truth for the 24-month roadmap (PRD §5).
 *
 * This file seeds the database on first run (lib/db.ts). After seeding, the
 * database copy is the editable curriculum; this file is never re-applied over
 * user edits. Subtopic ids are slugs of their titles, so they stay stable.
 *
 * Existing strengths (FP&A, Excel, Power Query, Power BI/DAX, SAP, reconciliation)
 * are deliberately absent: they are applied in LedgerSync, not taught (PRD §2).
 */

export type SkillDef = { id: string; name: string; target: number };

export type TopicDef = {
  id: string;
  title: string;
  objective: string;
  summary: string;
  prerequisites: string[]; // topic ids
  skills: string[]; // skill ids
  subtopics: string[];
  assignment: string; // practical work: every major topic has one (PRD §21.9)
  milestone: string; // LedgerSync milestone id
};

export type PhaseDef = {
  id: string;
  order: number;
  title: string;
  months: [number, number];
  summary: string;
  deliverable: string;
  exitGate: string;
  topics: TopicDef[];
};

export type MilestoneDef = {
  id: string;
  order: number;
  title: string;
  phase: string;
  businessProblem: string;
  technicalObjective: string;
  completionCriteria: string;
};

export const SKILLS: SkillDef[] = [
  { id: "python", name: "Python and software engineering", target: 3 },
  { id: "sql", name: "SQL and database engineering", target: 3 },
  { id: "apis", name: "APIs and backend development", target: 3 },
  { id: "llm", name: "LLM application engineering", target: 3 },
  { id: "prompt", name: "Prompt and context engineering", target: 3 },
  { id: "structured", name: "Structured outputs and tool calling", target: 3 },
  { id: "rag", name: "RAG and knowledge systems", target: 3 },
  { id: "agents", name: "Agentic AI and LangGraph", target: 3 },
  { id: "mcp", name: "MCP", target: 3 },
  { id: "eval", name: "AI evaluation and observability", target: 3 },
  { id: "security", name: "AI security and governance", target: 3 },
  { id: "architecture", name: "Deployment and enterprise architecture", target: 4 },
];

export const LEVELS = [
  { level: 0, name: "Not started" },
  { level: 1, name: "Awareness" },
  { level: 2, name: "Working proficiency" },
  { level: 3, name: "Strong independent capability" },
  { level: 4, name: "Mastery and design judgement" },
] as const;

export const MILESTONES: MilestoneDef[] = [
  { id: "ls-01", order: 1, phase: "p1", title: "Python engineering and validation",
    businessProblem: "Month-end reconciliation files arrive in inconsistent shapes and are checked by hand.",
    technicalObjective: "A structured Python package that loads, validates and logs ledger and bank extracts.",
    completionCriteria: "Invalid rows are rejected with reasons; pytest suite covers validators; logging is configurable." },
  { id: "ls-02", order: 2, phase: "p1", title: "Database and data access",
    businessProblem: "Reconciliation history lives in spreadsheets and cannot be queried.",
    technicalObjective: "PostgreSQL schema for entities, accounts, transactions and matches, with a data-access layer.",
    completionCriteria: "Constraints enforce integrity; window-function reports reproduce a known month; tests use a test database." },
  { id: "ls-03", order: 3, phase: "p2", title: "APIs and integrations",
    businessProblem: "Finance colleagues need reconciliation status without opening files.",
    technicalObjective: "FastAPI service with authenticated endpoints, idempotent imports and webhooks.",
    completionCriteria: "OpenAPI documented; auth enforced; re-posting the same import is a no-op; API tests pass." },
  { id: "ls-04", order: 4, phase: "p2", title: "LLM-powered analysis",
    businessProblem: "Explaining unmatched items and variances takes analysts hours each close.",
    technicalObjective: "LLM analysis that returns schema-validated variance explanations with cost and latency logged.",
    completionCriteria: "Outputs validate against a JSON schema; failures retry or degrade; per-call cost is recorded." },
  { id: "ls-05", order: 5, phase: "p3", title: "RAG and knowledge retrieval",
    businessProblem: "Accounting policies and close procedures are scattered across PDFs.",
    technicalObjective: "pgvector knowledge assistant over approved policy documents with citations.",
    completionCriteria: "Answers cite exact chunks; access filters respected; a retrieval eval set reports recall." },
  { id: "ls-06", order: 6, phase: "p4", title: "Agent workflows",
    businessProblem: "Exception investigation follows the same evidence-gathering steps every month.",
    technicalObjective: "LangGraph agent that investigates exceptions, gathers evidence and recommends actions.",
    completionCriteria: "State persists across interrupts; consequential actions wait for human approval; runs are replayable." },
  { id: "ls-07", order: 7, phase: "p4", title: "MCP tools",
    businessProblem: "Each new tool integration is bespoke and hard to govern.",
    technicalObjective: "An MCP server exposing ledger lookups and match proposals with permission boundaries.",
    completionCriteria: "Tools, resources and prompts declared; read and write tools separated; client integration tested." },
  { id: "ls-08", order: 8, phase: "p5", title: "Evaluation and observability",
    businessProblem: "Nobody can say whether a prompt change made the analysis better or worse.",
    technicalObjective: "Golden datasets, automated evals and Langfuse tracing across the pipeline.",
    completionCriteria: "Regression suite runs in CI with thresholds; traces show cost, tokens and latency per run." },
  { id: "ls-09", order: 9, phase: "p5", title: "Security and access control",
    businessProblem: "Finance data is sensitive and entity access must be restricted.",
    technicalObjective: "RBAC, input/output validation, prompt-injection defences and audit logging.",
    completionCriteria: "OWASP LLM Top 10 threat model written; injection tests pass; every action is audited." },
  { id: "ls-10", order: 10, phase: "p7", title: "Enterprise deployment and architecture",
    businessProblem: "The solution must run as a supported departmental service.",
    technicalObjective: "Azure Container Apps deployment with Entra ID, CI/CD, monitoring, C4 diagrams and ADRs.",
    completionCriteria: "Deployed via pipeline with rollback; architecture defended in writing; runbook and operating model exist." },
];

export const PHASES: PhaseDef[] = [
  {
    id: "p1", order: 1, title: "Python, Engineering Foundations and Data Access", months: [1, 2],
    summary: "Write, test and debug real Python against a real database.",
    deliverable: "A structured Python application with PostgreSQL integration, validation, logging and automated tests.",
    exitGate: "Independently understand, modify, debug and test the application.",
    topics: [
      {
        id: "python-engineering", title: "Python engineering", milestone: "ls-01",
        objective: "Write modular, typed, testable Python that a colleague can read.",
        summary: "Move from scripts to software: data structures, functions, classes and composition, errors, type hints, packaging, configuration and async basics.",
        prerequisites: [], skills: ["python"],
        subtopics: ["Python fundamentals where gaps exist", "Data structures and collections", "Functions and modular programming", "Object-oriented programming", "Classes, inheritance and composition", "Exception handling", "Type hints", "Modules and packages", "Decorators and generators concepts", "JSON processing", "Virtual environments", "Dependency management", "Async programming fundamentals", "File handling", "Environment variables", "Application configuration"],
        assignment: "Build the LedgerSync loader package: typed models for ledger and bank lines, a validator that rejects bad rows with reasons, configuration from environment variables, and a CLI entry point.",
      },
      {
        id: "software-engineering", title: "Software engineering", milestone: "ls-01",
        objective: "Work like an engineer: version control, tests, logs and code review.",
        summary: "Git workflows, project structure, debugging and logging, and pytest with fixtures, parametrisation and mocks — plus critically reviewing AI-generated code.",
        prerequisites: [], skills: ["python"],
        subtopics: ["Git and GitHub", "Branching and merging", "Project structure", "Debugging", "Logging", "pytest", "Fixtures", "Parameterised tests", "Mocking", "Code quality", "Reading and reviewing AI-generated code"],
        assignment: "Put LedgerSync under Git with a feature-branch workflow; reach meaningful pytest coverage of the validators using fixtures and parametrised cases; review one AI-generated function and record the defects you found.",
      },
      {
        id: "sql-foundations", title: "SQL and database foundations", milestone: "ls-02",
        objective: "Model, query and protect relational data in PostgreSQL.",
        summary: "Querying from joins to window functions, relational modelling with keys and constraints, transactions, indexing and connecting from Python.",
        prerequisites: [], skills: ["sql"],
        subtopics: ["SQL fundamentals and advanced querying", "Joins and anti-joins", "Aggregations", "CASE and NULL handling", "CTEs and subqueries", "Window functions", "PostgreSQL", "Relational data modelling", "Keys and constraints", "Transactions", "Indexing fundamentals", "Database connectivity", "Selective pandas for loading and checking data"],
        assignment: "Design the LedgerSync schema in PostgreSQL; write an anti-join that finds unmatched transactions and a window-function report of running balances; load data from Python inside a transaction.",
      },
    ],
  },
  {
    id: "p2", order: 2, title: "APIs, Integrations and LLM Applications", months: [3, 4],
    summary: "Expose data through a real API and add reliable, structured LLM analysis.",
    deliverable: "A backend application that exposes finance data through APIs and uses an LLM to generate validated, structured analysis.",
    exitGate: "Build and test an API-driven LLM application with reliable structured outputs, error handling and cost visibility.",
    topics: [
      {
        id: "backend-engineering", title: "Backend engineering", milestone: "ls-03",
        objective: "Build authenticated, tested, idempotent HTTP APIs.",
        summary: "HTTP and REST, FastAPI with Pydantic validation, SQLAlchemy and Alembic, OAuth2/JWT/OIDC fundamentals, webhooks, retries and idempotency.",
        prerequisites: ["python-engineering", "sql-foundations"], skills: ["apis"],
        subtopics: ["HTTP fundamentals", "REST architecture", "FastAPI", "Pydantic", "Request and response validation", "API routing", "Dependency injection", "SQLAlchemy", "Alembic", "Authentication", "OAuth2", "JWT", "OIDC fundamentals", "API testing", "Webhooks", "Retries", "Idempotency", "Error handling"],
        assignment: "Wrap LedgerSync in FastAPI: authenticated endpoints for imports and match status, Alembic migrations, an idempotency key on imports, and an API test suite.",
      },
      {
        id: "llm-engineering", title: "LLM engineering", milestone: "ls-04",
        objective: "Call models deliberately: right model, right cost, structured and safe outputs.",
        summary: "How LLMs work, tokens and context windows, model selection, sampling, cost and latency, provider APIs, streaming, structured outputs, tool calling and provider abstraction.",
        prerequisites: ["python-engineering"], skills: ["llm", "structured"],
        subtopics: ["LLM architecture and fundamentals", "Tokens and context windows", "Model selection", "Temperature and sampling", "Context limitations", "Model cost and latency", "OpenAI APIs", "Anthropic APIs", "API authentication", "Streaming", "Structured outputs", "JSON schemas", "Function calling", "Tool calling", "Provider abstraction", "Model error handling", "Rate limits"],
        assignment: "Add a variance-explanation endpoint that calls two providers behind one interface, validates output against a JSON schema, retries on rate limits and logs token cost per call.",
      },
      {
        id: "prompt-engineering", title: "Prompt and context engineering", milestone: "ls-04",
        objective: "Construct context and instructions that produce grounded, testable outputs.",
        summary: "System instructions, prompt structure, few-shot examples, context construction, output constraints, grounding, prompt testing and injection basics.",
        prerequisites: ["llm-engineering"], skills: ["prompt"],
        subtopics: ["System instructions", "Prompt structure", "Few-shot prompting", "Context construction", "Output constraints", "Grounding", "Prompt testing", "Prompt injection fundamentals"],
        assignment: "Write a versioned prompt for variance analysis with few-shot examples drawn from real close scenarios, a test set of 20 cases, and two injection attempts that must fail.",
      },
    ],
  },
  {
    id: "p3", order: 3, title: "RAG and Enterprise Knowledge Systems", months: [5, 6],
    summary: "Answer questions from approved documents with citations you can check.",
    deliverable: "An enterprise knowledge assistant that answers questions from approved documents with verifiable citations.",
    exitGate: "Demonstrate retrieval quality, source grounding, access-aware search and measurable answer quality.",
    topics: [
      {
        id: "knowledge-ingestion", title: "Knowledge ingestion", milestone: "ls-05",
        objective: "Turn messy documents into clean, attributed, searchable chunks.",
        summary: "PDF and document extraction, normalisation, metadata, ingestion pipelines and structured-data ingestion.",
        prerequisites: ["python-engineering", "llm-engineering"], skills: ["rag"],
        subtopics: ["PDF extraction", "Document processing", "Text normalisation", "Metadata extraction", "Document ingestion pipelines", "Excel, CSV and structured-data ingestion"],
        assignment: "Ingest a set of accounting-policy PDFs and a close checklist spreadsheet into normalised chunks carrying source, page, owner and access metadata.",
      },
      {
        id: "retrieval-engineering", title: "Retrieval engineering", milestone: "ls-05",
        objective: "Retrieve the right passages, measurably.",
        summary: "Embeddings, similarity search, chunking strategies, metadata filters, pgvector, semantic and hybrid search, reranking fundamentals.",
        prerequisites: ["sql-foundations", "knowledge-ingestion"], skills: ["rag", "sql"],
        subtopics: ["Embeddings", "Vector representations", "Similarity search", "Chunking strategies", "Metadata filtering", "PostgreSQL with pgvector", "Semantic search", "Hybrid search", "Reranking fundamentals"],
        assignment: "Index the policy chunks in pgvector; compare two chunking strategies and semantic versus hybrid search on a 30-question retrieval set; record recall@5 for each.",
      },
      {
        id: "rag-architecture", title: "RAG architecture", milestone: "ls-05",
        objective: "Ground generation in retrieved sources and prove it.",
        summary: "Retrieval pipelines, context assembly, grounded generation, citations, access-aware retrieval, retrieval quality, RAG evaluation and failure analysis.",
        prerequisites: ["retrieval-engineering", "prompt-engineering"], skills: ["rag", "eval"],
        subtopics: ["Retrieval pipelines", "Context assembly", "Grounded generation", "Source citations", "Document references", "Access-aware retrieval", "Retrieval quality", "RAG evaluation", "Failure analysis"],
        assignment: "Ship the policy assistant: answers with chunk-level citations, refusal when sources are missing, entity-based access filters, and a written failure analysis of ten wrong answers.",
      },
    ],
  },
  {
    id: "p4", order: 4, title: "Agentic AI, LangGraph and MCP", months: [7, 9],
    summary: "Build stateful agents with controlled tools and a human in the loop.",
    deliverable: "A multi-step finance operations agent that investigates exceptions, gathers evidence, recommends actions and requests approval before consequential actions.",
    exitGate: "Demonstrate a stateful, observable agent workflow with controlled tools, persistence and human approval.",
    topics: [
      {
        id: "agent-engineering", title: "Agent engineering", milestone: "ls-06",
        objective: "Know when to build a workflow and when an agent, and build either well.",
        summary: "Workflows versus agents, agent loops, planning, tool selection, state, context and memory, human-in-the-loop and recovery.",
        prerequisites: ["llm-engineering", "prompt-engineering"], skills: ["agents", "structured"],
        subtopics: ["Workflows versus agents", "Agent loops", "Planning and execution", "Tool selection", "Tool calling", "State management", "Context management", "Memory", "Human-in-the-loop", "Workflow orchestration", "Failure recovery"],
        assignment: "Write a one-page design for the exception-investigation agent: which steps are fixed workflow, which are agentic, which tools exist and where a human must approve.",
      },
      {
        id: "langgraph", title: "LangGraph", milestone: "ls-06",
        objective: "Implement durable, interruptible graphs.",
        summary: "Nodes, edges and state, conditional routing, checkpointing and persistence, interrupts and approval, long-running and resumable workflows, testing.",
        prerequisites: ["agent-engineering"], skills: ["agents"],
        subtopics: ["Nodes and edges", "Graph state", "Conditional routing", "Checkpointing", "Persistence", "Interrupts", "Human approval", "Long-running workflows", "Recovery and resumability", "Agent testing"],
        assignment: "Implement the investigation agent in LangGraph with a Postgres checkpointer, an approval interrupt before any write, and tests that resume a run after a simulated crash.",
      },
      {
        id: "mcp", title: "MCP", milestone: "ls-07",
        objective: "Expose and consume tools through the Model Context Protocol safely.",
        summary: "MCP architecture (hosts, clients, servers), tools, resources and prompts, server and client development, authentication and permission boundaries.",
        prerequisites: ["backend-engineering", "agent-engineering"], skills: ["mcp"],
        subtopics: ["MCP architecture", "Hosts, clients and servers", "Tools", "Resources", "Prompts", "Server development", "Client integration", "Authentication and permission boundaries", "MCP integration with applications and agents"],
        assignment: "Build a LedgerSync MCP server with read-only lookup tools, a separately permissioned match-proposal tool, and connect it to the LangGraph agent and one desktop client.",
      },
      {
        id: "reliable-agents", title: "Reliable agent execution", milestone: "ls-07",
        objective: "Make agent actions safe, auditable and repeatable.",
        summary: "Tool permissions, approval gates, input validation, idempotency, retries, audit trails, safe execution and failure handling.",
        prerequisites: ["langgraph", "mcp"], skills: ["agents", "security"],
        subtopics: ["Tool permissions", "Approval gates", "Input validation", "Idempotency", "Retries", "Audit trails", "Safe execution", "Failure handling"],
        assignment: "Add an audit trail for every tool call, idempotency keys on write tools, and a failure-injection test that proves no action is executed twice or without approval.",
      },
    ],
  },
  {
    id: "p5", order: 5, title: "AI Evaluation, Security and Deployment", months: [10, 12],
    summary: "Prove quality, defend the system and ship it.",
    deliverable: "A secured, evaluated and deployed AI application with tracing, tests, access controls and operational monitoring.",
    exitGate: "Demonstrate repeatable evaluation, security controls and a working deployment.",
    topics: [
      {
        id: "ai-evaluation", title: "AI evaluation", milestone: "ls-08",
        objective: "Measure AI quality with datasets and thresholds, not impressions.",
        summary: "Evaluation fundamentals, golden datasets, test design, deterministic checks, LLM-as-judge, RAG and agent-trajectory evaluation, regression testing and automation.",
        prerequisites: ["rag-architecture", "langgraph"], skills: ["eval"],
        subtopics: ["Evaluation fundamentals", "Golden datasets", "Test-case design", "Deterministic evaluation", "LLM-as-judge", "RAG evaluation", "Agent trajectory evaluation", "Regression testing", "Quality thresholds", "Evaluation automation"],
        assignment: "Build golden datasets for variance analysis, policy Q&A and the agent; automate deterministic and judge-based evals with pass thresholds that block a regression.",
      },
      {
        id: "observability", title: "Observability", milestone: "ls-08",
        objective: "See what every AI call did, cost and took.",
        summary: "Langfuse tracing, prompt versioning, token and cost tracking, latency monitoring, error analysis and performance monitoring.",
        prerequisites: ["llm-engineering"], skills: ["eval"],
        subtopics: ["Langfuse", "Tracing", "Prompt versioning", "Token usage", "Cost tracking", "Latency monitoring", "Error analysis", "Performance monitoring"],
        assignment: "Instrument LedgerSync with Langfuse traces across API, RAG and agent; version prompts; produce a weekly cost and latency summary from real traces.",
      },
      {
        id: "ai-security", title: "Security", milestone: "ls-09",
        objective: "Threat-model and defend an LLM application.",
        summary: "OWASP LLM Top 10, direct and indirect prompt injection, data exposure and leakage, RBAC and least privilege, secrets, validation, access-controlled retrieval and audit logging.",
        prerequisites: ["backend-engineering", "rag-architecture"], skills: ["security"],
        subtopics: ["OWASP LLM Top 10", "Direct prompt injection", "Indirect prompt injection", "Sensitive data exposure", "Data leakage", "RBAC", "Least privilege", "Secrets management", "Input and output validation", "Access-controlled retrieval", "Audit logging"],
        assignment: "Write a threat model mapped to the OWASP LLM Top 10; add RBAC per entity; plant an indirect injection in a policy document and prove the assistant does not follow it.",
      },
      {
        id: "deployment-foundations", title: "Deployment foundations", milestone: "ls-09",
        objective: "Package and run the application outside your laptop.",
        summary: "Linux and CLI, Docker and containerisation, environment configuration, cloud and CI/CD fundamentals, automated testing before deployment, monitoring and recovery.",
        prerequisites: ["software-engineering", "backend-engineering"], skills: ["architecture"],
        subtopics: ["Linux and CLI fundamentals", "Docker", "Containerisation", "Environment configuration", "Cloud deployment fundamentals", "CI/CD fundamentals", "Automated testing before deployment", "Application monitoring", "Basic recovery procedures"],
        assignment: "Containerise LedgerSync with Docker Compose (API, Postgres, worker), run tests in CI before a deploy step, and document a restore-from-backup drill you actually performed.",
      },
    ],
  },
  {
    id: "p6", order: 6, title: "Advanced Architecture, Integrations and Reliability", months: [13, 18],
    summary: "Grow from one app to an integrated, reliable departmental solution.",
    deliverable: "An integrated departmental AI solution with multiple data sources, controlled tools, reliable workflows and operational documentation.",
    exitGate: "Independently explain and troubleshoot the application's components, integrations, failure modes and trade-offs.",
    topics: [
      {
        id: "advanced-architecture", title: "Advanced application architecture", milestone: "ls-10",
        objective: "Draw and defend service boundaries.",
        summary: "Modular architecture, service boundaries, separation of concerns, API architecture, event-driven integration, background and asynchronous workflows, orchestration and integration patterns.",
        prerequisites: ["deployment-foundations"], skills: ["architecture"],
        subtopics: ["Modular architecture", "Service boundaries", "Separation of concerns", "API architecture", "Event-driven integration concepts", "Background processing", "Asynchronous workflows", "Workflow orchestration", "Data and application integration patterns"],
        assignment: "Split LedgerSync's long-running imports and agent runs into background workers with a queue; write an ADR justifying the boundaries you chose.",
      },
      {
        id: "enterprise-integrations", title: "Enterprise integrations", milestone: "ls-10",
        objective: "Connect safely to the systems a department already runs.",
        summary: "Identity providers, external APIs, webhooks, business application integrations, enterprise data sources, permission-aware tool access and system-to-system communication.",
        prerequisites: ["backend-engineering", "ai-security"], skills: ["apis", "security"],
        subtopics: ["Identity providers", "External APIs", "Webhooks", "Business application integrations", "Enterprise data sources", "Permission-aware tool access", "System-to-system communication"],
        assignment: "Integrate a second real data source (for example an ERP extract or a banking feed sandbox) with service-to-service auth and permission-aware tool access.",
      },
      {
        id: "reliability-engineering", title: "Reliability engineering", milestone: "ls-10",
        objective: "Keep the solution working when its dependencies fail.",
        summary: "Retries and backoff, idempotency, timeouts, rate limiting, model fallback, circuit breakers, state recovery, backups, incidents and runbooks.",
        prerequisites: ["deployment-foundations", "reliable-agents"], skills: ["architecture"],
        subtopics: ["Retries and backoff", "Idempotency", "Timeouts", "Rate limiting", "Model fallback", "Circuit breakers", "State recovery", "Backups and restores", "Incident handling", "Operational runbooks"],
        assignment: "Add timeouts, backoff, a model fallback and a circuit breaker around the LLM provider; run a game-day where the provider fails and write the incident review and runbook.",
      },
      {
        id: "advanced-rag-agents", title: "Advanced RAG and agent design", milestone: "ls-10",
        objective: "Optimise retrieval and agents against measured quality, cost and latency.",
        summary: "Retrieval optimisation, hybrid retrieval and reranking, query transformation, agent evaluation, workflow optimisation, approval design, tool reliability, cost and latency optimisation.",
        prerequisites: ["rag-architecture", "ai-evaluation"], skills: ["rag", "agents"],
        subtopics: ["Retrieval optimisation", "Hybrid retrieval", "Reranking", "Query transformation", "Agent evaluation", "Workflow optimisation", "Human approval design", "Tool reliability", "Cost and latency optimisation"],
        assignment: "Use the eval suite to improve one RAG and one agent metric by a measured amount while holding cost per run flat; record before and after.",
      },
    ],
  },
  {
    id: "p7", order: 7, title: "Enterprise AI Architecture and Production Ownership", months: [19, 24],
    summary: "Design, defend, deploy and operate a business AI solution.",
    deliverable: "A production-style departmental AI solution with architecture documentation, secure deployment, monitoring, CI/CD, governance and an operating model.",
    exitGate: "Design, defend, deploy and operate a business AI solution, explaining architecture choices, security, cost, reliability and measurable business value.",
    topics: [
      {
        id: "cloud-production", title: "Cloud and production", milestone: "ls-10",
        objective: "Run the solution on Azure with a real delivery pipeline.",
        summary: "Azure fundamentals, Container Apps, managed PostgreSQL, GitHub Actions CI/CD, environment separation, secrets, deployment strategies, rollbacks and production monitoring.",
        prerequisites: ["deployment-foundations"], skills: ["architecture"],
        subtopics: ["Azure fundamentals", "Azure Container Apps", "Managed PostgreSQL", "GitHub Actions", "CI/CD pipelines", "Environment separation", "Secrets management", "Deployment strategies", "Rollbacks", "Production monitoring"],
        assignment: "Deploy LedgerSync to Azure Container Apps with managed PostgreSQL via GitHub Actions, separate dev and prod, and perform a rollback on purpose.",
      },
      {
        id: "enterprise-identity", title: "Enterprise identity and security", milestone: "ls-10",
        objective: "Integrate with enterprise identity and prove access is right.",
        summary: "Microsoft Entra ID, OAuth2 and OIDC integration, RBAC, tenant isolation, IAM, data security, auditability and secure integration patterns.",
        prerequisites: ["ai-security", "enterprise-integrations"], skills: ["security"],
        subtopics: ["Microsoft Entra ID", "OAuth2 and OIDC integration", "RBAC", "Tenant isolation", "Identity and access management", "Data security", "Auditability", "Secure integration patterns"],
        assignment: "Replace local auth with Entra ID sign-in; map Entra groups to LedgerSync roles; run an access review and record the evidence.",
      },
      {
        id: "enterprise-architecture", title: "Enterprise architecture", milestone: "ls-10",
        objective: "Communicate and defend architecture decisions to engineers and executives.",
        summary: "System design, C4 diagrams, ADRs, components, data flows, API boundaries, build versus buy, scalability, reliability, maintainability, cost and latency trade-offs, technical debt.",
        prerequisites: ["advanced-architecture"], skills: ["architecture"],
        subtopics: ["System design", "C4 diagrams", "Architecture Decision Records", "Component architecture", "Data flows", "API boundaries", "Build versus buy", "Scalability", "Reliability", "Maintainability", "Cost and latency trade-offs", "Technical debt"],
        assignment: "Produce C4 context, container and component diagrams for LedgerSync, five ADRs including one build-versus-buy decision, and present them to a peer for challenge.",
      },
      {
        id: "ai-governance", title: "AI governance and operating model", milestone: "ls-10",
        objective: "Own the solution in production and prove its value.",
        summary: "AI and data governance, responsible AI, privacy and compliance, model lifecycle, evaluation governance, access reviews, operational ownership, business value measurement and support.",
        prerequisites: ["ai-evaluation", "ai-security"], skills: ["security", "architecture"],
        subtopics: ["AI governance", "Data governance", "Responsible AI", "Privacy and compliance considerations", "Model lifecycle management", "Evaluation governance", "Access reviews", "Operational ownership", "Business value measurement", "Production support"],
        assignment: "Write the operating model: owners, model change process gated by evals, access-review cadence, support runbook, and a business-value measure (hours saved per close) tracked from real usage.",
      },
    ],
  },
];

export const TOTAL_MONTHS = 24;

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Spread a phase's subtopics evenly across its months, in topic order.
 * Returns the 1-based roadmap month for each subtopic index.
 */
export function scheduleMonths(count: number, [start, end]: [number, number]): number[] {
  const months = end - start + 1;
  return Array.from({ length: count }, (_, i) => start + Math.min(months - 1, Math.floor((i * months) / count)));
}

/** Short phase names for tight labels (the road). Full titles live in the database. */
export const PHASE_SHORT: Record<string, string> = {
  p1: "Python and data", p2: "APIs and LLMs", p3: "RAG", p4: "Agents and MCP",
  p5: "Evaluation and security", p6: "Architecture and reliability", p7: "Production ownership",
};
