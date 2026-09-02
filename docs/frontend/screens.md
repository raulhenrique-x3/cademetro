# Frontend Screens

Expo (React Native) via expo-router. Routes under `src/app/`. The MVP prioritizes reading the
current situation in a few seconds and reporting in ~5 seconds.

## Route map

| Route | Screen | Purpose | Auth |
|-------|--------|---------|------|
| `/` (`index`) | **Home** | Status + recent reports + quick report action. | public read |
| `/line/[id]` | **Line** | Line status + stations + recent reports. | public read |
| `/station/[id]` | **Station** | Station status + recent reports at station. | public read |
| `/report` | **Report composer** (modal) | Fast report creation. | required to submit |
| `/login` | **Login** | Sign in. | — |
| `/register` | **Register** | Create account. | — |
| `/profile` | **Profile** | Current user + trust. | required |
| `/admin/reports` | **Moderation** (moderator) | Hide problematic reports. | MODERATOR |

Home is the primary screen. Line/Station are reachable from Home; the report composer opens as a
modal from Home (and Station/Line).

## Home (priority order)

1. **Current operational status** — per-line summary chips/rows: line color, `NORMAL` /
   `RESTRICTED` / `INTERRUPTED` / `UNKNOWN`, last-update time. From `GET /status`.
2. **Recent train reports** — newest-first feed of `GET /reports/recent`, each card showing type,
   station, direction, time-ago, confidence, confirm/dispute actions.
3. **Relevant station information** — quick access to stations/lines (from `GET /lines`,
   `GET /stations`).
4. **Report action** — a prominent "Report" button opens the composer.

Live updates: subscribe to `GET /events`; SSE events update the React Query cache so status and
reports refresh in place (see `frontend/data-flow.md`).

## Report composer (`/report`, modal)

Optimized for speed. Flow depends on type:

### Train event (TRAIN_ARRIVING / ARRIVED / DEPARTED / STOPPED)
1. Pick **line** (pre-filled from context, e.g. opened line/station).
2. Pick **station** (search or list; nearest suggested from map/location if available).
3. Pick **direction** (the two endpoints of the line).
4. **Type** is chosen first (one tap) — the composer adapts fields.
5. Optional description, optional "send my location" toggle (on-demand only; `expo-location`).
6. Submit → `POST /reports`. Optimistic update, then reconcile with server.

### Operational problem / interruption / normal operation
1. Pick **line**.
2. Pick **type** (`OPERATIONAL_RESTRICTION` / `SERVICE_INTERRUPTION` / `NORMAL_OPERATION`).
3. Optional station, description, location.
4. Submit.

## Login / Register

- Email + password forms (react-hook-form + Zod).
- On success, store JWT (secure storage) → redirect to Home.
- Guest mode: users can consume Home without logging in; reporting/confirming prompts login.

## Station / Line screens

- Header with status badge + last-update time.
- Recent reports scoped to the line/station.
- "Report" button pre-scoped to the current line/station.

## Profile

- Email, username, name, role, `trustScore`.
- Logout (clears token).

## Moderation (`/admin/reports`, MODERATOR only)

- List of recent reports; "Hide" action with reason (`PATCH /reports/:id/hide`).
- Minimal — no dashboards.

## Navigation & theming

- Keep the existing `NativeTabs` shell (Home + a second tab, e.g. "Lines"/"Stations"). The current
  `explore.tsx` starter tab is replaced by a real screen.
- Use existing theme tokens (`src/constants/theme.ts`) and themed primitives.
- Status colors: map `NORMAL`→green, `RESTRICTED`→amber, `INTERRUPTED`→red, `UNKNOWN`→gray, drawn
  from theme where possible.