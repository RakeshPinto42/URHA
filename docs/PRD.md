# PRODUCT REQUIREMENTS DOCUMENT
# NEXERA 2.0 — CAREER INTELLIGENCE
### Finance AI Solutions Architect → Enterprise AI Solutions Architect

> **Status:** the owner's governing requirements for the learning curriculum, received 2026-11-07. The text below is the owner's, unchanged. Where it conflicts with `lib/curriculum.ts`, `docs/JOURNEY.md` or earlier documents, this PRD wins. The comparison with the current build and the open decisions are in `docs/CAREER_AUDIT.md`.

**Document type:** Product Requirements Document
**Priority:** High
**Product:** Existing NexEra 2.0
**Primary objective:** Transform the existing Career module into a complete, personalised, YouTube-driven technical learning and career development system.

---

## 1. PRODUCT VISION

Build a personal learning operating system that develops my capability to design, build, integrate, deploy and architect AI-powered enterprise solutions, starting with finance.

The application must not be a static career roadmap or a generic collection of courses.

It must function as an intelligent learning environment that continuously answers:

1. What should I learn next?
2. Why is this skill important?
3. Which YouTube lesson should I watch?
4. What should I practise?
5. How can I apply this to finance?
6. Have I demonstrated the skill?
7. What should I learn after this?

The system must guide my learning journey in a logical sequence over approximately 24 months.

## 2. USER PROFILE AND LEARNING CONTEXT

Use this profile to configure the curriculum:

**Professional background**
- Approximately 8 years of FP&A and Commercial Finance experience.
- MBA in Finance.
- Experience with financial planning, budgeting, forecasting, pricing, profitability and reporting.
- Experience with SAP ECC, JDE and financial reporting workflows.
- Experience building Excel/VBA automation and financial applications with AI coding assistance.

**Current technical level**
- Basic Python.
- Basic SQL.
- Basic Power BI and Power Query.
- Familiarity with Pandas.
- Exposure to APIs, LLMs, LangChain, LangGraph and Streamlit.
- Experience using AI coding tools to build applications.

**Important learning requirement**

Do not treat me as an experienced software engineer.

Teach the concepts from the appropriate starting level and progressively develop independent coding, debugging, testing and architectural skills.

## 3. CAREER PROGRESSION

The application must display three career milestones:

**Milestone 1 — Finance Data & AI Solutions Engineer**

Build finance data pipelines, analytics solutions, AI applications and automation systems.

**Milestone 2 — Finance AI Solutions Architect**

Design and own end-to-end AI solutions for finance, including data architecture, AI applications, integrations, security and deployment.

**Milestone 3 — Enterprise AI Solutions Architect**

Extend architecture capabilities across enterprise functions, platforms, governance, security, infrastructure and operations.

Do not represent completion of the curriculum as an automatic job qualification or guarantee.

## 4. CURRICULUM ENGINE

Build the curriculum around six sequential learning phases over 24 months.

Each phase must contain:
- Learning modules.
- Topics.
- Subtopics.
- Prerequisites.
- Learning objectives.
- Recommended YouTube videos.
- Practical exercises.
- Finance applications.
- Assessments.
- Completion criteria.
- Portfolio deliverables.

The curriculum must support prerequisite relationships. For example:

Python fundamentals → Pandas → Data Engineering → LLM applications → RAG → Agent workflows → Enterprise deployment.

Do not allow the interface to recommend advanced topics when their prerequisites have not been demonstrated.

### Learning progression

1. Programming, SQL and databases.
2. Data engineering and finance analytics.
3. Applied AI and RAG.
4. AI agents and evaluation.
5. Software engineering, integration and cloud.
6. Enterprise AI solutions architecture.

Security, testing, Git, documentation and architecture thinking must be introduced throughout, not restricted to the final phase.

## 5. YOUTUBE RESOURCE ENGINE — CRITICAL REQUIREMENT

Every curriculum topic must have relevant YouTube learning resources.

This is the most important functional requirement.

### Resource discovery

Research actual YouTube videos using available browsing/search capabilities.

Prioritise:
- Official technology documentation channels.
- High-quality technical educators.
- Practical demonstrations.
- Project-based tutorials.
- Beginner-to-intermediate explanations.
- Current tutorials for rapidly changing technologies.

Potential channels:
- Data With Baraa
- Alex The Analyst
- Corey Schafer
- freeCodeCamp
- techTFQ
- DataTalksClub
- Databricks
- Microsoft Developer
- Guy in a Cube
- DeepLearning.AI
- LangChain
- Dave Ebbelaar
- ArjanCodes
- Docker
- Microsoft Azure

### Video selection

For every learning unit:
- One primary recommended video.
- One alternative when genuinely useful.
- Additional videos for subjects requiring deeper instruction.

Avoid duplicate content.

### Mandatory resource metadata

Each resource must contain:

- Title.
- Direct YouTube video URL.
- Creator/channel.
- Duration.
- Publication date, if available.
- Skill and topic mapping.
- Difficulty.
- Learning objectives.
- Reason for recommendation.
- Verification status.
- Last verified date.

### Verification rules

Never fabricate video resources.

Verify the actual watch page, title, creator and relevance.

Do not treat a YouTube search-results URL as a verified video.

If browsing is unavailable, clearly mark the resource as pending verification. Never silently invent replacement URLs.

### Resource quality

Prefer concise, practical lessons where appropriate.

Do not force short videos when a longer structured course is demonstrably better.

Use one strong primary resource rather than overwhelming the learner with unnecessary options.

YouTube must be the primary learning resource. Existing Udemy courses may be retained as optional references but must not replace the YouTube learning sequence.

## 6. LEARNING WORKSPACE

Every topic must open into an individual learning workspace.

The workspace should include:

**A. Concept**
- What is it?
- Why do I need it?
- Where does it fit in the technology architecture?

**B. Prerequisites**
- Previously required topics.
- Skills that should already be demonstrated.

**C. Watch**
- Primary YouTube video.
- Alternative resource.
- Video metadata.
- Direct video access.
- Embedded playback if technically supported.

**D. Understand**
- Key concepts.
- Important terminology.
- Simple explanations.
- Examples.

**E. Practise**
- Guided exercise.
- Independent exercise.
- Finance-specific use case.

**F. Validate**
- Knowledge checkpoint.
- Practical assessment.
- Completion criteria.

**G. Reflect**
- Learning notes.
- Questions.
- Code snippets.
- Revision reminders.

## 7. SKILL MASTERY SYSTEM

Watching a video must never automatically mark a skill as mastered.

Implement these states:

1. Not Started.
2. Learning.
3. Practising.
4. Demonstrated.
5. Needs Revision.

A skill can become Demonstrated only after the associated practical assessment has been completed.

Provide an option to attach:
- Project references.
- GitHub repository links.
- Screenshots or evidence.
- Notes.
- Assessment results.

Allow me to revisit completed skills and mark them for revision.

## 8. PROGRESS DASHBOARD

The Career Dashboard must show:

- Career destination.
- Current learning phase.
- Current module.
- Current topic.
- Next recommended lesson.
- Overall progress.
- Phase-wise progress.
- Skill mastery.
- Weekly learning hours.
- Completed practical exercises.
- Portfolio project status.
- Skills needing revision.

The next lesson recommendation must be based on prerequisite completion and learning sequence, not simply the last video opened.

## 9. WEEKLY LEARNING PLANNER

Available learning time:

- Weekdays: 1–1.5 hours per day.
- Weekends: 2–3 hours per day.
- Total: approximately 8–10 hours weekly.

Generate a realistic learning schedule based on:
- Topic complexity.
- Video duration.
- Practical exercises.
- Revision requirements.
- Available study time.

Do not overload the learner.

Allow manual rescheduling without breaking curriculum prerequisites.

## 10. PORTFOLIO PROJECTS

Integrate five progressive projects.

**P1 — Finance Data Foundation**
- GL actuals.
- Budgets.
- Forecasts.
- PostgreSQL.
- Data ingestion.
- Transformation.
- Data validation.
- Finance data modelling.

**P2 — FP&A and Commercial Intelligence**
- Actual versus budget.
- Variance analysis.
- Forecasting.
- Pricing.
- Customer profitability.
- Margin analytics.
- Power BI.

**P3 — Finance Knowledge Assistant**
- Document ingestion.
- RAG.
- Embeddings.
- Vector search.
- Citations.
- Access control.
- Evaluation.

**P4 — Finance Workflow Agent**
- Reconciliation.
- Variance investigation.
- Root-cause analysis.
- Tool calling.
- LangGraph.
- Human approval.
- Audit trail.

**P5 — Enterprise AI Reference Solution**
- End-to-end architecture.
- ERP/API integration.
- Authentication.
- Security.
- Cloud deployment.
- Monitoring.
- Evaluation.
- Cost management.
- Architecture documentation.

Each project must have requirements, architecture, milestones, acceptance criteria and a final deliverable.

Where relevant, use my existing finance automation experience as a starting point. Do not expose confidential employer data. Use anonymised or synthetic data for public portfolio work.

## 11. ARCHITECTURE AND TECHNOLOGY TRACK

Use one primary stack.

- Python.
- SQL.
- PostgreSQL.
- Pandas.
- Databricks and PySpark.
- Power BI.
- FastAPI.
- OpenAI API / Azure OpenAI.
- pgvector.
- LangGraph.
- REST APIs.
- MCP.
- Microsoft Azure.
- Docker.
- GitHub.
- GitHub Actions.
- LangSmith.
- OpenTelemetry.
- Terraform.

Azure is the primary cloud.

Do not introduce AWS, GCP, multiple agent frameworks or multiple vector databases as parallel learning requirements.

Introduce security, access control, privacy, testing, Git, documentation and monitoring progressively.

## 12. ENTERPRISE ARCHITECTURE DEVELOPMENT

The final curriculum must cover:

- Requirements engineering.
- Functional and non-functional requirements.
- Architecture diagrams.
- C4 model.
- Architecture Decision Records.
- Data architecture.
- Application architecture.
- Integration architecture.
- Cloud architecture.
- Identity and access management.
- Network fundamentals.
- Security and privacy.
- Reliability and disaster recovery.
- Scalability and performance.
- Observability.
- AI governance.
- AI evaluation.
- FinOps.
- Total cost of ownership.
- ROI and business value.

Teach architecture as a decision-making discipline, not simply memorisation of technology names.

## 13. TECHNICAL AND UX REQUIREMENTS

Before implementation:

1. Inspect the existing NexEra 2.0 repository.
2. Identify the current Career module and curriculum data structure.
3. Inspect existing video resources and their quality.
4. Inspect existing progress tracking and persistence.
5. Identify reusable components and existing design conventions.
6. Prepare a migration plan.

Implementation rules:

- Preserve working functionality.
- Preserve existing learning progress wherever possible.
- Do not rebuild the entire platform.
- Do not introduce duplicate curriculum structures.
- Keep learning content separate from UI components.
- Use typed, structured curriculum data.
- Store user progress persistently.
- Support responsive desktop and mobile layouts.
- Provide error and loading states.
- Ensure video resources are easy to update.
- Keep the existing NexEra design language.

Suggested data entities:

- CareerProfile.
- LearningPhase.
- LearningModule.
- LearningTopic.
- LearningResource.
- Skill.
- Assessment.
- Exercise.
- PortfolioProject.
- UserProgress.
- LearningNote.
- WeeklyPlan.

Adapt these to the existing architecture rather than blindly implementing new database tables.

## 14. ACCEPTANCE CRITERIA

The Career module is complete only when:

1. Career progression is updated correctly.
2. The six-phase curriculum is available.
3. Topics and prerequisites are correctly structured.
4. Every topic has appropriate YouTube resource coverage.
5. All recommended video URLs have verification status.
6. The next lesson is logically recommended.
7. Practical exercises exist.
8. Finance applications are integrated.
9. Skill mastery requires demonstrated evidence.
10. Learning progress persists.
11. Weekly planning works.
12. Five portfolio projects are integrated.
13. The module works responsively.
14. Existing functionality has not been unnecessarily broken.
15. The complete learning journey has been tested.

## 15. EXECUTION STRATEGY

Do not immediately modify the application.

First deliver an implementation audit covering:
- Existing architecture.
- Existing Career module functionality.
- Existing curriculum.
- Resource coverage and quality.
- Data migration requirements.
- UI changes.
- Technical risks.
- Implementation plan.

Then execute in stages:

**Stage 1:** Curriculum architecture and learning sequence.

**Stage 2:** YouTube research, resource mapping and verification.

**Stage 3:** Structured curriculum data and migration.

**Stage 4:** Learning workspace and skill mastery.

**Stage 5:** Dashboard and weekly planner.

**Stage 6:** Portfolio projects and architecture tracking.

**Stage 7:** Testing, migration validation and UI refinement.

Do not declare the work complete until the acceptance criteria have been tested.

### FINAL PRODUCT PRINCIPLE

NexEra must tell me exactly what to learn, why I need it, which video to watch, what to build and how to prove that I understand it.

The purpose is not to collect certificates or complete videos.

The purpose is to develop the independent capability to build and architect enterprise AI solutions, using finance as my initial domain specialisation.
