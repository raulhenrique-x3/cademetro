# Security Overview

## Authentication & sessions

- **JWT access token** (`@nestjs/jwt`), HMAC-signed with `JWT_SECRET`. Payload: `{ sub: userId,
  role, status }`. Expiry default **1 h** (`JWT_EXPIRES_IN`).
- **No refresh tokens** in the MVP. Rationale: refresh-token infrastructure (rotation, storage,
  revocation) adds complexity with no MVP benefit — sessions are short and reads are public. Revisit
  only if token lifetime becomes a real problem.
- Password hashing with **bcryptjs** (cost factor default 10-12). `passwordHash` is never returned
  (`@Exclude()` + `ClassSerializerInterceptor`).
- Auth guard verifies signature + expiry + user `status` (`ACTIVE` required to act).

## Password policy

- Register/login: `password` min 8 chars (class-validator `@MinLength(8)`). No forced complexity in
  the MVP (keep friction low); hash cost provides the main protection.

## Token storage (frontend)

- `expo-secure-store` on native; `AsyncStorage`/`localStorage` fallback on web. Injected into Axios
  via interceptor. Cleared on logout / on 401.

## Rate limiting

Use **`@nestjs/throttler`** (required by the requirements). It supersedes the installed
`express-rate-limit` for the MVP.

| Route | Limit |
|-------|-------|
| `POST /reports` | **10 per minute** per user/IP (highest concern — prevents spam). |
| `POST /reports/:id/confirm` / `.../dispute` | 30 per minute. |
| `POST /auth/login` | 5 per minute (credential-stuffing protection). |
| `POST /auth/register` | 10 per hour per IP (anti-account-farming). |
| Public reads (`GET /status`, `GET /reports/recent`) | generous global default (e.g. 120/min) to avoid burst abuse. |

Apply globally via `ThrottlerGuard`; tighten per-route with `@Throttle()` on report creation and
login.

## Input validation

- `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true` — unknown fields are
  rejected, not silently dropped.
- All request DTOs validated by class-validator. Per-type report scope rules enforced in
  `ReportsService`.
- Frontend mirrors validation with Zod (`src/api/schemas.ts`).

## Error handling / information disclosure

- Global exception filter returns the uniform error shape (`api/overview.md`). Internal messages and
  stack traces are **never** exposed; `500` returns a generic message.
- No secrets in responses. `passwordHash`, `JWT_SECRET`, `DATABASE_URL` never serialized/logged.

## HTTP hardening

- **helmet** (installed) — security headers.
- **CORS** — restrict to configured origins (`CORS_ORIGIN`); the Expo web origin + dev clients.
- **csurf** (installed) — note: CSRF is primarily relevant to cookie-based auth; JWT in an
  `Authorization` header is not CSRF-prone. Keep csurf **off** for the API (header auth) to avoid
  breaking SSE/SPA; document this decision. Re-enable only if cookie-based sessions are introduced.
- **Secrets via `.env`** — gitignored; `.env.example` documents keys.

## Authorization

- Role check: `MODERATOR`/`ADMIN` required for `PATCH /reports/:id/hide`; `ADMIN` for user
  suspension (no console built).
- Business rules: cannot confirm/dispute own report (`403`); suspended users blocked (`403`).

## Location privacy

- Location is sent **only on demand** at report creation (`locationLat`/`locationLng`). **No
  continuous tracking.** Frontend prompts for permission at submit time via `expo-location`.

## Abuse / moderation (minimum)

- Rate limiting on writes.
- Soft-hide of problematic reports by moderators (`isHidden`), excluding them from status/feed.
- Suspended users (`status = SUSPENDED`) cannot create reports or confirm/dispute.

## Threat model scope

Protects: account integrity, report integrity, spam, credential stuffing, information disclosure.
**Not** in MVP scope: sophisticated abuse detection, content moderation pipelines, full audit
logging, OAuth/social login.