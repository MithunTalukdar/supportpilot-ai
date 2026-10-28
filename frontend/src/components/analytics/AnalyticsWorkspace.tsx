import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  Cpu,
  Clock,
  Zap,
  Filter,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { AiUsageRecordItem, AiUsageSummary, AiSettings } from '../../types/ai.js';
import { getAiUsageLedgerApi, getAiSettingsApi } from '../../services/ai-assist.api.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';

export const AnalyticsWorkspace: React.FC = () => {
  const { accessToken, activeOrg } = useAuth();

  const [records, setRecords] = useState<AiUsageRecordItem[]>([]);
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    if (!accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);
    try {
      const [ledgerRes, settingsRes] = await Promise.all([
        getAiUsageLedgerApi(accessToken, activeOrg.organizationId, {
          page,
          limit: 15,
          feature: selectedFeature || undefined,
        }),
        getAiSettingsApi(accessToken, activeOrg.organizationId).catch(() => null),
      ]);

      setRecords(Array.isArray(ledgerRes?.records) ? ledgerRes.records : []);
      setSummary(ledgerRes?.summary || null);
      setTotalPages(ledgerRes?.meta?.totalPages || 1);
      if (settingsRes) setSettings(settingsRes);
    } catch (err) {
      setError((err as Error).message || 'Failed to load AI usage ledger');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeOrg, page, selectedFeature]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const monthlyCap = settings?.aiMonthlySpendLimitUsd || 50.0;
  const currentCost = summary?.totalEstimatedCostUsd || 0;
  const spendPct = Math.min(Math.round((currentCost / monthlyCap) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">AI Usage & Cost Metering Ledger</h1>
            <Badge variant="brand" size="sm">
              Real-Time Telemetry
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit granular token consumption, provider latency, and estimated billing costs with cryptographic isolation.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={fetchLedger}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Ledger
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Invocations</span>
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.totalRequests.toLocaleString() || 0}
            </div>
            <span className="text-[11px] text-slate-400">RAG Chat & Ticket Copilot</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Tokens Consumed</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-400">
              {summary?.totalTokens.toLocaleString() || 0}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Prompt: {(summary?.totalPromptTokens || 0).toLocaleString()}</span>
              <span>Completion: {(summary?.totalCompletionTokens || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Estimated Cost</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">${currentCost.toFixed(5)}</div>
            <span className="text-[11px] text-slate-400">Calculated per model pricing</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Average LLM Latency</span>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.averageLatencyMs || 0} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <span className="text-[11px] text-slate-400">Synthesis round-trip duration</span>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Budget Spend Progress Card */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold text-white">Monthly AI Spending Limit Enforcer</span>
            </div>
            <span className="text-xs font-mono text-slate-300">
              <strong>${currentCost.toFixed(4)}</strong> / ${monthlyCap.toFixed(2)} ({spendPct}%)
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                spendPct > 90 ? 'bg-red-500' : spendPct > 70 ? 'bg-amber-500' : 'bg-brand-500'
              }`}
              style={{ width: `${spendPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Hard spend limit prevents surprise provider bills.</span>
            <span>Resets on the 1st of each calendar month.</span>
          </div>
        </CardContent>
      </Card>

      {/* Filter Toolbar & Ledger Table */}
      <Card>
        <CardHeader
          title="Audit Ledger"
          subtitle="Persistent append-only records of AI synthesis"
          icon={<BarChart3 className="w-4 h-4 text-brand-400" />}
          action={
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFeature}
                onChange={(e) => {
                  setSelectedFeature(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">All Features</option>
                <option value="RAG_CHAT">RAG Chatbot</option>
                <option value="TICKET_SUMMARY">Ticket Summary</option>
                <option value="TICKET_CLASSIFICATION">Classification</option>
                <option value="REPLY_SUGGESTION">Reply Suggestion</option>
                <option value="DOCUMENT_EMBEDDING">Doc Embedding</option>
              </select>
            </div>
          }
        />

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="md" />
              <span className="text-xs text-slate-500">Loading ledger records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No AI usage records logged for this filter yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Model & Provider</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4 text-right">Prompt / Comp</th>
                    <th className="py-3 px-4 text-right">Total Tokens</th>
                    <th className="py-3 px-4 text-right">Latency</th>
                    <th className="py-3 px-4 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {(records || []).map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="brand" size="sm">
                          {r.feature}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-200">{r.model}</span>{' '}
                        <span className="text-slate-500 text-[10px]">({r.provider})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.user?.fullName || 'System Agent'}</td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                        {r.promptTokens} / {r.completionTokens}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        {r.totalTokens}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{r.latencyMs}ms</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                        ${r.estimatedCostUsd.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
