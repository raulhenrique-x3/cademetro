# API: Status

Operational status is **derived** from recent non-hidden reports (see `domain/reports.md`). These
endpoints compute it on demand; there is no stored status table.

## Status values

`NORMAL` | `RESTRICTED` | `INTERRUPTED` | `UNKNOWN` — enum `LineStatus` (derived, not a DB enum).

## `GET /status`

Public. Aggregate operational status for the requested scope.

Query params:
- `lineId` — required to scope to one line (optional; when omitted, returns all lines).
- `stationId` — optional; when set, scopes to that station on the line.

Responses:
- `200` → `LineStatusDto` when `lineId` given, else `LineStatusDto[]`.

```json
{
  "lineId": 1,
  "lineCode": "1-azul",
  "stationId": null,
  "status": "RESTRICTED",
  "lastUpdateTime": "2026-09-02T10:00:00.000Z",
  "windowMinutes": 30,
  "reports": [
    { "id": 101, "type": "OPERATIONAL_RESTRICTION", "confidence": 0.82, "confirmations": { "confirm": 2, "dispute": 0 }, "createdAt": "..." }
  ]
}
```

- `status` — computed per the priority rules (most recent report wins: `SERVICE_INTERRUPTION` →
  `INTERRUPTED`; `OPERATIONAL_RESTRICTION` → `RESTRICTED`; `NORMAL_OPERATION` → `NORMAL`; else
  `UNKNOWN`).
- `lastUpdateTime` — `max(createdAt)` among reports considered.
- `windowMinutes` — the aggregation window constant (30).
- `reports` — the recent reports considered (with confidence), newest first, capped (e.g. 20).

Errors:
- `400` — invalid params.
- `404` — unknown `lineId` / `stationId`.

## `GET /stations/:id/status`

Public. Station-scoped status.

Responses:
- `200` → `StationStatusDto`

```json
{
  "stationId": 12,
  "stationName": "Jabaquara",
  "lineId": 1,
  "status": "NORMAL",
  "lastUpdateTime": "...",
  "windowMinutes": 30,
  "reports": []
}
```

- `404` — station not found.

## Derivation summary

```text
GET /status?lineId=&stationId=
        └─► StatusService
              query recent reports (lineId[, stationId], window, isHidden=false)
              order by createdAt desc
              status = first(INTERRUPTED > RESTRICTED > NORMAL) else UNKNOWN
              attach confidence per report
              return { status, lastUpdateTime, reports }
```

This logic is unit-tested without a database (see `testing/strategy.md`).