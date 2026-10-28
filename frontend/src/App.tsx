import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthGateway } from './components/auth/AuthGateway.js';
import { OrgOnboarding } from './components/org/OrgOnboarding.js';
import { AppShell } from './components/layout/AppShell.js';
import { RoleAwareDashboard } from './components/dashboard/RoleAwareDashboard.js';
import { TicketWorkspace } from './components/tickets/TicketWorkspace.js';
import { KnowledgeBaseWorkspace } from './components/kb/KnowledgeBaseWorkspace.js';
import { ChatWorkspace } from './components/chat/ChatWorkspace.js';
import { AnalyticsWorkspace } from './components/analytics/AnalyticsWorkspace.js';
import { OrgSettingsWorkspace } from './components/settings/OrgSettingsWorkspace.js';
import { HealthStatusCard } from './components/common/HealthStatusCard.js';
import { NotFoundView } from './components/common/NotFoundView.js';
import { UserProfileModal } from './components/profile/UserProfileModal.js';
import { CreateOrgModal } from './components/org/CreateOrgModal.js';
import { AlertBanner } from './components/ui/AlertBanner.js';
import { LoadingSpinner } from './components/ui/LoadingSpinner.js';
import { Button } from './components/ui/Button.js';
import { ViewSection } from './types/index.js';
import { RotateCcw, AlertTriangle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, activeOrg, role, memberships, refreshProfile } = useAuth();

  // Navigation & View State
  const [authView, setAuthView] = useState<'landing' | 'auth'>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'recover'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<'OWNER' | 'AGENT' | 'CUSTOMER' | undefined>(undefined);

  const [currentSection, setCurrentSection] = useState<ViewSection>('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState<boolean>(false);

  // Demo feedback simulation states
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [showDemoError, setShowDemoError] = useState<boolean>(false);

  const triggerSimulatedLoad = () => {
    setIsDemoLoading(true);
    setTimeout(() => setIsDemoLoading(false), 1200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-darkest gap-3 font-sans">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-400 font-medium">Verifying session credentials and tenant authorization...</p>
      </div>
    );
  }

  // Unauthenticated State: Landing Page or Auth Gateway
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => {
            setAuthInitialMode('register');
            setAuthInitialRole(undefined);
            setAuthView('auth');
          }}
          onSignIn={() => {
            setAuthInitialMode('login');
            setAuthInitialRole(undefined);
            setAuthView('auth');
          }}
          onExploreDemoRole={(targetRole) => {
            setAuthInitialMode('login');
            setAuthInitialRole(targetRole);
            setAuthView('auth');
          }}
        />
      );
    }

    return (
      <AuthGateway
        initialMode={authInitialMode}
        initialRole={authInitialRole}
        onBackToLanding={() => setAuthView('landing')}
      />
    );
  }

  // Authenticated State but No Organizations: Wizard Onboarding
  if (!activeOrg && memberships.length === 0) {
    return <OrgOnboarding onComplete={() => refreshProfile()} />;
  }

  const getSectionMetadata = (section: ViewSection) => {
    switch (section) {
      case 'dashboard':
        return {
          title: 'System Overview & Control Center',
          subtitle: `Active organization: ${activeOrg?.organizationName || 'None'} • Authorized Role: ${role || 'None'}`,
        };
      case 'tickets':
        return {
          title: role === 'CUSTOMER' ? 'My Support Requests' : 'Customer Support Ticket Workspace',
          subtitle: 'Multi-tenant ticket routing, SLA priority queues, and customer conversation threads',
        };
      case 'kb':
        return {
          title: 'Knowledge Base & Ingestion Pipeline',
          subtitle: 'Document processing, semantic chunking, and pgvector embeddings status',
        };
      case 'chat':
        return {
          title: role === 'CUSTOMER' ? '24/7 AI Support Assistant' : 'RAG Copilot & Knowledge Dispatch',
          subtitle: 'Grounded question answering with verified document citations and confidence thresholds',
        };
      case 'analytics':
        return {
          title: 'Telemetry Analytics & AI Cost Ledger',
          subtitle: 'Real token usage metrics, latency tracking, and organization monthly spend limits',
        };
      case 'settings':
        return {
          title: 'Organization Settings & Team Roles',
          subtitle: 'Manage organization membership, AI spend caps, RAG confidence parameters, and security policies',
        };
      case 'health':
        return {
          title: 'System Diagnostics & Health Probes',
          subtitle: 'Process uptime, database connectivity probe, and memory metrics',
        };
      default:
        return {
          title: 'Resource Center',
          subtitle: 'Multi-tenant enterprise support automation',
        };
    }
  };

  const meta = getSectionMetadata(currentSection);

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <RoleAwareDashboard
            onNavigate={(sec) => setCurrentSection(sec)}
            onOpenCreateTicket={() => setCurrentSection('tickets')}
          />
        );
      case 'tickets':
        return <TicketWorkspace />;
      case 'kb':
        return <KnowledgeBaseWorkspace />;
      case 'chat':
        return <ChatWorkspace />;
      case 'analytics':
        return <AnalyticsWorkspace />;
      case 'settings':
        return <OrgSettingsWorkspace />;
      case 'health':
        return <HealthStatusCard />;
      default:
        return (
          <NotFoundView
            onNavigateHome={(sec) => setCurrentSection(sec)}
            title="Section Not Found"
            message={`The view '${currentSection}' could not be located or you may not possess sufficient permissions to access it.`}
          />
        );
    }
  };

  return (
    <AppShell
      currentSection={currentSection}
      onSelectSection={setCurrentSection}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
      onCreateOrgClick={() => setIsCreateOrgOpen(true)}
      onProfileClick={() => setIsProfileOpen(true)}
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={triggerSimulatedLoad}
            isLoading={isDemoLoading}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Simulate Load
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDemoError((prev) => !prev)}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          >
            {showDemoError ? 'Clear Demo Alert' : 'Trigger Demo Alert'}
          </Button>
        </div>
      }
    >
      {/* Dialog Modals */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <CreateOrgModal isOpen={isCreateOrgOpen} onClose={() => setIsCreateOrgOpen(false)} />

      {/* Simulated Interactive Error Banner */}
      {showDemoError && (
        <AlertBanner
          type="error"
          title="Centralized Error Notification System"
          message="This banner verifies the centralized alert and error presentation system for handling network, API, or validation anomalies across the app."
          onDismiss={() => setShowDemoError(false)}
          action={{
            label: 'Dismiss Alert',
            onClick: () => setShowDemoError(false),
          }}
        />
      )}

      {/* Simulated Loading State Card */}
      {isDemoLoading && (
        <div className="p-8 rounded-2xl glass-card flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" label="Simulating asynchronous resource fetch..." />
          <p className="text-xs text-slate-500">Demonstrating loading spinner and skeleton state transitions</p>
        </div>
      )}

      {/* Active Section Content */}
      {renderSectionContent()}
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
