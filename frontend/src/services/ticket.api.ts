import { TicketItem, TicketMetrics, TicketCommentItem, TicketPriority, TicketStatus } from '../types/ticket.js';
import { ApiResponse } from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/v1';

export interface ListTicketsQuery {
  page?: number;
  limit?: number;
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  category?: string;
  search?: string;
  assignedAgentId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ListTicketsResponse {
  tickets: TicketItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTicketDto {
  title: string;
  description: string;
  category: string;
  priority?: TicketPriority;
  tags?: string[];
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedAgentId?: string | null;
}

export interface AddCommentDto {
  content: string;
  isInternal?: boolean;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    (err as unknown as { code?: string }).code = json.error?.code;
    throw err;
  }
  return json.data;
}

export async function listTicketsApi(
  accessToken: string,
  orgId: string,
  query: ListTicketsQuery = {}
): Promise<ListTicketsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  if (query.category) params.set('category', query.category);
  if (query.search) params.set('search', query.search);
  if (query.assignedAgentId) params.set('assignedAgentId', query.assignedAgentId);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const url = `${API_BASE}/organizations/${orgId}/tickets?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to fetch tickets (Status ${res.status})`);
  }

  return {
    tickets: json.data,
    meta: json.meta || { page: 1, limit: 10, total: json.data.length, totalPages: 1 },
  };
}

export async function getTicketApi(
  accessToken: string,
  orgId: string,
  ticketId: string
): Promise<TicketItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/tickets/${ticketId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<TicketItem>(res);
}

export async function createTicketApi(
  accessToken: string,
  orgId: string,
  dto: CreateTicketDto
): Promise<TicketItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify(dto),
  });
  return handleResponse<TicketItem>(res);
}

export async function updateTicketApi(
  accessToken: string,
  orgId: string,
  ticketId: string,
  dto: UpdateTicketDto
): Promise<TicketItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify(dto),
  });
  return handleResponse<TicketItem>(res);
}

export async function getTicketMetricsApi(
  accessToken: string,
  orgId: string
): Promise<TicketMetrics> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/tickets/metrics`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<TicketMetrics>(res);
}

export async function addCommentApi(
  accessToken: string,
  orgId: string,
  ticketId: string,
  dto: AddCommentDto
): Promise<TicketCommentItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify(dto),
  });
  return handleResponse<TicketCommentItem>(res);
}

export async function listCommentsApi(
  accessToken: string,
  orgId: string,
  ticketId: string
): Promise<TicketCommentItem[]> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/tickets/${ticketId}/comments`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<TicketCommentItem[]>(res);
}
