/**
 * URHA curriculum: seed data and source of truth for the six-phase, 24-month path (docs/PRD.md §4).
 *
 * Phase → module → topic → subtopic. Learning content stays here and in lib/learning-map.ts,
 * lib/learning-outcomes.ts and lib/videos-source.json, never in components (PRD §13).
 *
 * Seeded on first run (lib/db.ts). Databases from the earlier seven-phase path are moved
 * here by lib/curriculum-migration.ts. Subtopic ids are "<topic>:<slug>", so they stay stable.
 */

export type SkillDef = { id: string; name: string; target: number };
export type ProjectId = "P1" | "P2" | "P3" | "P4" | "P5";

export type TopicDef = {
  id: string;
  title: string;
  objective: string;
  summary: string;
  assignment: string; // the practical work every topic has
  why: string; // PRD §1: why is this skill important?
  finance: string; // PRD §1: how can I apply this to finance?
  prerequisites: string[]; // topic ids; a topic never requires one that comes after it
  skills: string[]; // skill ids
  subtopics: string[];
  milestone: string | null; // delivery milestone id
  project: ProjectId | null; // portfolio project this topic builds
};

export type ModuleDef = { id: string; title: string; topics: TopicDef[] };

/** What runs through every phase rather than waiting for the last one (PRD §4, §11). */
export type Threads = { security: string; testing: string; git: string; documentation: string; architecture: string };

export type PhaseDef = {
  id: string;
  order: number;
  title: string;
  months: [number, number];
  summary: string;
  deliverable: string;
  exitGate: string;
  projects: ProjectId[];
  threads: Threads;
  modules: ModuleDef[];
  topics: TopicDef[]; // every topic of the phase, in order
};

export type MilestoneDef = {
  id: string;
  order: number;
  title: string;
  phase: string;
  project: ProjectId;
  businessProblem: string;
  technicalObjective: string;
  completionCriteria: string;
};

/** PRD §2 and §9. */
export const CAREER_PROFILE = {
  "destination": "Enterprise AI Solutions Architect",
  "background": "About 8 years of FP&A and Commercial Finance; MBA in Finance; SAP ECC, JDE; Excel/VBA automation.",
  "startingLevel": "Basic Python, SQL, Power BI and Power Query; familiar with Pandas; exposure to APIs, LLMs, LangChain, LangGraph and Streamlit.",
  "weeklyHours": {
    "min": 8,
    "max": 10
  },
  "weekdayHours": [
    1,
    1.5
  ],
  "weekendHours": [
    2,
    3
  ]
} as const;

/** PRD §3. Reached with evidence, never a job qualification or guarantee. */
export const CAREER_MILESTONES = [
  {
    "id": "m1",
    "ord": 1,
    "title": "Finance Data & AI Solutions Engineer",
    "afterPhase": "p3",
    "proof": [
      "P1",
      "P2",
      "P3"
    ],
    "summary": "Build finance data pipelines, analytics solutions, AI applications and automation systems."
  },
  {
    "id": "m2",
    "ord": 2,
    "title": "Finance AI Solutions Architect",
    "afterPhase": "p5",
    "proof": [
      "P3",
      "P4"
    ],
    "summary": "Design and own end-to-end AI solutions for finance, including data architecture, AI applications, integrations, security and deployment."
  },
  {
    "id": "m3",
    "ord": 3,
    "title": "Enterprise AI Solutions Architect",
    "afterPhase": "p6",
    "proof": [
      "P5"
    ],
    "summary": "Extend architecture capabilities across enterprise functions, platforms, governance, security, infrastructure and operations."
  }
] as const;

/** PRD §10. Requirements and acceptance criteria arrive in Stage 6. */
export const PROJECTS: { id: ProjectId; title: string; phases: string[] }[] = [
  {
    "id": "P1",
    "title": "Finance Data Foundation",
    "phases": [
      "p2"
    ]
  },
  {
    "id": "P2",
    "title": "FP&A and Commercial Intelligence",
    "phases": [
      "p2"
    ]
  },
  {
    "id": "P3",
    "title": "Finance Knowledge Assistant",
    "phases": [
      "p3"
    ]
  },
  {
    "id": "P4",
    "title": "Finance Workflow Agent",
    "phases": [
      "p4"
    ]
  },
  {
    "id": "P5",
    "title": "Enterprise AI Reference Solution",
    "phases": [
      "p5",
      "p6"
    ]
  }
];

export const SKILLS: SkillDef[] = [
  {
    "id": "python",
    "name": "Python and software engineering",
    "target": 3
  },
  {
    "id": "sql",
    "name": "SQL and database engineering",
    "target": 3
  },
  {
    "id": "data",
    "name": "Data engineering",
    "target": 3
  },
  {
    "id": "analytics",
    "name": "Finance analytics and BI",
    "target": 3
  },
  {
    "id": "apis",
    "name": "APIs and backend development",
    "target": 3
  },
  {
    "id": "llm",
    "name": "LLM application engineering",
    "target": 3
  },
  {
    "id": "prompt",
    "name": "Prompt and context engineering",
    "target": 3
  },
  {
    "id": "structured",
    "name": "Structured outputs and tool calling",
    "target": 3
  },
  {
    "id": "rag",
    "name": "RAG and knowledge systems",
    "target": 3
  },
  {
    "id": "agents",
    "name": "Agentic AI and LangGraph",
    "target": 3
  },
  {
    "id": "mcp",
    "name": "MCP",
    "target": 3
  },
  {
    "id": "eval",
    "name": "AI evaluation and observability",
    "target": 3
  },
  {
    "id": "security",
    "name": "AI security and governance",
    "target": 3
  },
  {
    "id": "architecture",
    "name": "Deployment and enterprise architecture",
    "target": 4
  }
];

export const LEVELS = [
  { level: 0, name: "Not started" },
  { level: 1, name: "Awareness" },
  { level: 2, name: "Working proficiency" },
  { level: 3, name: "Strong independent capability" },
  { level: 4, name: "Mastery and design judgement" },
] as const;

/** Delivery steps inside the portfolio projects. */
export const MILESTONES: MilestoneDef[] = [
  {
    "id": "ls-01",
    "order": 1,
    "phase": "p1",
    "title": "Python engineering and validation",
    "businessProblem": "Month-end reconciliation files arrive in inconsistent shapes and are checked by hand.",
    "technicalObjective": "A structured Python package that loads, validates and logs ledger and bank extracts.",
    "completionCriteria": "Invalid rows are rejected with reasons; pytest suite covers validators; logging is configurable.",
    "project": "P1"
  },
  {
    "id": "ls-02",
    "order": 2,
    "phase": "p1",
    "title": "Database and data access",
    "businessProblem": "Reconciliation history lives in spreadsheets and cannot be queried.",
    "technicalObjective": "PostgreSQL schema for entities, accounts, transactions and matches, with a data-access layer.",
    "completionCriteria": "Constraints enforce integrity; window-function reports reproduce a known month; tests use a test database.",
    "project": "P1"
  },
  {
    "id": "ls-03",
    "order": 3,
    "phase": "p3",
    "title": "APIs and integrations",
    "businessProblem": "Finance colleagues need reconciliation status without opening files.",
    "technicalObjective": "FastAPI service with authenticated endpoints, idempotent imports and webhooks.",
    "completionCriteria": "OpenAPI documented; auth enforced; re-posting the same import is a no-op; API tests pass.",
    "project": "P5"
  },
  {
    "id": "ls-04",
    "order": 4,
    "phase": "p3",
    "title": "LLM-powered analysis",
    "businessProblem": "Explaining unmatched items and variances takes analysts hours each close.",
    "technicalObjective": "LLM analysis that returns schema-validated variance explanations with cost and latency logged.",
    "completionCriteria": "Outputs validate against a JSON schema; failures retry or degrade; per-call cost is recorded.",
    "project": "P4"
  },
  {
    "id": "ls-05",
    "order": 5,
    "phase": "p3",
    "title": "RAG and knowledge retrieval",
    "businessProblem": "Accounting policies and close procedures are scattered across PDFs.",
    "technicalObjective": "pgvector knowledge assistant over approved policy documents with citations.",
    "completionCriteria": "Answers cite exact chunks; access filters respected; a retrieval eval set reports recall.",
    "project": "P3"
  },
  {
    "id": "ls-06",
    "order": 6,
    "phase": "p4",
    "title": "Agent workflows",
    "businessProblem": "Exception investigation follows the same evidence-gathering steps every month.",
    "technicalObjective": "LangGraph agent that investigates exceptions, gathers evidence and recommends actions.",
    "completionCriteria": "State persists across interrupts; consequential actions wait for human approval; runs are replayable.",
    "project": "P4"
  },
  {
    "id": "ls-07",
    "order": 7,
    "phase": "p4",
    "title": "MCP tools",
    "businessProblem": "Each new tool integration is bespoke and hard to govern.",
    "technicalObjective": "An MCP server exposing ledger lookups and match proposals with permission boundaries.",
    "completionCriteria": "Tools, resources and prompts declared; read and write tools separated; client integration tested.",
    "project": "P4"
  },
  {
    "id": "ls-08",
    "order": 8,
    "phase": "p4",
    "title": "Evaluation and observability",
    "businessProblem": "Nobody can say whether a prompt change made the analysis better or worse.",
    "technicalObjective": "Golden datasets, automated evals and LangSmith tracing across the pipeline.",
    "completionCriteria": "Regression suite runs in CI with thresholds; traces show cost, tokens and latency per run.",
    "project": "P5"
  },
  {
    "id": "ls-09",
    "order": 9,
    "phase": "p5",
    "title": "Security and access control",
    "businessProblem": "Finance data is sensitive and entity access must be restricted.",
    "technicalObjective": "RBAC, input/output validation, prompt-injection defences and audit logging.",
    "completionCriteria": "OWASP LLM Top 10 threat model written; injection tests pass; every action is audited.",
    "project": "P5"
  },
  {
    "id": "ls-10",
    "order": 10,
    "phase": "p6",
    "title": "Enterprise deployment and architecture",
    "businessProblem": "The solution must run as a supported departmental service.",
    "technicalObjective": "Azure Container Apps deployment with Entra ID, CI/CD, monitoring, C4 diagrams and ADRs.",
    "completionCriteria": "Deployed via pipeline with rollback; architecture defended in writing; runbook and operating model exist.",
    "project": "P5"
  }
];

const PATH: Omit<PhaseDef, "topics">[] = [
  {
    "id": "p1",
    "order": 1,
    "title": "Programming, SQL and databases",
    "months": [
      1,
      3
    ],
    "summary": "Write, test and debug real Python against a real PostgreSQL database, without leaning on an AI assistant to explain it.",
    "deliverable": "A small Python application on PostgreSQL with validation, logging and automated tests, in a repository someone else can run.",
    "exitGate": "Independently understand, modify, debug and test a small application you wrote.",
    "projects": [],
    "threads": {
      "security": "Secrets in environment variables, never in code; parameterised queries.",
      "testing": "pytest from the first validator onward.",
      "git": "Every exercise lives in a repository with feature branches.",
      "documentation": "A README that lets someone else run your project.",
      "architecture": "Why separate parsing, validation and storage."
    },
    "modules": [
      {
        "id": "programming",
        "title": "Programming",
        "topics": [
          {
            "id": "python-foundations",
            "title": "Python foundations",
            "objective": "Read, write and fix small Python programs yourself.",
            "summary": "The core language from your current level: data structures, functions, errors, files and JSON, plus reading tracebacks and working without an AI assistant.",
            "assignment": "Replace one VBA macro with a Python script: read a GL extract, total by account, and write a report. Write it without an AI assistant, then explain every line.",
            "why": "Everything later is built in Python, and you need to read and fix it yourself, not only prompt for it.",
            "finance": "Replace a VBA macro: read a GL extract, total by account and write a report.",
            "prerequisites": [],
            "skills": [
              "python"
            ],
            "subtopics": [
              "Python fundamentals where gaps exist",
              "Data structures and collections",
              "Functions and modular programming",
              "Exception handling",
              "File handling",
              "JSON processing",
              "Virtual environments",
              "Reading error messages and tracebacks",
              "Writing code without an AI assistant"
            ],
            "milestone": "ls-01",
            "project": null
          },
          {
            "id": "python-engineering",
            "title": "Python engineering",
            "objective": "Write modular, typed, testable Python that a colleague can read.",
            "summary": "Move from scripts to software: data structures, functions, classes and composition, errors, type hints, packaging, configuration and async basics.",
            "assignment": "Build the LedgerSync loader package: typed models for ledger and bank lines, a validator that rejects bad rows with reasons, configuration from environment variables, and a CLI entry point.",
            "why": "Moves you from scripts that work once to software that others can trust and change.",
            "finance": "Model ledger and budget lines as typed classes that validate themselves.",
            "prerequisites": [
              "python-foundations"
            ],
            "skills": [
              "python"
            ],
            "subtopics": [
              "Object-oriented programming",
              "Classes, inheritance and composition",
              "Type hints",
              "Modules and packages",
              "Decorators and generators concepts",
              "Dependency management",
              "Async programming fundamentals",
              "Environment variables",
              "Application configuration"
            ],
            "milestone": "ls-01",
            "project": null
          }
        ]
      },
      {
        "id": "engineering-habits",
        "title": "Engineering habits",
        "topics": [
          {
            "id": "software-engineering",
            "title": "Software engineering",
            "objective": "Work like an engineer: version control, tests, logs and code review.",
            "summary": "Git workflows, project structure, debugging and logging, and pytest with fixtures, parametrisation and mocks — plus critically reviewing AI-generated code.",
            "assignment": "Put LedgerSync under Git with a feature-branch workflow; reach meaningful pytest coverage of the validators using fixtures and parametrised cases; review one AI-generated function and record the defects you found.",
            "why": "Version control, tests and debugging are what separate an engineer from someone generating code.",
            "finance": "Test a variance calculation against a hand-checked month, so a change cannot silently alter a reported number.",
            "prerequisites": [
              "python-foundations"
            ],
            "skills": [
              "python"
            ],
            "subtopics": [
              "Git and GitHub",
              "Branching and merging",
              "Project structure",
              "Debugging",
              "Logging",
              "pytest",
              "Fixtures",
              "Parameterised tests",
              "Mocking",
              "Code quality",
              "Reading and reviewing AI-generated code"
            ],
            "milestone": "ls-01",
            "project": null
          }
        ]
      },
      {
        "id": "databases",
        "title": "Databases",
        "topics": [
          {
            "id": "sql-foundations",
            "title": "SQL and database foundations",
            "objective": "Model, query and protect relational data in PostgreSQL.",
            "summary": "Querying from joins to window functions, relational modelling with keys and constraints, transactions, indexing and connecting from Python.",
            "assignment": "Design the LedgerSync schema in PostgreSQL; write an anti-join that finds unmatched transactions and a window-function report of running balances; load data from Python inside a transaction.",
            "why": "Finance data lives in relational systems, and every later phase queries it.",
            "finance": "Find unmatched transactions with an anti-join and build running balances with window functions.",
            "prerequisites": [
              "python-foundations"
            ],
            "skills": [
              "sql"
            ],
            "subtopics": [
              "SQL fundamentals and advanced querying",
              "Joins and anti-joins",
              "Aggregations",
              "CASE and NULL handling",
              "CTEs and subqueries",
              "Window functions",
              "PostgreSQL",
              "Relational data modelling",
              "Keys and constraints",
              "Transactions",
              "Indexing fundamentals",
              "Database connectivity"
            ],
            "milestone": "ls-02",
            "project": null
          }
        ]
      }
    ]
  },
  {
    "id": "p2",
    "order": 2,
    "title": "Data engineering and finance analytics",
    "months": [
      4,
      7
    ],
    "summary": "Take raw GL, budget and forecast data to a validated model and a working FP&A report.",
    "deliverable": "P1 and P2: a validated finance data foundation and an FP&A and commercial report built on it.",
    "exitGate": "Run a reproducible pipeline from raw extracts to a Power BI report, and prove its totals reconcile to source.",
    "projects": [
      "P1",
      "P2"
    ],
    "threads": {
      "security": "Synthetic or anonymised data only; row-level security in Power BI.",
      "testing": "Data validation rules and reconciliation checks that fail loudly.",
      "git": "Pipelines and notebooks under version control.",
      "documentation": "A data dictionary and a lineage note for every model.",
      "architecture": "Choosing PostgreSQL or Databricks for a workload, and saying why."
    },
    "modules": [
      {
        "id": "data-wrangling",
        "title": "Data wrangling",
        "topics": [
          {
            "id": "pandas-analysis",
            "title": "Pandas for finance data",
            "objective": "Clean and shape messy finance data confidently in pandas.",
            "summary": "DataFrames, cleaning and types, merging and reshaping, grouping, dates and periods, and when SQL is the better tool.",
            "assignment": "Take a messy trial balance and a chart of accounts, clean both, join them, and produce a monthly summary by account group that ties back to the source total.",
            "why": "The everyday tool for cleaning and shaping data before it reaches a model or a database.",
            "finance": "Reshape a messy trial balance and join it to a chart of accounts.",
            "prerequisites": [
              "python-engineering",
              "sql-foundations"
            ],
            "skills": [
              "python",
              "data"
            ],
            "subtopics": [
              "Selective pandas for loading and checking data",
              "DataFrames and indexing",
              "Cleaning and type conversion",
              "Merging and reshaping",
              "Grouping and aggregation",
              "Dates and period handling",
              "Pandas or SQL: choosing the right tool"
            ],
            "milestone": null,
            "project": null
          },
          {
            "id": "data-pipelines",
            "title": "Data ingestion and validation",
            "objective": "Build a pipeline you can rerun safely and trust.",
            "summary": "Extract, load and transform, incremental loads, schema validation, data quality rules, reconciliation checks, logging and safe reruns.",
            "assignment": "P1: load synthetic GL actuals, budgets and forecasts into PostgreSQL. Reject rows that break accounting rules, reconcile loaded totals to source, and prove a rerun changes nothing.",
            "why": "An AI system is only as trustworthy as the data pipeline underneath it.",
            "finance": "Load GL actuals, budgets and forecasts, rejecting rows that break accounting rules.",
            "prerequisites": [
              "pandas-analysis",
              "software-engineering"
            ],
            "skills": [
              "data"
            ],
            "subtopics": [
              "Extract, load and transform",
              "Incremental loads",
              "Schema validation",
              "Data quality rules",
              "Reconciliation checks",
              "Pipeline logging and reruns"
            ],
            "milestone": null,
            "project": "P1"
          }
        ]
      },
      {
        "id": "finance-data-platform",
        "title": "Finance data platform",
        "topics": [
          {
            "id": "finance-data-modelling",
            "title": "Finance data modelling",
            "objective": "Model finance data so reports and AI answers stay simple and correct.",
            "summary": "Facts and dimensions, star schemas, chart of accounts hierarchies, slowly changing dimensions, versions of actuals, budget and forecast, and currency and period conventions.",
            "assignment": "P1: design and build a star schema for GL, budget and forecast with entity, cost centre, account and period dimensions, including a Type 2 dimension and a data dictionary.",
            "why": "Good models make every report and AI answer simpler and more correct.",
            "finance": "Design facts and dimensions for GL, budget, forecast, entity, cost centre and period.",
            "prerequisites": [
              "data-pipelines"
            ],
            "skills": [
              "data",
              "sql"
            ],
            "subtopics": [
              "Facts and dimensions",
              "Star schemas",
              "Chart of accounts hierarchies",
              "Slowly changing dimensions",
              "Actuals, budget and forecast versions",
              "Currency and period conventions"
            ],
            "milestone": null,
            "project": "P1"
          },
          {
            "id": "databricks-pyspark",
            "title": "Databricks and PySpark",
            "objective": "Run finance data pipelines at scale on Databricks.",
            "summary": "Distributed processing, the Databricks workspace, PySpark DataFrames, Delta tables, the medallion architecture and scheduled jobs.",
            "assignment": "Rebuild the P1 pipeline as bronze, silver and gold Delta tables in PySpark, schedule it as a job, and write when you would choose this over PostgreSQL.",
            "why": "Enterprises run data at a scale a laptop and pandas cannot, and this is the primary platform in your stack.",
            "finance": "Rebuild the GL pipeline as bronze, silver and gold tables.",
            "prerequisites": [
              "finance-data-modelling"
            ],
            "skills": [
              "data"
            ],
            "subtopics": [
              "Distributed processing concepts",
              "Databricks workspace and notebooks",
              "PySpark DataFrames",
              "Delta tables",
              "Medallion architecture",
              "Jobs and scheduling"
            ],
            "milestone": null,
            "project": null
          }
        ]
      },
      {
        "id": "finance-analytics",
        "title": "Finance analytics",
        "topics": [
          {
            "id": "power-bi",
            "title": "Power BI",
            "objective": "Build a trustworthy Power BI model and report for finance.",
            "summary": "Power Query, semantic models, DAX measures, time intelligence, report design for finance and row-level security.",
            "assignment": "P2: build an actual-versus-budget report on your own semantic model, with DAX measures, year-to-date views and row-level security by entity.",
            "why": "It is how finance leaders actually see your work, and the model behind it is real engineering.",
            "finance": "Build an actual-versus-budget report on your own semantic model.",
            "prerequisites": [
              "finance-data-modelling"
            ],
            "skills": [
              "analytics"
            ],
            "subtopics": [
              "Power Query transformations",
              "Semantic models and relationships",
              "DAX measures",
              "Time intelligence",
              "Report design for finance",
              "Row-level security"
            ],
            "milestone": null,
            "project": "P2"
          },
          {
            "id": "fpa-analytics",
            "title": "FP&A and commercial analytics",
            "objective": "Turn finance judgement into repeatable analysis in code.",
            "summary": "Variance analysis in Python, price, volume and mix, forecasting and its accuracy, customer profitability and margin analytics.",
            "assignment": "P2: explain a margin movement through price, volume and mix, rank customers by profitability, and forecast next quarter with its measured accuracy.",
            "why": "This is where your finance judgement becomes a differentiator nobody else can copy.",
            "finance": "Explain margin movement through price, volume and mix.",
            "prerequisites": [
              "power-bi"
            ],
            "skills": [
              "analytics",
              "python"
            ],
            "subtopics": [
              "Variance analysis in code",
              "Price, volume and mix",
              "Forecasting methods",
              "Forecast accuracy",
              "Customer profitability",
              "Margin analytics"
            ],
            "milestone": null,
            "project": "P2"
          }
        ]
      }
    ]
  },
  {
    "id": "p3",
    "order": 3,
    "title": "Applied AI and RAG",
    "months": [
      8,
      11
    ],
    "summary": "Build a finance knowledge assistant that answers from approved documents with citations you can check.",
    "deliverable": "P3: a finance knowledge assistant that answers from approved documents with citations, access control and measured quality.",
    "exitGate": "Demonstrate retrieval quality, source grounding, access-aware search and measured answer quality.",
    "projects": [
      "P3"
    ],
    "threads": {
      "security": "Prompt injection basics and access-aware retrieval.",
      "testing": "Prompt test sets and retrieval evaluation.",
      "git": "Prompts are versioned like code.",
      "documentation": "Record what each model call costs and why it was chosen.",
      "architecture": "When RAG is the right answer, and when it is not."
    },
    "modules": [
      {
        "id": "llm-foundations",
        "title": "LLM foundations",
        "topics": [
          {
            "id": "llm-engineering",
            "title": "LLM engineering",
            "objective": "Call models deliberately: right model, right cost, structured and safe outputs.",
            "summary": "How LLMs work, tokens and context windows, model selection, sampling, cost and latency, provider APIs, streaming, structured outputs, tool calling and provider abstraction.",
            "assignment": "Add a variance-explanation endpoint that calls two providers behind one interface, validates output against a JSON schema, retries on rate limits and logs token cost per call.",
            "why": "You need to call models deliberately, knowing what they cost and how they fail.",
            "finance": "Generate a variance commentary as schema-validated output with its cost logged.",
            "prerequisites": [
              "python-engineering",
              "data-pipelines"
            ],
            "skills": [
              "llm",
              "structured"
            ],
            "subtopics": [
              "LLM architecture and fundamentals",
              "Tokens and context windows",
              "Model selection",
              "Temperature and sampling",
              "Context limitations",
              "Model cost and latency",
              "OpenAI APIs",
              "API authentication",
              "Streaming",
              "Structured outputs",
              "JSON schemas",
              "Function calling",
              "Tool calling",
              "Provider abstraction",
              "Model error handling",
              "Rate limits",
              "Azure OpenAI"
            ],
            "milestone": "ls-04",
            "project": null
          },
          {
            "id": "prompt-engineering",
            "title": "Prompt and context engineering",
            "objective": "Construct context and instructions that produce grounded, testable outputs.",
            "summary": "System instructions, prompt structure, few-shot examples, context construction, output constraints, grounding, prompt testing and injection basics.",
            "assignment": "Write a versioned prompt for variance analysis with few-shot examples drawn from real close scenarios, a test set of 20 cases, and two injection attempts that must fail.",
            "why": "Reliable output comes from the context you construct, not from clever wording.",
            "finance": "Write a tested prompt for variance analysis using real close scenarios.",
            "prerequisites": [
              "llm-engineering"
            ],
            "skills": [
              "prompt"
            ],
            "subtopics": [
              "System instructions",
              "Prompt structure",
              "Few-shot prompting",
              "Context construction",
              "Output constraints",
              "Grounding",
              "Prompt testing",
              "Prompt injection fundamentals"
            ],
            "milestone": "ls-04",
            "project": null
          }
        ]
      },
      {
        "id": "api-essentials-module",
        "title": "Serving AI",
        "topics": [
          {
            "id": "api-essentials",
            "title": "API essentials",
            "objective": "Serve your work through a validated, tested HTTP API.",
            "summary": "HTTP and REST, FastAPI, Pydantic validation, routing, error handling and API testing. Production depth follows in phase 5.",
            "assignment": "Expose variance results through a FastAPI service with validated requests, consistent errors and an API test suite.",
            "why": "P3 needs an access-controlled service and P4 needs tools, so the basics cannot wait for phase 5.",
            "finance": "Expose variance results through a validated FastAPI endpoint.",
            "prerequisites": [
              "python-engineering",
              "sql-foundations"
            ],
            "skills": [
              "apis"
            ],
            "subtopics": [
              "HTTP fundamentals",
              "REST architecture",
              "FastAPI",
              "Pydantic",
              "Request and response validation",
              "API routing",
              "Error handling",
              "API testing"
            ],
            "milestone": "ls-03",
            "project": null
          }
        ]
      },
      {
        "id": "rag",
        "title": "Knowledge systems",
        "topics": [
          {
            "id": "knowledge-ingestion",
            "title": "Knowledge ingestion",
            "objective": "Turn messy documents into clean, attributed, searchable chunks.",
            "summary": "PDF and document extraction, normalisation, metadata, ingestion pipelines and structured-data ingestion.",
            "assignment": "Ingest a set of accounting-policy PDFs and a close checklist spreadsheet into normalised chunks carrying source, page, owner and access metadata.",
            "why": "Retrieval cannot recover what ingestion lost.",
            "finance": "Ingest accounting policies and close checklists with source and owner metadata.",
            "prerequisites": [
              "python-engineering",
              "llm-engineering"
            ],
            "skills": [
              "rag"
            ],
            "subtopics": [
              "PDF extraction",
              "Document processing",
              "Text normalisation",
              "Metadata extraction",
              "Document ingestion pipelines",
              "Excel, CSV and structured-data ingestion"
            ],
            "milestone": "ls-05",
            "project": "P3"
          },
          {
            "id": "retrieval-engineering",
            "title": "Retrieval engineering",
            "objective": "Retrieve the right passages, measurably.",
            "summary": "Embeddings, similarity search, chunking strategies, metadata filters, pgvector, semantic and hybrid search, reranking fundamentals.",
            "assignment": "Index the policy chunks in pgvector; compare two chunking strategies and semantic versus hybrid search on a 30-question retrieval set; record recall@5 for each.",
            "why": "Answer quality is mostly retrieval quality, and it can be measured.",
            "finance": "Measure which chunking finds the right policy paragraph most often.",
            "prerequisites": [
              "sql-foundations",
              "knowledge-ingestion"
            ],
            "skills": [
              "rag",
              "sql"
            ],
            "subtopics": [
              "Embeddings",
              "Vector representations",
              "Similarity search",
              "Chunking strategies",
              "Metadata filtering",
              "PostgreSQL with pgvector",
              "Semantic search",
              "Hybrid search",
              "Reranking fundamentals"
            ],
            "milestone": "ls-05",
            "project": "P3"
          },
          {
            "id": "rag-architecture",
            "title": "RAG architecture",
            "objective": "Ground generation in retrieved sources and prove it.",
            "summary": "Retrieval pipelines, context assembly, grounded generation, citations, access-aware retrieval, retrieval quality, RAG evaluation and failure analysis.",
            "assignment": "Ship the policy assistant: answers with chunk-level citations, refusal when sources are missing, entity-based access filters, and a written failure analysis of ten wrong answers.",
            "why": "A finance answer without a checkable source cannot be trusted.",
            "finance": "A policy assistant that cites the paragraph, respects entity access and refuses when unsure.",
            "prerequisites": [
              "retrieval-engineering",
              "prompt-engineering",
              "api-essentials"
            ],
            "skills": [
              "rag",
              "eval"
            ],
            "subtopics": [
              "Retrieval pipelines",
              "Context assembly",
              "Grounded generation",
              "Source citations",
              "Document references",
              "Access-aware retrieval",
              "Retrieval quality",
              "RAG evaluation",
              "Failure analysis"
            ],
            "milestone": "ls-05",
            "project": "P3"
          }
        ]
      }
    ]
  },
  {
    "id": "p4",
    "order": 4,
    "title": "AI agents and evaluation",
    "months": [
      12,
      15
    ],
    "summary": "Build a stateful finance agent with controlled tools, human approval and measured quality.",
    "deliverable": "P4: a finance workflow agent with controlled tools, human approval, an audit trail and repeatable evaluation.",
    "exitGate": "Demonstrate an observable agent workflow with persistence, human approval and repeatable evaluation.",
    "projects": [
      "P4"
    ],
    "threads": {
      "security": "Tool permissions, approval gates and audit trails.",
      "testing": "Agent tests, failure injection and regression evaluation.",
      "git": "Evaluation runs tied to the commit that produced them.",
      "documentation": "A design note for each agent: what is fixed, what is agentic, where a human approves.",
      "architecture": "Workflow or agent: deciding, and defending the decision."
    },
    "modules": [
      {
        "id": "agents",
        "title": "Agents",
        "topics": [
          {
            "id": "agent-engineering",
            "title": "Agent engineering",
            "objective": "Know when to build a workflow and when an agent, and build either well.",
            "summary": "Workflows versus agents, agent loops, planning, tool selection, state, context and memory, human-in-the-loop and recovery.",
            "assignment": "Write a one-page design for the exception-investigation agent: which steps are fixed workflow, which are agentic, which tools exist and where a human must approve.",
            "why": "Most tasks need a workflow, not an agent, and knowing the difference is architecture.",
            "finance": "Design a variance investigation: fixed steps, agentic steps and human approval.",
            "prerequisites": [
              "rag-architecture"
            ],
            "skills": [
              "agents",
              "structured"
            ],
            "subtopics": [
              "Workflows versus agents",
              "Agent loops",
              "Planning and execution",
              "Tool selection",
              "Tool calling",
              "State management",
              "Context management",
              "Memory",
              "Human-in-the-loop",
              "Workflow orchestration",
              "Failure recovery"
            ],
            "milestone": "ls-06",
            "project": "P4"
          },
          {
            "id": "langgraph",
            "title": "LangGraph",
            "objective": "Implement durable, interruptible graphs.",
            "summary": "Nodes, edges and state, conditional routing, checkpointing and persistence, interrupts and approval, long-running and resumable workflows, testing.",
            "assignment": "Implement the investigation agent in LangGraph with a Postgres checkpointer, an approval interrupt before any write, and tests that resume a run after a simulated crash.",
            "why": "Real work is long-running and interruptible, so state has to survive.",
            "finance": "A reconciliation agent that pauses for approval and resumes after a crash.",
            "prerequisites": [
              "agent-engineering"
            ],
            "skills": [
              "agents"
            ],
            "subtopics": [
              "Nodes and edges",
              "Graph state",
              "Conditional routing",
              "Checkpointing",
              "Persistence",
              "Interrupts",
              "Human approval",
              "Long-running workflows",
              "Recovery and resumability",
              "Agent testing"
            ],
            "milestone": "ls-06",
            "project": "P4"
          },
          {
            "id": "mcp",
            "title": "MCP",
            "objective": "Expose and consume tools through the Model Context Protocol safely.",
            "summary": "MCP architecture (hosts, clients, servers), tools, resources and prompts, server and client development, authentication and permission boundaries.",
            "assignment": "Build a LedgerSync MCP server with read-only lookup tools, a separately permissioned match-proposal tool, and connect it to the LangGraph agent and one desktop client.",
            "why": "A standard way to give agents tools, inside permission boundaries.",
            "finance": "Read-only ledger lookups, and a separately permissioned proposal tool.",
            "prerequisites": [
              "api-essentials",
              "agent-engineering"
            ],
            "skills": [
              "mcp"
            ],
            "subtopics": [
              "MCP architecture",
              "Hosts, clients and servers",
              "Tools",
              "Resources",
              "Prompts",
              "Server development",
              "Client integration",
              "Authentication and permission boundaries",
              "MCP integration with applications and agents"
            ],
            "milestone": "ls-07",
            "project": null
          },
          {
            "id": "reliable-agents",
            "title": "Reliable agent execution",
            "objective": "Make agent actions safe, auditable and repeatable.",
            "summary": "Tool permissions, approval gates, input validation, idempotency, retries, audit trails, safe execution and failure handling.",
            "assignment": "Add an audit trail for every tool call, idempotency keys on write tools, and a failure-injection test that proves no action is executed twice or without approval.",
            "why": "In finance an agent must never act twice or act unapproved.",
            "finance": "An audit trail for every action, sufficient for a controller's review.",
            "prerequisites": [
              "langgraph",
              "mcp"
            ],
            "skills": [
              "agents",
              "security"
            ],
            "subtopics": [
              "Tool permissions",
              "Approval gates",
              "Input validation",
              "Idempotency",
              "Retries",
              "Audit trails",
              "Safe execution",
              "Failure handling"
            ],
            "milestone": "ls-07",
            "project": "P4"
          }
        ]
      },
      {
        "id": "evaluation",
        "title": "Evaluation",
        "topics": [
          {
            "id": "observability",
            "title": "AI observability",
            "objective": "See what every AI call did, cost and took.",
            "summary": "LangSmith tracing, prompt versioning, token and cost tracking, latency monitoring, error analysis and performance monitoring.",
            "assignment": "Instrument LedgerSync with LangSmith traces across API, RAG and agent; version prompts; produce a weekly cost and latency summary from real traces.",
            "why": "You cannot improve or defend what you cannot see.",
            "finance": "Show cost, latency and tokens per reconciliation run.",
            "prerequisites": [
              "llm-engineering"
            ],
            "skills": [
              "eval"
            ],
            "subtopics": [
              "Tracing",
              "Prompt versioning",
              "Token usage",
              "Cost tracking",
              "Latency monitoring",
              "Error analysis",
              "Performance monitoring",
              "LangSmith"
            ],
            "milestone": "ls-08",
            "project": null
          },
          {
            "id": "ai-evaluation",
            "title": "AI evaluation",
            "objective": "Measure AI quality with datasets and thresholds, not impressions.",
            "summary": "Evaluation fundamentals, golden datasets, test design, deterministic checks, LLM-as-judge, RAG and agent-trajectory evaluation, regression testing and automation.",
            "assignment": "Build golden datasets for variance analysis, policy Q&A and the agent; automate deterministic and judge-based evals with pass thresholds that block a regression.",
            "why": "Quality has to be measured against datasets and thresholds, not impressions.",
            "finance": "A golden dataset of past variances that blocks a worse prompt.",
            "prerequisites": [
              "rag-architecture",
              "langgraph",
              "observability"
            ],
            "skills": [
              "eval"
            ],
            "subtopics": [
              "Evaluation fundamentals",
              "Golden datasets",
              "Test-case design",
              "Deterministic evaluation",
              "LLM-as-judge",
              "RAG evaluation",
              "Agent trajectory evaluation",
              "Regression testing",
              "Quality thresholds",
              "Evaluation automation"
            ],
            "milestone": "ls-08",
            "project": "P4"
          },
          {
            "id": "advanced-rag-agents",
            "title": "Advanced RAG and agent design",
            "objective": "Optimise retrieval and agents against measured quality, cost and latency.",
            "summary": "Retrieval optimisation, hybrid retrieval and reranking, query transformation, agent evaluation, workflow optimisation, approval design, tool reliability, cost and latency optimisation.",
            "assignment": "Use the eval suite to improve one RAG and one agent metric by a measured amount while holding cost per run flat; record before and after.",
            "why": "With evaluation in place, you can improve quality and prove it.",
            "finance": "Improve one measured metric while holding cost per close run flat.",
            "prerequisites": [
              "rag-architecture",
              "ai-evaluation"
            ],
            "skills": [
              "rag",
              "agents"
            ],
            "subtopics": [
              "Retrieval optimisation",
              "Hybrid retrieval",
              "Reranking",
              "Query transformation",
              "Agent evaluation",
              "Workflow optimisation",
              "Human approval design",
              "Tool reliability",
              "Cost and latency optimisation"
            ],
            "milestone": "ls-10",
            "project": null
          }
        ]
      }
    ]
  },
  {
    "id": "p5",
    "order": 5,
    "title": "Software engineering, integration and cloud",
    "months": [
      16,
      20
    ],
    "summary": "Run a secured, integrated solution on Azure through a repeatable delivery pipeline.",
    "deliverable": "P5, part one: the reference solution running on Azure through a repeatable pipeline, with infrastructure as code and tracing.",
    "exitGate": "Deploy through a pipeline with rollback, infrastructure as code, tracing and a tested recovery.",
    "projects": [
      "P5"
    ],
    "threads": {
      "security": "OWASP LLM Top 10, least privilege, secrets management.",
      "testing": "Tests run in the pipeline and block a deploy.",
      "git": "Pull requests, protected branches and GitHub Actions.",
      "documentation": "Runbooks and incident reviews.",
      "architecture": "Service boundaries, and the failure modes of each dependency."
    },
    "modules": [
      {
        "id": "production-backend",
        "title": "Production backend",
        "topics": [
          {
            "id": "backend-engineering",
            "title": "Backend engineering",
            "objective": "Move an API from a demo to something that survives real use.",
            "summary": "Dependency injection, SQLAlchemy and Alembic, OAuth2, JWT and OIDC fundamentals, webhooks, retries and idempotency.",
            "assignment": "Wrap LedgerSync in FastAPI: authenticated endpoints for imports and match status, Alembic migrations, an idempotency key on imports, and an API test suite.",
            "why": "Moves your API from a demo to something that survives real use.",
            "finance": "Idempotent imports, so re-posting a journal file cannot double-count it.",
            "prerequisites": [
              "api-essentials"
            ],
            "skills": [
              "apis"
            ],
            "subtopics": [
              "Dependency injection",
              "SQLAlchemy",
              "Alembic",
              "Authentication",
              "OAuth2",
              "JWT",
              "OIDC fundamentals",
              "Webhooks",
              "Retries",
              "Idempotency"
            ],
            "milestone": "ls-03",
            "project": null
          },
          {
            "id": "ai-security",
            "title": "Security",
            "objective": "Threat-model and defend an LLM application.",
            "summary": "OWASP LLM Top 10, direct and indirect prompt injection, data exposure and leakage, RBAC and least privilege, secrets, validation, access-controlled retrieval and audit logging.",
            "assignment": "Write a threat model mapped to the OWASP LLM Top 10; add RBAC per entity; plant an indirect injection in a policy document and prove the assistant does not follow it.",
            "why": "Finance data is sensitive, and LLMs add new ways for it to leak.",
            "finance": "Plant an injection in a policy document and prove the assistant ignores it.",
            "prerequisites": [
              "backend-engineering",
              "rag-architecture"
            ],
            "skills": [
              "security"
            ],
            "subtopics": [
              "OWASP LLM Top 10",
              "Direct prompt injection",
              "Indirect prompt injection",
              "Sensitive data exposure",
              "Data leakage",
              "RBAC",
              "Least privilege",
              "Secrets management",
              "Input and output validation",
              "Access-controlled retrieval",
              "Audit logging"
            ],
            "milestone": "ls-09",
            "project": null
          },
          {
            "id": "enterprise-integrations",
            "title": "Enterprise integrations",
            "objective": "Connect safely to the systems a department already runs.",
            "summary": "Identity providers, external APIs, webhooks, business application integrations, enterprise data sources, permission-aware tool access and system-to-system communication.",
            "assignment": "Integrate a second real data source (for example an ERP extract or a banking feed sandbox) with service-to-service auth and permission-aware tool access.",
            "why": "Real value sits in the systems a business already runs.",
            "finance": "Connect to an ERP-style extract with service-to-service authentication.",
            "prerequisites": [
              "backend-engineering",
              "ai-security"
            ],
            "skills": [
              "apis",
              "security"
            ],
            "subtopics": [
              "Identity providers",
              "External APIs",
              "Webhooks",
              "Business application integrations",
              "Enterprise data sources",
              "Permission-aware tool access",
              "System-to-system communication"
            ],
            "milestone": "ls-10",
            "project": "P5"
          }
        ]
      },
      {
        "id": "delivery",
        "title": "Delivery and cloud",
        "topics": [
          {
            "id": "deployment-foundations",
            "title": "Deployment foundations",
            "objective": "Package and run the application outside your laptop.",
            "summary": "Linux and CLI, Docker and containerisation, environment configuration, cloud and CI/CD fundamentals, automated testing before deployment, monitoring and recovery.",
            "assignment": "Containerise LedgerSync with Docker Compose (API, Postgres, worker), run tests in CI before a deploy step, and document a restore-from-backup drill you actually performed.",
            "why": "Nothing delivers value while it runs only on your laptop.",
            "finance": "Run the reconciliation stack in containers and rehearse a restore.",
            "prerequisites": [
              "software-engineering",
              "backend-engineering"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Linux and CLI fundamentals",
              "Docker",
              "Containerisation",
              "Environment configuration",
              "Cloud deployment fundamentals",
              "CI/CD fundamentals",
              "Automated testing before deployment",
              "Application monitoring",
              "Basic recovery procedures"
            ],
            "milestone": "ls-09",
            "project": null
          },
          {
            "id": "cloud-production",
            "title": "Cloud and production",
            "objective": "Run the solution on Azure with a real delivery pipeline.",
            "summary": "Azure fundamentals, Container Apps, managed PostgreSQL, GitHub Actions CI/CD, environment separation, secrets, deployment strategies, rollbacks and production monitoring.",
            "assignment": "Deploy LedgerSync to Azure Container Apps with managed PostgreSQL via GitHub Actions, separate dev and prod, and perform a rollback on purpose.",
            "why": "Azure is your primary cloud, and owning production is the job.",
            "finance": "Deploy with separate dev and prod, then roll back on purpose.",
            "prerequisites": [
              "deployment-foundations"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Azure fundamentals",
              "Azure Container Apps",
              "Managed PostgreSQL",
              "GitHub Actions",
              "CI/CD pipelines",
              "Environment separation",
              "Secrets management",
              "Deployment strategies",
              "Rollbacks",
              "Production monitoring",
              "Azure architecture patterns"
            ],
            "milestone": "ls-10",
            "project": "P5"
          },
          {
            "id": "infrastructure-as-code",
            "title": "Infrastructure as code",
            "objective": "Rebuild your environment from code, with every change reviewed.",
            "summary": "Terraform fundamentals, state and backends, modules and environments, Azure resources, and reviewing and applying changes.",
            "assignment": "P5: define the Azure resources in Terraform with remote state and separate dev and prod environments, then destroy and rebuild dev from code.",
            "why": "Repeatable environments are how you pass audit and recover quickly.",
            "finance": "Rebuild the finance environment from code, with every change reviewed.",
            "prerequisites": [
              "cloud-production"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Terraform fundamentals",
              "State and backends",
              "Modules and environments",
              "Azure resources with Terraform",
              "Reviewing and applying changes"
            ],
            "milestone": null,
            "project": "P5"
          }
        ]
      },
      {
        "id": "operating",
        "title": "Operating the system",
        "topics": [
          {
            "id": "telemetry",
            "title": "Telemetry and monitoring",
            "objective": "See what the whole system is doing, not only the model.",
            "summary": "OpenTelemetry fundamentals, traces, metrics and logs, instrumenting FastAPI, dashboards, alerts and service-level objectives.",
            "assignment": "P5: instrument the reference solution with OpenTelemetry, trace one month-end run from upload to answer, and set one service-level objective with an alert.",
            "why": "Production problems must be seen across the whole system, not only the model.",
            "finance": "Trace one month-end run from upload to answer.",
            "prerequisites": [
              "deployment-foundations",
              "observability"
            ],
            "skills": [
              "eval",
              "architecture"
            ],
            "subtopics": [
              "OpenTelemetry fundamentals",
              "Traces, metrics and logs",
              "Instrumenting a FastAPI service",
              "Dashboards and alerts",
              "Service-level objectives"
            ],
            "milestone": null,
            "project": "P5"
          },
          {
            "id": "reliability-engineering",
            "title": "Reliability engineering",
            "objective": "Keep the solution working when its dependencies fail.",
            "summary": "Retries and backoff, idempotency, timeouts, rate limiting, model fallback, circuit breakers, state recovery, backups, incidents and runbooks.",
            "assignment": "Add timeouts, backoff, a model fallback and a circuit breaker around the LLM provider; run a game-day where the provider fails and write the incident review and runbook.",
            "why": "A close cannot wait because a model provider is down.",
            "finance": "Fall back cleanly during a simulated outage at month end.",
            "prerequisites": [
              "deployment-foundations",
              "reliable-agents"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Retries and backoff",
              "Idempotency",
              "Timeouts",
              "Rate limiting",
              "Model fallback",
              "Circuit breakers",
              "State recovery",
              "Backups and restores",
              "Incident handling",
              "Operational runbooks"
            ],
            "milestone": "ls-10",
            "project": null
          }
        ]
      }
    ]
  },
  {
    "id": "p6",
    "order": 6,
    "title": "Enterprise AI solutions architecture",
    "months": [
      21,
      24
    ],
    "summary": "Design, defend, deploy and operate an enterprise AI solution, explaining its trade-offs in cost, security and business value.",
    "deliverable": "P5, part two: the reference solution's architecture, governance and business case, defended to a technical reviewer and a finance executive.",
    "exitGate": "Defend the reference solution's decisions to a technical reviewer and to a finance executive.",
    "projects": [
      "P5"
    ],
    "threads": {
      "security": "Identity, tenant isolation and access reviews.",
      "testing": "Disaster-recovery and load tests with recorded results.",
      "git": "Architecture decisions stored and reviewed beside the code.",
      "documentation": "C4 diagrams, ADRs and the operating model.",
      "architecture": "Architecture as a decision-making discipline, with alternatives weighed."
    },
    "modules": [
      {
        "id": "architecture-practice",
        "title": "Architecture practice",
        "topics": [
          {
            "id": "architecture-foundations",
            "title": "Requirements and architecture thinking",
            "objective": "Start architecture from what the business actually needs.",
            "summary": "Requirements engineering, functional and non-functional requirements, stakeholders and constraints, and quality attribute trade-offs.",
            "assignment": "P5: turn a CFO's request into a requirements document with testable functional and non-functional requirements, named stakeholders and stated constraints.",
            "why": "Architecture starts from what the business needs, not from technology names.",
            "finance": "Turn a CFO's request into testable functional and non-functional requirements.",
            "prerequisites": [
              "reliability-engineering"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Requirements engineering",
              "Functional and non-functional requirements",
              "Stakeholders and constraints",
              "Quality attribute trade-offs"
            ],
            "milestone": null,
            "project": "P5"
          },
          {
            "id": "enterprise-architecture",
            "title": "Enterprise architecture",
            "objective": "Communicate and defend architecture decisions to engineers and executives.",
            "summary": "System design, C4 diagrams, ADRs, components, data flows, API boundaries, build versus buy, scalability, reliability, maintainability, cost and latency trade-offs, technical debt.",
            "assignment": "Produce C4 context, container and component diagrams for LedgerSync, five ADRs including one build-versus-buy decision, and present them to a peer for challenge.",
            "why": "You will have to explain and defend decisions to engineers and to executives.",
            "finance": "Justify build versus buy for a reconciliation tool.",
            "prerequisites": [
              "architecture-foundations"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "System design",
              "C4 diagrams",
              "Architecture Decision Records",
              "Component architecture",
              "Data flows",
              "API boundaries",
              "Build versus buy",
              "Scalability",
              "Reliability",
              "Maintainability",
              "Cost and latency trade-offs",
              "Technical debt"
            ],
            "milestone": "ls-10",
            "project": "P5"
          },
          {
            "id": "advanced-architecture",
            "title": "Application architecture",
            "objective": "Draw and defend service boundaries.",
            "summary": "Modular architecture, service boundaries, separation of concerns, API architecture, event-driven integration, background and asynchronous workflows, orchestration and integration patterns.",
            "assignment": "Split LedgerSync's long-running imports and agent runs into background workers with a queue; write an ADR justifying the boundaries you chose.",
            "why": "Boundaries decide what stays easy to change.",
            "finance": "Move long imports and agent runs into background workers.",
            "prerequisites": [
              "architecture-foundations"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Modular architecture",
              "Service boundaries",
              "Separation of concerns",
              "API architecture",
              "Event-driven integration concepts",
              "Background processing",
              "Asynchronous workflows",
              "Workflow orchestration",
              "Data and application integration patterns"
            ],
            "milestone": "ls-10",
            "project": null
          },
          {
            "id": "data-architecture",
            "title": "Data architecture",
            "objective": "Make data decisions that outlive the applications built on them.",
            "summary": "Data domains and ownership, operational and analytical stores, lineage, data contracts and master data for finance.",
            "assignment": "Map the data domains of your reference solution: owners, stores, lineage for one reported number, and one data contract between producer and consumer.",
            "why": "Data decisions outlive every application built on them.",
            "finance": "Decide where finance master data lives and who owns it.",
            "prerequisites": [
              "architecture-foundations",
              "databricks-pyspark"
            ],
            "skills": [
              "architecture",
              "data"
            ],
            "subtopics": [
              "Data domains and ownership",
              "Operational and analytical stores",
              "Data lineage",
              "Data contracts",
              "Master data for finance"
            ],
            "milestone": null,
            "project": null
          }
        ]
      },
      {
        "id": "enterprise-foundations",
        "title": "Enterprise foundations",
        "topics": [
          {
            "id": "network-fundamentals",
            "title": "Network fundamentals",
            "objective": "Follow how traffic flows, and keep finance data off the public internet.",
            "summary": "IP, DNS and TLS, virtual networks and subnets, private endpoints, firewalls and gateways.",
            "assignment": "Draw the network path of the reference solution and move its database behind a private endpoint, proving it is unreachable from the public internet.",
            "why": "Enterprise security reviews begin with how traffic flows.",
            "finance": "Keep the finance database off the public internet.",
            "prerequisites": [
              "cloud-production"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "IP, DNS and TLS",
              "Virtual networks and subnets",
              "Private endpoints",
              "Firewalls and gateways"
            ],
            "milestone": null,
            "project": null
          },
          {
            "id": "enterprise-identity",
            "title": "Enterprise identity and security",
            "objective": "Integrate with enterprise identity and prove access is right.",
            "summary": "Microsoft Entra ID, OAuth2 and OIDC integration, RBAC, tenant isolation, IAM, data security, auditability and secure integration patterns.",
            "assignment": "Replace local auth with Entra ID sign-in; map Entra groups to LedgerSync roles; run an access review and record the evidence.",
            "why": "In an enterprise, identity is the security boundary.",
            "finance": "Map Entra groups to finance roles and run an access review.",
            "prerequisites": [
              "ai-security",
              "enterprise-integrations"
            ],
            "skills": [
              "security"
            ],
            "subtopics": [
              "Microsoft Entra ID",
              "OAuth2 and OIDC integration",
              "RBAC",
              "Tenant isolation",
              "Identity and access management",
              "Data security",
              "Auditability",
              "Secure integration patterns"
            ],
            "milestone": "ls-10",
            "project": "P5"
          },
          {
            "id": "resilience-scale",
            "title": "Resilience and scale",
            "objective": "Agree recovery and load targets in advance, then test them.",
            "summary": "Disaster recovery, recovery objectives, scalability, and performance and load testing.",
            "assignment": "Set recovery objectives for the close process, run a restore against them, and load test month-end peak, recording the results.",
            "why": "Month end is a predictable peak, and recovery targets must be agreed in advance.",
            "finance": "Set recovery targets for the close process and test them.",
            "prerequisites": [
              "reliability-engineering"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "Disaster recovery",
              "Recovery objectives",
              "Scalability",
              "Performance and load testing"
            ],
            "milestone": null,
            "project": null
          }
        ]
      },
      {
        "id": "governance-value",
        "title": "Governance and value",
        "topics": [
          {
            "id": "ai-governance",
            "title": "AI governance and operating model",
            "objective": "Own the solution in production and prove its value.",
            "summary": "AI and data governance, responsible AI, privacy and compliance, model lifecycle, evaluation governance, access reviews, operational ownership, business value measurement and support.",
            "assignment": "Write the operating model: owners, model change process gated by evals, access-review cadence, support runbook, and a business-value measure (hours saved per close) tracked from real usage.",
            "why": "Owning AI in production means answering for it.",
            "finance": "A model change process gated by evaluation, fit for audit.",
            "prerequisites": [
              "ai-evaluation",
              "ai-security"
            ],
            "skills": [
              "security",
              "architecture"
            ],
            "subtopics": [
              "AI governance",
              "Data governance",
              "Responsible AI",
              "Privacy and compliance considerations",
              "Model lifecycle management",
              "Evaluation governance",
              "Access reviews",
              "Operational ownership",
              "Business value measurement",
              "Production support"
            ],
            "milestone": "ls-10",
            "project": "P5"
          },
          {
            "id": "finops-value",
            "title": "FinOps and business value",
            "objective": "Show what the solution costs and what it is worth.",
            "summary": "FinOps, total cost of ownership, ROI and business value, and cost allocation and showback.",
            "assignment": "P5: build the total cost of ownership and ROI case for the reference solution, using real usage figures, and present it as you would to a CFO.",
            "why": "This is where your finance background makes you unusual among architects.",
            "finance": "Build the total cost of ownership and ROI case for the reference solution.",
            "prerequisites": [
              "cloud-production",
              "ai-governance"
            ],
            "skills": [
              "architecture"
            ],
            "subtopics": [
              "FinOps",
              "Total cost of ownership",
              "ROI and business value",
              "Cost allocation and showback"
            ],
            "milestone": null,
            "project": "P5"
          }
        ]
      }
    ]
  }
];

export const PHASES: PhaseDef[] = PATH.map((p) => ({ ...p, topics: p.modules.flatMap((m) => m.topics) }));

/** PRD §11: where each item of the primary stack is first taught. */
export const STACK: { item: string; topic: string; subtopic: string }[] = [
  {
    "item": "Python",
    "topic": "python-foundations",
    "subtopic": "Python fundamentals where gaps exist"
  },
  {
    "item": "SQL",
    "topic": "sql-foundations",
    "subtopic": "SQL fundamentals and advanced querying"
  },
  {
    "item": "PostgreSQL",
    "topic": "sql-foundations",
    "subtopic": "PostgreSQL"
  },
  {
    "item": "Pandas",
    "topic": "pandas-analysis",
    "subtopic": "DataFrames and indexing"
  },
  {
    "item": "Databricks and PySpark",
    "topic": "databricks-pyspark",
    "subtopic": "PySpark DataFrames"
  },
  {
    "item": "Power BI",
    "topic": "power-bi",
    "subtopic": "Semantic models and relationships"
  },
  {
    "item": "FastAPI",
    "topic": "api-essentials",
    "subtopic": "FastAPI"
  },
  {
    "item": "OpenAI API / Azure OpenAI",
    "topic": "llm-engineering",
    "subtopic": "Azure OpenAI"
  },
  {
    "item": "pgvector",
    "topic": "retrieval-engineering",
    "subtopic": "PostgreSQL with pgvector"
  },
  {
    "item": "LangGraph",
    "topic": "langgraph",
    "subtopic": "Nodes and edges"
  },
  {
    "item": "REST APIs",
    "topic": "api-essentials",
    "subtopic": "REST architecture"
  },
  {
    "item": "MCP",
    "topic": "mcp",
    "subtopic": "MCP architecture"
  },
  {
    "item": "Microsoft Azure",
    "topic": "cloud-production",
    "subtopic": "Azure fundamentals"
  },
  {
    "item": "Docker",
    "topic": "deployment-foundations",
    "subtopic": "Docker"
  },
  {
    "item": "GitHub",
    "topic": "software-engineering",
    "subtopic": "Git and GitHub"
  },
  {
    "item": "GitHub Actions",
    "topic": "cloud-production",
    "subtopic": "GitHub Actions"
  },
  {
    "item": "LangSmith",
    "topic": "observability",
    "subtopic": "LangSmith"
  },
  {
    "item": "OpenTelemetry",
    "topic": "telemetry",
    "subtopic": "OpenTelemetry fundamentals"
  },
  {
    "item": "Terraform",
    "topic": "infrastructure-as-code",
    "subtopic": "Terraform fundamentals"
  }
];

/** PRD §12: the enterprise architecture coverage the curriculum must have. */
export const ARCHITECTURE_TRACK: { item: string; topic: string; subtopic: string }[] = [
  {
    "item": "Requirements engineering",
    "topic": "architecture-foundations",
    "subtopic": "Requirements engineering"
  },
  {
    "item": "Functional and non-functional requirements",
    "topic": "architecture-foundations",
    "subtopic": "Functional and non-functional requirements"
  },
  {
    "item": "Architecture diagrams",
    "topic": "enterprise-architecture",
    "subtopic": "System design"
  },
  {
    "item": "C4 model",
    "topic": "enterprise-architecture",
    "subtopic": "C4 diagrams"
  },
  {
    "item": "Architecture Decision Records",
    "topic": "enterprise-architecture",
    "subtopic": "Architecture Decision Records"
  },
  {
    "item": "Data architecture",
    "topic": "data-architecture",
    "subtopic": "Data domains and ownership"
  },
  {
    "item": "Application architecture",
    "topic": "advanced-architecture",
    "subtopic": "Modular architecture"
  },
  {
    "item": "Integration architecture",
    "topic": "enterprise-integrations",
    "subtopic": "Business application integrations"
  },
  {
    "item": "Cloud architecture",
    "topic": "cloud-production",
    "subtopic": "Azure architecture patterns"
  },
  {
    "item": "Identity and access management",
    "topic": "enterprise-identity",
    "subtopic": "Identity and access management"
  },
  {
    "item": "Network fundamentals",
    "topic": "network-fundamentals",
    "subtopic": "IP, DNS and TLS"
  },
  {
    "item": "Security and privacy",
    "topic": "ai-governance",
    "subtopic": "Privacy and compliance considerations"
  },
  {
    "item": "Reliability and disaster recovery",
    "topic": "resilience-scale",
    "subtopic": "Disaster recovery"
  },
  {
    "item": "Scalability and performance",
    "topic": "resilience-scale",
    "subtopic": "Scalability"
  },
  {
    "item": "Observability",
    "topic": "telemetry",
    "subtopic": "Traces, metrics and logs"
  },
  {
    "item": "AI governance",
    "topic": "ai-governance",
    "subtopic": "AI governance"
  },
  {
    "item": "AI evaluation",
    "topic": "ai-evaluation",
    "subtopic": "Evaluation fundamentals"
  },
  {
    "item": "FinOps",
    "topic": "finops-value",
    "subtopic": "FinOps"
  },
  {
    "item": "Total cost of ownership",
    "topic": "finops-value",
    "subtopic": "Total cost of ownership"
  },
  {
    "item": "ROI and business value",
    "topic": "finops-value",
    "subtopic": "ROI and business value"
  }
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
  "p1": "Python, SQL and databases",
  "p2": "Data and finance analytics",
  "p3": "Applied AI and RAG",
  "p4": "Agents and evaluation",
  "p5": "Engineering and cloud",
  "p6": "Enterprise architecture"
};
