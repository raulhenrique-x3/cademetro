# Database Relationships

Logical entity-relationship map. All relations are implemented in `contract.prisma` (see
`database/schema.md`). Cardinality and direction below.

## ER summary

```text
User 1 ── N Report
User 1 ── N ReportConfirmation
Report 1 ── N ReportConfirmation

Line 1 ── N Direction
Line 1 ── N StationLine ── N 1 Station      (many-to-many Line↔Station via StationLine)
Line 1 ── N Report
Station 1 ── N Report
Direction 1 ── N Report
```

## Relations in detail

| Relation | Cardinality | FK column | Notes |
|----------|-------------|-----------|-------|
| `User.reports` → `Report.author` | 1:N | `Report.authorId` | Author owns reports. |
| `User.confirmations` → `ReportConfirmation.user` | 1:N | `ReportConfirmation.userId` | |
| `Report.confirmations` → `ReportConfirmation.report` | 1:N | `ReportConfirmation.reportId` | |
| `Line.stations` via `StationLine` | M:N | `StationLine.lineId`, `StationLine.stationId` | Join with `order` (station position on line). |
| `Line.directions` → `Direction.line` | 1:N | `Direction.lineId` | Two directions per line. |
| `Line.reports` → `Report.line` | 1:N | `Report.lineId` | |
| `Station.reports` → `Report.station` | 1:N | `Report.stationId` | Nullable. |
| `Direction.reports` → `Report.direction` | 1:N | `Report.directionId` | Nullable. |

## Key relationship semantics

- **Line ↔ Station is M:N** through `StationLine`. A station belongs to one or more lines
  (interchanges); its position (`order`) is defined per line. There is **no** single `Station.lineId`.
- **Report is the hub**: a report links `Line` (required) and optionally `Station` and `Direction`.
  When a `Direction` is set it must belong to the report's `Line`. When a `Station` is set it must be
  a station of that line (validated in service).
- **ReportConfirmation is a strict edge** between a `User` and a `Report`, constrained unique
  `(reportId, userId)`. A user cannot confirm/dispute their own report (service rule).

## Traversal patterns used by queries

- **Line status**: `Report` where `lineId = L` and `createdAt >= now-window` and `isHidden = false`,
  ordered by `createdAt` desc → uses `(lineId, createdAt)` index.
- **Station status**: `Report` where `stationId = S` ... → uses `(stationId, createdAt)` index.
- **Recent reports (global)**: `Report` ordered by `createdAt` desc limit N → uses `(createdAt)`.
- **Report detail with counts**: `Report` + aggregate of `ReportConfirmation` grouped by type →
  uses `(reportId, type)` index.
- **User trust**: `Report` where `authorId = U` + their `ReportConfirmation` edges → uses
  `(authorId)`.

## Join table guidance

`StationLine` and `ReportConfirmation` are genuine join/edge tables. They are named without a
separating underscore (Prisma Next default pluralization). Do not add redundant intermediary tables
for `Report` ↔ `Line`/`Station`/`Direction` — those are direct FKs, not M:N.