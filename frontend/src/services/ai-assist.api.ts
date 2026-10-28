import {
  TicketSummaryResult,
  TicketClassificationResult,
  SuggestedReplyResult,
  AiUsageRecordItem,
  AiUsageSummary,
  AiSettings,
} from '../types/ai.js';
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

export async function summarizeTicketApi(
  accessToken: string,
  orgId: string,
  ticketId: string
): Promise<TicketSummaryResult> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/ai/tickets/${ticketId}/summarize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  return handleResponse<TicketSummaryResult>(res);
}

export async function classifyTicketApi(
  accessToken: string,
  orgId: string,
  ticketId: string
): Promise<TicketClassificationResult> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/ai/tickets/${ticketId}/classify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  return handleResponse<TicketClassificationResult>(res);
}

export async function suggestReplyApi(
  accessToken: string,
  orgId: string,
  ticketId: string
): Promise<SuggestedReplyResult> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/ai/tickets/${ticketId}/suggest-reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  return handleResponse<SuggestedReplyResult>(res);
}

export interface GetAiUsageLedgerResponse {
  records: AiUsageRecordItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: AiUsageSummary;
}

export async function getAiUsageLedgerApi(
  accessToken: string,
  orgId: string,
  query: { feature?: string; page?: number; limit?: number } = {}
): Promise<GetAiUsageLedgerResponse> {
  const params = new URLSearchParams();
  if (query.feature) params.append('feature', query.feature);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  const url = `${API_BASE}/organizations/${orgId}/ai/usage?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch AI usage ledger');
  }

  return {
    records: json.data,
    meta: json.meta,
    summary: json.summary,
  };
}

export async function getAiSettingsApi(
  accessToken: string,
  orgId: string
): Promise<AiSettings> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/ai/settings`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  return handleResponse<AiSettings>(res);
}

export async function updateAiSettingsApi(
  accessToken: string,
  orgId: string,
  updates: Partial<AiSettings>
): Promise<AiSettings> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/ai/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify(updates),
  });

  return handleResponse<AiSettings>(res);
}
