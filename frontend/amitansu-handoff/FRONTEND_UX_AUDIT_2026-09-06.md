# GNB — Frontend UX Audit & Rebuild Spec

**Branch:** `revamp/frontend-audit-fixes` · **Written:** 2026-09-06 · **Author:** Opus 5
**Companion to:** `OVERHAUL_MASTER_PLAN_2026-09-06.md` (data/backend work)
**This document is the priority one.** The other document makes the data correct. This one makes
the product usable. If they compete for time, this wins.

---

## §0 — THE PREMISE

This frontend was written by a backend engineer to verify that the backend worked. That was the
right thing to build at the time and it succeeded — the data is there and it is largely correct.
But it means **every screen is shaped like the API that feeds it**, not like the job the user is
doing. The user is a fleet owner or an operations manager in an Indian HCV business. They are not
an engineer, they have not read the schema, and they will not be trained.

The test for every screen in this document: **can someone who has never seen this product open
this page and know what to do next, without asking anyone?** Today, for most pages, the answer
is no. What follows is measured, not impressionistic.

---

## §1 — WHAT IS ACTUALLY WRONG (measured 2026-09-06)

### §1.1 The product speaks in coordinates, IDs and enum constants

**Raw GPS coordinates are used as a place's identity.** `RouteIntelligencePage.jsx:148` renders a
discovered site as:

```jsx
{site.centroidLat?.toFixed(5) ?? '—'}, {site.centroidLng?.toFixed(5) ?? '—'}
```

That is the entire identification of the place. Same at `:209` and `:217` for corridor origin and
destination. Also `GeofencePage.jsx:128` and `:372`, `EventInvestigationDrawer.jsx:100`, and
`EvidenceDrawer.jsx:135` (`Stopped 47 min at 22.5726°N 88.3639°E`).

The user's verdict on this, verbatim: *"is he a cartographer that he understands geometric
coordinates?"* He is right. `22.57289, 88.36389` is Howrah. Nobody in the business thinks in
degrees. **No coordinate may ever be the primary label of a place** (§2.1).

**Mongo ObjectIds are rendered into the UI.** `AssignedEmployeesPage.jsx:101`,
`AssignRoleDrawer.jsx:171,189`, `BranchAccessTab.jsx:191`, `EnterpriseRolesTab.jsx:176`,
`BasicInformationForm.jsx:170,191`. A 24-character hex string is not information to a user.

**Database enum constants are printed raw.** 18+ sites render `UPPER_SNAKE_CASE` straight into a
chip or cell: `FleetAlertsPage.jsx:182` (`{a.severity}`), `OwnerAlertsPage.jsx:355`,
`VehicleAttentionTable.jsx:123` (`{r.status}`), `ServiceIntelligencePage.jsx:350` (`{r.type}`),
`GeofenceZonesPage.jsx:407`, `LedgerPage.jsx:246`, `UnloadingPage.jsx:258,295`,
`SaleBillsPage.jsx:392`, `SupplierPaymentsPage.jsx:362`, `AdvanceMastersPage.jsx:251`,
`RatesPage.jsx:227`, `VendorsPage.jsx:258`, `ModelComparisonPage.jsx:76`.

A user reads `INSUFFICIENT_DATA`, `NO_TELEMATICS`, `UNATTRIBUTED`, `RETURN_PARK`,
`DERIVED_ENGINE_HOURS`. These are internal vocabulary leaking through the screen.

> 🛑 `LedgerPage`, `UnloadingPage`, `SaleBillsPage`, `SupplierPaymentsPage`,
> `AdvanceMastersPage`, `RatesPage` and `VendorsPage` in the list above are **ERP — out of scope.**
> Fix the fleet ones: `FleetAlertsPage`, `OwnerAlertsPage`, `VehicleAttentionTable`,
> `ServiceIntelligencePage`, `GeofenceZonesPage`, `ModelComparisonPage`.

### §1.2 You cannot find anything

**24 pages render a table with no search box at all:**

AccessControl · AuditTrail · Compliance · DefLedger · ErpAdvances · ErpApprovals ·
ErpBillApprovals · ErpCallPlanning · ErpConsignments · ErpLedger · ErpOutstanding · ErpPlacement ·
ErpPods · ErpReceipts · ErpSaleBills · ErpSupplierPayments · ErpUnloading · ErpVendorPayments ·
FieldAgentFuel · FleetCoverage · FuelSpend · RouteDeviation · RouteIntelligence · Settings

> 🛑 **ERP pages in this list are OUT OF SCOPE.** Every `Erp*` entry below was counted
> because the measurement swept the whole app. The work is **fleet only** — skip them. In-scope
> pages here: AccessControl, AuditTrail, Compliance, DefLedger, FieldAgentFuel, FleetCoverage,
> FuelSpend, RouteDeviation, RouteIntelligence, Settings. That is 10 pages, not 24.

With 151 vehicles and a growing ERP, "scroll until you see it" is the only available strategy on
half the product. There is also **no global search** — 59 pages and no way to type a registration
number and get to that truck.

### §1.3 Empty screens explain nothing

**30 of 59 pages have no empty-state handling of any kind.** They render an empty `<tbody>`. The
user sees a header row and white space, with no way to tell whether the filter is too narrow,
the data has not synced, their org has no access, or the feature is simply not set up yet.

This is the same disease as the "`0` reads as live" bug (`OVERHAUL_MASTER_PLAN` §1.2) expressed in
layout instead of state: **the product's default answer to every question is a blank rectangle.**

### §1.4 The product uses the browser's dialogs

**18 native `alert()` / `confirm()` calls.** Destructive actions are confirmed with an OS dialog
that says the site's hostname and offers OK/Cancel:

- `GeofenceZonesPage.jsx:230` — `confirm('Delete this custom zone?')`
- `ServiceIntelligencePage.jsx:89` — delete a service entry
- `FleetEdgeAccountsPage.jsx:280` — delete a FleetEdge account
- `AssignedEmployeesPage.jsx:50` — revoke a role
- `TripCreationFlow.jsx:447` — discard an entire trip form
- errors surfaced via `alert()`: `RouteCreator.jsx:238,305,337`, `GeofencePage.jsx:284`,
  `GeofenceZonesPage.jsx:233`, `DropZone.jsx:66,71`, `DocumentUpload.jsx:64`,
  `VehicleDocumentUpload.jsx:84`

These block the tab, cannot be styled, cannot show what will be lost, and on a delete they
offer no undo. `ConfirmDeleteModal.jsx` already exists in `AccessControl/` — the pattern is there
and was never rolled out.

### §1.5 Almost nothing can be exported

**5 of 59 pages have working export** (AuditTrail, Compliance, DefLedger, FleetAlerts, FuelSpend),
via `utils/reportCsvExport.js`. Every other table is a dead end.

**`xlsx` is already a dependency in `package.json` and is essentially unused.** The capability the
user calls "very important" is installed and sitting idle.

### §1.6 The screens are too big to maintain or to use

**18 components exceed 600 lines.** The worst:

> 🛑 Of the 18 oversized components below, the **in-scope** ones are `TripFormPage` (1194),
> `RefuelLogsPage` (966), `CommandCenterPage` (776), `Trip/TripDetailPage` (738),
> `driversComponents` (746), `Profile/VehiclesPage` (690), `BulkUploadDriversPage` (683),
> `DriversPage` (679), `TripLedgerReport` (675), `FuelComparisonPage` (651),
> `FuelIntegrityPage` (644). **Every `Erp*` file and the Superadmin/lemu files are excluded.**


| Lines | File |
|---|---|
| 1194 | `pages/Trip/TripFormPage.jsx` |
| 966 | `pages/Trip/RefuelLogsPage.jsx` |
| 776 | `pages/CommandCenter/CommandCenterPage.jsx` |
| 768 | `pages/ErpTrips/TripDetailPage.jsx` |
| 746 | `pages/Drivers/Component/driversComponents.jsx` |
| 738 | `pages/Trip/TripDetailPage.jsx` |
| 690 | `pages/Profile/VehiclesPage.jsx` |

A 1,194-line trip form is not only unmaintainable, it is a symptom: everything the backend can
accept has been put on one screen, in schema order, because no one decided what the user does
first. **Form length is a design failure before it is a code failure.**

### §1.7 Mobile is partial

59 of 83 page CSS files contain `@media` queries — so responsiveness was attempted but is not
systematic. 24 stylesheets have none. A fleet owner checking a truck from his phone is a real
and frequent use case.

---

## §2 — WHAT TO BUILD (the frontend work, in priority order)

Everything here is frontend unless marked **[BE]**. This is Workstream 0 — it runs **before or
alongside** the data workstreams, not after.

### §2.1 — Places, not coordinates (do this first; it is small and everywhere)

**[BE]** Add a `place` object to every API response that currently returns a bare lat/lng:

```json
"place": { "label": "NH-19, Dankuni Toll", "sub": "Hooghly, WB",
           "kind": "TOLL|PUMP|PLANT|PARKING|WORKSHOP|HIGHWAY|UNKNOWN",
           "lat": 22.57, "lng": 88.36, "confidence": "EXACT|NEAR|APPROX" }
```

Resolution order, cheapest first — **and reverse-geocoding is the last resort because it is paid**:
1. Inside a known geofence zone → its name
2. Inside/near a `SiteCluster` → its name and type
3. Near a known fuel pump / toll / plant from masters → that name + distance ("2 km from Dankuni Toll")
4. Reverse-geocode **once**, then **cache the result on the row forever**
5. Only if all fail: `"Unmapped location near Dankuni"` — still not a coordinate

**Frontend:** create `components/ui/PlaceLabel.jsx`. Renders `label` bold, `sub` muted, a
kind icon, and a "map" affordance. Coordinates appear **only** in a hover tooltip or a copy
button — never as the visible label.

Replace at: `RouteIntelligencePage.jsx:148,209,217` · `GeofencePage.jsx:128,372` ·
`EventInvestigationDrawer.jsx:100` · `EvidenceDrawer.jsx:135` · `FleetAlertsPage.jsx:195` ·
`Vehicle360Page.jsx:215`.

**Corridors read as journeys, not endpoints.** `RouteIntelligencePage` corridor rows become
**"Haldia → Noida · 1,412 km · 23 trips · usually 38 h"**, not two coordinate pairs.

### §2.2 — A human vocabulary layer

Create `frontend/src/lib/vocabulary.js` — one file, the single place where internal constants
become English (and later Hindi):

```js
export const LABELS = {
  status: { ACTIVE: 'Moving', PARKED: 'Parked', OFFLINE: 'No signal' },
  telematics: {
    INSUFFICIENT_DATA: 'Not enough GPS data',
    NO_TELEMATICS:     'This truck has no tracking device',
    UNATTRIBUTED:      'Not matched to a trip',
    RETURN_PARK:       'Returning to yard',
  },
  idleSource: {
    CAN_IDLING_MINUTES:   'Measured by the vehicle',
    DERIVED_ENGINE_HOURS: 'Estimated from engine hours',
  },
};
export const label = (group, key) => LABELS[group]?.[key] ?? humanise(key);
```

`humanise()` is the safety net: `RETURN_PARK` → `Return park`. **Never render a raw key again.**
Add an eslint rule or a review checklist item for it.

Then `components/ui/StatusChip.jsx` takes `(group, key)` and renders label + colour + icon, so
status is consistent in all 18 places that currently print the constant.

**Never render `_id`.** Use a name; when an identifier is genuinely needed, show a short
human code, and put the ObjectId behind a copy button in a details panel.

### §2.3 — Find anything: global search + per-table search

**Global command palette (⌘K / Ctrl+K)** — `components/search/CommandPalette.jsx`. Type
`WB25W1040` → the truck. Type a driver name → the driver. Type "fuel" → the page. With 59 pages
this is the single largest navigation win available, and it is a well-understood component.

**[BE]** `GET /api/search?q=` — one endpoint searching vehicles, drivers, trips, routes, parties,
returning `{type, id, label, sub, url}`.

**Per-table search** on all 24 pages in §1.2, via the shared `FilterBar` (companion doc §C.2).
Search must be debounced, in the URL, and must state what it matched.

### §2.4 — Every screen answers its own empty state

`components/data-state/EmptyState.jsx` exists in a `data-state/` directory that is otherwise
unused. Every empty state must give the user: **what happened · why · what to do next.**

| Situation | Bad (today) | Good |
|---|---|---|
| Filter too narrow | blank table | "No trips between 1–7 Sep. **Widen to 30 days**" |
| Never set up | blank table | "No geofences yet. Zones alert you when a truck enters or leaves. **Create your first zone**" |
| No access | blank table | "Your plan doesn't include Fuel Integrity. **Talk to us**" |
| Not synced | blank table | "No data yet — this truck was added 4 minutes ago. First sync takes about an hour." |
| Genuinely zero | blank table | "No alerts today. 47 trucks running normally." ← a *good* answer |

The last row matters most: **"nothing is wrong" is the most common state in a healthy fleet and
the product currently renders it as failure.**

### §2.5 — Real dialogs, real feedback, undo

- `components/ui/ConfirmDialog.jsx` — promote the existing `ConfirmDeleteModal.jsx` pattern to a
  shared component. Names the object, states the consequence, requires typing the name for
  genuinely destructive actions, and the confirm button says the verb ("Delete zone"), not "OK".
- `components/ui/Toast.jsx` — replace all 11 error `alert()`s. Errors carry the request id
  (already logged by `axiosConfig.js`) so support can trace them.
- **Undo instead of confirm wherever possible.** Deleting a zone should delete it and show
  "Zone deleted · Undo" for 8 seconds. Faster than a confirm, and safer.
- Every mutating button needs pending / success / failure states. Silent buttons make users
  double-submit.

### §2.6 — Export everywhere, in Excel

**`xlsx` is already installed.** Create `lib/exportTable.js`:

```js
exportTable({ rows, columns, filename, format: 'xlsx' | 'csv', meta })
```

`meta` stamps the sheet with the filters applied, the date range, and generation time — an
exported sheet must be self-describing, because it will be mailed to someone who never saw the
filter. Formats numbers as numbers (not text), ₹ with the right format, dates as dates, and
freezes the header row.

`components/ui/ExportButton.jsx` goes in the standard table header — **every table, all 59 pages.**
Default Excel, CSV secondary. Exports **all filtered rows, not the current page** (fetch with a
high limit), and says so.

### §2.7 — Leaderboards as a first-class, reusable surface

The user's requirement: leaderboards for most things, all exportable.

`components/leaderboard/Leaderboard.jsx` — a ranked list with rank, entity, primary metric,
trend vs previous period, and a drill-in. Shared by:

| Leaderboard | Metric | Source |
|---|---|---|
| Worst idling | idle hours + ₹ wasted | `/api/idling-reports` |
| Most overspeeding | events + minutes over | new (§3) |
| Fuel efficiency | km/L, best and worst | mileage/CAN |
| Cost per km | ₹/km | fuel spend ÷ actual km |
| **Route cost** | **₹/km and ₹/trip, per route** | **fuel + idle waste ÷ actual km driven (FMS only — see note)** |
| Driver score | composite | new |
| Unplanned stops | count + hours | new |
| Document risk | days to expiry | compliance |
| Downtime | days off-road | maintenance |
| Coverage | vehicles not reporting | fleet-coverage |

Every one: same component, same export button, same drill-in, same period selector.

#### Route cost — the FMS half of route profitability

**Lives on the fleet side. Build it now, on `RouteDetailPage` (§E.2) with a fleet-wide ranked
view under Money.** No ERP dependency, no ERP page touched.

What it ranks, per route, from data the fleet side already owns:

| Column | Source |
|---|---|
| Actual km driven (median across trips) | `LiveVehiclePositionHistory` track, §E.1.3 |
| Planned/billed km | `route.googleKm` / `totalKm` |
| **km drift** — actual vs billed | the two above. This is the money finding |
| Fuel consumed | CAN delta / fuel spend |
| Idle waste on this route | `/api/idling-reports` joined by trip window |
| **₹ per km** and **₹ per trip** | fuel + idle ÷ actual km |
| Trips sampled | count — never show a cost without its sample size |

**Call it "Route cost", not "Route profitability", until revenue is wired.** Profit needs the
freight rate, which lives on the ERP side and is deliberately out of scope. Naming it
"profitability" while showing only cost is the same class of lie as rendering an empty feed as
live — the user reads a number that means something other than what it says.

**Design the row so revenue slots in later without a rebuild:** leave the rightmost columns as
`Revenue —` and `Margin —` rendered as an explicit *"not connected yet"* state, not hidden and
not zero. When the two halves are coupled, those two columns fill in and nothing else moves.
That is the coupling the owner asked to defer, made cheap to do later.

**Always show both ends** — best and worst. A leaderboard that only shames is not used twice;
one that also credits the best driver gets shown to the drivers.

### §2.8 — Break up the monster screens

`TripFormPage.jsx` (1,194 lines) becomes a **3-step wizard**: Vehicle & driver → Route & cargo →
Documents & advance. Each step ≤ 250 lines, saves a draft, validates on blur, and shows a summary
before submit. Same treatment for `RefuelLogsPage` (966), `CommandCenterPage` (776),
`TripDetailPage` (768/738), `VehiclesPage` (690).

Rule going forward: **a page component over ~300 lines is a design smell.** Split by what the
user is doing, not by what the API returns.

### §2.9 — One page layout, learned once

`components/layout/PageShell.jsx` — every page: title, subtitle, freshness chip, primary action,
FilterBar, content, footer with honest counts ("Showing 24 of 151 · 2 filters"). Learn one page,
you have learned all 59. Today, no two pages are laid out the same way.

### §2.10 — Mobile

Audit the 24 stylesheets with no `@media`. Tables become cards below 768 px. Primary action
becomes a bottom-fixed button. Owner-critical pages (Overview, Vehicle 360, Alerts, Live map)
get explicit phone layouts and are tested on a real mid-range Android.

---

## §3 — OVERSPEEDING, CORRECTED

**This supersedes §D.4 of `OVERHAUL_MASTER_PLAN_2026-09-06.md`.**

### §3.1 — Why the Tata/FleetEdge overspeed alert is rejected as a source

The user's finding: FleetEdge's `OverSpeedEvent` fires on an **instantaneous sample**. A driver
who touches the throttle for one second inside a sampling window is logged as speeding; a driver
who genuinely speeds for two minutes but lifts off just before the sample is not. The observed
durations cluster at **59 s, 1 min, 1 min 50 s** — a distribution shaped by the sampler, not by
driver behaviour.

**Verification (run before building — this is cheap and settles it):**

```js
// mongosh on dev — distribution of native overspeed alert durations
db.fleetedge_push.aggregate([
  { $match: { alertType: /OverSpeed/i } },
  { $project: { d: { $ifNull: ['$payload.durationSeconds', '$payload.duration'] } } },
  { $bucket: { groupBy: '$d', boundaries: [0,30,60,90,120,180,300,600,3600],
               default: 'other', output: { n: { $sum: 1 } } } }
])
```

**Plot the distribution before quoting it** (`HANDOFF.md` §3 rule 12). If durations pile up at
round sampler-shaped values and there is nothing above ~2 min, the artifact is confirmed. Either
way, the design below does not depend on the answer — it computes independently. Record the
result so this is never re-litigated.

**Decision:** `FLEETEDGE_ALERT_OVERSPEED` is retained only as a **corroborating signal shown
beside our own** — never as the source of a violation, never as the basis of a driver score.

### §3.2 — What we compute instead: ping-to-ping ground speed

Between two consecutive `LiveVehiclePositionHistory` fixes:

```
groundSpeedKph = haversineMeters(p1, p2) / (t2 - t1) * 3.6
```

This is what the user asked for: *"within 2 pings the distance covered"*, *"calculate against
actual ground covered"*. It cannot be fooled by a one-second pedal blip, because it measures the
distance the truck actually travelled over a real interval.

**Both thresholds are user-configurable — this is the core requirement:**

```
speedThresholdKph      default 60    // "over this speed"
durationThresholdSec   default 180   // "...for at least this long"
```

Per org, overridable per vehicle. Settings screen: *"Alert me when a truck goes over
[60] km/h for more than [3] minutes."* One sentence, two inputs — a fleet owner can set this
without help.

**Sustained-window detection** (not per-interval):
1. Build consecutive intervals with `groundSpeedKph`, each carrying `quality`.
2. Mark intervals `>= speedThresholdKph`.
3. Merge adjacent marked intervals into a run; tolerate a single dip below threshold shorter
   than 30 s (a curve or a toll queue should not split one violation into three).
4. Emit an event only when the merged run's **duration ≥ `durationThresholdSec`**.
5. Record `maxKph`, `avgKph`, `distanceMeters`, `path` (encoded), `startPlace`, `endPlace`
   (§2.1 — a place, never coordinates), and both threshold values **as they were at computation
   time**, so a later settings change does not silently rewrite history.

**Quality gate:** intervals with a gap > 5 min are `quality: LOW` and can never *create* an event
(a 40 km straight-line hop between two fixes is an average over unknown road, not a speed). They
may extend an event already established by HIGH-quality intervals. `snapOutliers` rejects
physically impossible jumps before any of this runs — one bad GPS fix must never produce a
400 km/h violation.

**Recompute, don't accumulate.** Thresholds are configurable, so events must be **derived, not
stored-once**. The worker recomputes idempotently over a window keyed on
`(orgId, registrationNumber, windowFrom, windowTo)`. When a user changes the threshold, past
events recompute to match — otherwise the leaderboard mixes two definitions and is meaningless.

### §3.3 — How it is presented

- **Overspeeding leaderboard** (§2.7) — by vehicle and by driver, exportable.
- **Every event opens the replay** at that moment with the speed graph (companion doc §E.3.2), so
  the evidence is visible. An accusation a driver can see the map of is one a manager can act on.
- **Both signals shown, never averaged:** "Our calculation: 4 events, 22 min over. Tata's device
  reported: 31 events." That disagreement is itself the argument for the product.
- The event card reads: **"78 km/h for 6 minutes on NH-19 near Dankuni"** — speed, duration,
  place. Never a coordinate, never a raw enum.

---

## §4 — PREDICTIVE ARRIVAL ON CORRIDORS

Confirmed as build-now. Design in companion doc §D.7; the UX requirements:

- Every in-progress trip shows **"Arriving Thu ~2–5 PM"** — a band, never a false-precision time.
- Confidence is stated in words with its basis: *"Based on 23 past trips on this corridor."*
  With fewer than 5 samples: *"Rough estimate — first few trips on this route."*
- **Never show a bare ETA with no sample size.** An estimate from 3 trips and one from 200 must
  not look identical.
- The corridor page shows the distribution — "usually 36–41 h, worst 58 h" — which is more useful
  to a planner than any single number.
- Delay is surfaced against the *prediction*, not the plan: "Running ~4 h behind its usual pace."

---

## §5 — THE OTHER TWO ENDPOINTS (read, as asked)

**Both services read in full on 2026-09-06 — this is not from route summaries.**

### `/api/hotspots` — build it. It is bigger than a feature; the code calls it the network moat.

`hotspotWatch.service.js` is 449 lines of working logic:

| Function | What it does |
|---|---|
| `autoLearnHotspots(orgId)` | Pulls `FleetEdgeRefuelAlert` rows with `alertType: 'THEFT'` in a rolling window, clusters them geographically (`clusterPoints`, DBSCAN-ish with `clusterEpsilonKm`), keeps clusters with ≥ `minIncidents`, upserts them as `AUTO_LEARNED` hotspots |
| **`autoLearnSharedHotspots()`** | **The same clustering across ALL orgs**, writing `orgId: null` rows that every org's lookup reads. The docstring calls it *"Cross-fleet shared learning (the network moat, privacy-preserving)"* — only centroid, `incidentCount` and `lastIncidentAt` are stored, never per-org detail. Gated by `cfg.sharedLearningEnabled` |
| `isInHotspot` / `findNearestHotspot` | Point-in-hotspot lookup, org-scoped or system-wide, radius falling back to config |
| `checkRefuelLocation(...)` | Checks a refuel event's pump location against known hotspots |
| `flagHotspotVehicle(...)` | Flags a vehicle seen in one |
| `runHotspotWatch` / `runHotspotSweep` | The cron entry points |

**This is a genuine competitive asset and it is finished, running, and invisible.** Every
customer's theft incidents improve the theft map for every other customer, and a competitor
cannot replicate it without an equivalent fleet. It belongs in the pricing and positioning
conversation (`OVERHAUL_MASTER_PLAN` §5), not just the feature list — it is the one thing in the
product that gets *better with scale* rather than merely cheaper.

**Build:** a hotspot map with incident counts and last-incident dates; an alert when a truck stops
inside one; confirm/dismiss on a learned hotspot; and a clear visual distinction between
*"learned from your fleet"* and *"learned across the network"*. Product line:
*"Fuel goes missing at these 3 places on your routes. Two of your trucks stopped at one
yesterday."*

⚠️ **Privacy constraint, and it is load-bearing:** shared hotspots must never expose which org
contributed an incident. The service already enforces this by storing only aggregates — **do not
add a field to the shared rows that could re-identify a fleet**, and do not surface raw incident
lists on a system-wide hotspot.

### `/api/insights` — confirmed internal QA. Do NOT build a customer UI.

`insightsCompare.service.js` (222 lines) imports `fuelComparison.model` (old pipeline) and
`fuelIntegrityWindow.model` (new pipeline), aligns their windows by `overlapRatio`, and emits a
per-window diff plus a summary. It is a **migration-verification tool** — it answers "did the new
fuel pipeline reproduce the old one?"

Surfacing "our two internal pipelines disagree" to a paying customer is a mistake. If it gets a UI
at all, it belongs in the Superadmin/LEMU console beside the other engineering instrumentation.

---

## §6 — 3-D TRUCKS: APPROVED, HERE IS HOW TO DO IT SAFELY

Decision made by the user: **build it.** The engineering constraints still hold, so the way it is
built matters.

- **Renderer:** `@vis.gl/react-google-maps` + `deck.gl` `ScenegraphLayer`, **not** raw three.js
  over a map. deck.gl composites with the map's own camera; a hand-rolled three.js overlay
  desynchronises on tilt and zoom.
- **Route-level lazy chunk.** `React.lazy` the entire replay view. It must never enter the main
  bundle — the entry chunk is **582,367 B raw / 165,913 B gzip** against a 600,000 B CI guard
  (measured 2026-09-06), and commit `1cb13ee` removed three.js to
  save 1.64 MB. Re-adding it to the *main* chunk would undo that; adding it to a *lazy* chunk
  does not.
- **Model budget:** one GLTF, draco-compressed, ≤ 150 KB, single mesh, baked texture, ~2k tris.
  A truck at 40 px on screen needs a silhouette, not a drivetrain.
- **Heading from `courseDegrees`** (already in the data), interpolated by **shortest arc** —
  naive interpolation from 350° to 10° spins the truck 340° the wrong way.
- **Automatic 2-D fallback** when WebGL is unavailable or the device is low-end. Fleet managers
  use cheap Android tablets. The 2-D directional marker is built anyway and is the fallback.
- **LOD:** 3-D model only for the focused vehicle in replay and for ≤ 20 vehicles on the live map;
  beyond that, 2-D markers. 150 3-D trucks at once will not hold frame rate and would not be
  legible anyway.
- **Measure and report** the lazy chunk's gzip size when it lands.

---

## §7 — WHAT I AM ADDING (frontend/UX only — none of this is on the user's list)

The previous list was rightly rejected as a restatement of the user's own asks. These are
interaction-design additions that come from reading the frontend.

| # | Addition | The problem it solves |
|---|---|---|
| 1 | **`PlaceLabel` everywhere** | Coordinates and IDs stop appearing in the UI at all (§2.1–2.2) |
| 2 | **Vocabulary layer** | 18 sites printing `UPPER_SNAKE` become English; Hindi becomes a config change, not a rewrite |
| 3 | **⌘K command palette** | 59 pages, currently no way to jump to a truck by name |
| 4 | **Honest empty states with a next action** | 30 pages currently answer every question with a blank rectangle |
| 5 | **"Nothing is wrong" as a designed state** | The most common state in a healthy fleet, currently rendered as failure |
| 6 | **Undo instead of confirm** | Replaces 18 blocking OS dialogs; faster *and* safer |
| 7 | **Self-describing Excel exports** | Sheet carries its filters/date range, so it survives being emailed |
| 8 | **One `PageShell` for all 59 pages** | Learn one screen, know all of them |
| 9 | **Trip form → 3-step wizard** | 1,194 lines of schema-ordered form becomes a task |
| 10 | **Threshold settings in plain sentences** | "Alert me when a truck goes over [60] km/h for more than [3] minutes" |
| 11 | **Both-signals-shown pattern** | A reusable component for "ours says X, the device says Y" — the trust mechanic, productised |
| 12 | **Leaderboards show best and worst** | A shaming-only board gets used once; a fair one gets shown to drivers |
| 13 | **Evidence-first alerts** | Every alert opens the replay at that moment; no accusation without a map |
| 14 | **Sample size on every estimate** | An ETA from 3 trips must not look like one from 200 |
| 15 | **Mobile card layouts for owner pages** | 24 stylesheets have no breakpoints; owners check trucks from phones |
| 16 | **Draft-saving on long forms** | A dropped connection currently loses a whole trip entry |
| 17 | **Per-row provenance on hover** | "Where did this number come from?" answerable without leaving the table |
| 18 | **Skeletons matched to final layout** | Removes the flash-and-reflow on every page load |
| 19 | **Keyboard-first tables** | 870 a11y warnings are also a keyboard-navigation deficiency for all-day users |
| 20 | **First-run setup checklist** | New orgs currently land on empty screens with no path to a working state |

---

## §8 — REVISED PRIORITY

Workstream 0 (this document) runs first or alongside; it is not queued behind the data work.

| Stage | Work | Why here |
|---|---|---|
| 0.1 | Vocabulary layer + `StatusChip` + kill raw `_id` | One file, ~30 call sites, immediate |
| 0.2 | `PlaceLabel` + **[BE]** place resolution | Removes the most-cited defect |
| 0.3 | `PageShell` + `FilterBar` + `DataTable` + `EmptyState` | The chassis everything else mounts on |
| 0.4 | Export (Excel) on every table | "Very important"; the library is already installed |
| 0.5 | ⌘K palette + **[BE]** `/api/search` | Largest navigation win |
| 0.6 | ConfirmDialog + Toast + Undo; delete all 18 `alert()`s | Removes the most obviously unfinished thing |
| 0.7 | Roll 0.3–0.6 across all 59 pages, ~5 per PR | The bulk of the work |
| 0.8 | Overspeed compute (§3) + leaderboard component | Highest-value new feature |
| 0.9 | Corridor ETA (§4) + hotspots (§5) | |
| 0.10 | Split the 18 monster components | Trip form wizard first |
| 0.11 | Mobile layouts | |
| 0.12 | Replay + 3-D (§6) | After the chassis exists |

**Do not roll a page into 0.7 without its empty states, its export and its search.** A page is
"done" only when a stranger can use it.
