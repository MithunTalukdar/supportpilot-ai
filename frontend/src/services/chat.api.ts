import { ChatConversationItem, ChatMessageItem, ChatChannel } from '../types/chat.js';
import { ApiResponse } from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/v1';

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

export interface ListConversationsResponse {
  items: ChatConversationItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export async function createConversationApi(
  accessToken: string,
  orgId: string,
  dto: { title?: string; channel?: ChatChannel; ticketId?: string }
): Promise<ChatConversationItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify(dto),
  });

  return handleResponse<ChatConversationItem>(res);
}

export async function listConversationsApi(
  accessToken: string,
  orgId: string,
  query: { ticketId?: string; customerId?: string; limit?: number; offset?: number } = {}
): Promise<ListConversationsResponse> {
  const params = new URLSearchParams();
  if (query.ticketId) params.append('ticketId', query.ticketId);
  if (query.customerId) params.append('customerId', query.customerId);
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.offset) params.append('offset', query.offset.toString());

  const url = `${API_BASE}/organizations/${orgId}/chat?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to list conversations');
  }

  return {
    items: json.data,
    pagination: json.pagination,
  };
}

export async function getConversationApi(
  accessToken: string,
  orgId: string,
  conversationId: string
): Promise<ChatConversationItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/chat/${conversationId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  return handleResponse<ChatConversationItem>(res);
}

export async function sendMessageApi(
  accessToken: string,
  orgId: string,
  conversationId: string,
  content: string
): Promise<{ userMessage: ChatMessageItem; botMessage: ChatMessageItem }> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/chat/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify({ content }),
  });

  return handleResponse<{ userMessage: ChatMessageItem; botMessage: ChatMessageItem }>(res);
}

export async function deleteConversationApi(
  accessToken: string,
  orgId: string,
  conversationId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/chat/${conversationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  return handleResponse<{ success: boolean }>(res);
}
