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

## Current repo state (EXISTING scaffold)

- `src/app/_layout.tsx` — root layout with `ThemeProvider` + `AnimatedSplashOverlay` + `AppTabs`.
- `src/app/index.tsx` — Home tab (Expo welcome placeholder).
- `src/app/explore.tsx` — Explore tab (starter demo).
- `src/components/` — themed primitives (`themed-text`, `themed-view`), `app-tabs`, `animated-icon`,
  `hint-row`, `web-badge`, `external-link`, `ui/collapsible`.
- `src/constants/theme.ts` — `Colors` (light/dark), `Fonts`, `Spacing`, `MaxContentWidth`.
- `src/hooks/` — `use-theme`, `use-color-scheme`.

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