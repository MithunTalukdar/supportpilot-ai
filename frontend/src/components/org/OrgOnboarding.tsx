import React, { useState } from 'react';
import { ShieldCheck, Building2, Globe, Hash, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';
import { Card, CardContent } from '../ui/Card.js';
import { AlertBanner } from '../ui/AlertBanner.js';

interface OrgOnboardingProps {
  onComplete: () => void;
}

export const OrgOnboarding: React.FC<OrgOnboardingProps> = ({ onComplete }) => {
  const { createOrg } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [ticketPrefix, setTicketPrefix] = useState<string>('SP');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate clean slug from name
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Organization name and slug are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createOrg(name.trim(), slug.trim(), domain.trim() || undefined);
      onComplete();
    } catch (err) {
      setError((err as Error).message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 space-y-6">
        {/* Onboarding Wizard Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-glow mb-2">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Set Up Your Organization Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Create an independent, cryptographically isolated multi-tenant environment.
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step >= 1 ? 'bg-brand-600 text-white shadow-glow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </div>
            <span className={step >= 1 ? 'text-white' : 'text-slate-500'}>Workspace Details</span>
          </div>

          <div className="w-8 h-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step >= 2 ? 'bg-brand-600 text-white shadow-glow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </div>
            <span className={step >= 2 ? 'text-white' : 'text-slate-500'}>Preferences & Launch</span>
          </div>
        </div>

        <Card className="border-white/10 shadow-2xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {error && (
              <AlertBanner
                type="error"
                title="Creation Failed"
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Organization Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Acme Corporation"
                        className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Organization Identifier (Slug)
                    </label>
                    <div className="relative">
                      <span className="text-slate-500 text-xs font-mono absolute left-3 top-2.5">
                        app.supportpilot.io/
                      </span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="acme-corp"
                        className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-40 pr-3 py-2 text-xs text-brand-300 font-mono placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Used to cryptographically isolate all customer tickets, AI embeddings, and documents.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    disabled={!name.trim() || !slug.trim()}
                    onClick={() => setStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Step 2
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Custom Domain (Optional)</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="support.acmecorp.com"
                        className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Ticket Number Prefix</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        maxLength={6}
                        value={ticketPrefix}
                        onChange={(e) => setTicketPrefix(e.target.value.toUpperCase())}
                        placeholder="SP"
                        className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tickets will be generated as #{ticketPrefix}-1001, #{ticketPrefix}-1002.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Security & Isolation Guarantees</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1">
                      <li>• Your account will automatically be assigned as <strong>Organization Owner</strong></li>
                      <li>• Dedicated 1536-dimensional pgvector index partition initialized</li>
                      <li>• Configurable monthly AI spend limit (default $50.00/mo)</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      isLoading={loading}
                      rightIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Initialize Workspace
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
