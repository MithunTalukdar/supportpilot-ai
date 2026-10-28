import React, { useState } from 'react';
import {
  ShieldCheck,
  Bot,
  Sparkles,
  Zap,
  Lock,
  Database,
  ArrowRight,
  CheckCircle,
  Sun,
  Moon,
  BarChart3,
  Search,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { useTheme } from '../../context/ThemeContext.js';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreDemoRole: (role: 'OWNER' | 'AGENT' | 'CUSTOMER') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onExploreDemoRole,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Interactive Live Demo Sandbox state on Landing Page
  const [demoQuery, setDemoQuery] = useState('What is the standard refund policy window?');
  const [demoAnswer, setDemoAnswer] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoCitations, setDemoCitations] = useState<Array<{ title: string; match: number; snippet: string }>>([]);

  const handleRunDemoQuery = (queryText: string) => {
    setDemoQuery(queryText);
    setDemoLoading(true);
    setDemoAnswer(null);

    setTimeout(() => {
      if (queryText.toLowerCase().includes('refund')) {
        setDemoAnswer(
          'Based on our Refund Policy Guide, standard refunds are processed strictly within 30 days of purchase to the original payment method [1]. If your subscription was charged during an outage, our support team can issue an expedited pro-rata refund upon review.'
        );
        setDemoCitations([
          {
            title: 'Refund Policy Guide 2026',
            match: 94,
            snippet: 'SupportPilot standard refund window is strictly 30 days from purchase date.',
          },
        ]);
      } else if (queryText.toLowerCase().includes('sla') || queryText.toLowerCase().includes('urgent')) {
        setDemoAnswer(
          'According to our Support SLA Guidelines, Urgent priority tickets receive a 1-hour first response time, with 24/7 dedicated engineering support [1]. Standard priority tickets are responded to within 4 business hours.'
        );
        setDemoCitations([
          {
            title: 'Support SLA Guidelines',
            match: 91,
            snippet: 'Urgent priority tickets receive a 1-hour first response SLA and dedicated engineer routing.',
          },
        ]);
      } else {
        setDemoAnswer(
          'Based on our Knowledge Base, SupportPilot AI enforces multi-tenant boundary isolation at the database level [1]. All vector embeddings are partitioned by organization ID in PostgreSQL with pgvector.'
        );
        setDemoCitations([
          {
            title: 'Multi-Tenant Architecture Guide',
            match: 88,
            snippet: 'Cross-tenant vector search is cryptographically isolated via organizationId constraints.',
          },
        ]);
      }
      setDemoLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight gradient-text">SupportPilot</span>
              <span className="text-[10px] text-brand-400 font-bold px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                AI SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Security Architecture
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Role Portals
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <Button size="sm" variant="ghost" onClick={onSignIn}>
              Sign In
            </Button>
            <Button size="sm" variant="primary" onClick={onGetStarted}>
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-600/20 via-violet-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-brand-500/30 text-xs font-semibold text-brand-300 shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>SupportPilot AI 2.0 — Grounded RAG & Automated Ticket Copilot</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Enterprise Customer Support, Powered by{' '}
            <span className="gradient-text">Grounded AI & pgvector</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate customer support friction with strictly verified knowledge base retrieval,
            inline source citations, and intelligent ticket copilots. Zero hallucinations, complete tenant isolation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button size="md" variant="primary" onClick={onGetStarted} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Trial
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                const el = document.getElementById('demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              leftIcon={<Bot className="w-4 h-4 text-brand-400" />}
            >
              Try Interactive Sandbox
            </Button>
          </div>

          {/* Quick Role Evaluation Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Instant Role Demo:</span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => onExploreDemoRole('OWNER')}
                className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white transition-all"
              >
                Launch as <strong className="text-brand-300">Organization Owner</strong>
              </button>
              <button
                onClick={() => onExploreDemoRole('AGENT')}
                className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white transition-all"
              >
                Launch as <strong className="text-indigo-300">Support Agent</strong>
              </button>
              <button
                onClick={() => onExploreDemoRole('CUSTOMER')}
                className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white transition-all"
              >
                Launch as <strong className="text-emerald-300">Customer</strong>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Section */}
      <section id="demo" className="py-16 bg-slate-900/30 border-y border-white/5 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="brand" size="sm">
              Live Sandbox Preview
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Experience Real-Time RAG Grounding</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Test semantic search and LLM synthesis. Every answer is grounded in knowledge documents with verified source citations.
            </p>
          </div>

          {/* Interactive Query Box */}
          <div className="p-6 rounded-2xl glass-card border border-brand-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={demoQuery}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  placeholder="Ask a sample support inquiry..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <Button
                size="md"
                variant="primary"
                onClick={() => handleRunDemoQuery(demoQuery)}
                isLoading={demoLoading}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Synthesize Answer
              </Button>
            </div>

            {/* Quick Sample Query Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="text-[11px] font-semibold text-slate-500">Try asking:</span>
              {[
                'What is the standard refund policy window?',
                'What are the SLAs for urgent priority support tickets?',
                'How does multi-tenant database isolation work?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunDemoQuery(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors truncate max-w-xs"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Simulated Live Response Box */}
            <div className="mt-4 p-5 rounded-xl bg-slate-950/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                    AI
                  </div>
                  <span className="text-xs font-semibold text-white">SupportPilot Copilot</span>
                </div>
                <Badge variant="success" size="sm">
                  Grounded in pgvector
                </Badge>
              </div>

              {demoLoading ? (
                <div className="py-6 flex items-center gap-3 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                  <span>Scanning pgvector 1536-d embeddings and validating citations...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {demoAnswer ||
                      'Based on our Refund Policy Guide, standard refunds are processed strictly within 30 days of purchase to the original payment method [1]. If your subscription was charged during an outage, our support team can issue an expedited pro-rata refund upon review.'}
                  </p>

                  {/* Supporting Citations */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Verified Sources:
                    </span>
                    {(demoCitations.length > 0
                      ? demoCitations
                      : [
                          {
                            title: 'Refund Policy Guide 2026',
                            match: 94,
                            snippet: 'SupportPilot standard refund window is strictly 30 days from purchase date.',
                          },
                        ]
                    ).map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[10px] font-medium flex items-center gap-1.5"
                      >
                        <span>[1] {c.title}</span>
                        <span className="text-emerald-400 font-bold">{c.match}% match</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="brand" size="sm">
            Platform Pillars
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Engineered for Accuracy & Security</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Everything your team needs to deliver rapid, compliant support with AI guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Bot className="w-5 h-5 text-brand-400" />,
              title: 'Grounded RAG Assistant',
              desc: 'Answers questions strictly using your uploaded documents. Returns real bracketed source citations with zero hallucinations.',
            },
            {
              icon: <Lock className="w-5 h-5 text-indigo-400" />,
              title: 'Multi-Tenant Isolation',
              desc: 'Cross-organization data access is cryptographically blocked at the database layer. Verified organization membership on every query.',
            },
            {
              icon: <Sparkles className="w-5 h-5 text-violet-400" />,
              title: 'AI Ticket Copilot',
              desc: 'One-click automated issue summaries, sentiment scoring (-1.0 to +1.0), and grounded reply draft generation for support agents.',
            },
            {
              icon: <Database className="w-5 h-5 text-emerald-400" />,
              title: 'pgvector Vector Store',
              desc: 'High-performance 1536-dimensional semantic chunking and cosine similarity search directly inside PostgreSQL.',
            },
            {
              icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
              title: 'AI Metering & Cost Ledger',
              desc: 'Granular tracking of token usage, model latency, and dollar spend per organization with hard spending limit caps.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
              title: 'Enterprise RBAC',
              desc: 'Granular roles for Organization Owners, Support Agents, and Customers with server-side authorization enforcement.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-card border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Portals Showcase */}
      <section id="roles" className="py-16 bg-slate-900/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Tailored Workspaces for Every Role</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Customized interfaces designed for organizational leadership, frontline support agents, and end customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-card border border-brand-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-300">Organization Owner</span>
                <Badge variant="brand" size="sm">
                  Executive
                </Badge>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live support metrics & SLA tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Team member invitations & RBAC</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Monthly AI spend limits & thresholds</span>
                </li>
              </ul>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onExploreDemoRole('OWNER')}>
                Demo as Owner
              </Button>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-indigo-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Support Agent</span>
                <Badge variant="brand" size="sm">
                  Frontline
                </Badge>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ticket assignment & status workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>AI issue summaries & sentiment scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Grounded reply drafting from KB docs</span>
                </li>
              </ul>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onExploreDemoRole('AGENT')}>
                Demo as Agent
              </Button>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Customer</span>
                <Badge variant="success" size="sm">
                  Portal
                </Badge>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct ticket submission & tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant 24/7 grounded RAG assistant</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Private and isolated conversations</span>
                </li>
              </ul>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onExploreDemoRole('CUSTOMER')}>
                Demo as Customer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-slate-400">SupportPilot AI SaaS Platform</span>
          </div>
          <div>All queries cryptographically isolated by Organization ID. Powered by pgvector.</div>
          <div className="flex items-center gap-4">
            <button onClick={onSignIn} className="hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
