import { useQuery } from '@tanstack/react-query';
import { statusApi } from '@/api/status';
import { LineStatusDto, StationStatusDto } from '@/api/types';

export const statusKeys = {
  allStatus: ['status'] as const,
  lineStatus: (lineId: number, stationId?: number) =>
    ['status', { lineId, stationId }] as const,
  stationStatus: (stationId: number) => ['status', 'station', stationId] as const,
};

export function useAllLinesStatus() {
  return useQuery<LineStatusDto[]>({
    queryKey: statusKeys.allStatus,
    queryFn: () => statusApi.getAllLinesStatus(),
  });
}

export function useLineStatus(lineId?: number, stationId?: number) {
  return useQuery<LineStatusDto>({
    queryKey: statusKeys.lineStatus(lineId ?? 0, stationId),
    queryFn: () => statusApi.getLineStatus(lineId!, stationId),
    enabled: typeof lineId === 'number' && lineId > 0,
  });
}

export function useStationStatus(stationId?: number) {
  return useQuery<StationStatusDto>({
    queryKey: statusKeys.stationStatus(stationId ?? 0),
    queryFn: () => statusApi.getStationStatus(stationId!),
    enabled: typeof stationId === 'number' && stationId > 0,
  });
}
