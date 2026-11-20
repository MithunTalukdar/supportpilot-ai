import React from 'react';
import { Home, LifeBuoy } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { ViewSection } from '../../types/index.js';
import { NotFoundRobotIllustration } from './IllustrationGraphics.js';

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
      <div className="max-w-md w-full glass-card-interactive p-8 rounded-3xl text-center space-y-6 border border-violet-500/25 shadow-glow-card relative overflow-hidden">
        {/* 3D 404 Robot Graphic */}
        <div className="flex justify-center -mb-2">
          <NotFoundRobotIllustration className="scale-75 origin-center" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30">
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
            className="w-full sm:w-auto shadow-glow-violet"
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
