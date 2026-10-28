# SupportPilot AI — Comprehensive Project Inventory

**Audit Date:** October 28, 2026  
**Auditor:** Senior Software Architect & Security Audit Agent  
**Repository:** `d:/supportpilot-ai`  
**Application Name:** SupportPilot AI (AI-Powered Customer Support SaaS)  

---

## 1. Architecture Overview & Stack Discovery

| Layer | Technology | Version | Key Components & Purpose |
|---|---|---|---|
| **Runtime** | Node.js / TypeScript | Node v22.x / TS 5.7.3 | Enterprise TypeScript runtime with strict typing |
| **Monorepo** | NPM Workspaces | 0.1.0 | Root workspace orchestrating `backend` and `frontend` |
| **Backend** | Express.js | 4.21.2 | Modular REST API with structured controllers, services, middlewares |
| **ORM & DB** | Prisma / PostgreSQL | Prisma 5.22.0 / pgvector | Multi-tenant schema with `pgvector(1536)` vector extension |
| **Security** | Helmet / bcryptjs / JWT | Helmet 8.0, bcryptjs 3.0.3, jsonwebtoken 9.0.3 | HTTP security headers, bcrypt password hashing, rotating JWT sessions |
| **Validation** | Zod | 3.24.2 | Strict schema validation on request parameters, queries, and bodies |
| **Logging** | Pino & Pino-HTTP | Pino 9.6.0 | Structured JSON logging with correlated `x-request-id` tracing |
| **Frontend** | React / Vite | React 18.3.1, Vite 5.4.14 | Single Page Application with fast HMR and optimized production bundles |
| **Styling** | Tailwind CSS | 3.4.17 | B2B SaaS theme with accessible contrast, dark mode, responsive layout |
| **Icons** | Lucide React | 0.469.0 | Scalable vector icon system |
| **AI / LLM** | OpenAI API / Local Fallback | gpt-4o-mini / Local Fallback | Dual provider: OpenAI API with retry/budget control, local deterministic fallback |
| **Embeddings** | Deterministic / OpenAI | 1536 dimensions | Cosine similarity vector search matching `vector(1536)` in PostgreSQL |
| **Testing** | Vitest / Testing Library | Vitest 2.1.8 | Unit and integration testing across frontend (23 tests) and backend (57 tests) |
| **DevOps** | Docker / Nginx / Compose | Docker 24+, Nginx Alpine | Multi-stage Dockerfiles, reverse proxy, health probes, zero-downtime restarts |

---

## 2. Directory & Component Inventory

### 2.1 Monorepo Root
* `package.json`: NPM workspace configuration coordinating build, dev, test, and lint scripts across packages.
* `package-lock.json`: Lockfile ensuring deterministic dependency installation across CI/CD and production.
* `render.yaml`: Blueprint configuration for Render deployment (web service, static site, PostgreSQL instance).
* `.env.example`: Safe environment variable templates containing zero secrets.
* `.env.production.example`: Complete production configuration blueprint with secure placeholders.
* `README.md`: System overview, architectural summary, and quickstart guidelines.

### 2.2 Backend (`backend/`)
* **Entry Point:** `src/server.ts` (listens on port 5000, handles graceful shutdown on SIGINT/SIGTERM).
* **Application Factory:** `src/app.ts` (Express setup, Helmet, CORS, cookie-parser, request tracing, centralized error handling).
* **Configuration:**
  * `src/config/env.ts`: Startup validation using Zod for all environment variables (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, etc.).
* **Middlewares:**
  * `src/middleware/auth.middleware.ts`: Bearer token extraction, JWT verification, revocation checks, user hydration.
  * `src/middleware/tenant.middleware.ts`: Organization context resolution (`x-organization-id` header or URL parameter verification against database membership).
  * `src/middleware/role.middleware.ts`: Role-based access control (`OWNER`, `AGENT`, `CUSTOMER`).
  * `src/middleware/rate-limit.middleware.ts`: IP-based rate limiting on sensitive authentication endpoints (10 attempts / 15m in dev/prod).
  * `src/middleware/cors.middleware.ts`: Explicit frontend origin allowlist matching `FRONTEND_URL`.
  * `src/middleware/error.middleware.ts`: Centralized error handling returning structured JSON with correlated `requestId`.
  * `src/middleware/request-id.middleware.ts`: Generates and propagates `x-request-id` header.
  * `src/middleware/request-logger.middleware.ts`: Pino HTTP access logging with latency metrics.
  * `src/middleware/validate.middleware.ts`: Generic Zod validation middleware for `body`, `query`, and `params`.
* **Modules:**
  1. `health`: Health check probes (`GET /api/health`, `GET /api/v1/health`) inspecting database connectivity, uptime, and memory usage.
  2. `auth`: User registration, login, token refresh, logout, profile update, password change, account recovery.
  3. `org`: Organization onboarding, settings updates, member invitations, role management, membership listing.
  4. `ticket`: Ticket creation, filtered listing, assignment, status transitions, internal notes, customer replies.
  5. `kb`: Document upload (PDF, TXT, MD), file validation, secure storage, text extraction, semantic chunking, vector indexing.
  6. `chat`: RAG customer chatbot, conversation threading, citation generation, spending cap enforcement.
  7. `ai-assist`: AI ticket summarization, classification, draft reply suggestions, usage ledger recording.
* **Database & Persistence (`backend/prisma/`):**
  * `schema.prisma`: Comprehensive 12-model relational schema with foreign key cascades, unique constraints, and indexes.
  * `src/repositories/prisma.ts`: Prisma Client singleton with connection pooling and query logging.
  * `src/repositories/dev-fallback.store.ts`: High-resilience in-memory fallback store active during local development when PostgreSQL is offline.

### 2.3 Frontend (`frontend/`)
* **Entry Point:** `src/main.tsx` mounting `src/App.tsx` into `index.html`.
* **State & Context:**
  * `src/context/AuthContext.tsx`: Authentication state, JWT token storage, automatic silent refresh, login/logout.
  * `src/context/TenantContext.tsx`: Active organization context, organization switching, role-based capability flags.
* **Component System:**
  * `src/components/ui/`: Atomic UI components (Button, Input, Select, Badge, Card, Modal, Dropdown, Table, LoadingSpinner).
  * `src/components/common/`: ErrorBoundary, ProtectedRoute, RoleGuard, Toast notifications.
  * `src/components/layout/`: SaaS AppLayout with sidebar navigation, header, organization switcher, user avatar.
  * `src/components/landing/`: High-converting B2B landing page with features, pricing, testimonials, and interactive RAG demo sandbox.
  * `src/components/auth/`: Login, registration, account recovery, instant evaluation demo profiles.
  * `src/components/dashboard/`: Role-aware metrics dashboard with ticket trends, resolution times, and quick action cards.
  * `src/components/tickets/`: Ticket queue, status filter tabs, ticket details modal, conversation replies, internal agent notes.
  * `src/components/kb/`: Knowledge base document repository, upload dropzone, processing status tags, delete modal.
  * `src/components/chat/`: Real-time RAG support assistant with expandable source citations and streaming simulation.
  * `src/components/analytics/`: AI usage analytics, token consumption charts, cost estimates, organization breakdown.
  * `src/components/settings/`: Organization profile, AI threshold sliders, monthly spend cap settings, member role administration.
  * `src/components/profile/`: User profile settings, avatar URL configuration, password change forms.
* **API Client Layer (`frontend/src/services/`):**
  * `api.ts`: Base fetch wrapper with error translation and headers.
  * `auth.api.ts`: Authentication, registration, session refresh, organization onboarding.
  * `ticket.api.ts`: Ticket CRUD, metrics, comments, assignments.
  * `kb.api.ts`: Document upload, document listing, processing inspection, deletion.
  * `chat.api.ts`: Conversation initialization, message dispatch, citation retrieval.
  * `ai-assist.api.ts`: AI summarization, classification, reply generation triggers.

### 2.4 DevOps & Infrastructure (`docker/`, `scripts/`)
* `docker/Dockerfile.backend`: Multi-stage build (builder $\rightarrow$ production runner) running as non-root `node` user.
* `docker/Dockerfile.frontend`: Multi-stage Vite build served by hardened Nginx with security headers and caching rules.
* `docker/docker-compose.prod.yml`: Production orchestration containerizing backend, frontend, and PostgreSQL + pgvector.
* `docker/nginx.conf`: Nginx reverse proxy configuration with gzip compression, security headers, and single-page routing fallback.
* `scripts/backup-db.sh` & `.ps1`: Automated PostgreSQL database backup scripts producing timestamped gzipped SQL dumps.
* `scripts/restore-db.sh` & `.ps1`: Safe database restoration scripts with confirmation safety gates.
* `scripts/smoke-test.ts`: Automated HTTP smoke test suite validating deployment health, CORS, headers, auth, and AI.

---

## 3. Frontend-to-Backend Communication Paths

All frontend services communicate via standard REST JSON APIs using the `/api/v1` namespace. In local development, the Vite dev server proxies requests from `http://localhost:5173/api` directly to `http://localhost:5000/api`.

| Feature Area | Frontend Service | Backend Route | HTTP Method | Auth Requirement |
|---|---|---|---|---|
| **Health** | Browser / Monitoring | `/api/health` & `/api/v1/health` | GET | Public |
| **Register** | `auth.api.ts::registerApi` | `/api/v1/auth/register` | POST | Public |
| **Login** | `auth.api.ts::loginApi` | `/api/v1/auth/login` | POST | Public (Rate limited) |
| **Refresh** | `auth.api.ts::refreshApi` | `/api/v1/auth/refresh` | POST | HttpOnly Cookie / Body |
| **Logout** | `auth.api.ts::logoutApi` | `/api/v1/auth/logout` | POST | Authenticated |
| **Profile** | `auth.api.ts::getMeApi` | `/api/v1/auth/me` | GET | Authenticated |
| **Org Creation** | `auth.api.ts::createOrgApi` | `/api/v1/organizations` | POST | Authenticated |
| **Org Members** | `auth.api.ts::getOrgMembersApi` | `/api/v1/organizations/:orgId/members` | GET | Tenant Member |
| **Ticket List** | `ticket.api.ts::getTicketsApi` | `/api/v1/organizations/:orgId/tickets` | GET | Tenant Member |
| **Ticket Create** | `ticket.api.ts::createTicketApi` | `/api/v1/organizations/:orgId/tickets` | POST | Tenant Member |
| **Ticket Details**| `ticket.api.ts::getTicketByIdApi`| `/api/v1/organizations/:orgId/tickets/:id`| GET | Tenant Member |
| **Ticket Update** | `ticket.api.ts::updateTicketApi` | `/api/v1/organizations/:orgId/tickets/:id`| PATCH | Agent / Owner |
| **Comments** | `ticket.api.ts::addCommentApi` | `/api/v1/organizations/:orgId/tickets/:id/comments` | POST | Tenant Member |
| **KB Upload** | `kb.api.ts::uploadDocApi` | `/api/v1/organizations/:orgId/documents` | POST (multipart) | Agent / Owner |
| **KB List** | `kb.api.ts::getDocsApi` | `/api/v1/organizations/:orgId/documents` | GET | Tenant Member |
| **KB Delete** | `kb.api.ts::deleteDocApi` | `/api/v1/organizations/:orgId/documents/:id` | DELETE | Agent / Owner |
| **Chat Send** | `chat.api.ts::sendMessageApi` | `/api/v1/organizations/:orgId/chat/conversations/:id/messages` | POST | Tenant Member |
| **AI Assist** | `ai-assist.api.ts::summarizeTicketApi` | `/api/v1/organizations/:orgId/ai/tickets/:id/summarize` | POST | Agent / Owner |

---

## 4. Database Schema, Relationships & Indexes

* **Multi-Tenant Scoping:** Every entity (tickets, comments, knowledge documents, chunks, chat conversations, messages, usage records, audit logs) carries a non-nullable foreign key `organization_id` referencing `organizations.id` with `onDelete: Cascade`.
* **Customer Isolation:** Customers are strictly constrained by `customerId = actorUser.id` queries on tickets and conversations.
* **Vector Embeddings:** Stored in `document_chunks.embedding` using PostgreSQL extension `vector(1536)` with cosine distance similarity search (`<=>` operator).
* **Indexes:** Multi-column compound indexes on `(organization_id, status)`, `(organization_id, priority)`, `(organization_id, customerId)`, `(organization_id, createdAt DESC)` for fast deterministic sorting and pagination.

---

## 5. AI Pipeline Architecture

* **Completion Provider Adapter (`completion.provider.ts`):**
  * Primary: OpenAI API (`gpt-4o-mini`) using native `fetch` with 30s timeout, exponential backoff retries (2 retries), and usage ledger tracking.
  * Fallback: `DeterministicLocalCompletionProvider` simulating structured summaries, lexical classifications, grounded RAG answers with citations, and reply suggestions without external API dependencies.
* **Embedding Provider Adapter (`embedding.provider.ts`):**
  * `DeterministicLocalEmbeddingProvider`: 1536-dimensional L2-normalized vector projection using FNV-1a hash and n-gram analysis, ensuring local vector search runs deterministically without paid OpenAI credits.
* **Vector Repository (`vector.repo.ts`):**
  * Executes raw SQL queries against PostgreSQL pgvector extension using cosine distance `1 - (embedding <=> $vector) as similarity`.
* **Safety & Guardrails:**
  * Strict monthly budget enforcement (`aiMonthlySpendLimitUsd`).
  * Confidence threshold cutoff (`ragConfidenceThreshold`, default 0.65).
  * Prompt injection resistance (context clearly delimited from system instructions).
  * Citations verify real chunks and titles (`[Document X: title]`).
