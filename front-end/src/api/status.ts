import { apiClient } from './client';
import { LineStatusDto, StationStatusDto } from './types';

export const statusApi = {
  async getAllLinesStatus(): Promise<LineStatusDto[]> {
    const { data } = await apiClient.get<LineStatusDto[]>('/status');
    return data;
  },

  async getLineStatus(lineId: number, stationId?: number): Promise<LineStatusDto> {
    const params: Record<string, number> = { lineId };
    if (stationId !== undefined) {
      params.stationId = stationId;
    }
    const { data } = await apiClient.get<LineStatusDto>('/status', { params });
    return data;
  },

  async getStationStatus(stationId: number): Promise<StationStatusDto> {
    const { data } = await apiClient.get<StationStatusDto>(`/stations/${stationId}/status`);
    return data;
  },
};
