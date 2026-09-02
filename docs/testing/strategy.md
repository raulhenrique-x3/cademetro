# Testing Strategy

The backend uses **Vitest** (already configured — `test`, `test:e2e` scripts; unit `*.spec.ts`,
e2e `*.e2e-spec.ts`). Frontend uses `jest-expo` (to be added) for component/unit tests. No code
coverage threshold is mandated for the MVP, but core domain logic must be covered.

## Backend

### Unit tests (`*.spec.ts`)

Pure, no database. Cover business/domain logic:

- `ReliabilityService` — confidence formula across age/confirmations/disputes/trust edge cases
  (feed reports + confirmations, assert `confidence`).
- `StatusService` — aggregation priority rules (`SERVICE_INTERRUPTION` → `INTERRUPTED`, etc.),
  windowing, `lastUpdateTime`, `UNKNOWN` when empty, most-recent-wins on conflict.
- `ReportsService` — per-type scope validation, own-report rule, direction/station-must-belong rules
  (mock Prisma).
- `AuthService` — password hashing/compare, JWT issue/verify (mock).

### Integration tests

Against a real PostgreSQL test database (via `DATABASE_URL_TEST`):

- Database operations with the contract ORM (CRUD on `Line`/`Station`/`Report`).
- Report creation persists with correct FK/relation values.
- Status aggregation reads recent reports correctly (window, hidden exclusion).
- Confirmations: unique `(reportId, userId)`, count aggregation, confidence change.

### E2E tests (`*.e2e-spec.ts`)

Boot the full Nest app (supertest), hit real endpoints. Critical flows:

```text
register → login → create report → retrieve reports → confirm report → retrieve status
```

Assert status codes, body shape, and the uniform error shape on failures.

### Realtime tests

Verify SSE behavior:

- Subscribe to `EventsService` Subject, `POST /reports`, assert a `report.created` event is emitted
  with the correct payload.
- Assert `status.updated` is emitted when status changes.
- Assert per-client filtering (`lineId`) drops unrelated events.
- Integration: open an SSE connection to the running app and assert a `report.created` frame arrives
  after a report is created.

## Frontend

- **Component tests** (jest-expo + `@testing-library/react-native`): `report-card` renders type/
  station/confidence; `status-badge` maps status→label/color; `report-composer` submits the right
  payload and blocks invalid input (Zod).
- **Hook tests**: `useRealtime` applies SSE events to the React Query cache correctly (mock
  `EventSource`).
- **Schema tests**: Zod schemas accept valid and reject invalid API payloads (mirror of backend).

## Test data & isolation

- Use a separate test database; truncate/seed between tests.
- Seed minimal metro data (one line, two directions, a few stations) for integration/e2e/realtime
  tests.

## Commands

```bash
# backend
npm test                 # unit
npm run test:e2e         # e2e (supertest)
npm run test:cov         # coverage

# frontend (PLANNED)
npx jest                 # after adding jest-expo
```

## CI / pre-commit (PLANNED, optional)

- Run `oxlint`, `tsc --noEmit`, unit tests, and e2e on the backend; lint + tests on the frontend.
  No CI is currently configured in the repo — out of MVP scope unless added.