import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GetRecentReportsParams, reportsApi } from '@/api/reports';
import { CreateReportInput } from '@/api/schemas';
import { RecentReportsResponseDto, ReportDto } from '@/api/types';
import { statusKeys } from '../status/queries';

export const reportKeys = {
  allReports: ['reports'] as const,
  recent: (params?: GetRecentReportsParams) => ['reports', 'recent', params] as const,
  detail: (id: number) => ['reports', 'detail', id] as const,
};

export function useRecentReports(params?: GetRecentReportsParams) {
  return useQuery<RecentReportsResponseDto>({
    queryKey: reportKeys.recent(params),
    queryFn: () => reportsApi.getRecent(params),
  });
}

export function useReportDetail(id?: number) {
  return useQuery<ReportDto>({
    queryKey: reportKeys.detail(id ?? 0),
    queryFn: () => reportsApi.getById(id!),
    enabled: typeof id === 'number' && id > 0,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportInput) => reportsApi.create(data),
    onSuccess: (newReport) => {
      // Invalidate queries so that live lists refetch
      queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
      queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
      // Optimistically update recent reports cache
      queryClient.setQueriesData<RecentReportsResponseDto>(
        { queryKey: ['reports', 'recent'] },
        (old) => {
          if (!old) return { reports: [newReport], total: 1 };
          return {
            reports: [newReport, ...old.reports.filter((r) => r.id !== newReport.id)],
            total: old.total + 1,
          };
        },
      );
    },
  });
}

export function useConfirmReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reportsApi.confirm(id),
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
      queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
      // Update individual report in cache
      queryClient.setQueryData(reportKeys.detail(updatedReport.id), updatedReport);
      // Update in recent reports list
      queryClient.setQueriesData<RecentReportsResponseDto>(
        { queryKey: ['reports', 'recent'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            reports: old.reports.map((r) =>
              r.id === updatedReport.id ? updatedReport : r,
            ),
          };
        },
      );
    },
  });
}

export function useDisputeReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reportsApi.dispute(id),
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
      queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
      // Update individual report in cache
      queryClient.setQueryData(reportKeys.detail(updatedReport.id), updatedReport);
      // Update in recent reports list
      queryClient.setQueriesData<RecentReportsResponseDto>(
        { queryKey: ['reports', 'recent'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            reports: old.reports.map((r) =>
              r.id === updatedReport.id ? updatedReport : r,
            ),
          };
        },
      );
    },
  });
}

export function useHideReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      reportsApi.hide(id, { reason }),
    onSuccess: (hiddenReport) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.allReports });
      queryClient.invalidateQueries({ queryKey: statusKeys.allStatus });
      // Remove from recent reports list
      queryClient.setQueriesData<RecentReportsResponseDto>(
        { queryKey: ['reports', 'recent'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            reports: old.reports.filter((r) => r.id !== hiddenReport.id),
            total: Math.max(0, old.total - 1),
          };
        },
      );
    },
  });
}
