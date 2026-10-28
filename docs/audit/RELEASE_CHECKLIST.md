# SupportPilot AI — Production Release & Deployment Checklist

**Target Release:** SupportPilot AI v1.0.0  
**Audit Status:** Baseline Audited, Repaired & 100% Tests Verified  
**Release Gatekeeper:** Application Security & DevOps Lead  

---

## 1. Release Readiness Summary

| Gate | Category | Requirement | Verified Status |
|---|---|---|---|
| **GATE 1** | Code Quality | Zero TypeScript compilation errors in frontend and backend | **PASS (0 Errors)** |
| **GATE 2** | Code Quality | Zero ESLint errors or React Hooks rule violations | **PASS (0 Errors)** |
| **GATE 3** | Build Artifacts| Production bundles compile cleanly (`dist/` generated) | **PASS (Both Packages)** |
| **GATE 4** | Automated Tests| 100% of unit & integration test suites pass | **PASS (80/80 Tests)** |
| **GATE 5** | Smoke Tests | Automated live deployment smoke test passes | **PASS (8/8 Checks)** |
| **GATE 6** | Security | Multi-tenant isolation verified across all modules | **PASS (Verified)** |
| **GATE 7** | Secrets Safety | Zero secrets committed or printed in logs/artifacts | **PASS (Zero Secrets)** |
| **GATE 8** | Deployment Docs| Clear runbook, backup/restore scripts, env templates | **PASS (Complete)** |
| **GATE 9** | Approval Gate | **Explicit Manual User Approval before production push** | **PENDING USER DECISION** |

---

## 2. Production Environment Variable Requirements

Configure these variables securely in your hosting provider's dashboard (e.g., Render, Railway, AWS ECS, or Docker Compose). **Never commit values to Git.**

### 2.1 Backend Environment Variables
```env
# Runtime
NODE_ENV=production
PORT=5000

# PostgreSQL Connection String (with pgvector enabled)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/supportpilot?schema=public&sslmode=require

# Frontend Origin for CORS Allowlist
FRONTEND_URL=https://app.supportpilot.ai

# Authentication & Session Security (Generate with: openssl rand -base64 48)
JWT_SECRET=SECURE_RANDOM_SECRET_KEY_MINIMUM_32_CHARACTERS_REQUIRED
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Optional OpenAI API Key (Enables real LLM completion; local fallback used if absent)
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_API_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
```

### 2.2 Frontend Environment Variables
```env
# Backend API Base URL (leave empty for same-domain reverse proxy)
VITE_API_URL=https://api.supportpilot.ai/api
```

---

## 3. Production Deployment Runbook

### Step 1: Database Migration
In the production environment, run Prisma migration deploy:
```bash
npx prisma migrate deploy
```
> [!IMPORTANT]
> Never run `prisma migrate dev` or `prisma db push --force-reset` in production!

### Step 2: Build & Start Containers via Docker Compose
```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

### Step 3: Verify Health Probe
```bash
curl -I https://api.supportpilot.ai/api/health
```
Verify response returns `HTTP/1.1 200 OK` and `x-request-id` header.

### Step 4: Run Automated Deployment Smoke Test
```bash
npx tsx scripts/smoke-test.ts https://api.supportpilot.ai
```
Ensure all 8 verification steps pass cleanly with 100% success.

---

## 4. Disaster Recovery & Rollback Procedure
* **Database Backup:** Run `scripts/backup-db.sh` to generate a timestamped compressed backup before every deployment.
* **Database Restore:** In the event of an unrecoverable failure, execute `scripts/restore-db.sh <backup_file.sql.gz>` after typing `YES` at the safety confirmation gate.
* **Container Rollback:** If the new release exhibits runtime defects, roll back the Docker image tag to the previous known good commit.
