# Domain: Report

## Purpose

The central input of CadêMetrô. A `Report` records that a user observed an event on the network at a
point in time. All operational status and reliability are derived from `Report` rows.

## Report types (enum `ReportType`)

| Type | Scope | stationId | directionId |
|------|-------|-----------|-------------|
| `TRAIN_ARRIVING` | station-direction | required | required |
| `TRAIN_ARRIVED` | station-direction | required | required |
| `TRAIN_DEPARTED` | station-direction | required | required |
| `TRAIN_STOPPED` | station-direction | required | required |
| `OPERATIONAL_RESTRICTION` | line (station optional) | optional | optional |
| `SERVICE_INTERRUPTION` | line (station optional) | optional | optional |
| `NORMAL_OPERATION` | line (station optional) | optional | optional |

## Important fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | Int | auto | PK. |
| `type` | enum `ReportType` | yes | Which event was observed. |
| `lineId` | Int | yes | FK → Line. Always set. |
| `stationId` | Int? | by-type | FK → Station. Required for `TRAIN_*`. |
| `directionId` | Int? | by-type | FK → Direction. Required for `TRAIN_*`. |
| `authorId` | Int | yes | FK → User (the reporter). |
| `description` | String? | no | Optional free text. |
| `locationLat` / `locationLng` | Float? | no | Optional client-provided position at report time. |
| `isHidden` | Boolean | yes | Moderation soft-hide (`false` default). |
| `hiddenReason` | String? | no | Set when hidden. |
| `createdAt` / `updatedAt` | timestamptz | auto | `createdAt` is the report timestamp. |

## Relationships

- `line`, `station?`, `direction?`, `author` (N:1).
- `confirmations ReportConfirmation[]` (1:N).

## Invariants

1. `lineId` always set.
2. `TRAIN_*` → `stationId` and `directionId` required.
3. `OPERATIONAL_RESTRICTION` / `SERVICE_INTERRUPTION` / `NORMAL_OPERATION` → `lineId` required,
   `stationId`/`directionId` optional.
4. If `directionId` set → must belong to `lineId`.
5. If `stationId` set → station must belong to `lineId` (via `StationLine`).
6. `authorId` must reference an `ACTIVE` user.
7. A user cannot confirm/dispute their own report (enforced in service).

Invariants 2–5 are business rules enforced in `ReportsService` (validated against the contract).
The database enforces referential integrity and the confirm-dispute unique constraint, but not the
conditional per-type rules.

## Lifecycle

1. Author submits a report → validated (type/scope rules) → stored with server `createdAt`.
2. Other users confirm/dispute → `ReportConfirmation` rows created.
3. Moderator may soft-hide (`isHidden = true`, `hiddenReason`) — excludes the report from queries and
   aggregation. **Decision:** soft-hide, not hard delete, to preserve history and auditability.
4. Hidden reports are never surfaced to clients and never influence status.

## Derived (computed, not stored)

- **Confidence** — per-report reliability signal (see `domain/reliability.md`).
- **Confirm/dispute counts** — derived by counting `ReportConfirmation` rows; exposed in responses.
- **`OperationalStatus`** — derived by aggregating recent non-hidden reports (below).

## Status aggregation rules (per line, and per station)

A status value is computed over **recent, non-hidden** reports in a fixed window (default **30
minutes**, constant `STATUS_WINDOW_MINUTES`). Priority by the **most recent** report's type:

1. If the most recent relevant report is `SERVICE_INTERRUPTION` → `INTERRUPTED`.
2. Else if most recent is `OPERATIONAL_RESTRICTION` → `RESTRICTED`.
3. Else if most recent is `NORMAL_OPERATION` → `NORMAL`.
4. Else (no relevant report in window, or only `TRAIN_*` events) → `UNKNOWN`.

`TRAIN_*` events inform "last known train events" but do **not** set line/station status.

- **Per-station status**: filter the window by `stationId`.
- **Per-line status**: filter the window by `lineId` (no station filter).
- `lastUpdateTime` = `max(createdAt)` among the reports considered.
- If multiple status-setting reports conflict, the **most recent** wins. This is simple and explicit;
  a tie between two recent conflicting reports is resolved by timestamp only (MVP does not weigh
  confidence in the status decision, though confidence is exposed alongside).

This aggregation lives in `StatusModule` / `StatusService` and is unit-testable in isolation.