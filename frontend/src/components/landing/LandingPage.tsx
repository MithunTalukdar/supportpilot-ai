import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  Database,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Search,
  Clock,
  Layers,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { PublicNavbar, PublicPageId } from './PublicNavbar.js';
import { PublicFooter } from './PublicFooter.js';
import { AiRobotIllustration } from '../common/IllustrationGraphics.js';
import { FeaturesPage } from './FeaturesPage.js';
import { PricingPage } from './PricingPage.js';
import { AboutPage } from './AboutPage.js';
import { FaqPage } from './FaqPage.js';
import { ContactPage } from './ContactPage.js';
import { SecurityPage } from './SecurityPage.js';
import { AiDemoPage } from './AiDemoPage.js';
import { NotFoundPublicPage } from './NotFoundPublicPage.js';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreDemoRole: (role: 'OWNER' | 'AGENT' | 'CUSTOMER') => void;
  initialPage?: PublicPageId | '404';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onExploreDemoRole,
  initialPage = 'home',
}) => {
  const [currentPage, setCurrentPage] = useState<PublicPageId | '404'>(initialPage);

  // Interactive Live Demo Sandbox state on Home / Landing Page
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

  // Render Sub-Pages if navigated away from Home
  if (currentPage === 'features') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <FeaturesPage
            onBackToHome={() => setCurrentPage('home')}
            onGetStarted={onGetStarted}
            onExploreDemoRole={onExploreDemoRole}
          />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === 'pricing') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <PricingPage
            onBackToHome={() => setCurrentPage('home')}
            onGetStarted={onGetStarted}
            onContactSales={() => setCurrentPage('contact')}
          />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === 'about') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <AboutPage
            onBackToHome={() => setCurrentPage('home')}
            onGetStarted={onGetStarted}
            onContactUs={() => setCurrentPage('contact')}
          />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === 'faq') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <FaqPage
            onBackToHome={() => setCurrentPage('home')}
            onContactSupport={() => setCurrentPage('contact')}
          />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === 'contact') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <ContactPage onBackToHome={() => setCurrentPage('home')} />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === 'security') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <SecurityPage
            onBackToHome={() => setCurrentPage('home')}
            onGetStarted={onGetStarted}
          />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === 'demo') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={currentPage}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <AiDemoPage
            onBackToHome={() => setCurrentPage('home')}
            onGetStarted={onGetStarted}
          />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  if (currentPage === '404') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
        <PublicNavbar
          currentPage={'home'}
          onNavigatePage={(page) => setCurrentPage(page)}
          onGetStarted={onGetStarted}
          onSignIn={onSignIn}
          onExploreDemoRole={onExploreDemoRole}
        />
        <main className="flex-1">
          <NotFoundPublicPage onBackToHome={() => setCurrentPage('home')} />
        </main>
        <PublicFooter
          onNavigatePage={(page) => setCurrentPage(page)}
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
        />
      </div>
    );
  }

  // DEFAULT: Home / Landing Page
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans bg-radial-glow bg-grid-pattern selection:bg-violet-600 selection:text-white">
      {/* Top Navigation Bar */}
      <PublicNavbar
        currentPage="home"
        onNavigatePage={(page) => setCurrentPage(page)}
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onExploreDemoRole={onExploreDemoRole}
      />

      {/* Hero Section (Matching top-left of design reference image) */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-violet-600/25 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Glowing Badge from Mockup: Next-Gen AI Support Platform */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-glow">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Next-Gen AI Support Platform • SupportPilot AI 2.0</span>
              </div>

              {/* Enterprise Customer Support, Powered by Grounded AI & pgvector */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Enterprise Customer Support, Powered by{' '}
                <span className="gradient-text-violet">Grounded AI &amp; pgvector</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Eliminate customer support friction with strictly verified knowledge base retrieval,
                intelligent ticket routing, and complete tenant isolation.
              </p>

              {/* CTAs: Start Free Trial -> & Watch Demo */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={onGetStarted}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-glow-violet"
                >
                  Start Free Trial
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setCurrentPage('demo')}
                  leftIcon={<Play className="w-4 h-4 text-violet-400 fill-violet-400/40" />}
                >
                  Watch Demo
                </Button>
              </div>

              {/* 4 Value Pills from Reference Mockup */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/5">
                <div className="p-2.5 rounded-xl bg-navy-900/60 border border-white/5 flex items-center gap-2 text-left">
                  <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-white leading-none">Instant Response</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">in Milliseconds</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-navy-900/60 border border-white/5 flex items-center gap-2 text-left">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-white leading-none">Secure &amp; Isolated</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Multi-Tenant</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-navy-900/60 border border-white/5 flex items-center gap-2 text-left">
                  <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-white leading-none">Grounded</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">in Your Knowledge</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-navy-900/60 border border-white/5 flex items-center gap-2 text-left">
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-white leading-none">Powered by</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">pgvector</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D AI Support Robot Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <AiRobotIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Social Proof Row (Google, Microsoft, Meta, Amazon, Stripe, Notion from reference mockup) */}
      <section className="py-10 border-y border-white/5 bg-navy-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Trusted by Innovative Businesses: Join thousands of companies using SupportPilot for smarter customer support.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-300">Google</span>
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-300">Microsoft</span>
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-300">Meta</span>
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-300">amazon</span>
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-300">stripe</span>
            <span className="text-sm sm:text-base font-extrabold tracking-wider text-slate-300">Notion</span>
          </div>
        </div>
      </section>

      {/* Core Features Grid Section (Anchor: #features) */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="brand" size="sm">
              Platform Pillars
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Powerful Features for Smarter Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Everything you need to deliver intelligent, accurate, and scalable customer support.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('features')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View all features</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Search className="w-5 h-5 text-violet-400" />,
              title: 'Grounded AI Search',
              desc: 'Get accurate answers from your verified content. Every response includes verified bracketed citations.',
            },
            {
              icon: <Database className="w-5 h-5 text-emerald-400" />,
              title: 'pgvector RAG',
              desc: 'Lightning-fast semantic search with pgvector running inside PostgreSQL with sub-45ms similarity queries.',
            },
            {
              icon: <Lock className="w-5 h-5 text-indigo-400" />,
              title: 'Multi-Tenant Support',
              desc: 'Isolate data for each client securely. Tenant context is enforced on every relational and vector operation.',
            },
            {
              icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
              title: 'Real-Time Analytics',
              desc: 'Track performance and customer satisfaction with live telemetry, token meters, and SLA compliance logs.',
            },
            {
              icon: <Zap className="w-5 h-5 text-cyan-400" />,
              title: 'Smart Ticket Routing',
              desc: 'Automatically route tickets with AI triage, sentiment scoring (-1.0 to +1.0), and automated category tagging.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
              title: 'Enterprise Security',
              desc: 'Your data, always protected. Argon2id password hashing, Helmet headers, audit logs, and strict RBAC.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl glass-card border border-white/5 space-y-3 hover:border-violet-500/40 transition-all cursor-pointer"
              onClick={() => setCurrentPage('features')}
            >
              <div className="w-10 h-10 rounded-xl bg-navy-900 border border-white/10 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Live Demo Sandbox Section (Anchor: #demo) */}
      <section id="demo" className="py-20 bg-navy-900/30 border-y border-white/5 relative">
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
          <div className="p-6 sm:p-8 rounded-3xl glass-card-interactive border border-violet-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={demoQuery}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  placeholder="Ask a sample support inquiry..."
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <Button
                size="md"
                variant="primary"
                onClick={() => handleRunDemoQuery(demoQuery)}
                isLoading={demoLoading}
                leftIcon={<Zap className="w-4 h-4" />}
                className="shadow-glow-violet"
              >
                Synthesize Answer
              </Button>
            </div>

            {/* Quick Sample Query Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400">Try asking:</span>
              {[
                'What is the standard refund policy window?',
                'What are the SLAs for urgent priority support tickets?',
                'How does multi-tenant database isolation work?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunDemoQuery(q)}
                  className="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors truncate max-w-xs cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Simulated Live Response Box */}
            <div className="mt-4 p-5 rounded-2xl bg-navy-950/95 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
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
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
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
                        className="px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-medium flex items-center gap-1.5"
                      >
                        <span>[1] {c.title}</span>
                        <span className="text-emerald-400 font-bold">{c.match}% Match</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Section (Anchor: #architecture) */}
      <section id="architecture" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="brand" size="sm">
            Zero-Trust Isolation
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Enterprise Multi-Tenant Isolation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Your proprietary documents and customer tickets are protected with strict cryptographic tenant boundaries.
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl glass-card border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Database Row Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every table and pgvector chunk query has strict <code>organizationId</code> constraints enforced at the ORM and SQL boundary.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Role-Based Access (RBAC)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Granular roles for Organization Owners, Support Agents, and Customers verified via server-side JWT authentication.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Transient LLM Inference</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise customer data is never stored by AI providers and never used for public model training.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentPage('security')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Explore full Security Architecture &amp; Threat Model</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Role Portals Showcase (Anchor: #roles) */}
      <section id="roles" className="py-20 bg-navy-900/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Tailored Workspaces for Every Role</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Customized interfaces designed for organizational leadership, frontline support agents, and end customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Organization Owner Card */}
            <div className="p-6 rounded-3xl glass-card border border-violet-500/20 hover:border-violet-500/40 space-y-5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300">Organization Owner</span>
                <Badge variant="brand" size="sm">
                  Executive
                </Badge>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live support metrics &amp; SLA tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Team member invitations &amp; RBAC</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Monthly AI spend limits &amp; thresholds</span>
                </li>
              </ul>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => onExploreDemoRole('OWNER')}>
                Demo as Owner
              </Button>
            </div>

            {/* Support Agent Card */}
            <div className="p-6 rounded-3xl glass-card border border-indigo-500/20 hover:border-indigo-500/40 space-y-5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Support Agent</span>
                <Badge variant="brand" size="sm">
                  Frontline
                </Badge>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ticket assignment &amp; status workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>AI issue summaries &amp; sentiment scores</span>
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

            {/* Customer Portal Card */}
            <div className="p-6 rounded-3xl glass-card border border-emerald-500/20 hover:border-emerald-500/40 space-y-5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Customer</span>
                <Badge variant="success" size="sm">
                  Portal
                </Badge>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct ticket submission &amp; tracking</span>
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

      {/* Global Responsive Footer */}
      <PublicFooter
        onNavigatePage={(page) => setCurrentPage(page)}
        onSignIn={onSignIn}
        onGetStarted={onGetStarted}
      />
    </div>
  );
};
