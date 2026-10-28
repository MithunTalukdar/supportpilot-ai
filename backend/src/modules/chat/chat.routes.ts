import { Router } from 'express';
import { chatController } from './chat.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createConversationSchema,
  sendMessageSchema,
  listConversationsQuerySchema,
} from './chat.validation.js';

export const chatRouter = Router({ mergeParams: true });

// All chat routes require authenticated users with valid tenant context
chatRouter.use(authenticateUser, resolveTenantContext);

// 1. Create a new conversation thread
chatRouter.post('/', validateRequest(createConversationSchema), (req, res, next) => {
  chatController.create(req, res).catch(next);
});

// 2. List conversations (customers see only theirs; agents/owners see all)
chatRouter.get('/', validateRequest(listConversationsQuerySchema), (req, res, next) => {
  chatController.list(req, res).catch(next);
});

// 3. Get single conversation and message history
chatRouter.get('/:conversationId', (req, res, next) => {
  chatController.get(req, res).catch(next);
});

// 4. Send a message and generate grounded RAG answer with citations
chatRouter.post('/:conversationId/messages', validateRequest(sendMessageSchema), (req, res, next) => {
  chatController.sendMessage(req, res).catch(next);
});

// 5. Delete conversation
chatRouter.delete('/:conversationId', (req, res, next) => {
  chatController.delete(req, res).catch(next);
});
