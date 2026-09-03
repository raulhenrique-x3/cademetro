import { apiClient } from './client';
import { CreateReportInput, HideReportInput } from './schemas';
import { RecentReportsResponseDto, ReportDto } from './types';

export interface GetRecentReportsParams {
  lineId?: number;
  stationId?: number;
  directionId?: number;
  limit?: number;
  before?: string;
}

export const reportsApi = {
  async getRecent(params?: GetRecentReportsParams): Promise<RecentReportsResponseDto> {
    const { data } = await apiClient.get<RecentReportsResponseDto>('/reports/recent', {
      params,
    });
    return data;
  },

  async getById(id: number): Promise<ReportDto> {
    const { data } = await apiClient.get<ReportDto>(`/reports/${id}`);
    return data;
  },

  async create(dto: CreateReportInput): Promise<ReportDto> {
    const { data } = await apiClient.post<ReportDto>('/reports', dto);
    return data;
  },

  async confirm(id: number): Promise<ReportDto> {
    const { data } = await apiClient.post<ReportDto>(`/reports/${id}/confirm`);
    return data;
  },

  async dispute(id: number): Promise<ReportDto> {
    const { data } = await apiClient.post<ReportDto>(`/reports/${id}/dispute`);
    return data;
  },

  async hide(id: number, dto: HideReportInput): Promise<ReportDto> {
    const { data } = await apiClient.patch<ReportDto>(`/reports/${id}/hide`, dto);
    return data;
  },
};
