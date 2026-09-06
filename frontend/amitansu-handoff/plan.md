# Fleet chassis rollout — my plan (ERP excluded)

Scope note up top: **ERP (`Erp*` — 43 page directories) is explicitly out of scope.**
That's a separate person's work. Everything below is the non-ERP "fleet" side only —
Vehicles, Trips, Mileage, Maintenance, Reports, Drivers, tracking/telematics, etc.

Numbers below were checked directly against the branch just now (`git log`, `grep`,
`wc -l`), not copied from a doc — where they differ from what the handoff claims,
that's called out rather than smoothed over, per this project's own working rule
("never trust a claim, re-run it").

---

## 1. Where we actually stand

Verified by scanning every non-ERP route in `src/App.jsx` (68 routed page components)
and checking which ones already render through `PageShell`:

- **28 converted.**
- **40 not yet converted**, of which:
  - **26 are real fleet/ops pages** — these are this plan's job.
  - **10 are Superadmin-area pages** (Lemu, RBAC, org feature flags, warehouse) — a
    different persona/surface, not "fleet" in the sense you mean. Not in this plan
    unless you tell me otherwise.
  - **4 are public/auth pages** (Login, SignUp, Landing, Onboarding) — render outside
    the authenticated app shell, so `PageShell` doesn't apply to them at all.

So: **26 real fleet pages left to convert**, not 42. The handoff doc's "42 of 70"
count is close but not identical to what I measured (68 routed, not 70) — I'm not
reconciling that gap silently; flag it to Devayan if it matters, but it doesn't change
the work list below.

## 2. The batch to follow, in order — from `COWORKER_HANDOFF_2026-09-06_SHARE.md` §5

This is "the doc" you meant — its explicit list, in its groups, with its file-prefix
scheme so parallel work doesn't collide. Current line counts re-measured just now:

| Group                   | File                                            | Lines now                    | Prefix for new modules                                                                                                                                                                          |
| ----------------------- | ----------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trip** ✅ done        | `Trip/TripManagementPage.jsx`                   | 231 (was 330)                | `tripManagement*` — wired onto PageShell/FilterBar/DataTable, +test for the utils module                                                                                                        |
|                         | `Trip/TripDetailPage.jsx`                       | 192 (was 202)                | `tripDetail*` — wired onto PageShell                                                                                                                                                            |
| **Maintenance** ✅ done | `Maintenance/ServiceIntelligencePage.jsx`       | 298 (was 468)                | `serviceIntelligence*` — wired onto PageShell/FilterBar/DataTable + Tabs, new columns/cells modules, +tests for format/KPI                                                                      |
|                         | `Maintenance/AddMaintenancePage.jsx`            | 289 — **no change needed**   | Already on `PageHeader`+`FormFooter` (the correct pattern for a _form_ page, not `PageShell`) and already under 400 lines. See note below.                                                      |
| **Profile**             | `Profile/ProfilePage.jsx` ✅ done               | 103 (was 445)                | `profile*` — split into `profileAtoms`/`profileCard`/`profileDetailsPanel`/`profileLocationsManager`, wrapped in PageShell                                                                      |
|                         | `Profile/VehicleDashboardPage.jsx`              | 443                          | `vehicleDashboard*`                                                                                                                                                                             |
|                         | `Profile/AddVehiclePage.jsx`                    | 415                          | ⚠️ Same situation as `AddMaintenancePage` — already uses `PageHeader`+`FormFooter`, confirmed by grep. Only over the line cap, not out of pattern. Needs a split, not a `PageShell` conversion. |
| **Reports**             | `Reports/reports/FuelComparisonReport.jsx`      | — (tab content, not a route) | `fuelComparisonReport*`                                                                                                                                                                         |
|                         | `Reports/reports/RefuelLogsReport.jsx`          | — (tab content, not a route) | `refuelLogsReport*`                                                                                                                                                                             |
|                         | `Reports/reports/MileageIntervalReport.jsx`     | — (tab content, not a route) | `mileageIntervalReport*`                                                                                                                                                                        |
|                         | `Reports/reports/TripReportDetailPage.jsx`      | 426                          | `tripReportDetail*`                                                                                                                                                                             |
|                         | `Reports/ReportsPage.jsx`                       | 120                          | already small — light touch only                                                                                                                                                                |
| **Mileage A**           | `MileageTracking/ModelComparisonPage.jsx`       | 501                          | `modelComparison*`                                                                                                                                                                              |
|                         | `MileageTracking/AdBlueTrackingPage.jsx`        | 440                          | `adblueTracking*`                                                                                                                                                                               |
|                         | `MileageTracking/AdBlueLogPage.jsx`             | 339                          | `adblueLog*`                                                                                                                                                                                    |
| **Mileage B**           | `MileageTracking/MileageIntervalDetailPage.jsx` | 377                          | `mileageInterval*`                                                                                                                                                                              |
|                         | `MileageTracking/MileageTrackingPage.jsx`       | 214                          | `mileageTracking*`                                                                                                                                                                              |
|                         | `MileageTracking/MileageFuelLogPage.jsx`        | 42                           | already small — light touch only                                                                                                                                                                |

`MileageTracking/MileageTrackingVehicleDetail.jsx` — **already converted, skip it**
(the coworker doc's own note about it being pending is stale; it uses `PageShell` now).

Also already earmarked with modules waiting to be wired in but not in the table above:
**`OwnerAlertsPage`** (419 lines) and **`FieldAgentFuel/FieldAgentFuelLogPage`** — do
these alongside Trip/Maintenance since the groundwork already exists for them.

**Do not touch:** `reports/TripLedgerReport.jsx`, `Trip/TripCreationFlow.jsx`,
`Trip/RefuelLogsPage.jsx`, `Trip/TripDetailSections.jsx`, `MileageTracking.css` —
already converted or explicitly shared/off-limits.

## 3. The conversion recipe — steps to follow for every page

1. Read the page. Separate **pure logic** (formatting, filtering, status/badge
   derivation, column defs) from **markup**.
2. Extract pure logic into its own module using the page's prefix
   (e.g. `tripManagementColumns.jsx`), with a test file beside it — rule 21/22.
3. **Never mix component exports and plain-function exports in one file** (rule 15,
   `react-refresh/only-export-components`). Components → a `*Cells.jsx` file.
   Pure functions → a `*Utils.js` / `*Columns.jsx` file.
4. Wire the page onto `PageShell` + `FilterBar` + `DataTable`. Reference
   implementations: `Drivers/BulkUploadDriversPage.jsx` (wizard-style),
   `Settings/FleetEdgeAccountsPage.jsx` (dense settings page).
5. Get it under 400 lines (rule 14). **Verify with `git show HEAD:<path> | wc -l`
   after committing**, not before — the prettier pre-commit hook re-wraps long lines
   and _increases_ line count. `FieldAgentFuelUploadPage.jsx` is the live example:
   it's still 492 lines despite its commit message claiming the cap was met.
6. If anything formats a date/time, pin `Asia/Kolkata` explicitly (see
   `FuelComparison/formatIST.js` or `FuelIntegrity/fiDates.js`) — a bare `dayjs` passes
   on an IST laptop and breaks Vercel's UTC build.
7. Run the full gate before every commit:
   ```
   npm run lint              # must be 0 errors
   TZ=UTC npx vitest run     # must all pass
   npx vite build
   node scripts/check-bundle.mjs
   ```
8. `git add <explicit files>` only — never `git add -A`. No `Co-Authored-By` in the
   commit message.

**Correction found while doing the Maintenance group:** not every "pending" file in §2
actually needs a `PageShell` conversion. `PageShell` is the pattern for _list/detail_
pages. Standalone _form_ pages (add/create screens) already have their own established
chassis — `PageHeader` + `FormFooter` (see `AddMaintenancePage.jsx`, `AddVehiclePage.jsx`,
`AddDriverPage.jsx`) — and `PageShell` doesn't fit them (no list, no filters, no footer
count). My original "40 pending" count in §1 was measured by grepping for `PageShell`
alone, which silently counted every already-correct form page as "pending." Before
converting any `Add*Page.jsx`, check whether it already imports `PageHeader`+`FormFooter`
first — if so, the only real work left is the line-count split (WS0.10), not a chassis
conversion (WS0.7). `AddMaintenancePage.jsx` needed zero changes for exactly this reason.

## 4. Extra pages I found that aren't on anyone's list yet

Checking every route directly (not just the handoff's named batch) turned up pages
that also need conversion eventually but aren't mentioned in any doc. Flagging rather
than quietly deciding scope myself:

| Page                                           | Lines | Note                                                                                                       |
| ---------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `Vehicle360/Vehicle360Page.jsx`                | 350   | real fleet page, not on any list                                                                           |
| `FleetAlerts/FleetAlertsPage.jsx`              | 232   | real fleet page, not on any list                                                                           |
| `DailyDigest/DailyDigestPage.jsx`              | 369   | real fleet page, not on any list                                                                           |
| `Locations/AddLocationPage.jsx`                | 373   | real fleet page, not on any list                                                                           |
| `Routes/AddRoutePage.jsx`                      | 185   | small, real fleet page                                                                                     |
| `Contact/ContactPage.jsx`                      | 147   | small, unclear if in scope (support/contact, not ops)                                                      |
| `AccessControl/AccessControlPage.jsx`          | 61    | thin tab container over `EnterpriseRolesTab`/`BranchAccessTab` — needs scoping, not a simple wire-in       |
| `KhataLedger/KhataLedgerDriverDetailPage.jsx`  | 10    | thin wrapper over shared `LedgerDetailView` — converting means touching the shared component, not the page |
| `KhataLedger/KhataLedgerVehicleDetailPage.jsx` | 10    | same as above                                                                                              |

**My read:** the first five are straightforward additions to the batch above once
§2's list is done. The last three need a judgment call (scope in/out, and the Khata
ones require editing a shared component) — worth a quick check with Devayan rather
than guessing.

---

## 5. After this plan — what's still left overall

Finishing every page above still only closes out one slice of one workstream. Once
this plan is done:

- **WS0.10 — file-size cleanup.** ~43 non-ERP files still over the 400-line cap,
  independent of whether they've been put on `PageShell` yet. Worst three not on any
  conversion list: `Superadmin/components/lemu/graph/LemuGraphTab.jsx` (1035),
  `Trip/TripDetailSections.jsx` (961), `RouteIntelligence/RouteIntelligencePage.jsx` (831).
- **Design (workstream H), steps 3–6 of 6 — none started:**
  - Step 3: restyle primitives (`src/components/ui/button.jsx`, `input.jsx`, etc.) to
    match `GNB Components.dc.html`.
  - Step 4: real dashboard widgets (_Fleet right now_, _Needs you today_, _Idling
    waste_, _Fuel spend_, _Cost per km_) with honest empty states — don't invent
    metrics no endpoint serves.
  - Step 5: restyle `PageShell`/`FilterBar`/`DataTable` **once**, centrally — every
    converted page inherits it automatically. Highest-leverage remaining design task.
  - Step 6: Settings / Trip Replay — only if time remains.
- **Workstream A — realtime/data truth. Barely started.** Only a backend compression
  fix landed. No SSE endpoint mounted on the frontend, no "is this fresh or stale"
  component, and 13 files still poll on `setInterval`.
- **Workstream B** — ungate 9 stranded backend prefixes. Not started.
- **Workstream D** — telematics compute. Overspeed, corridor-ETA and places/resolve
  are built and already have working frontend pages (`OverspeedPage`,
  `RouteProfitabilityPage`, `RouteIntelligencePage`). Idling and geomapping: not
  verified.
- **Workstream E** — routes: persist geometry, replay, 3-D truck. Not started.
- **Workstream F** — driver app background tracking + manager app. Not started.
- **Workstream G** — query/bundle optimisation beyond the existing bundle guard. Not
  started.
- **Mobile (WS0.11)** and **replay (WS0.12)** — not started.

**The standing tension (already raised once, repeating because it matters):** this
whole plan is workstream C, and C is being worked ahead of A and D against the
documented order in `OVERHAUL_MASTER_PLAN_2026-09-06.md` §2 — "make the data correct
and reachable first... do not reorder." That's a call for Devayan to make on
sequencing, not something to silently override by just continuing down this list.
