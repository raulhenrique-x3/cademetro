import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Joi from 'joi';

export const REPORT_TYPES = [
  'TRAIN_ARRIVING',
  'TRAIN_ARRIVED',
  'TRAIN_DEPARTED',
  'TRAIN_STOPPED',
  'OPERATIONAL_RESTRICTION',
  'SERVICE_INTERRUPTION',
  'NORMAL_OPERATION',
] as const;

export type ReportTypeString = typeof REPORT_TYPES[number];

export class CreateReportDto {
  @ApiProperty({ enum: REPORT_TYPES, example: 'TRAIN_ARRIVING' })
  type!: ReportTypeString;

  @ApiProperty({ example: 1 })
  lineId!: number;

  @ApiPropertyOptional({ example: 12 })
  stationId?: number | null;

  @ApiPropertyOptional({ example: 3 })
  directionId?: number | null;

  @ApiPropertyOptional({ example: 'train at platform, doors open', maxLength: 500 })
  description?: string | null;

  @ApiPropertyOptional({ example: -23.5505 })
  locationLat?: number | null;

  @ApiPropertyOptional({ example: -46.6333 })
  locationLng?: number | null;

  static schema = Joi.object({
    type: Joi.string().valid(...REPORT_TYPES).required(),
    lineId: Joi.number().integer().required(),
    stationId: Joi.number().integer().optional().allow(null),
    directionId: Joi.number().integer().optional().allow(null),
    description: Joi.string().max(500).optional().allow('', null),
    locationLat: Joi.number().optional().allow(null),
    locationLng: Joi.number().optional().allow(null),
  });
}

export class HideReportDto {
  @ApiProperty({ example: 'spam / incorrect information', maxLength: 500 })
  reason!: string;

  static schema = Joi.object({
    reason: Joi.string().max(500).required(),
  });
}

export class ReportAuthorDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiPropertyOptional({ example: 'metro_user' })
  username?: string | null;

  @ApiProperty({ example: 0.5 })
  trustScore!: number;
}

export class ConfirmationsCountDto {
  @ApiProperty({ example: 2 })
  confirm!: number;

  @ApiProperty({ example: 0 })
  dispute!: number;
}

export class ReportDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ enum: REPORT_TYPES, example: 'TRAIN_ARRIVING' })
  type!: ReportTypeString;

  @ApiProperty({ example: 1 })
  lineId!: number;

  @ApiProperty({ example: '1-azul' })
  lineCode!: string;

  @ApiPropertyOptional({ example: 12 })
  stationId?: number | null;

  @ApiPropertyOptional({ example: 'Jabaquara' })
  stationName?: string | null;

  @ApiPropertyOptional({ example: 3 })
  directionId?: number | null;

  @ApiPropertyOptional({ example: 'Jabaquara' })
  directionName?: string | null;

  @ApiProperty({ type: ReportAuthorDto })
  author!: ReportAuthorDto;

  @ApiPropertyOptional({ example: 'train at platform, doors open' })
  description?: string | null;

  @ApiPropertyOptional({ example: -23.5505 })
  locationLat?: number | null;

  @ApiPropertyOptional({ example: -46.6333 })
  locationLng?: number | null;

  @ApiProperty({ type: ConfirmationsCountDto })
  confirmations!: ConfirmationsCountDto;

  @ApiProperty({ example: 0.82 })
  confidence!: number;

  @ApiProperty({ example: 1 })
  independentReportCount!: number;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt!: string;
}

export class RecentReportsResponseDto {
  @ApiProperty({ type: [ReportDto] })
  reports!: ReportDto[];

  @ApiProperty({ example: 42 })
  total!: number;
}
