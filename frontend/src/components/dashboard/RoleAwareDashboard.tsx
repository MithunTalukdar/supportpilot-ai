import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  BookOpen,
  BotMessageSquare,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ViewSection } from '../../types/index.js';
import { TicketItem, TicketMetrics } from '../../types/ticket.js';
import { AiUsageSummary } from '../../types/ai.js';
import { listTicketsApi, getTicketMetricsApi } from '../../services/ticket.api.js';
import { listDocumentsApi } from '../../services/kb.api.js';
import { getAiUsageLedgerApi } from '../../services/ai-assist.api.js';
import { listMembersApi } from '../../services/auth.api.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { TicketStatusBadge, TicketPriorityBadge } from '../tickets/TicketStatusBadge.js';

interface RoleAwareDashboardProps {
  onNavigate: (section: ViewSection) => void;
  onOpenCreateTicket?: () => void;
}

export const RoleAwareDashboard: React.FC<RoleAwareDashboardProps> = ({
  onNavigate,
  onOpenCreateTicket,
}) => {
  const { accessToken, activeOrg, role, user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Real API metrics
  const [ticketMetrics, setTicketMetrics] = useState<TicketMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketItem[]>([]);
  const [docCount, setDocCount] = useState<number>(0);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [aiSummary, setAiSummary] = useState<AiUsageSummary | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch tickets & metrics
      const [ticketsRes, metricsRes] = await Promise.all([
        listTicketsApi(accessToken, activeOrg.organizationId, { limit: 5 }).catch(() => null),
        getTicketMetricsApi(accessToken, activeOrg.organizationId).catch(() => null),
      ]);

      const items = ticketsRes && typeof ticketsRes === 'object' && 'items' in ticketsRes && Array.isArray((ticketsRes as { items: TicketItem[] }).items)
        ? (ticketsRes as { items: TicketItem[] }).items
        : Array.isArray(ticketsRes)
        ? (ticketsRes as TicketItem[])
        : [];
      setRecentTickets(items);
      setTicketMetrics(metricsRes);

      // 2. Fetch KB documents count for staff
      if (role === 'OWNER' || role === 'AGENT') {
        const docsRes = await listDocumentsApi(accessToken, activeOrg.organizationId, { limit: 1 }).catch(() => null);
        if (docsRes?.meta?.total != null) setDocCount(docsRes.meta.total);

        // 3. Fetch team members count for staff
        const members = await listMembersApi(accessToken, activeOrg.organizationId).catch(() => []);
        setMemberCount(Array.isArray(members) ? members.length : 0);

        // 4. Fetch real AI ledger metrics
        const aiLedger = await getAiUsageLedgerApi(accessToken, activeOrg.organizationId, { limit: 1 }).catch(() => null);
        if (aiLedger?.summary) setAiSummary(aiLedger.summary);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeOrg, role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-xs text-slate-400">Loading live organization telemetry...</span>
      </div>
    );
  }

  const isOwner = role === 'OWNER';
  const isAgent = role === 'AGENT';
  const isCustomer = role === 'CUSTOMER';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Role Banner */}
      <div className="p-6 rounded-2xl glass-card border border-white/5 bg-gradient-to-r from-brand-950/30 via-slate-900/60 to-indigo-950/20 shadow-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Welcome back, {user?.fullName || 'User'}
            </h1>
            <Badge variant="brand" size="sm">
              {role || 'MEMBER'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active Workspace:{' '}
            <strong className="text-slate-200">{activeOrg?.organizationName || 'No Organization'}</strong>{' '}
            ({activeOrg?.organizationSlug || 'slug'})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Metrics
          </Button>
          {isCustomer && (
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenCreateTicket}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Submit Ticket
            </Button>
          )}
          {isOwner && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('settings')}
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              Manage Team
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================= */}
      {/* 1. ORGANIZATION OWNER DASHBOARD                         */}
      {/* ======================================================= */}
      {isOwner && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Active Tickets</span>
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {ticketMetrics?.totalTickets ?? (recentTickets?.length || 0)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Open / In Progress:</span>
                  <span className="text-brand-300 font-semibold">
                    {(ticketMetrics?.openTickets || 0) + (ticketMetrics?.statusBreakdown?.IN_PROGRESS || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Urgent & High Attention</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {(ticketMetrics?.priorityBreakdown?.URGENT || 0) + (ticketMetrics?.priorityBreakdown?.HIGH || 0)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Waiting for Customer:</span>
                  <span className="text-slate-300 font-semibold">
                    {ticketMetrics?.statusBreakdown?.WAITING_FOR_CUSTOMER || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Indexed Knowledge Base</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{docCount}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>pgvector partition:</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Monthly AI Spend</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  ${(aiSummary?.totalEstimatedCostUsd || 0).toFixed(4)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>AI Requests Metered:</span>
                  <span className="text-slate-200 font-semibold">{aiSummary?.totalRequests || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate('tickets')}
              className="p-4 rounded-xl glass-card border border-white/5 hover:border-brand-500/30 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/15 text-brand-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Review Ticket Queues</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Manage SLA and agent assignment</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('kb')}
              className="p-4 rounded-xl glass-card border border-white/5 hover:border-indigo-500/30 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Ingest Knowledge Docs</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Index PDF/TXT into vector memory</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="p-4 rounded-xl glass-card border border-white/5 hover:border-emerald-500/30 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">AI Metering Ledger</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Audit spend, tokens & latency</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. SUPPORT AGENT DASHBOARD                              */}
      {/* ======================================================= */}
      {isAgent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Assigned to Me</span>
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {recentTickets.filter((t) => t.assignedAgentId === user?.id).length}
                </div>
                <p className="text-[11px] text-slate-400">Active queue needing agent reply</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>High & Urgent Queue</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {recentTickets.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length}
                </div>
                <p className="text-[11px] text-slate-400">Prioritize based on SLA deadlines</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>AI Copilot Status</span>
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-violet-400">Enabled</div>
                <p className="text-[11px] text-slate-400">Draft replies & auto-summaries active</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Team Workload</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{memberCount}</div>
                <p className="text-[11px] text-slate-400">Active organization members</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 3. CUSTOMER DASHBOARD                                   */}
      {/* ======================================================= */}
      {isCustomer && (
        <div className="space-y-6">
          {/* Quick AI Help Bar */}
          <Card className="border-brand-500/30 shadow-glow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
                  <BotMessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Need immediate answers?</h3>
                  <p className="text-xs text-slate-400">
                    Ask SupportPilot AI for grounded solutions from verified company documentation.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigate('chat')}
                  leftIcon={<BotMessageSquare className="w-4 h-4" />}
                >
                  Open 24/7 AI Assistant
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onOpenCreateTicket}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Submit Human Support Ticket
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-medium text-slate-400">My Active Tickets</span>
                <div className="text-2xl font-bold text-white">
                  {recentTickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-medium text-slate-400">My Resolved Inquiries</span>
                <div className="text-2xl font-bold text-emerald-400">
                  {recentTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* Recent Tickets Table (All Roles)                        */}
      {/* ======================================================= */}
      <Card>
        <CardHeader
          title={isCustomer ? 'My Recent Support Inquiries' : 'Recent Support Tickets'}
          subtitle="Real-time ticket records scoped to your organization"
          icon={<Ticket className="w-4 h-4 text-brand-400" />}
          action={
            <Button size="sm" variant="ghost" onClick={() => onNavigate('tickets')}>
              View All Tickets
            </Button>
          }
        />
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No tickets recorded in this organization yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigate('tickets')}
                  className="p-4 hover:bg-white/[0.02] cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-brand-400 font-semibold">
                        #SP-{t.ticketNumber}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{t.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Category: {t.category}</span>
                      <span>·</span>
                      <span>By {t.customer.fullName}</span>
                      <span>·</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <TicketPriorityBadge priority={t.priority} />
                    <TicketStatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
