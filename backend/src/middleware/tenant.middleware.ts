import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { OrgRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError, BadRequestError } from '../errors/app-error.js';
import { prisma } from '../repositories/prisma.js';
import { devFallbackStore, isDbUnavailableError } from '../repositories/dev-fallback.store.js';

export interface TenantContext {
  organizationId: string;
  role: OrgRole;
  userId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveTenantContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to access organization resources');
    }

    // Extract target organization from route parameter or header
    const requestedOrgId = req.params.orgId || req.header('X-Organization-Id');

    if (!requestedOrgId) {
      throw new BadRequestError('Organization identifier is required for this operation');
    }

    if (!UUID_REGEX.test(requestedOrgId)) {
      throw new BadRequestError('Invalid organization ID format. UUID expected.');
    }

    // Derive organization access strictly from verified database membership
    let membership = null;
    try {
      membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: requestedOrgId,
            userId: req.user.id,
          },
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(dbErr)) {
        const devUser = devFallbackStore.findUserById(req.user.id);
        const tenantContext: TenantContext = {
          organizationId: requestedOrgId,
          role: devUser?.role || OrgRole.OWNER,
          userId: req.user.id,
        };
        req.tenant = tenantContext;
        tenantStorage.run(tenantContext, () => {
          next();
        });
        return;
      }
      throw dbErr;
    }

    if (!membership) {
      // User is authenticated, but is NOT a verified member of the requested organization
      throw new ForbiddenError('Access denied: You are not an authorized member of this organization');
    }

    const tenantContext: TenantContext = {
      organizationId: membership.organizationId,
      role: membership.role,
      userId: req.user.id,
    };

    req.tenant = tenantContext;

    // Run the rest of the request within AsyncLocalStorage tenant context
    tenantStorage.run(tenantContext, () => {
      next();
    });
  } catch (error) {
    next(error);
  }
}
