# API Overview

REST API, JSON, Swagger/OpenAPI at `/docs` (via `@nestjs/swagger`). The API has **no global prefix**
(paths start at root). Base URL is configurable via `EXPO_PUBLIC_API_URL` on the frontend.

## Base URL & versioning

- No `/api` prefix and no URL version segment for the MVP. Keep it simple; a prefix can be added
  later behind a router without breaking clients.

## Authentication model

- **Reads are public** (no token): `GET /lines`, `GET /stations`, `GET /reports/recent`,
  `GET /reports/:id`, `GET /status`, `GET /stations/:id/status`, `GET /events`.
- **Writes require a JWT** (Bearer token in `Authorization: Bearer <token>`): `POST /auth/register`
  (returns token), `POST /auth/login` (returns token), `POST /reports`, `POST /reports/:id/confirm`,
  `POST /reports/:id/dispute`, `GET /auth/me`.
- Protected routes return `401` when the token is missing/expired/invalid.

## Error shape (uniform)

All errors use one envelope. The backend must **not** leak internal details.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed (the fields must be of type: email)",
  "path": "/auth/register",
  "timestamp": "2026-09-02T10:00:00.000Z"
}
```

| `statusCode` | `error` | Meaning | Used for |
|--------------|---------|---------|----------|
| 400 | Bad Request | Validation failed | DTO validation errors, malformed payloads. |
| 401 | Unauthorized | Not authenticated | Missing/expired/invalid JWT. |
| 403 | Forbidden | Authenticated but not allowed | Confirming own report, suspended user, moderator-only action. |
| 404 | Not Found | Resource missing | Unknown station/line/report id. |
| 409 | Conflict | Duplicate / conflicting state | Duplicate email on register. |
| 429 | Too Many Requests | Rate limit exceeded | Report creation, login throttling. |
| 500 | Internal Server Error | Unexpected | Server fault; generic message only. |

Implementation: a global exception filter maps `ValidationPipe` errors, custom domain exceptions, and
unknown errors to this shape. See `security/overview.md` and `testing/strategy.md`.

## Endpoint map

| Method | Path | Auth | Module |
|--------|------|------|--------|
| POST | `/auth/register` | public | Auth |
| POST | `/auth/login` | public | Auth |
| GET | `/auth/me` | bearer | Auth |
| GET | `/lines` | public | Metro |
| GET | `/lines/:id` | public | Metro |
| GET | `/stations` | public | Metro |
| GET | `/stations/:id` | public | Metro |
| GET | `/reports/recent` | public | Reports |
| GET | `/reports/:id` | public | Reports |
| POST | `/reports` | bearer | Reports |
| POST | `/reports/:id/confirm` | bearer | Reports |
| POST | `/reports/:id/dispute` | bearer | Reports |
| GET | `/status` | public | Status |
| GET | `/stations/:id/status` | public | Status |
| GET | `/events` | public (SSE) | Events |
| PATCH | `/reports/:id/hide` | bearer + MODERATOR | Reports (moderation) |

## Conventions

- Request bodies are DTO classes validated by `ValidationPipe` (whitelist + forbidNonWhitelisted).
- Timestamps are ISO-8601 strings.
- Enum values are the PascalCase strings defined in `database/schema.md`.
- Pagination (for `GET /reports/recent`) uses `limit` (default 20, max 100).
- Optional geographic position on report creation: `locationLat` / `locationLng`.

Per-resource specs: `api/authentication.md`, `api/reports.md`, `api/stations.md`, `api/status.md`,
`api/realtime.md`.

## Unresolved decisions

- Whether to add a URL version prefix (`/v1`) before public launch. **Not decided**; for MVP, no
  prefix. Revisit before any breaking change.