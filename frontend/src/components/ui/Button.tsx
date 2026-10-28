import React from 'react';
import { clsx } from 'clsx';
import { LoadingSpinner } from './LoadingSpinner.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow disabled:opacity-50 disabled:shadow-none',
    secondary:
      'bg-surface-dark hover:bg-slate-700/60 text-slate-200 border border-slate-700 disabled:opacity-50',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white disabled:opacity-40',
    danger:
      'bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/30 disabled:opacity-50',
    warning:
      'bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-500/30 disabled:opacity-50',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 font-medium',
    lg: 'text-base px-6 py-2.5 rounded-xl gap-2.5 font-semibold',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] select-none cursor-pointer disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={size === 'sm' ? 'sm' : 'sm'} />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
