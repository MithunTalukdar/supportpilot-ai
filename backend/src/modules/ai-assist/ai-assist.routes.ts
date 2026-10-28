import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { aiAssistController } from './ai-assist.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { requireOrgRole } from '../../middleware/rbac.middleware.js';

export const aiAssistRouter = Router({ mergeParams: true });

// All AI assist routes require authenticated staff (OWNER or AGENT)
aiAssistRouter.use(authenticateUser, resolveTenantContext, requireOrgRole(OrgRole.OWNER, OrgRole.AGENT));

// 1. Ticket Summarization
aiAssistRouter.post('/tickets/:ticketId/summarize', (req, res, next) => {
  aiAssistController.summarizeTicket(req, res).catch(next);
});

// 2. Ticket Classification and Sentiment
aiAssistRouter.post('/tickets/:ticketId/classify', (req, res, next) => {
  aiAssistController.classifyTicket(req, res).catch(next);
});

// 3. Grounded Draft Reply Suggestion
aiAssistRouter.post('/tickets/:ticketId/suggest-reply', (req, res, next) => {
  aiAssistController.suggestReply(req, res).catch(next);
});

// 4. AI Usage Ledger and Aggregate Metrics
aiAssistRouter.get('/usage', (req, res, next) => {
  aiAssistController.getUsageLedger(req, res).catch(next);
});

// 5. AI Settings (spend limit, confidence threshold)
aiAssistRouter.get('/settings', (req, res, next) => {
  aiAssistController.getSettings(req, res).catch(next);
});

// 6. Update AI Settings (Owner only)
aiAssistRouter.patch('/settings', requireOrgRole(OrgRole.OWNER), (req, res, next) => {
  aiAssistController.updateSettings(req, res).catch(next);
});
