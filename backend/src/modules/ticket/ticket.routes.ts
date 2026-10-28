import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { ticketController } from './ticket.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { requireOrgRole } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsQuerySchema,
  addCommentSchema,
} from './ticket.validation.js';

export const ticketRouter = Router({ mergeParams: true });

// Create ticket (CUSTOMER, AGENT, OWNER)
ticketRouter.post(
  '/',
  authenticateUser,
  resolveTenantContext,
  validateRequest(createTicketSchema),
  (req, res, next) => {
    ticketController.create(req, res).catch(next);
  }
);

// List tickets (CUSTOMER gets strictly their own; AGENT and OWNER get all org tickets)
ticketRouter.get(
  '/',
  authenticateUser,
  resolveTenantContext,
  validateRequest(listTicketsQuerySchema),
  (req, res, next) => {
    ticketController.list(req, res).catch(next);
  }
);

// Get organization ticket metrics (OWNER, AGENT)
ticketRouter.get(
  '/metrics',
  authenticateUser,
  resolveTenantContext,
  requireOrgRole(OrgRole.OWNER, OrgRole.AGENT),
  (req, res, next) => {
    ticketController.getMetrics(req, res).catch(next);
  }
);

// Get single ticket details and conversation thread
ticketRouter.get(
  '/:ticketId',
  authenticateUser,
  resolveTenantContext,
  (req, res, next) => {
    ticketController.get(req, res).catch(next);
  }
);

// Update ticket status, priority, category or assignment (OWNER, AGENT only)
ticketRouter.patch(
  '/:ticketId',
  authenticateUser,
  resolveTenantContext,
  requireOrgRole(OrgRole.OWNER, OrgRole.AGENT),
  validateRequest(updateTicketSchema),
  (req, res, next) => {
    ticketController.update(req, res).catch(next);
  }
);

// Add reply or internal note to ticket
ticketRouter.post(
  '/:ticketId/comments',
  authenticateUser,
  resolveTenantContext,
  validateRequest(addCommentSchema),
  (req, res, next) => {
    ticketController.addComment(req, res).catch(next);
  }
);

// List comments for ticket
ticketRouter.get(
  '/:ticketId/comments',
  authenticateUser,
  resolveTenantContext,
  (req, res, next) => {
    ticketController.listComments(req, res).catch(next);
  }
);
