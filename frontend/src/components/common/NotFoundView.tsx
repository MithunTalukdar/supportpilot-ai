import React from 'react';
import { Compass, Home, LifeBuoy } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { ViewSection } from '../../types/index.js';

interface NotFoundViewProps {
  onNavigateHome: (section: ViewSection) => void;
  title?: string;
  message?: string;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onNavigateHome,
  title = 'Page or Resource Not Found',
  message = 'The section or resource you requested could not be found or may have been relocated or deleted.',
}) => {
  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-glow">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-400 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
            HTTP 404 • Missing Resource
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-2">{title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => onNavigateHome('dashboard')}
            leftIcon={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Return to Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigateHome('tickets')}
            leftIcon={<LifeBuoy className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Support Tickets
          </Button>
        </div>
      </div>
    </div>
  );
};
