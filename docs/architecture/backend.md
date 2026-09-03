# Backend Architecture

## Stack (reflects actual repo)

- **NestJS 12**, TypeScript ESM (`"type": "module"`, `module: preserve`, imports use `.js` suffix).
- **Prisma Next** — contract-based ORM:
  - `@prisma/orm-postgres@8.0.0-rc.8` (runtime client).
  - `prisma@7.10` CLI (dev).
  - Source of truth: `back-end/src/infra/database/prisma/contract.prisma`.
  - Generated: `contract.json` + `contract.d.ts` (commit both).
  - Client: `back-end/src/infra/database/prisma/db.ts` exports `db`, queried as `db.orm.public.<Model>`.
- **Vitest** for unit (`*.spec.ts`) and e2e (`*.e2e-spec.ts`) tests; oxlint for lint; Prettier.
- **@nestjs/swagger** (installed) for OpenAPI docs.
- **@nestjs/passport** + `passport-http-bearer` (installed) — used only where needed (see Auth).
- **helmet**, **csurf**, **express-rate-limit**, **joi** (installed) — see `security/overview.md`.
- **@nestjs/observe** — present in scaffold (observability). Non-functional placeholder (`YOUR_APP_KEY`);
  leave inert for MVP, not part of MVP scope.

## Layers

```text
Controller → Service → Prisma (db.orm.public.*)
```

No repositories/interfaces per entity, no CQRS, no event sourcing, no microservices.

## Source layout

```text
src/
├── modules/          feature modules (one per domain)
│   ├── auth/  users/  events/  metro/  reports/
├── infra/
│   ├── database/prisma/   Prisma contract + client (`db.ts`) + seed
│   └── http/status/       status aggregation (controllers/services/DTOs)
├── shared/           cross-cutting, framework-agnostic
│   ├── decorators/  guards/  interceptors/  pipes/  errors/
├── app/              app.module.ts (wires modules + global providers) + root controller
└── main.ts           bootstrap (helmet, CORS, rate limiting, Swagger)
```

## Planned NestJS modules

Feature modules (one per domain), each with controller + service:

| Module          | Responsibility                                                            |
| --------------- | ------------------------------------------------------------------------- |
| `AuthModule`    | register/login/me, JWT issue + validation guard.                          |
| `MetroModule`   | lines, stations, station ordering, directions (read-only).                |
| `ReportsModule` | report creation, recent reports, confirm/dispute.                         |
| `StatusModule`  | derived per-line/per-station operational status + reliability.            |
| `EventsModule`  | in-process event bus (RxJS Subject) + `GET /events` SSE endpoint.         |
| `UsersModule`   | current user profile, trust/reputation derivation (read).                 |
| `AppModule`     | wires modules, global pipes/filters/interceptors, rate limiting, swagger. |

## Dependency additions needed (PLANNED)

The following are **not yet installed** and must be added for the MVP:

- `@nestjs/jwt` + `bcryptjs` (password hashing) — JWT auth.

Validation and rate limiting **reuse the installed libs**: `joi` for DTO validation and
`express-rate-limit` for rate limiting (see `security/overview.md`).

## Global setup (in `main.ts`)

- A global **joi validation pipe** — validates request bodies against joi schemas, rejects unknown
  fields, converts payloads to typed DTOs.
- Response DTO mapping that omits sensitive fields (e.g. `passwordHash`).
- Global exception filter mapping domain errors to the API error shape (see `api/overview.md`).
- **express-rate-limit** middleware registered; per-route instances on report creation and login.
- `helmet()` (present), CORS configured for the Expo web origin + dev clients.
- Swagger at `/docs` (or `/api`): enabled by `@nestjs/swagger`, DTO-driven.

## Local development (Docker)

The backend and PostgreSQL run in Docker. A `docker-compose.yml` at the repo root defines:

| Service | Image                                              | Host port | Notes                                                                                  |
| ------- | -------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `db`    | `postgres:16-alpine` (≥ 15)                        | **5434**  | named volume for data; healthcheck; `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD`. |
| `api`   | build `back-end/` (`Dockerfile`, `node:22-alpine`) | `8006`    | `depends_on: db` (healthy); `DATABASE_URL` points to `db:5432` (in-network).           |

Commands: `docker compose up` (both) · `docker compose up db` (DB only, for host-side dev) ·
`docker compose down`. Prisma CLI commands (`contract emit`, `db init`, `db seed`) run inside the
`api` container, or from the host against `localhost:5434`.

## Environment (back-end/.env)

- `DATABASE_URL` — PostgreSQL connection string (PostgreSQL ≥ 15 required). The Dockerized Postgres
  is exposed on host port **5434**, e.g.
  `postgresql://cademetro:cademetro@localhost:5434/cademetro` (host side) / `db:5432` (in-network).
- `JWT_SECRET` — HMAC secret for access tokens (**PLANNED**).
- `PORT` — default `8006`.
- `CORS_ORIGIN` — allowed web origin (**PLANNED**).

`.env` is gitignored; `.env.example` documents the keys.

## Conventions

- Controllers: thin, only HTTP mapping + DTO validation + return typed response.
- Services: all business logic + Prisma access. They emit domain events to `EventsModule` after
  successful mutations (create report, confirm, dispute) so status/SSE stay consistent.
- Naming: feature modules under `src/modules/<feature>/` with `*.module.ts`, `*.controller.ts`,
  `*.service.ts`, `*.dto.ts`; infrastructure under `src/infra/` (database, HTTP); shared
  cross-cutting code under `src/shared/`. Import paths use `.js` suffix (ESM).
- Swagger DTOs describe request/response shapes; joi schemas mirror the same fields for runtime
  validation (single source in the DTO definitions).

## Scalability note

MVP is single-process. `EventsModule` uses an in-memory Subject — no Redis. Horizontal scaling of
the SSE bus is explicitly out of scope. See `architecture/realtime.md`.
