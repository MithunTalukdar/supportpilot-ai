import React from 'react';
import { Badge, BadgeVariant } from '../ui/Badge.js';
import { TicketPriority, TicketStatus } from '../../types/ticket.js';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  Archive,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
} from 'lucide-react';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export const TicketStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<
    TicketStatus,
    { label: string; variant: BadgeVariant; icon: React.ReactNode }
  > = {
    OPEN: {
      label: 'Open',
      variant: 'brand',
      icon: <HelpCircle className="w-3 h-3 text-brand-400" />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      variant: 'info',
      icon: <Clock className="w-3 h-3 text-sky-400" />,
    },
    WAITING_FOR_CUSTOMER: {
      label: 'Waiting for Customer',
      variant: 'warning',
      icon: <Clock className="w-3 h-3 text-amber-400" />,
    },
    RESOLVED: {
      label: 'Resolved',
      variant: 'success',
      icon: <CheckCircle className="w-3 h-3 text-emerald-400" />,
    },
    CLOSED: {
      label: 'Closed',
      variant: 'neutral',
      icon: <Archive className="w-3 h-3 text-slate-400" />,
    },
  };

  const item = config[status] || {
    label: status,
    variant: 'neutral',
    icon: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <Badge variant={item.variant} size={size} className="gap-1.5 font-medium whitespace-nowrap">
      {item.icon}
      <span>{item.label}</span>
    </Badge>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export const TicketPriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const config: Record<
    TicketPriority,
    { label: string; variant: BadgeVariant; icon: React.ReactNode }
  > = {
    URGENT: {
      label: 'Urgent',
      variant: 'error',
      icon: <Flame className="w-3 h-3 text-rose-400 animate-pulse" />,
    },
    HIGH: {
      label: 'High',
      variant: 'warning',
      icon: <ArrowUp className="w-3 h-3 text-amber-400" />,
    },
    MEDIUM: {
      label: 'Medium',
      variant: 'info',
      icon: <Minus className="w-3 h-3 text-sky-400" />,
    },
    LOW: {
      label: 'Low',
      variant: 'neutral',
      icon: <ArrowDown className="w-3 h-3 text-slate-400" />,
    },
  };

  const item = config[priority] || {
    label: priority,
    variant: 'neutral',
    icon: <Minus className="w-3 h-3" />,
  };

  return (
    <Badge variant={item.variant} size={size} className="gap-1.5 font-medium whitespace-nowrap">
      {item.icon}
      <span>{item.label}</span>
    </Badge>
  );
};
