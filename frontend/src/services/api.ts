import { ApiResponse, HealthCheckData } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchHealthStatus(): Promise<HealthCheckData> {
  const response = await fetch(`${API_BASE}/health`, {
    headers: {
      Accept: 'application/json',
    },
  });

  const json: ApiResponse<HealthCheckData> = await response.json();

  if (!json.data) {
    throw new Error(json.error?.message || `Failed to fetch health check (Status ${response.status})`);
  }

  return json.data;
}
