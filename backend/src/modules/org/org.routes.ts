import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { orgController } from './org.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { resolveTenantContext } from '../../middleware/tenant.middleware.js';
import { requireOrgRole } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createOrgSchema, addMemberSchema, updateRoleSchema } from './org.validation.js';

export const orgRouter = Router();

// Create new organization (any authenticated user can create an org and become its OWNER)
orgRouter.post('/', authenticateUser, validateRequest(createOrgSchema), (req, res, next) => {
  orgController.create(req, res).catch(next);
});

// Get organization details (restricted to verified members of this organization)
orgRouter.get('/:orgId', authenticateUser, resolveTenantContext, (req, res, next) => {
  orgController.get(req, res).catch(next);
});

// List members of organization (accessible only to OWNER or AGENT roles in this organization)
orgRouter.get(
  '/:orgId/members',
  authenticateUser,
  resolveTenantContext,
  requireOrgRole(OrgRole.OWNER, OrgRole.AGENT),
  (req, res, next) => {
    orgController.listMembers(req, res).catch(next);
  }
);

// Add new member to organization (strictly restricted to OWNER)
orgRouter.post(
  '/:orgId/members',
  authenticateUser,
  resolveTenantContext,
  requireOrgRole(OrgRole.OWNER),
  validateRequest(addMemberSchema),
  (req, res, next) => {
    orgController.addMember(req, res).catch(next);
  }
);

// Update member role (strictly restricted to OWNER)
orgRouter.patch(
  '/:orgId/members/:userId',
  authenticateUser,
  resolveTenantContext,
  requireOrgRole(OrgRole.OWNER),
  validateRequest(updateRoleSchema),
  (req, res, next) => {
    orgController.updateRole(req, res).catch(next);
  }
);

// Remove member from organization (strictly restricted to OWNER)
orgRouter.delete(
  '/:orgId/members/:userId',
  authenticateUser,
  resolveTenantContext,
  requireOrgRole(OrgRole.OWNER),
  (req, res, next) => {
    orgController.removeMember(req, res).catch(next);
  }
);
