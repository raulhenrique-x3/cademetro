import { apiClient } from './client';
import { CreateLineInput, LineDetailDto, LineDto, StationDto } from './types';

export const metroApi = {
  async createLine(data: CreateLineInput): Promise<LineDetailDto> {
    const { data: line } = await apiClient.post<LineDetailDto>('/admin/lines', data);
    return line;
  },

  async getLines(): Promise<LineDto[]> {
    const { data } = await apiClient.get<LineDto[]>('/lines');
    return data;
  },

  async getLineById(id: number): Promise<LineDetailDto> {
    const { data } = await apiClient.get<LineDetailDto>(`/lines/${id}`);
    return data;
  },

  async getStations(lineId?: number): Promise<StationDto[]> {
    const params = lineId !== undefined ? { lineId } : undefined;
    const { data } = await apiClient.get<StationDto[]>('/stations', { params });
    return data;
  },

  async getStationById(id: number): Promise<StationDto> {
    const { data } = await apiClient.get<StationDto>(`/stations/${id}`);
    return data;
  },
};
