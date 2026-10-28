export type ViewSection =
  | 'dashboard'
  | 'tickets'
  | 'kb'
  | 'chat'
  | 'analytics'
  | 'settings'
  | 'profile'
  | 'health'
  | 'onboarding'
  | 'not-found';

export interface HealthCheckData {
  status: 'UP' | 'DEGRADED';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: {
      status: 'CONNECTED' | 'DISCONNECTED';
      latencyMs?: number;
      message?: string;
    };
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
    requestId?: string;
  };
}
