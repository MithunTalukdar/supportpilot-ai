import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './logging/logger.js';
import { disconnectPrisma } from './repositories/prisma.js';
import type { Server } from 'http';

let server: Server;

function startServer(): void {
  try {
    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          frontendUrl: env.FRONTEND_URL,
        },
        `🚀 SupportPilot AI Backend listening on port ${env.PORT}`
      );
    });

    const handleShutdown = async (signal: string) => {
      logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown...`);

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed');
          await disconnectPrisma();
          process.exit(0);
        });

        // Force shutdown after 10 seconds if hanging connections persist
        setTimeout(() => {
          logger.error('Forced shutdown due to timeout');
          process.exit(1);
        }, 10000).unref();
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled Promise Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught Exception detected! Halting process.');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
