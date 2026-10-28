import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res, next) => {
  healthController.checkHealth(req, res).catch(next);
});
