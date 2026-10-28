import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';
import { OrgRole, ChatSenderType, ChatChannel } from '@prisma/client';
import { vectorRepo } from '../src/modules/kb/vector.repo.js';

describe('Phase 5 — AI Chat Assistant & Grounded RAG Pipeline Tests', () => {
  const orgAId = '11111111-1111-4111-8111-111111111111';
  const orgBId = '22222222-2222-4222-8222-222222222222';

  const userCustomerA = {
    id: 'aaaa1111-1111-4111-8111-111111111111',
    email: 'customer-a@alpha.com',
    fullName: 'Customer Alpha',
  };

  const userAgentA = {
    id: 'aaaa2222-2222-4222-8222-222222222222',
    email: 'agent-a@alpha.com',
    fullName: 'Agent Alpha',
  };

  const userCustomerB = {
    id: 'bbbb1111-1111-4111-8111-111111111111',
    email: 'customer-b@beta.com',
    fullName: 'Customer Beta',
  };

  const conversationId1 = 'cccc1111-1111-4111-8111-111111111111';
  const documentId1 = 'dddd1111-1111-4111-8111-111111111111';

  let tokenCustomerA: string;
  let tokenAgentA: string;
  let tokenCustomerB: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    tokenCustomerA = generateAccessToken({ userId: userCustomerA.id, email: userCustomerA.email });
    tokenAgentA = generateAccessToken({ userId: userAgentA.id, email: userAgentA.email });
    tokenCustomerB = generateAccessToken({ userId: userCustomerB.id, email: userCustomerB.email });

    // Mock user lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      const id = args.where.id;
      if (id === userCustomerA.id) return { ...userCustomerA, isActive: true } as any;
      if (id === userAgentA.id) return { ...userAgentA, isActive: true } as any;
      if (id === userCustomerB.id) return { ...userCustomerB, isActive: true } as any;
      return null;
    });

    // Mock organization membership
    vi.spyOn(prisma.organizationMember, 'findUnique').mockImplementation(async (args) => {
      const { organizationId, userId } = args.where.organizationId_userId || {};

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

      if (organizationId === orgBId && userId === userCustomerB.id) {
        return {
          id: 'mem_b_cust',
          organizationId: orgBId,
          userId: userCustomerB.id,
          role: OrgRole.CUSTOMER,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    });

    // Mock organization settings
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

    // Mock monthly spend aggregate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.aiUsageRecord, 'aggregate').mockResolvedValue({
      _sum: { estimatedCostUsd: 0.05 as any },
    } as any);

    // Mock AI usage creation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma.aiUsageRecord, 'create').mockResolvedValue({
      id: 'usage-rec-1',
    } as any);
  });

  describe('Conversation Management', () => {
    it('allows a customer to create a support conversation thread', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'create').mockResolvedValue({
        id: conversationId1,
        organizationId: orgAId,
        customerId: userCustomerA.id,
        ticketId: null,
        title: 'Billing Inquiry',
        channel: ChatChannel.PORTAL,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      } as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/chat`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          title: 'Billing Inquiry',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(conversationId1);
      expect(res.body.data.customerId).toBe(userCustomerA.id);
    });

    it('isolates conversations so customers see only their own threads', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'count').mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'findMany').mockResolvedValue([
        {
          id: conversationId1,
          organizationId: orgAId,
          customerId: userCustomerA.id,
          ticketId: null,
          ticket: null,
          title: 'Billing Inquiry',
          channel: ChatChannel.PORTAL,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        },
      ] as any);

      const res = await request(app)
        .get(`/api/v1/organizations/${orgAId}/chat`)
        .set('Authorization', `Bearer ${tokenCustomerA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(conversationId1);
    });

    it('blocks cross-organization conversation retrieval', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${orgAId}/chat`)
        .set('Authorization', `Bearer ${tokenCustomerB}`); // User B belongs to org B

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Access denied');
    });
  });

  describe('Grounded RAG Question Answering & Source Citations', () => {
    it('answers customer queries strictly grounded in retrieved KB chunks with citations', async () => {
      // Mock conversation lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'findFirst').mockResolvedValue({
        id: conversationId1,
        organizationId: orgAId,
        customerId: userCustomerA.id,
        title: 'New Support Conversation',
      } as any);

      // Mock user message persistence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatMessage, 'create').mockImplementation(async (args: any) => {
        return {
          id: 'msg-' + Math.random(),
          ...args.data,
          createdAt: new Date(),
        } as any;
      });

      // Mock conversation update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'update').mockResolvedValue({} as any);

      // Mock vector chunk search returning matching indexed content
      vi.spyOn(vectorRepo, 'searchSimilarChunks').mockResolvedValue([
        {
          id: 'chunk-1',
          documentId: documentId1,
          organizationId: orgAId,
          chunkIndex: 0,
          content: 'SupportPilot standard refund window is strictly 30 days from purchase date.',
          tokenCount: 15,
          metadata: null,
          similarity: 0.89,
        },
      ]);

      // Mock parent document lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.knowledgeDocument, 'findMany').mockResolvedValue([
        {
          id: documentId1,
          title: 'Refund Policy Guide',
          sourceUrl: 'https://docs.example.com/refunds',
        },
      ] as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/chat/${conversationId1}/messages`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          content: 'What is your refund policy window?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userMessage.content).toBe('What is your refund policy window?');

      const botMessage = res.body.data.botMessage;
      expect(botMessage.senderType).toBe(ChatSenderType.BOT);
      // Verify grounded content citing Document 1
      expect(botMessage.content).toContain('Refund Policy Guide');
      expect(botMessage.content).toContain('[1]');

      // Verify citations array references the real document and chunk
      expect(botMessage.citations).toBeDefined();
      expect(botMessage.citations).toHaveLength(1);
      expect(botMessage.citations[0].documentId).toBe(documentId1);
      expect(botMessage.citations[0].documentTitle).toBe('Refund Policy Guide');
      expect(botMessage.citations[0].chunkIndex).toBe(0);
      expect(botMessage.citations[0].snippet).toContain('refund window is strictly 30 days');
    });

    it('returns a clear safe fallback when sufficient evidence is unavailable in the knowledge base', async () => {
      // Mock conversation lookup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'findFirst').mockResolvedValue({
        id: conversationId1,
        organizationId: orgAId,
        customerId: userCustomerA.id,
        title: 'Random Question',
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatMessage, 'create').mockImplementation(async (args: any) => {
        return {
          id: 'msg-' + Math.random(),
          ...args.data,
          createdAt: new Date(),
        } as any;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'update').mockResolvedValue({} as any);

      // Return NO vector chunks (evidence is missing)
      vi.spyOn(vectorRepo, 'searchSimilarChunks').mockResolvedValue([]);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/chat/${conversationId1}/messages`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          content: 'How do I pilot an alien spaceship to Jupiter?',
        });

      expect(res.status).toBe(200);
      const botMessage = res.body.data.botMessage;
      expect(botMessage.content).toContain('could not find sufficient information');
      // No citations invented!
      expect(!botMessage.citations || Object.keys(botMessage.citations).length === 0).toBe(true);
    });

    it('enforces monthly AI spend limit and returns safe notice when exceeded', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatConversation, 'findFirst').mockResolvedValue({
        id: conversationId1,
        organizationId: orgAId,
        customerId: userCustomerA.id,
        title: 'Billing Question',
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.chatMessage, 'create').mockImplementation(async (args: any) => {
        return {
          id: 'msg-' + Math.random(),
          ...args.data,
          createdAt: new Date(),
        } as any;
      });

      // Mock organization spend aggregate EXCEEDING the limit (e.g. $55 > $50 limit)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(prisma.aiUsageRecord, 'aggregate').mockResolvedValue({
        _sum: { estimatedCostUsd: 55.0 as any },
      } as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${orgAId}/chat/${conversationId1}/messages`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          content: 'Hello, need help please',
        });

      expect(res.status).toBe(200);
      const botMessage = res.body.data.botMessage;
      expect(botMessage.content).toContain('monthly AI spending limit for your organization has been reached');
    });
  });
});
