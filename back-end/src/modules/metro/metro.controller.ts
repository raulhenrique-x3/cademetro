import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MetroService } from './metro.service.js';
import { LineDto, LineDetailDto } from './dto/line.dto.js';
import { StationDto } from './dto/station.dto.js';
import { CreateLineDto } from './dto/create-line.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';

@ApiTags('Metro')
@Controller()
export class MetroController {
  constructor(private metroService: MetroService) {}

  @Post('admin/lines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a metro line with directions and stations (admin only)' })
  @ApiResponse({ status: 201, description: 'Line created', type: LineDetailDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Line code already exists' })
  async createLine(@Body() dto: CreateLineDto): Promise<LineDetailDto> {
    return this.metroService.createLine(dto);
  }

  @Get('lines')
  @ApiOperation({ summary: 'List all metro lines with directions' })
  @ApiResponse({ status: 200, description: 'List of lines', type: [LineDto] })
  async getLines(): Promise<LineDto[]> {
    return this.metroService.getLines();
  }

  @Get('lines/:id')
  @ApiOperation({ summary: 'Get line details including ordered stations' })
  @ApiResponse({ status: 200, description: 'Line details', type: LineDetailDto })
  @ApiResponse({ status: 404, description: 'Line not found' })
  async getLineById(@Param('id', ParseIntPipe) id: number): Promise<LineDetailDto> {
    return this.metroService.getLineById(id);
  }

  @Get('stations')
  @ApiOperation({ summary: 'List all stations or filter by line' })
  @ApiQuery({ name: 'lineId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of stations', type: [StationDto] })
  async getStations(@Query('lineId') lineId?: string): Promise<StationDto[]> {
    const parsedLineId = lineId !== undefined ? parseInt(lineId, 10) : undefined;
    return this.metroService.getStations(parsedLineId);
  }

  @Get('stations/:id')
  @ApiOperation({ summary: 'Get station details with its line memberships' })
  @ApiResponse({ status: 200, description: 'Station details', type: StationDto })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async getStationById(@Param('id', ParseIntPipe) id: number): Promise<StationDto> {
    return this.metroService.getStationById(id);
  }
}
