# Frontend Components

Reuse existing `src/components/` primitives and add feature components. Keep components small and
presentation-focused; data comes from hooks (TanStack Query) in the features.

## Existing (reuse as-is)

- `themed-text.tsx`, `themed-view.tsx` — themed primitives.
- `app-tabs.tsx` — `NativeTabs` shell.
- `animated-icon.tsx` / `.web.tsx` — splash/branding.
- `web-badge.tsx`, `hint-row.tsx`, `external-link.tsx`, `ui/collapsible.tsx`.

## Planned components

### Generic / UI
- `status-badge.tsx` — renders `LineStatus` (`NORMAL`/`RESTRICTED`/`INTERRUPTED`/`UNKNOWN`) with
  color + label.
- `report-card.tsx` — one report: type icon (lucide), line/station/direction, time-ago, confidence
  bar, confirm/dispute buttons.
- `confidence-bar.tsx` — visual confidence `0..1`.
- `spinner.tsx` / `empty-state.tsx` — loading/empty states.
- `type-selector.tsx` — choose `ReportType` (grid of tappable options).

### Report flow
- `report-composer.tsx` — full report form (type → line → station → direction → description →
  location), uses react-hook-form + Zod.
- `station-picker.tsx` — searchable station list; nearest-from-location suggestion.
- `direction-picker.tsx` — the two endpoints of a line.

### Metro / status
- `line-status-row.tsx` — Home row: line color chip + status + last update.
- `station-list.tsx` — stations of a line (ordered).

### Auth
- `auth-form.tsx` — shared email/password form (login + register).

### Layout
- `screen-shell.tsx` — consistent scroll/safe-area layout wrapper.

## Structure

```
src/components/            # generic UI
src/features/status/       # status hooks + status-badge, line-status-row
src/features/reports/      # report hooks + report-card, report-composer, pickers
src/features/metro/        # lines/stations hooks + station-list, line-status-row
src/features/auth/         # auth hooks + auth-form
src/features/admin/        # moderation screen
src/api/                   # axios client + endpoint fns + zod schemas + types
src/hooks/use-realtime.ts  # SSE subscription → cache updates
```

## Data ownership

Components do **not** own server data. They call feature hooks that wrap TanStack Query. SSE updates
flow into the query cache, so components re-render from cache invalidation — no manual event plumbing
in components. See `frontend/data-flow.md`.