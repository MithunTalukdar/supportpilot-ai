import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';
import { OrgRole, TicketPriority, TicketStatus } from '@prisma/client';
import { vectorRepo } from '../src/modules/kb/vector.repo.js';

describe('Phase 5 — AI Ticket Assist, Classification & Usage Ledger Tests', () => {
  const orgAId = '11111111-1111-4111-8111-111111111111';
  const ticketId1 = 'tttt1111-1111-4111-8111-111111111111';

  const userOwnerA = {
    id: 'aaaa0000-0000-4000-8000-000000000000',
    email: 'owner@alpha.com',
    fullName: 'Owner Alpha',
  };

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

  let tokenOwnerA: string;
  let tokenAgentA: string;
  let tokenCustomerA: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    tokenOwnerA = generateAccessToken({ userId: userOwnerA.id, email: userOwnerA.email });
    tokenAgentA = generateAccessToken({ userId: userAgentA.id, email: userAgentA.email });
    tokenCustomerA = generateAccessToken({ userId: userCustomerA.id, email: userCustomerA.email });

    // Mock user lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      const id = args.where.id;
      if (id === userOwnerA.id) return { ...userOwnerA, isActive: true } as any;
      if (id === userAgentA.id) return { ...userAgentA, isActive: true } as any;
      if (id === userCustomerA.id) return { ...userCustomerA, isActive: true } as any;
      return null;
    });

    // Mock organization membership
    vi.spyOn(prisma.organizationMember, 'findUnique').mockImplementation(async (args) => {
      const { organizationId, userId } = args.where.organizationId_userId || {};

      if (organizationId === orgAId && userId === userOwnerA.id) {
        return {
          id: 'mem_a_owner',
          organizationId: orgAId,
          userId: userOwnerA.id,
          role: OrgRole.OWNER,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

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

      return null;
    });

    // Mock organization lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.organization, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === orgAId) {
        return {
          id: orgAId,
          name: 'Alpha Corp',
          slug: 'alpha-corp',
          settings: {
            ticketPrefix: 'ALP',
            aiMonthlySpendLimitUsd: 50.0,
            ragConfidenceThreshold: 0.65,
            maxRetrievalCount: 4,
          },
        } as any;
      }
      return null;
    });

    // Mock AI usage creation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.aiUsageRecord, 'create').mockResolvedValue({
      id: 'usage-1',
    } as any);
  });

  describe('Ticket Summarization', () => {
    it('generates a structured issue summary and saves it to ticket.aiSummary', async () => {
      // Mock ticket lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.ticket, 'findFirst').mockResolvedValue({
        id: ticketId1,
        organizationId: orgAId,
        title: 'Unable to connect to production database',
        description: 'Receiving timeout errors when initiating TLS handshake.',
        category: 'Technical Issue',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        customer: { fullName: 'Customer Alpha', email: 'customer-a@alpha.com' },
        comments: [],
      } as any);

      // Mock ticket update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateSpy = vi.spyOn(prisma.ticket, 'update').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/ai/tickets/${ticketId1}/summarize`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toContain('Summary of Issue:');
      expect(res.body.data.summary).toContain('Unable to connect to production database');

      // Verify persistence to ticket
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ticketId1 },
          data: expect.objectContaining({
            aiSummary: expect.stringContaining('Summary of Issue:'),
          }),
        })
      );
    });

    it('prohibits customers from triggering staff AI ticket summarization', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/ai/tickets/${ticketId1}/summarize`)
        .set('Authorization', `Bearer ${tokenCustomerA}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Ticket Classification & Sentiment Analysis', () => {
    it('analyzes ticket content and classifies urgency, category, and sentiment score', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.ticket, 'findFirst').mockResolvedValue({
        id: ticketId1,
        organizationId: orgAId,
        title: 'Urgent: Billing outage refund requested',
        description: 'Our account was charged twice during the outage!',
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateSpy = vi.spyOn(prisma.ticket, 'update').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/ai/tickets/${ticketId1}/classify`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const classification = res.body.data.classification;
      expect(classification.suggestedCategory).toBe('Billing & Subscriptions');
      expect(classification.sentimentScore).toBeLessThan(0); // Negative sentiment
      expect(classification.confidence).toBeGreaterThan(0.5);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ticketId1 },
          data: expect.objectContaining({
            aiCategory: 'Billing & Subscriptions',
          }),
        })
      );
    });
  });

  describe('Draft Reply Suggestions (Safe Non-Destructive Operation)', () => {
    it('generates a draft reply grounded in knowledge base docs without sending it automatically', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.ticket, 'findFirst').mockResolvedValue({
        id: ticketId1,
        organizationId: orgAId,
        title: 'How do I issue a partial refund?',
        description: 'Customer requested a partial refund for unused days.',
        customer: { fullName: 'Customer Alpha' },
      } as any);

      // Mock KB search
      vi.spyOn(vectorRepo, 'searchSimilarChunks').mockResolvedValue([
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          organizationId: orgAId,
          chunkIndex: 0,
          content: 'Partial refunds are calculated pro-rata on the remaining billing cycle.',
          tokenCount: 15,
          metadata: null,
          similarity: 0.85,
        },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.knowledgeDocument, 'findMany').mockResolvedValue([
        { id: 'doc-1', title: 'Refund Policy' },
      ] as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/ai/tickets/${ticketId1}/suggest-reply`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draftReply).toContain('SupportPilot');
      expect(res.body.data.citations).toHaveLength(1);
      expect(res.body.data.citations[0].documentTitle).toBe('Refund Policy');
    });
  });

  describe('AI Usage Ledger & Settings', () => {
    it('returns AI usage ledger records with aggregate cost and token statistics', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.aiUsageRecord, 'count').mockResolvedValue(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.aiUsageRecord, 'findMany').mockResolvedValue([
        {
          id: 'u1',
          feature: 'RAG_CHAT',
          provider: 'deterministic-local',
          model: 'deterministic-local',
          promptTokens: 40,
          completionTokens: 25,
          totalTokens: 65,
          estimatedCostUsd: 0.000009,
          latencyMs: 12,
          createdAt: new Date(),
          user: { id: userAgentA.id, fullName: userAgentA.fullName, email: userAgentA.email },
        },
      ] as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.aiUsageRecord, 'aggregate').mockResolvedValue({
        _sum: {
          promptTokens: 40,
          completionTokens: 25,
          totalTokens: 65,
          estimatedCostUsd: 0.000009 as any,
        },
        _avg: { latencyMs: 12 },
        _count: { id: 1 },
      } as any);

      const res = await request(app)
        .get(`/api/v1/organizations/${orgAId}/ai/usage`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.summary.totalTokens).toBe(65);
      expect(res.body.summary.totalEstimatedCostUsd).toBe(0.000009);
    });

    it('allows organization owner to update AI spend limits and RAG threshold', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateOrgSpy = vi.spyOn(prisma.organization, 'update').mockResolvedValue({} as any);

      const res = await request(app)
        .patch(`/api/v1/organizations/${orgAId}/ai/settings`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          aiMonthlySpendLimitUsd: 100.0,
          ragConfidenceThreshold: 0.75,
        });

      expect(res.status).toBe(200);
      expect(updateOrgSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orgAId },
          data: expect.objectContaining({
            settings: expect.objectContaining({
              aiMonthlySpendLimitUsd: 100.0,
              ragConfidenceThreshold: 0.75,
            }),
          }),
        })
      );
    });

    it('prevents non-owners (agents/customers) from modifying AI spending limits', async () => {
      const res = await request(app)
        .patch(`/api/v1/organizations/${orgAId}/ai/settings`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .send({
          aiMonthlySpendLimitUsd: 500.0,
        });

      expect(res.status).toBe(403);
    });
  });
});
