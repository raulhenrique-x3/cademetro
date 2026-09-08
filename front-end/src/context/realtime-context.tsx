import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import NativeEventSource from 'react-native-sse';
import { API_BASE_URL } from '@/api/client';
import { LineStatusDto, ReportDto, StationStatusDto } from '@/api/types';
import { reportKeys } from '@/features/reports/queries';
import { statusKeys } from '@/features/status/queries';

export interface RealtimeContextType {
  isConnected: boolean;
  error: string | null;
  refetchSnapshots: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  error: null,
  refetchSnapshots: () => {},
});

export function useRealtimeContext(): RealtimeContextType {
  return useContext(RealtimeContext);
}

export interface RealtimeProviderProps {
  children: ReactNode;
}

const INITIAL_RETRY_DELAY_MS = 1500;
const MAX_RETRY_DELAY_MS = 15000;

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
  const wasConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  const refetchSnapshots = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
    queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
  }, [queryClient]);

  const createEventSource = useCallback((url: string): any => {
    if (Platform.OS === 'web' && typeof globalThis.EventSource !== 'undefined') {
      return new globalThis.EventSource(url);
    }
    // react-native-sse allows passing custom headers, required to bypass ngrok free warning
    return new NativeEventSource(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
  }, []);

  const connect = useCallback(() => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    // Clean up any existing connection
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {
        // ignore
      }
      eventSourceRef.current = null;
    }

    const url = `${API_BASE_URL}/events`;

    try {
      const es = createEventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('open', () => {
        isConnectingRef.current = false;
        setIsConnected(true);
        setError(null);
        retryDelayRef.current = INITIAL_RETRY_DELAY_MS;

        // If reconnecting after a drop, refetch snapshots to catch missed updates
        if (wasConnectedRef.current) {
          refetchSnapshots();
        }
        wasConnectedRef.current = true;
      });

      // Heartbeat listener
      es.addEventListener('ping', () => {
        setIsConnected(true);
        setError(null);
      });

      es.addEventListener('error', () => {
        isConnectingRef.current = false;
        setIsConnected(false);
        setError('Conexão em tempo real perdida. Reconectando...');

        try {
          es.close();
        } catch {
          // ignore
        }
        eventSourceRef.current = null;

        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS);

        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
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
      isConnectingRef.current = false;
      setError(err?.message || 'Erro ao inicializar SSE');
    }
  }, [createEventSource, queryClient, refetchSnapshots]);

  useEffect(() => {
    connectRef.current = connect;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    connect();

    // Reconnect when mobile app comes back from background to active
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (!eventSourceRef.current || !isConnected) {
          retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
          connect();
        } else {
          refetchSnapshots();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
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
      isConnectingRef.current = false;
      setIsConnected(false);
    };
  }, [connect, isConnected, refetchSnapshots]);

  return (
    <RealtimeContext.Provider value={{ isConnected, error, refetchSnapshots }}>
      {children}
    </RealtimeContext.Provider>
  );
}
