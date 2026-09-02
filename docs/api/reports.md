# API: Reports

## `POST /reports`

Bearer token. Creates a report.

Request body:
```json
{
  "type": "TRAIN_ARRIVING",
  "lineId": 1,
  "stationId": 12,
  "directionId": 3,
  "description": "train at platform, doors open",
  "locationLat": -23.5505,
  "locationLng": -46.6333
}
```

Per-type field rules (enforced in `ReportsService`, matching `domain/reports.md`):

| `type` | `lineId` | `stationId` | `directionId` |
|--------|----------|-------------|---------------|
| `TRAIN_ARRIVING` / `ARRIVED` / `DEPARTED` / `STOPPED` | required | required | required |
| `OPERATIONAL_RESTRICTION` / `SERVICE_INTERRUPTION` / `NORMAL_OPERATION` | required | optional | optional |

- `description` — optional string (max 500).
- `locationLat` / `locationLng` — optional floats (client position at report time).

Validation: `type` ∈ enum; required fields per type; `directionId` must belong to `lineId`; if
`stationId` set it must be a station of `lineId`.

Responses:
- `201` → `ReportDto` (below), including `confidence`, `confirmations`, `authorTrust`.
- `400` — validation failed (incl. invalid per-type scope).
- `401` — not authenticated.
- `403` — account suspended.
- `404` — unknown `lineId` / `stationId` / `directionId`.
- `429` — rate limit exceeded.

On success, the backend publishes `report.created` SSE events and recomputes status (see
`api/realtime.md`).

## `GET /reports/recent`

Public. Returns recent non-hidden reports, newest first.

Query params:
- `lineId` — filter by line (optional).
- `stationId` — filter by station (optional).
- `directionId` — filter by direction (optional).
- `limit` — max results (default 20, max 100).
- `before` — ISO timestamp; paginate to reports older than this (optional, cursor).

Responses:
- `200` → `{ "reports": ReportDto[], "total": number }`
- `400` — invalid params.

## `GET /reports/:id`

Public. Single report with confirmations.

Responses:
- `200` → `ReportDto` (includes `confirmations` counts and list).
- `404` — not found or hidden.

## `POST /reports/:id/confirm` and `POST /reports/:id/dispute`

Bearer token. Add or toggle a confirmation on a report. A user has at most one action per report
(unique `(reportId, userId)`); calling the same action again removes it (toggle), calling the
opposite switches the type.

Constraints:
- Cannot act on your **own** report → `403`.
- Report must exist and not be hidden → `404`.
- Account must be active → `403`.

Responses:
- `200` → `ReportDto` (updated `confirmations`, `confidence`).
- `400` — invalid report id.
- `401` — not authenticated.
- `403` — own report / suspended.
- `404` — report not found or hidden.

On success, publishes `report.confirmed` / `report.disputed` SSE events.

## `PATCH /reports/:id/hide`

Bearer token, role `MODERATOR` or `ADMIN`. Soft-hides a report.

Request body:
```json
{ "reason": "spam / incorrect information" }
```

Responses:
- `200` → `ReportDto` (`isHidden: true`).
- `403` — not a moderator.
- `404` — report not found.

Hidden reports are excluded from all queries, status aggregation, and reliability. This is the
minimum moderation structure; no admin console is built.

## `ReportDto`

```json
{
  "id": 101,
  "type": "TRAIN_ARRIVING",
  "lineId": 1,
  "lineCode": "1-azul",
  "stationId": 12,
  "stationName": "Jabaquara",
  "directionId": 3,
  "directionName": "Jabaquara",
  "author": { "id": 5, "username": "metro_user", "trustScore": 0.5 },
  "description": "train at platform, doors open",
  "locationLat": -23.5505,
  "locationLng": -46.6333,
  "confirmations": { "confirm": 2, "dispute": 0 },
  "confidence": 0.82,
  "independentReportCount": 1,
  "createdAt": "2026-09-02T10:00:00.000Z"
}
```

`lineCode`, `stationName`, `directionName` are denormalized convenience fields joined for display.
`confirmations`, `confidence`, `independentReportCount`, `author.trustScore` are derived (see
`domain/reliability.md`).