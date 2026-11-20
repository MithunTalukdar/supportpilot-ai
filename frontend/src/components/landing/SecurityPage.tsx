import React from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  FileCheck2,
  Server,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

interface SecurityPageProps {
  onBackToHome: () => void;
  onGetStarted: () => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onBackToHome, onGetStarted }) => {
  const securityPillars = [
    {
      icon: <Layers className="w-5 h-5 text-violet-400" />,
      title: 'Cryptographic Multi-Tenancy',
      desc: 'Every SQL query and vector similarity computation strictly scopes against the authenticated organizationId. No document, embedding chunk, or conversation can ever be leaked across organizational boundaries.',
    },
    {
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      title: 'pgvector Cosine Partitioning',
      desc: 'Embeddings are indexed using HNSW indices partitioned by tenant ID directly in PostgreSQL, eliminating external vector service sync drift and ensuring strict relational row-level isolation.',
    },
    {
      icon: <Lock className="w-5 h-5 text-indigo-400" />,
      title: 'Enterprise RBAC & Auth Guardrails',
      desc: 'Argon2id password hashing, rotating JWT session keys, and strict middleware role enforcement ensure only authorized Organization Owners, Support Agents, and verified Customers can view specific scopes.',
    },
    {
      icon: <KeyRound className="w-5 h-5 text-amber-400" />,
      title: 'AI Grounding & Zero Data Retention',
      desc: 'All LLM synthesis operations run strictly in transient memory. Customer proprietary documents are never used for base model training or cross-customer retrieval synthesis.',
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-rose-400" />,
      title: 'Comprehensive Audit Provenance',
      desc: 'Every login, ticket modification, knowledge base document upload, and AI completion request is recorded into immutable audit logs with token expenditure and timestamp metrics.',
    },
    {
      icon: <Server className="w-5 h-5 text-cyan-400" />,
      title: 'Encrypted in Transit & at Rest',
      desc: 'Enforced TLS 1.3 encryption for all external and internal API traffic, combined with AES-256 encrypted database volumes, rate limiting, and CORS allowlist enforcement.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={onBackToHome} className="hover:text-violet-400 transition-colors cursor-pointer">
          Home
        </button>
        <span>&gt;</span>
        <span className="text-white font-semibold">Security Architecture</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 shadow-glow">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero-Trust Enterprise Isolation Model</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Enterprise Security &amp; <br />
          <span className="gradient-text-violet">Data Protection Architecture</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          SupportPilot AI is engineered from the ground up for strict regulatory compliance, multi-tenant
          cryptographic boundary isolation, and hallucination-free grounded AI workflows.
        </p>
      </div>

      {/* Visual Architecture Diagram Box */}
      <div className="p-8 sm:p-10 rounded-3xl glass-card-interactive border border-violet-500/25 shadow-glow-card space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-mono uppercase text-violet-400 tracking-wider">
              DATA FLOW ISOLATION TOPOLOGY
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              End-to-End Tenant Scoping Pipeline
            </h3>
          </div>
          <Badge variant="success" size="sm">
            PostgreSQL 16 + pgvector Verified
          </Badge>
        </div>

        {/* Visual Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 uppercase">1. Ingress Layer</div>
            <div className="text-sm font-bold text-white">CORS &amp; Helmet Guard</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Validates origin headers, terminates TLS, applies rate limits, and strips untrusted headers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="text-[10px] font-mono text-violet-400 uppercase">2. Auth &amp; Tenant Scope</div>
            <div className="text-sm font-bold text-white">JWT Context Resolver</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Resolves user identity and bounds every incoming request context strictly to verified organization memberships.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="text-[10px] font-mono text-emerald-400 uppercase">3. Vector Partitioning</div>
            <div className="text-sm font-bold text-white">pgvector Filter Clause</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Similarity search applies strict <code>WHERE organization_id = :id</code> prior to cosine distance ranking.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="text-[10px] font-mono text-amber-400 uppercase">4. LLM Synthesis Gateway</div>
            <div className="text-sm font-bold text-white">Grounded Citations</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Injects verified excerpts with citations; tracks prompt/completion tokens and cost ledger in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Security Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityPillars.map((pillar, idx) => (
          <div key={idx} className="p-6 rounded-2xl glass-card border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 border border-white/10 flex items-center justify-center">
              {pillar.icon}
            </div>
            <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
          </div>
        ))}
      </div>

      {/* Action CTA */}
      <div className="p-8 rounded-3xl glass-card border border-white/10 text-center space-y-4 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-white">Deploy with Total Confidence</h3>
        <p className="text-xs text-slate-400">
          Ready to experience secure, grounded enterprise customer support automation?
        </p>
        <div className="pt-2">
          <Button size="md" variant="primary" onClick={onGetStarted}>
            Start Free Trial Today &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
};
