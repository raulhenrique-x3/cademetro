# Product Overview

## Problem

Metro riders need real-time operational information: where a train is, when it arrives/leaves,
delays, long intervals, restrictions, and interruptions. Today this is solved through a **WhatsApp
group** where users manually type fragmented, unstructured messages. The information is:

- scattered and noisy;
- hard to search or aggregate;
- impossible to reason about (direction, line, station, time are free-form);
- stale — there is no concept of time or reliability;
- not consumable by riders not in the group.

## Solution

**CadêMetrô** ("where's the metro?") converts those manual reports into **structured, real-time,
reasonably-reliable operational information**.

- Users submit one of a fixed set of **report types** tied to a line, station, and direction.
- Other users **confirm or dispute** reports, building a reliability signal.
- The backend **aggregates recent reports** into a per-line (and per-station) **operational status**:
  `NORMAL`, `RESTRICTED`, `INTERRUPTED`, or `UNKNOWN`.
- Connected clients receive updates live over **SSE** — no manual refresh.

## MVP hypothesis

> Users can quickly report metro events, and the system can transform those reports into useful and
> reasonably reliable real-time operational information.

The MVP proves two things:

1. **Speed** — reporting an event takes a few seconds on the home screen.
2. **Signal** — the aggregated status and per-report confidence are useful and trusted enough to act on.

## Target user

A metro rider with the app open while traveling, who wants to know the state of their line and
station in a few seconds, and who is willing to spend ~5 seconds reporting what they observe.

## Positioning

Complementary to (not a replacement for) the WhatsApp group: reports are the input to the
structured system. The MVP does not integrate with WhatsApp; users report in-app.

## Core value loop

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

This loop is detailed in `product/user-flows.md` and the status aggregation rules in
`domain/reports.md`.

## What is explicitly out of scope

See `product/mvp-scope.md` for the precise in/out list. Highlights: no schedule data, no live GPS
tracking of trains, no train-to-station assignment beyond a report, no payment/gamification, no
full admin console, no WebSockets.