import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { metroApi } from '@/api/metro';
import { CreateLineInput, LineDetailDto, LineDto, StationDto } from '@/api/types';

export const metroKeys = {
  allLines: ['lines'] as const,
  stationsRoot: ['stations'] as const,
  lineDetail: (id: number) => ['lines', id] as const,
  allStations: (lineId?: number) => ['stations', { lineId }] as const,
  stationDetail: (id: number) => ['stations', 'detail', id] as const,
};

export function useCreateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLineInput) => metroApi.createLine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metroKeys.allLines });
      queryClient.invalidateQueries({ queryKey: metroKeys.stationsRoot });
    },
  });
}

export function useLines() {
  return useQuery<LineDto[]>({
    queryKey: metroKeys.allLines,
    queryFn: () => metroApi.getLines(),
  });
}

export function useLineDetail(lineId?: number) {
  return useQuery<LineDetailDto>({
    queryKey: metroKeys.lineDetail(lineId ?? 0),
    queryFn: () => metroApi.getLineById(lineId!),
    enabled: typeof lineId === 'number' && lineId > 0,
  });
}

export function useStations(lineId?: number) {
  return useQuery<StationDto[]>({
    queryKey: metroKeys.allStations(lineId),
    queryFn: () => metroApi.getStations(lineId),
  });
}

export function useStationDetail(stationId?: number) {
  return useQuery<StationDto>({
    queryKey: metroKeys.stationDetail(stationId ?? 0),
    queryFn: () => metroApi.getStationById(stationId!),
    enabled: typeof stationId === 'number' && stationId > 0,
  });
}
