import cors, { CorsOptions } from 'cors';
import { env } from '../config/env.js';

// Explicit frontend-origin allowlist
const configuredOrigins = (env.CORS_ALLOWED_ORIGINS || env.FRONTEND_URL)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    env.FRONTEND_URL.replace(/\/$/, ''),
    ...(env.NODE_ENV === 'development'
      ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']
      : []),
  ])
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server or health checks)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id', 'X-Organization-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
