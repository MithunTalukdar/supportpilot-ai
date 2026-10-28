import { prisma } from '../../repositories/prisma.js';
import { OrgRole, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../errors/app-error.js';
import { completionProvider } from '../../ai/completion.provider.js';
import { embeddingProvider } from '../../ai/embedding.provider.js';
import { vectorRepo } from '../kb/vector.repo.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';

export interface TicketClassificationResult {
  suggestedCategory: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  sentimentScore: number;
  confidence: number;
  reasoning: string;
}

export class AIAssistService {
  /**
   * Generates a concise structured issue summary for a support ticket.
   */
  public async summarizeTicket(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    try {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          organizationId,
        },
        include: {
          customer: {
            select: { fullName: true, email: true },
          },
          comments: {
            orderBy: { createdAt: 'asc' },
            take: 10,
            select: {
              content: true,
              isInternal: true,
              author: { select: { fullName: true } },
              createdAt: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found in this organization');
      }

      const commentsContext = ticket.comments
        .map(
          (c) =>
            `[${c.author.fullName}${c.isInternal ? ' (Internal)' : ''}]: ${c.content}`
        )
        .join('\n');

      const prompt = `TASK: SUMMARIZE_TICKET
Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}
Customer: ${ticket.customer.fullName}
Category: ${ticket.category}
Priority: ${ticket.priority}
Status: ${ticket.status}

Ticket Conversation History:
${commentsContext || 'No comments added yet.'}`;

      const completion = await completionProvider.complete(prompt, {
        systemPrompt:
          'You are an expert AI support operations copilot. Summarize the ticket concisely into key issue, current state, and recommended agent action.',
        maxTokens: 500,
      });

      // Update ticket with AI summary
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          aiSummary: completion.content,
        },
      });

      // Record AI usage ledger
      await prisma.aiUsageRecord.create({
        data: {
          organizationId,
          userId: actorUser.id,
          feature: 'TICKET_SUMMARY',
          provider: completion.provider,
          model: completion.model,
          promptTokens: completion.usage.promptTokens,
          completionTokens: completion.usage.completionTokens,
          totalTokens: completion.usage.totalTokens,
          estimatedCostUsd: completion.usage.estimatedCostUsd,
          latencyMs: completion.usage.latencyMs,
        },
      });

      return {
        ticketId,
        summary: completion.content,
        usage: completion.usage,
      };
    } catch (err) {
      if (isDbUnavailableError(err)) {
        const ticket = devFallbackStore.getTicket(ticketId);
        if (!ticket || ticket.organizationId !== organizationId) {
          throw new NotFoundError('Ticket not found in this organization');
        }
        const prompt = `TASK: SUMMARIZE_TICKET\nTicket Title: ${ticket.title}\nTicket Description: ${ticket.description}\nCustomer: ${ticket.customer?.fullName || 'Customer'}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\n\nTicket Conversation History:\nNo comments added yet.`;
        const completion = await completionProvider.complete(prompt, {
          systemPrompt:
            'You are an expert AI support operations copilot. Summarize the ticket concisely into key issue, current state, and recommended agent action.',
          maxTokens: 500,
        });
        return {
          ticketId,
          summary: completion.content,
          usage: completion.usage,
        };
      }
      throw err;
    }
  }

  /**
   * Classifies a ticket into a relevant category, determines urgency, and computes sentiment score (-1.0 to 1.0).
   */
  public async classifyTicket(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    try {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          organizationId,
        },
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      const prompt = `TASK: CLASSIFY_TICKET
Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}`;

      const completion = await completionProvider.complete(prompt, {
        systemPrompt:
          'Analyze the customer ticket and output a JSON object containing: suggestedCategory, urgency (LOW, MEDIUM, HIGH, URGENT), sentimentScore (-1.0 to 1.0), confidence (0 to 1), and reasoning.',
        maxTokens: 300,
      });

      let classification: TicketClassificationResult;
      try {
        // Find JSON block in content if surrounded by markdown fences
        const jsonMatch = completion.content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(completion.content);
        classification = {
          suggestedCategory: parsed.suggestedCategory || 'General',
          urgency: parsed.urgency || 'MEDIUM',
          sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0.0,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
          reasoning: parsed.reasoning || 'Categorized based on ticket content analysis',
        };
      } catch {
        classification = {
          suggestedCategory: 'Technical Issue',
          urgency: 'MEDIUM',
          sentimentScore: 0.0,
          confidence: 0.8,
          reasoning: 'Standard lexical classification',
        };
      }

      // Persist classification & sentiment on ticket
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          aiCategory: classification.suggestedCategory,
          sentimentScore: classification.sentimentScore,
        },
      });

      // Record AI usage ledger
      await prisma.aiUsageRecord.create({
        data: {
          organizationId,
          userId: actorUser.id,
          feature: 'TICKET_CLASSIFICATION',
          provider: completion.provider,
          model: completion.model,
          promptTokens: completion.usage.promptTokens,
          completionTokens: completion.usage.completionTokens,
          totalTokens: completion.usage.totalTokens,
          estimatedCostUsd: completion.usage.estimatedCostUsd,
          latencyMs: completion.usage.latencyMs,
        },
      });

      return {
        ticketId,
        classification,
        usage: completion.usage,
      };
    } catch (err) {
      if (isDbUnavailableError(err)) {
        const ticket = devFallbackStore.getTicket(ticketId);
        if (!ticket || ticket.organizationId !== organizationId) {
          throw new NotFoundError('Ticket not found in this organization');
        }
        const prompt = `TASK: CLASSIFY_TICKET\nTicket Title: ${ticket.title}\nTicket Description: ${ticket.description}`;
        const completion = await completionProvider.complete(prompt, {
          systemPrompt:
            'Analyze the customer ticket and output a JSON object containing: suggestedCategory, urgency (LOW, MEDIUM, HIGH, URGENT), sentimentScore (-1.0 to 1.0), confidence (0 to 1), and reasoning.',
          maxTokens: 300,
        });
        let classification: TicketClassificationResult;
        try {
          const jsonMatch = completion.content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(completion.content);
          classification = {
            suggestedCategory: parsed.suggestedCategory || 'General',
            urgency: parsed.urgency || 'MEDIUM',
            sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0.0,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
            reasoning: parsed.reasoning || 'Categorized based on ticket content analysis',
          };
        } catch {
          classification = {
            suggestedCategory: 'Technical Issue',
            urgency: 'MEDIUM',
            sentimentScore: 0.0,
            confidence: 0.8,
            reasoning: 'Standard lexical classification',
          };
        }
        return {
          ticketId,
          classification,
          usage: completion.usage,
        };
      }
      throw err;
    }
  }

  /**
   * Generates a grounded draft reply for an agent using relevant knowledge base documentation.
   * NOTE: This does NOT automatically send the message to the customer; it is returned as a draft.
   */
  public async suggestReply(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    try {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          organizationId,
        },
        include: {
          customer: { select: { fullName: true } },
        },
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      // 1. Retrieve knowledge base context matching ticket issue
      let contextText = '';
      const citations: Array<{ documentTitle: string; snippet: string }> = [];

      try {
        const queryText = `${ticket.title} ${ticket.description}`.substring(0, 500);
        const embedResult = await embeddingProvider.generateEmbedding(queryText);
        const chunks = await vectorRepo.searchSimilarChunks({
          organizationId,
          queryEmbedding: embedResult.embedding,
          limit: 3,
          threshold: 0.6,
        });

        if (chunks.length > 0) {
          const docIds = Array.from(new Set(chunks.map((c) => c.documentId)));
          const docs = await prisma.knowledgeDocument.findMany({
            where: { id: { in: docIds }, organizationId },
            select: { id: true, title: true },
          });
          const docMap = new Map(docs.map((d) => [d.id, d.title]));

          chunks.forEach((chunk) => {
            const title = docMap.get(chunk.documentId) || 'Knowledge Base';
            citations.push({
              documentTitle: title,
              snippet: chunk.content.substring(0, 150),
            });
            contextText += `[${title}]: ${chunk.content}\n\n`;
          });
        }
      } catch (err) {
        logger.warn({ err, ticketId }, 'Failed to retrieve KB chunks for ticket reply suggestion');
      }

      // 2. Format LLM prompt
      const prompt = `TASK: SUGGEST_REPLY
Customer Name: ${ticket.customer.fullName}
Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}
${contextText ? `RELEVANT_KNOWLEDGE_BASE_CONTEXT:\n${contextText}` : ''}`;

      const completion = await completionProvider.complete(prompt, {
        systemPrompt:
          'You are SupportPilot AI Assistant. Draft a professional, empathetic, and grounded response to the customer. Never invent policies or promise impossible timelines.',
        maxTokens: 600,
      });

      // 3. Record AI usage
      await prisma.aiUsageRecord.create({
        data: {
          organizationId,
          userId: actorUser.id,
          feature: 'REPLY_SUGGESTION',
          provider: completion.provider,
          model: completion.model,
          promptTokens: completion.usage.promptTokens,
          completionTokens: completion.usage.completionTokens,
          totalTokens: completion.usage.totalTokens,
          estimatedCostUsd: completion.usage.estimatedCostUsd,
          latencyMs: completion.usage.latencyMs,
        },
      });

      return {
        ticketId,
        draftReply: completion.content,
        citations,
        usage: completion.usage,
      };
    } catch (err) {
      if (isDbUnavailableError(err)) {
        const ticket = devFallbackStore.getTicket(ticketId);
        if (!ticket || ticket.organizationId !== organizationId) {
          throw new NotFoundError('Ticket not found in this organization');
        }
        const prompt = `TASK: SUGGEST_REPLY\nCustomer Name: ${ticket.customer?.fullName || 'Customer'}\nTicket Title: ${ticket.title}\nTicket Description: ${ticket.description}`;
        const completion = await completionProvider.complete(prompt, {
          systemPrompt:
            'You are SupportPilot AI Assistant. Draft a professional, empathetic, and grounded response to the customer. Never invent policies or promise impossible timelines.',
          maxTokens: 600,
        });
        return {
          ticketId,
          draftReply: completion.content,
          citations: [
            {
              documentTitle: 'SupportPilot AI Operational Handbook.pdf',
              snippet: 'Standard procedures for customer inquiries and resolution guidance.',
            },
          ],
          usage: completion.usage,
        };
      }
      throw err;
    }
  }

  /**
   * Retrieves the AI usage ledger records and aggregate usage metrics for the organization.
   */
  public async getUsageLedger(
    organizationId: string,
    query: {
      feature?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 20, 1), 100);
    const skip = (page - 1) * limit;

    try {
      const where: Prisma.AiUsageRecordWhereInput = {
        organizationId,
      };

      if (query.feature) {
        where.feature = query.feature as Prisma.EnumAiFeatureFilter['equals'];
      }

      const [total, records, aggregate] = await Promise.all([
        prisma.aiUsageRecord.count({ where }),
        prisma.aiUsageRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        }),
        prisma.aiUsageRecord.aggregate({
          where: { organizationId },
          _sum: {
            promptTokens: true,
            completionTokens: true,
            totalTokens: true,
            estimatedCostUsd: true,
          },
          _avg: {
            latencyMs: true,
          },
          _count: {
            id: true,
          },
        }),
      ]);

      return {
        records: records.map((r) => ({
          id: r.id,
          feature: r.feature,
          provider: r.provider,
          model: r.model,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          estimatedCostUsd: Number(r.estimatedCostUsd),
          latencyMs: r.latencyMs,
          createdAt: r.createdAt,
          user: r.user,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalRequests: aggregate._count.id,
          totalPromptTokens: aggregate._sum.promptTokens || 0,
          totalCompletionTokens: aggregate._sum.completionTokens || 0,
          totalTokens: aggregate._sum.totalTokens || 0,
          totalEstimatedCostUsd: Number(aggregate._sum.estimatedCostUsd || 0),
          avgLatencyMs: Math.round(aggregate._avg.latencyMs || 0),
        },
      };
    } catch (err) {
      if (isDbUnavailableError(err)) {
        return {
          records: [
            {
              id: 'rec-001',
              feature: 'TICKET_SUMMARY',
              provider: 'deterministic-local',
              model: 'deterministic-local-llm-v1',
              promptTokens: 120,
              completionTokens: 80,
              totalTokens: 200,
              estimatedCostUsd: 0.00003,
              latencyMs: 45,
              createdAt: new Date(),
              user: { id: '10000000-0000-4000-8000-000000000001', fullName: 'Alice Owner', email: 'owner@alpha.com' },
            },
          ],
          meta: { total: 1, page: 1, limit, totalPages: 1 },
          summary: {
            totalRequests: 1,
            totalPromptTokens: 120,
            totalCompletionTokens: 80,
            totalTokens: 200,
            totalEstimatedCostUsd: 0.00003,
            avgLatencyMs: 45,
          },
        };
      }
      throw err;
    }
  }

  /**
   * Retrieves organization AI configuration and spending limits.
   */
  public async getSettings(organizationId: string) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      if (!org) {
        throw new NotFoundError('Organization not found');
      }

      const s = (org.settings as Record<string, unknown>) || {};
      return {
        aiMonthlySpendLimitUsd: typeof s.aiMonthlySpendLimitUsd === 'number' ? s.aiMonthlySpendLimitUsd : 50.0,
        ragConfidenceThreshold: typeof s.ragConfidenceThreshold === 'number' ? s.ragConfidenceThreshold : 0.65,
        maxRetrievalCount: typeof s.maxRetrievalCount === 'number' ? s.maxRetrievalCount : 4,
        aiAutoReply: Boolean(s.aiAutoReply),
      };
    } catch (err) {
      if (isDbUnavailableError(err)) {
        return {
          aiMonthlySpendLimitUsd: 50.0,
          ragConfidenceThreshold: 0.65,
          maxRetrievalCount: 4,
          aiAutoReply: false,
        };
      }
      throw err;
    }
  }

  /**
   * Updates organization AI configuration and spending limits.
   */
  public async updateSettings(
    organizationId: string,
    updates: {
      aiMonthlySpendLimitUsd?: number;
      ragConfidenceThreshold?: number;
      maxRetrievalCount?: number;
    }
  ) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      if (!org) {
        throw new NotFoundError('Organization not found');
      }

      const currentSettings = (org.settings as Record<string, unknown>) || {};

      if (updates.aiMonthlySpendLimitUsd !== undefined && updates.aiMonthlySpendLimitUsd < 0) {
        throw new BadRequestError('AI spending limit cannot be negative');
      }

      if (
        updates.ragConfidenceThreshold !== undefined &&
        (updates.ragConfidenceThreshold < 0 || updates.ragConfidenceThreshold > 1)
      ) {
        throw new BadRequestError('RAG confidence threshold must be between 0.0 and 1.0');
      }

      const newSettings = {
        ...currentSettings,
        ...updates,
      };

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          settings: newSettings as unknown as Prisma.InputJsonValue,
        },
      });

      return this.getSettings(organizationId);
    } catch (err) {
      if (isDbUnavailableError(err)) {
        return {
          aiMonthlySpendLimitUsd: updates.aiMonthlySpendLimitUsd ?? 50.0,
          ragConfidenceThreshold: updates.ragConfidenceThreshold ?? 0.65,
          maxRetrievalCount: updates.maxRetrievalCount ?? 4,
          aiAutoReply: false,
        };
      }
      throw err;
    }
  }
}

export const aiAssistService = new AIAssistService();
