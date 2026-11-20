import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  onClick?: () => void;
}

export const SupportPilotLogo: React.FC<LogoProps> = ({
  size = 'md',
  showBadge = true,
  badgeText = 'AI SaaS',
  className = '',
  onClick,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 3D Shield / Hexagon Logo Icon */}
      <div
        className={`${iconSizes[size]} relative rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-glow border border-violet-400/30 shrink-0 group`}
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-xl bg-violet-500/20 blur-sm -z-10 group-hover:bg-violet-500/40 transition-colors" />

        {/* Shield with 'S' */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        >
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="fill-white/10"
          />
          <path
            d="M14.5 9.2C14.5 8.2 13.5 7.5 12 7.5C10.5 7.5 9.5 8.2 9.5 9.2C9.5 11.8 14.5 10.8 14.5 13.5C14.5 14.6 13.4 15.5 12 15.5C10.2 15.5 9.3 14.5 9.3 13.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`font-extrabold ${textSizes[size]} tracking-tight gradient-text drop-shadow-sm`}>
          SupportPilot
        </span>
        {showBadge && (
          <span className="text-[10px] text-violet-300 font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 tracking-wide uppercase">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
