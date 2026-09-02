# Real-Time Architecture

## Decision

Real-time updates use **Server-Sent Events (SSE)**, not WebSockets. SSE is one-way (server→client),
which is exactly the MVP need: push new reports and status changes to connected clients. Client→server
writes remain plain REST `POST`s.

Rationale:
- SSE is plain HTTP; no upgrade handshake, works behind proxies/load balancers trivially.
- `EventSource` auto-reconnects with built-in `Last-Event-ID` support.
- No new protocol code, no message framing to manage.
- WebSockets add bidirectionality we do not need; explicitly rejected for the MVP.

## Data flow

```text
User A                          NestJS                              User B / User C
  │                               │                                     │
  │ POST /reports                 │                                     │
  ├──────────────────────────────►│                                     │
  │                               │ 1. validate (DTO)                   │
  │                               │ 2. persist (Prisma)                 │
  │                               │ 3. EventsService.publish(...)       │
  │                               │      │ in-process RxJS Subject      │
  │                               │      ▼                              │
  │                               │  StatusService recompute (on read)  │
  │                               │      │                              │
  │                               │      └─► SSE /events                 │
  │                               │              │                      │
  │                               │      ┌───────┴────────┐             │
  │                               │      ▼                ▼             │
  │                               │  User B           User C            │
```

## Components (backend)

- **`EventsModule`** (`src/events/`):
  - `EventsService`: an RxJS `Subject<MetroEvent>` (in-memory). Methods: `publish(event)`,
    `subscribe()` returning an `Observable`.
  - `EventsController`: `@Sse('events')` handler that maps each client to a filtered observable
    from the shared Subject.
- **`MetroEvent`** shape (see `api/realtime.md` for exact payloads):

```text
event name    data (JSON)
────────────────────────────────────────────
report.created   ReportDto
report.confirmed ReportDto  (updated counts)
report.disputed  ReportDto  (updated counts)
status.updated   LineStatusDto | StationStatusDto
```

- Publishing points: `ReportsService` after a successful `create`/`confirm`/`dispute`; `StatusModule`
  after recompute (or the events are derived by clients via a subsequent status fetch). The MVP
  publishes `report.created`/`report.confirmed`/`report.disputed` directly, and `status.updated`
  is published whenever the affected line/station status changes as a result.

## Endpoint: `GET /events`

- `Content-Type: text/event-stream`; `Cache-Control: no-cache`; `Connection: keep-alive`.
- Supports optional query filters: `?lineId=` (and optionally `?stationId=`).
- Each event frame:

```text
id: <eventId>
event: report.created
data: { ...json... }

```

- A **heartbeat** comment (`: ping`) is sent every 30 s when there is no traffic, to keep the
  connection alive through idle proxies and to surface dead connections.

## Connection lifecycle

1. Client opens `GET /events` (optionally with `lineId`/`stationId`).
2. Server registers a per-client observable; begins streaming.
3. Server sends the current snapshot first (or the client re-fetches status/recent reports
   separately — **decision**: the client fetches the snapshot via REST on connect, and the SSE
   stream only carries deltas).
4. Client stays connected; receives named events.
5. On server shutdown or client disconnect, the observable completes and the connection closes.

## Reconnection behavior

- `EventSource` auto-reconnects on network error / server restart.
- Each event has an `id`. On reconnect, the browser sends `Last-Event-ID`. For the MVP, the server
  does **not** replay a history buffer; instead the client, on reconnect, **re-fetches** the status +
  recent reports snapshot via REST, then resumes the stream. This keeps the server stateless and
  simple, and correctness is preserved (snapshot + live deltas).
- Heartbeat (`: ping`) also acts as a liveness probe.

## Event format

- `event`: one of `report.created`, `report.confirmed`, `report.disputed`, `status.updated`.
- `data`: JSON string of the corresponding DTO (see `api/realtime.md`).
- `id`: monotonically increasing event id (server sequence per publication).

## Filtering

- Server-side: a client subscribing with `?lineId=5` receives only events whose payload
  `lineId === 5`. Station filter narrows to a specific station. Applied via `filter()` on the
  shared Subject per client.
- No per-user auth on the stream (public read), consistent with the read model being public.

## Error handling

- Unparseable/invalid client connections: close gracefully.
- Downstream disconnect (client gone): unsubscribe the per-client observable; no leak (complete on
  `response.on('close')`).
- Backend failure mid-stream: send an SSE `error` event (optional) then close; client reconnects and
  re-snapshots.

## Scale-out note (PLANNED, not MVP)

If the backend ever runs more than one process, the in-memory Subject no longer spans processes. The
MVP does **not** address this. The documented future path is to back the bus with
Postgres `LISTEN/NOTIFY` or Redis pub/sub — a separate change, out of MVP scope.