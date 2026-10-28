import React from 'react';
import { Badge, BadgeVariant } from '../ui/Badge.js';
import { DocumentStatus } from '../../types/kb.js';
import {
  Clock,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

export const DocumentStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<
    DocumentStatus,
    { label: string; variant: BadgeVariant; icon: React.ReactNode }
  > = {
    PENDING: {
      label: 'Pending Ingestion',
      variant: 'info',
      icon: <Clock className="w-3 h-3 text-sky-400" />,
    },
    PROCESSING: {
      label: 'Chunking & Embedding...',
      variant: 'warning',
      icon: <RotateCw className="w-3 h-3 text-amber-400 animate-spin" />,
    },
    INDEXED: {
      label: 'Indexed in pgvector',
      variant: 'success',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
    },
    FAILED: {
      label: 'Ingestion Failed',
      variant: 'error',
      icon: <AlertTriangle className="w-3 h-3 text-rose-400" />,
    },
  };

  const item = config[status] || {
    label: status,
    variant: 'neutral',
    icon: <Clock className="w-3 h-3" />,
  };

  return (
    <Badge variant={item.variant} size={size} className="gap-1.5 font-medium whitespace-nowrap">
      {item.icon}
      <span>{item.label}</span>
    </Badge>
  );
};
