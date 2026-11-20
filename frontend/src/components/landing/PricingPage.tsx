import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { CrownIllustration, RocketIllustration } from '../common/IllustrationGraphics.js';
import { Button } from '../ui/Button.js';

interface PricingPageProps {
  onBackToHome: () => void;
  onGetStarted: () => void;
  onContactSales: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToHome,
  onGetStarted,
  onContactSales,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      priceMonthly: 0,
      priceYearly: 0,
      period: '/ month',
      description: 'Perfect for small teams and evaluating support automation.',
      isPopular: false,
      features: [
        'Basic AI Support Assistant',
        '100 Tickets / Month',
        'Single Organization Tenant',
        'Community & Email Support',
        'Standard Response SLA',
        'Knowledge Base Ingestion (Up to 10 Docs)',
      ],
      ctaText: 'Get Started',
      ctaAction: onGetStarted,
      variant: 'secondary' as const,
    },
    {
      name: 'Pro',
      priceMonthly: 29,
      priceYearly: 23,
      period: '/ month',
      description: 'For growing businesses requiring speed, accuracy, and volume.',
      isPopular: true,
      features: [
        'Advanced RAG Search with pgvector',
        '5,000 Tickets / Month',
        'AI Ticket Copilot & Smart Reply Drafting',
        'Sentiment & Urgency Triage Scoring',
        'Priority 24/7 Support Escalation',
        'Unlimited Knowledge Base Ingestion',
        'AI Spend Caps & Token Metering',
      ],
      ctaText: 'Start Free Trial',
      ctaAction: onGetStarted,
      variant: 'primary' as const,
    },
    {
      name: 'Enterprise',
      customPrice: 'Contact Us',
      period: '',
      description: 'For large organizations demanding dedicated compute and compliance.',
      isPopular: false,
      features: [
        'Custom High-Throughput Solutions',
        'Unlimited Monthly Tickets',
        'Dedicated Support Engineer & Slack Channel',
        'Custom LLM Fine-Tuning & Local Model Connectors',
        'HIPAA, SOC2 & GDPR Compliance Data Agreements',
        '99.99% Guaranteed Availability SLA',
        'Custom pgvector HNSW Index Optimization',
      ],
      ctaText: 'Talk to Sales',
      ctaAction: onContactSales,
      variant: 'secondary' as const,
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
        <span className="text-white font-semibold">Pricing</span>
      </nav>

      {/* Header with Crown Illustration */}
      <div className="text-center space-y-6 max-w-3xl mx-auto relative">
        <CrownIllustration className="mx-auto -mb-6" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-glow">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Transparent Enterprise Pricing • No Hidden Token Surprises</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Simple & Transparent <br />
          <span className="gradient-text-violet">Pricing</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Choose the perfect plan for your needs. Scale effortlessly from single-seat triage to
          multi-region enterprise clusters.
        </p>

        {/* Billing Cycle Pill Toggle */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-navy-900 border border-white/10 shadow-inner">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Yearly</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
        {plans.map((p, idx) => {
          const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceYearly;

          return (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                p.isPopular
                  ? 'glass-card-interactive border-2 border-violet-500 shadow-glow-violet scale-[1.02]'
                  : 'glass-card border border-white/5 hover:border-violet-500/30'
              }`}
            >
              {/* Popular glowing badge */}
              {p.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-400 text-white text-[11px] font-bold shadow-glow uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  {p.isPopular && <Sparkles className="w-5 h-5 text-violet-400" />}
                </div>

                <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{p.description}</p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-white/10">
                  {p.customPrice ? (
                    <div className="text-3xl sm:text-4xl font-extrabold text-white">
                      {p.customPrice}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white">
                        ${price}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{p.period}</span>
                    </div>
                  )}
                  {billingCycle === 'yearly' && !p.customPrice && (
                    <div className="text-[11px] text-emerald-400 mt-1">
                      Billed annually ($276/year)
                    </div>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 text-xs text-slate-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Action Button */}
              <div className="pt-8">
                <Button
                  size="md"
                  variant={p.variant}
                  className="w-full"
                  onClick={p.ctaAction}
                >
                  {p.ctaText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Need a Custom Solution Banner (Bottom of Pricing in reference image) */}
      <div className="p-8 sm:p-10 rounded-3xl glass-card-interactive border border-violet-500/25 shadow-glow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <RocketIllustration />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Need a Custom Solution?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Let&apos;s build the perfect plan for your business. Dedicated vector clusters, custom models, and enterprise SLAs.
            </p>
          </div>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={onContactSales}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="shrink-0"
        >
          Contact Sales &rarr;
        </Button>
      </div>
    </div>
  );
};
