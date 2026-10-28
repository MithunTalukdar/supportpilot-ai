import { UserProfile, UserMembership, OrgMemberDetail, OrgRole } from '../types/auth.js';
import { ApiResponse } from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return json.data;
}

export async function registerApi(dto: { email: string; password: string; fullName: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<{ user: UserProfile; accessToken: string }>(res);
}

export async function loginApi(dto: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<{ user: UserProfile; memberships: UserMembership[]; accessToken: string }>(res);
}

export async function refreshApi() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<{ accessToken: string }>(res);
}

export async function logoutApi() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<{ message: string }>(res);
}

export async function getMeApi(accessToken: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return handleResponse<{ user: UserProfile; memberships: UserMembership[] }>(res);
}

export async function createOrgApi(accessToken: string, dto: { name: string; slug: string; domain?: string }) {
  const res = await fetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dto),
  });
  return handleResponse<{ id: string; name: string; slug: string; role: OrgRole }>(res);
}

export async function listMembersApi(accessToken: string, orgId: string) {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/members`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<OrgMemberDetail[]>(res);
}

export async function addMemberApi(accessToken: string, orgId: string, dto: { email: string; role: OrgRole }) {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify(dto),
  });
  return handleResponse<{ message: string; memberId: string; role: OrgRole }>(res);
}

export async function updateRoleApi(
  accessToken: string,
  orgId: string,
  userId: string,
  role: OrgRole
) {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/members/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
    body: JSON.stringify({ role }),
  });
  return handleResponse<{ message: string; memberId: string; role: OrgRole }>(res);
}

export async function removeMemberApi(accessToken: string, orgId: string, userId: string) {
  const res = await fetch(`${API_BASE}/organizations/${orgId}/members/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': orgId,
    },
  });
  return handleResponse<{ message: string }>(res);
}

export async function recoverAccountApi(email: string) {
  const res = await fetch(`${API_BASE}/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function updateProfileApi(
  accessToken: string,
  data: { fullName?: string; avatarUrl?: string | null }
) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<UserProfile>(res);
}

export async function changePasswordApi(
  accessToken: string,
  data: { currentPassword: string; newPassword: string }
) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<{ message: string }>(res);
}

