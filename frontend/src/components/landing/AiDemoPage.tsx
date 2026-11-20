import React, { useState } from 'react';
import {
  Search,
  Zap,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';

interface AiDemoPageProps {
  onBackToHome: () => void;
  onGetStarted: () => void;
}

export const AiDemoPage: React.FC<AiDemoPageProps> = ({ onBackToHome, onGetStarted }) => {
  const [demoQuery, setDemoQuery] = useState('What is the standard refund policy window?');
  const [demoAnswer, setDemoAnswer] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoCitations, setDemoCitations] = useState<
    Array<{ title: string; match: number; snippet: string; chunkId: string }>
  >([]);
  const [metrics, setMetrics] = useState({ latency: 42, tokens: 184, confidence: 96 });

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
            chunkId: 'chk_ref_9921',
          },
        ]);
        setMetrics({ latency: 38, tokens: 165, confidence: 94 });
      } else if (queryText.toLowerCase().includes('sla') || queryText.toLowerCase().includes('urgent')) {
        setDemoAnswer(
          'According to our Support SLA Guidelines, Urgent priority tickets receive a 1-hour first response time, with 24/7 dedicated engineering support [1]. Standard priority tickets are responded to within 4 business hours.'
        );
        setDemoCitations([
          {
            title: 'Support SLA Guidelines',
            match: 91,
            snippet: 'Urgent priority tickets receive a 1-hour first response SLA and dedicated engineer routing.',
            chunkId: 'chk_sla_4412',
          },
        ]);
        setMetrics({ latency: 45, tokens: 198, confidence: 91 });
      } else {
        setDemoAnswer(
          'Based on our Knowledge Base, SupportPilot AI enforces multi-tenant boundary isolation at the database level [1]. All vector embeddings are partitioned by organization ID in PostgreSQL with pgvector.'
        );
        setDemoCitations([
          {
            title: 'Multi-Tenant Architecture Guide',
            match: 88,
            snippet: 'Cross-tenant vector search is cryptographically isolated via organizationId constraints.',
            chunkId: 'chk_sec_1048',
          },
        ]);
        setMetrics({ latency: 41, tokens: 210, confidence: 88 });
      }
      setDemoLoading(false);
    }, 600);
  };

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={onBackToHome} className="hover:text-violet-400 transition-colors cursor-pointer">
          Home
        </button>
        <span>&gt;</span>
        <span className="text-white font-semibold">Interactive Demo</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="brand" size="sm">
          Live Sandbox Preview
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Experience Real-Time <br />
          <span className="gradient-text-violet">RAG Grounding</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Test semantic search and LLM synthesis. Every answer is grounded in knowledge documents with verified source citations.
        </p>
      </div>

      {/* Live Sandbox Interactive Container */}
      <div className="p-6 sm:p-10 rounded-3xl glass-card-interactive border border-violet-500/30 shadow-glow-card max-w-4xl mx-auto space-y-6">
        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={demoQuery}
              onChange={(e) => setDemoQuery(e.target.value)}
              placeholder="Ask a sample support inquiry..."
              className="w-full bg-navy-950/90 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <Button
            size="md"
            variant="primary"
            onClick={() => handleRunDemoQuery(demoQuery)}
            isLoading={demoLoading}
            leftIcon={<Zap className="w-4 h-4" />}
            className="shadow-glow-violet shrink-0"
          >
            Synthesize Answer
          </Button>
        </div>

        {/* Suggested Queries */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Try asking:</span>
          {[
            'What is the standard refund policy window?',
            'What are the SLAs for urgent priority support tickets?',
            'How does multi-tenant database isolation work?',
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleRunDemoQuery(q)}
              className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer truncate max-w-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Live Synthesized AI Response Card */}
        <div className="mt-6 p-6 rounded-2xl bg-navy-950/95 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-glow">
                AI
              </div>
              <div>
                <span className="text-xs font-bold text-white">SupportPilot Copilot</span>
                <span className="text-[10px] text-slate-400 ml-2">gpt-4o / pgvector-1536</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {metrics.latency}ms latency
              </span>
              <Badge variant="success" size="sm">
                Grounded in pgvector
              </Badge>
            </div>
          </div>

          {demoLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <span>Scanning pgvector 1536-d embeddings and validating citations...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {demoAnswer ||
                  'Based on our Refund Policy Guide, standard refunds are processed strictly within 30 days of purchase to the original payment method [1]. If your subscription was charged during an outage, our support team can issue an expedited pro-rata refund upon review.'}
              </p>

              {/* Supporting Verified Citations */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                    Verified Sources:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Confidence: {metrics.confidence}%
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(demoCitations.length > 0
                    ? demoCitations
                    : [
                        {
                          title: 'Refund Policy Guide 2026',
                          match: 94,
                          snippet: 'SupportPilot standard refund window is strictly 30 days from purchase date.',
                          chunkId: 'chk_ref_9921',
                        },
                      ]
                  ).map((c, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs flex flex-col gap-1 max-w-md"
                    >
                      <div className="flex items-center justify-between gap-3 font-semibold text-white">
                        <span>[1] {c.title}</span>
                        <span className="text-emerald-400 text-[11px] font-bold">{c.match}% Match</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">&ldquo;{c.snippet}&rdquo;</p>
                      <span className="text-[9px] text-slate-500 font-mono">Chunk: {c.chunkId}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RAG Grounding Explanation Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="text-xs font-bold text-violet-300 uppercase tracking-wider">Semantic Chunking</div>
          <h3 className="text-sm font-bold text-white">Contextual Sliding Window</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uploaded manuals, FAQs, and API docs are parsed into 500-token semantic chunks with 50-token overlaps, preserving full sentence integrity.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">pgvector HNSW</div>
          <h3 className="text-sm font-bold text-white">Sub-50ms Nearest Neighbors</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            High-dimensional OpenAI embeddings (1536-d) are indexed with Hierarchical Navigable Small World (HNSW) graphs directly in PostgreSQL.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Zero Hallucinations</div>
          <h3 className="text-sm font-bold text-white">Strict Citation Fallback</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            If cosine similarity falls below the configured 70% threshold, the LLM refuses to speculate and escalates directly to human agents.
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="text-center pt-4">
        <Button size="md" variant="primary" onClick={onGetStarted} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Deploy This Grounded Copilot For Your Team &rarr;
        </Button>
      </div>
    </div>
  );
};
