import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App.js';

describe('App & Authentication Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
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
                user: {
                  id: 'usr_test_1',
                  email: 'sarah@acme.com',
                  fullName: 'Sarah Connor',
                },
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

        if (url.includes('/health')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                status: 'UP',
                timestamp: new Date().toISOString(),
                uptimeSeconds: 120,
                environment: 'test',
                services: {
                  database: { status: 'CONNECTED', latencyMs: 2 },
                  memory: { rssMb: 45, heapUsedMb: 20, heapTotalMb: 30 },
                },
              },
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });
      })
    );
  });

  it('renders Landing page and navigates to AuthGateway when unauthenticated', async () => {
    render(<App />);

    expect(await screen.findByText(/SupportPilot AI 2\.0/i)).toBeInTheDocument();
    expect(screen.getAllByText('SupportPilot').length).toBeGreaterThan(0);
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();

    const signInBtns = screen.getAllByRole('button', { name: /^sign in$/i });
    fireEvent.click(signInBtns[0]);

    expect(await screen.findByText('Sign In to Workspace')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByText('Instant Evaluation Demo Profiles:')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('renders application shell and organization dashboard when authenticated', async () => {
    localStorage.setItem('sp_access_token', 'mock_valid_token');
    localStorage.setItem('sp_active_org_id', 'org_acme_1');

    render(<App />);

    // Brand and Organization
    const orgLabels = await screen.findAllByText('Acme Corp');
    expect(orgLabels.length).toBeGreaterThan(0);
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getAllByText('OWNER').length).toBeGreaterThan(0);

    // Navigation links
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Support Tickets')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('RAG Assistant')).toBeInTheDocument();
    expect(screen.getByText('Health & System')).toBeInTheDocument();

    // Overview section
    expect(screen.getByText('System Overview & Control Center')).toBeInTheDocument();
  });
});
