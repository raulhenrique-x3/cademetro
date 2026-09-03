import { Injectable } from '@nestjs/common';
import { db } from '../../infra/database/prisma/db.js';
import { ReliabilityService } from '../../infra/http/status/reliability.service.js';

@Injectable()
export class UsersService {
  constructor(private reliabilityService: ReliabilityService) {}

  async getUserTrustScore(userId: number): Promise<number> {
    const reports = await db.orm.public.Report
      .where({ authorId: userId, isHidden: false })
      .all();

    if (!reports || reports.length === 0) {
      return 0.5;
    }

    let confirmedReceived = 0;
    let disputedReceived = 0;

    for (const report of reports) {
      const confirms = await db.orm.public.ReportConfirmation
        .where({ reportId: report.id, type: 'CONFIRM' })
        .all();
      const disputes = await db.orm.public.ReportConfirmation
        .where({ reportId: report.id, type: 'DISPUTE' })
        .all();

      if (confirms && confirms.length > 0) {
        confirmedReceived++;
      }
      if (disputes && disputes.length > 0) {
        disputedReceived++;
      }
    }

    return Number(
      this.reliabilityService
        .calculateAuthorTrust(confirmedReceived, disputedReceived)
        .toFixed(2),
    );
  }
}
