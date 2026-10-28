import { z } from 'zod';
import { RequestValidationSchema } from '../../middleware/validate.middleware.js';

export const registerSchema: RequestValidationSchema = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address')
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(128, 'Full name cannot exceed 128 characters'),
  }),
};

export const loginSchema: RequestValidationSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema: RequestValidationSchema = {
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
};

export const recoverSchema: RequestValidationSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
  }),
};

export const updateProfileSchema: RequestValidationSchema = {
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(128).optional(),
    avatarUrl: z.string().url('Invalid avatar URL format').max(1024).nullable().optional(),
  }),
};

export const changePasswordSchema: RequestValidationSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
};

