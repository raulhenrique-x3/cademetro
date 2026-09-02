# Domain: Reliability

Goal: the system must **not blindly trust a single report**. Produce a reasonable confidence signal
so consumers can gauge how much to trust an event. This is intentionally simple — **no ML**, no
probabilistic models.

## Inputs

- **Report age** — recent reports are more relevant.
- **Confirmations** — more confirms raise confidence.
- **Disputes** — more disputes lower confidence.
- **Author trust** — reporters with a good history are weighted higher.
- **Independent reports** — multiple reports of the same event corroborate.

## Confidence score (per report)

A scalar `confidence` in `[0, 1]`, computed as a weighted blend:

```text
confidence = w_age · f_age + w_conf · f_conf + w_trust · f_trust
```

Weights (documented constants, tunable):

```text
w_age   = 0.40
w_conf  = 0.35
w_trust = 0.25
```

### f_age — freshness

Decays linearly from `1.0` at `t = 0` to `0.0` at `t = CONFIDENCE_AGE_WINDOW` (default 30 min).

```text
f_age = clamp(0, 1, 1 - (now - createdAt) / CONFIDENCE_AGE_WINDOW)
```

### f_conf — confirmation balance

```text
net = confirms - disputes
f_conf = clamp(0, 1, (1 + net) / (1 + confirms + disputes))   // optimistic smoothing; 0 confirms → 0.5
```

- 0 confirms, 0 disputes → `0.5` (neutral, "unconfirmed").
- 1 confirm, 0 disputes → `2/2 = 1.0`.
- 1 confirm, 1 dispute → `1/3 ≈ 0.33`.
- 0 confirms, 1 dispute → `0/2 = 0`.

### f_trust — author trust

```text
trust = (confirmedReceived + 1) / (confirmedReceived + disputedReceived + 2)   // Laplace smoothing
```

where `confirmedReceived` / `disputedReceived` are, over the author's past **non-hidden** reports,
how many received at least one confirm / dispute. A new user starts at `trust = 0.5`.

## Outputs exposed

Each report response includes:

- `confidence` (`0..1`).
- `confirmations` — `{ confirm: n, dispute: n }` counts (derived from `ReportConfirmation`).
- `authorTrust` (`0..1`) — the author's trust score (optional; may be omitted for privacy).

## User trust (derived)

`trustScore` is derived from the user's report + confirmation history using the `f_trust` formula
above. Computed on request; **not stored**. Used both for confidence and for a basic
"reputation/trust" read on the user profile.

## Independent reports

Two reports are "corroborating" if they share `lineId` + `stationId` + `directionId` (for `TRAIN_*`)
and occurred within `CORROBORATION_WINDOW` (default 5 min). The MVP exposes **count of independent
reports** alongside confidence as an informational field (`reportCount`), but does **not** fold it
into the scalar formula. This keeps the formula simple while still surfacing corroboration.

## Edge cases

- **Own report**: a user cannot confirm/dispute their own report, so an author cannot inflate their
  own confidence.
- **No data**: no reports → status `UNKNOWN`, no confidence to show.
- **Hidden reports** are excluded from all reliability calculations.

## Scope boundary

This is a **deterministic heuristic** with documented constants. No model training, no feedback
loops, no prediction. The constants live in a single configuration object in `StatusModule` /
`ReliabilityService` so they can be tuned without touching business logic. The service is pure and
fully unit-testable without a database (feed reports + confirmations, assert `confidence`).