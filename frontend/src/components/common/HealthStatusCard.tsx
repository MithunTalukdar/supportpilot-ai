import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Database, Cpu, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { HealthCheckData } from '../../types/index.js';
import { fetchHealthStatus } from '../../services/api.js';

export const HealthStatusCard: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthStatus();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError((err as Error).message || 'Failed to connect to backend API server');
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    // Poll every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  return (
    <Card className="border-brand-500/20">
      <CardHeader
        title="Backend Health & System Diagnostics"
        subtitle="Real-time telemetry and database connection status"
        icon={<Activity className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            {health && (
              <Badge variant={health.status === 'UP' ? 'success' : 'warning'} dot>
                {health.status === 'UP' ? 'Operational' : 'Degraded'}
              </Badge>
            )}
            <Button
              size="sm"
              variant="secondary"
              isLoading={loading}
              onClick={loadHealth}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />
      <CardContent>
        {loading && !health && !error && (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">Pinging backend health endpoint...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">Connection Probe Unsuccessful</div>
              <div className="text-xs text-slate-400 mt-1">{error}</div>
              <p className="text-xs text-slate-500 mt-2">
                Make sure the backend is running (`npm run dev:backend`) on port 5000.
              </p>
            </div>
          </div>
        )}

        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Metric */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Database className="w-4 h-4 text-brand-400" />
                  PostgreSQL / pgvector
                </span>
                <Badge
                  variant={health.services.database.status === 'CONNECTED' ? 'success' : 'warning'}
                  size="sm"
                >
                  {health.services.database.status}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {health.services.database.status === 'CONNECTED' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{health.services.database.latencyMs ?? '< 5'} ms</span>
                    </>
                  ) : (
                    <span className="text-xs text-amber-300 font-normal">
                      {health.services.database.message || 'Offline / Unreachable'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Ping Latency</div>
              </div>
            </div>

            {/* Memory RSS */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Server Memory (RSS)
                </span>
                <Badge variant="neutral" size="sm">
                  Heap: {health.services.memory.heapUsedMb} MB
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-100">
                  {health.services.memory.rssMb} <span className="text-xs text-slate-400 font-normal">MB</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Resident Set Size</div>
              </div>
            </div>

            {/* Uptime */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Process Uptime
                </span>
                <Badge variant="info" size="sm">
                  {health.environment}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-100">
                  {Math.floor(health.uptimeSeconds / 60)}m {health.uptimeSeconds % 60}s
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Continuous runtime</div>
              </div>
            </div>

            {/* Verification Timestamp */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Telemetry Sync
                </span>
                <span className="text-[10px] text-slate-500">Live</span>
              </div>
              <div className="mt-2">
                <div className="text-sm font-semibold text-slate-200">{lastChecked}</div>
                <div className="text-[10px] text-slate-500 mt-1">Autopoll interval: 30s</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
