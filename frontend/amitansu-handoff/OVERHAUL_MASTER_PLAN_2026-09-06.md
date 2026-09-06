# GNB — Platform Overhaul Master Plan

**Branch:** `revamp/frontend-audit-fixes` (github.com/GNB-motors/main-frontend)
**Written:** 2026-09-06 · **Author:** Opus 5 (planning only — implementation by Sonnet / Kimi)
**Status:** authoritative work order. Supersedes `FRONTEND_MASTER_PLAN.md` where they disagree.

---

## §0 — HOW TO USE THIS DOCUMENT (implementing agent: read this section twice)

You are implementing this plan. You did not write it. The person who wrote it measured the
codebase first; every claim in §1 has a file and a line number behind it. **If you find a claim
in §1 that is wrong, STOP and report it — do not silently work around it.** A wrong baseline
means the design built on it is also wrong, and continuing wastes the whole task.

### The seven rules that keep you from drifting

1. **Do not invent scope.** Each task has an explicit *Files touched* list. If you find yourself
   editing a file not on that list, stop and ask. The most common failure mode in this codebase
   is an agent "improving" an adjacent module and breaking a legacy contract.

2. **Never modify these legacy modules** (standing user rule, `HANDOFF.md` §7):
   `fuelComparison`, `mileage`, `geofenceZone`, `geofenceAnomaly`, `route`, `maintenance`.
   ⚠️ **`route` is on that list and this plan changes route behaviour.** The resolution is in
   Workstream E: you create a **new** `routeGeometry` module and add exactly **one** additive,
   nullable field to `route.model.js`. You do not touch `route.service.js` logic,
   `route.controller.js`, or any existing route endpoint's response shape. That one field is the
   only sanctioned edit to a legacy module in this entire plan. Get it reviewed before merging.

3. **NEVER DELETE FLEET DATA.** Not a row, not a collection, not "cleanup" of stale telemetry.
   TTL indexes are forbidden on any telemetry collection. If a table gets big it moves to cheaper
   storage — it does not get trimmed. This rule has no exceptions.

4. **Tests need `SKIP_DB=1`** or every backend suite fails on a missing local Mongo. If you see
   "109 of 110 suites failing", that is your environment, not the code. Diagnose before alarming.

5. **`0` is a value. Empty is not fresh. Absent is not zero.** This distinction is the biggest
   product bug in the current frontend (§1.2) and half this plan exists to fix it. Any time you
   render a number you must be able to answer: what does this show when the backend returns `[]`,
   when it returns `null`, and when the request fails? If those three render identically, you
   have written the bug again.

6. **Enumerate every stored signal before estimating one.** The user's most-repeated instruction.
   Before you compute speed, list every field that already carries speed. Before you compute
   idling, list every field that already carries idle minutes. There are usually two or three,
   and the right answer is a subtraction, not a model (`HANDOFF.md` §3 rule 11).

7. **Do not average disagreeing sources.** If CAN says one thing and GPS says another, surface
   both with their provenance and let a human decide. Averaging destroys the evidence that makes
   the product trustworthy. The instinct to preserve, in the user's words: *"there might be a
   theft or a leak, please check these vehicles, the rest are normal."*

### Definition of done for every task

A task is done when **all** of these hold. "It renders" is not done.

- [ ] The code does what the task says, and nothing the task does not say.
- [ ] Unit tests exist for every pure function introduced, including empty / null / error cases.
- [ ] `npm run lint` reports **no new** errors (the repo has pre-existing ones — lint your own
      files, not the repo).
- [ ] `npm test` passes; report the actual count (`N passed`), never "tests pass".
- [ ] The build succeeds and you report the measured main-chunk byte size.
- [ ] You state which acceptance criteria you verified and how. If you could not verify one,
      say so — do not claim it.

### Evidence discipline

Report what you ran and what it printed. Not "the endpoint works" — paste the status code and
the first 200 bytes of the body. Not "polling is replaced" — show one open `EventSource` and
zero repeating XHRs. The user has personally caught more than twenty confident-but-wrong claims
in this project (`HANDOFF.md` §3). Assume your claim will be checked, because it will be.

---

## §1 — MEASURED BASELINE (verified 2026-09-06, on this branch)

Everything here was checked against code, not remembered.

### §1.1 There is no realtime transport. At all.

- `grep -rn "text/event-stream" backend/main-backend/app` → **zero matches**
- `grep -rn "flushHeaders" backend/main-backend/app` → **zero matches**
- no `socket.io`, no `ws`, no SSE package in `backend/main-backend/package.json`

**Consequence:** SSE is a greenfield build, not a modification. Nothing in the backend currently
holds a long-lived response open, which also means no part of the infrastructure (nginx, ALB,
Docker) has ever been tested for it. See §2.A.6 for the proxy traps.

### §1.2 Polling is wired so "no data" renders as "live data"

There are **15 `setInterval` sites** in the frontend. The two that matter:

- `frontend/src/pages/LiveTracking/LiveTrackingPage.jsx:73` — `setInterval(fetchPositions, POLL_INTERVAL_MS)`
- `frontend/src/pages/Overview/OverviewPage.jsx` — same primitive, same cadence

`POLL_INTERVAL_MS = 45 * 1000` is defined at `liveTracking.shared.js:21`.

**The bug**, `LiveTrackingPage.jsx:57-62`:

```js
const records = await LiveTrackingService.getPositions();
setPositions(records);          // records may be []
setError(null);                 // clears any previous error
setLastPolledAt(new Date());    // stamps "fresh" unconditionally
```

`LiveTrackingService.getPositions()` (`LiveTrackingService.jsx:19`) ends with
`return response.data?.data?.records || []`. So a backend that returns an empty set, an org with
no linked vehicles, and a perfectly working backend with all trucks parked are
**indistinguishable in the UI**. All three paint an empty map with a green "updated just now".
This is exactly the user's complaint: *"0 (that's also a response) → would say data is live,
doesn't help us."*

The same shape recurs at `FleetDataService.js:11` and `OwnerValueService.js:11`, both doing
`return response.data?.data || {}` — collapsing "server said no" and "server said nothing".

### §1.3 Nine backend prefixes have zero frontend callers

Measured by `grep -rl "/api/<prefix>" frontend/src | wc -l`:

| Prefix | FE files | What is stranded |
|---|---|---|
| `/api/idling-reports` | **0** | `idleHours`, `estimatedWasteInr` per vehicle/window — explicitly requested |
| `/api/fleet-insights` | **0** | The whole FleetEdge CAN feed — fuel, distance, engine hours, idling minutes |
| `/api/parking-zone-proposals` | **0** | Auto-discovered parking clusters — free geofences nobody sees |
| `/api/hotspots` | **0** | Hotspot watch |
| `/api/insights` | **0** | `insightsCompare` |
| `/api/notifications` | **0** | In-app notification store |
| `/api/insurance` | **0** | Insurance records |
| `/api/mileage-report` | **0** | Mileage reporting |
| `/api/tyres` | **0** | Deliberately flag-gated — **leave alone** |

Plus three data-layer methods with **zero UI consumers**: `useComplianceRisk`
(`hooks/useOwnerValue.js:30`), `useTripPnl` (`:34`), and
`FleetDataService.getMaintenancePredictions` (`services/FleetDataService.js:50`).

And one module **not mounted at all**: `tripTelematics` appears nowhere in `app/app.js` or
`app/routes.js`; it is reachable only indirectly via `/api/erp/trips/:tripId/segments`.

**Correction worth noting:** `idlingReport` and `parkingPatterns` *are* mounted — via the barrel
at `app/routes.js` (`/idling-reports`, `/parking-zone-proposals`), not in `app.js`. They are
reachable and unused. That is a frontend gap, not a backend one. Do not "fix" the backend here.

### §1.4 Routes are saved without geometry, so they cannot be drawn

`app/modules/route/route.model.js` stores `sourceLocation{lat,lng}`, `destLocation{lat,lng}`,
`distanceKm`, `googleKm`, `extraKm`, `totalKm`, `viaStates`. It stores **no polyline, no path,
no waypoints, no geometry of any kind.**

The geometry *is* fetched — and thrown away. `components/RouteCreator/RouteCreator.jsx:382`
constructs a `DirectionsService`; at `:401` it takes exactly one number out of the result:

```js
const distanceMeters = results.routes[0].legs[0].distance.value;
```

`results.routes[0].overview_polyline` — the encoded path, already paid for, already in memory —
is discarded on the next line. `RoutesPage.jsx:149` then renders `routes.map(...)` as a **list**.

**Consequence:** drawing a saved route today requires re-calling Google Directions, a paid
request per view. That is the "can't sustain that" cost. Fix: persist the polyline once (§2.E).

### §1.5 Trip segments carry endpoints, not paths

`app/modules/tripTelematics/vehicleMovementSegment.model.js:68-69` stores `startPoint` and
`endPoint` (each `{lat,lng}`) and nothing between them. `tripTelematics.model.js` stores
aggregates only — `ladenKm`, `approachKm`, `fuelConsumedL`, `durationHours`, `snapshotCount`.

This is why *"geometric points are marked but the route is not displayed"* — the marked points
**are** the segment endpoints and site clusters. No path was ever stored.

### §1.6 The real GPS trail exists and is excellent

`app/modules/liveTracking/liveVehiclePositionHistory.model.js` — append-only, one row per
advancing `eventDateTime`, carrying:

`latitude`, `longitude`, **`speed`**, **`courseDegrees`** (heading), `ignition`,
`primaryFuelLevel`, `status`, `state` (`ACTIVE|PARKED|OFFLINE`), `eventDateTime`, `pulledAt`

Indexes: `{orgId, vin, eventDateTime}` unique · `{orgId, registrationNumber, eventDateTime}`

**This one collection is the foundation of route replay, the 3-D truck heading, overspeed
detection, idling detection and ETA.** It already has everything. Nothing new needs collecting.
There is **no TTL on it** (verified — and per §0 rule 3 there must never be one).

Sampling density is known and good (`HANDOFF.md` §3 #20, measured over 1,114 highway pairs):
p50 **1.0 min** while moving; 97% of gaps ≤2 min rural, 82% ≤2 min metro; p99 9–12 min
everywhere. Nothing reaches 30 min. **Do not design around a "sparse rural feed" — that claim
was tested and is false in this data.**

### §1.7 Driver location has no history

`app/modules/driverLocation/driverLocation.model.js:18-23` declares `driverId` with
`unique: true`. One row per driver, overwritten every ping. There is no trail.

App side, `app/DriverApp/frontend/src/services/locationTracker.js`:
- `INTERVAL_MS = 2 * 60 * 1000` — a plain `setInterval`
- `Location.getForegroundPermissionsAsync()` — **foreground only**
- no `expo-task-manager`, no `startLocationUpdatesAsync`, no background task
- no offline queue: a failed POST is logged and dropped

**Consequence:** the app stops reporting the moment it is backgrounded or the screen locks —
which on a driver's phone is nearly all the time. Trip↔driver reconciliation has almost no data
to reconcile with, and what little exists is not retained.

### §1.8 There is no ETA logic and no manager app

`grep -rn "\bETA\b|estimatedArrival|etaAt|predictedArrival"` over the backend → **zero matches.**
Predictive ETA is greenfield.

`f:/gnb/app/` contains exactly one directory: `DriverApp`. There is no manager app. The "manager
side app" is a new build (§2.F.4), and the cheapest correct form is a **role mode inside the
existing Expo app**, not a second codebase.

### §1.9 The list primitive is good and almost unused

`frontend/src/hooks/useErpList.js` (264 lines) is genuinely well-built: URL-synced filter state
(`?q= &from= &to= &page= &limit= &sortBy= &order=`), debounced search, `AbortController`
cancellation of superseded pages, `urlPrefix` namespacing for two lists on one screen, and a
documented reason for each `useEffect` dependency choice.

**It is used by 3 of 59 pages** — all three in `ErpAccounts/`. Every fleet page (Overview,
Vehicle360, FleetAlerts, FuelSpend, DefLedger, Drivers, Reports, Maintenance, Trip, LiveTracking,
Geofence, MileageTracking, Compliance, FleetCoverage) hand-rolls its own state.

**This is the answer to "make filters for everything": generalise and adopt the primitive that
already exists. Do not write a new one.**

### §1.10 Theming already has the hook the redesign needs

`frontend/src/utils/colorTheme.js` exposes `applyThemeToRoot()`, which writes every CSS custom
property onto `document.documentElement` — `--primary-color`, `--primary-light`, `--primary-dark`,
`--color-primary-100/500/600`, and the Shadcn `--primary` / `--primary-foreground` tokens (with
an approximate hex→oklch conversion so Shadcn components follow).

`Sidebar.jsx:87-99` already listens for a `themeColorChange` window event and re-applies.
**The ERP orange→blue sidebar transition is a CSS-variable animation on an existing mechanism,
not a rewrite** (§2.H.3).

---

## §2 — WORK ORDER

Eight workstreams. **The order is deliberate and is the user's own:** make the data correct and
reachable first, then compute what is missing, then build visual features on top, then optimise,
and only then redesign. Do not reorder — redesigning screens whose data is still wrong is
thrown-away work.

| # | Workstream | Depends on | Size |
|---|---|---|---|
| A | Transport & liveness (SSE, cold-call elimination, freshness truth) | — | L |
| B | Ungating (surface the 9 stranded prefixes) | A | M |
| C | Filters, sorting, saved views everywhere | — | M |
| D | Telematics compute (speed, overspeed, idling, geomapping, ETA) | — | L |
| E | Routes: persist geometry, replay, 3-D truck | D | L |
| F | Driver app background tracking + reconciliation + manager app | D | L |
| G | Query & bundle optimisation | A–F | M |
| H | Redesign (incl. ERP orange→blue) | A–G | L |

Pricing (§5) is a written deliverable, not code, and can be produced at any time.

---

# WORKSTREAM A — TRANSPORT & LIVENESS

**Goal:** one open stream per session instead of N repeating polls; and a UI that can never again
show emptiness as freshness.

This workstream has two halves that are easy to confuse. **A.1–A.6 is the transport** (SSE).
**A.7–A.9 is the truth model** (freshness/provenance). The truth model is the more important of
the two and must be done even if SSE slips. Do the truth model first.

## A.1 — The `DataEnvelope` contract (do this before anything else)

Every read endpoint this plan touches returns the same envelope. This is what kills the
"0 = live" bug at the root rather than patching it per page.

Create `backend/main-backend/app/utils/dataEnvelope.js`:

```js
/**
 * The house response envelope. Every read endpoint returns this shape so the
 * frontend can always distinguish four states that used to collapse into one:
 *   OK          — we asked, we got rows
 *   EMPTY       — we asked, the answer is legitimately zero rows
 *   UNAVAILABLE — we could not ask (upstream down, token expired, not linked)
 *   STALE       — we have rows but they are older than the freshness contract
 */
function envelope({ rows, generatedAt, source, freshness, coverage, reason }) { ... }
```

Fields, all required unless marked:

| Field | Type | Meaning |
|---|---|---|
| `status` | `'OK' \| 'EMPTY' \| 'UNAVAILABLE' \| 'STALE'` | The four states above |
| `data` | array or object | The payload. `[]` when `EMPTY`, never `null` |
| `generatedAt` | ISO string | When the server computed this |
| `source` | string | `'live_position' \| 'can' \| 'insight_window' \| 'derived' \| 'manual'` |
| `freshness.newestEventAt` | ISO or null | Newest underlying event timestamp |
| `freshness.ageSeconds` | number or null | `now - newestEventAt` |
| `freshness.contractSeconds` | number | Age beyond which this endpoint is `STALE` |
| `coverage.expected` | number | Vehicles/rows that *should* have reported |
| `coverage.actual` | number | Vehicles/rows that *did* |
| `reason` | string, optional | Human sentence, required when `UNAVAILABLE` |

**The rule that makes this work:** `EMPTY` and `UNAVAILABLE` are different HTTP-200 responses.
A vehicle that is genuinely parked with zero movement is `OK` with a zero value. An org with no
FleetEdge token is `UNAVAILABLE` with `reason: 'No FleetEdge account linked for this org.'`
An org whose token expired is `UNAVAILABLE` with a different reason. **A zero is never
`UNAVAILABLE`, and an outage is never `0`.**

This directly answers `HANDOFF.md` §3 #21 — the completeness check that passed on an empty
window for weeks because absence of a failure signal was read as a pass. *A green check whose
inputs were empty must report `skipped`, not `ok`.* Same principle, applied to the product.

**Files touched:**
- create `app/utils/dataEnvelope.js`
- create `app/utils/dataEnvelope.test.js`
- modify `app/utils/responseHelper.js` — add `sendEnvelope(res, envelope)`; **do not change the
  existing helper's behaviour**, add alongside

**Tests (write first):**
- zero rows + healthy upstream → `EMPTY`, not `UNAVAILABLE`
- zero rows + no linked account → `UNAVAILABLE` with a non-empty `reason`
- rows present, `newestEventAt` older than `contractSeconds` → `STALE`
- `coverage.actual > coverage.expected` → throws (a coverage bug must be loud, not rounded)

**Acceptance:** given a mocked service returning `[]`, the envelope's `status` differs depending
solely on whether the org has a live account. Prove it with two test cases.

## A.2 — Frontend mirror of the envelope

Create `frontend/src/lib/envelope.js`:

- `parseEnvelope(response)` → `{ status, data, generatedAt, source, freshness, coverage, reason }`
- `isActionable(env)` → `env.status === 'OK'`
- `ageLabel(env)` → `'live' | '2 min ago' | '4 h ago' | 'unknown'`
- `provenanceLabel(env)` → human string for `source`

Then modify `frontend/src/hooks/useApi.js` to carry it. **Additive, non-breaking:** keep the
existing `{ data, loading, error, refetch }` and add `status`, `freshness`, `coverage`, `reason`.
Existing callers keep working; new code reads the new fields.

**Files touched:** `src/lib/envelope.js` (new), `src/lib/envelope.test.js` (new),
`src/hooks/useApi.js` (extend return object only).

## A.3 — The `<DataState>` component (the visible half of the fix)

Create `frontend/src/components/data-state/DataState.jsx`. The directory already exists.

```jsx
<DataState env={env} loading={loading} error={error}
           empty={<EmptyState .../>} unavailable={<Unavailable .../>}>
  {(rows) => <YourTable rows={rows} />}
</DataState>
```

Rendering rules, in order:

1. `error` → error panel with the request id (already logged by `axiosConfig.js`)
2. `loading && !data` → skeleton
3. `status === 'UNAVAILABLE'` → **amber** panel, shows `reason`, offers the fixing action
   ("Link a FleetEdge account", "Re-authorise"). **Never a green timestamp.**
4. `status === 'EMPTY'` → neutral panel: "No records in this window." + the window shown +
   a "widen range" action. **Not an error, not a success.**
5. `status === 'STALE'` → render the data **dimmed**, with a persistent amber strip:
   "Showing data from 4 h ago. Live feed interrupted."
6. `status === 'OK'` → children, plus a subtle freshness chip

Also create `FreshnessChip.jsx` in the same folder: a dot + relative age + provenance on hover.
Green ≤ contract, amber ≤ 3×, red beyond. **The chip renders `source` too** — the user's
instinct is to always ask what the second signal says; showing "CAN · 2 min" vs
"GPS · 40 s" on the same card is how that question gets answered without asking.

**Acceptance:** a page whose API returns `[]` must be visually distinguishable at a glance from
the same page when the org has no token. Screenshot both.

## A.4 — The SSE endpoint

Create `backend/main-backend/app/modules/liveStream/`:

| File | Contents |
|---|---|
| `liveStream.routes.js` | `GET /api/live/stream` — `auth('USER')`, `tenantGuard` |
| `liveStream.controller.js` | Opens the SSE response, registers the client, cleans up |
| `liveStream.registry.js` | In-process `Map<orgId, Set<client>>` + heartbeat timer |
| `liveStream.service.js` | Change detection: what to push and when |
| `liveStream.test.js` | Unit tests for registry and diffing |

Mount in `app/app.js` next to the other `tenantGuard` mounts:
`app.use('/api/live', tenantGuard, liveStreamRoutes);`

**Controller shape** (the parts that are easy to get wrong):

```js
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',   // no-transform matters, see A.6
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',                   // nginx: do not buffer, see A.6
});
res.flushHeaders();
```

Then: write a `retry: 15000` line once, register the client, and `req.on('close', unregister)`.

**Event types** (`event:` field), each with a JSON `data:` payload that is itself an envelope:

| Event | Payload | Cadence |
|---|---|---|
| `hello` | `{ sessionId, serverTime, contracts: {...} }` | once on connect |
| `positions` | changed positions only (diff, not full set) | on change, ≤ every 20 s |
| `alerts` | new owner-alerts since last cursor | on change |
| `freshness` | `{ newestEventAt, coverage }` | every 30 s regardless |
| `heartbeat` | `:` comment line | every 15 s |

**The freshness event is the critical one.** It fires **even when nothing changed**, which is how
the client distinguishes "nothing is moving" (heartbeat arriving, coverage healthy) from "the
feed died" (no heartbeat). Without it you have rebuilt the original bug in a new transport.

**Change detection** (`liveStream.service.js`): the backend cron already writes
`LiveVehiclePosition`. Do **not** add a Mongo change stream in v1 — the deployment does not
guarantee a replica set in every environment and this is exactly the kind of hidden-infra
assumption that stalls a build. Instead: a single module-level `setInterval` (one per process,
**not** one per client) that every 20 s queries positions with
`updatedAt > lastBroadcastAt` for orgs that currently have listeners, and pushes only the diff.
One query per interval for the whole process, regardless of how many browsers are open. That is
the entire cost argument for SSE over polling: **N browsers × 45 s polls becomes 1 query / 20 s.**

**Backpressure:** if `res.write()` returns `false`, mark the client congested and skip its next
push rather than queueing. A stalled mobile connection must never grow server memory.

**Limits:** cap at 5 concurrent streams per user and 200 per process; return `429` beyond, with a
`reason` the client can render. Log the counts so we can see them in LEMU.

## A.5 — The frontend SSE client

Create `frontend/src/lib/liveStream.js` — **one connection per session, shared by every page.**

- `getLiveStream()` — lazy singleton. First subscriber opens it, last unsubscribe closes it
  after a 30 s grace period (so route changes don't thrash the connection).
- `subscribe(eventType, handler)` → returns an unsubscribe function
- reconnect with exponential backoff, 1 s → 30 s, full jitter
- `document.visibilitychange`: on `hidden` for >5 min, close; reopen on `visible`. A backgrounded
  tab must not hold a server slot all night.
- expose `connectionState`: `'connecting' | 'open' | 'reconnecting' | 'closed'`

**Auth trap:** browser `EventSource` cannot set an `Authorization` header. Two options — pick
option 1:
1. **Short-lived stream ticket.** `POST /api/live/ticket` (normal bearer auth) returns a
   60-second single-use token; the client opens `/api/live/stream?ticket=...`. The ticket is
   verified and burned on connect. Clean, no cookie changes, works cross-origin.
2. Cookie auth — rejected: the app is bearer-token based (`axiosConfig.js:18`) and adding a
   cookie path for one endpoint invites CSRF questions nobody has budgeted for.

Then create `frontend/src/hooks/useLiveData.js`:

```js
const { rows, status, freshness, connectionState } = useLiveData('positions', {
  initialFetch: () => LiveTrackingService.getPositions(),
});
```

It does the initial REST fetch **once**, then applies streamed diffs. On reconnect it re-fetches
once to resynchronise (an SSE gap may have dropped events).

## A.6 — Infrastructure (INSPECTED 2026-09-06 — three confirmed blockers, not hypotheticals)

I read the actual configs. This is not a checklist of things that might be wrong; two of these
**are** wrong today and will make SSE deliver nothing.

### 🔴 BLOCKER 1 — `compression()` is applied globally

`app/app.js:93` — `app.use(compression());` (package declared, `^1.8.1`), sitting above every
route. The `compression` middleware buffers responses to gzip them. `text/event-stream` matches
`text/*` in the `compressible` package, so **it will try to compress the stream and the browser
will receive nothing** — the connection opens, stays open, and delivers zero events. This is the
classic "SSE works locally, dies in Docker" failure.

Two fixes; **apply both**, because either alone is one careless edit from breaking:

1. The `Cache-Control: no-cache, no-transform` header in A.4 — `compression` honours
   `no-transform` and skips. This is why that header is in the spec; do not drop it.
2. An explicit filter, so it cannot regress if someone edits the headers:

```js
app.use(compression({
  filter: (req, res) =>
    res.getHeader('Content-Type') !== 'text/event-stream' && compression.filter(req, res),
}));
```

### 🔴 BLOCKER 2 — nginx `/api/` has no streaming settings

`frontend/main-frontend/frontend/nginx.conf`, the `location /api/` block, sets only
`proxy_pass`, `proxy_http_version 1.1` and four `X-Forwarded`/`Host` headers. Therefore:

- **`proxy_buffering` defaults to `on`** → nginx buffers the upstream stream. The
  `X-Accel-Buffering: no` header from A.4 does override this, but relying on a single header
  through a proxy chain is fragile.
- **`proxy_read_timeout` defaults to 60 s** → nginx closes the upstream connection after 60 s
  of silence. The 15 s heartbeat survives it, but one missed heartbeat drops the stream.
- **`Connection` header is not cleared** → under HTTP/1.1 proxying it should be `''` to keep the
  upstream connection alive.

Add a dedicated location **above** `location /api/` (nginx matches prefixes longest-first, but
be explicit):

```nginx
location /api/live/ {
    proxy_pass http://app:3000/live/;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

⚠️ Note the `proxy_pass` trailing-slash semantics: the existing block maps `/api/` → `/`, so
`/api/live/stream` currently arrives at the backend as `/live/stream`. Match that convention or
the route will 404 in Docker while working in local dev. **Test through nginx, not just against
`localhost:3000`.**

### ✅ RULED OUT — nginx gzip is not a problem

`gzip on` is set, but `gzip_proxied` is **not**, so nginx does not gzip proxied responses by
default, and `text/event-stream` is not in `gzip_types` regardless. This risk is closed.

### ✅ CHECKED — CSP will not block EventSource

The CSP is `Content-Security-Policy-Report-Only` (so it cannot block anything today) and
`connect-src` includes `'self'`. The stream is same-origin through the nginx proxy, so
`EventSource` is permitted. **If the API ever moves to its own origin, `connect-src` must be
updated** — and since the policy is Report-Only, that failure would be silent in production.

### ⚠️ STILL UNVERIFIED — the only genuine unknown

**Whether an AWS ALB / CloudFront sits in front of nginx, and its idle timeout.** That is
console-side and not visible in the repo. Dev is reached at `43.205.43.18.nip.io`, which suggests
a direct EC2 host rather than a load balancer, but that is inference, not verification. ALB idle
timeout defaults to 60 s; the 15 s heartbeat covers it. **Confirm before shipping to prod** and
report what you find.

### Acceptance test for A.6

Run through **nginx in Docker**, never against the Node port directly:
`curl -N -H 'Accept: text/event-stream' http://<host>/api/live/stream?ticket=...`
Expect the `hello` event within a second, `heartbeat` every 15 s, and the connection alive past
**5 minutes**. If the first event does not arrive but the connection stays open, that is
Blocker 1 — the compression filter is not applied.

**Acceptance for A.4–A.6:** open the app, leave it 10 minutes with a truck parked. Network tab
shows **one** `EventSource`, `heartbeat` every 15 s, `freshness` every 30 s, zero repeated XHRs
to `/api/livetracking/positions`. Then kill the backend: within 45 s the UI shows
"Live feed interrupted", **not** an empty green map.

## A.7 — Kill the cold calls (the "maps and routes call again" complaint)

The user's second transport complaint is separate from SSE and cheaper to fix: expensive
resources load even when nobody looks at them.

**A.7.1 — Google Maps JS must load once, on demand.**
`useLoadScript` is called per page (`LiveTrackingPage.jsx:50`, and in Overview, Geofence,
GeofenceZones, RouteCreator, GoogleMapsModal — 16 files use `@react-google-maps/api` per
`HANDOFF.md` §3 #11). Each mount risks another loader.

Create `frontend/src/lib/googleMaps.js` exporting a single `useGoogleMaps()` that wraps
`useLoadScript` with **one** fixed `libraries` array and a module-level guard, and returns
`{ isLoaded, loadError }`. Replace every direct `useLoadScript` call with it. A single shared
`libraries` array also fixes the "Loader must not be called again with different options"
warning that appears when two pages pass different arrays.

**A.7.2 — Maps must not mount until visible.**
Wrap every map in `frontend/src/components/ui/DeferUntilVisible.jsx` (new) — an
`IntersectionObserver` wrapper that renders a placeholder until the element is within 200 px of
the viewport, then mounts children. A dashboard with a mini-map below the fold must not load the
Maps SDK on page load.

**A.7.3 — Route geometry must never be re-requested.**
This is the expensive one and it is fixed structurally in Workstream E: persist the polyline once
at save time and serve it from our DB forever. Until E lands, add a client-side memo cache keyed
by `routeId` in `RouteService.jsx` so at least one session does not re-request the same path.

**A.7.4 — Audit unconditional fetches on mount.**
For each of the 59 pages, a tab or panel that is not the default tab must not fetch until
selected. Grep for `useEffect(() => { fetch...}, [])` inside components rendered behind a tab.
Convert to `useApi(..., deps, { enabled: isActiveTab })` — `useApi` already supports `enabled`
(`hooks/useApi.js:15`). This is a mechanical change and a large share of the "bohot calls" volume.

**Measurement gate:** before starting A.7, load the dashboard with a cold cache and record the
request count and total transferred bytes from the Network tab. After A.7, record again. Report
both numbers. If the count did not drop by at least half, A.7 is not done.

## A.8 — Retire the polling intervals

Once A.5 is live, remove `setInterval` from `LiveTrackingPage.jsx:73` and `OverviewPage.jsx`,
and delete `POLL_INTERVAL_MS` from `liveTracking.shared.js:21`.

**Leave alone:** `Sidebar.jsx`, `ContactPage.jsx`, `LoginPage.jsx` (UI timers, not data),
and all `Superadmin/components/lemu/*` intervals (a separate console with its own cadence).
`GeofencePage.jsx:  setInterval(fetchLiveLocations, 5000)` is a 5-second poll and is the single
worst offender — convert it to the stream in the same PR.

## A.9 — Freshness contracts per endpoint

Declare `contractSeconds` per feed in one place —
`backend/main-backend/app/config/freshness.js` (new):

| Feed | Contract | Why |
|---|---|---|
| live positions | 300 s | p99 gap is 9–12 min; 5 min flags a real problem without crying wolf |
| CAN insights | 5400 s | hourly sweep, ~30 min to complete |
| insight windows | 7200 s | rolling 24 h window, refreshed hourly |
| fuel ledger | 86400 s | daily |
| owner alerts | 3600 s | recompute cadence |

**Do not invent these per page.** One config, imported by every service that builds an envelope.

---

# WORKSTREAM B — UNGATING

**Goal:** the nine zero-caller prefixes (§1.3) become visible, filtered, and attributed.

Two rules govern all of B:

1. **Every new surface uses `<DataState>` from A.3.** No exceptions. An ungated screen that shows
   an empty table with no explanation is worse than no screen.
2. **Every number carries provenance.** `source` from the envelope renders as a hover on the
   figure. When two sources exist for one quantity, show both — never average (§0 rule 7).

## B.1 — Idling (the explicit ask, do this first)

Backend is ready: `GET /api/idling-reports` (list) and `/api/idling-reports/summary`, from
`app/modules/fleetGuardian/idlingReport.routes.js`, `authorize('OWNER','MANAGER')`.

Model fields available: `registrationNumber`, `windowFrom`, `windowTo`, `idleHours`,
`estimatedWasteInr`, `source` (`CAN_IDLING_MINUTES | DERIVED_ENGINE_HOURS`),
`litresPerIdleHourAssumed`, `computedAt`.

**Build:**
- `frontend/src/services/IdlingService.js` — `getIdlingReports(params, signal)`,
  `getIdlingSummary(params, signal)`
- `frontend/src/pages/Idling/IdlingPage.jsx` — table + summary strip + per-vehicle drill-in
- route `/idling`, sidebar entry under fleet with key `fleetIntelligence`
  (`utils/sideNavUtils.js`)

**The honesty requirement — non-negotiable.** `litresPerIdleHourAssumed` exists because
`litresPerIdleHour: 2` is an **assumed constant**, not a measurement (`HANDOFF.md` §9 #6). Any
row where it is non-null must render its ₹ figure with a distinct "estimated" treatment and a
tooltip naming the assumption. Rows sourced from `CAN_IDLING_MINUTES` are measured; rows from
`DERIVED_ENGINE_HOURS` are inferred — **the two must not look identical.** This is the whole
trust mechanic of the product in miniature.

## B.2 — CAN insights (`/api/fleet-insights`) — the largest stranded dataset

This is the FleetEdge CAN feed: `fuelConsumptionTodayL`, `distanceRunTodayKm`, `engineRunTodayH`,
`idlingDurationMin`, `defConsumedL`.

**Read `HANDOFF.md` §4 before writing a single line of this.** Three facts that will make you
wrong if you skip them:

1. **These are IST-day counters whose reset latches late, by up to ~6 h.** The absolute value at
   a day edge is meaningless. **Only deltas are usable**, and a delta belongs to the IST day of
   its *sample time*, not the counter's own label.
2. **`fleetedgeinsightfuels` is a rolling 24 h window, not a daily total.** `fuelUsedL` was
   observed running 98.4 → 92.8 → 81.1 → 75.0 across consecutive hourly pulls. A day accumulator
   cannot fall. Only the row whose window aligns with the IST day is usable.
3. **`defConsumedL` is unusable on more than half the fleet.** Five vehicles report exactly `0`
   (no SCR — a `0` means "no sensor", not "no burn"); two leak a lifetime counter
   (WB25R9540 frozen at 1901.5 L against 80.5 L of diesel = 2362%). Admit it only inside a
   1–10% band and label it estimated.

**Build:** `frontend/src/pages/VehicleInsights/` — per-vehicle daily strip showing distance,
fuel, engine hours, idle minutes, each with its source chip. **Render deltas, never raw counters.**
Where CAN and the insight window disagree, show both side by side with a "sources disagree" note
— that disagreement is a finding, not an error (`HANDOFF.md` §9 #2 residual spread is genuine
instrument disagreement).

## B.3 — Parking-zone proposals → one-click geofences

`GET /api/parking-zone-proposals` returns clusters the system discovered from position history.
Today a user must draw geofences by hand in `GeofenceZonesPage`.

**Build:** a "Suggested zones" panel on the geofence screen listing proposals with vehicle count,
total dwell hours and a map thumbnail, each with **Accept** (creates the zone) and **Dismiss**.

⚠️ `geofenceZone` is a **legacy protected module**. You may **call** its existing create endpoint.
You may **not** modify `geofenceZone.*`. If accepting a proposal needs a field the create
endpoint does not accept, stop and ask — do not extend the legacy module.

## B.4 — The remaining prefixes

| Prefix | Surface | Notes |
|---|---|---|
| `/api/notifications` | Bell in top bar + drawer | In-app only. **WhatsApp/external messaging belongs to another team** (`HANDOFF.md` §7) |
| `/api/insurance` | Tab on Vehicle 360 | Joins the compliance story (B.5) |
| `/api/mileage-report` | Section in Reports | `mileage` module is legacy-protected — read only |
| `/api/hotspots`, `/api/insights` | Read the services first, then propose | Do **not** guess a UI. Report what they return and ask |
| `/api/tyres` | **Skip** | Deliberately flag-gated, untracked WIP, never sweep into a commit |

## B.5 — The three orphaned data-layer methods

- `useComplianceRisk` → build **Document Expiry Wall** (`pages/Compliance/`): documents expired
  or expiring in N days with ₹ fine exposure, grouped by vehicle, sorted by days-to-expiry.
  `FRONTEND_MASTER_PLAN.md` calls this the fastest visible win and it is still unbuilt.
- `useTripPnl` → per-trip P&L panel on the trip detail screen.
- `getMaintenancePredictions` → "Service due" rail on Overview + full list, riskiest first.

---

# WORKSTREAM C — FILTERS, SORTING, SAVED VIEWS

**Goal:** every table in the product filters, sorts, paginates and exports the same way, with
state in the URL so a filtered view is a shareable link.

## C.1 — Generalise `useErpList` into `useListQuery`

Do **not** write a new hook. Copy `hooks/useErpList.js` to `hooks/useListQuery.js`, remove the
ERP-specific assumptions, keep everything else — the URL sync, the debounce, the abort of
superseded pages, the page-reset-on-filter-change at `:212-215`, and the deliberate exclusion of
`searchParams` from the effect deps at `:163` (there is a comment there explaining it fights
other writers; preserve both the behaviour and the comment).

Then re-export `useErpList` as a thin wrapper so the three existing ERP pages keep working
unchanged. **Do not migrate them in this PR.**

Add to `useListQuery` what fleet pages need and ERP did not:
- `facets` — server-returned counts per filter value, for chip labels ("Parked 12")
- multi-select values (`?state=ACTIVE,PARKED`), serialised comma-separated
- `preset` — a named saved view (C.3)

## C.2 — A standard filter bar and table

- `components/ui/FilterBar.jsx` — search, date range, multi-select chips, "clear all", and an
  active-filter count. One component, used everywhere.
- `components/ui/DataTable.jsx` — sortable headers (click cycles asc → desc → none), sticky
  header, column visibility menu, row density toggle, and a footer that reads
  **"Showing 24 of 151 · filtered by 2"** — the count must always name the total, so a filter can
  never masquerade as missing data.
- `components/ui/ExportButton.jsx` — CSV via the existing `utils/reportCsvExport.js`
  (`buildCsvString`, `triggerFileDownload` are already there and used by `FleetAlertsPage`).

**Sorting must be server-side wherever the list is paginated.** A client-side sort of page 1 of 8
is a lie — it sorts 25 rows and presents them as the top 25 of 200. If an endpoint cannot sort,
either add `sortBy`/`order` to it or disable sorting on that column with a tooltip explaining why.
**Never fake it.**

## C.3 — Saved views

New backend module `app/modules/savedView/` — `savedView.model.js`
(`{orgId, userId, page, name, params, isDefault}`), service, controller, routes at
`/api/saved-views`, mounted in `app.js`. Frontend: a dropdown in `FilterBar` — save current
filters, name them, set one as default per page.

This is small and disproportionately valuable: a fleet manager who looks at "my 3 problem trucks,
last 7 days" every morning currently rebuilds it every morning.

## C.4 — Rollout order

Vehicles → Drivers → Trips → FleetAlerts → FuelSpend → Idling → DefLedger → Maintenance →
Reports → Compliance. One PR per page, each ≤ ~300 lines. **Do not do all ten in one PR.**

---

# WORKSTREAM D — TELEMATICS COMPUTE

**Goal:** compute, persist and log speed, overspeed, idling and geo-context on the backend, from
signals already stored. The user's instruction is explicit: *"mostly do it from backend, needs to
be logged."*

Everything in D reads `LiveVehiclePositionHistory` (§1.6). **Before writing any estimator,
enumerate the stored signals for that quantity** (§0 rule 6). For speed there are three:
the `speed` field on each row; the distance/time derivative between rows; and CAN's
`distanceRunTodayKm`. They will disagree. That disagreement is the product, not a defect.

## D.1 — Module skeleton

Create `backend/main-backend/app/modules/motionAnalytics/`:

| File | Purpose |
|---|---|
| `geo.utils.js` | Pure geometry — haversine, bearing, douglas-peucker, polyline encode/decode |
| `speed.service.js` | Per-interval speed reconciliation |
| `overspeedEvent.model.js` | Persisted overspeed events |
| `overspeed.service.js` | Detection + hysteresis |
| `idleEvent.model.js` | Persisted idle events |
| `idle.service.js` | Detection from ignition + speed |
| `motionAnalytics.worker.js` | Idempotent recompute over a window |
| `motionAnalytics.routes.js` | Read endpoints |
| `*.test.js` | One per pure module |

Mount: `app.use('/api/motion', tenantGuard, motionAnalyticsRoutes);`

**Architecture stance — recompute, never events.** This is settled and must not be relitigated:
the worker is an **idempotent recompute over a time window**, not a pub/sub pipeline. Running it
twice over the same window produces identical rows. The decisive argument is FleetEdge's own
~4-hour alert lag, which is what an event-driven design bought them. Use a plain cron + a
`(orgId, registrationNumber, windowFrom, windowTo)` upsert key. BullMQ is fine for CRM work; it
is not for this.

## D.2 — `geo.utils.js` (pure, fully tested, no I/O)

```js
haversineMeters(a, b)                  // {lat,lng} → metres
bearingDegrees(a, b)                   // → 0..360
simplifyPath(points, toleranceMeters)  // Douglas–Peucker
encodePolyline(points), decodePolyline(str)   // Google precision-5
cumulativeDistanceMeters(points)       // → array, same length, running total
snapOutliers(points, maxSpeedKph)      // flag physically impossible jumps
```

Test with known fixtures: Kolkata→Delhi great-circle ≈ 1,305 km; a straight line simplifies to
2 points; encode(decode(x)) round-trips. **`snapOutliers` matters** — a single bad GPS fix
produces a 400 km/h interval that would otherwise generate a false overspeed event and destroy
trust in the whole feature on day one.

## D.3 — Speed reconciliation (`speed.service.js`)

```js
computeIntervalSpeeds({ points })
// → [{ from, to, seconds, meters,
//      derivedKph,      // meters/seconds — ground truth from position
//      reportedKph,     // the row's own `speed` field
//      agreement,       // 'AGREE' | 'DISAGREE' | 'ONLY_REPORTED' | 'ONLY_DERIVED'
//      quality }]       // 'HIGH' | 'LOW' — LOW when gap > 5 min or outlier-flagged
```

Rules, and they follow directly from `HANDOFF.md`:

- **Derived speed over ground is the primary signal.** The user asked for exactly this:
  *"speed calculation on the basis of distance on the route... calculate against actual ground
  covered."*
- Gaps > 5 minutes → `quality: 'LOW'`. A 40 km straight-line hop between two fixes is an average
  over unknown road, not a speed. **Never generate an overspeed event from a LOW-quality interval.**
- `agreement: 'DISAGREE'` when the two differ by > 15 kph. Persist it. Do not average.
- **Physics is free ground truth** (`HANDOFF.md` §3 rule 5): odometer = 0 ⇒ distance cannot
  change. Use it to reject bad intervals rather than tuning a constant.

## D.4 — Overspeed (`overspeed.service.js` + `overspeedEvent.model.js`)

> ⚠️ **SUPERSEDED — read `FRONTEND_UX_AUDIT_2026-09-06.md` §3 instead of this section.**
> The user rejected FleetEdge's `OverSpeedEvent` as a source: it fires on an instantaneous
> sample, so a one-second throttle blip logs as speeding and a genuine two-minute violation
> that ends just before the sample does not. Observed durations cluster at 59 s / 1 min /
> 1 min 50 s — a sampler artifact. Overspeed is computed **only** from ping-to-ping ground
> distance, with **both** the speed threshold **and** the duration threshold user-configurable,
> and events are **recomputed** rather than accumulated so a threshold change rewrites history
> consistently. The material below is retained only for the model shape and the hysteresis idea.

Model: `{orgId, vehicleId, registrationNumber, startAt, endAt, durationSeconds, maxKph, avgKph,
limitKph, limitSource, distanceMeters, startPoint, endPoint, path (encoded), quality,
computedAt}` — indexed `{orgId, registrationNumber, startAt}` and
unique on `{orgId, registrationNumber, startAt}`.

**The limit — `limitSource` is required.** In order of preference:
1. `VEHICLE_CONFIG` — per-vehicle limit on the vehicle master (add a nullable
   `speedLimitKph` field; ask before adding — `vehicles` is Tier A and mirrored by whole-document
   `replaceOne`, so a new local field **must** be added to `TIER_C_EXCLUDED` in
   `sync/lib/config.js` or the mirror will silently clobber it. That list currently has **26**
   entries and `SyncTailer.test.js` pins its length — update both.)
2. `ORG_DEFAULT` — org setting, default 60 kph for HCV on Indian highways
3. `ROAD_INFERRED` — only if a road-network source is added later. Not in v1.

**Do not ship a hard-coded 80.** An unattributed limit produces unexplainable alerts.

**Hysteresis, or the feature is unusable.** Enter an event only after speed exceeds
`limit + 5 kph` for ≥ 60 continuous seconds. Exit only after it drops below `limit` for ≥ 60 s.
Without this a truck oscillating around the limit generates hundreds of events per trip.
Minimum event duration 60 s; discard anything shorter.

**Backfill:** `scripts/backfill-overspeed.js`, windowed by day, idempotent, resumable, with a
`--dry-run` that prints counts only. Per §0 rule 3, it writes new rows and deletes nothing.

## D.5 — Idling (`idle.service.js` + `idleEvent.model.js`)

An idle interval is `ignition === true && derivedKph < 2` sustained ≥ 5 minutes.

Model: `{orgId, vehicleId, registrationNumber, startAt, endAt, durationMinutes, point,
nearestSiteId, nearestSiteType, fuelBurnedL, fuelBurnSource, estimatedWasteInr, computedAt}`.

**Reconcile against the two existing idling signals — do not replace them.** CAN's
`idlingDurationMin` and `fleetGuardian`'s `idleHours` already exist (§1.3, B.1). This service
adds *where and when*, which neither has. The existing daily totals stay authoritative for
totals; the new events explain them. If your per-event sum disagrees with the CAN daily figure,
**surface both** — that is a finding.

`fuelBurnSource` must be `'CAN_DELTA'` when CAN burn is available for the window and
`'ASSUMED_RATE'` when falling back to `litresPerIdleHour`. The assumed rate must never be
presented as measured (§B.1).

## D.6 — Geomapping / geo-context

Give every event a place, not just a coordinate.

`geoContext.service.js`:
```js
resolvePoint({ lat, lng, orgId })
// → { siteId, siteType, geofenceId, geofenceName, distanceToSiteMeters, source }
```

Resolve against **existing** `SiteCluster` (`app/modules/routeIntelligence/siteCluster.model.js`)
and geofence zones first — those are ours and free. **Reverse-geocoding to a street address is a
paid call**; do it lazily, only for events a user actually opens, and **cache the result on the
event row** so it is paid for once. Never reverse-geocode in a loop over a backfill.

Add a `2dsphere` index on the event models' `point` field so "events near here" is a query, not
a scan.

## D.7 — Predictive ETA (`eta.service.js`)

Greenfield (§1.8). Keep v1 honest and simple.

```js
predictEta({ orgId, registrationNumber, destination, asOf })
// → { etaAt, confidence: 'HIGH'|'MEDIUM'|'LOW',
//     basis: 'ROUTE_HISTORY'|'CORRIDOR_MEDIAN'|'STRAIGHT_LINE',
//     remainingKm, assumedKph, sampleSize, low, high }
```

Progression, best first:
1. **`ROUTE_HISTORY`** — median historical duration for this vehicle on this route, from
   completed trips. Requires `sampleSize >= 5`. Best predictor and it costs nothing.
2. **`CORRIDOR_MEDIAN`** — median speed on this corridor across the fleet
   (`routeIntelligence` already computes corridors).
3. **`STRAIGHT_LINE`** — remaining distance ÷ trailing-24 h median speed. Always `LOW`.

**Always return a band (`low`, `high`), never a bare time**, and always return `sampleSize`.
An ETA from 3 trips and one from 200 must not look identical. **Do not build an ML model.**
A median with a stated sample size is defensible; a regression on n=12 is not.

Rest hours are the dominant error term on Indian long-haul: a Kolkata→Delhi run is ~30 driving
hours but ~48 elapsed. If historical durations are used end-to-end this is captured for free —
which is the main argument for preferring option 1 over a speed-based estimate.

## D.8 — Read endpoints

```
GET /api/motion/overspeed?from&to&registrationNumber&minDurationSeconds  → envelope
GET /api/motion/idle?from&to&registrationNumber                          → envelope
GET /api/motion/speed-profile/:registrationNumber?from&to                → envelope (for the replay chart)
GET /api/motion/eta/:registrationNumber?destinationLat&destinationLng    → envelope
```

All four return the A.1 envelope. All four support the C.1 filter params.

---

# WORKSTREAM E — ROUTES: PERSIST GEOMETRY, REPLAY, 3-D TRUCK

**Goal:** saved routes draw instantly from our own database; completed trips replay on a map with
an animated truck; Google Directions is called **once per route, ever**.

This workstream directly answers three of the user's items: *"routes are saved but not displayed"*,
*"routes are to be animated with 3d models of trucks... a playable route and saved"*, and
*"that route is not displayed even though geometric points are marked"*.

## E.1 — Persist route geometry (the structural fix)

Root cause is §1.4: the polyline is fetched, one number is taken, the rest is discarded.

### E.1.1 — Backend, the single sanctioned legacy edit

Add to `app/modules/route/route.model.js` — **additive and nullable only**:

```js
geometry: {
  encodedPolyline: { type: String, default: null },   // Google precision-5
  bounds: {                                            // for instant fitBounds
    north: { type: Number, default: null },
    south: { type: Number, default: null },
    east:  { type: Number, default: null },
    west:  { type: Number, default: null },
  },
  pointCount:  { type: Number, default: null },
  provider:    { type: String, enum: ['GOOGLE_DIRECTIONS', 'MANUAL', 'DERIVED_FROM_TRACK'], default: null },
  fetchedAt:   { type: Date,   default: null },
  distanceMeters: { type: Number, default: null },     // provider's own distance
},
```

**Nothing else in the `route` module changes.** No service logic, no controller, no response
reshaping, no index changes. Every existing route row keeps working with `geometry: null` — which
is a legitimate state meaning "saved before geometry was captured", not an error. Render those
rows with a "Path not captured — open to fetch" affordance.

### E.1.2 — Frontend, stop discarding the polyline

`components/RouteCreator/RouteCreator.jsx`, in the `DirectionsService` callback at `:391-403`.
Today:

```js
const distanceMeters = results.routes[0].legs[0].distance.value;
const distanceKm = (distanceMeters / 1000).toFixed(1);
handleDistanceChange(distanceKm);
```

Add — do not remove the distance handling:

```js
const r = results.routes[0];
const b = r.bounds;
setRouteGeometry({
  encodedPolyline: r.overview_polyline,          // string, precision-5
  bounds: { north: b.getNorthEast().lat(), east: b.getNorthEast().lng(),
            south: b.getSouthWest().lat(), west: b.getSouthWest().lng() },
  pointCount: r.overview_path?.length ?? null,
  provider: 'GOOGLE_DIRECTIONS',
  fetchedAt: new Date().toISOString(),
  distanceMeters,
});
```

⚠️ **Field-name trap.** Depending on how the result is obtained, the encoded string is at
`r.overview_polyline` (raw REST / some SDK paths) or `r.overview_polyline.points` (older typings),
while `r.overview_path` is an **array of `LatLng` objects**, not a string. Log the actual shape
once and handle it explicitly. If you only have `overview_path`, encode it with
`geo.utils.encodePolyline` (D.2) rather than storing a JSON array — the encoded form is roughly
an order of magnitude smaller.

Then include `geometry` in the create/update payload from `RouteFormModal.jsx` and
`AddRoutePage.jsx`, and add it to the route validator so it is accepted rather than stripped.

### E.1.3 — Backfill existing routes, cheaply

`scripts/backfill-route-geometry.js`. **Do not bulk-call Google** — that is a paid request per
route and the user's explicit cost concern.

Order of preference per route:
1. **Derive from our own history.** If ≥ 3 completed trips ran this route, take the
   `LiveVehiclePositionHistory` track of the median-duration trip, simplify it
   (`simplifyPath`, 25 m tolerance), encode it, store with `provider: 'DERIVED_FROM_TRACK'`.
   **Free, and more truthful than Google** — it is the road the trucks actually take.
2. Leave `null`. Fetch lazily from Google the first time a user opens that route, then persist.

Flags: `--dry-run` (counts only), `--limit N`, `--org <id>`. Print a summary of how many were
derived, how many left null, and the estimated Google calls avoided.

**This is the highest-leverage item in Workstream E.** It converts a per-view paid API call into
a one-time free derivation, and it makes the map show the real road rather than Google's idea of it.

## E.2 — Draw routes

- `components/map/RoutePolyline.jsx` — decodes and renders, with `bounds` for an instant fit.
  No Directions call, ever.
- `pages/Routes/RoutesPage.jsx` — add a map panel beside the existing list (do **not** delete the
  list; it is used for management). Hovering a row highlights its path; clicking opens detail.
- `pages/Routes/RouteDetailPage.jsx` (new) — the path, source/destination markers, `viaStates`,
  `googleKm` vs `totalKm` vs **actual median km driven** (from trip history). That three-way
  comparison is itself a product feature: it shows which routes systematically run longer than
  billed, which is a real money leak.

## E.3 — Trip replay

The core new surface. `pages/TripReplay/TripReplayPage.jsx`, route `/trips/:tripId/replay`.

### E.3.1 — Backend endpoint

```
GET /api/motion/replay/:registrationNumber?from&to&maxPoints=2000
```
in `motionAnalytics.routes.js` (D.1). Returns one envelope:

```json
{ "status": "OK",
  "data": {
    "track":   { "encodedPolyline": "...", "pointCount": 1840, "bounds": {...} },
    "samples": [ { "t": "ISO", "lat": 0, "lng": 0, "kph": 0, "heading": 0, "ignition": true } ],
    "events":  { "overspeed": [...], "idle": [...], "stops": [...], "fuel": [...] },
    "summary": { "distanceKm": 0, "durationH": 0, "movingH": 0, "idleH": 0,
                 "avgKph": 0, "maxKph": 0, "overspeedCount": 0 }
  },
  "freshness": {...}, "coverage": { "expected": 1840, "actual": 1836 } }
```

**Downsample server-side** with `simplifyPath` when the window exceeds `maxPoints`. A week-long
window can be 20,000 rows; sending them all is the kind of payload that makes the product feel
broken on a manager's phone. Report the real `pointCount` in `coverage` so the UI can say
"showing 2,000 of 18,400 points".

### E.3.2 — The player

`components/replay/ReplayPlayer.jsx` with:
- transport controls: play / pause / 1× 2× 4× 8× / step / scrub
- a timeline with event markers (overspeed red, idle amber, stops grey, refuel blue) — clicking a
  marker seeks to it
- a **speed graph synced to the scrubber** (`components/replay/SpeedTrack.jsx`), so the user sees
  the speed profile and the map position together. This is what makes an overspeed event
  self-explanatory rather than an accusation.
- interpolation between samples so motion is smooth at 60 fps even with 1-minute sampling:
  position by linear interpolation, **heading by shortest-arc angular interpolation** (naive
  interpolation from 350° to 10° spins the truck 340° the wrong way — handle the wrap).

Drive it with `requestAnimationFrame` off a single clock. **Do not use `setInterval` for
animation** — it drifts and it is the pattern this plan is removing everywhere else.

### E.3.3 — The 3-D truck

> ✅ **DECIDED BY THE USER 2026-09-06: BUILD THE 3-D TRUCK.** An earlier draft of this section
> recommended deferring it; that recommendation is withdrawn. Build it, to the spec below.
> Full constraints also in `FRONTEND_UX_AUDIT_2026-09-06.md` §6.

**Build both, in this order:** the 2-D directional marker first because it is the mandatory
fallback, then the 3-D model on top of it. The 2-D marker is not a substitute for 3-D — it is
what renders when WebGL is unavailable and at high vehicle counts.

**Step 1 — `components/map/VehicleMarker.jsx` (the fallback, build first):** an SVG truck glyph
rotated by `courseDegrees` (already in the data, §1.6), colour-coded by state, with a motion
trail. ~2 KB. This is what low-end Android and 150-vehicle views get.

**Step 2 — `components/map/Vehicle3DLayer.jsx` (the real thing):**
- **Renderer: `@vis.gl/react-google-maps` + `deck.gl` `ScenegraphLayer`.** Not raw three.js —
  deck.gl composites with the map's own camera; a hand-rolled three.js overlay desynchronises
  on tilt and zoom.
- **Lazy route-level chunk** (`React.lazy` on the whole replay view). This is the one hard
  constraint: the repo removed `react-force-graph` and `three.js` in commit `1cb13ee`
  (*"~1.64 MB of chunks"*). The main entry chunk is now **582,367 B raw / 165,913 B gzip**
  (measured on this branch 2026-09-06, guard 600,000 B), so a lazy chunk costs the entry bundle
  nothing — but an eager import would blow the guard immediately.
  Putting 3-D in a **lazy** chunk keeps that win; putting it in the **main** chunk destroys it.
  Workstream G exists to shrink that bundle — do not fight it.
- **Model budget:** one GLTF, draco-compressed, ≤ 150 KB, single mesh, baked texture, ~2k tris.
  A truck at 40 px needs a silhouette, not a drivetrain.
- **Heading from `courseDegrees`, interpolated by shortest arc.** Naive interpolation from 350°
  to 10° spins the truck 340° the wrong way.
- **Automatic 2-D fallback** when WebGL is absent or the device is low-end. Detect, don't assume.
- **LOD:** 3-D for the focused vehicle in replay and for ≤ 20 vehicles on the live map; 2-D
  beyond that. 150 3-D trucks will not hold frame rate and would not be legible anyway.
- **Report the lazy chunk's measured gzip size** when it lands.

## E.4 — Route deviation, visually

`/api/route-deviation/events` is already wired to a frontend page. Upgrade it: instead of a table
row saying a deviation happened, show the **planned polyline and the actual track overlaid**, with
the divergence highlighted and the extra kilometres and their fuel cost stated. The data for both
sides now exists (planned from E.1, actual from `LiveVehiclePositionHistory`).

This is the single most persuasive screen in the product for a fleet owner, and after E.1 it is
nearly free to build.

---

# WORKSTREAM F — DRIVER APP, RECONCILIATION, MANAGER APP

**Goal:** driver location survives backgrounding and offline stretches; a trip can be reconciled
between vehicle track and driver track; managers get a real app.

## F.1 — Driver location history (backend)

New module `app/modules/driverLocation/driverLocationHistory.model.js` — mirroring
`LiveVehiclePositionHistory` in shape and discipline:

```js
{ orgId, driverId, tripId (nullable), latitude, longitude,
  accuracyMeters, speedMps, headingDegrees, altitude,
  recordedAt,          // device clock, when the fix was taken
  receivedAt,          // server clock, when it arrived — these differ under offline replay
  batteryLevel, isMoving, source: 'FOREGROUND'|'BACKGROUND'|'MANUAL',
  appVersion }
```

Indexes: `{orgId, driverId, recordedAt}` unique · `{orgId, tripId, recordedAt}` ·
`2dsphere` on a derived `location` field.

**`recordedAt` vs `receivedAt` is not optional.** An offline queue replays a two-hour-old batch;
if you only keep one timestamp you cannot tell a stale queue from a live one, and you will have
rebuilt the §1.2 bug in a new place.

**Do not change `driverLocation.model.js`.** The existing single-row "current location" stays as
the fast read path. History is a new, additive collection. **No TTL** (§0 rule 3).

New endpoint in `driverLocation.routes.js`:
```
POST /api/driver/location/batch    // accepts an array of fixes, idempotent
```
Idempotency via the unique `{orgId, driverId, recordedAt}` index and `bulkWrite` upserts —
a retried batch must not duplicate rows. This mirrors the fix already applied to the CAN pull
(`HANDOFF.md` §9 #4), where a blind `insertMany` against a frozen sensor produced 64 identical
rows. **Use `bulkWrite` with upserts, not `insertMany`.**

Cap batch size at 500 fixes; reject larger with a clear message.

## F.2 — Driver app: background tracking + offline queue

`app/DriverApp/frontend/`. Current state is §1.7: foreground-only, 2-minute `setInterval`,
no queue.

### F.2.1 — Background location

Add `expo-task-manager`. Create `src/services/backgroundLocation.js`:

```js
TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => { /* enqueue, never POST here */ });

await Location.startLocationUpdatesAsync(LOCATION_TASK, {
  accuracy: Location.Accuracy.Balanced,     // ~100 m; High destroys battery
  timeInterval: 60_000,
  distanceInterval: 100,                    // metres — the real throttle
  deferredUpdatesInterval: 300_000,         // batch on iOS
  pausesUpdatesAutomatically: true,
  foregroundService: {                      // Android 10+ requires this
    notificationTitle: 'GNB is recording your trip',
    notificationBody: 'Location is shared with your fleet manager while on duty.',
  },
});
```

**Requirements that are easy to miss and will fail review:**
- `ACCESS_BACKGROUND_LOCATION` must be requested **separately and after** foreground permission
  is granted. Requesting both at once fails on Android 11+.
- The permission prompt must be preceded by an in-app screen explaining why, in the driver's
  language. `src/i18n/` exists — use it. Play Store rejects background location without a clear
  disclosure, and this is a common cause of a rejected build.
- Tracking starts **on duty / trip start** and stops on trip end. Not 24/7. This is both a
  privacy position and a battery one, and it is the honest answer when a driver asks.
- The task handler must **only enqueue**. Network calls inside a background task are killed
  mid-flight and produce exactly the half-written state that is hardest to debug.

### F.2.2 — The offline queue

`src/services/locationQueue.js`, backed by AsyncStorage (already a dependency):

```js
enqueue(fix)         // append, cap at 5000, drop oldest beyond (log the drop count)
drain(token)         // batches of 100 → POST /api/driver/location/batch
peek(), size(), clear()
```

Flush triggers: connectivity regained, app foregrounded, trip end, and every 5 minutes while
tracking. Exponential backoff on failure. **Never drop a batch on a 5xx** — only on a 4xx that
indicates the payload is permanently unacceptable, and log that loudly.

This also closes the **offline queue** item already scoped in the DriverApp pending-features list,
and the same queue should later carry fuel-log submissions.

### F.2.3 — Retire the old tracker

`src/services/locationTracker.js` becomes a thin foreground fallback for devices that deny
background permission. Keep the interface (`startLocationTracking`, `stopLocationTracking`,
`isTracking`) so `HomeScreen.js:10` does not change.

## F.3 — Trip reconciliation

New backend module `app/modules/tripReconciliation/`.

```js
reconcileTrip({ tripId })
// → { tripId, verdict, confidence, driverTrackPoints, vehicleTrackPoints,
//     overlapPercent, medianSeparationMeters, maxSeparationMeters,
//     divergenceWindows: [{from,to,meters,note}], notes: [] }
```

`verdict`: `'CONFIRMED' | 'PARTIAL' | 'DIVERGENT' | 'INSUFFICIENT_DATA'`.

Method — and note it is a comparison of two independent signals, exactly the cross-validation
the user asks for:
1. Load vehicle track from `LiveVehiclePositionHistory` for the trip window.
2. Load driver track from `DriverLocationHistory` for the same window.
3. **Time-match before comparing** (`HANDOFF.md` §3 rule 10 — a cross-check without time-matching
   produced a fully false "584 of 762 rows conflict" finding). Resample both to a common 5-minute
   grid; compare only grid points where **both** have a fix within ±2.5 min.
4. `overlapPercent` = matched grid points within 500 m ÷ total comparable grid points.
5. `INSUFFICIENT_DATA` when fewer than 10 comparable points. **This is a first-class verdict, not
   a failure** — most trips will return it until F.2 ships, and that must be visible rather than
   rendered as a divergence.

**Never auto-penalise on a divergence.** Surface it with the evidence and let a manager decide —
the same stance as the standing rule that bill→driver matching never auto-binds. A phone left in
the cabin, a dead battery and a driver who swapped trucks are all indistinguishable from telemetry
alone.

Endpoints:
```
GET  /api/trip-reconciliation/:tripId
POST /api/trip-reconciliation/:tripId/recompute
GET  /api/trip-reconciliation?verdict=DIVERGENT&from&to
```

Worker: `tripReconciliation.worker.js`, idempotent recompute on trip close and nightly for open
trips (same stance as D.1).

## F.4 — The manager app

**Recommendation: a role mode inside the existing Expo app, not a second codebase.**

The app already has `AuthContext` reading `role` (`src/context/AuthContext.js:47,88`) and the
backend already has a 4-role RBAC (`SUPER_ADMIN`, `OWNER`, `MANAGER`, `DRIVER`). A second Expo
project doubles the release, signing, Sentry and dependency-upgrade burden for a team of ~5.
Two navigators in one binary is the cheaper correct answer, and it is reversible later.

`src/navigation/` gains a role switch: `DRIVER` → the existing tabs; `MANAGER`/`OWNER` → a new
manager stack.

Manager screens (v1 — deliberately narrow):

| Screen | Content | Backing endpoint |
|---|---|---|
| Fleet Now | Live vehicle list + mini map, state + freshness chip | SSE stream (A.4) |
| Alerts | Owner alerts, ack inline | `/api/owner-alerts`, `/:id/ack` |
| Approvals | ERP approvals queue | `/api/erp/approvals` |
| Trip Detail | Status, telematics, reconciliation verdict | `/api/erp/trips/:id`, F.3 |
| Fuel Review | OCR-failed fuel logs needing correction | existing fuel-log endpoints |
| Vehicle 360 | Health, docs, service due | `/api/vehicle-profile/:reg` |

**Fuel Review closes the "manager correction UI" gap already on the pending-features list** — when
OCR fails on a blurry photo, someone must fill in litres/rate/odometer. Today nobody can.

### F.4.1 — Push notifications

Add `expo-notifications`; register the Expo push token per device on login
(`POST /api/notifications/devices`). Backend gains a `pushToken` collection and a sender in the
existing `notifications` module.

**Scope discipline:** push carries **alerts, approvals and SOS only**. Not marketing, not digests.
And per the standing rule, **WhatsApp and external messaging belong to another team** — emit
in-app and push notifications only, and do not build a WhatsApp path here however tempting.

### F.4.2 — SOS

`SOSOptionsScreen` and `SOSEmergencyActiveScreen` already exist as screens and are wired to
nothing. Wire them: long-press → `POST /api/sos` with current location → creates an owner alert →
push to every `MANAGER`/`OWNER` in the org → manager screen shows the live location until resolved.

This is a small piece of work with an outsized safety story, and the screens are already built.

---

# WORKSTREAM G — OPTIMISATION

Do this **after** A–F, because optimising code that is about to be rewritten is waste.

## G.0 — Baseline (MEASURED on this branch 2026-09-06 — read before planning any bundle work)

```
main entry chunk   index-DiLIQ5A0.js   582,367 B raw / 165,913 B gzip
CI guard           600,000 B                    (passing)
total JS chunks    263
total raw (all)    3,935,295 B
React.lazy calls   92, in src/App.jsx
```

**This is a 7.6× improvement over `staging` (4,417,755 B raw / 1,102,669 B gzip).** Commit
`38cf488` ("dep purge, component splits") already did the route-level code splitting. **The main
bundle is no longer the problem, and most of the bundle work an earlier draft of this section
called for is already finished. Do not redo it.**

Ten largest chunks, for targeting:

| Bytes | Chunk | Note |
|---|---|---|
| 582,367 | `index` | main entry — already under guard |
| 424,608 | `xlsx` | **already split out.** Keep it dynamically `import()`ed — Workstream 0.4 puts export on all 59 pages and must not pull this into the entry chunk |
| 317,220 | `index.es` | vendor — identify it before touching |
| 281,274 | `CartesianChart` | recharts; already lazy |
| 167,218 | `LandingPage` | own chunk; fine |

Every optimisation still reports a measured before and after — an optimisation without a measured
delta is not done (`HANDOFF.md` §3 rule 13). But **measure that the thing is broken before naming
the fix**: on this branch, it largely is not.

## G.1 — Backend queries

1. **Index audit.** For every query added in D, E and F, run `.explain('executionStats')` and
   confirm `IXSCAN`, not `COLLSCAN`. Any `COLLSCAN` over a telemetry collection is a bug — those
   collections only grow.
2. **Projection discipline.** `LiveVehiclePositionHistory` rows are wide. A replay needs
   `latitude longitude speed courseDegrees ignition eventDateTime` — six fields. Project them.
   Never `find()` a telemetry collection without a projection.
3. **`.lean()` on every read path.** Hydrating Mongoose documents for read-only aggregation is
   pure overhead. ⚠️ **`Query.forEach` does not exist in Mongoose 8** — use `.lean()` or
   `.cursor().eachAsync()`.
4. **Aggregate in Mongo, not Node.** Daily rollups, per-vehicle sums and percentile work belong in
   `$group`/`$bucket`, not in a JS loop over 20,000 rows.
5. **Cap unbounded ranges.** Every telemetry endpoint takes `from`/`to` and must reject windows
   beyond a documented maximum (90 days) with a clear message rather than attempting it.
6. **Group by the FULL upsert key including `orgId`** when checking duplicates — a recurring trap.

## G.2 — Frontend bundle

> ⚠️ **The main chunk is NOT the problem on this branch — see G.0.** An earlier draft of this
> section assumed the `staging` bundle. Route-level splitting is **already done**: 92 `React.lazy`
> calls in `App.jsx`, 263 chunks, entry at 582 KB raw / 166 KB gzip under a 600 KB guard.
> **Items 1–3 below are complete. Do not redo them.** What remains is small and defensive.

~~1. Route-level code splitting~~ — **DONE** (92 `React.lazy` in `App.jsx`).
~~2. Split by module gate~~ — **effectively achieved** by per-route splitting; verify an ERP-only
login does not pull fleet chunks, and stop there.
~~3. Lazy-load heavy leaves~~ — **DONE** for charts (`CartesianChart` is its own chunk) and
`xlsx`. Still to do: maps (A.7.2) and, when built, the replay player and 3-D layer (E.3.3).

**What actually remains:**

4. **Keep `xlsx` (424 KB) out of the entry chunk.** Workstream 0.4 adds export to all 59 pages;
   it must be a dynamic `import('xlsx')` inside the export handler, never a top-level import.
   This is the single most likely regression in the whole plan — one careless import moves
   424 KB into the entry bundle and breaks the CI guard.
5. **Identify `index.es` (317 KB)** before touching it. Name it in your report.
6. **Audit for wholesale imports** — `lucide-react` must be per-icon; check for moment/lodash.
7. **Keep the byte guard and ratchet it down.** It currently prints
   `bundle ok: index-*.js 582367 B <= 600000 B`. As chunks shrink, lower the threshold so the win
   cannot be quietly given back.

## G.3 — Frontend runtime

- Virtualise any table that can exceed ~200 rows.
- Memoise expensive derivations; `useMemo` the polyline decode, not the render.
- The replay player must not re-render the whole map per frame — animate the marker only.
- Fix the remaining `react-hooks/exhaustive-deps` warnings rather than suppressing them.

## G.4 — Lint signal

**Measured on this branch 2026-09-06: 472 files, 0 errors, 952 warnings.**
`react-hooks/rules-of-hooks` is at **zero** — the white-screen crash risk found on `staging`
(`EditRowModal.jsx`, `JourneySetupModal.jsx`) is **closed here**. The vitest-globals override is
in `eslint.config.js` (the `**/*.test.{js,jsx}` block), so test files no longer inflate the count.
Commit `38cf488` did this work. **Nothing to fix; keep it at zero.**

⚠️ **Environment note for the implementing agent:** after checking out this branch you must run
`npm install` in `frontend/`. The branch declares `eslint-plugin-react` and `eslint-plugin-jsx-a11y`
in `package.json` but a `node_modules` carried over from `staging` will not have them, and eslint
fails with `ERR_MODULE_NOT_FOUND` — which looks like a broken config and is not.

Warning profile, for prioritisation:

| Count | Rule |
|---|---|
| 530 | `jsx-a11y/control-has-associated-label` |
| 243 | `jsx-a11y/label-has-associated-control` |
| 53 | `jsx-a11y/click-events-have-key-events` |
| 45 | `jsx-a11y/no-static-element-interactions` |
| 35 | `react/no-unescaped-entities` |
| 19 | `react-hooks/exhaustive-deps` |

~870 of 952 warnings are accessibility. **Do not bulk-suppress them.** They are also a keyboard
-navigation deficiency, and a fleet manager working a list all day is a keyboard user. Fix them
per page as part of Workstream C's page-by-page rollout — each page's a11y warnings go to zero in
the same PR that gives it filters. That converts an undifferentiated backlog of 870 into ~15 small
pieces of work with a natural home.

The 19 `exhaustive-deps` warnings are the only ones that can hide a real bug; triage those first.

---

# WORKSTREAM H — REDESIGN (LAST)

**Do not start H until A–G are merged.** The user was explicit: *"keep them for the last"*.

## H.1 — Token system

> ⚠️ **SUPERSEDED — use `DESIGN_SYSTEM_AND_AI_PROMPTS_2026-09-06.md` §3.1 instead.**
> That document is the single source of truth for colour, type and spacing. It differs from the
> block below in two ways that matter: the app ground is a warm off-white `#FAFAF9` with cards
> in `#FFFFFF` sitting *on* it (this block had a white ground and grey cards, which is flatter
> and harsher), and the token names are shorter (`--bg`, `--surface`, `--brand`, `--ok/warn/bad`).
> **Do not implement the names below.** They are retained only to show the raw palette the user
> supplied.

```css
--color-primary-main:  #EE6126;   /* orange */
--color-primary-light: #FF8B2C;
--color-primary-deep:  #F2754A;

--color-success: #4CAF50;
--color-alert:   #F44336;
--color-info:    #1E88E5;
--color-erp:     #1E3A8A;   /* the ERP blue from the second board */

--color-bg-main:    #FFFFFF;
--color-bg-surface: #F5F5F5;
--color-border:     #E6E6E6;
--color-disabled:   #CCCCCC;

--text-heading:   #1A1A1A;
--text-body:      #333333;
--text-secondary: #666666;
--text-muted:     #999999;

--radius-default: 8px;  --radius-medium: 12px;  --radius-large: 16px;
```

Note the two boards differ: the second is a brighter orange and a deeper blue (`#1E3A8A` vs
`#1E88E5`). **Treat board 2 as authoritative** and keep `#1E88E5` as the informational blue,
distinct from the ERP identity blue.

Type scale: H1 32/Bold, H2 24/SemiBold, H3 20/SemiBold, Body-L 16, Body 14, Caption 12.

Wire these through `utils/colorTheme.js` `applyThemeToRoot()` (§1.10) — it already writes every
token to `:root`. **Do not introduce a second theming mechanism.**

## H.2 — Status colour is not brand colour

A fleet product's most important rule. Orange is the brand; orange must **never** mean "warning"
in a data context. Status uses only green / amber / red / grey, and those four are reserved —
never decorative. A KPI card border, a chart series and a brand accent must not be the same
orange as a state chip. Get this wrong and every screen becomes ambiguous.

## H.3 — The ERP orange → blue sidebar transition

The mechanism already exists (§1.10) and this is a small, contained piece of work.

Implement in `components/Sidebar.jsx` + `utils/colorTheme.js`:

1. Derive the active product from the route: `/erp/*` → `erp`, everything else → `fleet`.
   `sideNavUtils.js` already carries an `access: 'erp' | 'fleet' | 'both'` per item.
2. Define two token sets, `--sidebar-grad-from` / `--sidebar-grad-to`:
   fleet `#EE6126 → #F2754A`, ERP `#1E3A8A → #1E88E5`.
3. Animate the **gradient stops**, not `background-image`. CSS cannot interpolate two
   `linear-gradient()` values. Two workable approaches:
   - **Recommended:** register the stops with `@property` so they are animatable custom
     properties, then transition them:
     ```css
     @property --sidebar-grad-from { syntax: '<color>'; inherits: true; initial-value: #EE6126; }
     ```
     Chromium and Safari support this; **Firefox does not animate registered properties in all
     versions** — see the fallback below.
   - **Fallback (works everywhere):** two stacked absolutely-positioned gradient layers, and
     cross-fade their `opacity`. Cheap, GPU-composited, no `@property` dependency.
     If you want one implementation rather than two, ship this one.
4. Duration **300–400 ms**, easing `cubic-bezier(0.4, 0, 0.2, 1)`. Longer reads as sluggish on
   every navigation.
5. **Respect `prefers-reduced-motion: reduce`** — switch instantly, no transition.
6. Contrast: verify the active-item and logout text hit **WCAG AA (4.5:1)** against *both*
   gradients. The deep blue and the orange have very different luminance and one set of text
   colours will not satisfy both.

**Scope guard:** this changes the sidebar's own colour only. It must not restyle page content,
and the ERP/fleet switch must not alter status colours (H.2).

## H.4 — Layout principles

From the user's own critique of the reference designs — *"subtlety is important... like a black
tie event, you can wear a bow tie, still wearing the suit"*, *"too much on the screen,
distraction"*, *"as a landing page maybe but not as a dashboard"*, and the requirement that it
read as an **HCV management platform**, not a freight/shipment marketplace:

1. **One primary answer per screen.** The largest element answers the question the screen exists
   to answer. Everything else supports it.
2. **Density with air.** Fleet managers scan many rows. Compact rows, generous section spacing —
   not a wall, not a poster.
3. **Motion only to explain.** A truck moving along a replay path explains something. A number
   counting up does not. The reference designs the user rejected were rejected for exactly this.
4. **Glassmorphism used sparingly**, and only for overlays that sit above content — the drawer
   scrim, a popover, a map control panel. Never for a data card: translucency over a moving map
   destroys number legibility, which is the opposite of the goal.
5. **The FleetEdge lesson, stated as a rule:** every primary action reachable in ≤ 2 clicks from
   the dashboard, and every screen legible to someone who has never been trained on it. The user's
   complaint about FleetEdge is that *"the users it's built for can't use it"*. Any screen that
   needs explaining has failed.
6. **Indian formatting throughout** — ₹ with lakh/crore grouping (`1,23,456` not `123,456`),
   IST everywhere with the zone stated, DD MMM YYYY. `utils/formatMoney.js` exists; extend it.

## H.5 — The FMS accent

The user wants it to feel like fleet software without the theme driving the UI —
*"the accent of the fact that this is a hcv management software should be there"*, but
*"theme shouldn't control the functionality"*. Concretely, that means the accent lives in:

- the **truck glyph** as a recurring identity mark (marker, empty states, loading)
- an **instrument-cluster treatment for the single hero metric** on Overview — one gauge, not six
- **road/lane motifs as texture at low contrast**, never as a container for data
- **status as physical state**: moving / parked / offline / no-signal, in that vocabulary, rather
  than abstract severity words

What it must **not** mean: skeuomorphic dashboards, dark "cockpit" chrome everywhere, or animated
speedometers on a list screen.

---

# §3 — CAPABILITY BACKLOG (data/feature layer)

> ⚠️ **Read this correctly.** The user reviewed this list on 2026-09-06 and rejected it *as a
> statement of additions* — most of it restates work he had already specified, dressed up as new.
> That criticism was correct. The list is retained here **only as a backlog of data capabilities
> and their supporting sources**, which is genuinely useful for sequencing.
>
> **The actual additions — the interaction-design work that is not on the user's list — live in
> `FRONTEND_UX_AUDIT_2026-09-06.md` §7.** If you are looking for "what are we adding", go there.
> If you are looking for "what data supports feature X", stay here.
>
> Priority note: several rows below are **superseded** by the audit document. Overspeed (row 7)
> follows audit §3, not §D.4. Anything involving showing a location follows audit §2.1 —
> a place name, never a coordinate.

| # | Feature | Why it is nearly free |
|---|---|---|
| 1 | **Freshness & provenance on every number** | A.1–A.3. Turns "is this live?" from a question into a glance. The trust foundation for everything else. |
| 2 | **Document Expiry Wall** | `useComplianceRisk` already exists with **zero** UI. Fines are money the owner feels immediately. |
| 3 | **Idle-burn ₹ leaderboard** | `/api/idling-reports` computed, zero callers. Ranks trucks by wasted rupees. |
| 4 | **Suggested geofences** | `/api/parking-zone-proposals` already discovers clusters. One click instead of drawing polygons. |
| 5 | **Planned vs actual route overlay** | Both tracks exist after E.1. The most persuasive screen in the product. |
| 6 | **Speed graph synced to replay scrubber** | `speed` is already on every row. Makes an overspeed accusation self-evidently fair. |
| 7 | **Overspeed heatmap** | Answers *where* drivers speed, not just how often — usually 3 corners, not everywhere. |
| 8 | **Night-driving detection** | Movement 23:00–05:00 from existing timestamps. Safety and insurance relevance. |
| 9 | **Unplanned-stop intelligence** | Stops > 20 min outside known sites, from idle events + site clusters. |
| 10 | **Route km truth** | `googleKm` vs `totalKm` vs **median actual km driven**. Exposes routes billed short. |
| 11 | **Vehicle unified timeline** | Fuel, alerts, trips, service, docs on one time axis. All exist, never joined. |
| 12 | **Driver scorecard** | Overspeed count, idle hours, night hours, harsh-accel proxy from speed deltas. |
| 13 | **Saved views / filter presets** | C.3. Kills the daily rebuild of the same filter. |
| 14 | **CSV/XLSX export everywhere** | `reportCsvExport.js` exists and is used on exactly one page. |
| 15 | **"What changed since you last looked"** | A diff digest on login, from `audit_logs` + alerts. |
| 16 | **Command palette (⌘K)** | Jump to any vehicle/trip/driver. 59 pages badly need an address bar. |
| 17 | **Multi-vehicle compare** | Two to four trucks side by side on the same metrics. |
| 18 | **Evidence drawer** | "Why is this number this?" → the rows behind it. The core trust mechanic. |
| 19 | **Alert rules engine** | User-defined thresholds → in-app alerts. In-app only, per standing rule. |
| 20 | **Vehicle availability calendar** | Day heatmap of running / idle / parked / workshop. |
| 21 | **Cost-per-km trend** | Per route and per vehicle, from fuel spend ÷ actual km. |
| 22 | **Fuel-drop map evidence** | Plot the drop location; a theft at a known pump reads very differently. |
| 23 | **Coverage / onboarding gap banner** | `/api/fleet-coverage` knows which vehicles never report. **139 of 151 vehicles have no `fleetEdgeAccountId` and have never been polled** — that is the single biggest data gap in the product and no screen says so. |
| 24 | **Data-quality panel** | Frozen odometers, dead GPS, stuck counters — surfaced instead of silently poisoning averages. |
| 25 | **Reconciliation verdict on every trip** | F.3. Turns "was this trip real?" into a first-class, evidenced answer. |

**#23 deserves emphasis.** A customer looking at a dashboard covering 12 of their 151 vehicles,
with nothing saying so, will conclude the product is broken — and they would be right to.

---

# §4 — UI ARRANGEMENT AND DESIGN PROMPTS

## §4.1 — Placement, and the reasoning

**Global frame.** Left sidebar (collapsible, product-tinted per H.3). Top bar: org/branch switcher,
global search (⌘K), freshness indicator for the whole session, notification bell, profile.
The **session freshness indicator is new and load-bearing** — one place that always says whether
the platform is receiving data.

**Overview / Command Center** — five bands, top to bottom:
1. **Attention** — what needs a decision today. Empty is a *good* state and must say so
   ("Nothing needs your attention — 47 vehicles reporting normally"), never a blank panel.
2. **Fleet at a glance** — moving / parked / offline / no-signal, each a filter link. Plus the
   coverage gap (#23) when non-zero.
3. **Money** — today's fuel spend, idle waste, estimated leak. Every figure with provenance.
4. **Live map** — deferred until visible (A.7.2), with a status rail beside it.
5. **Recent activity** — the audit/event stream.

**Vehicle 360** — hero identity strip (reg, model, driver, state, freshness), then tabs:
Timeline · Health · Fuel · Trips · Documents · Maintenance · Telemetry. Timeline is the default —
it answers "what has this truck been doing" better than any table.

**Trip detail** — map with planned vs actual, a summary strip, a reconciliation verdict badge, and
the replay entry point. Replay is a **route** (`/trips/:id/replay`), not a modal, so it is
linkable and shareable.

**Lists** — identical anatomy everywhere: title + count, FilterBar, DataTable, footer with
"Showing X of Y · filtered by N", export at top-right. Once learned, learned everywhere.

## §4.2 — Prompts for your designer

> ⚠️ **SUPERSEDED — use `DESIGN_SYSTEM_AND_AI_PROMPTS_2026-09-06.md` §4 instead.**
> That version is written for design *AIs* (v0 / Lovable / Bolt / Figma Make), has a mandatory
> system-context block to paste first, covers nine surfaces instead of five, and carries the
> labelling and glass-usage constraints that the five below lack. Sending both sets will produce
> inconsistent output. **Use the other document's prompts.** These are kept for reference only.

**Prompt 1 — Design system**
> Design a component library for an Indian heavy-commercial-vehicle fleet management platform used
> daily by fleet owners and operations managers, often on mid-range Windows laptops in an office.
> Primary `#EE6126`, ERP blue `#1E3A8A`, info blue `#1E88E5`, success `#4CAF50`, alert `#F44336`;
> neutrals `#FFFFFF / #F5F5F5 / #E6E6E6`, text `#1A1A1A / #333333 / #666666 / #999999`. Radii
> 8/12/16/full. Deliver: buttons (5 variants × 4 states), inputs, dropdowns, checkboxes, radios,
> toggles, tabs, table row (default/hover/selected/expanded), KPI card, status chip, filter chip,
> toast, modal, drawer, empty state, skeleton, and a "freshness chip" (a coloured dot + relative
> time + data-source label). Tone: professional and restrained — a business suit with one
> well-chosen accent, not a showpiece. Not playful, not neon, no heavy gradients on data surfaces.
> **Hard constraint: brand orange must never be used to signal a warning.** Status uses only
> green/amber/red/grey and those four are reserved for status alone.

**Prompt 2 — Fleet dashboard**
> Design the main dashboard for a fleet owner managing 150 heavy trucks across India. Answer, in
> one screen and in this priority: (1) what needs my attention today, (2) how much of my fleet is
> actually reporting data, (3) where is my money going, (4) where are my trucks now. Five stacked
> bands: an attention list, a fleet-status row, a money row, a live map with a vehicle rail, and a
> recent-activity feed. Every metric carries a small freshness indicator showing how recent the
> underlying data is. Include the state where only 12 of 151 vehicles are sending data — the
> design must communicate that clearly and calmly rather than hiding it. **Reference tone: a
> professional analytics dashboard, not a logistics marketing page.** Avoid large hero
> illustrations, avoid 3-D containers and trucks as decoration, avoid full-bleed photography.
> Dense but breathable. Light theme primary; dark theme as a variant.

**Prompt 3 — Trip replay**
> Design a trip replay screen: a full-width map showing a completed truck journey, with transport
> controls (play/pause, 1×–8× speed, scrub), a timeline strip marking events along the journey
> (overspeed in red, idling in amber, stops in grey, refuelling in blue), and a speed-over-time
> graph beneath the timeline that stays synchronised with the scrubber. A collapsible right panel
> shows trip summary and the currently selected event's detail. The truck marker is directional and
> rotates to its heading. Must stay legible with 2,000 GPS points and 40 events. Include the state
> where GPS coverage has a gap — the path should visibly indicate an inferred segment rather than
> drawing a confident straight line.

**Prompt 4 — Sidebar product transition**
> Design a collapsible left sidebar for a platform with two products: Fleet (orange, `#EE6126` →
> `#F2754A`) and ERP/CRM (blue, `#1E3A8A` → `#1E88E5`). When the user enters an ERP section the
> sidebar gradient transitions smoothly from orange to blue over ~350 ms; leaving returns it to
> orange. Show: collapsed and expanded, both colour states, the mid-transition frame, plus hover,
> active, disabled and badge-carrying nav items. **Text and icon contrast must hit WCAG AA against
> both gradients** — supply the text colours that satisfy both. Nothing else on the page changes
> colour; this is an orientation cue, not a theme change.

**Prompt 5 — Mobile manager app**
> Design 6 screens for a React Native manager app used by an Indian fleet supervisor on a mid-range
> Android phone, often one-handed, often on poor connectivity: (1) Fleet Now — live vehicle list
> with status and freshness, (2) Alerts with inline acknowledge, (3) Approvals queue, (4) Trip
> detail with a small map and a reconciliation verdict, (5) Fuel Review — correcting a failed OCR
> reading from a photo of a fuel bill, (6) an SOS alert received from a driver, showing live
> location. Large touch targets, high contrast for sunlight, minimal text, and an explicit offline
> state on every screen. Support Hindi and English labels of noticeably different lengths.

---

# §5 — PRICING

Already decided (2026-08-23); repeated here so implementation and commercial work stay aligned.
**Do not re-derive these numbers.** Full model in `HANDOFF_2026-08-23.md` §5–6.

**Measured infra cost:** ₹35/vehicle/month as configured, ₹22.87 optimised, floor ~₹17/mo
(₹203/yr) at 2,000+ vehicles. Measured on the live dev box, not estimated.

**Enterprise:** ₹7.5 L per 300 vehicles/year (₹2,500/vehicle) · ₹11 L first year (migration +
support) · ₹8 L per custom module. **Billed annual upfront** — worth ~₹65 L of year-1 cash
against monthly billing.

**Public list (per vehicle/year):** Starter ₹1,799 · **Standard ₹2,999** · Business ₹3,999.
Publish Standard alone if only one is shown. Floor 5 vehicles / ₹15,000; target 25+ vehicle
fleets — below ~20, CAC never pays back. Gross margin 90–93%.

**Three things that must not be got wrong:**

1. **The Tata data licence is the customer's line item, pure pass-through — never a GNB cost.**
   An earlier draft treated it as a cost and produced a break-even of 1,590 vehicles instead of
   ~590. Do not repeat that error.
2. **Never buy Tata's full FleetEdge tier** (₹4,000/veh/yr vs ₹1,200 basic location). The ₹2,800
   delta buys analytics GNB computes for under ₹150/vehicle/year. **That engine is worth roughly
   ₹2,670/vehicle/year in avoided licence fees — it is the core value claim of the company, not a
   feature.** Everything in Workstreams B and D is that claim made visible.
3. **Self-serve is gated on the Tata data contract.** The FleetEdge refresh token expires at ~90
   days and does **not** slide on rotation, so every account needs a human browser re-link each
   quarter *using the customer's browser*. ~15/quarter is a calendar item; 500 is unstaffable.
   Sell assisted to 25+ fleets until durable API credentials exist.

**Cost drivers, ranked (counter-intuitively):** storage is never the driver at any scale; **RAM is
the binding constraint** (hot index ≈ 0.6 MB per reporting vehicle). Gemini OCR is the largest
variable line — larger than all messaging combined — and scales with photos per vehicle per month,
which is the weakest input in the model (assumed 30; `documents.size`/`mimeType` are unpopulated
so it cannot yet be measured). Past ~2,000 vehicles, per-vehicle cost stops falling because ~79%
of the bill is strictly linear.

**Engineering implication:** Workstream G's optimisation saves on the order of ₹67k/year. Real
leverage is commercial — pricing, channel equity and the data contract — not infrastructure.
Build G for user experience and headroom, not for margin.

---

# §6 — SEQUENCING, RISKS, TRAPS

## §6.1 — Suggested order

| Stage | Content | Gate before moving on |
|---|---|---|
| 1 | A.1–A.3 (envelope + DataState) | Empty and unavailable render differently — screenshots |
| 2 | A.7 (cold calls) + A.9 | Request count on cold load halved — before/after numbers |
| 3 | A.4–A.6, A.8 (SSE) | One EventSource, zero repeated XHRs, 10-min soak |
| 4 | B.1, B.5 (idling + compliance) | Two screens live with provenance labelling |
| 5 | C.1–C.2 (list infra) + 3 pages | Filters in URL, server-side sort, honest counts |
| 6 | D.1–D.5 (speed, overspeed, idle) | Backfill dry-run counts; no events from LOW-quality intervals |
| 7 | E.1 (geometry + backfill) | Routes draw with zero Directions calls |
| 8 | E.2–E.3 (replay, 2-D truck) | Replay of a real trip, smooth, with events |
| 9 | F.1–F.2 (driver app) | Background fixes arriving; queue survives airplane mode |
| 10 | F.3–F.4 (reconciliation, manager app) | A trip returns a verdict with evidence |
| 11 | B.2–B.4, C.4 rest, D.6–D.8 | Remaining surfaces |
| 12 | G | Measured before/after on bundle and queries |
| 13 | H | Design applied last |

## §6.2 — Risks

1. **SSE dies silently behind a proxy** (A.6). Highest technical risk. Verify infrastructure
   before building UI on top of the stream.
2. **Background location gets the app rejected.** Play Store requires a prominent disclosure.
   Write the disclosure screen before writing the tracking code.
3. **Overspeed without a sourced limit produces noise**, users stop trusting alerts, and the
   feature is dead on arrival. `limitSource` is mandatory (D.4).
4. **3-D re-inflates the bundle** the team just spent a commit shrinking. Keep it lazy, flagged,
   and optional (E.3.3).
5. **Scope creep across 59 pages.** Every workstream must land page by page.
6. **The Tier A mirror clobbers new vehicle fields.** Any new field on `vehicles` must be added to
   `TIER_C_EXCLUDED` in `sync/lib/config.js` (currently 26 entries) **and**
   `SyncTailer.test.js`'s pinned length updated, or it is silently overwritten by the next sync.

## §6.3 — Traps that have already cost this project time

- Tests need `SKIP_DB=1`.
- `Query.forEach` does not exist in Mongoose 8 — `.lean()` or `.cursor().eachAsync()`.
- `unique + sparse` is a no-op when the field has `default: null` — use `partialFilterExpression`.
- Mongoose `autoIndex` **cannot** convert an existing index in place (`IndexOptionsConflict`).
  A model change alone leaves it silently `unique: false`. Drop and rebuild explicitly.
- A positive-shift migration must run **descending**, or an early row lands on an occupied slot
  and dies on the unique index.
- `registrationNumber: 'NA'` exists in the data (one vehicle). Ledger keys on
  `(orgId, registrationNumber, day)` — key on VIN if that spreads.
- `registrationNumber` and `chassisNumber` are **globally** unique, not per-org.
- Sweeps take ~30 minutes; a "sweep complete" log is a *completion* time, not a start time.
- Assert on `.toISOString()`, never on local getters — a tautological test hid a fleet-wide
  5.5-hour timezone error for months.
- `mongorestore --dryRun` always prints "0 documents restored" — useless as an emptiness check.
- PowerShell 5.1 has no `-SkipCertificateCheck`; use `curl.exe -k`. Here-strings mangle commit
  messages — use `git commit -F <file>`.
- No `Co-Authored-By` trailers on commits in the plugin repo; never push to `main`.

## §6.4 — Decisions (resolved 2026-09-06)

1. **3-D trucks — DECIDED: build them.** Implementation constraints and the safe build path are
   in `FRONTEND_UX_AUDIT_2026-09-06.md` §6: deck.gl `ScenegraphLayer` (not raw three.js), a
   route-level lazy chunk so the main bundle is untouched, ≤150 KB draco GLTF, heading from
   `courseDegrees` interpolated by shortest arc, automatic 2-D fallback on low-end/no-WebGL
   devices, and LOD (3-D for the focused vehicle and ≤20 on the live map).
2. **Overspeed source — DECIDED: computed from ping-to-ping ground distance only.** FleetEdge's
   native alert is rejected as a source and retained only as a corroborating signal displayed
   beside ours. Both thresholds (speed **and** duration) are user-configurable. See audit §3.
3. **`/api/hotspots` — ANSWERED: siphoning hotspots. Build it.** `siphoningHotspot.model.js`
   carries `name`, `centerLat/Lng`, `radiusM`, `source: MANUAL|AUTO_LEARNED`, `incidentCount`,
   `lastIncidentAt`; a cron learns them, and `orgId: null` denotes a hotspot shared across
   customers. Product line: *"fuel goes missing at these 3 places on your routes."*
4. **`/api/insights` — ANSWERED: internal QA tool. Do NOT give it a customer UI.** It compares
   the old `fuelComparison` pipeline against the new `fuelIntegrity` one for a single vehicle
   over a date range. If it gets a UI it belongs in the Superadmin/LEMU console.

### Still genuinely open

5. **Manager app: role mode in the existing Expo app, or a separate binary?** Recommendation is a
   role mode (F.4) — a second binary doubles release, signing and Sentry burden for a team of ~5.
6. **Background tracking window: on-duty only, or continuous?** Recommendation is on-duty only,
   for battery life, driver privacy and Play Store approval.
