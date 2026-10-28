import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { prisma } from '../repositories/prisma.js';
import { devFallbackStore, isDbUnavailableError } from '../repositories/dev-fallback.store.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header. Bearer token required.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Access token is missing');
    }

    const payload = verifyAccessToken(token);

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
        },
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(dbErr)) {
        const devUser = devFallbackStore.findUserById(payload.userId) || devFallbackStore.getOrCreateUser(payload.email);
        req.user = {
          id: devUser.id,
          email: devUser.email,
          fullName: devUser.fullName,
          isActive: true,
        };
        next();
        return;
      }
      throw dbErr;
    }

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account has been deactivated. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
