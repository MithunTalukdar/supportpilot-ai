# SupportPilot AI — Enterprise AI Support & Business Automation SaaS

SupportPilot AI is a production-grade, multi-tenant customer support and business automation SaaS platform. It combines high-speed ticket lifecycle management, role-based multi-tenancy, and Retrieval-Augmented Generation (RAG) powered by PostgreSQL `pgvector`.

---

## Architecture & Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (Glassmorphism & dark-mode design system)
- **Backend:** Node.js, Express, TypeScript (Layered architecture: Controllers, Services, Repositories)
- **Database & Vectors:** PostgreSQL 16+ with `pgvector` extension & Prisma ORM
- **Security:** Strict tenant isolation, Helmet security headers, CORS allowlist, Zod schema validation, Argon2id hashing
- **Testing & Tooling:** Vitest, Supertest, React Testing Library, ESLint

Detailed specifications and audit reports are available in the [`docs/`](./docs) directory:
- [Architecture Blueprint](docs/ARCHITECTURE.md)
- [Database & Schema Specification](docs/DATABASE.md)
- [REST API Specification](docs/API.md)
- [Security & Threat Model](docs/SECURITY.md)
- [Phased Implementation Roadmap](docs/IMPLEMENTATION_PLAN.md)
- [QA Audit Report (Phase 7)](docs/QA_REPORT.md)
- [Security Review (Phase 7)](docs/SECURITY_REVIEW.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Production Deployment Checklist & Approval Gates](docs/DEPLOYMENT_CHECKLIST.md)

---

## Directory Structure

```
supportpilot-ai/
├── docs/                     # Approved system design and architectural specifications
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── SECURITY.md
│   └── IMPLEMENTATION_PLAN.md
├── backend/                  # Node.js + Express API backend
│   ├── prisma/               # Prisma schema with pgvector and seed scripts
│   ├── src/
│   │   ├── config/           # Startup environment validation (Zod)
│   │   ├── constants/        # HTTP status and error codes
│   │   ├── errors/           # Centralized AppError hierarchy
│   │   ├── logging/          # Pino structured logger
│   │   ├── middleware/       # CORS, Request ID, Tracing, Zod Validator, Error Handler
│   │   ├── modules/          # Domain modules (health check, tickets, etc.)
│   │   ├── repositories/     # Prisma client and vector adapters
│   │   ├── routes/           # Express API router definitions
│   │   ├── app.ts            # Express application bootstrap
│   │   └── server.ts         # Server lifecycle and graceful shutdown
│   ├── tests/                # Automated Vitest API integration tests
│   ├── .env.example          # Backend configuration template
│   └── package.json
├── frontend/                 # React + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/       # UI library (Button, Badge, Card, Spinner, AlertBanner)
│   │   ├── layout/           # AppShell, Navbar, Sidebar
│   │   ├── services/         # Typed API fetch client
│   │   ├── types/            # Domain and telemetry types
│   │   ├── App.tsx           # Responsive shell with live health telemetry
│   │   └── main.tsx          # DOM root bootstrap wrapped in ErrorBoundary
│   ├── tests/                # Vitest and React Testing Library tests
│   ├── .env.example          # Frontend configuration template
│   └── package.json
├── package.json              # Monorepo workspaces and concurrent dev scripts
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js:** v20.x or v22.x LTS
- **npm:** v10.x or v11.x
- **PostgreSQL:** v15+ (with `pgvector` extension enabled)

### 2. Installation
Install all dependencies across the workspace from the root directory:
```bash
npm install
```

### 3. Environment Configuration
Copy the template files into active environment files:

#### Backend:
```bash
cp backend/.env.example backend/.env
```
Ensure your `backend/.env` has a valid PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/supportpilot_db?schema=public"
```

#### Frontend:
```bash
cp frontend/.env.example frontend/.env
```

### 4. Database Setup (Prisma)
Generate the Prisma Client:
```bash
npm run prisma:generate
```

To run database migrations against your PostgreSQL instance:
```bash
npm run prisma:migrate -w backend
```

---

## Running the Application Locally

You can launch both applications simultaneously with a single command from the project root:

```bash
npm run dev
```

Or run each service independently in separate terminals:

### Run Backend Only (Port 5000):
```bash
npm run dev:backend
```
Backend health check is accessible at: `http://localhost:5000/api/health`

### Run Frontend Only (Port 5173):
```bash
npm run dev:frontend
```
Frontend application is accessible at: `http://localhost:5173`

---

## Automated Verification & Testing

Run all automated test suites across both frontend and backend:
```bash
npm run test
```

### Run Tests Independently:
- **Backend tests:** `npm run test:backend`
- **Frontend tests:** `npm run test:frontend`

### Run Type Checking & Production Builds:
```bash
npm run build
```

### Run Linting:
```bash
npm run lint
```

---

## Health Check Endpoint Specification

- **Method:** `GET /api/health` (also accessible at `/api/v1/health`)
- **Access Level:** Public / Monitoring
- **Example Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "timestamp": "2026-10-26T15:00:00.000Z",
    "uptimeSeconds": 142,
    "environment": "development",
    "services": {
      "database": {
        "status": "CONNECTED",
        "latencyMs": 3
      },
      "memory": {
        "rssMb": 48.2,
        "heapUsedMb": 22.1,
        "heapTotalMb": 34.5
      }
    }
  }
}
```
*Note: If the database is unreachable, the endpoint returns a `503 Service Unavailable` with `"status": "DEGRADED"` and never leaks passwords or credentials in the response.*

---

## Production Deployment & Containerization

### 1. Launch with Production Docker Compose
Deploy PostgreSQL (pgvector), the backend API, and the Nginx frontend SPA in a unified production stack:
```bash
# Copy and configure production environment variables
cp .env.production.example .env.production

# Launch containers
docker compose -f docker/docker-compose.prod.yml --env-file .env.production up -d --build

# Run non-destructive production migrations
docker compose -f docker/docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 2. Live Deployment Smoke Testing
Verify a deployed instance without damaging existing data:
```bash
npx tsx scripts/smoke-test.ts https://api.supportpilot.ai
```

### 3. Database Backup & Disaster Recovery
```bash
# Capture full database snapshot with SHA256 checksum
./scripts/backup-db.sh

# Restore snapshot safely (requires explicit confirmation)
./scripts/restore-db.sh ./backups/supportpilot_backup_YYYYMMDD_HHMMSS.dump
```

