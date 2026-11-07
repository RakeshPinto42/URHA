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
    "Python fundamentals where gaps exist": v("fcc-python"),
    "Reading error messages and tracebacks": v("pm-trace", "ds-trace"),
    "Writing code without an AI assistant": pending("A practice habit, so the exercise teaches it rather than a video."),
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
    "Pandas or SQL: choosing the right tool": v("cc-pdsql", "fm-pdsql"),
  },
  "data-pipelines": {
    "Extract, load and transform": v("bw-dwh@9:41-20:29"),
    "Incremental loads": v("bi-incr", "al-dbx@3:58:42-4:05:56"),
    "Schema validation": v("cs-pydantic"),
    "Data quality rules": v("bi-gx"),
    "Reconciliation checks": v("sr-recon", "etl-recon"),
    "Pipeline logging and reruns": v("up-idem", "cl-pipe"),
  },
  "finance-data-modelling": {
    "Facts and dimensions": v("bw-pbi@14:50-18:45"),
    "Star schemas": v("bw-pbi@18:45-27:42", "bw-dwh@3:32:17-3:34:06"),
    "Chart of accounts hierarchies": v("cor-coa-dax", "cor-coa-m"),
    "Slowly changing dimensions": v("ab-scd", "tc-scd"),
    "Actuals, budget and forecast versions": pending("Videos found show variance reporting, not how to model versions. Taught through your own exercise."),
    "Currency and period conventions": v("ed-fx", "ds-fiscal"),
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
    "Variance analysis in code": v("as-bva"),
    "Price, volume and mix": v("kb-pvm", "zb-pvm"),
    "Forecasting methods": v("fcc-forecast", "dh-forecast@1:41:56-2:45:44"),
    "Forecast accuracy": v("sp-err"),
    "Customer profitability": v("ed-custprofit"),
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
    Grounding: pending("Two dedicated searches found no lesson on this. Taught in practice under Grounded generation."),
  },
  "api-essentials": {
    "HTTP fundamentals": v("fcc-api@57:34-1:07:29", "wc-http"),
    "Error handling": v("sj-errors"),
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
  "ai-evaluation": { "Deterministic evaluation": v("jk-assert") },
  "backend-engineering": {
    "Dependency injection": v("fcc-api@7:13:23-7:25:21"),
    Webhooks: v("wh-intro"),
  },
  "ai-security": {
    RBAC: v("sj-rbac", "pg-rbac"),
    "Secrets management": v("agent-sec@16:13-18:05", "kv-m365"),
  },
  "enterprise-integrations": {
    "External APIs": v("pl-httpx", "ae-apiauth"),
    Webhooks: v("fcc-webhooks"),
  },
  "deployment-foundations": { "Basic recovery procedures": v("wc-pgdump", "tp-pgvol") },
  "cloud-production": {
    "Managed PostgreSQL": v("cn-pg"),
    "Environment separation": v("mg-env", "am-env"),
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
    "Traces, metrics and logs": v("av-pillars", "oo-pillars"),
    "Instrumenting a FastAPI service": v("er-otel"),
    "Dashboards and alerts": v("jf-appins"),
    "Service-level objectives": v("sb-slo", "cf-slo"),
  },
  "reliability-engineering": {
    Timeouts: v("sd-cb@4:54-8:00"),
    "Rate limiting": v("mj-rate", "cl-rate"),
    "Circuit breakers": v("sd-cb@11:05-21:41"),
    "Backups and restores": v("kt-pgrec"),
    "Incident handling": v("tt-incident"),
    "Operational runbooks": v("bl-runbook"),
  },
  "architecture-foundations": {
    "Requirements engineering": v("uva-req", "ws-req"),
    "Functional and non-functional requirements": v("mc-nfr"),
    "Stakeholders and constraints": v("wf-stake", "ba-req"),
    "Quality attribute trade-offs": v("mc-nfr"),
  },
  "enterprise-architecture": {
    Scalability: v("mr-waf"),
    Reliability: v("mr-waf"),
    Maintainability: v("ac-coupling", "ac-coupling2"),
  },
  "advanced-architecture": {
    "API architecture": v("bm-api", "sdl-api"),
    "Background processing": v("sj-bg", "av-bg"),
  },
  "data-architecture": {
    "Data domains and ownership": v("dtc-mesh@16:34-25:26", "cf-mesh"),
    "Operational and analytical stores": v("bw-dwh@2:50-9:41"),
    "Data lineage": v("sw-lineage"),
    "Data contracts": v("ds-contract"),
    "Master data for finance": v("dg-mdm"),
  },
  "network-fundamentals": {
    "IP, DNS and TLS": v("up-net", "bb-tls"),
    "Virtual networks and subnets": v("js-vnet", "az-net@0:40-8:32"),
    "Private endpoints": v("ca-pe", "js-pe"),
    "Firewalls and gateways": v("az-net@1:53:53-2:13:09"),
  },
  "enterprise-identity": {
    RBAC: v("js-rbac", "bb-rbac"),
    "Tenant isolation": v("pc-tenant", "ipc-rls"),
    "Data security": v("js-encrypt"),
  },
  "resilience-scale": {
    "Disaster recovery": v("drp-rto"),
    "Recovery objectives": v("src-rpo"),
    Scalability: v("mr-waf"),
    "Performance and load testing": v("jc-locust"),
  },
  "ai-governance": {
    "Model lifecycle management": v("mr-llmops"),
    "Operational ownership": v("ef-owner", "yb-owner"),
    "Production support": v("sv-support"),
  },
  "finops-value": {
    FinOps: v("cl-finops", "ap-finops"),
    "Total cost of ownership": v("fx-tco", "ct-tco"),
    "ROI and business value": v("dg-roi", "tn-roi"),
    "Cost allocation and showback": v("ff-alloc", "ms-alloc"),
  },
};
