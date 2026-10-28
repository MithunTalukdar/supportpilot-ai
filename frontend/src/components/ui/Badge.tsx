import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
}) => {
  const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
    success: {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    warning: {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    error: {
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    info: {
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      dot: 'bg-sky-400',
    },
    neutral: {
      badge: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      dot: 'bg-slate-400',
    },
    brand: {
      badge: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
      dot: 'bg-brand-400',
    },
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        variantStyles[variant].badge,
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            variantStyles[variant].dot
          )}
        />
      )}
      {children}
    </span>
  );
};
