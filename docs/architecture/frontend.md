# Frontend Architecture

## Stack (reflects actual repo)

- **Expo 57 / React Native 0.86**, React 19, TypeScript 6.
- **expo-router** (file-based routing, `src/app/`) with `NativeTabs`. Web output via
  `react-native-web` (`web.output: "static"`).
- **TanStack Query** (`@tanstack/react-query@^5`) — server state.
- **Axios** — HTTP client.
- **Zod** (`zod@^4`) — schema validation (client-side DTOs).
- **lucide-react** — icons.
- **react-hook-form** + `@hookform/resolvers` — forms with Zod integration.
- **maplibre-gl** + **react-map-gl** — map (station selection / location context).
- `react-native-reanimated`, `gesture-handler`, `screens`, `safe-area-context` — native navigation
  and animation primitives already installed.

**Deviation flag:** the requirements said "expected to use Next.js", but the repo is **Expo/React
Native**. Per the actual-repo rule, the MVP frontend is Expo. The required supporting libraries
(TanStack Query, Axios, Zod, lucide-react) are already present.

## Repository state (IMPLEMENTED MVP)

- `src/app/_layout.tsx` — root layout with `QueryClientProvider`, `ThemeContextProvider`, `AuthProvider`, and `AppTabs`.
- `src/app/index.tsx` — Home screen with current line status cards, quick report button, and live activity feed.
- `src/app/explore.tsx` — Network explorer with line filter chips and searchable station list.
- `src/app/line/[id].tsx` — Line detail with status, ordered station track, and scoped reports.
- `src/app/station/[id].tsx` — Station detail with served lines, operational status, and scoped reports.
- `src/app/report.tsx` — Rapid 3-step report composer (Station → Direction → Type).
- `src/app/login.tsx` / `register.tsx` — Auth forms with Zod validation.
- `src/app/profile.tsx` — User profile, trust score display, and light/dark theme switcher.
- `src/app/admin/reports.tsx` — Moderation screen for soft-hiding reports.
- `src/components/ui/` — generic reusable UI primitives (`button`, `badge`, `card`, `input`, `skeleton`, `separator`, `empty-state`, `error-state`).
- `src/components/layout/` — `header` (live indicator + theme toggle), `screen-shell` (mobile-first responsive wrapper).
- `src/constants/theme.ts` & `metro.ts` — Semantic color tokens, typography, spacing, status mappings.
- `src/context/theme-context.tsx` — Theme mode state and persistence.
- `src/features/` — domain hooks and feature components (`auth`, `metro`, `reports`, `status`).
- `src/api/` — typed Axios client, schemas, and endpoint modules.
- `src/hooks/use-realtime.ts` — SSE subscription updating React Query cache in real time.

## Planned architecture

### API layer (`src/api/`)
- `client.ts` — Axios instance: base URL from env, JSON, bearer token injection from storage,
  response error normalization.
- `auth.ts`, `metro.ts`, `reports.ts`, `status.ts` — typed endpoint functions returning parsed data.
- `types.ts` — TS types mirrored from the backend contracts (mirror of Swagger/OpenAPI).
- `schemas.ts` — Zod schemas for client-side validation of forms and API payloads.

### Queries (`src/features/*/queries.ts`)
- TanStack Query hooks per domain: `useLines`, `useStations`, `useRecentReports`,
  `useLineStatus`, `useStationStatus`, `useMe`, auth mutations.

### Real-time (`src/hooks/use-realtime.ts` or `src/features/realtime/`)
- Opens an `EventSource` to `GET /events`, parses named events (`report.created`,
  `status.updated`, `report.confirmed`, `report.disputed`), and updates the React Query cache.
- See `architecture/realtime.md` and `frontend/data-flow.md`.

### Routing (expo-router, `src/app/`)
| Route | Screen |
|-------|--------|
| `index` | Home — status + recent reports + quick report action. |
| `line/[id]` | Line detail — status + stations. |
| `station/[id]` | Station detail — status + recent reports at station. |
| `report` | Report composer (modal). |
| `login` / `register` | Auth. |
| `profile` | Current user + trust. |
| `admin/reports` | Moderator: hide reports. |

## Key conventions

- Server state only through TanStack Query; no local copies of line/station/status data.
- All API input validated with Zod before submit (mirror of backend validation).
- Auth token in `expo-secure-store` (or `AsyncStorage` fallback on web) — see `security/overview.md`.
- Theme tokens from `src/constants/theme.ts`; new UI uses the existing themed primitives.
- Keep components small; prefer the existing `src/components/` patterns.

## Frontend↔backend contract

Frontend must match the backend exactly. The authoritative endpoint/body/response definitions are in
`api/overview.md` and the per-resource API docs. SSE event names and payloads are in
`api/realtime.md`. Zod schemas in `src/api/schemas.ts` are the mirror of the backend DTOs.

## Dependencies to add (PLANNED)

- `expo-secure-store` (token storage) — or `expo-crypto` if no native store on web.
- `@tanstack/react-query-devtools` (dev only, optional).
- SSE requires no extra library on the frontend (`EventSource` is built-in; polyfill available if
  needed for older web targets).