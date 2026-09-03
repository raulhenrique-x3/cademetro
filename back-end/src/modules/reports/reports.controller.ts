import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import {
  CreateReportDto,
  HideReportDto,
  ReportDto,
  RecentReportsResponseDto,
} from './dto/report.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new operational or train report' })
  @ApiResponse({ status: 201, description: 'Report created', type: ReportDto })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid scope' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Account suspended' })
  @ApiResponse({ status: 404, description: 'Line/Station/Direction not found' })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateReportDto,
  ): Promise<ReportDto> {
    return this.reportsService.create(user, dto);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent non-hidden reports' })
  @ApiQuery({ name: 'lineId', required: false, type: Number })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiQuery({ name: 'directionId', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of recent reports', type: RecentReportsResponseDto })
  async getRecent(
    @Query('lineId') lineId?: string,
    @Query('stationId') stationId?: string,
    @Query('directionId') directionId?: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): Promise<RecentReportsResponseDto> {
    const parsedLineId = lineId !== undefined ? parseInt(lineId, 10) : undefined;
    const parsedStationId = stationId !== undefined ? parseInt(stationId, 10) : undefined;
    const parsedDirectionId = directionId !== undefined ? parseInt(directionId, 10) : undefined;
    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : undefined;

    return this.reportsService.getRecent({
      lineId: Number.isNaN(parsedLineId) ? undefined : parsedLineId,
      stationId: Number.isNaN(parsedStationId) ? undefined : parsedStationId,
      directionId: Number.isNaN(parsedDirectionId) ? undefined : parsedDirectionId,
      limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
      before,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID with confirmations and confidence' })
  @ApiResponse({ status: 200, description: 'Report details', type: ReportDto })
  @ApiResponse({ status: 404, description: 'Report not found or hidden' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ReportDto> {
    return this.reportsService.getById(id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a report (toggle)' })
  @ApiResponse({ status: 200, description: 'Report confirmation toggled', type: ReportDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot confirm own report or account suspended' })
  @ApiResponse({ status: 404, description: 'Report not found or hidden' })
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<ReportDto> {
    return this.reportsService.confirm(id, user);
  }

  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dispute a report (toggle)' })
  @ApiResponse({ status: 200, description: 'Report dispute toggled', type: ReportDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot dispute own report or account suspended' })
  @ApiResponse({ status: 404, description: 'Report not found or hidden' })
  async dispute(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<ReportDto> {
    return this.reportsService.dispute(id, user);
  }

  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-hide a report (moderator/admin only)' })
  @ApiResponse({ status: 200, description: 'Report hidden', type: ReportDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async hide(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: HideReportDto,
  ): Promise<ReportDto> {
    return this.reportsService.hide(id, user, dto);
  }
}
