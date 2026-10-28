import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LandingPage } from '../components/landing/LandingPage.js';
import { AuthGateway } from '../components/auth/AuthGateway.js';
import { OrgOnboarding } from '../components/org/OrgOnboarding.js';
import { RoleAwareDashboard } from '../components/dashboard/RoleAwareDashboard.js';
import { AnalyticsWorkspace } from '../components/analytics/AnalyticsWorkspace.js';
import { OrgSettingsWorkspace } from '../components/settings/OrgSettingsWorkspace.js';
import { UserProfileModal } from '../components/profile/UserProfileModal.js';
import { NotFoundView } from '../components/common/NotFoundView.js';
import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import { AuthProvider } from '../context/AuthContext.js';

// Setup common mock wrapper
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

describe('Phase 6 — Comprehensive SaaS Interface & Workflow Tests', () => {
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
                user: { id: 'usr_owner_1', email: 'owner@alpha.com', fullName: 'Alice Owner' },
                memberships: [
                  {
                    organizationId: 'org_123',
                    organizationName: 'Alpha Logistics',
                    organizationSlug: 'alpha-logistics',
                    role: 'OWNER',
                  },
                ],
              },
            }),
          });
        }

        if (url.includes('/ai/usage')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                records: [
                  {
                    id: 'ledger_1',
                    feature: 'rag_chat',
                    model: 'gpt-4o-mini',
                    inputTokens: 120,
                    outputTokens: 80,
                    totalTokens: 200,
                    estimatedCostUsd: 0.00015,
                    latencyMs: 340,
                    status: 'SUCCESS',
                    createdAt: new Date().toISOString(),
                  },
                ],
                summary: {
                  totalRequests: 142,
                  totalTokens: 58200,
                  totalEstimatedCostUsd: 0.0873,
                  averageLatencyMs: 310,
                },
                meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
              },
            }),
          });
        }

        if (url.includes('/ai/settings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                aiMonthlySpendLimitUsd: 75.0,
                ragConfidenceThreshold: 0.7,
                maxRetrievalCount: 5,
              },
            }),
          });
        }

        if (url.includes('/tickets/metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                totalTickets: 12,
                openTickets: 5,
                inProgressTickets: 3,
                waitingForCustomerTickets: 2,
                resolvedTickets: 2,
                urgentTickets: 1,
                highTickets: 3,
                mediumTickets: 6,
                lowTickets: 2,
              },
            }),
          });
        }

        if (url.includes('/tickets')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                items: [
                  {
                    id: 'tkt_1',
                    ticketNumber: 101,
                    subject: 'Delivery delayed past SLA window',
                    description: 'Shipment has not arrived on scheduled date.',
                    status: 'OPEN',
                    priority: 'HIGH',
                    category: 'Billing',
                    customerId: 'usr_cust_1',
                    assignedAgentId: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
              },
            }),
          });
        }

        if (url.includes('/documents')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                items: [],
                meta: { page: 1, limit: 10, total: 8, totalPages: 1 },
              },
            }),
          });
        }

        if (url.includes('/members')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [
                {
                  membershipId: 'mem_1',
                  userId: 'usr_owner_1',
                  email: 'owner@alpha.com',
                  fullName: 'Alice Owner',
                  role: 'OWNER',
                  joinedAt: new Date().toISOString(),
                },
              ],
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

  // 1. Landing Page & Working Interactive Demo
  it('renders landing page with features and functional RAG interactive demo sandbox', async () => {
    const handleGetStarted = vi.fn();
    const handleSignIn = vi.fn();
    const handleExploreDemoRole = vi.fn();

    render(
      <ThemeProvider>
        <LandingPage
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
          onExploreDemoRole={handleExploreDemoRole}
        />
      </ThemeProvider>
    );

    // Verify Brand, Navigation, and Hero
    expect(screen.getAllByText('SupportPilot').length).toBeGreaterThan(0);
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Interactive Demo')).toBeInTheDocument();
    expect(screen.getByText('Security Architecture')).toBeInTheDocument();
    expect(screen.getByText('Role Portals')).toBeInTheDocument();

    // Verify Interactive Demo Sandbox
    const runBtn = screen.getByRole('button', { name: /synthesize answer/i });
    expect(runBtn).toBeInTheDocument();

    fireEvent.click(runBtn);

    // Verified citation and answer appear after query execution
    await waitFor(() => {
      expect(screen.getByText(/Based on our Refund Policy Guide/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Refund Policy Guide 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/94% Match/i)).toBeInTheDocument();

    // Test Role preset button
    const demoOwnerBtn = screen.getByRole('button', { name: /^demo as owner$/i });
    fireEvent.click(demoOwnerBtn);
    expect(handleExploreDemoRole).toHaveBeenCalledWith('OWNER');
  });

  // 2. Auth Gateway: Register, Login, Recovery & Demo Presets
  it('supports registration with password requirements, login, account recovery, and demo presets', async () => {
    renderWithProviders(<AuthGateway />);

    // Default mode is login
    expect(screen.getByText('Sign In to Workspace')).toBeInTheDocument();

    // Test Preset Autofill
    const agentPresetBtn = screen.getByRole('button', { name: /^agent$/i });
    fireEvent.click(agentPresetBtn);
    expect(screen.getByDisplayValue('agent@alpha.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DemoPassword123!')).toBeInTheDocument();

    // Switch to Create Account tab
    const signUpTab = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(signUpTab);

    // Verify registration requirements checklist
    expect(screen.getByText(/8\+ chars/i)).toBeInTheDocument();
    expect(screen.getByText(/1 uppercase/i)).toBeInTheDocument();
    expect(screen.getByText(/1 number/i)).toBeInTheDocument();

    // Switch to Account Recovery tab
    const recoveryTab = screen.getByRole('button', { name: /recovery/i });
    fireEvent.click(recoveryTab);

    expect(screen.getByText('Send Recovery Instructions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  // 3. Organization Onboarding Wizard
  it('renders organization onboarding wizard with auto-generating slug', () => {
    const handleComplete = vi.fn();
    renderWithProviders(<OrgOnboarding onComplete={handleComplete} />);

    expect(screen.getByText('Set Up Your Organization Workspace')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('e.g. Acme Corporation');
    fireEvent.change(nameInput, { target: { value: 'Delta Technologies' } });

    // Auto slug verification
    expect(screen.getByDisplayValue('delta-technologies')).toBeInTheDocument();
  });

  // 4. Role-Aware Dashboard
  it('renders role-aware executive dashboard with real metrics', async () => {
    localStorage.setItem('sp_access_token', 'mock_token');
    localStorage.setItem('sp_active_org_id', 'org_123');

    const handleNavigate = vi.fn();

    renderWithProviders(<RoleAwareDashboard onNavigate={handleNavigate} />);

    // Wait for metrics to load asynchronously
    expect(await screen.findByText(/Alpha Logistics/i)).toBeInTheDocument();
    expect(await screen.findByText('Total Active Tickets')).toBeInTheDocument();
    expect(screen.getByText('Urgent & High Attention')).toBeInTheDocument();
    expect(screen.getByText('Indexed Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('Monthly AI Spend')).toBeInTheDocument();
    expect(screen.getByText('Review Ticket Queues')).toBeInTheDocument();
  });

  // 5. Analytics & AI Usage Reports Workspace
  it('renders telemetry analytics workspace with live ledger and spending caps', async () => {
    localStorage.setItem('sp_access_token', 'mock_token');
    localStorage.setItem('sp_active_org_id', 'org_123');

    renderWithProviders(<AnalyticsWorkspace />);

    expect(await screen.findByText('Total Invocations')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens Consumed')).toBeInTheDocument();
    expect(screen.getByText('Audit Ledger')).toBeInTheDocument();
    expect(screen.getByText('All Features')).toBeInTheDocument();
  });

  // 6. Organization Settings & Member Management
  it('renders organization settings and team tabs with AI spend caps', async () => {
    localStorage.setItem('sp_access_token', 'mock_token');
    localStorage.setItem('sp_active_org_id', 'org_123');

    renderWithProviders(<OrgSettingsWorkspace />);

    expect(await screen.findByText('Active Organization Profile')).toBeInTheDocument();

    // Switch to AI & Copilot Limits tab
    const aiTab = screen.getByRole('button', { name: /ai & copilot limits/i });
    fireEvent.click(aiTab);

    expect(await screen.findByText('AI & Copilot Guardrails')).toBeInTheDocument();
    expect(screen.getByText(/Monthly AI Spending Limit/i)).toBeInTheDocument();
  });

  // 7. User Profile Modal
  it('renders user profile and security modal with tabs', () => {
    const handleClose = vi.fn();
    renderWithProviders(<UserProfileModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('Profile Info')).toBeInTheDocument();
    expect(screen.getByText('Password & Security')).toBeInTheDocument();
    expect(screen.getByText(/Organizations/i)).toBeInTheDocument();
    expect(screen.getByText('Save Profile Changes')).toBeInTheDocument();
  });

  // 8. 404 Not-Found View
  it('renders clean 404 not found page with navigation buttons', () => {
    const handleHome = vi.fn();
    render(
      <NotFoundView
        onNavigateHome={handleHome}
        title="Custom Resource Missing"
        message="The requested workspace or ticket is unavailable."
      />
    );

    expect(screen.getByText('HTTP 404 • Missing Resource')).toBeInTheDocument();
    expect(screen.getByText('Custom Resource Missing')).toBeInTheDocument();

    const returnBtn = screen.getByRole('button', { name: /return to dashboard/i });
    fireEvent.click(returnBtn);
    expect(handleHome).toHaveBeenCalledWith('dashboard');
  });

  // 9. Error Boundary Global Fallback
  it('catches render errors and displays recovery UI', () => {
    const BrokenComponent = () => {
      throw new Error('Simulated UI crash for testing');
    };

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Simulated UI crash for testing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload component/i })).toBeInTheDocument();
  });
});
