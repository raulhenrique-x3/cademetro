# Frontend Data Flow

Server state is owned by **TanStack Query**. REST reads populate the cache; an **SSE hook** updates
the cache in real time. Components read from the cache only.

## Stack

- **Axios** — HTTP (`src/api/client.ts`): base URL from `EXPO_PUBLIC_API_URL`, JSON, bearer token
  injection, error normalization to the backend error shape.
- **TanStack Query** — queries/mutations per resource.
- **Zod** — `src/api/schemas.ts`: validate API responses and form inputs (mirror of backend DTOs).
- **EventSource** — `src/hooks/use-realtime.ts`: subscribes to `GET /events`.

## Read path (REST)

```text
Component
   └─► useLines() / useStations() / useRecentReports() / useLineStatus() / useStationStatus()
          └─► react-query queryFn → api.get(...) → axios → backend
                 → zod parse → cache
```

## Write path (REST)

```text
report form (react-hook-form + zod)
   └─► useCreateReport().mutate(payload)
          └─► POST /reports (bearer)
                 → onSuccess: invalidate ['reports'], ['status']
                 → optimistic update of ['reports'] (rollback on error)
```

Confirm/dispute: `useConfirmReport` / `useDisputeReport` → `POST /reports/:id/confirm` / `.../dispute`
→ invalidate the affected report + status.

## Realtime path (SSE)

```text
src/hooks/use-realtime.ts
   EventSource('/events')
     on open      → (optional) refetch snapshot queries
     on report.created   → queryClient.setQueryData(['reports'], add/prepend)
     on report.confirmed → update the report's confirmations/confidence
     on report.disputed  → update the report's confirmations/confidence
     on status.updated   → invalidate ['status'] (or set directly)
     onerror / reconnect → refetch snapshot (['status'], ['reports'])
```

On connect and reconnect, the client fetches the **snapshot** via REST (`useLineStatus`,
`useRecentReports`) then applies SSE deltas. This matches the server contract
(`api/realtime.md`): stream carries deltas, snapshot via REST.

## Query keys

| Key | Data |
|-----|------|
| `['lines']` | all lines. |
| `['stations']` / `['stations', { lineId }]` | stations. |
| `['reports', filters]` | recent reports. |
| `['reports', id]` | single report. |
| `['status', { lineId, stationId }]` | status. |
| `['me']` | current user. |

## Optimistic updates

- Create report: prepend to `['reports']` immediately; reconcile on server response; rollback on
  error.
- Confirm/dispute: patch the report's counts/confidence optimistically; reconcile on response.

## Error handling

- Axios interceptor normalizes errors to `{ statusCode, error, message, path, timestamp }` (backend
  shape, `api/overview.md`).
- Zod parse failures surface as "unexpected server response" — the client should never render
  unvalidated server data.
- 401 → clear token + redirect to `/login`.

## Auth token storage

- JWT stored in `expo-secure-store` (native) with a web fallback (`AsyncStorage`/`localStorage`).
- Injected into every Axios request via interceptor.

## Consistency rule

Frontend Zod schemas + TS types are the **mirror** of the backend Swagger DTOs. There is one source
of truth (backend), and `src/api/schemas.ts` / `types.ts` must be regenerated/synced when the backend
DTOs change. SSE payload shapes are the same DTOs (see `api/realtime.md`).