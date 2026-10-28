/**
 * SupportPilot AI — In-Memory Development Fallback Store
 *
 * Automatically activated during local development (NODE_ENV !== 'production')
 * when a local PostgreSQL server on port 5432 is unreachable or offline.
 *
 * Provides instant, zero-configuration evaluation of all SaaS features:
 * - Pre-seeded Owner, Agent, and Customer accounts
 * - Realistic support tickets and status updates
 * - Knowledge base documents and semantic search simulation
 * - Organization settings and member management
 */

import { OrgRole, TicketPriority, TicketStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';

export function isDbUnavailableError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : '';
  return (
    name === 'PrismaClientInitializationError' ||
    msg.includes("Can't reach database server") ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('P1001')
  );
}

export interface DevUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: Date;
  role: OrgRole;
}

export interface DevOrg {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  createdAt: Date;
}

export interface DevTicket {
  id: string;
  organizationId: string;
  customerId: string;
  assignedAgentId?: string | null;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  customer?: { id: string; fullName: string; email: string };
  assignedAgent?: { id: string; fullName: string; email: string } | null;
}

export interface DevKbDocument {
  id: string;
  organizationId: string;
  title: string;
  filename: string;
  fileSizeBytes: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  createdAt: Date;
}

export interface DevComment {
  id: string;
  organizationId: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface DevChatMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  content: string;
  citations?: unknown;
  createdAt: Date;
}

export interface DevChatConversation {
  id: string;
  organizationId: string;
  customerId?: string | null;
  ticketId?: string | null;
  title: string;
  channel: string;
  createdAt: Date;
  updatedAt: Date;
  messages: DevChatMessage[];
}

class DevFallbackStore {
  public readonly defaultOrg: DevOrg = {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Alpha Technologies',
    slug: 'alpha-tech',
    domain: 'alpha.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  private comments: DevComment[] = [];

  private users: Map<string, DevUser> = new Map([
    [
      'owner@alpha.com',
      {
        id: '10000000-0000-4000-8000-000000000001',
        email: 'owner@alpha.com',
        fullName: 'Alice Owner',
        role: OrgRole.OWNER,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    [
      'agent@alpha.com',
      {
        id: '10000000-0000-4000-8000-000000000002',
        email: 'agent@alpha.com',
        fullName: 'Bob Agent',
        role: OrgRole.AGENT,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    [
      'customer@alpha.com',
      {
        id: '10000000-0000-4000-8000-000000000003',
        email: 'customer@alpha.com',
        fullName: 'Charlie Customer',
        role: OrgRole.CUSTOMER,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  ]);

  private tickets: Map<string, DevTicket> = new Map();
  private documents: Map<string, DevKbDocument> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed Sample Tickets
    const sampleTickets: DevTicket[] = [
      {
        id: '20000000-0000-4000-8000-000000000001',
        organizationId: this.defaultOrg.id,
        customerId: '10000000-0000-4000-8000-000000000003',
        assignedAgentId: '10000000-0000-4000-8000-000000000002',
        title: 'Payment gateway timeout during renewal',
        description: 'Our annual subscription renewal failed with a gateway 504 error on checkout.',
        category: 'Billing',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 3600000 * 4),
        updatedAt: new Date(Date.now() - 3600000 * 2),
        customer: { id: '10000000-0000-4000-8000-000000000003', fullName: 'Charlie Customer', email: 'customer@alpha.com' },
        assignedAgent: { id: '10000000-0000-4000-8000-000000000002', fullName: 'Bob Agent', email: 'agent@alpha.com' },
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        organizationId: this.defaultOrg.id,
        customerId: '10000000-0000-4000-8000-000000000003',
        assignedAgentId: '10000000-0000-4000-8000-000000000002',
        title: 'Request for CSV export on Analytics dashboard',
        description: 'Would love an option to export the daily token consumption ledger into CSV format.',
        category: 'Feature Request',
        priority: TicketPriority.LOW,
        status: TicketStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 3600000 * 24),
        updatedAt: new Date(Date.now() - 3600000 * 6),
        customer: { id: '10000000-0000-4000-8000-000000000003', fullName: 'Charlie Customer', email: 'customer@alpha.com' },
        assignedAgent: { id: '10000000-0000-4000-8000-000000000002', fullName: 'Bob Agent', email: 'agent@alpha.com' },
      },
      {
        id: '20000000-0000-4000-8000-000000000003',
        organizationId: this.defaultOrg.id,
        customerId: '10000000-0000-4000-8000-000000000003',
        assignedAgentId: null,
        title: 'SSO SAML authentication token validation issue',
        description: 'Users on the European VPN are experiencing repeated token expiration popups.',
        category: 'Security',
        priority: TicketPriority.URGENT,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 3600000 * 1),
        updatedAt: new Date(Date.now() - 3600000 * 1),
        customer: { id: '10000000-0000-4000-8000-000000000003', fullName: 'Charlie Customer', email: 'customer@alpha.com' },
        assignedAgent: null,
      },
      {
        id: '20000000-0000-4000-8000-000000000004',
        organizationId: this.defaultOrg.id,
        customerId: '10000000-0000-4000-8000-000000000003',
        assignedAgentId: '10000000-0000-4000-8000-000000000002',
        title: 'Inquiry regarding vector search similarity threshold',
        description: 'How do we adjust the cosine distance cutoff for knowledge base matching?',
        category: 'Support',
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.RESOLVED,
        createdAt: new Date(Date.now() - 3600000 * 72),
        updatedAt: new Date(Date.now() - 3600000 * 12),
        customer: { id: '10000000-0000-4000-8000-000000000003', fullName: 'Charlie Customer', email: 'customer@alpha.com' },
        assignedAgent: { id: '10000000-0000-4000-8000-000000000002', fullName: 'Bob Agent', email: 'agent@alpha.com' },
      },
    ];

    sampleTickets.forEach((t) => this.tickets.set(t.id, t));

    // Seed Sample Knowledge Documents
    const sampleDocs: DevKbDocument[] = [
      {
        id: 'd0000000-0000-4000-8000-000000000001',
        organizationId: this.defaultOrg.id,
        title: 'SupportPilot AI Operational Handbook.pdf',
        filename: 'supportpilot_operations_guide.pdf',
        fileSizeBytes: 245000,
        mimeType: 'application/pdf',
        status: 'COMPLETED',
        chunkCount: 16,
        createdAt: new Date('2026-02-15T00:00:00.000Z'),
      },
      {
        id: 'd0000000-0000-4000-8000-000000000002',
        organizationId: this.defaultOrg.id,
        title: 'Customer Refund and Cancellation Policy.txt',
        filename: 'refund_policy.txt',
        fileSizeBytes: 18400,
        mimeType: 'text/plain',
        status: 'COMPLETED',
        chunkCount: 6,
        createdAt: new Date('2026-02-20T00:00:00.000Z'),
      },
    ];

    sampleDocs.forEach((d) => this.documents.set(d.id, d));
  }

  public getOrCreateUser(email: string, fullName?: string): DevUser {
    const existing = this.users.get(email.toLowerCase());
    if (existing) return existing;

    const newUser: DevUser = {
      id: `u${Date.now().toString(16).padStart(32, '0')}`.slice(0, 36),
      email: email.toLowerCase(),
      fullName: fullName || email.split('@')[0],
      role: OrgRole.OWNER,
      createdAt: new Date(),
    };
    this.users.set(email.toLowerCase(), newUser);
    return newUser;
  }

  public findUserById(id: string): DevUser | undefined {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  public authenticate(email: string) {
    const user = this.getOrCreateUser(email);
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const { token: rawRefreshToken } = generateRefreshToken();

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      memberships: [
        {
          organizationId: this.defaultOrg.id,
          organizationName: this.defaultOrg.name,
          organizationSlug: this.defaultOrg.slug,
          role: user.role,
        },
      ],
      accessToken,
      rawRefreshToken,
    };
  }

  public getTickets(orgId: string, role?: OrgRole, customerId?: string): DevTicket[] {
    const all = Array.from(this.tickets.values()).filter((t) => t.organizationId === orgId);
    if (role === OrgRole.CUSTOMER && customerId) {
      return all.filter((t) => t.customerId === customerId);
    }
    return all;
  }

  public createTicket(
    orgId: string,
    customerId: string,
    data: { title: string; description: string; category?: string; priority?: TicketPriority }
  ): DevTicket {
    const id = randomUUID();
    const user = this.findUserById(customerId);
    const ticket: DevTicket = {
      id,
      organizationId: orgId,
      customerId,
      assignedAgentId: null,
      title: data.title,
      description: data.description,
      category: data.category || 'General',
      priority: data.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: user ? { id: user.id, fullName: user.fullName, email: user.email } : undefined,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  public updateTicket(
    ticketId: string,
    updates: { status?: TicketStatus; priority?: TicketPriority; assignedAgentId?: string | null }
  ): DevTicket | undefined {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    if (updates.status !== undefined) ticket.status = updates.status;
    if (updates.priority !== undefined) ticket.priority = updates.priority;
    if (updates.assignedAgentId !== undefined) {
      ticket.assignedAgentId = updates.assignedAgentId;
      if (updates.assignedAgentId) {
        const agent = this.findUserById(updates.assignedAgentId);
        if (agent) {
          ticket.assignedAgent = { id: agent.id, fullName: agent.fullName, email: agent.email };
        }
      } else {
        ticket.assignedAgent = null;
      }
    }
    ticket.updatedAt = new Date();
    return ticket;
  }

  public getDocuments(orgId: string): DevKbDocument[] {
    return Array.from(this.documents.values()).filter((d) => d.organizationId === orgId);
  }

  public addDocument(orgId: string, doc: Omit<DevKbDocument, 'id' | 'createdAt' | 'organizationId'>): DevKbDocument {
    const id = randomUUID();
    const newDoc: DevKbDocument = {
      ...doc,
      id,
      organizationId: orgId,
      createdAt: new Date(),
    };
    this.documents.set(id, newDoc);
    return newDoc;
  }

  public deleteDocument(docId: string): boolean {
    return this.documents.delete(docId);
  }

  public getComments(ticketId: string, isCustomer: boolean = false): DevComment[] {
    return this.comments.filter((c) => c.ticketId === ticketId && (!isCustomer || !c.isInternal));
  }

  public addComment(
    organizationId: string,
    ticketId: string,
    author: { id: string; fullName: string; email: string; avatarUrl?: string | null },
    content: string,
    isInternal: boolean
  ): DevComment {
    const newComment: DevComment = {
      id: randomUUID(),
      organizationId,
      ticketId,
      authorId: author.id,
      content,
      isInternal,
      createdAt: new Date(),
      author: {
        id: author.id,
        fullName: author.fullName,
        email: author.email,
        avatarUrl: author.avatarUrl,
      },
    };
    this.comments.push(newComment);
    return newComment;
  }

  public getTicket(id: string): DevTicket | undefined {
    return this.tickets.get(id);
  }

  private conversations: Map<string, DevChatConversation> = new Map([
    [
      '30000000-0000-4000-8000-000000000001',
      {
        id: '30000000-0000-4000-8000-000000000001',
        organizationId: this.defaultOrg.id,
        customerId: '10000000-0000-4000-8000-000000000003',
        ticketId: null,
        title: 'General Inquiries & AI Guidance',
        channel: 'PORTAL',
        createdAt: new Date(Date.now() - 3600000 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 5),
        messages: [
          {
            id: '40000000-0000-4000-8000-000000000001',
            conversationId: '30000000-0000-4000-8000-000000000001',
            organizationId: this.defaultOrg.id,
            senderType: 'BOT',
            content: 'Hello! Welcome to SupportPilot AI support. How can I assist you today?',
            createdAt: new Date(Date.now() - 3600000 * 5),
          },
        ],
      },
    ],
  ]);

  public getConversations(orgId: string, customerId?: string): DevChatConversation[] {
    const list = Array.from(this.conversations.values()).filter((c) => c.organizationId === orgId);
    if (customerId) return list.filter((c) => c.customerId === customerId);
    return list;
  }

  public getConversation(id: string): DevChatConversation | undefined {
    return this.conversations.get(id);
  }

  public createConversation(
    orgId: string,
    customerId?: string,
    title?: string,
    ticketId?: string
  ): DevChatConversation {
    const id = randomUUID();
    const conv: DevChatConversation = {
      id,
      organizationId: orgId,
      customerId,
      ticketId: ticketId || null,
      title: title || 'New Support Conversation',
      channel: 'PORTAL',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    };
    this.conversations.set(id, conv);
    return conv;
  }

  public addChatMessage(
    conversationId: string,
    orgId: string,
    senderType: 'CUSTOMER' | 'AGENT' | 'BOT',
    content: string,
    citations?: unknown
  ): DevChatMessage {
    const conv = this.conversations.get(conversationId);
    const msgId = randomUUID();
    const msg: DevChatMessage = {
      id: msgId,
      conversationId,
      organizationId: orgId,
      senderType,
      content,
      citations,
      createdAt: new Date(),
    };
    if (conv) {
      conv.messages.push(msg);
      conv.updatedAt = new Date();
    }
    return msg;
  }
}

export const devFallbackStore = new DevFallbackStore();
