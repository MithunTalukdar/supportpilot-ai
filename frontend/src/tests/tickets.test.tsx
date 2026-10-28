import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketWorkspace } from '../components/tickets/TicketWorkspace.js';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal.js';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer.js';
import { AuthProvider } from '../context/AuthContext.js';

const mockTickets = [
  {
    id: 'ticket-1',
    organizationId: 'org_acme_1',
    ticketNumber: 1001,
    title: 'Cannot access invoice dashboard',
    description: 'When clicking invoices, 404 error appears.',
    category: 'Billing',
    priority: 'HIGH',
    status: 'OPEN',
    customerId: 'cust_1',
    tags: ['invoice', 'billing'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: {
      id: 'cust_1',
      fullName: 'Alice Customer',
      email: 'alice@client.com',
    },
    assignedAgent: null,
    commentCount: 2,
  },
];

const mockMetrics = {
  totalTickets: 1,
  openTickets: 1,
  resolvedTickets: 0,
  avgResolutionMinutes: 0,
  statusBreakdown: {
    OPEN: 1,
    IN_PROGRESS: 0,
    WAITING_FOR_CUSTOMER: 0,
    RESOLVED: 0,
    CLOSED: 0,
  },
  priorityBreakdown: {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 1,
    URGENT: 0,
  },
};

const mockComments = [
  {
    id: 'comm-1',
    ticketId: 'ticket-1',
    authorId: 'cust_1',
    content: 'Please help promptly, need this for accounting.',
    isInternal: false,
    createdAt: new Date().toISOString(),
    author: {
      id: 'cust_1',
      fullName: 'Alice Customer',
      email: 'alice@client.com',
    },
  },
  {
    id: 'comm-2',
    ticketId: 'ticket-1',
    authorId: 'agent_1',
    content: 'Reviewing customer billing ledger internally before responding.',
    isInternal: true,
    createdAt: new Date().toISOString(),
    author: {
      id: 'agent_1',
      fullName: 'Bob Agent',
      email: 'bob@acme.com',
    },
  },
];

describe('Phase 3 Support Ticket UI Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sp_access_token', 'mock_token');
    localStorage.setItem('sp_active_org_id', 'org_acme_1');
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                user: { id: 'usr_owner', email: 'owner@acme.com', fullName: 'Sarah Owner' },
                memberships: [
                  {
                    organizationId: 'org_acme_1',
                    organizationName: 'Acme Corp',
                    organizationSlug: 'acme',
                    role: 'OWNER',
                  },
                ],
              },
            }),
          });
        }

        if (url.includes('/tickets/metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockMetrics,
            }),
          });
        }

        if (url.includes('/tickets/ticket-1/comments')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: mockComments,
            }),
          });
        }

        if (url.includes('/tickets/ticket-1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                ...mockTickets[0],
                comments: mockComments,
              },
            }),
          });
        }

        if (url.includes('/members')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [
                { id: 'usr_owner', fullName: 'Sarah Owner', email: 'owner@acme.com', role: 'OWNER' },
                { id: 'agent_1', fullName: 'Bob Agent', email: 'bob@acme.com', role: 'AGENT' },
              ],
            }),
          });
        }

        if (url.includes('/tickets')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: mockTickets,
              meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        });
      })
    );
  });

  it('renders TicketWorkspace with tickets table and staff metrics', async () => {
    render(
      <AuthProvider>
        <TicketWorkspace />
      </AuthProvider>
    );

    // Verify workspace title
    expect(await screen.findByText('Support Tickets')).toBeInTheDocument();

    // Verify metrics bar
    expect(await screen.findByText('Total Tickets')).toBeInTheDocument();
    expect(screen.getByText('Open Tickets')).toBeInTheDocument();

    // Verify ticket item rendered
    expect(await screen.findByText('#SP-1001')).toBeInTheDocument();
    expect(screen.getByText('Cannot access invoice dashboard')).toBeInTheDocument();
    expect(screen.getByText('Alice Customer')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('validates required fields in CreateTicketModal', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <AuthProvider>
        <CreateTicketModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </AuthProvider>
    );

    expect(await screen.findByText('Submit Support Ticket')).toBeInTheDocument();

    // Click submit without filling form
    fireEvent.click(screen.getByRole('button', { name: /create ticket/i }));

    // Expect validation errors
    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('renders TicketDetailDrawer with conversation and internal note warning', async () => {
    render(
      <AuthProvider>
        <TicketDetailDrawer ticketId="ticket-1" onClose={vi.fn()} />
      </AuthProvider>
    );

    // Ticket header
    expect(await screen.findByText('#SP-1001')).toBeInTheDocument();
    expect(screen.getByText('Cannot access invoice dashboard')).toBeInTheDocument();

    // Initial message
    expect(screen.getByText('When clicking invoices, 404 error appears.')).toBeInTheDocument();

    // Public comment
    expect(
      screen.getByText('Please help promptly, need this for accounting.')
    ).toBeInTheDocument();

    // Internal note comment and badge
    expect(
      screen.getByText('Reviewing customer billing ledger internally before responding.')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Internal Note').length).toBeGreaterThan(0);

    // Staff toggle between public and internal
    expect(screen.getByText('Public Customer Reply')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /internal note/i })).toBeInTheDocument();
  });

  it('allows staff to switch to internal note mode in reply box', async () => {
    render(
      <AuthProvider>
        <TicketDetailDrawer ticketId="ticket-1" onClose={vi.fn()} />
      </AuthProvider>
    );

    await screen.findByText('#SP-1001');

    const internalNoteBtn = screen.getByRole('button', { name: /internal note/i });
    fireEvent.click(internalNoteBtn);

    // Reply button should now say "Add Internal Note"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add internal note/i })).toBeInTheDocument();
    });
  });
});
