import React from 'react';
import { Home } from 'lucide-react';
import { NotFoundRobotIllustration } from '../common/IllustrationGraphics.js';
import { Button } from '../ui/Button.js';

interface NotFoundPublicPageProps {
  onBackToHome: () => void;
}

export const NotFoundPublicPage: React.FC<NotFoundPublicPageProps> = ({ onBackToHome }) => {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4 text-center space-y-8 font-sans">
      {/* 3D Robot Illustration with ? block */}
      <div className="flex justify-center">
        <NotFoundRobotIllustration />
      </div>

      <div className="space-y-3">
        <div className="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 tracking-tight">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          The page you are looking for doesn&apos;t exist, has been removed, or is currently unavailable.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <Button
          size="md"
          variant="primary"
          onClick={onBackToHome}
          leftIcon={<Home className="w-4 h-4" />}
          className="shadow-glow-violet"
        >
          Go Home &rarr;
        </Button>
      </div>
    </div>
  );
};
