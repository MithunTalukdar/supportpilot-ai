# SupportPilot AI — Production Deployment Guide & Runbook

**Document Version:** 1.0.0  
**Target Release:** Release Candidate 1.0.0 (RC1)  
**Security Classification:** Confidential — Operational Procedures

---

## 1. Overview & Architecture Review

SupportPilot AI is engineered as a cloud-native, multi-tenant SaaS application comprising:
1. **Frontend Client:** React 18 Single Page Application (SPA) built with Vite and Tailwind CSS. Packaged as a high-performance static bundle served via global CDN or hardened Nginx web server.
2. **Backend API Service:** Express.js + TypeScript server running on Node.js 20 LTS. Containerized with multi-stage Docker builds, `dumb-init` signal handling, and health probes.
3. **Database Tier:** PostgreSQL 15+ relational database with the official `pgvector` extension enabled for storing document chunk vector embeddings and executing cosine similarity search queries.
4. **AI Gateway:** Pluggable LLM and embedding gateway connecting to OpenAI, Anthropic, or Google Gemini with token metering, spend caps, and prompt injection defenses.
5. **Reverse Proxy & TLS Termination:** Cloudflare, AWS CloudFront, or Nginx terminating TLS 1.3 and enforcing HTTPS and security headers (HSTS, CSP, X-Frame-Options).

```
                      ┌─────────────────────────────────┐
                      │    DNS / CDN / TLS Gateway      │
                      │   (Cloudflare / AWS CloudFront) │
                      └──────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │     Frontend SPA        │             │   Backend API Service   │
    │  (Static CDN / Nginx)   │             │   (Node 20 / Express)   │
    │   app.supportpilot.ai   │             │   api.supportpilot.ai   │
    └─────────────────────────┘             └────────────┬────────────┘
                                                         │
                                        ┌────────────────┴────────────────┐
                                        ▼                                 ▼
                         ┌─────────────────────────────┐    ┌─────────────────────────────┐
                         │   PostgreSQL 16 + pgvector  │    │     External AI Gateway     │
                         │    (RDS / Supabase / Neon)  │    │  (OpenAI / Gemini / Claude) │
                         └─────────────────────────────┘    └─────────────────────────────┘
```

---

## 2. Environment Variables Directory

The following configuration parameters must be supplied via your hosting provider's secure environment settings. **Never commit real values into Git repositories or public build logs.**

| Variable Name | Required | Example / Format | Purpose | Where Configured |
| :--- | :---: | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations, secure cookies, and stripped stack traces | Backend Service |
| `PORT` | **Yes** | `5000` | HTTP port the Express server listens on | Backend Service |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/dbname?schema=public&sslmode=require` | PostgreSQL connection string with SSL enforcement | Backend Secrets |
| `JWT_SECRET` | **Yes** | 64-char random hex string (`openssl rand -hex 32`) | Cryptographic key used to sign access tokens (15m) | Backend Secrets |
| `JWT_EXPIRES_IN` | No | `15m` | Lifetime of short-lived access tokens | Backend Service |
| `REFRESH_TOKEN_SECRET` | **Yes** | 64-char random hex string (`openssl rand -hex 32`) | Cryptographic key used to hash refresh tokens | Backend Secrets |
| `REFRESH_TOKEN_EXPIRES_IN`| No | `7d` | Lifetime of long-lived refresh tokens | Backend Service |
| `FRONTEND_URL` | **Yes** | `https://app.supportpilot.ai` | Primary frontend web application URL (no trailing slash) | Backend Service |
| `CORS_ALLOWED_ORIGINS` | No | `https://app.supportpilot.ai,https://supportpilot.ai` | Comma-separated list of allowed CORS origins | Backend Service |
| `COOKIE_SAME_SITE` | No | `lax` or `strict` or `none` | Cross-site cookie attribute. Use `lax` for subdomains; `none` for cross-domains | Backend Service |
| `COOKIE_SECURE` | No | `true` | Enforces `Secure` flag on refresh token HTTP cookies | Backend Service |
| `COOKIE_DOMAIN` | No | `.supportpilot.ai` | Domain attribute for sharing cookies across subdomains | Backend Service |
| `LOG_LEVEL` | No | `info` | Pino structured logging verbosity (`fatal`, `error`, `warn`, `info`, `debug`) | Backend Service |
| `AI_PROVIDER` | No | `openai` (or `gemini`, `anthropic`) | Active AI completion and embedding adapter | Backend Service |
| `OPENAI_API_KEY` | Conditional | `sk-proj-...` | API key if using OpenAI GPT-4o / text-embedding-3-small | Backend Secrets |
| `GEMINI_API_KEY` | Conditional | `AIzaSy...` | API key if using Google Gemini 1.5 | Backend Secrets |
| `VITE_API_URL` | **Yes** | `https://api.supportpilot.ai/api` (or `/api`) | Backend API base URL baked into frontend SPA at build time | Frontend Build Settings |

---

## 3. Hosting Platform Deployment Options

### Option A: Render.com (Automated Infrastructure as Code)
SupportPilot AI includes a turnkey [`render.yaml`](file:///d:/supportpilot-ai/render.yaml) blueprint specification:
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Select **New** $\rightarrow$ **Blueprint**.
3. Connect the repository containing SupportPilot AI.
4. Render will parse `render.yaml` and provision:
   - A managed PostgreSQL database with starter tier.
   - The backend Web Service with health check `/api/health`.
   - The frontend Static Site with SPA fallback routing.
5. In the backend service settings, add your `OPENAI_API_KEY` or `GEMINI_API_KEY`.
6. Click **Apply Blueprint**.

### Option B: Docker Compose (Self-Hosted / VPS)
SupportPilot AI provides production Dockerfiles and a composition stack:
- Backend: [`docker/Dockerfile.backend`](file:///d:/supportpilot-ai/docker/Dockerfile.backend)
- Frontend: [`docker/Dockerfile.frontend`](file:///d:/supportpilot-ai/docker/Dockerfile.frontend)
- Nginx Config: [`docker/nginx.conf`](file:///d:/supportpilot-ai/docker/nginx.conf)
- Compose File: [`docker/docker-compose.prod.yml`](file:///d:/supportpilot-ai/docker/docker-compose.prod.yml)

**Execution Commands:**
```bash
# 1. Create a secure environment file from the production template
cp .env.production.example .env.production
chmod 600 .env.production

# 2. Fill in database passwords, JWT secrets, and AI keys
# (Edit .env.production with your secret values)

# 3. Launch the container stack in detached mode
docker compose -f docker/docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Run database migrations within the backend container
docker compose -f docker/docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Verify service health
curl -f http://localhost:5000/api/health
```

### Option C: AWS Enterprise Deployment (ECS Fargate + RDS + CloudFront)
1. **Database:** Provision Amazon RDS for PostgreSQL 16. Enable `pgvector` by executing `CREATE EXTENSION IF NOT EXISTS vector;` via RDS query editor. Store credentials in AWS Secrets Manager.
2. **Backend API:** Build [`docker/Dockerfile.backend`](file:///d:/supportpilot-ai/docker/Dockerfile.backend), push to Amazon ECR, and deploy to an AWS ECS Fargate cluster with an Application Load Balancer (ALB) targeting port 5000 and health check path `/api/health`.
3. **Frontend SPA:** Run `npm run build` in `frontend/`, sync `frontend/dist/` to an Amazon S3 bucket, and attach an Amazon CloudFront distribution with HTTPS redirection and custom domain routing.

---

## 4. Production Database Migration Runbook

Database migrations in production must adhere to zero-downtime guidelines:

### Pre-Migration Requirements
1. **Never run `prisma migrate dev` in production.** It can trigger interactive prompts and unintended schema resets. Always run:
   ```bash
   npx prisma migrate deploy
   ```
2. **Execute a pre-migration backup** using the automated backup script before every migration:
   ```bash
   ./scripts/backup-db.sh
   # On Windows:
   .\scripts\backup-db.ps1
   ```
3. **Review Migration SQL:** Inspect the SQL statements in `backend/prisma/migrations/` to verify backward compatibility. Never drop a column or rename a table while the previous version of the application is running.

### Migration Execution Procedure
1. Confirm the pre-migration snapshot is verified and saved.
2. Trigger the migration command:
   ```bash
   npm run prisma:migrate:deploy -w backend
   ```
3. Check the exit status code. Code `0` indicates all pending migrations were applied successfully.

---

## 5. Safe Backup and Disaster Recovery Strategy

### 5.1 Automated Database Snapshot
SupportPilot AI includes [`scripts/backup-db.sh`](file:///d:/supportpilot-ai/scripts/backup-db.sh) (and [`scripts/backup-db.ps1`](file:///d:/supportpilot-ai/scripts/backup-db.ps1)) which executes:
- `pg_dump` with custom archive format (`-Fc`), preserving table structures, vector indexes, and blob contents with gzip compression.
- Calculates SHA256 checksum stored in `.sha256` signature file.
- Redacts database credentials from stdout.

**Recommended Backup Schedule:**
- **Full Database Snapshot:** Daily at 02:00 UTC (retained for 30 days).
- **WAL / Continuous Archiving:** Point-in-time recovery (PITR) enabled on managed database provider (retained for 7 days).
- **Off-Site Replication:** Backup `.dump` and `.sha256` files synced to an encrypted cloud bucket (AWS S3 Glacier or GCS Archive).

### 5.2 Restoration & Recovery Procedure
In the event of accidental data corruption or disaster recovery:
1. Run [`scripts/restore-db.sh`](file:///d:/supportpilot-ai/scripts/restore-db.sh):
   ```bash
   ./scripts/restore-db.sh ./backups/supportpilot_backup_YYYYMMDD_HHMMSS.dump
   ```
2. The script will:
   - Verify the `.sha256` checksum before touching the database.
   - Require explicit typing of `RESTORE-CONFIRMED`.
   - Take a safety snapshot of the existing database state prior to applying the restore.
   - Execute `pg_restore --clean --if-exists`.
3. Re-run health checks and verify database consistency.

---

## 6. Rollback Procedures

If an issue is detected during or immediately following deployment:

### 6.1 Frontend Rollback
- **Static Hosting / CDN (Vercel / Cloudflare / Netlify / Render):** Click **Rollback** on the provider dashboard to instantly point the CDN edge to the previous deployment artifact. Rollback duration: **< 10 seconds**.
- **Container / S3:** Re-point CloudFront to the previous S3 bucket folder or re-tag the previous Docker image.

### 6.2 Backend Rollback
- **Container Services:** Roll back the container image tag to the previously stable image (e.g., `supportpilot-backend:v0.1.0-rc1` $\rightarrow$ `supportpilot-backend:v0.1.0-prev`).
- **Database Schema Considerations:** Because SupportPilot AI follows expand-and-contract schema migrations, the previous backend version remains 100% compatible with additive database changes.

---

## 7. Post-Deployment Verification (Smoke Testing)

Immediately following a deployment, execute the non-destructive smoke test suite against the target production URL:

```bash
# Run against deployed backend
npx tsx scripts/smoke-test.ts https://api.supportpilot.ai
```

The script verifies:
1. `GET /api/health` $\rightarrow$ Returns 200, system `UP`, database `CONNECTED`.
2. Security headers $\rightarrow$ Validates `X-Content-Type-Options: nosniff`, framing defense, and `X-Request-Id`.
3. CORS allowlist preflight $\rightarrow$ Validates `OPTIONS` request accepts frontend origin.
4. Unauthenticated route protection $\rightarrow$ Verifies `/api/tickets/queue` rejects unauthorized calls (401).
5. Ephemeral session lifecycle $\rightarrow$ Registers a test agent, receives JWT, validates HttpOnly refresh cookie.
6. Controlled AI assistant probe $\rightarrow$ Verifies LLM response and citation structures without hallucination.
7. Session logout $\rightarrow$ Revokes token family cleanly.
