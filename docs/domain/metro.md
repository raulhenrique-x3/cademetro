# Domain: Metro infrastructure

Seed data that describes the physical metro network. Read-only at runtime; populated as seed data.

## Entities

### Line

A metro line.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | Int | auto | PK. |
| `name` | String | yes | e.g. "Linha 1–Azul". |
| `code` | String | yes | Unique code, e.g. `1-azul`. |
| `color` | String | yes | Hex color for UI, e.g. `#005FA8`. |
| `createdAt` / `updatedAt` | timestamptz | auto | |

Relationships: `stations` (via `StationLine`), `directions`, `reports`.

### Station

A station with geographic coordinates.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | Int | auto | PK. |
| `name` | String | yes | Unique. |
| `code` | String? | no | Operator code, e.g. `L1-S12`. |
| `latitude` | Float | yes | WGS84. |
| `longitude` | Float | yes | WGS84. |
| `createdAt` / `updatedAt` | timestamptz | auto | |

Relationships: `lines` (via `StationLine`), `reports`.

### StationLine (join: station ordering)

Records which line a station belongs to and its position on that line.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | Int | auto | PK. |
| `lineId` | Int | yes | FK → Line. |
| `stationId` | Int | yes | FK → Station. |
| `order` | Int | yes | Position on the line (0-based). |
| `createdAt` | timestamptz | auto | |

Constraints: `@@unique([lineId, stationId])`, `@@unique([lineId, order])`.

### Direction

A travel direction / endpoint of a line. A line has exactly two directions.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | Int | auto | PK. |
| `lineId` | Int | yes | FK → Line. |
| `name` | String | yes | Endpoint station name, e.g. "Jabaquara". |
| `code` | String | yes | Short code, e.g. `JAB`. |
| `createdAt` | timestamptz | auto | |

Constraint: `@@unique([lineId, name])`.

## Invariants

1. A station can appear on multiple lines (interchange); `StationLine` encodes membership + order.
2. A station's position is meaningful only within a line (`order` per `lineId`).
3. A `Direction` belongs to exactly one line and names one endpoint.
4. Line codes and station names are unique.

## Seed data (PLANNED)

A seed script (or SQL) populates the network for the single operator covered by the MVP. Minimum
viable seed: at least one line with its two directions and a few stations in order. The seed is a
`prisma` seed script runnable via `npx prisma db seed` or an idempotent script invoked from the CLI.

## Reporting scope

Reports reference the metro network: a `Report.lineId` is required; `Report.stationId` and
`Report.directionId` are validated against `StationLine` / `Direction` (direction must belong to the
same line; station must be on the line when a station is provided). See `domain/reports.md`.