import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl overflow-hidden',
        hoverable ? 'glass-card cursor-pointer' : 'glass-panel',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className }) => (
  <div className={clsx('flex items-center justify-between p-5 border-b border-white/5', className)}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={clsx('p-5', className)}>{children}</div>;
