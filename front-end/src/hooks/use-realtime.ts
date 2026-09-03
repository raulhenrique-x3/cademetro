import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import NativeEventSource from 'react-native-sse';
import { API_BASE_URL } from '@/api/client';
import { LineStatusDto, ReportDto, StationStatusDto } from '@/api/types';
import { reportKeys } from '@/features/reports/queries';
import { statusKeys } from '@/features/status/queries';

export interface UseRealtimeOptions {
  lineId?: number;
  stationId?: number;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { lineId, stationId, enabled = true } = options;
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetchSnapshots = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
    queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // react-native-sse: XHR-based EventSource for native; browser EventSource on web
    const createEventSource = (url: string): any => {
      if (Platform.OS === 'web' && typeof globalThis.EventSource !== 'undefined') {
        return new globalThis.EventSource(url);
      }
      return new NativeEventSource(url);
    };

    let url = `${API_BASE_URL}/events`;
    const params = new URLSearchParams();
    if (typeof lineId === 'number') params.append('lineId', String(lineId));
    if (typeof stationId === 'number') params.append('stationId', String(stationId));
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }

    const connect = () => {
      try {
        const es = createEventSource(url);
        eventSourceRef.current = es;

        es.addEventListener('open', () => {
          setIsConnected(true);
          setError(null);
          // On reconnection, refresh snapshot to avoid missing events
          refetchSnapshots();
        });

        es.addEventListener('error', () => {
          setIsConnected(false);
          setError('Conexão em tempo real perdida. Tentando reconectar...');
          es.close();

          // Exponential backoff or standard reconnect
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        });

        // Listen for named SSE events sent by NestJS
        es.addEventListener('report.created', (e: MessageEvent) => {
          try {
            const data: ReportDto = JSON.parse(e.data);
            queryClient.setQueriesData<any>(
              { queryKey: ['reports', 'recent'] },
              (old: any) => {
                if (!old) return { reports: [data], total: 1 };
                if (old.reports.some((r: ReportDto) => r.id === data.id)) return old;
                return {
                  reports: [data, ...old.reports],
                  total: old.total + 1,
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });

        es.addEventListener('report.confirmed', (e: MessageEvent) => {
          try {
            const data: ReportDto = JSON.parse(e.data);
            queryClient.setQueryData(reportKeys.detail(data.id), data);
            queryClient.setQueriesData<any>(
              { queryKey: ['reports', 'recent'] },
              (old: any) => {
                if (!old) return old;
                return {
                  ...old,
                  reports: old.reports.map((r: ReportDto) => (r.id === data.id ? data : r)),
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });

        es.addEventListener('report.disputed', (e: MessageEvent) => {
          try {
            const data: ReportDto = JSON.parse(e.data);
            queryClient.setQueryData(reportKeys.detail(data.id), data);
            queryClient.setQueriesData<any>(
              { queryKey: ['reports', 'recent'] },
              (old: any) => {
                if (!old) return old;
                return {
                  ...old,
                  reports: old.reports.map((r: ReportDto) => (r.id === data.id ? data : r)),
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });

        es.addEventListener('status.updated', (e: MessageEvent) => {
          try {
            const data: LineStatusDto | StationStatusDto = JSON.parse(e.data);
            if ('lineId' in data && data.stationId === null) {
              queryClient.setQueryData(statusKeys.lineStatus(data.lineId), data);
            }
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });
      } catch (err: any) {
        setError(err?.message || 'Erro ao inicializar SSE');
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [urlKey(lineId, stationId), enabled, refetchSnapshots, queryClient]);

  return { isConnected, error, refetchSnapshots };
}

function urlKey(lineId?: number, stationId?: number): string {
  return `${lineId ?? 'all'}-${stationId ?? 'all'}`;
}
