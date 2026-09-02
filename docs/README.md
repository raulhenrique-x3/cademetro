# CadêMetrô — Documentation

Source of truth for implementing the CadêMetrô MVP. Read the `docs/` tree top-down; every
document is implementation-oriented and reflects the **actual repository state**, not a greenfield
project.

## Repository state (inspected)

| Area | Status | Notes |
|------|--------|-------|
| Backend | `EXISTING` (scaffold) | NestJS 12, TypeScript ESM, Vitest, oxlint, Swagger, Prisma Next ORM. Only demo `Hello World` + demo `User`/`Post` contract. |
| Frontend | `EXISTING` (scaffold) | **Expo 57 / React Native / expo-router**, react-native-web, TanStack Query, Axios, Zod, lucide-react, react-hook-form, maplibre-gl. Tab layout only (Home/Explore). |
| Domain model | `MISSING` | No metro domain entities exist. Demo `User`/`Post` must be replaced. |
| Authentication | `MISSING` | No JWT, no password hashing, no auth guard. |
| Reports / Status / SSE | `MISSING` | None implemented. |
| Tests | `EXISTING` (skeleton) | Vitest spec + e2e skeleton only. |

Legend used across docs: **EXISTING** = already in repo · **PLANNED** = designed here, to build · **MISSING** = absent.

## Critical decisions (must read before implementing)

1. **Frontend is Expo, not Next.js.** The requirements text said "expected to use Next.js", but the
   actual `front-end/` is an Expo 57 React Native app (expo-router, react-native-web for web
   output). Per the rule that documentation must reflect the real repository, **the MVP frontend is
   Expo**. The supporting libraries named in the requirements (TanStack Query, Axios, Zod,
   lucide-react) are all already present in the Expo app. See `architecture/frontend.md`.
2. **Prisma is "Prisma Next" (contract-based), not classic Prisma schema.** The backend uses
   `@prisma/orm-postgres@8.0.0-rc.8` with `src/prisma/contract.prisma` + generated `contract.json` /
   `contract.d.ts`, queried via `db.orm.public.<Model>`. There is **no `schema.prisma`** and **no
   generated Prisma Client**. All database work uses the contract workflow:
   `npx prisma contract emit` then `npx prisma db init`. See `database/schema.md`.
3. **Tests use Vitest, not Jest.** Backend `test`/`test:e2e` scripts run Vitest. Unit tests live in
   `*.spec.ts`, e2e in `*.e2e-spec.ts`. See `testing/strategy.md`.
4. **`OperationalStatus` is derived, not stored.** It is computed on demand from recent `Report`
   rows. No `operational_status` table. See `domain/overview.md` and `database/schema.md`.
5. **JWT without refresh tokens.** Access token only (short expiry). No refresh-token infrastructure
   for the MVP. See `api/authentication.md` and `security/overview.md`.
6. **SSE, not WebSockets.** Real-time via `GET /events` (Server-Sent Events). Single-process
   in-memory RxJS `Subject` as event bus — no Redis/message broker. See `architecture/realtime.md`.

## Document index

- **Product** — `product/overview.md`, `product/mvp-scope.md`, `product/user-flows.md`
- **Architecture** — `architecture/overview.md`, `architecture/backend.md`, `architecture/frontend.md`, `architecture/realtime.md`
- **Domain** — `domain/overview.md`, `domain/users.md`, `domain/metro.md`, `domain/reports.md`, `domain/reliability.md`
- **Database** — `database/schema.md`, `database/relationships.md`
- **API** — `api/overview.md`, `api/authentication.md`, `api/reports.md`, `api/stations.md`, `api/status.md`, `api/realtime.md`
- **Frontend** — `frontend/screens.md`, `frontend/components.md`, `frontend/data-flow.md`
- **Security** — `security/overview.md`
- **Testing** — `testing/strategy.md`
- **Implementation** — `implementation/roadmap.md`, `implementation/tasks.md`

## How to implement from here

1. Read this README, then `architecture/backend.md` and `architecture/frontend.md`.
2. Follow `implementation/roadmap.md` phase by phase. Each phase points to the exact files it changes.
3. `implementation/tasks.md` is the ordered checklist with acceptance criteria.
4. The single authoritative data model is in `database/schema.md` (the proposed `contract.prisma`).