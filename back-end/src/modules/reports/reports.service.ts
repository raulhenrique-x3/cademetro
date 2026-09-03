import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../infra/database/prisma/db.js';
import { CreateReportDto, HideReportDto, ReportDto, RecentReportsResponseDto } from './dto/report.dto.js';
import { ReliabilityService } from '../../infra/http/status/reliability.service.js';
import { UsersService } from '../users/users.service.js';
import { EventsService } from '../events/events.service.js';
import { StatusService } from '../../infra/http/status/status.service.js';

@Injectable()
export class ReportsService {
  constructor(
    private reliabilityService: ReliabilityService,
    private usersService: UsersService,
    private eventsService: EventsService,
    private statusService: StatusService,
  ) {}

  async buildReportDto(report: any, now: Date = new Date()): Promise<ReportDto> {
    const line = await db.orm.public.Line.where({ id: report.lineId }).first();
    const station = report.stationId
      ? await db.orm.public.Station.where({ id: report.stationId }).first()
      : null;
    const direction = report.directionId
      ? await db.orm.public.Direction.where({ id: report.directionId }).first()
      : null;
    const author = await db.orm.public.User.where({ id: report.authorId }).first();

    const confirms = await db.orm.public.ReportConfirmation
      .where({ reportId: report.id, type: 'CONFIRM' })
      .all();
    const disputes = await db.orm.public.ReportConfirmation
      .where({ reportId: report.id, type: 'DISPUTE' })
      .all();

    const confirmCount = confirms.length;
    const disputeCount = disputes.length;

    const authorTrust = author ? await this.usersService.getUserTrustScore(author.id) : 0.5;

    const confidence = this.reliabilityService.calculateConfidence({
      createdAt: report.createdAt,
      confirms: confirmCount,
      disputes: disputeCount,
      authorTrust,
      now,
    });

    // Calculate independent reports in 5 min window
    let independentReportCount = 1;
    if (report.stationId && report.directionId) {
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const corroborating = await db.orm.public.Report
        .where({
          lineId: report.lineId,
          stationId: report.stationId,
          directionId: report.directionId,
          isHidden: false,
        })
        .all();

      const inWindow = corroborating.filter((r) => r.createdAt >= fiveMinAgo);
      independentReportCount = Math.max(1, inWindow.length);
    }

    return {
      id: report.id,
      type: report.type,
      lineId: report.lineId,
      lineCode: line?.code ?? '',
      stationId: report.stationId ?? null,
      stationName: station?.name ?? null,
      directionId: report.directionId ?? null,
      directionName: direction?.name ?? null,
      author: {
        id: author?.id ?? report.authorId,
        username: author?.username ?? null,
        trustScore: authorTrust,
      },
      description: report.description ?? null,
      locationLat: report.locationLat ?? null,
      locationLng: report.locationLng ?? null,
      confirmations: {
        confirm: confirmCount,
        dispute: disputeCount,
      },
      confidence,
      independentReportCount,
      createdAt: report.createdAt,
    };
  }

  async create(user: any, dto: CreateReportDto): Promise<ReportDto> {
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is suspended');
    }

    // Validate line exists
    const line = await db.orm.public.Line.where({ id: dto.lineId }).first();
    if (!line) {
      throw new NotFoundException(`Line with ID ${dto.lineId} not found`);
    }

    // Per-type scope rules
    const trainTypes = ['TRAIN_ARRIVING', 'TRAIN_ARRIVED', 'TRAIN_DEPARTED', 'TRAIN_STOPPED'];
    if (trainTypes.includes(dto.type)) {
      if (!dto.stationId || !dto.directionId) {
        throw new BadRequestException(
          `stationId and directionId are required for report type ${dto.type}`,
        );
      }
    }

    // Validate direction belongs to line
    if (dto.directionId) {
      const direction = await db.orm.public.Direction
        .where({ id: dto.directionId, lineId: dto.lineId })
        .first();
      if (!direction) {
        throw new BadRequestException(
          `Direction ${dto.directionId} does not belong to line ${dto.lineId}`,
        );
      }
    }

    // Validate station belongs to line (via any of its branches)
    if (dto.stationId) {
      const branches = await db.orm.public.Branch
        .where({ lineId: dto.lineId })
        .all();

      let stationBelongsToLine = false;
      for (const branch of branches) {
        const branchStation = await db.orm.public.BranchStation
          .where({ branchId: branch.id, stationId: dto.stationId })
          .first();
        if (branchStation) {
          stationBelongsToLine = true;
          break;
        }
      }

      if (!stationBelongsToLine) {
        throw new BadRequestException(
          `Station ${dto.stationId} does not belong to line ${dto.lineId}`,
        );
      }
    }

    const report = await db.orm.public.Report.create({
      type: dto.type,
      lineId: dto.lineId,
      stationId: dto.stationId ?? null,
      directionId: dto.directionId ?? null,
      authorId: user.id,
      description: dto.description?.trim() || null,
      locationLat: dto.locationLat ?? null,
      locationLng: dto.locationLng ?? null,
      isHidden: false,
    });

    const reportDto = await this.buildReportDto(report);

    // Publish report.created SSE event
    this.eventsService.publish({
      event: 'report.created',
      lineId: report.lineId,
      stationId: report.stationId,
      data: reportDto,
    });

    // Check if status changed and publish status.updated
    if (['SERVICE_INTERRUPTION', 'OPERATIONAL_RESTRICTION', 'NORMAL_OPERATION'].includes(report.type)) {
      const updatedStatus = await this.statusService.getLineStatus(report.lineId);
      this.eventsService.publish({
        event: 'status.updated',
        lineId: report.lineId,
        data: updatedStatus,
      });
    }

    return reportDto;
  }

  async getRecent(query: {
    lineId?: number;
    stationId?: number;
    directionId?: number;
    limit?: number;
    before?: string;
  }): Promise<RecentReportsResponseDto> {
    const limit = Math.min(Math.max(1, query.limit ?? 20), 100);

    const where: any = { isHidden: false };
    if (query.lineId !== undefined) where.lineId = query.lineId;
    if (query.stationId !== undefined) where.stationId = query.stationId;
    if (query.directionId !== undefined) where.directionId = query.directionId;

    let reports = await db.orm.public.Report.where(where).all();

    // Filter cursor before
    if (query.before) {
      reports = reports.filter((r) => r.createdAt < query.before!);
    }

    // Sort newest first
    reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = reports.length;
    const paginated = reports.slice(0, limit);

    const reportDtos = await Promise.all(
      paginated.map((r) => this.buildReportDto(r)),
    );

    return {
      reports: reportDtos,
      total,
    };
  }

  async getById(id: number): Promise<ReportDto> {
    const report = await db.orm.public.Report.where({ id }).first();
    if (!report || report.isHidden) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return this.buildReportDto(report);
  }

  async confirm(reportId: number, user: any): Promise<ReportDto> {
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is suspended');
    }

    const report = await db.orm.public.Report.where({ id: reportId }).first();
    if (!report || report.isHidden) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    if (report.authorId === user.id) {
      throw new ForbiddenException('Cannot confirm your own report');
    }

    const existing = await db.orm.public.ReportConfirmation
      .where({ reportId, userId: user.id })
      .first();

    if (existing) {
      if (existing.type === 'CONFIRM') {
        // Toggle off (remove)
        await db.orm.public.ReportConfirmation.where({ id: existing.id }).delete();
      } else {
        // Switch to CONFIRM
        await db.orm.public.ReportConfirmation.where({ id: existing.id }).update({ type: 'CONFIRM' });
      }
    } else {
      await db.orm.public.ReportConfirmation.create({
        reportId,
        userId: user.id,
        type: 'CONFIRM',
      });
    }

    const reportDto = await this.buildReportDto(report);

    this.eventsService.publish({
      event: 'report.confirmed',
      lineId: report.lineId,
      stationId: report.stationId,
      data: reportDto,
    });

    return reportDto;
  }

  async dispute(reportId: number, user: any): Promise<ReportDto> {
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is suspended');
    }

    const report = await db.orm.public.Report.where({ id: reportId }).first();
    if (!report || report.isHidden) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    if (report.authorId === user.id) {
      throw new ForbiddenException('Cannot dispute your own report');
    }

    const existing = await db.orm.public.ReportConfirmation
      .where({ reportId, userId: user.id })
      .first();

    if (existing) {
      if (existing.type === 'DISPUTE') {
        // Toggle off (remove)
        await db.orm.public.ReportConfirmation.where({ id: existing.id }).delete();
      } else {
        // Switch to DISPUTE
        await db.orm.public.ReportConfirmation.where({ id: existing.id }).update({ type: 'DISPUTE' });
      }
    } else {
      await db.orm.public.ReportConfirmation.create({
        reportId,
        userId: user.id,
        type: 'DISPUTE',
      });
    }

    const reportDto = await this.buildReportDto(report);

    this.eventsService.publish({
      event: 'report.disputed',
      lineId: report.lineId,
      stationId: report.stationId,
      data: reportDto,
    });

    return reportDto;
  }

  async hide(reportId: number, user: any, dto: HideReportDto): Promise<ReportDto> {
    const report = await db.orm.public.Report.where({ id: reportId }).first();
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    await db.orm.public.Report.where({ id: reportId }).update({
      isHidden: true,
      hiddenReason: dto.reason,
    });

    const updated = await db.orm.public.Report.where({ id: reportId }).first();
    return this.buildReportDto(updated);
  }
}
