# Architecture Overview

CadêMetrô is a **modular monolith**: one NestJS backend and one Expo frontend, communicating over
REST + SSE. No microservices, no message brokers, no Redis.

```text
┌──────────────────────────┐        REST (Axios)         ┌──────────────────────────┐
│   front-end (Expo RN)    │ ───────────────────────────► │      back-end (NestJS)   │
│  expo-router · RQ · zod  │ ◄─────────────────────────── │  Controllers → Services  │
│                          │         REST responses      │        → Prisma (contract)│
│                          │                             │              │            │
│                          │          SSE /events        │     PostgreSQL (single)  │
│  EventSource → RQ cache  │ ◄─────────────────────────── │         ▲  RxJS Subject  │
└──────────────────────────┘                             └────────────┼──────────────┘
                                                                      │
                                                              in-process event bus
                                                              (no Redis / broker)
```

## Layers

- **Frontend**: Expo 57 / React Native. Server state via TanStack Query + Axios. Zod for DTO
  validation. Real-time via an SSE hook that feeds the React Query cache.
- **Backend**: NestJS 12, idiomatic `Controller → Service → Prisma`. Swagger API docs, joi DTO
  validation, JWT auth, express-rate-limit rate limiting.
- **Database**: PostgreSQL 15+, single schema `public`. Managed by Prisma Next (contract-based ORM).

## Guiding rules

- `Controller → Service → Prisma`. No repositories/interfaces for every entity, no CQRS, no event
  sourcing, no microservices, no unnecessary design patterns. Extra abstractions are added only when
  the MVP proves a real need.
- **Single source of truth for state**: PostgreSQL. Derived data (`OperationalStatus`, reliability)
  is computed on demand, not stored. See `domain/overview.md`.
- **Single-process event bus**: an in-memory RxJS `Subject` in the backend publishes report events
  to connected SSE clients. Because the MVP is one process, no broker is required. If the app were
  ever scaled horizontally, the bus would move to Redis/Postgres LISTEN-NOTIFY — but that is a
  **PLANNED future change**, not an MVP requirement.
- **Public reads, protected writes**: reading status/reports/lines/stations and the SSE stream
  requires no login; creating reports and confirming/disputing requires a valid JWT.

## Key decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend stack | Expo 57 / RN (not Next.js) | Matches actual repo; libs already installed. |
| Backend stack | NestJS 12 modular monolith | Matches repo; idiomatic. |
| ORM | Prisma Next (contract) | Matches repo; `db.orm.public.*`. |
| Real-time | SSE | One-way server→client push; plain HTTP; auto-reconnect. |
| Event bus | In-memory RxJS Subject | Single process; no broker needed. |
| Status | Derived, computed | Avoids stale/duplicated state. |
| Auth | JWT access token, no refresh | Matches MVP simplicity constraint. |
| Tests | Vitest | Backend already configured for Vitest. |

Detailed layer docs: `architecture/backend.md`, `architecture/frontend.md`, `architecture/realtime.md`.