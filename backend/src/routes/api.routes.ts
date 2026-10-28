import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { orgRouter } from '../modules/org/org.routes.js';
import { ticketRouter } from '../modules/ticket/ticket.routes.js';
import { kbRouter } from '../modules/kb/kb.routes.js';
import { chatRouter } from '../modules/chat/chat.routes.js';
import { aiAssistRouter } from '../modules/ai-assist/ai-assist.routes.js';

export const apiRouter = Router();

// Mount root health check endpoint -> /api/health
apiRouter.use('/', healthRouter);

// Version 1 API namespace
const v1Router = Router();
v1Router.use('/', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/organizations', orgRouter);
v1Router.use('/organizations/:orgId/tickets', ticketRouter);
v1Router.use('/organizations/:orgId/documents', kbRouter);
v1Router.use('/organizations/:orgId/chat', chatRouter);
v1Router.use('/organizations/:orgId/ai', aiAssistRouter);

// Mount versioned routes -> /api/v1
apiRouter.use('/v1', v1Router);

// Mount backward-compatible unversioned route aliases -> /api/*
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', orgRouter);
apiRouter.use('/organizations/:orgId/tickets', ticketRouter);
apiRouter.use('/organizations/:orgId/documents', kbRouter);
apiRouter.use('/organizations/:orgId/chat', chatRouter);
apiRouter.use('/organizations/:orgId/ai', aiAssistRouter);

