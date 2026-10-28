import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    if (!decoded.userId || !decoded.email) {
      throw new UnauthorizedError('Invalid access token payload');
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired');
    }
    throw new UnauthorizedError('Invalid or corrupted access token');
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): { token: string; hash: string } {
  // 256 bits of cryptographically secure random entropy
  const token = randomBytes(32).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
}
