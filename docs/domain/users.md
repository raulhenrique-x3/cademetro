# Domain: User

## Purpose

Represents a registered account. Provides authentication identity, a profile, a moderation role, and
the basis for a trust/reputation signal.

## Important fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | Int | auto | PK, autoincrement. |
| `email` | String | yes | Unique; login identifier. Lowercased + trimmed on save. |
| `passwordHash` | String | yes | bcrypt hash. Never returned over the API. |
| `username` | String? | no | Display handle (optional). |
| `name` | String? | no | Display name (optional). |
| `role` | enum `UserRole` | yes | `USER` default; `MODERATOR`, `ADMIN`. |
| `status` | enum `UserStatus` | yes | `ACTIVE` default; `SUSPENDED` (cannot act). |
| `createdAt` / `updatedAt` | timestamptz | auto | Prisma Next: `TimestamptzString`, `temporal.updatedAtString()`. |

## Relationships

- `reports Report[]` — authored reports.
- `confirmations ReportConfirmation[]` — confirm/dispute actions.

## Invariants

- `email` unique and valid.
- `passwordHash` is never null and never serialized.
- Only `ACTIVE` users may create reports or confirm/dispute (enforced in service; DB does not encode
  this).

## Lifecycle

1. Register → email + password → create `User` (`role=USER`, `status=ACTIVE`).
2. Login → verify password → issue JWT.
3. Suspension: `status = SUSPENDED` (moderation); existing content remains but user cannot act.
4. No hard delete in MVP (preserve report authorship and history).

## Required vs derived

- **Required/stored**: `id`, `email`, `passwordHash`, `role`, `status`, `username?`, `name?`,
  timestamps.
- **Derived** (computed, not stored): `trustScore` from report/confirmation history. See
  `domain/reliability.md`.

## Auth mapping

`id`, `role`, `status` are the JWT payload claims used by the auth guard. See
`api/authentication.md`.

## Moderation note

`MODERATOR` is the minimum role needed to hide problematic reports. `ADMIN` is reserved for user
management (suspend) — kept minimal; no admin console is built in the MVP. See `security/overview.md`.