import { z } from 'zod';
import { OrgRole } from '@prisma/client';
import { RequestValidationSchema } from '../../middleware/validate.middleware.js';

export const createOrgSchema: RequestValidationSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(128),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, 'Slug must be at least 2 characters')
      .max(64)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric characters and hyphens'),
    domain: z.string().trim().max(255).optional(),
  }),
};

export const addMemberSchema: RequestValidationSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    role: z.nativeEnum(OrgRole, {
      errorMap: () => ({ message: "Role must be 'OWNER', 'AGENT', or 'CUSTOMER'" }),
    }),
  }),
};

export const updateRoleSchema: RequestValidationSchema = {
  body: z.object({
    role: z.nativeEnum(OrgRole, {
      errorMap: () => ({ message: "Role must be 'OWNER', 'AGENT', or 'CUSTOMER'" }),
    }),
  }),
  params: z.object({
    orgId: z.string().uuid('Invalid organization ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
};
