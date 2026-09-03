/**
 * TypeScript API Contracts mirrored from backend Swagger/OpenAPI.
 */

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

export const LINE_STATUSES = ['NORMAL', 'RESTRICTED', 'INTERRUPTED', 'UNKNOWN'] as const;
export type LineStatus = typeof LINE_STATUSES[number];

export interface DirectionDto {
  id: number;
  name: string;
  code: string;
}

export interface LineStationDto {
  id: number;
  name: string;
  code?: string | null;
  order: number;
  latitude: number;
  longitude: number;
}

export interface LineDto {
  id: number;
  name: string;
  code: string;
  color: string;
  directions: DirectionDto[];
}

export interface BranchDto {
  id: number;
  name: string;
  code: string;
  order: number;
}

export interface BranchDetailDto extends BranchDto {
  stations: LineStationDto[];
}

export interface LineDetailDto extends LineDto {
  branches: BranchDetailDto[];
}

export interface CreateStationInput {
  name: string;
  code?: string | null;
  latitude: number;
  longitude: number;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  stations: CreateStationInput[];
}

export interface CreateLineInput {
  name: string;
  code: string;
  color: string;
  branches: CreateBranchInput[];
}

export interface StationLineInfoDto {
  id: number;
  name: string;
  code: string;
  color: string;
}

export interface StationDto {
  id: number;
  name: string;
  code?: string | null;
  latitude: number;
  longitude: number;
  lines: StationLineInfoDto[];
}

export interface ReportAuthorDto {
  id: number;
  username?: string | null;
  trustScore: number;
}

export interface ConfirmationsCountDto {
  confirm: number;
  dispute: number;
}

export interface ReportDto {
  id: number;
  type: ReportTypeString;
  lineId: number;
  lineCode: string;
  stationId?: number | null;
  stationName?: string | null;
  directionId?: number | null;
  directionName?: string | null;
  author: ReportAuthorDto;
  description?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  confirmations: ConfirmationsCountDto;
  confidence: number;
  independentReportCount: number;
  createdAt: string;
  isHidden?: boolean;
}

export interface RecentReportsResponseDto {
  reports: ReportDto[];
  total: number;
}

export interface StatusReportSummaryDto {
  id: number;
  type: string;
  confidence: number;
  confirmations: ConfirmationsCountDto;
  createdAt: string;
}

export interface LineStatusDto {
  lineId: number;
  lineCode: string;
  stationId?: number | null;
  status: LineStatus;
  lastUpdateTime: string | null;
  windowMinutes: number;
  reports: StatusReportSummaryDto[];
}

export interface StationStatusDto {
  stationId: number;
  stationName: string;
  lineId: number;
  status: LineStatus;
  lastUpdateTime: string | null;
  windowMinutes: number;
  reports: StatusReportSummaryDto[];
}

export interface UserDto {
  id: number;
  email: string;
  username?: string | null;
  name?: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  trustScore: number;
  createdAt: string;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponseDto {
  id: number;
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
}
