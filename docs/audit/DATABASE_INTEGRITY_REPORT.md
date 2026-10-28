# SupportPilot AI — Database Integrity & Schema Correctness Report

**Audit Date:** October 28, 2026  
**Auditor:** Senior Database Architect & Application Security Lead  
**Database Engine:** PostgreSQL 16+ with `pgvector` & `pgcrypto` extensions  
**ORM:** Prisma 5.22.0  
**Schema File:** `backend/prisma/schema.prisma`  

---

## 1. Executive Summary

A thorough read-only audit of the database schema, entity relationships, foreign key actions, multi-column indexes, transactions, and tenant isolation constraints was conducted.

The schema exhibits strong architectural rigor:
1. **Multi-Tenancy by Design:** All operational models (`Ticket`, `TicketComment`, `KnowledgeDocument`, `DocumentChunk`, `ChatConversation`, `ChatMessage`, `AiUsageRecord`, `AuditLog`) maintain a direct, non-nullable foreign key `organization_id` referencing `organizations.id` with `onDelete: Cascade`.
2. **Referential Integrity & Safe Deletions:** Critical customer and author relationships enforce `onDelete: Restrict` on `tickets.customer_id` and `ticket_comments.author_id` to prevent accidental deletion of historical audit trails when a user is deactivated.
3. **Optimized Indexes:** Compound indexes align directly with multi-tenant filtering and sorting patterns (`[organizationId, status]`, `[organizationId, priority]`, `[organizationId, createdAt DESC]`).
4. **Vector Compatibility:** The `document_chunks.embedding` field utilizes `Unsupported("vector(1536)")` which aligns with OpenAI's `text-embedding-3-small` and the internal deterministic L2-normalized 1536-d vector pipeline.

---

## 2. Model-by-Model Schema Audit

### 2.1 Identity & Tenant Models
* **`Organization` (`organizations`):**
  * Primary Key: UUID (`gen_random_uuid()`)
  * Unique: `slug` (VarChar 64)
  * Fields: `name`, `domain`, `settings` (JSONB with defaults for ticketPrefix, aiAutoReply, ragConfidenceThreshold), `created_at`, `updated_at`.
  * Integrity Assessment: Validated. Unique slug prevents organization collision; JSONB settings default prevents runtime null pointer exceptions.
* **`User` (`users`):**
  * Primary Key: UUID
  * Unique: `email` (VarChar 255, lowercased in validation schemas)
  * Integrity Assessment: Validated. Passwords stored exclusively as bcrypt hashes (`password_hash`).
* **`OrganizationMember` (`organization_members`):**
  * Composite Unique Constraint: `@@unique([organizationId, userId])`
  * Role Enum: `OWNER`, `AGENT`, `CUSTOMER`
  * Cascades: Both `organizationId` and `userId` enforce `onDelete: Cascade`.
  * Indexes: `@@index([userId])`, `@@index([organizationId, role])`.
  * Integrity Assessment: Enforces single membership per user per organization, preventing duplicate role conflicts.
* **`RefreshToken` (`refresh_tokens`):**
  * Unique: `token_hash` (SHA-256 hashed token)
  * Revocation Flag: `is_revoked` (Boolean)
  * Expiration: `expires_at` (DateTime)
  * Foreign Key: `userId` with `onDelete: Cascade`.
  * Integrity Assessment: Tokens are hashed before storage to prevent credential leakage in raw database backups.

### 2.2 Support Ticket Models
* **`Ticket` (`tickets`):**
  * Composite Unique Constraint: `@@unique([organizationId, ticketNumber])`
  * Auto-Sequencing: Ticket numbers are sequential per organization, providing clean customer-facing IDs (`#1001`).
  * Enums: `status` (`OPEN`, `IN_PROGRESS`, `WAITING_FOR_CUSTOMER`, `RESOLVED`, `CLOSED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  * Customer FK: `customerId` with `onDelete: Restrict` (prevents data loss).
  * Agent FK: `assignedAgentId` with `onDelete: SetNull` (reassigns cleanly if agent leaves).
  * Timestamps: `createdAt`, `updatedAt`, `resolvedAt` (nullable, set automatically on RESOLVED).
  * Indexes:
    * `@@index([organizationId, status])`
    * `@@index([organizationId, priority])`
    * `@@index([organizationId, customerId])`
    * `@@index([organizationId, assignedAgentId])`
    * `@@index([organizationId, createdAt(sort: Desc)])`
  * Integrity Assessment: Indexes perfectly support all dashboard and queue filtering patterns.
* **`TicketComment` (`ticket_comments`):**
  * Author FK: `authorId` with `onDelete: Restrict`.
  * Ticket FK: `ticketId` with `onDelete: Cascade`.
  * Visibility Flag: `isInternal` (Boolean, default `false`).
  * AI Flag: `aiGenerated` (Boolean, default `false`).
  * Index: `@@index([ticketId, createdAt(sort: Asc)])`.
  * Integrity Assessment: Optimized for chronological conversation rendering.

### 2.3 Knowledge Base & Vector Models
* **`KnowledgeDocument` (`knowledge_documents`):**
  * Status Enum: `PENDING`, `PROCESSING`, `INDEXED`, `FAILED`.
  * Safe Keys: `fileKey` (UUID-based generated storage key, client filenames never trusted).
  * Byte Size & MIME: `byteSize`, `fileType`, validated during ingestion.
  * Cascade: Organization deletion cascades to documents.
  * Index: `@@index([organizationId, status])`.
* **`DocumentChunk` (`document_chunks`):**
  * Document FK: `documentId` with `onDelete: Cascade`.
  * Vector Embedding: `Unsupported("vector(1536)")`.
  * Chunk Sequence: `chunkIndex` (Int), `tokenCount` (Int).
  * Indexes: `@@index([organizationId])`, `@@index([documentId])`.
  * Integrity Assessment: Direct `organizationId` foreign key enables instant cross-tenant isolation enforcement in raw SQL vector distance queries without requiring expensive document joins.

### 2.4 Chat, Analytics & Auditing Models
* **`ChatConversation` (`chat_conversations`):**
  * Scoped to `organizationId`, with optional `customerId` and `ticketId`.
  * Ticket FK: `onDelete: SetNull`.
  * Index: `@@index([organizationId, customerId])`, `@@index([ticketId])`.
* **`ChatMessage` (`chat_messages`):**
  * Scoped to `conversationId` and `organizationId`.
  * Metadata: `citations` (JSONB), `tokenMetrics` (JSONB).
  * Index: `@@index([conversationId, createdAt(sort: Asc)])`.
* **`AiUsageRecord` (`ai_usage_records`):**
  * Tracks feature (`RAG_CHAT`, `TICKET_SUMMARY`, `TICKET_CLASSIFICATION`, `REPLY_SUGGESTION`, `DOCUMENT_EMBEDDING`), model, prompt tokens, completion tokens, total tokens, estimated cost USD (`Decimal(10, 6)`), latency MS.
  * Indexes: `@@index([organizationId, createdAt(sort: Desc)])`, `@@index([organizationId, feature])`.
  * Integrity Assessment: Decimal precision prevents floating-point inaccuracies in billing calculations.
* **`AuditLog` (`audit_logs`):**
  * Scoped to `organizationId`. Actor FK has `onDelete: SetNull`.
  * Changes: `changes` (JSONB) recording pre- and post-state.
  * Tracking: `ipAddress` (VarChar 45 supporting IPv6), `userAgent` (VarChar 512).
  * Indexes: `@@index([organizationId, createdAt(sort: Desc)])`, `@@index([organizationId, entityType, entityId])`.

---

## 3. Multi-Tenant Isolation & Security Checks

| Check | Requirement | Implementation in Schema & Code | Status |
|---|---|---|---|
| **Direct Tenant Foreign Keys** | Every operational table must possess `organization_id` | All 8 operational models have non-nullable `organizationId` | **PASS** |
| **Tenant Derivation** | Access derived from verified membership, not client headers | `tenant.middleware.ts` asserts `actorUser.memberships.find(m => m.organizationId === orgId)` | **PASS** |
| **Customer Isolation** | Customers cannot query other customers' tickets | `customerId = actorUser.id` enforced in service queries | **PASS** |
| **Internal Notes Seclusion**| Customers cannot author or read internal agent notes | `isInternal: false` forced for customers; authoring restricted | **PASS** |
| **Vector Isolation** | Semantic search must never return other tenant chunks | `vector.repo.ts` enforces `WHERE organization_id = $1` in raw SQL query | **PASS** |

---

## 4. Disaster Recovery & Backup Strategy Verification
* `scripts/backup-db.sh` & `scripts/backup-db.ps1`:
  * Generates compressed SQL dumps using `pg_dump --clean --if-exists --no-owner --no-privileges`.
  * Names dumps deterministically with ISO timestamps (`supportpilot_backup_YYYYMMDD_HHMMSS.sql.gz`).
  * Employs safe environment variables for connection strings without hardcoded passwords.
* `scripts/restore-db.sh` & `scripts/restore-db.ps1`:
  * Includes explicit interactive confirmation safety gates preventing accidental overrides.
  * Validates file existence and decompression integrity before execution.
