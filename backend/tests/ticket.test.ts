import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';
import { OrgRole, TicketPriority, TicketStatus } from '@prisma/client';

describe('Phase 3 — Support Ticket Lifecycle & Multi-Tenant Authorization Tests', () => {
  const orgAId = '11111111-1111-4111-8111-111111111111';
  const orgBId = '22222222-2222-4222-8222-222222222222';

  const userCustomerA = {
    id: 'aaaa1111-1111-4111-8111-111111111111',
    email: 'customer-a@alpha.com',
    fullName: 'Customer Alpha',
    isActive: true,
  };

  const userAgentA = {
    id: 'aaaa2222-2222-4222-8222-222222222222',
    email: 'agent-a@alpha.com',
    fullName: 'Agent Alpha',
    isActive: true,
  };

  const userCustomerB = {
    id: 'bbbb1111-1111-4111-8111-111111111111',
    email: 'customer-b@beta.com',
    fullName: 'Customer Beta',
    isActive: true,
  };

  const userAgentB = {
    id: 'bbbb2222-2222-4222-8222-222222222222',
    email: 'agent-b@beta.com',
    fullName: 'Agent Beta',
    isActive: true,
  };

  let tokenCustomerA: string;
  let tokenAgentA: string;
  let tokenCustomerB: string;
  let tokenAgentB: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    tokenCustomerA = generateAccessToken({ userId: userCustomerA.id, email: userCustomerA.email });
    tokenAgentA = generateAccessToken({ userId: userAgentA.id, email: userAgentA.email });
    tokenCustomerB = generateAccessToken({ userId: userCustomerB.id, email: userCustomerB.email });
    tokenAgentB = generateAccessToken({ userId: userAgentB.id, email: userAgentB.email });
  });

  // --------------------------------------------------------------------------
  // 1. Ticket Creation & Validation
  // --------------------------------------------------------------------------
  describe('1. Ticket Creation & Duplicate Defense', () => {
    it('creates a new ticket with sequential number and records an audit log event', async () => {
      // User auth mock
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);

      // Org membership mock (Customer in Org A)
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_1',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      // Duplicate check mock (none)
      vi.spyOn(prisma.ticket, 'findFirst').mockResolvedValueOnce(null);

      // Create ticket mock
      const createdTicket = {
        id: 'tic_001',
        organizationId: orgAId,
        ticketNumber: 1001,
        title: 'Billing issue with credit card',
        description: 'Unable to charge renewal invoice',
        category: 'Billing',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        customerId: userCustomerA.id,
        tags: ['billing'],
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: userCustomerA,
      };

      vi.spyOn(prisma.ticket, 'create').mockResolvedValueOnce(createdTicket as any);
      const auditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({ id: 'aud_1' } as any);

      const response = await request(app)
        .post(`/api/v1/organizations/${orgAId}/tickets`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          title: 'Billing issue with credit card',
          description: 'Unable to charge renewal invoice',
          category: 'Billing',
          priority: 'HIGH',
          tags: ['billing'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticketNumber).toBe(1001);
      expect(response.body.data.title).toBe('Billing issue with credit card');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TICKET_CREATED',
            entityType: 'TICKET',
          }),
        })
      );
    });

    it('rejects duplicate ticket submission if submitted recently with same title', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_1',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      // Mock recent duplicate exists
      vi.spyOn(prisma.ticket, 'findFirst').mockResolvedValueOnce({
        id: 'tic_existing',
        title: 'Duplicate subject',
      } as any);

      const response = await request(app)
        .post(`/api/v1/organizations/${orgAId}/tickets`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          title: 'Duplicate subject',
          description: 'Testing duplicate prevention mechanism',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('duplicate ticket');
    });

    it('rejects malformed ticket request when description is missing', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_1',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      const response = await request(app)
        .post(`/api/v1/organizations/${orgAId}/tickets`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          title: 'Only title without description',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Ticket Listing, Filtering, and Customer Scoping
  // --------------------------------------------------------------------------
  describe('2. Ticket Listing & Customer Isolation', () => {
    it('scopes listing strictly to customer own tickets when role is CUSTOMER', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_1',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      const countSpy = vi.spyOn(prisma.ticket, 'count').mockResolvedValueOnce(1);
      const findManySpy = vi.spyOn(prisma.ticket, 'findMany').mockResolvedValueOnce([
        {
          id: 'tic_001',
          title: 'Customer A ticket',
          customerId: userCustomerA.id,
          _count: { comments: 2 },
        },
      ] as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets`)
        .set('Authorization', `Bearer ${tokenCustomerA}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      // Verify that prisma was queried with customerId filter!
      expect(countSpy).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: orgAId,
          customerId: userCustomerA.id,
        }),
      });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: orgAId,
            customerId: userCustomerA.id,
          }),
        })
      );
    });

    it('allows SUPPORT AGENT to view all organization tickets and filter by status and priority', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userAgentA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_agent',
        organizationId: orgAId,
        userId: userAgentA.id,
        role: OrgRole.AGENT,
      } as any);

      const countSpy = vi.spyOn(prisma.ticket, 'count').mockResolvedValueOnce(3);
      vi.spyOn(prisma.ticket, 'findMany').mockResolvedValueOnce([
        { id: 'tic_1', title: 'Ticket 1', status: TicketStatus.OPEN, priority: TicketPriority.HIGH, _count: { comments: 0 } },
      ] as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets?status=OPEN&priority=HIGH&page=1&limit=10`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
      expect(countSpy).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: orgAId,
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
        }),
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. Single Ticket Details & Internal Notes Protection
  // --------------------------------------------------------------------------
  describe('3. Ticket Conversation & Private Internal Notes', () => {
    it('prevents Customer A from reading another customer ticket', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_cust_a',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      // Ticket belongs to customer B
      vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        id: 'tic_other',
        organizationId: orgAId,
        customerId: userCustomerB.id, // Different customer!
        comments: [],
      } as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets/tic_other`)
        .set('Authorization', `Bearer ${tokenCustomerA}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('filters out internal agent notes when viewed by a CUSTOMER', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_cust_a',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        id: 'tic_001',
        organizationId: orgAId,
        customerId: userCustomerA.id,
        comments: [
          { id: 'com_public', content: 'Public message to customer', isInternal: false },
          { id: 'com_internal', content: 'Secret internal agent note', isInternal: true },
        ],
      } as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets/tic_001`)
        .set('Authorization', `Bearer ${tokenCustomerA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.comments).toHaveLength(1);
      expect(response.body.data.comments[0].content).toBe('Public message to customer');
      expect(JSON.stringify(response.body.data)).not.toContain('Secret internal agent note');
    });

    it('preserves internal agent notes when viewed by a SUPPORT AGENT', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userAgentA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_agent',
        organizationId: orgAId,
        userId: userAgentA.id,
        role: OrgRole.AGENT,
      } as any);

      vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        id: 'tic_001',
        organizationId: orgAId,
        customerId: userCustomerA.id,
        comments: [
          { id: 'com_public', content: 'Public message to customer', isInternal: false },
          { id: 'com_internal', content: 'Secret internal agent note', isInternal: true },
        ],
      } as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets/tic_001`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.comments).toHaveLength(2);
      expect(response.body.data.comments.some((c: any) => c.isInternal)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Ticket Status, Priority & Assignment Updates
  // --------------------------------------------------------------------------
  describe('4. Ticket Updates & RBAC Guardrails', () => {
    it('prevents CUSTOMER role from modifying ticket status or priority', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userCustomerA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_cust_a',
        organizationId: orgAId,
        userId: userCustomerA.id,
        role: OrgRole.CUSTOMER,
      } as any);

      const response = await request(app)
        .patch(`/api/v1/organizations/${orgAId}/tickets/tic_001`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          status: 'RESOLVED',
          priority: 'URGENT',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('allows SUPPORT AGENT to assign an agent and transition status to RESOLVED', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userAgentA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique')
        .mockResolvedValueOnce({
          id: 'mem_agent',
          organizationId: orgAId,
          userId: userAgentA.id,
          role: OrgRole.AGENT,
        } as any)
        .mockResolvedValueOnce({
          id: 'mem_agent_target',
          organizationId: orgAId,
          userId: userAgentA.id,
          role: OrgRole.AGENT,
        } as any);

      const testTicketId = '99999999-9999-4999-8999-999999999999';

      vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        id: testTicketId,
        organizationId: orgAId,
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        assignedAgentId: null,
      } as any);

      vi.spyOn(prisma.ticket, 'update').mockResolvedValueOnce({
        id: testTicketId,
        organizationId: orgAId,
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.URGENT,
        assignedAgentId: userAgentA.id,
        resolvedAt: new Date(),
      } as any);

      const auditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({ id: 'aud_up' } as any);

      const response = await request(app)
        .patch(`/api/v1/organizations/${orgAId}/tickets/${testTicketId}`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .send({
          status: 'RESOLVED',
          priority: 'URGENT',
          assignedAgentId: userAgentA.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('RESOLVED');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TICKET_UPDATED',
          }),
        })
      );
    });

    it('rejects invalid status transitions from CLOSED to WAITING_FOR_CUSTOMER', async () => {
      const testTicketId = '99999999-9999-4999-8999-999999999999';

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userAgentA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_agent',
        organizationId: orgAId,
        userId: userAgentA.id,
        role: OrgRole.AGENT,
      } as any);

      vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        id: testTicketId,
        organizationId: orgAId,
        status: TicketStatus.CLOSED, // Already closed
      } as any);

      const response = await request(app)
        .patch(`/api/v1/organizations/${orgAId}/tickets/${testTicketId}`)
        .set('Authorization', `Bearer ${tokenAgentA}`)
        .send({
          status: 'WAITING_FOR_CUSTOMER',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid status transition');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Cross-Organization Access Defense
  // --------------------------------------------------------------------------
  describe('5. Cross-Organization Ticket Access Defense', () => {
    it('blocks Agent of Org B from querying tickets in Org A', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userAgentB as any);
      // Agent B is not a member of Org A
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets`)
        .set('Authorization', `Bearer ${tokenAgentB}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Organization Support Metrics
  // --------------------------------------------------------------------------
  describe('6. Organization Support Metrics', () => {
    it('computes accurate ticket status and resolution metrics for Organization Owner', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userAgentA as any);
      vi.spyOn(prisma.organizationMember, 'findUnique').mockResolvedValue({
        id: 'mem_owner',
        organizationId: orgAId,
        userId: userAgentA.id,
        role: OrgRole.OWNER,
      } as any);

      vi.spyOn(prisma.ticket, 'count').mockResolvedValueOnce(4);
      vi.spyOn(prisma.ticket, 'findMany').mockResolvedValueOnce([
        { status: TicketStatus.OPEN, priority: TicketPriority.HIGH, createdAt: new Date(Date.now() - 3600000), resolvedAt: null },
        { status: TicketStatus.IN_PROGRESS, priority: TicketPriority.MEDIUM, createdAt: new Date(Date.now() - 3600000), resolvedAt: null },
        { status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, createdAt: new Date(Date.now() - 7200000), resolvedAt: new Date() },
        { status: TicketStatus.CLOSED, priority: TicketPriority.LOW, createdAt: new Date(Date.now() - 3600000), resolvedAt: new Date() },
      ] as any);

      const response = await request(app)
        .get(`/api/v1/organizations/${orgAId}/tickets/metrics`)
        .set('Authorization', `Bearer ${tokenAgentA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalTickets).toBe(4);
      expect(response.body.data.openTickets).toBe(2);
      expect(response.body.data.resolvedTickets).toBe(2);
      expect(response.body.data.statusBreakdown).toHaveProperty('OPEN', 1);
      expect(response.body.data.statusBreakdown).toHaveProperty('IN_PROGRESS', 1);
      expect(response.body.data.statusBreakdown).toHaveProperty('RESOLVED', 1);
      expect(response.body.data.statusBreakdown).toHaveProperty('CLOSED', 1);
    });
  });
});
