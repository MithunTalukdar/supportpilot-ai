import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  type?: AlertType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  onDismiss,
  action,
  className,
}) => {
  const styles: Record<AlertType, { border: string; bg: string; icon: React.ReactNode; text: string }> = {
    info: {
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
      text: 'text-sky-200',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-200',
      icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    error: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      text: 'text-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start justify-between gap-3 p-4 rounded-xl border backdrop-blur-md transition-all',
        current.bg,
        current.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {current.icon}
        <div>
          <h4 className={clsx('text-sm font-semibold', current.text)}>{title}</h4>
          {message && <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-xs font-semibold text-white underline hover:no-underline cursor-pointer"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
