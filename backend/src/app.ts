import express, { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { errorHandlerMiddleware } from './middleware/error.middleware.js';
import { apiRouter } from './routes/api.routes.js';
import { NotFoundError } from './errors/app-error.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(corsMiddleware);

  // Request & Cookie Parsing
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Tracing and Logging Middlewares
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // API Routes
  app.use('/api', apiRouter);

  // 404 Fallback for Unmatched Routes
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handling
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
