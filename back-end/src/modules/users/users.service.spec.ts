import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service.js';
import { ReliabilityService } from '../../infra/http/status/reliability.service.js';

vi.mock('../../infra/database/prisma/db.js', () => {
  const store: Record<string, any[]> = {
    reports: [],
    confirmations: [],
  };

  const matchAll = (rows: any[], criteria: any) =>
    rows.filter((r) =>
      Object.entries(criteria).every(([k, v]) => r[k] === v),
    );

  const Report = {
    where: (criteria: any) => ({
      all: async () => matchAll(store.reports, criteria),
    }),
  };

  const ReportConfirmation = {
    where: (criteria: any) => ({
      all: async () => matchAll(store.confirmations, criteria),
    }),
  };

  return {
    db: {
      orm: { public: { Report, ReportConfirmation } },
    },
    __store: store,
  };
});

const dbModule: any = await import('../../infra/database/prisma/db.js');

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    dbModule.__store.reports.length = 0;
    dbModule.__store.confirmations.length = 0;
    service = new UsersService(new ReliabilityService());
  });

  async function seedConfirmation(reportId: number, userId: number, type: string) {
    dbModule.__store.confirmations.push({ id: dbModule.__store.confirmations.length + 1, reportId, userId, type });
  }

  it('returns 0.5 when the user has no reports', async () => {
    const score = await service.getUserTrustScore(1);
    expect(score).toBe(0.5);
  });

  it('returns 0.5 when all reports are hidden', async () => {
    dbModule.__store.reports.push({
      id: 1,
      authorId: 1,
      isHidden: true,
      type: 'NORMAL_OPERATION',
      lineId: 1,
    });

    const score = await service.getUserTrustScore(1);
    expect(score).toBe(0.5);
  });

  it('only counts reports by the requested author', async () => {
    dbModule.__store.reports.push(
      { id: 1, authorId: 1, isHidden: false },
      { id: 2, authorId: 2, isHidden: false },
    );

    const score = await service.getUserTrustScore(1);
    expect(score).toBe(0.5);
  });

  it('raises trust when reports are confirmed by others', async () => {
    dbModule.__store.reports.push({ id: 1, authorId: 1, isHidden: false });
    await seedConfirmation(1, 99, 'CONFIRM');

    const score = await service.getUserTrustScore(1);
    // calculateAuthorTrust(1, 0) = (1 + 1) / (1 + 0 + 2) = 2/3 -> 0.67
    expect(score).toBe(0.67);
  });

  it('lowers trust when reports are disputed', async () => {
    dbModule.__store.reports.push({ id: 1, authorId: 1, isHidden: false });
    await seedConfirmation(1, 99, 'DISPUTE');

    const score = await service.getUserTrustScore(1);
    // calculateAuthorTrust(0, 1) = (0 + 1) / (0 + 1 + 2) = 1/3 -> 0.33
    expect(score).toBe(0.33);
  });

  it('balances trust with mixed confirmed and disputed reports', async () => {
    dbModule.__store.reports.push(
      { id: 1, authorId: 1, isHidden: false },
      { id: 2, authorId: 1, isHidden: false },
    );
    await seedConfirmation(1, 99, 'CONFIRM');
    await seedConfirmation(2, 99, 'DISPUTE');

    const score = await service.getUserTrustScore(1);
    // calculateAuthorTrust(1, 1) = (1 + 1) / (1 + 1 + 2) = 2/4 -> 0.50
    expect(score).toBe(0.5);
  });
});