export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export interface TicketCommentItem {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface TicketItem {
  id: string;
  organizationId: string;
  ticketNumber: number;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  customerId: string;
  assignedAgentId?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  customer: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  assignedAgent?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  commentCount?: number;
  comments?: TicketCommentItem[];
  aiSummary?: string | null;
  aiCategory?: string | null;
  sentimentScore?: number | null;
}

export interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionMinutes: number;
  statusBreakdown: Record<TicketStatus, number>;
  priorityBreakdown: Record<TicketPriority, number>;
}
