import React from 'react';
import {
  Search,
  Database,
  BarChart3,
  GitBranch,
  Lock,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { ServerStackIllustration } from '../common/IllustrationGraphics.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';

interface FeaturesPageProps {
  onBackToHome: () => void;
  onGetStarted: () => void;
  onExploreDemoRole: (role: 'OWNER' | 'AGENT' | 'CUSTOMER') => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onBackToHome,
  onGetStarted,
  onExploreDemoRole,
}) => {
  const featureList = [
    {
      icon: <Search className="w-5 h-5 text-violet-400" />,
      title: 'Grounded AI Search',
      desc: 'Get accurate answers strictly derived from your verified documentation with real bracketed citations.',
      highlight: 'Zero hallucinations',
    },
    {
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      title: 'pgvector RAG',
      desc: 'Lightning-fast 1536-dimensional semantic search directly executed inside PostgreSQL with HNSW indexing.',
      highlight: '< 45ms retrieval latency',
    },
    {
      icon: <Layers className="w-5 h-5 text-pink-400" />,
      title: 'Multi-Tenant Support',
      desc: 'Isolate data for each client securely at the schema and vector partition layer. No cross-tenant leakage.',
      highlight: 'Cryptographic isolation',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
      title: 'Real-Time Analytics',
      desc: 'Track support performance, customer satisfaction ratings, token expenditures, and live agent velocity.',
      highlight: 'Live telemetry stream',
    },
    {
      icon: <GitBranch className="w-5 h-5 text-indigo-400" />,
      title: 'Smart Ticket Routing',
      desc: 'Automatically classify, tag, and assign incoming customer inquiries to specialized agents based on urgency.',
      highlight: 'AI triage classifier',
    },
    {
      icon: <Lock className="w-5 h-5 text-cyan-400" />,
      title: 'Enterprise Security',
      desc: 'Your data is always protected with Argon2id hashing, TLS encryption, RBAC, and granular audit log history.',
      highlight: 'SOC2-ready guardrails',
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
        <span className="text-white font-semibold">Features</span>
      </nav>

      {/* Hero Header with Server Graphic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Built for Modern High-Growth Support Teams</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Powerful Features for <br />
            <span className="gradient-text-violet">Smarter Support</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Everything you need to deliver intelligent, accurate, and scalable customer support.
            From vector-grounded answers to automated triage and role-aware workspaces.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              size="md"
              variant="primary"
              onClick={onGetStarted}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Free Trial
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => onExploreDemoRole('AGENT')}
              leftIcon={<Cpu className="w-4 h-4 text-violet-400" />}
            >
              Explore Agent Features
            </Button>
          </div>
        </div>

        {/* 3D Server Stack on right */}
        <div className="lg:col-span-5 flex justify-center">
          <ServerStackIllustration />
        </div>
      </div>

      {/* Feature Cards Grid (6 Glowing Cards from Mockup) */}
      <div className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="brand" size="sm">
            Deep Automation Matrix
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Engineered for Accuracy & Speed</h2>
          <p className="text-xs text-slate-400">
            Every feature is designed to eliminate repetitive tier-1 tickets and empower human agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {featureList.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl glass-card border border-white/5 hover:border-violet-500/40 space-y-4 group transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-navy-900 border border-white/10 group-hover:border-violet-500/40 flex items-center justify-center shadow-sm">
                {item.icon}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">SPECIFICATION</span>
                <span className="text-violet-400 font-semibold">{item.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Built for Scale Section (from bottom of Features mockup) */}
      <div className="p-8 sm:p-12 rounded-3xl glass-card-interactive border border-violet-500/20 shadow-glow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-6 space-y-4">
            <Badge variant="brand" size="sm">
              Global Architecture
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Built for Massive Scale</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              From fast-growing startups to Fortune 500 enterprises, SupportPilot scales effortlessly
              with your customer base. High throughput PostgreSQL pgvector indices execute similarity
              matches in milliseconds under high concurrent load.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>High Performance 99.9% SLA & Distributed Fallback</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Global Multi-Region Infrastructure & Vector Edge Caching</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Provider-Agnostic LLM Routing (OpenAI, Gemini, Anthropic)</span>
              </li>
            </ul>

            <div className="pt-4 flex items-center gap-3">
              <Button size="sm" variant="primary" onClick={onGetStarted}>
                Learn More &rarr;
              </Button>
            </div>
          </div>

          {/* Miniature Dashboard Preview Canvas */}
          <div className="lg:col-span-6 rounded-2xl bg-navy-950/90 border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.supportpilot.ai/dashboard</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                HEALTHY 100%
              </span>
            </div>

            {/* Mock stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-navy-900 border border-white/5">
                <div className="text-[10px] text-slate-400">Total Tickets</div>
                <div className="text-sm font-bold text-white mt-1">1,248</div>
                <span className="text-[9px] text-emerald-400">+12%</span>
              </div>
              <div className="p-3 rounded-xl bg-navy-900 border border-white/5">
                <div className="text-[10px] text-slate-400">Avg Resolution</div>
                <div className="text-sm font-bold text-white mt-1">1.2 min</div>
                <span className="text-[9px] text-emerald-400">-15%</span>
              </div>
              <div className="p-3 rounded-xl bg-navy-900 border border-white/5">
                <div className="text-[10px] text-slate-400">Satisfaction</div>
                <div className="text-sm font-bold text-white mt-1">4.9 / 5.0</div>
                <span className="text-[9px] text-violet-400">★ 99%</span>
              </div>
            </div>

            {/* Mock visual wave */}
            <div className="h-20 rounded-xl bg-navy-900/60 border border-white/5 p-2 flex items-end justify-between gap-1">
              {[35, 45, 60, 52, 78, 65, 88, 95, 82, 100].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-violet-500 opacity-80"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
