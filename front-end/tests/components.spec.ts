import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { reportKeys } from '../src/features/reports/queries';
import { statusKeys } from '../src/features/status/queries';
import { ReportDto } from '../src/api/types';

describe('Frontend Flow and Cache Integration', () => {
  it('updates query client cache when a new report is created', () => {
    const queryClient = new QueryClient();

    // Initial cache state
    queryClient.setQueryData(reportKeys.recent(), {
      reports: [
        {
          id: 1,
          type: 'TRAIN_ARRIVED',
          lineId: 1,
          lineCode: '1-azul',
          author: { id: 1, trustScore: 0.5 },
          confirmations: { confirm: 0, dispute: 0 },
          confidence: 0.5,
          independentReportCount: 1,
          createdAt: new Date().toISOString(),
        } as ReportDto,
      ],
      total: 1,
    });

    const initial = queryClient.getQueryData<any>(reportKeys.recent());
    expect(initial.reports.length).toBe(1);

    // Simulate new report arriving
    const newReport: ReportDto = {
      id: 2,
      type: 'TRAIN_ARRIVING',
      lineId: 1,
      lineCode: '1-azul',
      stationId: 12,
      stationName: 'Jabaquara',
      author: { id: 2, trustScore: 0.8 },
      confirmations: { confirm: 0, dispute: 0 },
      confidence: 0.8,
      independentReportCount: 1,
      createdAt: new Date().toISOString(),
    };

    // Prepend to cache
    queryClient.setQueriesData<any>({ queryKey: ['reports', 'recent'] }, (old: any) => ({
      reports: [newReport, ...old.reports],
      total: old.total + 1,
    }));

    const updated = queryClient.getQueryData<any>(reportKeys.recent());
    expect(updated.reports.length).toBe(2);
    expect(updated.reports[0].id).toBe(2);
    expect(updated.reports[0].stationName).toBe('Jabaquara');
  });

  it('updates report confirmations and confidence in cache', () => {
    const queryClient = new QueryClient();

    const report: ReportDto = {
      id: 10,
      type: 'TRAIN_ARRIVING',
      lineId: 1,
      lineCode: '1-azul',
      author: { id: 1, trustScore: 0.5 },
      confirmations: { confirm: 1, dispute: 0 },
      confidence: 0.6,
      independentReportCount: 1,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData(reportKeys.recent(), {
      reports: [report],
      total: 1,
    });

    // Simulate report.confirmed event with updated confidence and confirmations
    const confirmedReport: ReportDto = {
      ...report,
      confirmations: { confirm: 2, dispute: 0 },
      confidence: 0.85,
    };

    queryClient.setQueriesData<any>({ queryKey: ['reports', 'recent'] }, (old: any) => ({
      ...old,
      reports: old.reports.map((r: ReportDto) =>
        r.id === confirmedReport.id ? confirmedReport : r,
      ),
    }));

    const updated = queryClient.getQueryData<any>(reportKeys.recent());
    expect(updated.reports[0].confirmations.confirm).toBe(2);
    expect(updated.reports[0].confidence).toBe(0.85);
  });
});
