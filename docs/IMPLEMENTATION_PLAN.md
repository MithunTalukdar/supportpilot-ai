# SupportPilot AI — Phased Implementation Plan & Acceptance Criteria

This implementation roadmap decomposes the development of SupportPilot AI into 9 incremental, testable phases. Each phase is independently verifiable with concrete acceptance criteria and automated test targets.

---

## Roadmap Overview

```mermaid
gantt
    title SupportPilot AI Phased Delivery Roadmap
    dateFormat  YYYY-MM-DD
    section Core Foundations
    Phase 1: Project Setup & DB Baseline        :p1, 2026-10-27, 2d
    Phase 2: Auth, Org Management & RBAC        :p2, after p1, 3d
    section Support Operations
    Phase 3: Ticket Management & Collaboration  :p3, after p2, 4d
    section AI & Vector Engine
    Phase 4: Knowledge Base & pgvector Indexing :p4, after p3, 3d
    Phase 5: RAG Chatbot Service                :p5, after p4, 3d
    Phase 6: AI-Assisted Agent Workflows        :p6, after p5, 3d
    section Insights & Hardening
    Phase 7: Analytics & AI Token Metering      :p7, after p6, 2d
    Phase 8: Security Hardening & Test Suite    :p8, after p7, 3d
    Phase 9: Deployment & Production Packaging  :p9, after p8, 2d
```

---

## Phase 1: Project Setup, Tooling & Database Baseline

### Goal & Scope
Establish the monorepo workspace, TypeScript configs, Tailwind CSS design system foundation, PostgreSQL database with `pgvector` extension, and Prisma ORM models.

### Step-by-Step Tasks
1. Initialize npm/pnpm workspace with `apps/client`, `apps/server`, and `packages/shared-types`.
2. Configure TypeScript base compiler settings (`tsconfig.base.json`) with strict type-checking.
3. Configure Vite, React 18, and Tailwind CSS with custom color tokens and glassmorphism utilities in `apps/client`.
4. Configure Express app with Pino logger, CORS, and Helmet in `apps/server`.
5. Write `prisma/schema.prisma` with `pgvector` and PostgreSQL extensions.
6. Create initial database migration and write seed data script (`prisma/seed.ts`).
7. Implement health check endpoint (`GET /api/v1/health`) verifying PostgreSQL database connectivity.

### Deliverables
- Functional monorepo structure with operational dev scripts (`npm run dev`).
- Verified PostgreSQL connection with `pgvector` enabled.
- Database migration generating all 10 core tables.
- Seed script loading 2 test organizations and 5 users.

### Acceptance Criteria
- [ ] `npm run build` succeeds across all workspaces without TypeScript errors.
- [ ] `npx prisma migrate dev` executes cleanly and enables the `vector` extension.
- [ ] `npx prisma db seed` seeds dummy data into all relational tables.
- [ ] `GET /api/v1/health` returns `{ "status": "UP", "database": "CONNECTED", "vector": "ACTIVE" }`.

---

## Phase 2: Authentication, Multi-Tenant Organizations & RBAC

### Goal & Scope
Implement secure user registration, login, token refresh, organization provisioning, membership management, and tenant isolation middleware.

### Step-by-Step Tasks
1. Implement password hashing using Argon2id with recommended OWASP salt/memory settings.
2. Build JWT token generation (access token: 15 min) and HttpOnly refresh token rotation logic.
3. Implement `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, and `GET /api/v1/auth/me`.
4. Implement organization creation (`POST /api/v1/organizations`) and membership assignment.
5. Create `tenant.middleware.ts` to extract tenant context and bind it to `AsyncLocalStorage`.
6. Create `rbac.middleware.ts` validating user roles (`OWNER`, `AGENT`, `CUSTOMER`).
7. Build React authentication pages (Login, Register, Organization Switcher) with form validation.

### Deliverables
- End-to-end authentication flow with secure cookies.
- Verified tenant isolation middleware blocking unauthenticated or cross-org access.
- Frontend Auth Provider and protected route wrappers (`<RequireAuth>`, `<RequireOrgRole>`).

### Acceptance Criteria
- [ ] Unauthenticated requests to protected endpoints return `401 Unauthorized`.
- [ ] Users cannot read or modify organizations they do not belong to (`403 Forbidden`).
- [ ] Refresh token rotation invalidates old tokens upon renewal and revokes sessions on replay.
- [ ] Front-end successfully logs in, persists session state, and redirects to dashboard.

---

## Phase 3: Core Ticket Lifecycle & Collaboration System

### Goal & Scope
Build the ticket management engine, including ticket creation, status workflows, priorities, assignment, comment threads, and internal private agent notes.

### Step-by-Step Tasks
1. Implement ticket sequence numbering per organization (e.g., ticket #1001 for Org A).
2. Build ticket CRUD API endpoints with filtering (status, priority, search) and pagination.
3. Build ticket assignment and status change endpoints with automatic audit log recording.
4. Implement ticket comments API supporting public replies and private internal notes (`isInternal: true`).
5. Build ticket UI workspace:
   - Filterable ticket list table with priority badges and status chips.
   - Ticket detail view with full conversation timeline.
   - Tabbed reply editor allowing agents to toggle between "Public Customer Reply" and "Internal Team Note".

### Deliverables
- Full ticket CRUD and comment APIs with strict tenant filtering.
- Intuitive, glassmorphic React ticket workspace for agents and customers.
- Audit logging interceptor capturing ticket assignment and status transitions.

### Acceptance Criteria
- [ ] Customers can create tickets and view only tickets they authored.
- [ ] Support Agents can view and filter all tickets within their organization.
- [ ] Internal notes created by agents are completely hidden from customer responses.
- [ ] Any ticket update creates a corresponding record in `AuditLog` with before/after state.

---

## Phase 4: Knowledge Base Document Ingestion & pgvector Pipeline

### Goal & Scope
Build the document ingestion subsystem: file upload validation, text extraction, semantic chunking, embedding generation via `AIGateway`, and storage in PostgreSQL via `pgvector`.

### Step-by-Step Tasks
1. Implement `POST /api/v1/organizations/:orgId/documents` handling multipart uploads (PDF, Markdown, TXT) up to 15MB.
2. Implement file type verification using magic-number headers.
3. Build recursive text chunking utility (~500 tokens with 50-token overlap).
4. Implement `AIProvider` embedding interface and configure primary provider adapter.
5. Build `vector.repo.ts` executing parameterized SQL vector similarity queries via pgvector (`<=>` cosine distance).
6. Create Knowledge Base management UI:
   - Drag-and-drop document uploader with progress indicators.
   - Document table showing status (`PENDING`, `PROCESSING`, `INDEXED`, `FAILED`).
   - Chunk inspection modal previewing extracted chunks and token counts.

### Deliverables
- Async ingestion pipeline capable of chunking and embedding multi-page documents.
- Working HNSW index on `document_chunks.embedding` column.
- Front-end Knowledge Base management view.

### Acceptance Criteria
- [ ] Uploading a sample PDF extracts text, creates chunks, and generates vector embeddings.
- [ ] Document chunks are strictly tagged with `organization_id`.
- [ ] Vector similarity search query returns relevant chunks matching test query with similarity scores $\ge 0.65$.
- [ ] Deleting a knowledge document cascades and removes all associated vector chunks from PostgreSQL.

---

## Phase 5: RAG Chatbot Service & Customer Support Widget

### Goal & Scope
Develop the conversational RAG chatbot engine combining pgvector retrieval, prompt assembly, and synthesized AI completions with verifiable document citations.

### Step-by-Step Tasks
1. Implement `ChatConversation` and `ChatMessage` data service.
2. Build RAG synthesis pipeline:
   - Step 1: User query converted to vector embedding.
   - Step 2: Query pgvector for top 3–5 matching chunks for the active organization.
   - Step 3: Format grounding context and system prompt with anti-hallucination directives.
   - Step 4: Dispatch to LLM completion endpoint and record consumed token metrics.
   - Step 5: Parse citations and persist chat history.
3. Build customer-facing embeddable chat widget component in React:
   - Floating widget toggle with smooth expansion animation.
   - Streaming message list with markdown rendering.
   - Clickable citation pills revealing source document snippets.

### Deliverables
- Working RAG chat endpoint (`POST /api/v1/organizations/:orgId/chat/conversations/:id/messages`).
- Embeddable and standalone customer chat widget UI.
- Strict anti-hallucination guardrails in the system prompt.

### Acceptance Criteria
- [ ] Chatbot answers user inquiries using only content from uploaded knowledge documents.
- [ ] If query is unanswerable from the knowledge base, the bot replies with fallback message without hallucinating.
- [ ] Bot output contains structured citations referencing the source document and chunk.
- [ ] Vector retrieval never returns document chunks from another organization.

---

## Phase 6: AI-Assisted Agent Workflows (Triage, Summary, Smart Reply)

### Goal & Scope
Equip support agents with automated AI tools directly inside the ticket workspace: one-click ticket summarization, automatic categorization/sentiment analysis, and smart response drafting.

### Step-by-Step Tasks
1. Implement `POST /api/v1/organizations/:orgId/ai/tickets/:ticketId/summarize`:
   - Aggregates ticket description and comments into a 3-bullet summary with action items.
2. Implement `POST /api/v1/organizations/:orgId/ai/tickets/:ticketId/classify`:
   - Categorizes ticket issue, computes sentiment score (-1.0 to 1.0), and flags urgency.
3. Implement `POST /api/v1/organizations/:orgId/ai/tickets/:ticketId/suggest-reply`:
   - Retrieves relevant KB chunks for the ticket issue and drafts a contextual agent response.
4. Integrate AI assist toolbar into the React ticket workspace:
   - "Summarize Thread" drawer.
   - "Suggested Reply" button that populates the reply editor with one click.
   - Sentiment and priority indicator pills.

### Deliverables
- Three dedicated AI agent assistance endpoints.
- Front-end integration with the agent ticket workflow.
- Full token accounting and logging for every assist action.

### Acceptance Criteria
- [ ] Summarization accurately condenses long multi-comment tickets into readable bullet points.
- [ ] Smart reply incorporates relevant KB context and populates the editor for agent review prior to sending.
- [ ] All AI operations record an entry in `AiUsageRecord`.

---

## Phase 7: Analytics Dashboard & AI Token Cost Tracking

### Goal & Scope
Provide organization owners and managers with visibility into support operations metrics, ticket volume trends, SLA performance, and detailed AI token usage and costs.

### Step-by-Step Tasks
1. Implement analytics aggregation queries in `analytics.service.ts`:
   - Ticket volume by status, priority, and resolution time.
   - Token consumption, cost breakdown, and call volume grouped by AI feature.
2. Build `GET /api/v1/organizations/:orgId/analytics/overview` and `GET /api/v1/organizations/:orgId/analytics/ai-usage`.
3. Build Analytics UI dashboard:
   - High-level KPI stat cards (Open Tickets, Avg Resolution Time, SLA Compliance, Total AI Cost).
   - Ticket status and priority distribution charts.
   - AI token expenditure breakdown bar chart.

### Deliverables
- Analytics APIs with date-range filtering.
- Visual analytics dashboard with charts and metric cards.

### Acceptance Criteria
- [ ] Dashboard computes accurate metrics matching raw database counts.
- [ ] AI token expenditures calculate accurate USD costs based on model pricing configs.
- [ ] Analytics endpoints enforce `OWNER` or `AGENT` permissions.

---

## Phase 8: Security Hardening, Rate Limiting & Automated Testing Suite

### Goal & Scope
Harden the system against abuse, configure rate limiting, implement comprehensive automated tests with Vitest and Supertest, and verify zero cross-tenant data leakage.

### Step-by-Step Tasks
1. Configure `express-rate-limit` for global IP, auth endpoints, and AI endpoints.
2. Add comprehensive automated unit tests for:
   - `AIGateway` mock adapters and fallback behavior.
   - Semantic text chunker and token estimator.
   - RBAC permission matrix checks.
3. Add API integration tests using Supertest:
   - Tenant isolation verification: Tenant B attempts to read Tenant A's tickets, documents, and chat history.
   - Customer trying to read internal notes.
   - Auth token expiration and refresh flow.
4. Configure input sanitization and PII masking filters.

### Deliverables
- Fully configured rate limiters with standard response headers.
- Comprehensive Vitest test suite with $\ge 80\%$ test coverage on core services.
- Automated security integration test suite confirming zero cross-tenant leakage.

### Acceptance Criteria
- [ ] `npm run test` executes all unit and integration tests cleanly.
- [ ] Cross-tenant data leakage tests pass with `403 Forbidden` or `404 Not Found`.
- [ ] Rate limit triggers `429 Too Many Requests` when limits are exceeded.

---

## Phase 9: Deployment Configuration & Production Readiness

### Goal & Scope
Produce production Docker containers, environment configuration templates, database migration runners, and production deployment documentation.

### Step-by-Step Tasks
1. Author multi-stage `Dockerfile.server` (Node.js 20 Alpine) with pruned production dependencies.
2. Author multi-stage `Dockerfile.client` (Nginx Alpine serving optimized Vite static bundle).
3. Author `docker-compose.yml` orchestrating PostgreSQL with `pgvector`, Express API, and React client.
4. Prepare `.env.example` with comprehensive documentation for all required secrets.
5. Create zero-downtime database migration entrypoint script.
6. Write production runbook and operational readiness checklist.

### Deliverables
- Working `docker-compose up` setup spinning up the complete environment locally.
- Production-ready Dockerfiles.
- Complete deployment guide in `README.md`.

### Acceptance Criteria
- [ ] `docker-compose up --build` initializes database, runs migrations, seeds demo data, and serves client and server.
- [ ] Application functions end-to-end inside Docker containers without host dependencies.

---

## Unresolved Architectural Decisions (Awaiting User Approval)

Before implementation proceeds, please review and approve the following key technical decisions:

### Decision 1: Primary LLM Provider Configuration
- **Option A (Recommended):** **Google Gemini API** (`gemini-1.5-flash` for high-speed completions/summaries and `text-embedding-004` with 768 dimensions for vector embeddings). Very cost-effective and generous rate limits.
- **Option B:** **OpenAI API** (`gpt-4o-mini` for completions and `text-embedding-3-small` with 1536 dimensions for embeddings).
- **Option C:** **Local / Mock Provider First** (Uses deterministic mock provider for zero-cost local testing, with easy switch to live API keys via `.env`).

### Decision 2: Background Task Broker for Document Ingestion
- **Option A (Recommended for Initial Phase):** **In-process asynchronous job runner** with database state tracking (`PENDING` -> `PROCESSING` -> `INDEXED`). Minimizes external infrastructure dependencies (no Redis requirement for local development).
- **Option B:** **BullMQ with Redis**. Production standard for distributed background job queues with retries and dead-letter queues. Requires a Redis container.

### Decision 3: AI Chat Streaming Protocol
- **Option A (Recommended):** **Server-Sent Events (SSE)** via HTTP. Lightweight, standard for LLM token streaming, works with standard Express routes and React fetch readers.
- **Option B:** **Standard REST (Request-Response)**. Simpler, returns complete response with citation metadata in single JSON payload.
- **Option C:** **Dual Support**: Standard REST by default, with SSE endpoint `/messages/stream` available for live typing animation.

### Decision 4: File Storage Backend
- **Option A (Recommended for Development):** **Local disk storage** with strict directory sandboxing and random UUID file hashing, abstracted behind a `StorageService` interface.
- **Option B:** **AWS S3 / Cloudflare R2 / MinIO**. S3-compatible cloud bucket storage.

### Decision 5: Monorepo Package Manager
- **Option A (Recommended):** **npm workspaces** (built into standard Node.js/npm without needing extra global tooling).
- **Option B:** **pnpm workspaces** (faster installation, strict peer dependencies).
