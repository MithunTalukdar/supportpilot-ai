import { prisma } from '../../repositories/prisma.js';
import { TicketPriority, TicketStatus, OrgRole, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../errors/app-error.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';

export interface CreateTicketDto {
  title?: string;
  subject?: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
  tags?: string[];
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string | null;
  category?: string;
  tags?: string[];
}

export interface ListTicketsQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedAgentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export class TicketService {
  public async createTicket(
    organizationId: string,
    actorUser: { id: string; role: OrgRole },
    dto: CreateTicketDto
  ) {
    const title = (dto.title || dto.subject || '').trim();
    if (!title) {
      throw new BadRequestError('Ticket title or subject is required');
    }

    let ticket;
    try {
      // Duplicate Submission Prevention: Check if customer submitted a ticket with identical subject in last 60 seconds
      const recentDuplicate = await prisma.ticket.findFirst({
        where: {
          organizationId,
          customerId: actorUser.id,
          title,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000),
          },
        },
      });

      if (recentDuplicate) {
        throw new ConflictError(
          'A duplicate ticket with this subject was recently submitted. Please wait a moment before resubmitting.'
        );
      }

      // Determine sequential ticket number per organization
      const lastTicket = await prisma.ticket.findFirst({
        where: { organizationId },
        orderBy: { ticketNumber: 'desc' },
        select: { ticketNumber: true },
      });

      const ticketNumber = (lastTicket?.ticketNumber ?? 1000) + 1;

      ticket = await prisma.ticket.create({
        data: {
          organizationId,
          ticketNumber,
          title,
          description: dto.description.trim(),
          category: (dto.category || 'General').trim(),
          priority: dto.priority || TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          customerId: actorUser.id,
          tags: dto.tags || [],
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Record Audit Log Event
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: actorUser.id,
          action: 'TICKET_CREATED',
          entityType: 'TICKET',
          entityId: ticket.id,
          changes: {
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            priority: ticket.priority,
            status: ticket.status,
            category: ticket.category,
          },
        },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        return devFallbackStore.createTicket(organizationId, actorUser.id, {
          title,
          description: dto.description,
          category: dto.category,
          priority: dto.priority,
        });
      }
      throw err;
    }

    logger.info(
      { orgId: organizationId, ticketId: ticket.id, ticketNumber: ticket.ticketNumber, actorId: actorUser.id },
      'Ticket created successfully'
    );

    return ticket;
  }

  public async listTickets(
    organizationId: string,
    actorUser: { id: string; role: OrgRole },
    query: ListTicketsQuery
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      organizationId,
    };

    // Customer Isolation: CUSTOMER role can strictly see only their own tickets
    if (actorUser.role === OrgRole.CUSTOMER) {
      where.customerId = actorUser.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.assignedAgentId) {
      where.assignedAgentId = query.assignedAgentId;
    }

    if (query.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    try {
      const [totalCount, tickets] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
            assignedAgent: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
        }),
      ]);

      return {
        tickets: tickets.map((t) => ({
          ...t,
          commentCount: t._count.comments,
        })),
        meta: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const devTickets = devFallbackStore.getTickets(organizationId, actorUser.role, actorUser.id);
        return {
          tickets: devTickets.map((t) => ({ ...t, commentCount: 0 })),
          meta: {
            page: 1,
            limit,
            totalCount: devTickets.length,
            totalPages: 1,
          },
        };
      }
      throw err;
    }
  }

  public async getTicketById(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    let ticket;
    try {
      ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const devTicket = devFallbackStore.getTickets(organizationId).find((t) => t.id === ticketId);
        if (!devTicket) throw new NotFoundError('Ticket not found');
        return { ...devTicket, comments: [] };
      }
      throw err;
    }

    if (!ticket || ticket.organizationId !== organizationId) {
      throw new NotFoundError('Ticket not found in this organization');
    }

    // Customer Isolation Check: Customers cannot access tickets created by other users
    if (actorUser.role === OrgRole.CUSTOMER && ticket.customerId !== actorUser.id) {
      throw new ForbiddenError('Access denied: You do not have permission to view this ticket');
    }

    // Filter out internal agent notes for Customer views
    const filteredComments =
      actorUser.role === OrgRole.CUSTOMER
        ? ticket.comments.filter((c) => !c.isInternal)
        : ticket.comments;

    return {
      ...ticket,
      comments: filteredComments,
    };
  }

  public async updateTicket(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole },
    dto: UpdateTicketDto
  ) {
    // Only Support Agents and Owners can modify ticket properties
    if (actorUser.role === OrgRole.CUSTOMER) {
      throw new ForbiddenError('Customers cannot change ticket status, priority, or assignment');
    }

    let ticket;
    try {
      ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const updated = devFallbackStore.updateTicket(ticketId, dto);
        if (!updated) throw new NotFoundError('Ticket not found in this organization');
        return updated;
      }
      throw err;
    }

    if (!ticket || ticket.organizationId !== organizationId) {
      throw new NotFoundError('Ticket not found in this organization');
    }

    const updateData: Prisma.TicketUpdateInput = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    // Validate and update Status
    if (dto.status && dto.status !== ticket.status) {
      // Validate valid status transitions
      if (ticket.status === TicketStatus.CLOSED && dto.status === TicketStatus.WAITING_FOR_CUSTOMER) {
        throw new BadRequestError('Invalid status transition: A closed ticket must be reopened before waiting for customer');
      }

      changes.status = { before: ticket.status, after: dto.status };
      updateData.status = dto.status;

      if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
        updateData.resolvedAt = new Date();
      } else if (ticket.resolvedAt && (dto.status === TicketStatus.OPEN || dto.status === TicketStatus.IN_PROGRESS)) {
        updateData.resolvedAt = null;
      }
    }

    // Update Priority
    if (dto.priority && dto.priority !== ticket.priority) {
      changes.priority = { before: ticket.priority, after: dto.priority };
      updateData.priority = dto.priority;
    }

    // Update Category
    if (dto.category && dto.category !== ticket.category) {
      changes.category = { before: ticket.category, after: dto.category };
      updateData.category = dto.category.trim();
    }

    // Update Tags
    if (dto.tags) {
      updateData.tags = dto.tags;
    }

    // Validate and update Assigned Agent
    if (dto.assignedAgentId !== undefined && dto.assignedAgentId !== ticket.assignedAgentId) {
      if (dto.assignedAgentId !== null) {
        // Verify agent is a member with AGENT or OWNER role in this organization
        const agentMembership = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId: dto.assignedAgentId,
            },
          },
        });

        if (!agentMembership || agentMembership.role === OrgRole.CUSTOMER) {
          throw new BadRequestError('Assigned user must be an active Agent or Owner in this organization');
        }

        changes.assignedAgentId = { before: ticket.assignedAgentId, after: dto.assignedAgentId };
        updateData.assignedAgent = { connect: { id: dto.assignedAgentId } };
      } else {
        changes.assignedAgentId = { before: ticket.assignedAgentId, after: null };
        updateData.assignedAgent = { disconnect: true };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return ticket;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Record Audit Log Event
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: actorUser.id,
        action: 'TICKET_UPDATED',
        entityType: 'TICKET',
        entityId: ticketId,
        changes: changes as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info(
      { orgId: organizationId, ticketId, changes, actorId: actorUser.id },
      'Ticket updated successfully'
    );

    return updatedTicket;
  }

  public async getMetrics(organizationId: string) {
    try {
      const [totalCount, tickets] = await Promise.all([
        prisma.ticket.count({ where: { organizationId } }),
        prisma.ticket.findMany({
          where: { organizationId },
          select: {
            status: true,
            priority: true,
            createdAt: true,
            resolvedAt: true,
          },
        }),
      ]);

      const statusCounts: Record<TicketStatus, number> = {
        [TicketStatus.OPEN]: 0,
        [TicketStatus.IN_PROGRESS]: 0,
        [TicketStatus.WAITING_FOR_CUSTOMER]: 0,
        [TicketStatus.RESOLVED]: 0,
        [TicketStatus.CLOSED]: 0,
      };

      const priorityCounts: Record<TicketPriority, number> = {
        [TicketPriority.LOW]: 0,
        [TicketPriority.MEDIUM]: 0,
        [TicketPriority.HIGH]: 0,
        [TicketPriority.URGENT]: 0,
      };

      let totalResolutionMinutes = 0;
      let resolvedCount = 0;

      for (const t of tickets) {
        if (statusCounts[t.status] !== undefined) {
          statusCounts[t.status]++;
        }
        if (priorityCounts[t.priority] !== undefined) {
          priorityCounts[t.priority]++;
        }

        if (t.resolvedAt) {
          const diffMs = t.resolvedAt.getTime() - t.createdAt.getTime();
          const diffMinutes = Math.max(0, Math.floor(diffMs / (60 * 1000)));
          totalResolutionMinutes += diffMinutes;
          resolvedCount++;
        }
      }

      const avgResolutionMinutes = resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : 0;

      return {
        totalTickets: totalCount,
        openTickets: statusCounts[TicketStatus.OPEN] + statusCounts[TicketStatus.IN_PROGRESS] + statusCounts[TicketStatus.WAITING_FOR_CUSTOMER],
        resolvedTickets: statusCounts[TicketStatus.RESOLVED] + statusCounts[TicketStatus.CLOSED],
        avgResolutionMinutes,
        statusBreakdown: statusCounts,
        priorityBreakdown: priorityCounts,
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const devTickets = devFallbackStore.getTickets(organizationId);
        const statusCounts: Record<TicketStatus, number> = {
          [TicketStatus.OPEN]: 0,
          [TicketStatus.IN_PROGRESS]: 0,
          [TicketStatus.WAITING_FOR_CUSTOMER]: 0,
          [TicketStatus.RESOLVED]: 0,
          [TicketStatus.CLOSED]: 0,
        };
        const priorityCounts: Record<TicketPriority, number> = {
          [TicketPriority.LOW]: 0,
          [TicketPriority.MEDIUM]: 0,
          [TicketPriority.HIGH]: 0,
          [TicketPriority.URGENT]: 0,
        };
        devTickets.forEach((t) => {
          statusCounts[t.status]++;
          priorityCounts[t.priority]++;
        });
        return {
          totalTickets: devTickets.length,
          openTickets: statusCounts[TicketStatus.OPEN] + statusCounts[TicketStatus.IN_PROGRESS] + statusCounts[TicketStatus.WAITING_FOR_CUSTOMER],
          resolvedTickets: statusCounts[TicketStatus.RESOLVED] + statusCounts[TicketStatus.CLOSED],
          avgResolutionMinutes: 45,
          statusBreakdown: statusCounts,
          priorityBreakdown: priorityCounts,
        };
      }
      throw err;
    }
  }
}

export const ticketService = new TicketService();
