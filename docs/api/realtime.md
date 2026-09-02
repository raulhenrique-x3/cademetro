# API: Realtime (SSE)

`GET /events` is the Server-Sent Events endpoint. Architecture in `architecture/realtime.md`.

## Endpoint

```
GET /events
GET /events?lineId=1
GET /events?lineId=1&stationId=12
```

- Public (no auth).
- Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
  `Connection: keep-alive`.
- Optional filters `lineId` / `stationId`; server drops events not matching.

## Event format

Each frame:

```text
id: <eventId>
event: <eventName>
data: <json>

```

Heartbeat comment (every 30 s when idle):

```text
: ping

```

## Event types

| `event` | `data` payload | When emitted |
|---------|----------------|--------------|
| `report.created` | `ReportDto` | a report was created (`POST /reports`). |
| `report.confirmed` | `ReportDto` (updated counts/confidence) | a report was confirmed. |
| `report.disputed` | `ReportDto` (updated counts/confidence) | a report was disputed. |
| `status.updated` | `LineStatusDto` or `StationStatusDto` | the derived status changed for a line/station after a relevant report. |

`ReportDto` / `LineStatusDto` / `StationStatusDto` match `api/reports.md` / `api/status.md`. Every
event payload carries `lineId` (and `stationId` when relevant) so clients can filter.

## Example stream

```text
id: 1
event: report.created
data: {"id":101,"type":"TRAIN_ARRIVING","lineId":1,"stationId":12,...}

id: 2
event: status.updated
data: {"lineId":1,"status":"RESTRICTED","lastUpdateTime":"...","windowMinutes":30,...}

: ping

id: 3
event: report.confirmed
data: {"id":101,...,"confirmations":{"confirm":1,"dispute":0},...}
```

## Client behavior

1. Connect via `EventSource('/events')` (optionally filtered).
2. On connect, **fetch the snapshot** via REST (`GET /status`, `GET /reports/recent`) — the stream
   carries only deltas.
3. Apply each named event to the TanStack Query cache (invalidate/update affected queries).
4. `EventSource` auto-reconnects; on reconnect, re-fetch the snapshot then resume.

## Reconnection / Last-Event-ID

- `EventSource` sends `Last-Event-ID` on reconnect. For the MVP the server does **not** replay a
  history buffer (keeps the server stateless); the client re-snapshots via REST instead. This is the
  documented trade-off for simplicity. See `architecture/realtime.md`.

## Errors

- Invalid query params → `400`.
- The stream does not leak authentication state (public).
- On server shutdown, connections complete; clients see reconnection attempts.

## Consistency with API

SSE `ReportDto`, `LineStatusDto`, `StationStatusDto` are the **same** shapes returned by the REST
endpoints. There is exactly one DTO definition per resource (Swagger-sourced) shared between REST
and SSE. If a shape changes, both must change together — enforced by the single-DTO rule.