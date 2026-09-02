# MVP Scope

## In scope

### Users
- Registration and login (email + password).
- User account with basic profile fields.
- Basic trust/reputation signal derived from report history (see `domain/reliability.md`).

### Metro infrastructure (seed data)
- Lines.
- Stations (with geographic coordinates).
- Station ordering per line (position of a station on a line).
- Directions/endpoints per line (the two travel directions).

### Community reports
Users can report one of seven types:

| Report type | Meaning |
|-------------|---------|
| `TRAIN_ARRIVING` | train approaching the station |
| `TRAIN_ARRIVED` | train arrived / is at the platform |
| `TRAIN_DEPARTED` | train left the station |
| `TRAIN_STOPPED` | train is stopped (unexpected hold) |
| `OPERATIONAL_RESTRICTION` | reduced speed / partial service on the line |
| `SERVICE_INTERRUPTION` | service interrupted on the line |
| `NORMAL_OPERATION` | service running normally |

Each report carries: relevant **line**, optional **station**, optional **direction**, the
**author**, a server **timestamp**, an optional **description**, and an optional **geographic
position** sent from the client.

### Report confirmation
Other users can **confirm** or **dispute** a report (one action per user per report). This feeds the
reliability/confidence signal.

### Operational status (aggregated, derived)
Backend aggregates recent reports into per-line (and per-station) status: `NORMAL`, `RESTRICTED`,
`INTERRUPTED`, `UNKNOWN`. Also exposes:
- recent reports;
- last known train events;
- per-report confidence/reliability;
- number of confirmations (confirm/dispute counts);
- last update time.

### Real-time updates
- Server-Sent Events (SSE) push new operational info to connected clients without manual refresh.
- **WebSockets are out of scope** unless a concrete requirement later demands them.

### Location
- The frontend **may** send the user's current geographic position when creating a report.
- **No continuous user tracking.**

### Protection
- Basic rate limiting, especially around report creation.

### Administration (minimum)
- Enough to moderate problematic reports: a moderator role can **hide** a report (soft delete).
- **No** complex admin console.

## Explicitly NOT in scope (MVP)

- **Schedule / timetable data** (next-train ETA from schedules). Arrival times come only from user
  reports.
- **Live GPS train tracking** or automatic position feeds.
- **WhatsApp integration** or scraping of the existing group.
- **WebSockets**.
- **Refresh tokens** / full OAuth / social login.
- **ML-based** reliability prediction, demand forecasting, or delay prediction.
- **Gamification**, points, badges, leaderboards.
- **Full administration system** (roles matrix, audit logs, dashboards).
- **Continuous user location tracking** (only on-demand at report time).
- **Multiple metro operators / cities** (single operator dataset).
- **Push notifications**.
- **Offline mode**.

## In/out decision rationale

- **SSE over WebSockets**: SSE is one-way (server→client), which is exactly the MVP need (push new
  reports/status). It uses plain HTTP, survives proxies, auto-reconnects via `EventSource`, and
  needs no extra protocol handling. Client→server writes still use normal REST `POST`. See
  `architecture/realtime.md`.
- **No Redis/message broker**: the MVP is a single-process modular monolith. A simple in-memory
  RxJS `Subject` serves all connected clients. A broker adds deployment complexity with no MVP
  benefit. See `architecture/backend.md`.
- **Derived status not stored**: avoids stale/cached state and a source-of-truth split. Recompute on
  request from recent reports. See `domain/overview.md`.