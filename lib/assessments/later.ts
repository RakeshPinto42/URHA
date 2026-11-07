/**
 * Assessments for APIs (Phase 2), RAG (Phase 3) and LangGraph (Phase 4).
 * Practical work dominates; it is human-reviewed against the rubric.
 */
import type { Assessment } from "./types";

export const BACKEND_ENGINEERING: Assessment = {
  id: "backend-engineering",
  version: 1,
  topicId: "backend-engineering",
  skills: ["apis"],
  title: "APIs: a validated, idempotent import endpoint",
  summary: "HTTP semantics, validation, authentication and a tested endpoint that is safe to call twice.",
  objectives: [
    "Return the right status codes and keep internal fields out of responses.",
    "Verify tokens and webhook signatures correctly.",
    "Build and test an endpoint with validation, error handling and idempotency.",
  ],
  difficulty: "intermediate",
  passPercent: 70,
  minutes: 180,
  items: [
    {
      id: "api-1", type: "debug", language: "python", points: 3, revise: ["request-and-response-validation", "error-handling"],
      prompt: "Which TWO defects does this FastAPI endpoint have?",
      code: `@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    return db.get(User, user_id)`,
      options: [
        "No response_model, so every ORM field (including hashed_password) is serialised",
        "A missing user returns 200 with null instead of 404",
        "Depends must be awaited",
        "Path parameters cannot be typed as int",
      ],
      correct: [0, 1],
      explain: "Declare a response model without secrets, and raise HTTPException(404) when db.get returns None.",
    },
    {
      id: "api-2", type: "mcq", points: 2, revise: ["idempotency", "retries"],
      prompt: "A client retries POST /imports with the same Idempotency-Key because the first response was lost. The first request had succeeded. What should the API do?",
      options: [
        "Create a second import; retries are the client's problem",
        "Return 409 Conflict",
        "Return the original response (same status and import id) without creating anything",
        "Return 500 so the client stops retrying",
      ],
      correct: [2],
      explain: "Store the key with the original result and replay it; that is what makes a retry safe.",
    },
    {
      id: "api-3", type: "mcq", points: 2, revise: ["webhooks"],
      prompt: "How should a webhook receiver check an HMAC-SHA256 signature?",
      options: [
        "Recompute the HMAC over the parsed-and-re-serialised JSON and compare with ==",
        "Recompute the HMAC over the raw request body bytes and compare with hmac.compare_digest",
        "Check only that the signature header is present",
        "Decrypt the signature with the shared secret",
      ],
      correct: [1],
      explain: "Re-serialising changes bytes; == leaks timing. Use the raw body and a constant-time compare.",
    },
    {
      id: "api-4", type: "mcq", points: 2, revise: ["jwt", "authentication"],
      prompt: "Which check is NOT optional when your API accepts a JWT access token?",
      options: [
        "Decoding the payload to read the user id",
        "Verifying the signature with the expected algorithm and key, and rejecting expired tokens",
        "Logging the full token for audit",
        "Storing the token in the database",
      ],
      correct: [1],
      explain: "An unverified or expired token proves nothing. Never log tokens.",
    },
    {
      id: "api-5", type: "code", points: 12, required: true, evidence: "url-and-text",
      revise: ["fastapi", "pydantic", "request-and-response-validation", "idempotency", "api-testing", "error-handling"],
      prompt: "Build POST /imports for LedgerSync: accepts a JSON batch of transactions, validates each (amount precision, ISO currency, real dates), rejects invalid batches with a 422 that names the bad fields, honours an Idempotency-Key, and returns 201 with an import id. Write API tests against a test database. Submit the commit link and paste the test output.",
      rubric: [
        { id: "validation", label: "Validation and errors", points: 4, descriptor: "Pydantic models enforce the rules; errors are specific; no stack traces leak; status codes are right." },
        { id: "idempotency", label: "Idempotency", points: 3, descriptor: "A repeated key replays the original result; a different body with the same key is refused." },
        { id: "tests", label: "Tests", points: 3, descriptor: "Happy path, invalid input, replay and conflicting replay are tested on an isolated database." },
        { id: "design", label: "Design", points: 2, descriptor: "Router, schema and data access are separated; the database session comes through Depends." },
      ],
      guidance: "Run the tests. Ask the learner to explain how the idempotency record is written atomically with the import.",
    },
    {
      id: "api-6", type: "architecture", points: 5, evidence: "text", revise: ["retries", "idempotency", "webhooks"],
      prompt: "The exchange-rate provider is rate-limited and sometimes times out; it also sends 'rates updated' webhooks, sometimes twice. Describe your retry policy, how you avoid duplicate processing, and what you log.",
      rubric: [
        { id: "retry", label: "Retry policy", points: 2, descriptor: "Exponential backoff with jitter, a cap, retries only on retryable errors (timeouts, 429, 5xx), honouring Retry-After." },
        { id: "dedupe", label: "Duplicate handling", points: 2, descriptor: "Webhook event ids stored and checked before processing; processing is idempotent." },
        { id: "logs", label: "Logging", points: 1, descriptor: "Each retry and duplicate is logged with context, without secrets." },
      ],
    },
  ],
};

export const RAG_ARCHITECTURE: Assessment = {
  id: "rag-architecture",
  version: 1,
  topicId: "rag-architecture",
  skills: ["rag", "eval"],
  title: "RAG: build and evaluate a grounded retrieval workflow",
  summary: "Grounding, access-aware retrieval and an evaluated retrieval workflow over real documents.",
  objectives: [
    "Keep answers grounded in retrieved sources and refuse when there are none.",
    "Enforce access control inside retrieval, not after it.",
    "Measure retrieval relevance and answer grounding with a fixed evaluation set.",
  ],
  difficulty: "advanced",
  passPercent: 70,
  minutes: 360,
  items: [
    {
      id: "rag-1", type: "debug", language: "python", points: 3, revise: ["access-aware-retrieval", "retrieval-engineering:metadata-filtering"],
      prompt: "A finance analyst asks a question and gets 'I could not find this' although two documents they may read answer it. What is the defect?",
      code: `hits = store.similarity_search(question, k=5)
allowed = [h for h in hits if user.can_read(h.metadata["doc_id"])]
answer = llm.answer(question, context=allowed)`,
      options: [
        "k=5 is too small for any question",
        "Access is filtered after the top-k search, so permitted documents ranked below forbidden ones are never retrieved; filter inside the search",
        "can_read should be called after the answer",
        "similarity_search is non-deterministic",
      ],
      correct: [1],
      explain: "Apply the user's access filter in the retrieval query (metadata filter or row-level security) so top-k is drawn only from permitted documents.",
    },
    {
      id: "rag-2", type: "mcq", points: 2, revise: ["grounded-generation", "source-citations"],
      prompt: "No retrieved chunk is relevant to the question. What should a grounded system do?",
      options: [
        "Answer from the model's general knowledge without saying so",
        "Say it cannot find support in the sources, and cite nothing",
        "Cite the closest chunk anyway",
        "Retry with a higher temperature",
      ],
      correct: [1],
      explain: "Grounded means every claim is supported by a cited source; with none, the honest answer is a refusal.",
    },
    {
      id: "rag-3", type: "mcq", points: 2, revise: ["retrieval-quality", "rag-evaluation"],
      prompt: "Which pairing is right?",
      options: [
        "Hit rate@k measures whether the answer is faithful to the context",
        "Faithfulness measures whether the answer's claims are supported by the retrieved context; hit rate@k measures whether a relevant chunk was retrieved in the top k",
        "Both measure the same thing at different k",
        "Faithfulness measures retrieval latency",
      ],
      correct: [1],
      explain: "Evaluate retrieval and generation separately, so a failure can be located.",
    },
    {
      id: "rag-4", type: "project", points: 14, required: true, evidence: "url-and-text",
      revise: ["retrieval-pipelines", "context-assembly", "source-citations", "rag-evaluation", "retrieval-engineering:chunking-strategies"],
      prompt: "Build a retrieval workflow over at least 15 LedgerSync policy or procedure documents (PostgreSQL + pgvector or equivalent). Answers must cite their sources. Write an evaluation set of at least 20 questions with expected source documents, including 3 that should be refused. Report hit rate@5, citation correctness and refusal accuracy, and one change you made because of the results. Submit the repository link and paste the evaluation report.",
      rubric: [
        { id: "pipeline", label: "Working pipeline", points: 4, descriptor: "Ingestion, chunking, embedding, retrieval and cited generation run end to end." },
        { id: "evalset", label: "Honest evaluation set", points: 3, descriptor: "≥20 questions with expected sources written before tuning; includes unanswerable questions." },
        { id: "metrics", label: "Metrics reported correctly", points: 4, descriptor: "Hit rate@5, citation correctness and refusal accuracy computed by code, with the raw results." },
        { id: "iteration", label: "Improvement from evidence", points: 3, descriptor: "A change (chunking, filters, reranking, prompt) justified by the numbers, with before and after." },
      ],
      guidance: "Re-run the evaluation script. Metrics produced by an LLM judge alone do not count as the only evidence; deterministic checks against expected sources are required.",
    },
    {
      id: "rag-5", type: "scenario", points: 4, evidence: "text", revise: ["failure-analysis", "document-references"],
      prompt: "An answer about expense limits cites the 2024 travel policy, but the 2026 version is in the index. Describe how you would diagnose and fix this.",
      rubric: [
        { id: "diagnose", label: "Diagnosis", points: 2, descriptor: "Inspects what was retrieved and ranked (scores, metadata, both versions present?) before changing anything." },
        { id: "fix", label: "Fix", points: 2, descriptor: "Version and effective-date metadata, filtering or superseding old documents, and a regression question in the eval set." },
      ],
    },
  ],
};

export const LANGGRAPH: Assessment = {
  id: "langgraph",
  version: 1,
  topicId: "langgraph",
  skills: ["agents"],
  title: "LangGraph: a stateful workflow with approval",
  summary: "State, conditional routing, tools, checkpoints and a human approval step, built and tested.",
  objectives: [
    "Model workflow state and route on it.",
    "Pause for human approval and resume safely.",
    "Recover a run after a failure without repeating side effects.",
  ],
  difficulty: "advanced",
  passPercent: 70,
  minutes: 360,
  items: [
    {
      id: "lg-1", type: "debug", language: "python", points: 3, revise: ["conditional-routing", "nodes-and-edges"],
      prompt: "The graph fails when a journal needs approval. Why?",
      code: `def route(state: State) -> str:
    if state["needs_approval"]:
        return "approve"
    return "post"

graph.add_conditional_edges("classify", route, {"approval": "human_approval", "post": "post_journal"})`,
      options: [
        "Conditional edges cannot return strings",
        "route returns \"approve\", which is not a key in the path map (\"approval\")",
        "State must be a dataclass",
        "human_approval must be the entry point",
      ],
      correct: [1],
      explain: "The router's return values must match the path map's keys exactly; a test per branch catches this.",
    },
    {
      id: "lg-2", type: "mcq", points: 2, revise: ["checkpointing", "interrupts", "human-approval"],
      prompt: "What does a workflow need so it can pause for a person's approval and continue later, even after the process restarts?",
      options: [
        "A global variable holding the state",
        "A persistent checkpointer, and resuming with the same thread id",
        "A longer timeout on the model call",
        "Running the graph in a background thread",
      ],
      correct: [1],
      explain: "The checkpointer stores state at the interrupt; resuming the same thread continues from it.",
    },
    {
      id: "lg-3", type: "mcq", points: 2, revise: ["recovery-and-resumability", "long-running-workflows"],
      prompt: "A run crashes after the 'post_journal' tool wrote to the ledger but before the checkpoint was saved. On resume, what prevents a duplicate posting?",
      options: [
        "Nothing is needed; LangGraph never repeats a node",
        "Making the tool idempotent (e.g. an idempotency key per journal) so a re-run cannot post twice",
        "Lowering the model temperature",
        "Retrying the whole graph from the start",
      ],
      correct: [1],
      explain: "Resumption may re-run the node whose effect was not checkpointed; side effects must be idempotent.",
    },
    {
      id: "lg-4", type: "project", points: 14, required: true, evidence: "url-and-text",
      revise: ["graph-state", "conditional-routing", "interrupts", "human-approval", "persistence", "agent-testing"],
      prompt: "Build a LangGraph workflow that classifies an unmatched transaction, proposes a journal with a tool, routes amounts above a threshold to human approval (interrupt), and posts only approved journals. Use a persistent checkpointer. Write tests for each route, the approval and rejection paths, and resumption after a restart. Submit the repository link and paste the test output.",
      rubric: [
        { id: "state", label: "State and routing", points: 4, descriptor: "Typed state; routing on state with every branch tested." },
        { id: "approval", label: "Human approval", points: 4, descriptor: "Interrupt before posting above the threshold; approve and reject both handled; nothing posts without approval." },
        { id: "durability", label: "Persistence and recovery", points: 3, descriptor: "Persistent checkpointer; a test resumes after a simulated restart; posting is idempotent." },
        { id: "tests", label: "Tests and tools", points: 3, descriptor: "The tool is called with validated arguments; tests are deterministic (model calls stubbed)." },
      ],
      guidance: "Run the tests. Ask the learner to resume a paused run on a new process in front of you.",
    },
  ],
};
