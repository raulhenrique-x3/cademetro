import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import NativeEventSource from 'react-native-sse';
import { API_BASE_URL } from '@/api/client';
import { LineStatusDto, ReportDto, StationStatusDto } from '@/api/types';
import { reportKeys } from '@/features/reports/queries';
import { statusKeys } from '@/features/status/queries';
import { useRealtimeContext } from '@/context/realtime-context';

export interface UseRealtimeOptions {
  lineId?: number;
  stationId?: number;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { lineId, stationId, enabled = true } = options;
  const context = useRealtimeContext();

  // If no specific line/station filtering is requested, use the shared root connection!
  const isGlobal = lineId === undefined && stationId === undefined;

  const queryClient = useQueryClient();
  const [localConnected, setLocalConnected] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const eventSourceRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(2000);

  const refetchSnapshots = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
    queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
  }, [queryClient]);

  const scopeKey = urlKey(lineId, stationId);

  useEffect(() => {
    // If global, the root RealtimeProvider handles the singleton connection
    if (isGlobal || !enabled) {
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {
          // ignore
        }
        eventSourceRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalConnected(false);
      return;
    }

    const createEventSource = (url: string): any => {
      if (Platform.OS === 'web' && typeof globalThis.EventSource !== 'undefined') {
        return new globalThis.EventSource(url);
      }
      return new NativeEventSource(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
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
          setLocalConnected(true);
          setLocalError(null);
          retryDelayRef.current = 2000;
          refetchSnapshots();
        });

        es.addEventListener('ping', () => {
          setLocalConnected(true);
          setLocalError(null);
        });

        es.addEventListener('error', () => {
          setLocalConnected(false);
          setLocalError('Conexão em tempo real perdida. Tentando reconectar...');
          try {
            es.close();
          } catch {
            // ignore
          }
          eventSourceRef.current = null;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          const delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(delay * 2, 15000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        });

        es.addEventListener('report.created', (e: any) => {
          try {
            const data: ReportDto = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            queryClient.setQueriesData<any>(
              { queryKey: ['reports', 'recent'] },
              (old: any) => {
                if (!old) return { reports: [data], total: 1 };
                if (old.reports?.some((r: ReportDto) => r.id === data.id)) return old;
                return {
                  reports: [data, ...(old.reports || [])],
                  total: (old.total || 0) + 1,
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });

        es.addEventListener('report.confirmed', (e: any) => {
          try {
            const data: ReportDto = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            queryClient.setQueryData(reportKeys.detail(data.id), data);
            queryClient.setQueriesData<any>(
              { queryKey: ['reports', 'recent'] },
              (old: any) => {
                if (!old) return old;
                return {
                  ...old,
                  reports: old.reports?.map((r: ReportDto) => (r.id === data.id ? data : r)) || [],
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });

        es.addEventListener('report.disputed', (e: any) => {
          try {
            const data: ReportDto = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            queryClient.setQueryData(reportKeys.detail(data.id), data);
            queryClient.setQueriesData<any>(
              { queryKey: ['reports', 'recent'] },
              (old: any) => {
                if (!old) return old;
                return {
                  ...old,
                  reports: old.reports?.map((r: ReportDto) => (r.id === data.id ? data : r)) || [],
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });

        es.addEventListener('status.updated', (e: any) => {
          try {
            const data: LineStatusDto | StationStatusDto =
              typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if ('lineId' in data && (data.stationId === null || data.stationId === undefined)) {
              queryClient.setQueryData(statusKeys.lineStatus(data.lineId), data);
            }
            queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
          } catch {
            refetchSnapshots();
          }
        });
      } catch (err: any) {
        setLocalError(err?.message || 'Erro ao inicializar SSE');
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {
          // ignore
        }
        eventSourceRef.current = null;
      }
      setLocalConnected(false);
    };
  }, [isGlobal, scopeKey, lineId, stationId, enabled, refetchSnapshots, queryClient]);

  if (isGlobal) {
    return {
      isConnected: enabled ? context.isConnected : false,
      error: enabled ? context.error : null,
      refetchSnapshots: context.refetchSnapshots,
    };
  }

  return { isConnected: localConnected, error: localError, refetchSnapshots };
}

function urlKey(lineId?: number, stationId?: number): string {
  return `${lineId ?? 'all'}-${stationId ?? 'all'}`;
}
