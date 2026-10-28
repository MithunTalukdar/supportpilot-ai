import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env variables before schema validation
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val.toLowerCase() === 'true' : undefined)),
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters' }).default('dev-jwt-secret-min-16-characters-placeholder'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16, { message: 'REFRESH_TOKEN_SECRET must be at least 16 characters' }).default('dev-refresh-secret-min-16-characters-placeholder'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'anthropic', 'mock']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
    console.error(`\n❌ [STARTUP FAILURE] Invalid environment configuration:\n${formattedErrors}\n`);
    throw new Error('Environment configuration validation failed.');
  }

  validatedEnv = result.data;
  return validatedEnv;
}

export const env = validateEnv();
