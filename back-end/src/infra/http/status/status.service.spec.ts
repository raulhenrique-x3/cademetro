import { describe, it, expect, beforeEach } from 'vitest';
import { StatusService, RawReportWithConfirmations } from './status.service.js';
import { ReliabilityService } from './reliability.service.js';

describe('StatusService (pure deriveStatus)', () => {
  let service: StatusService;
  let reliabilityService: ReliabilityService;
  const now = new Date('2026-09-03T12:30:00.000Z');

  beforeEach(() => {
    reliabilityService = new ReliabilityService();
    service = new StatusService(reliabilityService);
  });

  it('returns UNKNOWN when there are no reports in window', () => {
    const result = service.deriveStatus([], now);
    expect(result.status).toBe('UNKNOWN');
    expect(result.lastUpdateTime).toBeNull();
    expect(result.reportsSummary).toEqual([]);
  });

  it('returns UNKNOWN when reports are older than 30 minutes window', () => {
    const oldReport: RawReportWithConfirmations = {
      id: 1,
      type: 'SERVICE_INTERRUPTION',
      lineId: 1,
      authorId: 10,
      createdAt: new Date('2026-09-03T11:55:00.000Z').toISOString(), // 35 min ago
      isHidden: false,
    };

    const result = service.deriveStatus([oldReport], now);
    expect(result.status).toBe('UNKNOWN');
    expect(result.lastUpdateTime).toBeNull();
  });

  it('returns UNKNOWN when only TRAIN_* reports exist in window', () => {
    const trainReport: RawReportWithConfirmations = {
      id: 2,
      type: 'TRAIN_ARRIVING',
      lineId: 1,
      stationId: 5,
      directionId: 1,
      authorId: 10,
      createdAt: new Date('2026-09-03T12:20:00.000Z').toISOString(),
      isHidden: false,
    };

    const result = service.deriveStatus([trainReport], now);
    expect(result.status).toBe('UNKNOWN');
    expect(result.lastUpdateTime).toBe(trainReport.createdAt);
  });

  it('ignores hidden reports', () => {
    const hiddenReport: RawReportWithConfirmations = {
      id: 3,
      type: 'SERVICE_INTERRUPTION',
      lineId: 1,
      authorId: 10,
      createdAt: new Date('2026-09-03T12:25:00.000Z').toISOString(),
      isHidden: true,
    };

    const result = service.deriveStatus([hiddenReport], now);
    expect(result.status).toBe('UNKNOWN');
    expect(result.lastUpdateTime).toBeNull();
  });

  it('derives NORMAL when most recent relevant report is NORMAL_OPERATION', () => {
    const normalReport: RawReportWithConfirmations = {
      id: 4,
      type: 'NORMAL_OPERATION',
      lineId: 1,
      authorId: 10,
      createdAt: new Date('2026-09-03T12:25:00.000Z').toISOString(),
      isHidden: false,
    };

    const result = service.deriveStatus([normalReport], now);
    expect(result.status).toBe('NORMAL');
    expect(result.lastUpdateTime).toBe(normalReport.createdAt);
  });

  it('derives RESTRICTED when most recent relevant report is OPERATIONAL_RESTRICTION', () => {
    const restrictionReport: RawReportWithConfirmations = {
      id: 5,
      type: 'OPERATIONAL_RESTRICTION',
      lineId: 1,
      authorId: 10,
      createdAt: new Date('2026-09-03T12:25:00.000Z').toISOString(),
      isHidden: false,
    };

    const result = service.deriveStatus([restrictionReport], now);
    expect(result.status).toBe('RESTRICTED');
  });

  it('derives INTERRUPTED when most recent relevant report is SERVICE_INTERRUPTION', () => {
    const interruptionReport: RawReportWithConfirmations = {
      id: 6,
      type: 'SERVICE_INTERRUPTION',
      lineId: 1,
      authorId: 10,
      createdAt: new Date('2026-09-03T12:25:00.000Z').toISOString(),
      isHidden: false,
    };

    const result = service.deriveStatus([interruptionReport], now);
    expect(result.status).toBe('INTERRUPTED');
  });

  it('resolves conflicting reports with most recent wins', () => {
    const reports: RawReportWithConfirmations[] = [
      {
        id: 7,
        type: 'SERVICE_INTERRUPTION',
        lineId: 1,
        authorId: 1,
        createdAt: new Date('2026-09-03T12:10:00.000Z').toISOString(), // 20 min ago
        isHidden: false,
      },
      {
        id: 8,
        type: 'NORMAL_OPERATION',
        lineId: 1,
        authorId: 2,
        createdAt: new Date('2026-09-03T12:20:00.000Z').toISOString(), // 10 min ago (newer)
        isHidden: false,
      },
    ];

    const result = service.deriveStatus(reports, now);
    expect(result.status).toBe('NORMAL');
    expect(result.lastUpdateTime).toBe(reports[1].createdAt);
  });
});
