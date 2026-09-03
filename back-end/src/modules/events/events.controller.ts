import { Controller, Sse, Query, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { EventsService } from './events.service.js';

@ApiTags('Realtime')
@Controller()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Sse('events')
  @ApiOperation({ summary: 'Server-Sent Events endpoint for realtime updates' })
  @ApiQuery({ name: 'lineId', required: false, type: Number })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  events(
    @Query('lineId') lineId?: string,
    @Query('stationId') stationId?: string,
  ): Observable<MessageEvent> {
    const parsedLineId = lineId !== undefined ? parseInt(lineId, 10) : undefined;
    const parsedStationId = stationId !== undefined ? parseInt(stationId, 10) : undefined;

    return this.eventsService.subscribe({
      lineId: Number.isNaN(parsedLineId) ? undefined : parsedLineId,
      stationId: Number.isNaN(parsedStationId) ? undefined : parsedStationId,
    });
  }
}
