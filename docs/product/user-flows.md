# User Flows

Primary flow:

```text
User opens application
        ↓
Sees current operational status
        ↓
Selects/identifies relevant station
        ↓
Sees recent reports
        ↓
Reports a train event
        ↓
Backend validates and stores report
        ↓
System updates operational state
        ↓
Connected users receive update through SSE
```

## First run / onboarding (light)

1. User opens app → sees the **Home** screen. Reads status and recent reports **without logging in**
   (public read).
2. Taps **"Report"** → prompted to log in or register.
3. Register (email + password) or log in. Backend returns a JWT access token; client stores it.
4. User returns to Home and can report.

**Decision**: reads (lines, stations, status, recent reports, SSE stream) are **public**. Only
mutations (report creation, confirm/dispute) require authentication. This maximizes zero-friction
consumption while protecting write integrity. See `api/overview.md`.

## Report train arriving / arrived / departed / stopped

Goal: record a train event at a station in a few seconds.

1. On Home, user taps the **Report** action → report composer opens (modal / bottom sheet).
2. Composer pre-fills the **line** from the user's current context and lets the user pick a
   **station** (search or list). If a map is open, the nearest station may be suggested.
3. User picks the **report type** (arriving / arrived / departed / stopped).
4. User picks the **direction** (endpoint). (Not required for a line-wide type.)
5. Optional: short **description**, optional **send my location** toggle.
6. Tap **Send** → `POST /reports`. Client optimistically inserts, backend validates and stores.
7. Home reflects the new report; all connected clients receive the `report.created` SSE event and the
   updated status via `status.updated`.

## Report operational problem / interruption / normal operation

Same flow, but scoped to a **line** (station/direction optional) instead of a station-direction:

1. Open report composer.
2. Pick **line** and the type: `OPERATIONAL_RESTRICTION`, `SERVICE_INTERRUPTION`, or
   `NORMAL_OPERATION`.
3. Optional station, description, location. Send.

## Confirm / dispute a report

1. On Home or the station screen, a recent report card shows confirm/dispute actions.
2. User taps **Confirm** or **Dispute** → `POST /reports/:id/confirm` or
   `POST /reports/:id/dispute`.
3. A user cannot confirm/dispute their **own** report (backend rejects).
4. One action per user per report; tapping again on the same report toggles/removes it (upsert).
5. Confidence shown on the card updates; `report.confirmed` / `report.disputed` SSE events broadcast.

## See current status

1. Home shows the aggregated status per line (`NORMAL`, `RESTRICTED`, `INTERRUPTED`, `UNKNOWN`),
   last-update time, and recent reports.
2. Selecting a line → line status + list of its stations.
3. Selecting a station → station status + recent reports at that station.

## Guest consumption

Guest opens app → sees Home status + recent reports live via SSE, without an account. Reads only.

## Moderator moderation (minimum)

1. Moderator opens a flagged/problematic report (via report detail).
2. Taps **Hide** → backend soft-hides it (`isHidden = true`).
3. Hidden reports are excluded from status aggregation and recent-report queries.

## Edge: reconnection

If the SSE connection drops, `EventSource` auto-reconnects. On reconnect the client re-fetches the
current status + recent reports snapshot, then resumes the stream. See `architecture/realtime.md`.