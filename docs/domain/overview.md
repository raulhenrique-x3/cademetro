# Domain Overview

The domain is split into **raw data** (what users report) and **derived data** (what the system
calculates). The MVP stores raw data and computes derived data on demand. Storing derived data is
avoided unless it cannot be safely recomputed.

## Entities

| Entity | Kind | Stored? | Purpose |
|--------|------|---------|---------|
| `User` | raw | yes | Account + trust signal. |
| `Line` | raw | yes | A metro line. |
| `Station` | raw | yes | A station (coordinates). |
| `StationLine` | raw | yes | Ordering of a station on a line (join). |
| `Direction` | raw | yes | A travel direction / endpoint of a line. |
| `Report` | raw | yes | A user-submitted event. |
| `ReportConfirmation` | raw | yes | A confirm/dispute on a report. |
| `OperationalStatus` | derived | **no** | Aggregated line/station status. |
| `Confidence` / reliability | derived | **no** | Per-report reliability signal. |

## Raw data (stored)

Entities the user creates or that seed the system: `Line`, `Station`, `StationLine`, `Direction`,
`Report`, `ReportConfirmation`, `User`. `Report` is the central input: a user says "a train is
arriving at station X heading toward Y".

## Derived data (computed, not stored)

### OperationalStatus

```text
Report
   ↓ aggregation (recent, per line/station)
   ↓
OperationalStatus (NORMAL | RESTRICTED | INTERRUPTED | UNKNOWN)
```

Computed on request from recent `Report` rows. No `operational_status` table. See
`domain/reports.md` for the exact aggregation rules.

### Confidence / reliability

Per-report signal derived from age, confirmations, disputes, and author trust. Computed on request
and included in report/status responses. See `domain/reliability.md`.

### User trust

Derived from a user's report + confirmation history. Used as an input to confidence. See
`domain/reliability.md`.

## Why derived data is not stored

- Avoids a second source of truth that can drift from `Report` data.
- Status is inherently time-windowed; recomputing is cheap at MVP scale.
- Single write path: `Report` / `ReportConfirmation` → everything else recomputes.

## Invariants (cross-cutting)

1. A `Report` always has a `lineId`.
2. Train events (`TRAIN_*`) require a `stationId` and a `directionId`.
3. Line-wide types (`OPERATIONAL_RESTRICTION`, `SERVICE_INTERRUPTION`, `NORMAL_OPERATION`) require a
   `lineId`; `stationId`/`directionId` are optional.
4. A user cannot confirm/dispute their own `Report`.
5. A user has at most one `ReportConfirmation` per `Report` (enforced by a unique constraint).
6. `Direction` must belong to the same line as the report's `lineId`.
7. A station can appear on multiple lines; its position is given by `StationLine.order`.
8. Only `status = ACTIVE` users may create reports or confirm/dispute.

Per-entity detail: `domain/users.md`, `domain/metro.md`, `domain/reports.md`, `domain/reliability.md`.