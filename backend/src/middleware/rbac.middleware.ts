import { Request, Response, NextFunction } from 'express';
import { OrgRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

export function requireOrgRole(...allowedRoles: OrgRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      return next(new UnauthorizedError('Tenant organization context must be resolved before role check'));
    }

    if (!allowedRoles.includes(req.tenant.role)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions for this action. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.tenant.role}`
        )
      );
    }

    next();
  };
}
