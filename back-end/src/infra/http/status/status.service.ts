import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../database/prisma/db.js';
import { ReliabilityService } from './reliability.service.js';
import { LineStatus, LineStatusDto, StationStatusDto, StatusReportSummaryDto } from './dto/status.dto.js';

export const STATUS_WINDOW_MINUTES = 30;

export interface RawReportWithConfirmations {
  id: number;
  type: string;
  lineId: number;
  stationId?: number | null;
  directionId?: number | null;
  authorId: number;
  createdAt: string;
  isHidden: boolean;
  confirmations?: { type: string }[];
  authorTrust?: number;
}

@Injectable()
export class StatusService {
  constructor(private reliabilityService: ReliabilityService) {}

  deriveStatus(
    reports: RawReportWithConfirmations[],
    now: Date = new Date(),
  ): {
    status: LineStatus;
    lastUpdateTime: string | null;
    reportsSummary: StatusReportSummaryDto[];
  } {
    const windowMs = STATUS_WINDOW_MINUTES * 60 * 1000;
    const cutoffTime = now.getTime() - windowMs;

    // Filter reports in the last 30 minutes, non-hidden
    const relevantInWindow = reports.filter((r) => {
      if (r.isHidden) return false;
      const createdTime = new Date(r.createdAt).getTime();
      return createdTime >= cutoffTime && createdTime <= now.getTime();
    });

    // Sort newest first
    relevantInWindow.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Status-setting report types in order of check on the most recent one
    let status: LineStatus = 'UNKNOWN';

    for (const r of relevantInWindow) {
      if (r.type === 'SERVICE_INTERRUPTION') {
        status = 'INTERRUPTED';
        break;
      }
      if (r.type === 'OPERATIONAL_RESTRICTION') {
        status = 'RESTRICTED';
        break;
      }
      if (r.type === 'NORMAL_OPERATION') {
        status = 'NORMAL';
        break;
      }
    }

    const lastUpdateTime =
      relevantInWindow.length > 0 ? relevantInWindow[0].createdAt : null;

    const reportsSummary: StatusReportSummaryDto[] = relevantInWindow
      .slice(0, 20)
      .map((r) => {
        const confirms = (r.confirmations || []).filter((c) => c.type === 'CONFIRM').length;
        const disputes = (r.confirmations || []).filter((c) => c.type === 'DISPUTE').length;
        const confidence = this.reliabilityService.calculateConfidence({
          createdAt: r.createdAt,
          confirms,
          disputes,
          authorTrust: r.authorTrust ?? 0.5,
          now,
        });

        return {
          id: r.id,
          type: r.type,
          confidence,
          confirmations: {
            confirm: confirms,
            dispute: disputes,
          },
          createdAt: r.createdAt,
        };
      });

    return { status, lastUpdateTime, reportsSummary };
  }

  async getLineStatus(lineId: number, stationId?: number): Promise<LineStatusDto> {
    const line = await db.orm.public.Line.where({ id: lineId }).first();
    if (!line) {
      throw new NotFoundException(`Line with ID ${lineId} not found`);
    }

    if (stationId !== undefined) {
      const station = await db.orm.public.Station.where({ id: stationId }).first();
      if (!station) {
        throw new NotFoundException(`Station with ID ${stationId} not found`);
      }
    }

    const whereClause: { lineId: number; isHidden: boolean; stationId?: number } = {
      lineId,
      isHidden: false,
    };
    if (stationId !== undefined) {
      whereClause.stationId = stationId;
    }

    const rawReports = await db.orm.public.Report.where(whereClause).all();

    // Attach confirmations for each report
    const reportsWithConf: RawReportWithConfirmations[] = [];
    for (const r of rawReports) {
      const confs = await db.orm.public.ReportConfirmation
        .where({ reportId: r.id })
        .all();
      reportsWithConf.push({
        ...r,
        confirmations: confs,
      });
    }

    const { status, lastUpdateTime, reportsSummary } = this.deriveStatus(reportsWithConf);

    return {
      lineId: line.id,
      lineCode: line.code,
      stationId: stationId ?? null,
      status,
      lastUpdateTime,
      windowMinutes: STATUS_WINDOW_MINUTES,
      reports: reportsSummary,
    };
  }

  async getAllLinesStatus(): Promise<LineStatusDto[]> {
    const lines = await db.orm.public.Line.all();
    const result: LineStatusDto[] = [];

    for (const line of lines) {
      const lineStatus = await this.getLineStatus(line.id);
      result.push(lineStatus);
    }

    return result;
  }

  async getStationStatus(stationId: number): Promise<StationStatusDto> {
    const station = await db.orm.public.Station.where({ id: stationId }).first();
    if (!station) {
      throw new NotFoundException(`Station with ID ${stationId} not found`);
    }

    const branchStation = await db.orm.public.BranchStation
      .where({ stationId: station.id })
      .first();

    const branch = branchStation
      ? await db.orm.public.Branch.where({ id: branchStation.branchId }).first()
      : null;

    const lineId = branch?.lineId ?? 1;

    const rawReports = await db.orm.public.Report
      .where({ stationId, isHidden: false })
      .all();

    const reportsWithConf: RawReportWithConfirmations[] = [];
    for (const r of rawReports) {
      const confs = await db.orm.public.ReportConfirmation
        .where({ reportId: r.id })
        .all();
      reportsWithConf.push({
        ...r,
        confirmations: confs,
      });
    }

    const { status, lastUpdateTime, reportsSummary } = this.deriveStatus(reportsWithConf);

    return {
      stationId: station.id,
      stationName: station.name,
      lineId,
      status,
      lastUpdateTime,
      windowMinutes: STATUS_WINDOW_MINUTES,
      reports: reportsSummary,
    };
  }
}
