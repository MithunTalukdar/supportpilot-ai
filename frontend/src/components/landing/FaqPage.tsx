import React, { useState } from 'react';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { QuestionMarkCubeIllustration } from '../common/IllustrationGraphics.js';
import { Button } from '../ui/Button.js';

interface FaqPageProps {
  onBackToHome: () => void;
  onContactSupport: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onBackToHome, onContactSupport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is SupportPilot?',
      answer:
        'SupportPilot is an enterprise AI customer support and workflow automation SaaS platform. It combines high-speed multi-tenant ticketing workflows with Retrieval-Augmented Generation (RAG) powered by PostgreSQL pgvector, offering automated summaries, triage classification, and grounded AI reply assistance.',
    },
    {
      question: 'How does RAG work?',
      answer:
        'Retrieval-Augmented Generation (RAG) dynamically augments LLMs with your organization’s private knowledge base. When a user submits an inquiry, SupportPilot converts it into a high-dimensional vector, finds the most relevant document chunks via cosine similarity in pgvector, and injects those verified excerpts into the prompt with verified source citations [1].',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes, data security is our highest engineering priority. SupportPilot enforces strict multi-tenant isolation at the database query layer. Every document, vector chunk, and ticket belongs to a specific organization UUID, and queries are cryptographically blocked from ever accessing another tenant’s data.',
    },
    {
      question: 'Can I upgrade later?',
      answer:
        'Absolutely. You can start on our free Starter plan to evaluate the system, and upgrade to Pro or Enterprise at any time with zero data migration or downtime. Billing is prorated automatically.',
    },
    {
      question: 'What LLM models are supported?',
      answer:
        'SupportPilot includes a provider-agnostic AI abstraction layer supporting OpenAI (GPT-4o, text-embedding-3), Google Gemini (Gemini 1.5 Pro / Flash), Anthropic Claude (Claude 3.5 Sonnet), and custom self-hosted LLM endpoints with automated fallback circuit breakers.',
    },
    {
      question: 'How does pgvector compare to standalone vector databases?',
      answer:
        'By utilizing PostgreSQL with the pgvector extension, SupportPilot maintains your relational transactional data (tickets, users, organizations) and vector embeddings in a single atomic database. This eliminates complex dual-write synchronizations, prevents cross-database state drift, and ensures ACID transaction guarantees.',
    },
    {
      question: 'Can human agents override AI suggestions?',
      answer:
        'Yes! SupportPilot is built with a human-in-the-loop philosophy. Agents can review AI-generated summary cards, sentiment indicators, and draft responses, edit them freely, or reject them before sending them to the customer.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={onBackToHome} className="hover:text-violet-400 transition-colors cursor-pointer">
          Home
        </button>
        <span>&gt;</span>
        <span className="text-white font-semibold">FAQ</span>
      </nav>

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Answers to Everything SupportPilot</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Frequently Asked <br />
            <span className="gradient-text-violet">Questions</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Find answers to common questions about SupportPilot architecture, RAG grounding, security
            policies, and enterprise subscriptions.
          </p>

          {/* Search Box */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. RAG, security, pgvector)..."
              className="w-full bg-navy-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* 3D Question Mark Graphic on Right (From mockup) */}
        <div className="lg:col-span-5 flex justify-center">
          <QuestionMarkCubeIllustration />
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="max-w-4xl mx-auto space-y-4 pt-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 glass-card rounded-2xl">
            No questions matched your search query. Try searching for something else or contact our support team.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-200 overflow-hidden border ${
                  isOpen
                    ? 'glass-card-interactive border-violet-500/40 shadow-glow-violet'
                    : 'glass-card border-white/5 hover:border-violet-500/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white cursor-pointer"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-violet-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-violet-300' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions CTA */}
      <div className="p-8 rounded-3xl glass-card border border-white/10 text-center space-y-3 max-w-2xl mx-auto">
        <h3 className="text-base font-bold text-white">Still have questions?</h3>
        <p className="text-xs text-slate-400">
          Can’t find the answer you’re looking for? Our friendly engineering support team is here to help.
        </p>
        <div className="pt-2">
          <Button size="sm" variant="primary" onClick={onContactSupport}>
            Get in Touch With Us
          </Button>
        </div>
      </div>
    </div>
  );
};
