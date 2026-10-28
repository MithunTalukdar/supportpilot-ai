import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logger.error(logData, `Server Error on ${req.method} ${req.originalUrl}`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `Client Warning on ${req.method} ${req.originalUrl}`);
    } else {
      logger.info(logData, `Handled ${req.method} ${req.originalUrl}`);
    }
  });

  next();
}
