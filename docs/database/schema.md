# Database Schema

PostgreSQL 15+. Managed by **Prisma Next** (contract-based). The authoritative source of truth is
`back-end/src/prisma/contract.prisma`. Workflow:

```bash
npx prisma contract emit     # regenerate contract.json + contract.d.ts
npx prisma db init           # create tables
```

**Naming:** Prisma Next maps model fields to columns preserving the field name as written in the
contract (camelCase), and table names to lowercase model names (see the generated `contract.d.ts`
where model `User` → table `user`, field `createdAt` → column `createdAt`). Keep fields camelCase.

**Timestamps:** use `TimestamptzString @default(now())` for `createdAt` and
`temporal.updatedAtString()` for `updatedAt` (the repo convention, see the demo contract). Timestamps
are `timestamptz` and returned as ISO strings by the client.

## Proposed `contract.prisma` (PLANNED — replaces the demo `User`/`Post`)

```prisma
// use prisma-next

enum ReportType {
  TRAIN_ARRIVING
  TRAIN_ARRIVED
  TRAIN_DEPARTED
  TRAIN_STOPPED
  OPERATIONAL_RESTRICTION
  SERVICE_INTERRUPTION
  NORMAL_OPERATION
}

enum ConfirmationType {
  CONFIRM
  DISPUTE
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

model User {
  id            Int                  @id @default(autoincrement())
  email         String               @unique
  passwordHash  String
  username      String?
  name          String?
  role          UserRole             @default(USER)
  status        UserStatus           @default(ACTIVE)
  reports       Report[]
  confirmations ReportConfirmation[]
  createdAt     TimestamptzString    @default(now())
  updatedAt     temporal.updatedAtString()
}

model Line {
  id           Int               @id @default(autoincrement())
  name         String
  code         String            @unique
  color        String
  directions   Direction[]
  stationLines StationLine[]
  reports      Report[]
  createdAt    TimestamptzString @default(now())
  updatedAt    temporal.updatedAtString()
}

model Station {
  id           Int               @id @default(autoincrement())
  name         String            @unique
  code         String?
  latitude     Float
  longitude    Float
  stationLines StationLine[]
  reports      Report[]
  createdAt    TimestamptzString @default(now())
  updatedAt    temporal.updatedAtString()
}

model StationLine {
  id        Int     @id @default(autoincrement())
  lineId    Int
  stationId Int
  order     Int
  line      Line    @relation(fields: [lineId], references: [id])
  station   Station @relation(fields: [stationId], references: [id])

  @@unique([lineId, stationId])
  @@unique([lineId, order])
}

model Direction {
  id        Int      @id @default(autoincrement())
  lineId    Int
  name      String
  code      String
  line      Line     @relation(fields: [lineId], references: [id])
  reports   Report[]

  @@unique([lineId, name])
}

model Report {
  id           Int                    @id @default(autoincrement())
  type         ReportType
  lineId       Int
  stationId    Int?
  directionId  Int?
  authorId     Int
  description  String?
  locationLat  Float?
  locationLng  Float?
  isHidden     Boolean                @default(false)
  hiddenReason String?
  line         Line                   @relation(fields: [lineId], references: [id])
  station      Station?               @relation(fields: [stationId], references: [id])
  direction    Direction?             @relation(fields: [directionId], references: [id])
  author       User                   @relation(fields: [authorId], references: [id])
  confirmations ReportConfirmation[]
  createdAt    TimestamptzString      @default(now())
  updatedAt    temporal.updatedAtString()

  @@index([lineId, createdAt])
  @@index([stationId, createdAt])
  @@index([directionId, createdAt])
  @@index([createdAt])
  @@index([authorId])
}

model ReportConfirmation {
  id        Int              @id @default(autoincrement())
  reportId  Int
  userId    Int
  type      ConfirmationType
  report    Report           @relation(fields: [reportId], references: [id])
  user      User             @relation(fields: [userId], references: [id])
  createdAt TimestamptzString @default(now())

  @@unique([reportId, userId])
  @@index([reportId, type])
}
```

## Tables

| Table | Purpose |
|-------|---------|
| `user` | Accounts, roles, status. |
| `line` | Metro lines. |
| `station` | Stations + coordinates. |
| `stationline` | Station↔line membership + order. |
| `direction` | Endpoints/directions per line. |
| `report` | User-submitted events. |
| `reportconfirmation` | Confirm/dispute actions. |

(`OperationalStatus` is **derived** and intentionally has **no table**.)

## Columns, PK, FK

- Every table has `id Int @id @default(autoincrement())` as primary key.
- Foreign keys (composite via relation fields):
  - `Report.lineId → Line.id`
  - `Report.stationId → Station.id` (nullable)
  - `Report.directionId → Direction.id` (nullable)
  - `Report.authorId → User.id`
  - `ReportConfirmation.reportId → Report.id`
  - `ReportConfirmation.userId → User.id`
  - `StationLine.lineId → Line.id`, `StationLine.stationId → Station.id`
  - `Direction.lineId → Line.id`

## Enums

`ReportType`, `ConfirmationType`, `UserRole`, `UserStatus` — PostgreSQL enums via Prisma contract.

## Unique constraints

- `user.email`
- `line.code`
- `station.name`
- `stationline (lineId, stationId)`
- `stationline (lineId, order)`
- `direction (lineId, name)`
- `reportconfirmation (reportId, userId)` — one confirm/dispute per user per report.

## Indexes (drives common queries)

| Index | Purpose |
|-------|---------|
| `report (lineId, createdAt)` | recent reports by line; line status window. |
| `report (stationId, createdAt)` | reports by station; station status window. |
| `report (directionId, createdAt)` | reports by direction. |
| `report (createdAt)` | global recent reports. |
| `report (authorId)` | a user's reports / trust derivation. |
| `reportconfirmation (reportId, type)` | count confirms/disputes per report. |
| `reportconfirmation (reportId, userId)` | unique: enforce one action per user (unique index). |
| `station (name)` | lookup (unique). |

All `report` timestamps are indexed with `createdAt` because the status window and "recent" queries
filter/sort by time.

## Deletion behavior

- **No hard deletes** in the MVP. Moderation uses soft-hide: `Report.isHidden = true` (+
  `hiddenReason`). User suspension uses `User.status = SUSPENDED`.
- This preserves report history, authorship, and auditability. Cascade delete is not used.