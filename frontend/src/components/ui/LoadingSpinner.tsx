import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={clsx('inline-flex items-center gap-2', className)} role="status">
      <div
        className={clsx(
          'animate-spin rounded-full border-brand-500 border-t-transparent',
          sizeMap[size]
        )}
      />
      {label && <span className="text-sm text-slate-400">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};
