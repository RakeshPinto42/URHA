/**
 * Initial resource library (PRD §6). Seeded once; editable afterwards in Academy.
 *
 * Rules applied:
 * - Only resources named in the PRD. One primary per topic where possible.
 * - `url: null` means the exact link has not been confirmed: the UI says
 *   "Link not added" and lets the user paste it. URLs are never guessed.
 * - Link status starts "unchecked"; `npm run links:check` records whether each
 *   URL resolves. Resolving is not the same as content-verified, and the UI says so.
 */

export type ResourceKind = "udemy" | "youtube" | "docs" | "course" | "article";

export type ResourceDef = {
  id: string;
  topic: string; // topic id
  kind: ResourceKind;
  title: string;
  author: string;
  url: string | null;
  sections: string; // which sections/lessons to use
  hours: number | null; // estimated study time
  primary: boolean;
};

export const RESOURCES: ResourceDef[] = [
  // Phase 1
  { id: "r-portilla-python", topic: "python-engineering", kind: "udemy", title: "Complete Python Bootcamp", author: "Jose Portilla",
    url: "https://www.udemy.com/course/complete-python-bootcamp/", sections: "Selected sections only, where foundational topics need reinforcement (OOP, errors, modules, decorators, generators).", hours: 8, primary: true },
  { id: "r-schafer-python", topic: "python-engineering", kind: "youtube", title: "Python tutorials", author: "Corey Schafer",
    url: "https://www.youtube.com/@coreyms", sections: "Targeted concepts: classes, decorators, generators, virtual environments, logging.", hours: 4, primary: false },
  { id: "r-python-docs", topic: "python-engineering", kind: "docs", title: "The Python Tutorial", author: "Python Software Foundation",
    url: "https://docs.python.org/3/tutorial/", sections: "Chapters 5 (data structures), 8 (errors), 9 (classes).", hours: 3, primary: false },
  { id: "r-missing-semester-git", topic: "software-engineering", kind: "course", title: "Missing Semester — Version Control (Git)", author: "MIT",
    url: "https://missing.csail.mit.edu/2020/version-control/", sections: "Whole lecture and exercises.", hours: 2, primary: true },
  { id: "r-fcc-pytest", topic: "software-engineering", kind: "youtube", title: "Pytest Tutorial – How to Test Python Code", author: "freeCodeCamp.org",
    url: "https://www.youtube.com/watch?v=cHYq1MRoyI0", sections: "Chapters: Fixtures 29:49, Mark & Parametrize 41:10, Mocking 55:24, Testing with ChatGPT 1:13:16.", hours: 1.5, primary: false },
  { id: "r-pytest-docs", topic: "software-engineering", kind: "docs", title: "pytest documentation", author: "pytest-dev",
    url: "https://docs.pytest.org/en/stable/", sections: "How-to guides: fixtures, parametrize, monkeypatch.", hours: 2, primary: false },
  { id: "r-vscode-debugging", topic: "software-engineering", kind: "docs", title: "Debugging in VS Code", author: "Microsoft",
    url: "https://code.visualstudio.com/docs/editor/debugging", sections: "Breakpoints, launch configurations, Python debugging.", hours: 1, primary: false },
  { id: "r-baraa-sql", topic: "sql-foundations", kind: "youtube", title: "SQL Full Course", author: "Data with Baraa",
    url: "https://www.youtube.com/@DataWithBaraa", sections: "Practical querying, joins, CTEs, window functions and data modelling.", hours: 12, primary: true },
  { id: "r-postgres-docs", topic: "sql-foundations", kind: "docs", title: "PostgreSQL Tutorial and Reference", author: "PostgreSQL Global Development Group",
    url: "https://www.postgresql.org/docs/current/", sections: "Part I tutorial; window functions; constraints; transactions; indexes.", hours: 3, primary: false },
  { id: "r-schafer-pandas", topic: "sql-foundations", kind: "youtube", title: "Pandas Tutorials", author: "Corey Schafer",
    url: "https://www.youtube.com/@coreyms", sections: "Data manipulation, cleaning, grouping, merging and database integration.", hours: 5, primary: false },
  // Phase 2
  { id: "r-fastapi-udemy", topic: "backend-engineering", kind: "udemy", title: "FastAPI course", author: "Eric Roby and Chad Darby",
    url: null, sections: "Udemy: \"FastAPI - The Complete Course\" (Eric Roby, Chad Darby). Canonical URL not verifiable by automated check; add it from your Udemy account. Use the API, Pydantic, SQLAlchemy, authentication and testing sections. Free alternative mapped per subtopic: freeCodeCamp's Python API Development course.", hours: 14, primary: true },
  { id: "r-fastapi-docs", topic: "backend-engineering", kind: "docs", title: "FastAPI documentation", author: "Sebastián Ramírez",
    url: "https://fastapi.tiangolo.com/", sections: "Tutorial — User Guide; Security; Testing.", hours: 4, primary: false },
  { id: "r-donner-llm", topic: "llm-engineering", kind: "udemy", title: "AI Engineer Core Track", author: "Ed Donner",
    url: null, sections: "Udemy: \"AI Engineer Core Track: LLM Engineering, RAG, QLoRA, Agents\" (Ed Donner). Canonical URL not verifiable by automated check; add it from your Udemy account. Use LLM APIs, structured outputs, tools and RAG fundamentals; skip model training and overlapping agent sections.", hours: 16, primary: true },
  { id: "r-anthropic-docs", topic: "llm-engineering", kind: "docs", title: "Claude API documentation", author: "Anthropic",
    url: "https://docs.claude.com/", sections: "Messages API, streaming, tool use, structured outputs, rate limits.", hours: 3, primary: false },
  { id: "r-openai-docs", topic: "llm-engineering", kind: "docs", title: "OpenAI API documentation", author: "OpenAI",
    url: "https://platform.openai.com/docs", sections: "Text generation, structured outputs, function calling.", hours: 3, primary: false },
  { id: "r-anthropic-prompting", topic: "prompt-engineering", kind: "docs", title: "Prompt engineering guide", author: "Anthropic",
    url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview", sections: "Whole guide.", hours: 3, primary: true },
  // Phase 3
  { id: "r-donner-rag", topic: "rag-architecture", kind: "udemy", title: "AI Engineer Core Track — RAG", author: "Ed Donner",
    url: null, sections: "RAG fundamentals sections.", hours: 6, primary: true },
  { id: "r-pgvector", topic: "retrieval-engineering", kind: "docs", title: "pgvector README", author: "pgvector",
    url: "https://github.com/pgvector/pgvector", sections: "Indexing (HNSW, IVFFlat), distance operators, filtering.", hours: 2, primary: true },
  // Phase 4
  { id: "r-langgraph-academy", topic: "langgraph", kind: "course", title: "Intro to LangGraph", author: "LangChain Academy",
    url: "https://academy.langchain.com/courses/intro-to-langgraph", sections: "Core modules on state, memory, workflows and human approval.", hours: 10, primary: true },
  { id: "r-building-effective-agents", topic: "agent-engineering", kind: "article", title: "Building Effective Agents", author: "Anthropic",
    url: "https://www.anthropic.com/engineering/building-effective-agents", sections: "Whole article.", hours: 1, primary: true },
  { id: "r-mcp-docs", topic: "mcp", kind: "docs", title: "Model Context Protocol documentation", author: "MCP",
    url: "https://modelcontextprotocol.io/", sections: "Architecture, server and client quickstarts, specification: tools, resources, prompts, authorization.", hours: 6, primary: true },
  // Phase 5
  { id: "r-hamel-evals", topic: "ai-evaluation", kind: "article", title: "Your AI Product Needs Evals", author: "Hamel Husain",
    url: "https://hamel.dev/blog/posts/evals/", sections: "Whole article.", hours: 1, primary: true },
  { id: "r-dlai-agent-evals", topic: "ai-evaluation", kind: "course", title: "Evaluating AI Agents", author: "DeepLearning.AI",
    url: "https://www.deeplearning.ai/short-courses/evaluating-ai-agents/", sections: "Whole short course.", hours: 2, primary: false },
  { id: "r-langfuse-docs", topic: "observability", kind: "docs", title: "Langfuse documentation", author: "Langfuse",
    url: "https://langfuse.com/docs", sections: "Tracing, prompt management, cost tracking.", hours: 3, primary: true },
  { id: "r-owasp-llm", topic: "ai-security", kind: "docs", title: "OWASP Top 10 for LLM Applications", author: "OWASP",
    url: "https://genai.owasp.org/llm-top-10/", sections: "All ten risks with mitigations.", hours: 3, primary: true },
  { id: "r-docker-docs", topic: "deployment-foundations", kind: "docs", title: "Docker documentation", author: "Docker",
    url: "https://docs.docker.com/get-started/", sections: "Get started; Compose.", hours: 4, primary: true },
  // Phase 7
  { id: "r-aca-docs", topic: "cloud-production", kind: "docs", title: "Azure Container Apps documentation", author: "Microsoft",
    url: "https://learn.microsoft.com/en-us/azure/container-apps/", sections: "Overview, quickstarts, revisions, secrets, GitHub Actions.", hours: 5, primary: true },
  { id: "r-entra-docs", topic: "enterprise-identity", kind: "docs", title: "Microsoft Entra ID documentation", author: "Microsoft",
    url: "https://learn.microsoft.com/en-us/entra/identity/", sections: "App registration, OIDC sign-in, app roles and groups.", hours: 5, primary: true },
];
