import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsService } from './reports.service.js';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let reliabilityServiceMock: any;
  let usersServiceMock: any;
  let eventsServiceMock: any;
  let statusServiceMock: any;

  beforeEach(() => {
    reliabilityServiceMock = {
      calculateConfidence: vi.fn().mockReturnValue(0.85),
    };
    usersServiceMock = {
      getUserTrustScore: vi.fn().mockResolvedValue(0.5),
    };
    eventsServiceMock = {
      publish: vi.fn(),
    };
    statusServiceMock = {
      getLineStatus: vi.fn().mockResolvedValue({ status: 'RESTRICTED' }),
    };

    reportsService = new ReportsService(
      reliabilityServiceMock,
      usersServiceMock,
      eventsServiceMock,
      statusServiceMock,
    );
  });

  describe('scope & validation rules', () => {
    it('rejects report creation when user is SUSPENDED', async () => {
      const suspendedUser = { id: 1, status: 'SUSPENDED' };
      const dto: any = { type: 'NORMAL_OPERATION', lineId: 1 };

      await expect(reportsService.create(suspendedUser, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects TRAIN_ARRIVING without stationId or directionId', async () => {
      const activeUser = { id: 1, status: 'ACTIVE' };
      const dto: any = {
        type: 'TRAIN_ARRIVING',
        lineId: 1,
        // stationId and directionId missing
      };

      await expect(reportsService.create(activeUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
