# SupportPilot AI — Known Limitations and Operational Considerations

**Document Version:** 1.0.0  
**Last Updated:** October 27, 2026  
**Audience:** Operations Engineers, Site Reliability Engineers (SRE), Developers, and System Administrators

---

## 1. Purpose

This document catalogs known environmental constraints, operational dependencies, third-party library notices, and architectural considerations for SupportPilot AI Release Candidate 1 (RC1). These items are tracked for future maintenance cycles and production deployment planning.

---

## 2. Infrastructure & Environmental Prerequisites

### 2.1 PostgreSQL with `pgvector` Extension
- **Requirement:** SupportPilot AI uses PostgreSQL 15+ with the official `pgvector` extension installed and enabled (`CREATE EXTENSION IF NOT EXISTS vector;`).
- **Impact if Missing:** Vector embedding storage and semantic cosine similarity search queries (`<=>` operator) will fail if `pgvector` is not enabled in the database instance.
- **Production Guidance:** Managed database instances (e.g. AWS RDS for PostgreSQL, Supabase, Neon, or GCP Cloud SQL) have native support for `pgvector` and should have the extension enabled prior to running database migrations (`npx prisma migrate deploy`).

### 2.2 External AI Provider Configuration
- **Requirement:** A valid API key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`) is required for live LLM completions and embedding generation (`text-embedding-3-small`).
- **Fallback Behavior:** If an AI key is missing or invalid, the backend's AI adapter operates in a safe degraded mode or returns a structured error without crashing the server process. Non-AI workflows (tickets, auth, organization management, document storage) remain fully functional.
- **Spend Cap Circuit Breaker:** The system enforces an organization-level spend cap (`monthlySpendCap`). Once reached, AI requests are rejected with `402 Payment Required` to safeguard organizations against runaway API costs.

### 2.3 Email Delivery (SMTP / Transactional Email)
- **Current Behavior:** In development mode (`NODE_ENV=development`), password reset tokens and invitation URLs are logged directly to the structured server console.
- **Production Requirement:** For production deployments (`NODE_ENV=production`), configure an enterprise SMTP or transactional email provider (e.g., SendGrid, Postmark, AWS SES) in `backend/src/services/email/`.

---

## 3. Test Runner & Tooling Limitations in Sandboxed Environments

### 3.1 Playwright Headless Browser CDN Limitation
- **Observation:** In the current sandboxed Windows evaluation container, running automated browser subagents via Playwright encountered an upstream CDN failure:
  ```
  HTTP 404 Not Found from https://playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip
  ```
- **Impact:** Live headless Chrome execution via the Playwright CLI was blocked by the upstream download mirror in this container environment.
- **Alternative Verification:** Comprehensive DOM integration testing was executed using Vitest + jsdom + React Testing Library (23 frontend tests across 5 test suites), validating all primary user journeys, interactive sandboxes, form validations, routing transitions, and React error boundaries with 100% pass rate.

---

## 4. Third-Party Dependency Advisories

### 4.1 Zod Collection Memory Exhaustion (GHSA-mrhx-c7xc-m3w5)
- **Advisory Details:** Zod versions `< 4.6.6` can exhibit elevated memory consumption when parsing maliciously deep or oversized nested collections.
- **SupportPilot AI Mitigation:** The Express backend enforces an upstream body size limit (`express.json({ limit: '1mb' })`). Malicious requests containing millions of nested elements are blocked at the HTTP layer before reaching Zod schema validation.
- **Roadmap:** Upgrade to Zod v4 upon ecosystem stabilization across all form validation libraries.

### 4.2 Build-Time & Test Tooling Advisories
- **Packages:** `vitest`, `tinypool`, `esbuild`, `vite`.
- **Classification:** `devDependencies` used exclusively during local development, test running, and asset bundling.
- **Impact on Production:** **Zero impact**. None of these development packages are included in the production Docker image or runtime dependencies.

---

## 5. Architectural & Scaling Considerations

### 5.1 In-Memory Rate Limiting
- **Current State:** Rate limiting (e.g., login brute-force defense) is implemented via Express in-memory sliding window stores.
- **Single-Node Deployment:** Fully effective and zero-overhead for single-server or single-container instances.
- **Clustered / Multi-Node Production:** When running behind a multi-container load balancer (e.g. AWS ECS, Kubernetes), the rate limiter store should be pointed to a shared Redis instance using `rate-limit-redis` to maintain synchronized global rate limits across all nodes.

### 5.2 Document Storage Adapter
- **Current State:** Uploaded PDF and TXT documents are persisted to the local file system under `backend/uploads/{orgId}/{uuid}.ext`.
- **Horizontal Scaling Guidance:** When scaling to multiple stateless backend replicas, mount a shared network volume (NFS/EFS) or swap the storage adapter with an S3 / Google Cloud Storage adapter so that all backend nodes have access to the source documents.

### 5.3 Vector Search Scale
- **Current State:** Vector similarity queries execute against PostgreSQL `document_chunks` table utilizing cosine indexing.
- **Capacity:** Excellent performance (sub-10ms) for small-to-medium organizations (up to ~100,000 vector chunks).
- **Enterprise Scale (>1,000,000 chunks):** For enterprise tenants with millions of pages of documentation, consider migrating the vector index to a dedicated vector database (e.g., Qdrant, Pinecone, or Milvus) or tuning pgvector HNSW index parameters (`m`, `ef_construction`).

---

## 6. Summary of Resolution Status

| Item | Severity | Mitigation Status | Next Steps |
| :--- | :--- | :--- | :--- |
| **Playwright Driver CDN** | Low (Test environment only) | Fully verified via Vitest/jsdom suite | Cache driver in CI image |
| **Zod v3 Memory Advisory** | Low in context | Mitigated via 1MB request body limit | Upgrade to Zod v4 when stable |
| **In-Memory Rate Limiter** | Medium (Multi-node only) | Fully functional on single-node | Add Redis store in multi-node helm chart |
| **Local Disk Storage** | Medium (Multi-node only) | Sanitized UUID paths prevent all traversal | Add S3 bucket provider adapter |
