import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  PlusCircle,
  Search,
  Filter,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  TicketItem,
  TicketMetrics,
  TicketStatus,
  TicketPriority,
} from '../../types/ticket.js';
import {
  listTicketsApi,
  getTicketMetricsApi,
  ListTicketsQuery,
} from '../../services/ticket.api.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { AlertBanner } from '../ui/AlertBanner.js';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge.js';
import { CreateTicketModal } from './CreateTicketModal.js';
import { TicketDetailDrawer } from './TicketDetailDrawer.js';

export const TicketWorkspace: React.FC = () => {
  const { accessToken, activeOrg, role } = useAuth();
  const isStaff = role === 'OWNER' || role === 'AGENT';

  // Data states
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Modal / Drawer states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);
    try {
      const query: ListTicketsQuery = {
        page,
        limit,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter || undefined,
        search: search.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const response = await listTicketsApi(accessToken, activeOrg.organizationId, query);
      setTickets(response.tickets);
      setMeta(response.meta);
    } catch (err) {
      setError((err as Error).message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeOrg, page, limit, statusFilter, priorityFilter, categoryFilter, search]);

  // Fetch metrics (Staff only)
  const fetchMetrics = useCallback(async () => {
    if (!accessToken || !activeOrg || !isStaff) return;
    setMetricsLoading(true);
    try {
      const data = await getTicketMetricsApi(accessToken, activeOrg.organizationId);
      setMetrics(data);
    } catch {
      // Metrics error is non-blocking
    } finally {
      setMetricsLoading(false);
    }
  }, [accessToken, activeOrg, isStaff]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (isStaff) {
      fetchMetrics();
    }
  }, [fetchMetrics, isStaff]);

  const handleTicketCreated = (newTicket: TicketItem) => {
    setSuccessNotice(`Ticket #SP-${newTicket.ticketNumber} created successfully!`);
    setTimeout(() => setSuccessNotice(null), 5000);
    fetchTickets();
    if (isStaff) fetchMetrics();
  };

  const handleTicketUpdated = (updatedTicket: TicketItem) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
    );
    if (isStaff) fetchMetrics();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || statusFilter || priorityFilter || categoryFilter);

  return (
    <div className="space-y-6">
      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleTicketCreated}
      />

      {/* Ticket Details Drawer */}
      {selectedTicketId && (
        <TicketDetailDrawer
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={handleTicketUpdated}
        />
      )}

      {/* Success Notice */}
      {successNotice && (
        <AlertBanner
          type="success"
          title="Operation Complete"
          message={successNotice}
          onDismiss={() => setSuccessNotice(null)}
        />
      )}

      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          title="Error Loading Tickets"
          message={error}
          onDismiss={() => setError(null)}
          action={{
            label: 'Retry',
            onClick: fetchTickets,
          }}
        />
      )}

      {/* Staff Metrics Bar */}
      {isStaff && metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Total Tickets</span>
            <div className="text-xl font-bold text-white">{metrics.totalTickets}</div>
            <div className="text-[10px] text-slate-500">Organization-wide</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-950/20 border border-sky-500/20 space-y-1">
            <span className="text-[11px] text-sky-300 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Open Tickets
            </span>
            <div className="text-xl font-bold text-sky-200">
              {metrics.statusBreakdown?.OPEN ?? 0}
            </div>
            <div className="text-[10px] text-sky-400/70">Awaiting triage</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
            <span className="text-[11px] text-indigo-300 font-medium">In Progress</span>
            <div className="text-xl font-bold text-indigo-200">
              {metrics.statusBreakdown?.IN_PROGRESS ?? 0}
            </div>
            <div className="text-[10px] text-indigo-400/70">Being handled</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1">
            <span className="text-[11px] text-amber-300 font-medium">Waiting Customer</span>
            <div className="text-xl font-bold text-amber-200">
              {metrics.statusBreakdown?.WAITING_FOR_CUSTOMER ?? 0}
            </div>
            <div className="text-[10px] text-amber-400/70">Pending customer reply</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
            <span className="text-[11px] text-emerald-300 font-medium">Resolved</span>
            <div className="text-xl font-bold text-emerald-200">{metrics.resolvedTickets}</div>
            <div className="text-[10px] text-emerald-400/70">Solution delivered</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Avg Resolution
            </span>
            <div className="text-xl font-bold text-white">
              {metrics.avgResolutionMinutes > 0
                ? `${Math.round(metrics.avgResolutionMinutes)}m`
                : '—'}
            </div>
            <div className="text-[10px] text-slate-500">From creation to resolved</div>
          </div>
        </div>
      )}

      {/* Main Workspace Card */}
      <Card>
        <CardHeader
          title="Support Tickets"
          subtitle={
            isStaff
              ? `Manage tickets for ${activeOrg?.organizationName || 'Current Organization'}`
              : `Your submitted requests for ${activeOrg?.organizationName || 'Current Organization'}`
          }
          icon={<Ticket className="w-5 h-5 text-brand-400" />}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  fetchTickets();
                  if (isStaff) fetchMetrics();
                }}
                disabled={loading || metricsLoading}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                New Ticket
              </Button>
            </div>
          }
        />

        <CardContent className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by ticket #, subject, or description..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as TicketStatus | '');
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 appearance-none pr-8 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value as TicketPriority | '');
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 appearance-none pr-8 cursor-pointer"
                >
                  <option value="">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  leftIcon={<X className="w-3.5 h-3.5 text-slate-400" />}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Ticket Table */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-400">Querying tickets from PostgreSQL database...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-slate-500">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No Tickets Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'No support tickets match the selected filters or search terms. Try clearing filters.'
                    : 'No tickets created yet in this organization. Click "New Ticket" to create one.'}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                  leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                >
                  Create First Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-3">Ticket ID & Subject</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">{isStaff ? 'Requester' : 'Assigned Agent'}</th>
                    <th className="py-3 px-3">Created</th>
                    <th className="py-3 px-3 text-right">Replies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Ticket # and Subject */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 shrink-0">
                            #SP-{t.ticketNumber}
                          </span>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <span className="font-semibold text-white truncate block group-hover:text-brand-300 transition-colors">
                              {t.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-300">{t.category || 'General'}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <TicketStatusBadge status={t.status} />
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-3">
                        <TicketPriorityBadge priority={t.priority} />
                      </td>

                      {/* Requester or Assigned Agent */}
                      <td className="py-3.5 px-3">
                        {isStaff ? (
                          <div className="text-slate-300 truncate max-w-[140px]">
                            {t.customer.fullName}
                          </div>
                        ) : (
                          <div className="text-slate-400 truncate max-w-[140px]">
                            {t.assignedAgent?.fullName || 'Unassigned'}
                          </div>
                        )}
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Replies */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                          <MessageSquare className="w-3 h-3" />
                          <span>{t.commentCount ?? 0}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {meta.total > 0 && (
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-200">{(meta.page - 1) * meta.limit + 1}</strong>{' '}
                to{' '}
                <strong className="text-slate-200">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </strong>{' '}
                of <strong className="text-slate-200">{meta.total}</strong> tickets
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <span className="px-2 font-mono text-slate-300">
                  {meta.page} / {meta.totalPages || 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
