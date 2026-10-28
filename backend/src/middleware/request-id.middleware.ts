import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('X-Request-Id');
  const requestId = incomingId && incomingId.trim() !== '' ? incomingId : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
