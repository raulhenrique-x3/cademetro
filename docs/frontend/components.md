# Frontend Components

Reuse existing `src/components/` primitives and add feature components. Keep components small and
presentation-focused; data comes from hooks (TanStack Query) in the features.

## Existing (reuse as-is)

- `themed-text.tsx`, `themed-view.tsx` — themed primitives.
- `app-tabs.tsx` — `NativeTabs` shell.
- `animated-icon.tsx` / `.web.tsx` — splash/branding.
- `web-badge.tsx`, `hint-row.tsx`, `external-link.tsx`, `ui/collapsible.tsx`.

## Implemented components

### Generic / UI (`src/components/ui/`)
- `button.tsx` — Reusable button with variants (`primary`, `secondary`, `outline`, `destructive`, `ghost`), sizes (`sm`, `md`, `lg`), loading spinner, accessibility roles.
- `badge.tsx` — Visual badge for statuses, tags, categories.
- `card.tsx` — Card primitive with Header, Title, Description, Content, and Footer.
- `input.tsx` — Form TextInput with label, validation error feedback, and helper text.
- `skeleton.tsx` — Animated loading pulse placeholder.
- `separator.tsx` — Horizontal and vertical dividers.
- `empty-state.tsx` — Explanatory empty state UI with icon, title, description, and action button.
- `error-state.tsx` — User-friendly error message with retry trigger.

### Status (`src/features/status/components/`)
- `status-badge.tsx` — Renders `LineStatus` (`NORMAL` 🟢 / `RESTRICTED` 🟡 / `INTERRUPTED` 🔴 / `UNKNOWN` ⚪) with semantic tokens and labels.
- `line-status-card.tsx` — Card displaying line color indicator, name, status badge, relative time, and report count.

### Reports (`src/features/reports/components/`)
- `report-card.tsx` — Card rendering report details: type emoji/label, station, direction, relative time, author trust score, confidence bar, and confirm/dispute toggle buttons.
- `confidence-bar.tsx` — Visual certainty bar (0..100%) color-coded by reliability threshold.
- `type-selector.tsx` — 1-tap selector grouped by train movement and line operational status.
- `direction-selector.tsx` — Selectable endpoint buttons for the line direction.
- `station-selector.tsx` — Searchable station selector with nearest station detection via geolocation.
- `report-composer.tsx` — Rapid 3-step reporting flow: Station → Direction → Event Type + optional description and GPS location.

### Metro (`src/features/metro/components/`)
- `station-list.tsx` — Ordered station trajectory with line color track and transfer connection dots.

### Auth (`src/features/auth/components/`)
- `auth-form.tsx` — Form for Login and Register with Zod validation.

### Layout (`src/components/layout/`)
- `header.tsx` — App branding, live SSE connection indicator, theme toggle button (☀️ / 🌙), and profile button.
- `screen-shell.tsx` — Mobile-first responsive wrapper with SafeAreaView, pull-to-refresh, and centered max width.

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