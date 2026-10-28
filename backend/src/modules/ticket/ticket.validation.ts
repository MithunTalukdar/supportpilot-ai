import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { RequestValidationSchema } from '../../middleware/validate.middleware.js';

export const createTicketSchema: RequestValidationSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Title/Subject must be at least 3 characters').max(255).optional(),
    subject: z.string().trim().min(3, 'Title/Subject must be at least 3 characters').max(255).optional(),
    description: z.string().trim().min(5, 'Description must be at least 5 characters'),
    category: z.string().trim().max(64).default('General'),
    priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
    tags: z.array(z.string().trim().max(32)).default([]),
  }).refine((data) => data.title || data.subject, {
    message: 'Either title or subject is required',
    path: ['title'],
  }),
  params: z.object({
    orgId: z.string().uuid('Invalid organization ID format'),
  }),
};

export const updateTicketSchema: RequestValidationSchema = {
  body: z.object({
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    assignedAgentId: z.string().uuid('Invalid assigned agent ID format').nullable().optional(),
    category: z.string().trim().max(64).optional(),
    tags: z.array(z.string().trim().max(32)).optional(),
  }),
  params: z.object({
    orgId: z.string().uuid('Invalid organization ID format'),
    ticketId: z.string().uuid('Invalid ticket ID format'),
  }),
};

export const listTicketsQuerySchema: RequestValidationSchema = {
  query: z.object({
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    category: z.string().trim().optional(),
    assignedAgentId: z.string().uuid().optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  params: z.object({
    orgId: z.string().uuid('Invalid organization ID format'),
  }),
};

export const addCommentSchema: RequestValidationSchema = {
  body: z.object({
    content: z.string().trim().min(1, 'Comment content cannot be empty'),
    isInternal: z.boolean().default(false),
  }),
  params: z.object({
    orgId: z.string().uuid('Invalid organization ID format'),
    ticketId: z.string().uuid('Invalid ticket ID format'),
  }),
};
