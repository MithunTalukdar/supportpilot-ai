import React from 'react';
import { CheckCircle2, Sparkles, Shield, HeartHandshake, Zap, Target } from 'lucide-react';
import { BoardroomHologramVisual } from '../common/IllustrationGraphics.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';

interface AboutPageProps {
  onBackToHome: () => void;
  onGetStarted: () => void;
  onContactUs: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onBackToHome,
  onGetStarted,
  onContactUs,
}) => {
  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={onBackToHome} className="hover:text-violet-400 transition-colors cursor-pointer">
          Home
        </button>
        <span>&gt;</span>
        <span className="text-white font-semibold">About</span>
      </nav>

      {/* Hero Header & Boardroom Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Pioneering Grounded Support Automation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Building the future of <br />
            <span className="gradient-text-violet">intelligent customer support.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            SupportPilot is an advanced AI-powered support platform designed to help businesses automate
            customer support with grounded AI, pgvector, and secure multi-tenant architecture.
          </p>

          {/* Three Key Highlights from Mockup */}
          <div className="space-y-3 pt-2">
            {[
              'Built with modern technologies (React 18, PostgreSQL 16+, pgvector)',
              'Trusted by industry leaders worldwide for zero-hallucination accuracy',
              'Focused on your success with human-in-the-loop copilot workflows',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Our Mission Card (From mockup) */}
          <div className="p-5 rounded-2xl glass-card-interactive border border-violet-500/25 shadow-glow-card space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-300 uppercase tracking-wider">
              <Target className="w-4 h-4 text-violet-400" />
              <span>Our Mission</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our mission is to make customer support smarter, faster, and more human—giving teams superpowers
              with artificial intelligence while guaranteeing absolute data privacy and accuracy.
            </p>
          </div>
        </div>

        {/* Boardroom Hologram Visual on Right */}
        <div className="lg:col-span-6 flex justify-center">
          <BoardroomHologramVisual className="w-full max-w-lg" />
        </div>
      </div>

      {/* Core Company Values Matrix */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <Badge variant="brand" size="sm">
            Our Core Tenets
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How We Build SupportPilot</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We believe enterprise AI must be auditable, grounded, and privacy-first from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 border border-white/10 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Strict Data Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never let AI hallucinate answers. If the knowledge base does not contain the answer,
              SupportPilot seamlessly routes the inquiry to a human agent.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 border border-white/10 flex items-center justify-center text-violet-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Sub-Second Performance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customer support demands real-time responsiveness. Our vector pipelines and caching
              guarantee response syntheses in milliseconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 border border-white/10 flex items-center justify-center text-cyan-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Human Copilot Synergy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI shouldn&apos;t replace customer support specialists—it should automate their tedious tasks
              so they can build lasting relationships with customers.
            </p>
          </div>
        </div>
      </div>

      {/* Action CTA Banner */}
      <div className="p-8 sm:p-10 rounded-3xl glass-card border border-white/10 text-center space-y-4 max-w-3xl mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-white">Ready to elevate your customer support?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Join hundreds of companies accelerating their support operations with SupportPilot AI.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button size="md" variant="primary" onClick={onGetStarted}>
            Get Started Free
          </Button>
          <Button size="md" variant="secondary" onClick={onContactUs}>
            Contact Our Team
          </Button>
        </div>
      </div>
    </div>
  );
};
