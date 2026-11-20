import React from 'react';
import { Sun, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { SupportPilotLogo } from '../common/SupportPilotLogo.js';
import { Button } from '../ui/Button.js';
import { useTheme } from '../../context/ThemeContext.js';

export type PublicPageId =
  | 'home'
  | 'features'
  | 'demo'
  | 'security'
  | 'pricing'
  | 'about'
  | 'faq'
  | 'contact';

interface PublicNavbarProps {
  currentPage: PublicPageId;
  onNavigatePage: (page: PublicPageId) => void;
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreDemoRole: (role: 'OWNER' | 'AGENT' | 'CUSTOMER') => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentPage,
  onNavigatePage,
  onGetStarted,
  onSignIn,
  onExploreDemoRole,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <SupportPilotLogo onClick={() => onNavigatePage('home')} />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <button
            onClick={() => onNavigatePage('home')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'home' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigatePage('features')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'features' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => onNavigatePage('pricing')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'pricing' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => onNavigatePage('demo')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'demo' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            Interactive Demo
          </button>
          <button
            onClick={() => onNavigatePage('security')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'security' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            Security Architecture
          </button>
          <a
            href="#roles"
            className="transition-colors cursor-pointer hover:text-white"
          >
            Role Portals
          </a>
          <button
            onClick={() => onNavigatePage('about')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'about' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            About
          </button>
          <button
            onClick={() => onNavigatePage('faq')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'faq' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => onNavigatePage('contact')}
            className={`transition-colors cursor-pointer ${
              currentPage === 'contact' ? 'text-violet-400 font-bold' : 'hover:text-white'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Launcher dropdown / pills */}
          <div className="hidden xl:flex items-center gap-1.5 p-1 rounded-xl bg-navy-900/80 border border-white/5 text-[11px]">
            <span className="text-slate-400 font-medium px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" /> Demo:
            </span>
            <button
              onClick={() => onExploreDemoRole('OWNER')}
              className="px-2 py-0.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Owner
            </button>
            <button
              onClick={() => onExploreDemoRole('AGENT')}
              className="px-2 py-0.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Agent
            </button>
            <button
              onClick={() => onExploreDemoRole('CUSTOMER')}
              className="px-2 py-0.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Customer
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Auth Action Buttons */}
          <Button size="sm" variant="ghost" onClick={onSignIn}>
            Sign In
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onGetStarted}
            className="shadow-glow-violet"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </header>
  );
};
