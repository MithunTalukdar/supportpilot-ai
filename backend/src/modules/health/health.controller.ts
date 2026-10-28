import { Request, Response } from 'express';
import { healthService } from './health.service.js';
import { HttpStatus } from '../../constants/http-status.js';

export class HealthController {
  public async checkHealth(_req: Request, res: Response): Promise<void> {
    const health = await healthService.getHealth();
    const statusCode = health.status === 'UP' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json({
      success: health.status === 'UP',
      data: health,
    });
  }
}

export const healthController = new HealthController();
