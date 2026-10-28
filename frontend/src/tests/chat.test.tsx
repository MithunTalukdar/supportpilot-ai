import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWorkspace } from '../components/chat/ChatWorkspace.js';
import { CitationModal } from '../components/chat/CitationModal.js';
import { AuthProvider } from '../context/AuthContext.js';

const mockConversations = [
  {
    id: 'conv-1',
    organizationId: 'org_acme_1',
    customerId: 'usr_customer',
    ticketId: null,
    title: 'Refund Policy Question',
    channel: 'PORTAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessage: {
      id: 'msg-bot-1',
      content: 'Based on our Refund Policy Guide, refunds are 30 days [1].',
      senderType: 'BOT',
      createdAt: new Date().toISOString(),
    },
  },
];

const mockConversationDetail = {
  id: 'conv-1',
  organizationId: 'org_acme_1',
  customerId: 'usr_customer',
  ticketId: null,
  title: 'Refund Policy Question',
  channel: 'PORTAL',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: 'msg-user-1',
      conversationId: 'conv-1',
      organizationId: 'org_acme_1',
      senderType: 'CUSTOMER',
      content: 'What is your refund policy window?',
      citations: null,
      tokenMetrics: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'msg-bot-1',
      conversationId: 'conv-1',
      organizationId: 'org_acme_1',
      senderType: 'BOT',
      content: 'Based on our Refund Policy Guide, standard refunds are processed within 30 days [1].',
      citations: [
        {
          index: 1,
          documentId: 'doc-123',
          documentTitle: 'Refund Policy Guide',
          chunkIndex: 0,
          snippet: 'SupportPilot standard refund window is strictly 30 days from purchase date.',
          similarity: 0.89,
        },
      ],
      tokenMetrics: {
        promptTokens: 45,
        completionTokens: 25,
        totalTokens: 70,
        latencyMs: 140,
      },
      createdAt: new Date().toISOString(),
    },
  ],
};

describe('Phase 5 — AI Chat Assistant UI Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sp_access_token', 'mock_token');
    localStorage.setItem('sp_active_org_id', 'org_acme_1');
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                user: { id: 'usr_customer', email: 'customer@acme.com', fullName: 'Alice Customer' },
                memberships: [
                  {
                    organizationId: 'org_acme_1',
                    organizationName: 'Acme Corp',
                    organizationSlug: 'acme',
                    role: 'CUSTOMER',
                  },
                ],
              },
            }),
          });
        }

        // List conversations
        if (url.endsWith('/chat') || url.includes('/chat?')) {
          if (options?.method === 'POST') {
            return Promise.resolve({
              ok: true,
              status: 201,
              json: async () => ({
                success: true,
                data: {
                  id: 'conv-new-2',
                  organizationId: 'org_acme_1',
                  customerId: 'usr_customer',
                  title: 'New Support Conversation',
                  channel: 'PORTAL',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  messages: [],
                },
              }),
            });
          }

          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: mockConversations,
              pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
            }),
          });
        }

        // Send message
        if (url.includes('/messages') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                userMessage: {
                  id: 'msg-user-2',
                  conversationId: 'conv-1',
                  organizationId: 'org_acme_1',
                  senderType: 'CUSTOMER',
                  content: 'How do I cancel my subscription?',
                  citations: null,
                  tokenMetrics: null,
                  createdAt: new Date().toISOString(),
                },
                botMessage: {
                  id: 'msg-bot-2',
                  conversationId: 'conv-1',
                  organizationId: 'org_acme_1',
                  senderType: 'BOT',
                  content: 'Based on our Subscription Guidelines, you can cancel at any time under Settings [1].',
                  citations: [
                    {
                      index: 1,
                      documentId: 'doc-456',
                      documentTitle: 'Subscription Guidelines',
                      chunkIndex: 1,
                      snippet: 'Subscriptions may be cancelled directly from the Account Settings panel.',
                      similarity: 0.92,
                    },
                  ],
                  tokenMetrics: {
                    promptTokens: 50,
                    completionTokens: 30,
                    totalTokens: 80,
                    latencyMs: 160,
                  },
                  createdAt: new Date().toISOString(),
                },
              },
            }),
          });
        }

        // Get single conversation
        if (url.includes('/chat/conv-1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: mockConversationDetail,
            }),
          });
        }

        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ success: false, error: { message: 'Not found' } }),
        });
      })
    );
  });

  it('renders conversation thread list and displays active messages with grounded citations', async () => {
    render(
      <AuthProvider>
        <ChatWorkspace />
      </AuthProvider>
    );

    // Verify conversation item in left pane
    await waitFor(() => {
      expect(screen.getByText('Refund Policy Question')).toBeInTheDocument();
    });

    // Verify messages in thread
    await waitFor(() => {
      expect(screen.getByText('What is your refund policy window?')).toBeInTheDocument();
      expect(
        screen.getByText(/Based on our Refund Policy Guide, standard refunds are processed within 30 days/)
      ).toBeInTheDocument();
    });

    // Verify citation pill exists
    expect(screen.getByText('Refund Policy Guide')).toBeInTheDocument();
    expect(screen.getByText('89%')).toBeInTheDocument();
  });

  it('opens citation inspection modal when a citation badge is clicked', async () => {
    render(
      <AuthProvider>
        <ChatWorkspace />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Refund Policy Guide')).toBeInTheDocument();
    });

    const citationBtn = screen.getByText('Refund Policy Guide');
    fireEvent.click(citationBtn);

    // Verify modal appears
    await waitFor(() => {
      expect(screen.getByText('Source Document Citation [1]')).toBeInTheDocument();
      expect(screen.getByText(/SupportPilot standard refund window is strictly 30 days/)).toBeInTheDocument();
      expect(screen.getAllByText('89%').length).toBeGreaterThan(0);
    });

    // Close citation modal
    const closeBtn = screen.getByText('Close Citation');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Source Document Citation [1]')).not.toBeInTheDocument();
    });
  });

  it('sends a user question and updates thread with grounded bot answer and citation badge', async () => {
    render(
      <AuthProvider>
        <ChatWorkspace />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Refund Policy Question')).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('What is your refund policy window?')).toBeInTheDocument();
    }, { timeout: 3000 });

    const input = screen.getByPlaceholderText(/Ask a support question.../i);
    fireEvent.change(input, { target: { value: 'How do I cancel my subscription?' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('How do I cancel my subscription?')).toBeInTheDocument();
      expect(
        screen.getAllByText(/Based on our Subscription Guidelines, you can cancel at any time/).length
      ).toBeGreaterThan(0);
    });

    // New citation pill rendered
    expect(screen.getAllByText('Subscription Guidelines').length).toBeGreaterThan(0);
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
  });

  it('renders CitationModal directly with correct similarity and snippet data', () => {
    const citation = {
      index: 1,
      documentId: 'doc-789',
      documentTitle: 'SLA Policy 2026',
      chunkIndex: 2,
      snippet: 'Urgent priority tickets receive a 1-hour first response SLA.',
      similarity: 0.95,
    };

    const onClose = vi.fn();
    render(<CitationModal citation={citation} onClose={onClose} />);

    expect(screen.getByText('Source Document Citation [1]')).toBeInTheDocument();
    expect(screen.getByText('SLA Policy 2026')).toBeInTheDocument();
    expect(screen.getByText('Chunk #2')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText(/Urgent priority tickets receive a 1-hour first response SLA/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close Citation/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
