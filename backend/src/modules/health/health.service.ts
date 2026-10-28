import { prisma } from '../../repositories/prisma.js';
import { logger } from '../../logging/logger.js';
import { env } from '../../config/env.js';

export interface HealthCheckResult {
  status: 'UP' | 'DEGRADED';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: {
      status: 'CONNECTED' | 'DISCONNECTED';
      latencyMs?: number;
      message?: string;
    };
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
}

export class HealthService {
  public async getHealth(): Promise<HealthCheckResult> {
    const memory = process.memoryUsage();
    const memoryMetrics = {
      rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
    };

    let dbStatus: 'CONNECTED' | 'DISCONNECTED' = 'DISCONNECTED';
    let dbLatencyMs: number | undefined;
    let dbMessage: string | undefined;

    const dbStart = Date.now();
    try {
      // Execute lightweight raw ping query
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'CONNECTED';
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Database health check probe failed');
      dbStatus = 'DISCONNECTED';
      dbMessage = 'Database connection could not be established or timed out';
    }

    const overallStatus: 'UP' | 'DEGRADED' = dbStatus === 'CONNECTED' ? 'UP' : 'DEGRADED';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      services: {
        database: {
          status: dbStatus,
          ...(dbLatencyMs !== undefined ? { latencyMs: dbLatencyMs } : {}),
          ...(dbMessage ? { message: dbMessage } : {}),
        },
        memory: memoryMetrics,
      },
    };
  }
}

export const healthService = new HealthService();
