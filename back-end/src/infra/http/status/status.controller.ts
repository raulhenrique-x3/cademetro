import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StatusService } from './status.service.js';
import { LineStatusDto, StationStatusDto } from './dto/status.dto.js';

@ApiTags('Status')
@Controller()
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get aggregate operational status for a line or all lines' })
  @ApiQuery({ name: 'lineId', required: false, type: Number })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Line status or array of line statuses' })
  @ApiResponse({ status: 404, description: 'Line or station not found' })
  async getStatus(
    @Query('lineId') lineId?: string,
    @Query('stationId') stationId?: string,
  ): Promise<LineStatusDto | LineStatusDto[]> {
    const parsedLineId = lineId !== undefined ? parseInt(lineId, 10) : undefined;
    const parsedStationId = stationId !== undefined ? parseInt(stationId, 10) : undefined;

    if (parsedLineId !== undefined) {
      return this.statusService.getLineStatus(parsedLineId, parsedStationId);
    }

    return this.statusService.getAllLinesStatus();
  }

  @Get('stations/:id/status')
  @ApiOperation({ summary: 'Get operational status scoped to a single station' })
  @ApiResponse({ status: 200, description: 'Station status', type: StationStatusDto })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async getStationStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StationStatusDto> {
    return this.statusService.getStationStatus(id);
  }
}
