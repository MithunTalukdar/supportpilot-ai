import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { HttpStatus } from '../constants/http-status.js';
import { ErrorCode } from '../constants/error-codes.js';
import { logger } from '../logging/logger.js';
import { env } from '../config/env.js';

export function errorHandlerMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || 'unknown';

  // Handle SyntaxError for malformed JSON bodies
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: 'Malformed JSON payload in request body',
        requestId,
      },
    });
    return;
  }

  // Handle CORS rejection errors
  if (err.message && err.message.includes('CORS')) {
    res.status(HttpStatus.FORBIDDEN).json({
      success: false,
      error: {
        code: ErrorCode.FORBIDDEN,
        message: err.message,
        requestId,
      },
    });
    return;
  }

  // Handle Known Operational AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, `Operational Error: ${err.message}`);
    } else {
      logger.warn({ errorCode: err.errorCode, message: err.message, requestId }, `Handled Client Error: ${err.message}`);
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  // Handle Prisma Database Connection Failure (e.g. PostgreSQL offline)
  if (
    err.name === 'PrismaClientInitializationError' ||
    (err.message && (err.message.includes("Can't reach database server") || err.message.includes('ECONNREFUSED')))
  ) {
    logger.error({ requestId, err: err.message }, 'Database connection failure detected');
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database server is currently unavailable. Please verify that PostgreSQL is running on port 5432 or configure a valid DATABASE_URL in backend/.env.',
        requestId,
      },
    });
    return;
  }

  // Unexpected Non-Operational Errors
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      requestId,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled Server Exception'
  );

  const isProduction = env.NODE_ENV === 'production';

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: isProduction
        ? 'An unexpected internal server error occurred. Please contact support.'
        : err.message,
      requestId,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
