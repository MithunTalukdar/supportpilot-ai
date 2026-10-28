import { prisma } from '../../repositories/prisma.js';
import { OrgRole, TicketStatus, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/app-error.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';

export interface AddCommentDto {
  content: string;
  isInternal?: boolean;
}

export class CommentService {
  public async addComment(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole },
    dto: AddCommentDto
  ) {
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestError('Comment content cannot be empty');
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          organizationId: true,
          customerId: true,
          status: true,
        },
      });

      if (!ticket || ticket.organizationId !== organizationId) {
        throw new NotFoundError('Ticket not found in this organization');
      }

      // Customer Isolation: Customer can only reply to their own tickets
      if (actorUser.role === OrgRole.CUSTOMER) {
        if (ticket.customerId !== actorUser.id) {
          throw new ForbiddenError('Access denied: You cannot reply to tickets belonging to other customers');
        }
      }

      // Security Guardrail: Customers can NEVER author internal agent notes
      const isInternal = actorUser.role === OrgRole.CUSTOMER ? false : Boolean(dto.isInternal);

      const comment = await prisma.ticketComment.create({
        data: {
          organizationId,
          ticketId,
          authorId: actorUser.id,
          content,
          isInternal,
        },
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
      });

      // Auto status update: When customer replies to a WAITING_FOR_CUSTOMER or RESOLVED ticket, transition to IN_PROGRESS
      if (
        actorUser.role === OrgRole.CUSTOMER &&
        (ticket.status === TicketStatus.WAITING_FOR_CUSTOMER || ticket.status === TicketStatus.RESOLVED)
      ) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.IN_PROGRESS,
            resolvedAt: null,
          },
        });

        await prisma.auditLog.create({
          data: {
            organizationId,
            actorId: actorUser.id,
            action: 'TICKET_STATUS_CHANGED',
            entityType: 'TICKET',
            entityId: ticketId,
            changes: {
              status: { before: ticket.status, after: TicketStatus.IN_PROGRESS },
              reason: 'Customer replied to ticket',
            },
          },
        });
      }

      logger.info(
        { orgId: organizationId, ticketId, commentId: comment.id, isInternal, actorId: actorUser.id },
        'Comment added to ticket'
      );

      return comment;
    } catch (err) {
      if (isDbUnavailableError(err)) {
        const isInternal = actorUser.role === OrgRole.CUSTOMER ? false : Boolean(dto.isInternal);
        const user = devFallbackStore.findUserById(actorUser.id) || {
          id: actorUser.id,
          fullName: 'Support User',
          email: 'user@example.com',
          avatarUrl: null,
        };
        return devFallbackStore.addComment(
          organizationId,
          ticketId,
          user,
          content,
          isInternal
        );
      }
      throw err;
    }
  }

  public async listComments(
    organizationId: string,
    ticketId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          organizationId: true,
          customerId: true,
        },
      });

      if (!ticket || ticket.organizationId !== organizationId) {
        throw new NotFoundError('Ticket not found in this organization');
      }

      if (actorUser.role === OrgRole.CUSTOMER && ticket.customerId !== actorUser.id) {
        throw new ForbiddenError('Access denied: You do not have permission to view comments for this ticket');
      }

      // Customer Isolation: Strip out all internal notes for Customer users
      const where: Prisma.TicketCommentWhereInput = {
        ticketId,
        organizationId,
      };

      if (actorUser.role === OrgRole.CUSTOMER) {
        where.isInternal = false;
      }

      const comments = await prisma.ticketComment.findMany({
        where,
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
      });

      return comments;
    } catch (err) {
      if (isDbUnavailableError(err)) {
        return devFallbackStore.getComments(ticketId, actorUser.role === OrgRole.CUSTOMER);
      }
      throw err;
    }
  }
}

export const commentService = new CommentService();
