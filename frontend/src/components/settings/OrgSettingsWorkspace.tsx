import React, { useState, useEffect } from 'react';
import {
  Shield,
  Cpu,
  Save,
  Building,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { MemberManager } from '../org/MemberManager.js';
import { getAiSettingsApi, updateAiSettingsApi } from '../../services/ai-assist.api.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';

export const OrgSettingsWorkspace: React.FC = () => {
  const { accessToken, activeOrg, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'team'>('general');

  // AI Settings state
  const [monthlySpendCap, setMonthlySpendCap] = useState<number>(50.0);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.65);
  const [maxRetrievalCount, setMaxRetrievalCount] = useState<number>(4);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = role === 'OWNER';

  useEffect(() => {
    if (!accessToken || !activeOrg) return;
    setLoading(true);
    getAiSettingsApi(accessToken, activeOrg.organizationId)
      .then((settings) => {
        setMonthlySpendCap(settings.aiMonthlySpendLimitUsd);
        setConfidenceThreshold(settings.ragConfidenceThreshold);
        setMaxRetrievalCount(settings.maxRetrievalCount);
      })
      .catch((err) => {
        setError((err as Error).message || 'Failed to load organization settings');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken, activeOrg]);

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !activeOrg || !isOwner) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateAiSettingsApi(accessToken, activeOrg.organizationId, {
        aiMonthlySpendLimitUsd: Number(monthlySpendCap),
        ragConfidenceThreshold: Number(confidenceThreshold),
        maxRetrievalCount: Number(maxRetrievalCount),
      });

      setMonthlySpendCap(updated.aiMonthlySpendLimitUsd);
      setConfidenceThreshold(updated.ragConfidenceThreshold);
      setMaxRetrievalCount(updated.maxRetrievalCount);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to update AI settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Organization Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage workspace identity, AI copilot spending controls, and team role permissions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'general'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            General Profile
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ai'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI & Copilot Limits
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Team Members
          </button>
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

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Organization settings successfully saved and applied.</span>
        </div>
      )}

      {/* Tab 1: General Workspace Profile */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Active Organization Profile"
              subtitle="Unique multi-tenant identifier and branding metadata"
              icon={<Building className="w-4 h-4 text-brand-400" />}
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Organization Name</label>
                  <input
                    type="text"
                    disabled
                    value={activeOrg?.organizationName || ''}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Workspace Slug</label>
                  <input
                    type="text"
                    disabled
                    value={activeOrg?.organizationSlug || ''}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-brand-300"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Tenant Isolation Status</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every support ticket, conversation, vector embedding, and usage metric is strictly bound to
                  organization ID <code className="text-brand-300 font-mono">{activeOrg?.organizationId}</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: AI & Copilot Spending Controls */}
      {activeTab === 'ai' && (
        <Card>
          <CardHeader
            title="AI & Copilot Guardrails"
            subtitle="Configure spending limits, retrieval threshold, and maximum chunks"
            icon={<Cpu className="w-4 h-4 text-brand-400" />}
          />
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <form onSubmit={handleSaveAiSettings} className="space-y-6">
                {!isOwner && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Only Organization Owners can modify AI spending limits and thresholds.</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Monthly Spend Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Monthly AI Spending Limit (USD)
                    </label>
                    <div className="relative max-w-xs">
                      <span className="text-slate-500 text-xs absolute left-3 top-2.5 font-bold">$</span>
                      <input
                        type="number"
                        step="5"
                        min="5"
                        max="5000"
                        disabled={!isOwner || saving}
                        value={monthlySpendCap}
                        onChange={(e) => setMonthlySpendCap(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Hard limit on monthly LLM queries. Once exceeded, requests gracefully fallback to human support.
                    </p>
                  </div>

                  {/* RAG Confidence Threshold */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between max-w-md">
                      <label className="text-xs font-medium text-slate-300">
                        RAG Cosine Similarity Threshold
                      </label>
                      <span className="text-xs font-mono font-bold text-brand-400">
                        {(confidenceThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="0.9"
                      step="0.05"
                      disabled={!isOwner || saving}
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="w-full max-w-md accent-brand-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">
                      Minimum cosine similarity required to include a knowledge base chunk in RAG synthesis.
                    </p>
                  </div>

                  {/* Max Retrieval Count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Maximum Retrieval Chunks per Query
                    </label>
                    <div className="max-w-xs">
                      <select
                        disabled={!isOwner || saving}
                        value={maxRetrievalCount}
                        onChange={(e) => setMaxRetrievalCount(parseInt(e.target.value, 10))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value={2}>2 chunks (Compact Context)</option>
                        <option value={4}>4 chunks (Recommended Balanced)</option>
                        <option value={6}>6 chunks (Detailed Knowledge)</option>
                        <option value={8}>8 chunks (Deep Context)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={saving}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Save AI Configuration
                    </Button>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Team Members and Roles */}
      {activeTab === 'team' && <MemberManager />}
    </div>
  );
};
