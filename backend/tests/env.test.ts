import { describe, it, expect } from 'vitest';
import { env } from '../src/config/env.js';

describe('Environment Config Tests', () => {
  it('should have loaded valid environment variables', () => {
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.PORT).toBeGreaterThan(0);
    expect(env.NODE_ENV).toBeDefined();
    expect(env.FRONTEND_URL).toBeDefined();
  });
});
