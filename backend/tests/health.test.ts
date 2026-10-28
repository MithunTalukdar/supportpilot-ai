import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';

describe('Health Module API Tests', () => {
  it('should return health check information on GET /api/health', async () => {
    // Mock database query to simulate connected state in test environment
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ '?column?': 1 }]);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'UP');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('uptimeSeconds');
    expect(response.body.data.services).toHaveProperty('database');
    expect(response.body.data.services.database.status).toBe('CONNECTED');
    expect(response.body.data.services).toHaveProperty('memory');
    expect(response.headers).toHaveProperty('x-request-id');
  });

  it('should handle database disconnection gracefully without exposing secrets', async () => {
    // Mock database query failure
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection refused'));

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.data).toHaveProperty('status', 'DEGRADED');
    expect(response.body.data.services.database.status).toBe('DISCONNECTED');
    // Ensure no secret connection string is leaked
    expect(JSON.stringify(response.body)).not.toContain('postgres://');
  });

  it('should return 404 with structured error envelope on nonexistent endpoint', async () => {
    const response = await request(app).get('/api/nonexistent-route-for-testing');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('requestId');
  });
});
