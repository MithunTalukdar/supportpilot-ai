# SupportPilot AI — Production Deployment Checklist & Approval Gates

**Target Release:** Release Candidate 1.0.0 (RC1)  
**Safety Protocol:** Strict Manual Approval Required for all production-affecting actions.  
**Rule:** No automatic deployments, destructive migrations, or external commits may occur without explicit user approval.

---

## 1. Summary of Manual Approval Checkpoints

Before touching any live production infrastructure, the following **6 manual approval gates** must be explicitly authorized by you:

| Gate | Checkpoint Title | Why Approval is Required | Action Performed After Approval |
| :---: | :--- | :--- | :--- |
| **GATE 1** | **Database Provisioning Approval** | Involves cloud infrastructure costs and PostgreSQL instance creation. | Provision PostgreSQL 15+ instance with `pgvector` extension enabled. |
| **GATE 2** | **Production Secrets Approval** | Ensures secrets are injected into hosting provider dashboards without exposing them in repositories or chat logs. | Manually populate `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `OPENAI_API_KEY` in the hosting platform's secure environment settings. |
| **GATE 3** | **Database Migration Approval** | Prevents unintended schema mutations or data corruption on the target database. | Execute a verified pre-migration backup (`scripts/backup-db.sh`) and run non-destructive migrations (`npx prisma migrate deploy`). |
| **GATE 4** | **Deployment Build Trigger Approval** | Authorizes compiling and pushing live container images and static web assets. | Trigger production builds (`Dockerfile.backend`, `Dockerfile.frontend`) or initiate cloud deployment in Render / AWS / Vercel. |
| **GATE 5** | **DNS & Domain Cutover Approval** | Diverts live user traffic and affects production routing. | Update DNS records (`CNAME` / `A` records) to point to the new deployment endpoints. |
| **GATE 6** | **Live Production Sign-Off Approval** | Validates that all primary user journeys and security assertions pass before public release. | Execute live smoke test suite (`scripts/smoke-test.ts`) and certify Release Candidate 1.0.0 as active production. |

---

## 2. Phase-by-Phase Production Deployment Checklist

### Phase A: Pre-Deployment Validation (Local Workspace)
*All items verified and passing in current local workspace.*

- [x] **A.1 Static Type Checks:** `npx tsc --noEmit` passed with 0 errors across frontend and backend.
- [x] **A.2 Linting Analysis:** `npm run lint` passed with 0 errors and 0 warnings.
- [x] **A.3 Production Builds:** Backend (`tsc`) and Frontend (`vite build`) compiled cleanly into `dist/`.
- [x] **A.4 Automated Test Suites:** 80 out of 80 tests passing (57 backend + 23 frontend in Vitest).
- [x] **A.5 Secret Exposure Audit:** Compiled frontend bundle scanned for secrets; 0 secrets found.
- [x] **A.6 Deployment Artifacts Prepared:** Multi-stage Dockerfiles, Nginx config, compose specs, and PaaS templates created.

---

### Phase B: Infrastructure Provisioning (**Requires User Approval: Gate 1**)

- [ ] **B.1 Database Provisioning:**
  - *Action:* Create PostgreSQL 15+ instance on target provider (AWS RDS, Supabase, Neon, or Render).
  - *Verification:* Execute query `CREATE EXTENSION IF NOT EXISTS vector;` and verify `SELECT * FROM pg_extension WHERE extname = 'vector';` returns 1 row.
  - *Status:* **PENDING USER APPROVAL (GATE 1)**

- [ ] **B.2 Secure Storage / Volume Provisioning:**
  - *Action:* Configure persistent volume or cloud object storage bucket for knowledge base document uploads.
  - *Status:* **PENDING USER APPROVAL (GATE 1)**

---

### Phase C: Environment & Secrets Configuration (**Requires User Approval: Gate 2**)

- [ ] **C.1 Backend Secrets Configuration:**
  - *Action:* In the backend hosting dashboard (e.g. Render / AWS Secrets Manager), inject:
    - `DATABASE_URL` (with `sslmode=require`)
    - `JWT_SECRET` (generated 64-char random hex string)
    - `REFRESH_TOKEN_SECRET` (generated 64-char random hex string)
    - `AI_PROVIDER` (`openai` or `gemini`)
    - `OPENAI_API_KEY` (or `GEMINI_API_KEY`)
  - *Verification:* Confirm secrets are hidden and masked in provider console.
  - *Status:* **PENDING USER APPROVAL (GATE 2)**

- [ ] **C.2 Backend Environment Settings:**
  - *Action:* Configure `NODE_ENV=production`, `PORT=5000`, `FRONTEND_URL=https://app.supportpilot.ai`, `CORS_ALLOWED_ORIGINS=https://app.supportpilot.ai,https://supportpilot.ai`, `COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`.
  - *Status:* **PENDING USER APPROVAL (GATE 2)**

- [ ] **C.3 Frontend Environment Settings:**
  - *Action:* Configure `VITE_API_URL=https://api.supportpilot.ai/api` (or `/api` if using unified reverse proxy).
  - *Status:* **PENDING USER APPROVAL (GATE 2)**

---

### Phase D: Database Migration (**Requires User Approval: Gate 3**)

- [ ] **D.1 Pre-Migration Database Snapshot:**
  - *Action:* Execute [`scripts/backup-db.sh`](file:///d:/supportpilot-ai/scripts/backup-db.sh) to capture a point-in-time snapshot of the database before applying migrations.
  - *Verification:* Confirm `.dump` and `.sha256` files exist and are verified.
  - *Status:* **PENDING USER APPROVAL (GATE 3)**

- [ ] **D.2 Non-Destructive Migration Deployment:**
  - *Action:* Execute `npx prisma migrate deploy` in the production environment.
  - *Verification:* Verify command exits with code 0 and all tables (`User`, `Organization`, `Ticket`, `KnowledgeDocument`, `DocumentChunk`, `AuditLog`, `AiUsageLedger`) are created with proper indexes.
  - *Status:* **PENDING USER APPROVAL (GATE 3)**

---

### Phase E: Application Deployment (**Requires User Approval: Gate 4**)

- [ ] **E.1 Backend Container Deployment:**
  - *Action:* Build and run [`docker/Dockerfile.backend`](file:///d:/supportpilot-ai/docker/Dockerfile.backend) or trigger Render/AWS web service build.
  - *Verification:* Container health check passes (`curl -f http://backend:5000/api/health`).
  - *Status:* **PENDING USER APPROVAL (GATE 4)**

- [ ] **E.2 Frontend Static Deployment:**
  - *Action:* Build and publish [`docker/Dockerfile.frontend`](file:///d:/supportpilot-ai/docker/Dockerfile.frontend) or push to static CDN edge.
  - *Verification:* Browser loads landing page without HTTP 404s or console script errors.
  - *Status:* **PENDING USER APPROVAL (GATE 4)**

---

### Phase F: Network, DNS & SSL Cutover (**Requires User Approval: Gate 5**)

- [ ] **F.1 DNS Records Update:**
  - *Action:* Point domain records:
    - `app.supportpilot.ai` $\rightarrow$ Frontend CDN / Load Balancer.
    - `api.supportpilot.ai` $\rightarrow$ Backend Container / Application Load Balancer.
  - *Status:* **PENDING USER APPROVAL (GATE 5)**

- [ ] **F.2 SSL/TLS Certificate Verification:**
  - *Action:* Validate that SSL certificate is active and TLS 1.3 is negotiated on both domains.
  - *Status:* **PENDING USER APPROVAL (GATE 5)**

---

### Phase G: Post-Deployment Verification & Smoke Testing (**Requires User Approval: Gate 6**)

- [ ] **G.1 Automated Smoke Test Execution:**
  - *Action:* Run non-destructive smoke test against live production URL:
    ```bash
    npx tsx scripts/smoke-test.ts https://api.supportpilot.ai
    ```
  - *Verification:* 100% pass rate across health, headers, CORS, auth, and AI probes.
  - *Status:* **PENDING USER APPROVAL (GATE 6)**

- [ ] **G.2 Manual End-to-End User Journey Verification:**
  - *Step 1:* Register an organization owner account (`owner@company.com`).
  - *Step 2:* Complete organization onboarding workspace creation.
  - *Step 3:* Create a support ticket as a customer and reply as an agent.
  - *Step 4:* Upload a sample PDF knowledge base document and observe processing status transition from `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED`.
  - *Step 5:* Ask a question to the AI support assistant and verify real source citations.
  - *Step 6:* Refresh browser, log out, and log back in to confirm session persistence.
  - *Status:* **PENDING USER APPROVAL (GATE 6)**

---

## 3. Rollback Action Plan

If any critical issue or regression occurs during deployment:

1. **Frontend Regressions:**
   - In CDN dashboard (Render, Vercel, CloudFront), click **Rollback to Previous Release**.
   - Immediate cutover back to the previous stable static bundle in <10 seconds.
2. **Backend Regressions:**
   - Re-deploy previous container image tag.
3. **Database Corruption / Schema Conflicts:**
   - Execute [`scripts/restore-db.sh`](file:///d:/supportpilot-ai/scripts/restore-db.sh) specifying the pre-migration snapshot created in Step D.1.
