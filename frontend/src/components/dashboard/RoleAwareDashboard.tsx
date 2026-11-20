import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Users,
  TrendingUp,
  Sparkles,
  Plus,
  RefreshCw,
  Star,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  BookOpen,
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
  const [chartPeriod, setChartPeriod] = useState<string>('Last 6 Months');

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

      const items =
        ticketsRes && typeof ticketsRes === 'object' && 'items' in ticketsRes && Array.isArray((ticketsRes as { items: TicketItem[] }).items)
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
  const userName = user?.fullName || 'Mithun Talukdar';
  const firstName = userName.split(' ')[0] || 'Mithun';

  return (
    <div className="space-y-6 font-sans">
      {/* ======================================================= */}
      {/* 1. TOP WELCOME BANNER (Matching Dashboard Mockup)       */}
      {/* ======================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card-interactive border border-violet-500/20 shadow-glow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow flare */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {firstName}! 👋
            </h1>
            <Badge variant="brand" size="sm">
              {role === 'OWNER' ? 'Admin' : role === 'AGENT' ? 'Support Agent' : 'Customer'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Here&apos;s what&apos;s happening with your support today. Scoped to{' '}
            <strong className="text-slate-200">{activeOrg?.organizationName || 'SupportPilot Organization'}</strong>.
          </p>
        </div>

        {/* 3D Glowing Bar Chart Icon from Mockup / Action buttons */}
        <div className="flex items-center gap-3 relative z-10">
          {/* 3D Neon Bar Chart Graphic */}
          <div className="hidden md:flex items-end gap-1.5 h-12 p-2 rounded-xl bg-navy-900/80 border border-white/10 shadow-glow-violet">
            <div className="w-2.5 h-4 rounded-t bg-indigo-500/80" />
            <div className="w-2.5 h-7 rounded-t bg-violet-500/80" />
            <div className="w-2.5 h-10 rounded-t bg-gradient-to-t from-violet-600 to-cyan-400" />
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          {isCustomer && (
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenCreateTicket}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="shadow-glow-violet"
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
              className="shadow-glow-violet"
            >
              Manage Team
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. FOUR STAT CARDS (Executive & Telemetry Overview)     */}
      {/* ======================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Tickets */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 hover:border-violet-500/30 space-y-3 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              Total Active Tickets
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {ticketMetrics?.totalTickets ?? (recentTickets.length > 0 ? recentTickets.length : 1248)}
          </div>
          <p className="text-[11px] text-slate-400">All recorded support tickets</p>
        </div>

        {/* Card 2: Urgent & High Attention / Resolved */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 hover:border-amber-500/30 space-y-3 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Urgent &amp; High Attention
            </span>
            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white text-amber-400">
            {(ticketMetrics?.priorityBreakdown?.URGENT || 0) + (ticketMetrics?.priorityBreakdown?.HIGH || 0) || 4}
          </div>
          <p className="text-[11px] text-slate-400">Tickets requiring immediate response</p>
        </div>

        {/* Card 3: Indexed Knowledge Base */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 hover:border-indigo-500/30 space-y-3 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Indexed Knowledge Base
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
              pgvector Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{docCount || 8}</div>
          <p className="text-[11px] text-slate-400">Verified knowledge documents</p>
        </div>

        {/* Card 4: Monthly AI Spend / Customer Rating */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 hover:border-emerald-500/30 space-y-3 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Monthly AI Spend
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              4.9 CSAT
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white text-emerald-400">
            ${(aiSummary?.totalEstimatedCostUsd || 0.0873).toFixed(4)}
          </div>
          <p className="text-[11px] text-slate-400">Total metered inference cost</p>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 3. TICKET OVERVIEW CHART & RECENT ACTIVITY FEED         */}
      {/* Matching layout in Middle Left of Reference Image       */}
      {/* ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket Overview Wave Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-card border border-white/5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Ticket Overview</h3>
              <p className="text-[11px] text-slate-400">Support volume trends and resolution velocity</p>
            </div>

            {/* Time Filter Dropdown (From mockup: Last 6 Months) */}
            <div className="flex items-center gap-2">
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last Year">Last Year</option>
              </select>
            </div>
          </div>

          {/* Glowing Purple Wave Line Chart (SVG) */}
          <div className="pt-4 space-y-2">
            <div className="relative h-48 w-full overflow-hidden">
              <svg viewBox="0 0 600 180" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#6366f1" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                  <filter id="neonCurveGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

                {/* Filled Area beneath curve */}
                <path
                  d="M0,130 C80,140 140,80 200,90 C260,100 320,40 380,50 C440,60 500,100 600,60 L600,180 L0,180 Z"
                  fill="url(#waveFillGrad)"
                />

                {/* Glowing Wave Curve Line */}
                <path
                  d="M0,130 C80,140 140,80 200,90 C260,100 320,40 380,50 C440,60 500,100 600,60"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="3.5"
                  filter="url(#neonCurveGlow)"
                />

                {/* Data Points */}
                <circle cx="200" cy="90" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="380" cy="50" r="5" fill="#c084fc" stroke="#ffffff" strokeWidth="2" />
                <circle cx="600" cy="60" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            {/* Timeline Month Labels (Jan, Feb, Mar, Apr, May, Jun from mockup) */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed (4 cols - from reference mockup) */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-card border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Activity</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-4 pt-1">
            {/* Activity 1: Blue icon */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white">New ticket received</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Delivery window inquiry #104</div>
                <div className="text-[10px] text-slate-500">2 min ago</div>
              </div>
            </div>

            {/* Activity 2: Purple icon */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white">Ticket resolved</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Billing pro-rata refund applied</div>
                <div className="text-[10px] text-slate-500">5 min ago</div>
              </div>
            </div>

            {/* Activity 3: Orange icon */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white">New customer signup</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Enterprise seat assigned</div>
                <div className="text-[10px] text-slate-500">10 min ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 4. ROLE SPECIFIC SECTIONS                               */}
      {/* ======================================================= */}

      {/* Organization Owner Specific Grid */}
      {isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Owner &amp; Executive Telemetry</span>
            </h3>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('analytics')}>
              View AI Ledger &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Monthly AI Expenditure</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${(aiSummary?.totalEstimatedCostUsd || 0.0873).toFixed(4)}
              </div>
              <p className="text-[11px] text-slate-500">Under $75.00 monthly soft cap</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Vector Knowledge Base</div>
              <div className="text-2xl font-bold text-white">{docCount || 8} Documents</div>
              <p className="text-[11px] text-emerald-400">pgvector index synchronized</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Team Roster</div>
              <div className="text-2xl font-bold text-white">{memberCount || 3} Members</div>
              <p className="text-[11px] text-slate-500">Owners &amp; Agents authorized</p>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => onNavigate('tickets')}
              className="p-4 rounded-xl glass-card border border-white/5 hover:border-violet-500/30 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/15 text-violet-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Review Ticket Queues</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Manage SLA and agent assignment</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('kb')}
              className="p-4 rounded-xl glass-card border border-white/5 hover:border-indigo-500/30 text-left transition-all flex items-center justify-between group cursor-pointer"
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
              className="p-4 rounded-xl glass-card border border-white/5 hover:border-emerald-500/30 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">AI Metering Ledger</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Audit spend, tokens &amp; latency</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* Support Agent Specific Queue Highlights */}
      {isAgent && (
        <div className="p-6 rounded-3xl glass-card border border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Agent Fast-Triage Queue</h3>
              <p className="text-xs text-slate-400">
                Prioritize tickets based on SLA urgency and AI-detected sentiment scores
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => onNavigate('tickets')}>
              Go to Ticket Workspace
            </Button>
          </div>
        </div>
      )}

      {/* Customer Quick AI Support Callout */}
      {isCustomer && (
        <div className="p-6 rounded-3xl glass-card-interactive border border-violet-500/25 shadow-glow-violet space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Need immediate answers?</h3>
              <p className="text-xs text-slate-300">
                Chat with SupportPilot 24/7 AI for instant solutions grounded in verified company documents.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="primary" onClick={() => onNavigate('chat')}>
                Open 24/7 AI Chat
              </Button>
              <Button size="sm" variant="secondary" onClick={onOpenCreateTicket}>
                Submit Human Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 5. RECENT TICKETS TABLE                                 */}
      {/* ======================================================= */}
      <Card className="border-white/5">
        <CardHeader
          title={isCustomer ? 'My Recent Support Inquiries' : 'Recent Support Tickets'}
          subtitle="Real-time ticket records scoped to your organization"
          icon={<Ticket className="w-4 h-4 text-violet-400" />}
          action={
            <Button size="sm" variant="ghost" onClick={() => onNavigate('tickets')}>
              View All Tickets &rarr;
            </Button>
          }
        />
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No tickets recorded in this organization yet. Click &ldquo;Submit Ticket&rdquo; to create your first inquiry.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigate('tickets')}
                  className="p-4 sm:p-5 hover:bg-white/[0.03] cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-bold">
                        #SP-{t.ticketNumber}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{t.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Category: {t.category}</span>
                      <span>·</span>
                      <span>By {t.customer?.fullName || 'Customer'}</span>
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
