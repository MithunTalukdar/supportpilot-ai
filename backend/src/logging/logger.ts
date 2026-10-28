import pino from 'pino';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  base: isProduction ? { pid: process.pid } : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    !isProduction && !isTest
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
