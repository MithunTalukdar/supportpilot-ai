import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';
import { OrgRole, DocumentStatus } from '@prisma/client';
import { vectorRepo } from '../src/modules/kb/vector.repo.js';
import { documentStorage } from '../src/modules/kb/storage.service.js';
import { SemanticChunker } from '../src/modules/kb/chunker.js';

describe('Phase 4 — Knowledge Base Document Ingestion & pgvector Pipeline Tests', () => {
  const orgAId = '11111111-1111-4111-8111-111111111111';
  const orgBId = '22222222-2222-4222-8222-222222222222';

  const userAgentA = {
    id: 'aaaa2222-2222-4222-8222-222222222222',
    email: 'agent-a@alpha.com',
    fullName: 'Agent Alpha',
  };

  const userCustomerA = {
    id: 'aaaa1111-1111-4111-8111-111111111111',
    email: 'customer-a@alpha.com',
    fullName: 'Customer Alpha',
  };

  const userAgentB = {
    id: 'bbbb2222-2222-4222-8222-222222222222',
    email: 'agent-b@beta.com',
    fullName: 'Agent Beta',
  };

  let tokenAgentA: string;
  let tokenCustomerA: string;
  let tokenAgentB: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    tokenCustomerA = generateAccessToken({ userId: userCustomerA.id, email: userCustomerA.email });
    tokenAgentA = generateAccessToken({ userId: userAgentA.id, email: userAgentA.email });
    tokenAgentB = generateAccessToken({ userId: userAgentB.id, email: userAgentB.email });

    // Mock user authentication queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      const id = args.where.id;
      if (id === userAgentA.id) return { ...userAgentA, isActive: true } as any;
      if (id === userCustomerA.id) return { ...userCustomerA, isActive: true } as any;
      if (id === userAgentB.id) return { ...userAgentB, isActive: true } as any;
      return null;
    });

    // Mock organization membership queries
    vi.spyOn(prisma.organizationMember, 'findUnique').mockImplementation(async (args) => {
      const { organizationId, userId } = args.where.organizationId_userId || {};

      if (organizationId === orgAId && userId === userAgentA.id) {
        return {
          id: 'mem_a_agent',
          organizationId: orgAId,
          userId: userAgentA.id,
          role: OrgRole.AGENT,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (organizationId === orgAId && userId === userCustomerA.id) {
        return {
          id: 'mem_a_cust',
          organizationId: orgAId,
          userId: userCustomerA.id,
          role: OrgRole.CUSTOMER,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (organizationId === orgBId && userId === userAgentB.id) {
        return {
          id: 'mem_b_agent',
          organizationId: orgBId,
          userId: userAgentB.id,
          role: OrgRole.AGENT,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    });

    // Mock storage operations to avoid filesystem coupling in tests
    vi.spyOn(documentStorage, 'saveFile').mockResolvedValue({
      fileKey: `${orgAId}/test-file-uuid.txt`,
      byteSize: 1024,
    });
    vi.spyOn(documentStorage, 'readFile').mockResolvedValue(
      Buffer.from('Standard refund policy: All purchases within 14 calendar days are eligible for a 100% full refund.')
    );
    vi.spyOn(documentStorage, 'deleteFile').mockResolvedValue(undefined);

    // Mock vector repo insertions and queries
    vi.spyOn(vectorRepo, 'insertChunks').mockResolvedValue(undefined);
    vi.spyOn(vectorRepo, 'deleteChunksByDocument').mockResolvedValue(3);
  });

  describe('1. Semantic Text Chunker Utility', () => {
    it('splits text into cohesive chunks with natural sentence boundaries and overlaps', () => {
      const longText = `
SupportPilot AI is a modern customer support platform.
It empowers teams with multi-tenant data isolation and role-based permissions.

Section 1: Refund Policy
All requests submitted within 14 business days receive priority review.
The customer must provide the original order ID and receipt.

Section 2: Security & Encryption
Data is encrypted both in transit via TLS 1.3 and at rest with AES-256.
Access to knowledge base documents is strictly isolated by organization ID.
      `.trim();

      const chunks = SemanticChunker.split(longText, {
        targetChunkTokens: 25,
        overlapTokens: 5,
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].content).toContain('SupportPilot AI');
      expect(chunks[0].tokenCount).toBeGreaterThan(0);
      expect(chunks[0].metadata).toHaveProperty('startChar', 0);
    });

    it('returns a single chunk if text is smaller than target token size', () => {
      const shortText = 'Short knowledge snippet.';
      const chunks = SemanticChunker.split(shortText, { targetChunkTokens: 500 });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].content).toBe(shortText);
    });
  });

  describe('2. Document Upload & Ingestion Pipeline', () => {
    it('successfully uploads and indexes a plain text document with pgvector chunks', async () => {
      const docId = 'doc_test_101';
      const fileContent = 'SupportPilot AI Knowledge Document: Standard billing terms and automated receipts.';

      vi.spyOn(prisma.knowledgeDocument, 'create').mockResolvedValueOnce({
        id: docId,
        organizationId: orgAId,
        title: 'Billing Terms.txt',
        sourceUrl: null,
        fileKey: `${orgAId}/test-file-uuid.txt`,
        fileType: 'txt',
        byteSize: fileContent.length,
        status: DocumentStatus.PENDING,
        errorMessage: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(prisma.knowledgeDocument, 'update').mockResolvedValue({
        id: docId,
        organizationId: orgAId,
        title: 'Billing Terms.txt',
        sourceUrl: null,
        fileKey: `${orgAId}/test-file-uuid.txt`,
        fileType: 'txt',
        byteSize: fileContent.length,
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: { chunkCount: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(prisma.knowledgeDocument, 'findUnique').mockResolvedValueOnce({
        id: docId,
        organizationId: orgAId,
        title: 'Billing Terms.txt',
        sourceUrl: null,
        fileKey: `${orgAId}/test-file-uuid.txt`,
        fileType: 'txt',
        byteSize: fileContent.length,
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: { chunkCount: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({} as never);
      vi.spyOn(prisma.aiUsageRecord, 'create').mockResolvedValueOnce({} as never);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .attach('file', Buffer.from(fileContent), 'Billing Terms.txt');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(DocumentStatus.INDEXED);
      expect(vectorRepo.insertChunks).toHaveBeenCalled();
    });

    it('rejects upload from a user with CUSTOMER role (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .attach('file', Buffer.from('Customer attempt'), 'sample.txt');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects unsupported file extensions (e.g. .exe or .png)', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .attach('file', Buffer.from('malicious payload'), 'payload.exe');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Unsupported file extension');
    });

    it('rejects empty files (0 bytes)', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .attach('file', Buffer.alloc(0), 'empty.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('empty');
    });

    it('rejects corrupt PDF without %PDF- magic signature', async () => {
      const corruptPdfBuffer = Buffer.from('NOT_A_REAL_PDF_HEADER_CONTENT');

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .attach('file', corruptPdfBuffer, 'broken.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('PDF document');
    });
  });

  describe('3. Multi-Tenant Organization Isolation', () => {
    it('prevents Agent B from accessing or inspecting Agent A documents (404 Not Found)', async () => {
      vi.spyOn(prisma.knowledgeDocument, 'findUnique').mockResolvedValueOnce({
        id: 'doc_a_secret',
        organizationId: orgAId, // Belongs to Org A
        title: 'Secret Internal Manual',
        sourceUrl: null,
        fileKey: `${orgAId}/secret.txt`,
        fileType: 'txt',
        byteSize: 500,
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { chunks: 2 },
      } as never);

      // Agent B requests Org A's document under Org B endpoint
      const res = await request(app)
        .get(`/api/v1/organizations/${orgBId}/documents/doc_a_secret`)
        .set('Authorization', `Bearer ${tokenAgentB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('prevents Agent B from deleting Agent A documents (404 Not Found)', async () => {
      vi.spyOn(prisma.knowledgeDocument, 'findUnique').mockResolvedValueOnce({
        id: 'doc_a_secret',
        organizationId: orgAId, // Belongs to Org A
        title: 'Secret Internal Manual',
        sourceUrl: null,
        fileKey: `${orgAId}/secret.txt`,
        fileType: 'txt',
        byteSize: 500,
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .delete(`/api/v1/organizations/${orgBId}/documents/doc_a_secret`)
        .set('Authorization', `Bearer ${tokenAgentB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(documentStorage.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('4. Vector Similarity Search & Retrieval', () => {
    it('executes similarity search strictly scoped to the active organization', async () => {
      vi.spyOn(vectorRepo, 'searchSimilarChunks').mockResolvedValueOnce([
        {
          id: 'chunk_1',
          documentId: 'doc_1',
          organizationId: orgAId,
          chunkIndex: 0,
          content: 'All subscription refunds must be requested within 14 calendar days.',
          tokenCount: 15,
          metadata: { pageCount: 1 },
          similarity: 0.895,
        },
      ]);

      vi.spyOn(prisma.knowledgeDocument, 'findMany').mockResolvedValueOnce([
        { id: 'doc_1', title: 'Refund Policy 2026' } as never,
      ]);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents/search`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .send({
          query: 'How many days do I have to get a refund?',
          limit: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].documentTitle).toBe('Refund Policy 2026');
      expect(res.body.data[0].similarity).toBeCloseTo(0.895, 2);
      expect(vectorRepo.searchSimilarChunks).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: orgAId })
      );
    });

    it('returns empty array when query is blank', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents/search`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .send({ query: '   ' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('5. Reprocessing & Cascading Deletion', () => {
    it('successfully reprocesses an existing document and purges old chunks', async () => {
      const docId = 'doc_retry_1';

      vi.spyOn(prisma.knowledgeDocument, 'findUnique').mockResolvedValue({
        id: docId,
        organizationId: orgAId,
        title: 'Updated Policy.txt',
        sourceUrl: null,
        fileKey: `${orgAId}/test-file-uuid.txt`,
        fileType: 'txt',
        byteSize: 500,
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: { chunkCount: 2 },
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { chunks: 2 },
      } as never);

      vi.spyOn(prisma.knowledgeDocument, 'update').mockResolvedValue({} as never);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as never);
      vi.spyOn(vectorRepo, 'getChunksByDocument').mockResolvedValueOnce([]);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/documents/${docId}/retry`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(vectorRepo.deleteChunksByDocument).toHaveBeenCalledWith(orgAId, docId);
      expect(vectorRepo.insertChunks).toHaveBeenCalled();
    });

    it('deletes document record, cascades vector chunks, and unlinks file from storage', async () => {
      const docId = 'doc_delete_1';

      vi.spyOn(prisma.knowledgeDocument, 'findUnique').mockResolvedValueOnce({
        id: docId,
        organizationId: orgAId,
        title: 'Old Deprecated Doc',
        sourceUrl: null,
        fileKey: `${orgAId}/old.txt`,
        fileType: 'txt',
        byteSize: 300,
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(prisma.knowledgeDocument, 'delete').mockResolvedValueOnce({} as never);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({} as never);

      const res = await request(app)
        .delete(`/api/v1/organizations/${orgAId}/documents/${docId}`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(vectorRepo.deleteChunksByDocument).toHaveBeenCalledWith(orgAId, docId);
      expect(documentStorage.deleteFile).toHaveBeenCalledWith(`${orgAId}/old.txt`);
      expect(prisma.knowledgeDocument.delete).toHaveBeenCalledWith({ where: { id: docId } });
    });
  });
});
