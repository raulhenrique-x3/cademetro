import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable, merge, timer } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export interface MetroEvent {
  id?: number;
  event: 'report.created' | 'report.confirmed' | 'report.disputed' | 'status.updated';
  lineId: number;
  stationId?: number | null;
  data: any;
}

@Injectable()
export class EventsService {
  private eventCounter = 0;
  private eventSubject = new Subject<MetroEvent>();

  publish(event: Omit<MetroEvent, 'id'>): void {
    this.eventCounter++;
    const fullEvent: MetroEvent = {
      ...event,
      id: this.eventCounter,
    };
    this.eventSubject.next(fullEvent);
  }

  subscribe(filterCriteria?: {
    lineId?: number;
    stationId?: number;
  }): Observable<MessageEvent> {
    const events$ = this.eventSubject.asObservable().pipe(
      filter((e) => {
        if (filterCriteria?.lineId !== undefined && e.lineId !== filterCriteria.lineId) {
          return false;
        }
        if (filterCriteria?.stationId !== undefined && e.stationId !== filterCriteria.stationId) {
          return false;
        }
        return true;
      }),
      map((e) => ({
        id: String(e.id),
        type: e.event,
        data: e.data,
      } as MessageEvent)),
    );

    // Heartbeat ping after 1s then every 15 seconds to prevent proxy/ngrok/carrier timeouts
    const heartbeat$ = timer(1000, 15000).pipe(
      map(() => ({
        type: 'ping',
        data: { timestamp: new Date().toISOString() },
      } as MessageEvent)),
    );

    return merge(events$, heartbeat$);
  }
}
