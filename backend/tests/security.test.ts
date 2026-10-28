import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';
import { hashPassword } from '../src/utils/password.util.js';
import { OrgRole } from '@prisma/client';

describe('Phase 2 — Secure Authentication and Multi-Tenant Security Tests', () => {
  const orgAId = '11111111-1111-4111-8111-111111111111';
  const orgBId = '22222222-2222-4222-8222-222222222222';

  const userOwnerA = {
    id: 'aaaa1111-1111-4111-8111-111111111111',
    email: 'owner-a@alpha.com',
    fullName: 'Alpha Owner',
    isActive: true,
  };

  const userOwnerB = {
    id: 'bbbb1111-1111-4111-8111-111111111111',
    email: 'owner-b@beta.com',
    fullName: 'Beta Owner',
    isActive: true,
  };

  const userAgentB = {
    id: 'bbbb2222-2222-4222-8222-222222222222',
    email: 'agent-b@beta.com',
    fullName: 'Beta Agent',
    isActive: true,
  };

  const userCustomerB = {
    id: 'bbbb3333-3333-4333-8333-333333333333',
    email: 'customer-b@beta.com',
    fullName: 'Beta Customer',
    isActive: true,
  };

  let tokenOwnerA: string;
  let tokenOwnerB: string;
  let tokenAgentB: string;
  let tokenCustomerB: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    tokenOwnerA = generateAccessToken({ userId: userOwnerA.id, email: userOwnerA.email });
    tokenOwnerB = generateAccessToken({ userId: userOwnerB.id, email: userOwnerB.email });
    tokenAgentB = generateAccessToken({ userId: userAgentB.id, email: userAgentB.email });
    tokenCustomerB = generateAccessToken({ userId: userCustomerB.id, email: userCustomerB.email });
  });

  // --------------------------------------------------------------------------
  // 1. Authentication & Session Validation
  // --------------------------------------------------------------------------
  describe('1. Unauthenticated & Invalid Token Access', () => {
    it('rejects requests to protected endpoints without Authorization header', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('rejects requests with malformed or invalid JWT access tokens', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('rejects deactivated user accounts', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: userOwnerA.id,
        email: userOwnerA.email,
        fullName: userOwnerA.fullName,
        isActive: false, // Deactivated!
      } as any);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('deactivated');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Generic Authentication Error Defenses
  // --------------------------------------------------------------------------
  describe('2. Generic Authentication Responses & Security', () => {
    it('returns generic error when email is not registered', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@domain.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('returns generic error when password does not match hash', async () => {
      const realHash = await hashPassword('CorrectPassword123!');

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'usr_test',
        email: 'test@domain.com',
        passwordHash: realHash,
        fullName: 'Test User',
        isActive: true,
        memberships: [],
      } as any);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@domain.com',
        password: 'WrongPassword999!',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('never leaks passwordHash in profile or authentication responses', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userOwnerA.id,
        email: userOwnerA.email,
        fullName: userOwnerA.fullName,
        isActive: true,
        memberships: [],
      } as any);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Token Rotation and Replay Attack Revocation
  // --------------------------------------------------------------------------
  describe('3. Token Rotation & Replay Attack Defense', () => {
    it('detects refresh token reuse and revokes all sessions for that user', async () => {
      // Mock findUnique returning a token that is already marked isRevoked: true
      vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValueOnce({
        id: 'tok_consumed',
        userId: userOwnerA.id,
        tokenHash: 'some_hash',
        expiresAt: new Date(Date.now() + 100000),
        isRevoked: true, // Replay attack indicator!
        user: { id: userOwnerA.id, isActive: true },
      } as any);

      const updateManySpy = vi.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValueOnce({ count: 5 });

      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'stolen_or_consumed_token',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Refresh token reuse');
      expect(updateManySpy).toHaveBeenCalledWith({
        where: { userId: userOwnerA.id },
        data: { isRevoked: true },
      });
    });
  });

  // --------------------------------------------------------------------------
  // 4. Multi-Tenant Cross-Organization Isolation (Mandatory Requirement)
  // --------------------------------------------------------------------------
  describe('4. Cross-Organization Isolation Enforcement', () => {
    it('prevents Owner of Org B from reading records of Org A (even knowing Org A ID)', async () => {
      // Mock user lookup for Owner B
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userOwnerB.id,
        email: userOwnerB.email,
        fullName: userOwnerB.fullName,
        isActive: true,
      } as any);

      // Membership check for Org A returns null because Owner B does not belong to Org A!
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}`)
        .set('Authorization', `Bearer ${tokenOwnerB}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('not an authorized member of this organization');
    });

    it('prevents Agent of Org B from listing members of Org A', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userAgentB.id,
        email: userAgentB.email,
        fullName: userAgentB.fullName,
        isActive: true,
      } as any);

      // Membership in Org A is null
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/members`)
        .set('Authorization', `Bearer ${tokenAgentB}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents Owner of Org B from adding or modifying members in Org A', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userOwnerB.id,
        email: userOwnerB.email,
        fullName: userOwnerB.fullName,
        isActive: true,
      } as any);

      // Membership in Org A is null
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValueOnce(null);

      const response = await request(app)
        .post(`/api/v1/organizations/${orgAId}/members`)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({
          email: 'infiltrator@hacker.com',
          role: 'OWNER',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Role-Based Access Control (RBAC) Within Same Organization
  // --------------------------------------------------------------------------
  describe('5. Role-Based Access Control (RBAC) Enforcement', () => {
    it('prevents CUSTOMER role from viewing organization member lists', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userCustomerB.id,
        email: userCustomerB.email,
        fullName: userCustomerB.fullName,
        isActive: true,
      } as any);

      // Customer B IS a member of Org B, but has role CUSTOMER
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValueOnce({
        id: 'mem_cust',
        organizationId: orgBId,
        userId: userCustomerB.id,
        role: OrgRole.CUSTOMER,
      } as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgBId}/members`)
        .set('Authorization', `Bearer ${tokenCustomerB}`);

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('prevents SUPPORT AGENT from inviting new members (restricted to OWNER)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userAgentB.id,
        email: userAgentB.email,
        fullName: userAgentB.fullName,
        isActive: true,
      } as any);

      // Agent B is a member of Org B with role AGENT
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValueOnce({
        id: 'mem_agent',
        organizationId: orgBId,
        userId: userAgentB.id,
        role: OrgRole.AGENT,
      } as any);

      const response = await request(app)
        .post(`/api/v1/organizations/${orgBId}/members`)
        .set('Authorization', `Bearer ${tokenAgentB}`)
        .send({
          email: 'newagent@beta.com',
          role: 'AGENT',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('allows OWNER to list members and invite new members', async () => {
      vi.spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce({
          id: userOwnerB.id,
          email: userOwnerB.email,
          fullName: userOwnerB.fullName,
          isActive: true,
        } as any)
        .mockResolvedValueOnce({
          id: 'usr_new_agent',
          email: 'agent-target@beta.com',
        } as any);

      vi.spyOn(prisma.organizationMember, 'findUnique')
        .mockResolvedValueOnce({
          id: 'mem_owner',
          organizationId: orgBId,
          userId: userOwnerB.id,
          role: OrgRole.OWNER,
        } as any)
        .mockResolvedValueOnce(null); // not already a member

      vi.spyOn(prisma.organizationMember, 'create').mockResolvedValueOnce({
        id: 'mem_created',
        organizationId: orgBId,
        userId: 'usr_new_agent',
        role: OrgRole.AGENT,
      } as any);

      const response = await request(app)
        .post(`/api/v1/organizations/${orgBId}/members`)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({
          email: 'agent-target@beta.com',
          role: 'AGENT',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe('AGENT');
      expect(response.body.data.message).toContain('Member successfully added');
    });

    it('prevents sole OWNER from demoting themselves or removing their own owner status', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userOwnerB.id,
        email: userOwnerB.email,
        fullName: userOwnerB.fullName,
        isActive: true,
      } as any);

      vi.spyOn(prisma.organizationMember, 'findUnique')
        .mockResolvedValueOnce({
          id: 'mem_owner',
          organizationId: orgBId,
          userId: userOwnerB.id,
          role: OrgRole.OWNER,
        } as any)
        .mockResolvedValueOnce({
          id: 'mem_owner',
          organizationId: orgBId,
          userId: userOwnerB.id,
          role: OrgRole.OWNER,
        } as any);

      // Only 1 owner exists in org
      vi.spyOn(prisma.organizationMember, 'count').mockResolvedValueOnce(1);

      const response = await request(app)
        .patch(`/api/v1/organizations/${orgBId}/members/${userOwnerB.id}`)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({
          role: 'CUSTOMER', // Attempting to demote sole owner
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('sole Owner');
    });
  });
});
