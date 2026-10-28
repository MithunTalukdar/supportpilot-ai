import { z } from 'zod';
import { ChatChannel } from '@prisma/client';
import { RequestValidationSchema } from '../../middleware/validate.middleware.js';

export const createConversationSchema: RequestValidationSchema = {
  body: z.object({
    title: z.string().trim().max(255).optional(),
    channel: z.nativeEnum(ChatChannel).optional(),
    ticketId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
  }),
};

export const sendMessageSchema: RequestValidationSchema = {
  body: z.object({
    content: z
      .string({ required_error: 'Message content is required' })
      .trim()
      .min(1, 'Message cannot be empty')
      .max(4000, 'Message cannot exceed 4,000 characters'),
  }),
};

export const listConversationsQuerySchema: RequestValidationSchema = {
  query: z.object({
    ticketId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),
};
