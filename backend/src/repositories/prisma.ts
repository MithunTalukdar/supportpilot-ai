import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database client disconnected cleanly');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting Prisma client');
  }
}
