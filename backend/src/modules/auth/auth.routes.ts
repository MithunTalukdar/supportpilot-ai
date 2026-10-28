import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  recoverSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validation.js';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validateRequest(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

authRouter.post('/login', authRateLimiter, validateRequest(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

authRouter.post('/recover', authRateLimiter, validateRequest(recoverSchema), (req, res, next) => {
  authController.recover(req, res).catch(next);
});

authRouter.post('/refresh', validateRequest(refreshSchema), (req, res, next) => {
  authController.refresh(req, res).catch(next);
});

authRouter.post('/logout', (req, res, next) => {
  authController.logout(req, res).catch(next);
});

authRouter.get('/me', authenticateUser, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

authRouter.patch('/profile', authenticateUser, validateRequest(updateProfileSchema), (req, res, next) => {
  authController.updateProfile(req, res).catch(next);
});

authRouter.post('/change-password', authenticateUser, validateRequest(changePasswordSchema), (req, res, next) => {
  authController.changePassword(req, res).catch(next);
});

