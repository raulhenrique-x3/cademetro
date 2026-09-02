# Implementation Roadmap

Ordered phases. Each phase maps to concrete tasks in `implementation/tasks.md`. Phases build on
each other; a phase is "done" when its acceptance criteria pass.

```text
Phase 1 — Foundation
Phase 2 — Database / domain model
Phase 3 — Authentication
Phase 4 — Reports
Phase 5 — Status aggregation & reliability
Phase 6 — Confirmations
Phase 7 — SSE / realtime
Phase 8 — Frontend integration
Phase 9 — Testing
Phase 10 — MVP hardening
```

## Phase 1 — Foundation

- Establish module structure (`src/<feature>/`), global pipes/filters/interceptors in `main.ts`.
- Add missing deps: `@nestjs/jwt`, `bcryptjs`, `class-validator`, `class-transformer`,
  `@nestjs/throttler`.
- Wire Swagger at `/docs`; global error filter + uniform error shape; CORS; helmet.
- **Dependencies**: none (starts from existing scaffold).
- **Affected**: `main.ts`, `app.module.ts`, new `src/common/`.
- **Acceptance**: app boots; Swagger serves; unknown-field payloads → 400; no internal error leak.

## Phase 2 — Database / domain model

- Replace demo `User`/`Post` contract with the domain model (`database/schema.md`).
- Run `npx prisma contract emit` then `npx prisma db init`.
- Add seed script (minimal network: one line, two directions, stations).
- **Dependencies**: Phase 1.
- **Affected**: `src/prisma/contract.prisma` (+ generated files), `prisma` seed.
- **Acceptance**: tables/enums created; seed data queryable via `db.orm.public.*`; indexes present.

## Phase 3 — Authentication

- `AuthModule`: register, login, `GET /auth/me`; bcrypt hash; JWT issue + guard; `@Exclude()`
  passwordHash; login throttling.
- **Dependencies**: Phase 1.
- **Affected**: `src/auth/`.
- **Acceptance**: register/login returns token; protected route rejects bad/expired token; duplicate
  email → 409.

## Phase 4 — Reports

- `ReportsModule`: `POST /reports`, `GET /reports/recent`, `GET /reports/:id`; per-type scope
  validation; report creation throttling.
- **Dependencies**: Phases 2, 3.
- **Affected**: `src/reports/`.
- **Acceptance**: valid report stored with correct FKs; invalid scope rejected (400); recent list
  ordered newest-first.

## Phase 5 — Status aggregation & reliability

- `StatusModule` + `ReliabilityService`: derive line/station status (`api/status.md`) and confidence
  (`domain/reliability.md`); wire into report responses and status endpoints.
- **Dependencies**: Phases 2, 4.
- **Affected**: `src/status/`, `src/reports/` (response DTOs).
- **Acceptance**: `GET /status` returns correct derived status per the priority rules; confidence
  follows the documented formula; unit tests pass.

## Phase 6 — Confirmations

- Confirm/dispute endpoints (`POST /reports/:id/confirm|dispute`); unique `(reportId, userId)`;
  toggle semantics; own-report rule; counts + confidence update.
- **Dependencies**: Phases 2–5.
- **Affected**: `src/reports/`.
- **Acceptance**: one action per user per report; own report → 403; counts/confidence update.

## Phase 7 — SSE / realtime

- `EventsModule`: in-memory RxJS `Subject` bus; `GET /events` `@Sse` endpoint with `lineId`/
  `stationId` filtering + heartbeat; publish `report.created` / `report.confirmed` /
  `report.disputed` / `status.updated` from service mutations.
- **Dependencies**: Phases 4–6.
- **Affected**: `src/events/`, `src/reports/`, `src/status/`.
- **Acceptance**: SSE client receives events on report create/confirm/dispute; filters work;
  heartbeat emitted; reconnect handled by client snapshot-refetch.

## Phase 8 — Frontend integration

- API layer (`src/api/`), Zod schemas, TanStack Query hooks; screens (Home, Line, Station, Report
  composer, Login, Register, Profile, Moderation); `use-realtime` hook updating the cache; map
  (maplibre) for station selection; on-demand location.
- **Dependencies**: backend Phases 2–7.
- **Affected**: `src/app/`, `src/api/`, `src/features/`, `src/hooks/`, `src/components/`.
- **Acceptance**: Home shows status + reports live; report composer submits; confirm/dispute works;
  SSE updates propagate; auth flow works.

## Phase 9 — Testing

- Implement the suite in `testing/strategy.md`: unit, integration, e2e, realtime (backend); component/
  hook/schema (frontend).
- **Dependencies**: Phases 2–8.
- **Affected**: `src/**/*.spec.ts`, `test/*.e2e-spec.ts`, frontend test files.
- **Acceptance**: core flows green: register → login → create report → recent → confirm → status;
  SSE event test green.

## Phase 10 — MVP hardening

- Rate limits tuned; error-shape audit; Swagger complete; seed for a realistic network; README
  update; final consistency pass (see docs/README "Final validation").
- **Dependencies**: all prior.
- **Acceptance**: the MVP hypothesis is demonstrable end-to-end; docs match the implementation.