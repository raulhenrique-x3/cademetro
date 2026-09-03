import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { EventsService } from './events.service.js';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(() => {
    service = new EventsService();
  });

  it('publishes and delivers event to subscriber', async () => {
    const stream$ = service.subscribe();
    const eventPromise = firstValueFrom(stream$);

    service.publish({
      event: 'report.created',
      lineId: 1,
      stationId: 12,
      data: { id: 101, type: 'TRAIN_ARRIVING' },
    });

    const received = await eventPromise;
    expect(received.type).toBe('report.created');
    expect(received.id).toBe('1');
    expect(received.data).toEqual({ id: 101, type: 'TRAIN_ARRIVING' });
  });

  it('filters events by lineId', async () => {
    const stream$ = service.subscribe({ lineId: 2 });

    const received: any[] = [];
    const sub = stream$.subscribe((e) => {
      if (e.type !== 'ping') {
        received.push(e);
      }
    });

    service.publish({
      event: 'report.created',
      lineId: 1, // different line
      data: { id: 101 },
    });

    service.publish({
      event: 'report.created',
      lineId: 2, // matching line
      data: { id: 102 },
    });

    sub.unsubscribe();

    expect(received.length).toBe(1);
    expect(received[0].data).toEqual({ id: 102 });
  });
});
