/**
 * Stage 2 of docs/PRD.md §15: the primary YouTube video for each learning unit that did not
 * have one. Units already holding a video primary stay in lib/learning-map.ts.
 *
 * TRANSITIONAL with lib/blueprint.ts: Stage 3 folds both into the curriculum.
 *
 * A spec is "videoKey" or "videoKey@start-end", as in lib/learning-map.ts. Every video is
 * checked against its watch page by scripts/verify-videos.mjs (data/videos-verified.json).
 *
 * `null` means no video has earned the place yet. It always carries the reason, so the app
 * can show the unit as pending. A weak match is never used to fill a gap (PRD §5).
 */
export type UnitVideo =
  | { primary: string; alternative?: string; pending?: undefined }
  | { primary: null; alternative?: undefined; pending: string };

const v = (primary: string, alternative?: string): UnitVideo => ({ primary, alternative });
const pending = (reason: string): UnitVideo => ({ primary: null, pending: reason });

export const UNIT_VIDEOS: Record<string, Record<string, UnitVideo>> = {
  "python-foundations": {
    "Python fundamentals where gaps exist": pending("No single overview chosen yet. The next subtopics already teach each part with Corey Schafer's series."),
    "Reading error messages and tracebacks": pending("Search found no beginner lesson on this."),
    "Writing code without an AI assistant": pending("A practice habit rather than a video subject."),
  },
  "python-engineering": {
    "Environment variables": v("cs-env", "tc-env-win"),
    "Application configuration": v("fcc-api@8:53:53-9:21:20", "pd-settings"),
  },
  "software-engineering": {
    "Branching and merging": v("gh-branch", "ssd-branch"),
    "Project structure": v("ci-pytest@2:56-8:35"),
    "Code quality": v("ci-pytest@8:35-10:58"),
  },
  "sql-foundations": { PostgreSQL: v("fcc-api@2:24:11-3:12:10") },
  "pandas-analysis": {
    "DataFrames and indexing": v("at-pandas@0:30-41:33"),
    "Cleaning and type conversion": v("at-pandas@1:29:45-2:07:53"),
    "Merging and reshaping": v("at-pandas@52:12-1:13:29"),
    "Grouping and aggregation": v("at-pandas@41:33-52:12"),
    "Dates and period handling": v("cs-pandas-dates"),
    "Pandas or SQL: choosing the right tool": pending("Search found no lesson that compares them for this decision."),
  },
  "data-pipelines": {
    "Extract, load and transform": v("bw-dwh@9:41-20:29"),
    "Incremental loads": v("bi-incr", "al-dbx@3:58:42-4:05:56"),
    "Schema validation": v("cs-pydantic"),
    "Data quality rules": v("bi-gx"),
    "Reconciliation checks": pending("No lesson found. Finance-specific, and likely to be taught through your own exercise."),
    "Pipeline logging and reruns": pending("Not confirmed from any video's chapters."),
  },
  "finance-data-modelling": {
    "Facts and dimensions": v("bw-pbi@14:50-18:45"),
    "Star schemas": v("bw-pbi@18:45-27:42", "bw-dwh@3:32:17-3:34:06"),
    "Chart of accounts hierarchies": pending("Not yet searched for. Finance-specific."),
    "Slowly changing dimensions": v("ab-scd", "tc-scd"),
    "Actuals, budget and forecast versions": pending("Not yet searched for. Finance-specific."),
    "Currency and period conventions": pending("Not yet searched for. Finance-specific."),
  },
  "databricks-pyspark": {
    "Distributed processing concepts": v("al-dbx@7:01-19:38"),
    "Databricks workspace and notebooks": v("fp-dbx@2:55-7:40", "al-dbx@40:36-1:08:49"),
    "PySpark DataFrames": v("al-dbx@1:51:19-2:09:25"),
    "Delta tables": v("al-dbx@2:09:25-3:02:30", "al-delta"),
    "Medallion architecture": v("fp-dbx@13:55-17:15", "kk-medallion"),
    "Jobs and scheduling": v("al-dbx@4:05:56-4:14:35"),
  },
  "power-bi": {
    "Power Query transformations": v("dc-pbi@1:40:00-2:08:25"),
    "Semantic models and relationships": v("bw-pbi@27:42-1:02:47"),
    "DAX measures": v("dc-pbi@37:26-59:56"),
    "Time intelligence": v("dc-pbi@59:56-1:07:22"),
    "Report design for finance": v("dc-pbi@1:11:51-1:29:00", "gc-pbi"),
    "Row-level security": v("bw-pbi@2:08:58-2:40:08"),
  },
  "fpa-analytics": {
    "Variance analysis in code": pending("Search found finance explanations but no Python lesson."),
    "Price, volume and mix": v("kb-pvm", "zb-pvm"),
    "Forecasting methods": pending("Not confirmed. Search returned accuracy metrics, not methods."),
    "Forecast accuracy": v("sp-err"),
    "Customer profitability": pending("Search found margin dashboards, none on customer-level profitability."),
    "Margin analytics": v("kb-pvm-gm", "ed-margin"),
  },
  "llm-engineering": {
    "Model selection": v("routing"),
    "API authentication": v("sl7-aoai"),
    Streaming: v("rk-stream"),
    "JSON schemas": v("pydantic-llm"),
    "Tool calling": v("structured"),
    "Model error handling": v("backoff"),
    "Rate limits": v("backoff"),
    "Azure OpenAI": v("sl7-aoai"),
  },
  "prompt-engineering": {
    "Few-shot prompting": v("prompt101"),
    "Output constraints": v("pydantic-llm"),
    Grounding: pending("No lesson confirmed. Taught in practice under Grounded generation."),
  },
  "api-essentials": {
    "HTTP fundamentals": v("fcc-api@57:34-1:07:29", "wc-http"),
    "Error handling": pending("No section confirmed from chapters."),
  },
  "rag-architecture": { "Grounded generation": v("rag-scratch") },
  "agent-engineering": {
    "Tool selection": v("sysdesign@5:39-7:37"),
    "Tool calling": v("structured"),
  },
  langgraph: {
    "Nodes and edges": v("av-lg"),
    "Graph state": v("av-lg"),
    "Conditional routing": v("lg-102"),
    Checkpointing: v("cc-persist"),
    Persistence: v("cc-persist"),
    Interrupts: v("lc-interrupt", "hitl"),
  },
  mcp: {
    "Hosts, clients and servers": v("ld-mcp@2:23-5:30"),
    Resources: v("ld-mcp@21:21-26:49"),
    Prompts: v("ld-mcp@26:49-30:20"),
    "Authentication and permission boundaries": v("ld-mcp@1:21:10-1:35:13", "fcc-mcpsec"),
  },
  observability: { LangSmith: v("jb-lsmith") },
  "ai-evaluation": { "Deterministic evaluation": pending("The evals videos reviewed cover error analysis, not deterministic checks.") },
  "backend-engineering": {
    "Dependency injection": v("fcc-api@7:13:23-7:25:21"),
    Webhooks: v("wh-intro"),
  },
  "ai-security": {
    RBAC: v("sj-rbac", "pg-rbac"),
    "Secrets management": v("agent-sec@16:13-18:05", "kv-m365"),
  },
  "enterprise-integrations": {
    "External APIs": pending("The linked retry video does not teach integration, so it was not promoted."),
    Webhooks: v("fcc-webhooks"),
  },
  "deployment-foundations": { "Basic recovery procedures": pending("Not yet searched for separately.") },
  "cloud-production": {
    "Managed PostgreSQL": v("cn-pg"),
    "Environment separation": pending("Not yet searched for."),
    "Secrets management": v("kv-m365", "kv-full"),
    "Deployment strategies": v("cl-deploy", "sc-deploy"),
    Rollbacks: v("wv-rev", "mc-traffic"),
    "Azure architecture patterns": v("mr-waf"),
  },
  "infrastructure-as-code": {
    "Terraform fundamentals": v("aa-tf@0:00-27:56"),
    "State and backends": v("aa-tf@37:47-50:45", "ms-tf@1:17:00-1:27:16"),
    "Modules and environments": v("ms-tf@2:59:10-3:46:51"),
    "Azure resources with Terraform": v("ms-tf@46:04-1:04:35"),
    "Reviewing and applying changes": v("aa-tf@27:56-37:47"),
  },
  telemetry: {
    "OpenTelemetry fundamentals": v("ag-otel"),
    "Traces, metrics and logs": pending("No lesson found covering all three; logs were absent from every result."),
    "Instrumenting a FastAPI service": v("er-otel"),
    "Dashboards and alerts": v("jf-appins"),
    "Service-level objectives": v("sb-slo", "cf-slo"),
  },
  "reliability-engineering": {
    Timeouts: v("sd-cb@4:54-8:00"),
    "Rate limiting": pending("Not yet searched for separately."),
    "Circuit breakers": v("sd-cb@11:05-21:41"),
    "Backups and restores": v("kt-pgrec"),
    "Incident handling": v("tt-incident"),
    "Operational runbooks": v("bl-runbook"),
  },
  "architecture-foundations": {
    "Requirements engineering": pending("Search returned no suitable lesson."),
    "Functional and non-functional requirements": v("mc-nfr"),
    "Stakeholders and constraints": pending("Search returned no suitable lesson."),
    "Quality attribute trade-offs": v("mc-nfr"),
  },
  "enterprise-architecture": {
    Scalability: v("mr-waf"),
    Reliability: v("mr-waf"),
    Maintainability: pending("Not yet searched for separately."),
  },
  "advanced-architecture": {
    "API architecture": pending("The linked event-driven segment is a different subject, so it was not promoted."),
    "Background processing": pending("The linked human-approval segment is a different subject, so it was not promoted."),
  },
  "data-architecture": {
    "Data domains and ownership": v("dtc-mesh@16:34-25:26", "cf-mesh"),
    "Operational and analytical stores": v("bw-dwh@2:50-9:41"),
    "Data lineage": v("sw-lineage"),
    "Data contracts": v("ds-contract"),
    "Master data for finance": pending("Not yet searched for. Finance-specific."),
  },
  "network-fundamentals": {
    "IP, DNS and TLS": v("up-net", "bb-tls"),
    "Virtual networks and subnets": v("js-vnet", "az-net@0:40-8:32"),
    "Private endpoints": v("ca-pe", "js-pe"),
    "Firewalls and gateways": v("az-net@1:53:53-2:13:09"),
  },
  "enterprise-identity": {
    RBAC: pending("The Entra video reviewed covers Conditional Access, not role mapping."),
    "Tenant isolation": pending("Search returned no video."),
    "Data security": pending("Not yet searched for separately."),
  },
  "resilience-scale": {
    "Disaster recovery": v("drp-rto"),
    "Recovery objectives": v("src-rpo"),
    Scalability: v("mr-waf"),
    "Performance and load testing": v("jc-locust"),
  },
  "ai-governance": {
    "Model lifecycle management": pending("Search returned papers, not videos."),
    "Operational ownership": pending("Not yet searched for separately."),
    "Production support": pending("Not yet searched for separately."),
  },
  "finops-value": {
    FinOps: v("cl-finops", "ap-finops"),
    "Total cost of ownership": pending("Search returned no video on this."),
    "ROI and business value": pending("Search returned no video on this."),
    "Cost allocation and showback": pending("Not yet searched for separately."),
  },
};
