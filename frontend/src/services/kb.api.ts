import {
  KnowledgeDocumentItem,
  ChunkSearchResultItem,
  DocumentStatus,
} from '../types/kb.js';
import { ApiResponse } from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/v1';

export interface ListDocumentsResponse {
  documents: KnowledgeDocumentItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export async function uploadDocumentApi(
  accessToken: string,
  orgId: string,
  file: File,
  title?: string
): Promise<KnowledgeDocumentItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (title?.trim()) {
    formData.append('title', title.trim());
  }

  const res = await fetch(`${API_BASE}/organizations/${orgId}/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: formData,
  });

  return handleResponse<KnowledgeDocumentItem>(res);
}

export async function listDocumentsApi(
  accessToken: string,
  orgId: string,
  query: { page?: number; limit?: number; status?: DocumentStatus | ''; search?: string } = {}
): Promise<ListDocumentsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.status) params.set('status', query.status);
  if (query.search?.trim()) params.set('search', query.search.trim());

  const url = `${API_BASE}/organizations/${orgId}/documents?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to fetch documents (Status ${res.status})`);
  }

  return {
    documents: json.data,
    meta: json.meta || { page: 1, limit: 20, total: json.data.length, totalPages: 1 },
  };
}

export async function getDocumentApi(
  accessToken: string,
  orgId: string,
  docId: string
): Promise<KnowledgeDocumentItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/documents/${docId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<KnowledgeDocumentItem>(res);
}

export async function reprocessDocumentApi(
  accessToken: string,
  orgId: string,
  docId: string
): Promise<KnowledgeDocumentItem> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/documents/${docId}/retry`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<KnowledgeDocumentItem>(res);
}

export async function deleteDocumentApi(
  accessToken: string,
  orgId: string,
  docId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/documents/${docId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

export async function searchKnowledgeBaseApi(
  accessToken: string,
  orgId: string,
  query: string,
  options?: { limit?: number; threshold?: number }
): Promise<ChunkSearchResultItem[]> {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/documents/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify({
      query,
      limit: options?.limit || 5,
      threshold: options?.threshold ?? 0.4,
    }),
  });
  return handleResponse<ChunkSearchResultItem[]>(res);
}
