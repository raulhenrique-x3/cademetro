# Implementation Tasks

Ordered checklist. Each task: objective, dependencies, affected area, acceptance criteria. Grouped by
phase (see `implementation/roadmap.md`). This is the executable work queue for a developer/AI.

## Phase 1 — Foundation

- **T1.1** Add deps: `@nestjs/jwt`, `bcryptjs`. (Validation uses the installed `joi`; rate limiting
  uses the installed `express-rate-limit`.)
  - Deps: — · Area: `package.json` · AC: `npm install` succeeds; types resolve.
- **T1.2** Global error filter → uniform error shape (`api/overview.md`).
  - Deps: — · Area: `src/shared/` · AC: validation/404/429/500 map to envelope; no stack leak.
- **T1.3** Global joi validation pipe (reject unknown fields) + response DTO mapping that omits
  `passwordHash`.
  - Deps: T1.1 · Area: `src/main.ts` · AC: unknown fields → 400; `passwordHash` never serialized.
- **T1.4** Swagger setup at `/docs` (`@nestjs/swagger`).
  - Deps: T1.3 · Area: `src/main.ts` · AC: OpenAPI served; DTO-driven.
- **T1.5** CORS + helmet.
  - Deps: — · Area: `src/main.ts` · AC: configured origin works; security headers present.
- **T1.6** Docker Compose: `db` (PostgreSQL ≥ 15, host port **5434**) + `api` (backend container).
  - Deps: — · Area: `back-end/docker-compose.yml`, `back-end/Dockerfile` · AC: `docker compose
    up` (from `back-end/`) boots DB + API; backend connects to Postgres; `down` cleans up.

## Phase 2 — Database / domain model

- **T2.1** Replace demo contract with domain model (`database/schema.md`); drop `Post`.
  - Deps: — · Area: `src/infra/database/prisma/contract.prisma` · AC: models/enums/relations/indexes match schema.md.
- **T2.2** `npx prisma contract emit` + `npx prisma db init`.
  - Deps: T2.1 · Area: generated files + DB · AC: tables/enums/indexes created in PostgreSQL.
- **T2.3** Seed script (minimal network: ≥1 line, 2 directions, stations in order).
  - Deps: T2.2 · Area: `src/infra/database/prisma/seed.ts` · AC: seed idempotent; `db.orm.public.Line` returns data.
- **T2.4** `MetroModule` read-only endpoints: `GET /lines`, `GET /lines/:id`, `GET /stations`,
  `GET /stations/:id` (DTOs per `api/stations.md`).
  - Deps: T2.2, T2.3 · Area: `src/modules/metro/` · AC: response shapes match `api/stations.md`; unknown
    line/station → 404; stations ordered by `order`.

## Phase 3 — Authentication

- **T3.1** `AuthService` register/login: bcrypt hash/compare; unique email → 409.
  - Deps: T1.1, T2 · Area: `src/modules/auth/` · AC: hash stored; wrong password → 401; dup email → 409.
- **T3.2** JWT issue (`@nestjs/jwt`, `JWT_SECRET`, exp 1h) + `JwtAuthGuard` (verify + status ACTIVE).
  - Deps: T3.1 · Area: `src/modules/auth/` · AC: token verifies; bad/expired → 401; suspended → 403.
- **T3.3** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
  - Deps: T3.2 · Area: `src/modules/auth/` · AC: endpoints return `AuthResponse` / `UserDto`; docs reflect.
- **T3.4** Login rate limit (5/min).
  - Deps: T1.1 · Area: auth controller · AC: exceeded → 429.

## Phase 4 — Reports

- **T4.1** `ReportsService` create: per-type scope validation (line always; station/direction for
  TRAIN_*; direction/station belong to line).
  - Deps: T2, T3 · Area: `src/modules/reports/` · AC: invalid scope → 400; FKs valid.
- **T4.2** `POST /reports` + report throttling (10/min).
  - Deps: T4.1 · Area: `src/modules/reports/` · AC: stores report; exceeded → 429; emits to be wired later.
- **T4.3** `GET /reports/recent` (line/station/direction filter, limit, before cursor, newest-first).
  - Deps: T4.1 · Area: `src/modules/reports/` · AC: correct order/filter; hidden excluded.
- **T4.4** `GET /reports/:id` (with confirmations + derived confidence).
  - Deps: T4.1, Phase 5 · Area: `src/modules/reports/` · AC: returns ReportDto; hidden/unknown → 404.

## Phase 5 — Status aggregation & reliability

- **T5.1** `ReliabilityService`: confidence formula (`domain/reliability.md`), pure + unit-tested.
  - Deps: T2 · Area: `src/infra/http/status/` · AC: formula matches doc across edge cases.
- **T5.2** `StatusService`: derive line/station status (window 30 min, priority rules, most-recent
  wins, lastUpdateTime).
  - Deps: T5.1 · Area: `src/infra/http/status/` · AC: priority/UNKNOWN/windowing correct.
- **T5.3** `GET /status` + `GET /stations/:id/status`.
  - Deps: T5.2 · Area: `src/infra/http/status/` · AC: matches `api/status.md`; includes confidence + lastUpdate.
- **T5.4** Add derived fields (`confidence`, `confirmations`, `independentReportCount`,
  `author.trustScore`) to report/status DTOs.
  - Deps: T5.1, T5.3 · Area: `src/modules/reports/`, `src/infra/http/status/` · AC: response shape matches docs.

## Phase 6 — Confirmations

- **T6.1** `POST /reports/:id/confirm` and `/dispute`: unique `(reportId,userId)` upsert/toggle;
  own-report → 403.
  - Deps: T2–T5 · Area: `src/modules/reports/` · AC: one action/user; toggle/switch; own → 403.
- **T6.2** Recompute counts + confidence on confirm/dispute.
  - Deps: T6.1, T5 · Area: `src/modules/reports/` · AC: ReportDto counts/confidence reflect change.

## Phase 7 — SSE / realtime

- **T7.1** `EventsService`: in-memory RxJS `Subject<MetroEvent>`; `publish`, `subscribe`.
  - Deps: — · Area: `src/modules/events/` · AC: observable pub/sub works.
- **T7.2** `GET /events` `@Sse`: per-client filter (`lineId`/`stationId`), heartbeat `: ping` every 30s,
  complete on close.
  - Deps: T7.1 · Area: `src/modules/events/` · AC: stream + filtering + heartbeat; no leaks.
- **T7.3** Publish `report.created` / `report.confirmed` / `report.disputed` from service mutations.
  - Deps: T7.1, T4, T6 · Area: `src/modules/reports/` · AC: events emitted with ReportDto payloads.
- **T7.4** Publish `status.updated` when line/station status changes.
  - Deps: T7.1, T5 · Area: `src/infra/http/status/`, `src/modules/events/` · AC: status change → event.

## Phase 8 — Frontend integration (COMPLETED)

- **T8.1** API layer: axios client, endpoint fns, TS types, Zod schemas (mirror of backend DTOs).
  - Deps: backend 2–7 · Area: `src/api/` · AC: schemas match Swagger; parse on responses. `[DONE]`
- **T8.2** TanStack Query provider + hooks (`useLines`, `useStations`, `useRecentReports`,
  `useLineStatus`, `useStationStatus`, `useMe`, auth mutations).
  - Deps: T8.1 · Area: `src/features/` · AC: reads/writes populate cache correctly. `[DONE]`
- **T8.3** `use-realtime` hook: EventSource → update query cache; reconnect → snapshot refetch.
  - Deps: T8.1, Phase 7 · Area: `src/hooks/` · AC: SSE events update UI without manual refresh. `[DONE]`
- **T8.4** Screens: Home, Line, Station, Report composer (modal), Login, Register, Profile,
  Moderation. Replace `explore.tsx` starter.
  - Deps: T8.2 · Area: `src/app/` · AC: flows in `screens.md` work. `[DONE]`
- **T8.5** Station selection with on-demand geolocation (`navigator.geolocation`).
  - Deps: T8.4 · Area: components · AC: station pickable; location sent only on submit. `[DONE]`
- **T8.6** Components: status-badge, report-card, confidence-bar, type/station/direction pickers,
  report-composer, auth-form.
  - Deps: T8.4 · Area: `src/components/`, `src/features/` · AC: reusable; server data via hooks only. `[DONE]`

## Phase 9 — Testing

- **T9.1** Unit: `ReliabilityService`, `StatusService`, `ReportsService`, `AuthService`.
  - Deps: Phase 5 · Area: `*.spec.ts` · AC: formulas + rules covered. `[DONE]`
- **T9.2** Integration: ORM CRUD, report persistence, status aggregation, confirmations (test DB).
  - Deps: Phase 6 · Area: `*.spec.ts` · AC: DB-backed assertions pass. `[DONE]`
- **T9.3** E2E: register → login → create report → recent → confirm → status.
  - Deps: Phase 6 · Area: `test/*.e2e-spec.ts` · AC: full flow green. `[DONE]`
- **T9.4** Realtime tests: publish on create/confirm/dispute; status.updated; filtering.
  - Deps: Phase 7 · Area: `*.spec.ts` · AC: SSE events verified. `[DONE]`
- **T9.5** Frontend: component, hook (useRealtime cache updates), Zod schemas, storage, and live backend integration tests (Vitest).
  - Deps: Phase 8 · Area: `front-end/tests/` · AC: 36 unit/integration tests passing. `[DONE]`

## Phase 10 — MVP hardening

- **T10.1** Tune rate limits (`security/overview.md`); audit uniform error shape across endpoints.
  - Deps: all · Area: global · AC: limits applied; all errors conform.
- **T10.2** Complete Swagger annotations on all endpoints.
  - Deps: all · Area: controllers · AC: `/docs` complete and accurate.
- **T10.3** Realistic seed (several lines, directions, stations) + README updates.
  - Deps: T2.3 · Area: seed, README · AC: demo data present; docs match implementation.
- **T10.4** Final consistency pass (see docs/README "Final validation"): DTOs, entity names, Prisma
  terminology, frontend↔backend contract, SSE event names vs API, roadmap coverage.
  - Deps: all · Area: docs + code · AC: single coherent system; no contradictions.