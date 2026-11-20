import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Github, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { SupportPilotLogo } from '../common/SupportPilotLogo.js';
import { PublicPageId } from './PublicNavbar.js';

interface PublicFooterProps {
  onNavigatePage: (page: PublicPageId) => void;
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavigatePage,
  onSignIn,
  onGetStarted,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="border-t border-white/5 bg-navy-950 pt-16 pb-12 text-slate-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/5">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <SupportPilotLogo size="lg" onClick={() => onNavigatePage('home')} />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Enterprise customer support platform powered by grounded AI, pgvector embeddings, and
              strict multi-tenant isolation. Eliminate support friction with zero hallucinations.
            </p>
            <div className="flex items-center gap-2 text-xs text-violet-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strict Cryptographic Multi-Tenant Isolation</span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Product</div>
            <ul className="text-xs space-y-2">
              <li>
                <button
                  onClick={() => onNavigatePage('features')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Platform Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage('pricing')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage('demo')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Interactive AI Sandbox
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage('security')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Security &amp; Compliance
                </button>
              </li>
              <li>
                <span className="text-slate-500">Changelog (v2.4)</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Company</div>
            <ul className="text-xs space-y-2">
              <li>
                <button
                  onClick={() => onNavigatePage('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About SupportPilot
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </li>
              <li>
                <span className="text-slate-500">Careers</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Stay Updated / Newsletter */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Stay Updated</div>
            <p className="text-xs text-slate-400">
              Get the latest AI support engineering updates and release notes.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white shadow-glow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {subscribed && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  ✓ Thank you for subscribing!
                </div>
              )}
            </form>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="X Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Discord Community"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>© 2026 SupportPilot. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigatePage('security')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigatePage('security')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <button onClick={onSignIn} className="hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={onGetStarted} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
