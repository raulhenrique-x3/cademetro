# Backend Architecture

## Stack (reflects actual repo)

- **NestJS 12**, TypeScript ESM (`"type": "module"`, `module: preserve`, imports use `.js` suffix).
- **Prisma Next** — contract-based ORM:
  - `@prisma/orm-postgres@8.0.0-rc.8` (runtime client).
  - `prisma@7.10` CLI (dev).
  - Source of truth: `back-end/src/prisma/contract.prisma`.
  - Generated: `contract.json` + `contract.d.ts` (commit both).
  - Client: `back-end/src/prisma/db.ts` exports `db`, queried as `db.orm.public.<Model>`.
- **Vitest** for unit (`*.spec.ts`) and e2e (`*.e2e-spec.ts`) tests; oxlint for lint; Prettier.
- **@nestjs/swagger** (installed) for OpenAPI docs.
- **@nestjs/passport** + `passport-http-bearer` (installed) — used only where needed (see Auth).
- **helmet**, **csurf**, **express-rate-limit** (installed) — see `security/overview.md`.
- **@nestjs/observe** — present in scaffold (observability). Non-functional placeholder (`YOUR_APP_KEY`);
  leave inert for MVP, not part of MVP scope.

## Layers

```text
Controller → Service → Prisma (db.orm.public.*)
```

No repositories/interfaces per entity, no CQRS, no event sourcing, no microservices.

## Planned NestJS modules

Feature modules (one per domain), each with controller + service:

| Module | Responsibility |
|--------|----------------|
| `AuthModule` | register/login/me, JWT issue + validation guard. |
| `MetroModule` | lines, stations, station ordering, directions (read-only). |
| `ReportsModule` | report creation, recent reports, confirm/dispute. |
| `StatusModule` | derived per-line/per-station operational status + reliability. |
| `EventsModule` | in-process event bus (RxJS Subject) + `GET /events` SSE endpoint. |
| `UsersModule` | current user profile, trust/reputation derivation (read). |
| `AppModule` | wires modules, global pipes/filters/interceptors, throttler, swagger. |

## Dependency additions needed (PLANNED)

The following are **not yet installed** and must be added for the MVP:

- `@nestjs/jwt` + `bcryptjs` (password hashing) — JWT auth.
- `class-validator` + `class-transformer` — DTO validation (required by the requirements).
- `@nestjs/throttler` — rate limiting (required by the requirements; supersedes the installed
  `express-rate-limit`, see `security/overview.md`).

## Global setup (in `main.ts`)

- `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) — reject unknown fields, convert
  payloads to typed DTOs.
- `ClassSerializerInterceptor` — exclude sensitive fields (e.g. `passwordHash`).
- Global exception filter mapping domain errors to the API error shape (see `api/overview.md`).
- `ThrottlerGuard` registered; per-route limits on report creation and login.
- `helmet()` (present), CORS configured for the Expo web origin + dev clients.
- Swagger at `/docs` (or `/api`): enabled by `@nestjs/swagger`, DTO-driven.

## Environment (back-end/.env)

- `DATABASE_URL` — PostgreSQL connection string (PostgreSQL ≥ 15 required).
- `JWT_SECRET` — HMAC secret for access tokens (**PLANNED**).
- `PORT` — default `3000`.
- `CORS_ORIGIN` — allowed web origin (**PLANNED**).

`.env` is gitignored; `.env.example` documents the keys.

## Conventions

- Controllers: thin, only HTTP mapping + DTO validation + return typed response.
- Services: all business logic + Prisma access. They emit domain events to `EventsModule` after
  successful mutations (create report, confirm, dispute) so status/SSE stay consistent.
- Naming: feature modules under `src/<feature>/` with `*.module.ts`, `*.controller.ts`,
  `*.service.ts`, `*.dto.ts`. Import paths use `.js` suffix (ESM).
- Swagger DTOs are the same classes used by `ValidationPipe` (single source).

## Scalability note

MVP is single-process. `EventsModule` uses an in-memory Subject — no Redis. Horizontal scaling of
the SSE bus is explicitly out of scope. See `architecture/realtime.md`.