import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfirmationsCountDto } from '../../../../modules/reports/dto/report.dto.js';

export const LINE_STATUSES = ['NORMAL', 'RESTRICTED', 'INTERRUPTED', 'UNKNOWN'] as const;
export type LineStatus = typeof LINE_STATUSES[number];

export class StatusReportSummaryDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ example: 'OPERATIONAL_RESTRICTION' })
  type!: string;

  @ApiProperty({ example: 0.82 })
  confidence!: number;

  @ApiProperty({ type: ConfirmationsCountDto })
  confirmations!: ConfirmationsCountDto;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt!: string;
}

export class LineStatusDto {
  @ApiProperty({ example: 1 })
  lineId!: number;

  @ApiProperty({ example: '1-azul' })
  lineCode!: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  stationId?: number | null;

  @ApiProperty({ enum: LINE_STATUSES, example: 'RESTRICTED' })
  status!: LineStatus;

  @ApiPropertyOptional({ example: '2026-09-02T10:00:00.000Z', nullable: true })
  lastUpdateTime!: string | null;

  @ApiProperty({ example: 30 })
  windowMinutes!: number;

  @ApiProperty({ type: [StatusReportSummaryDto] })
  reports!: StatusReportSummaryDto[];
}

export class StationStatusDto {
  @ApiProperty({ example: 12 })
  stationId!: number;

  @ApiProperty({ example: 'Jabaquara' })
  stationName!: string;

  @ApiProperty({ example: 1 })
  lineId!: number;

  @ApiProperty({ enum: LINE_STATUSES, example: 'NORMAL' })
  status!: LineStatus;

  @ApiPropertyOptional({ example: '2026-09-02T10:00:00.000Z', nullable: true })
  lastUpdateTime!: string | null;

  @ApiProperty({ example: 30 })
  windowMinutes!: number;

  @ApiProperty({ type: [StatusReportSummaryDto] })
  reports!: StatusReportSummaryDto[];
}
