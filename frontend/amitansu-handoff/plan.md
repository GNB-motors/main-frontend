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

| Group                   | File                                                    | Lines now                    | Prefix for new modules                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trip** ✅ done        | `Trip/TripManagementPage.jsx`                           | 231 (was 330)                | `tripManagement*` — wired onto PageShell/FilterBar/DataTable, +test for the utils module                                                                                                                                                    |
|                         | `Trip/TripDetailPage.jsx`                               | 192 (was 202)                | `tripDetail*` — wired onto PageShell                                                                                                                                                                                                        |
| **Maintenance** ✅ done | `Maintenance/ServiceIntelligencePage.jsx`               | 298 (was 468)                | `serviceIntelligence*` — wired onto PageShell/FilterBar/DataTable + Tabs, new columns/cells modules, +tests for format/KPI                                                                                                                  |
|                         | `Maintenance/AddMaintenancePage.jsx`                    | 289 — **no change needed**   | Already on `PageHeader`+`FormFooter` (the correct pattern for a _form_ page, not `PageShell`) and already under 400 lines. See note below.                                                                                                  |
| **Profile**             | `Profile/ProfilePage.jsx` ✅ done                       | 103 (was 445)                | `profile*` — split into `profileAtoms`/`profileCard`/`profileDetailsPanel`/`profileLocationsManager`, wrapped in PageShell                                                                                                                  |
|                         | `Profile/VehicleDashboardPage.jsx` ✅ done              | 187 (was 443)                | `vehicleDashboard*` — wired onto PageShell/FilterBar/DataTable, +test for the logic module                                                                                                                                                  |
|                         | `Profile/AddVehiclePage.jsx` ✅ done                    | 298 (was 415)                | Confirmed already on `PageHeader`+`FormFooter` — split only (doc mapping, import dialog, location fields), no `PageShell`. +test for the doc-mapping module.                                                                                |
| **Reports**             | `Reports/reports/FuelComparisonReport.jsx`              | — (tab content, not a route) | `fuelComparisonReport*`                                                                                                                                                                                                                     |
|                         | `Reports/reports/RefuelLogsReport.jsx`                  | — (tab content, not a route) | `refuelLogsReport*`                                                                                                                                                                                                                         |
|                         | `Reports/reports/MileageIntervalReport.jsx`             | — (tab content, not a route) | `mileageIntervalReport*`                                                                                                                                                                                                                    |
|                         | `Reports/reports/TripReportDetailPage.jsx` ✅ done      | 120 (was 426)                | `tripReportDetail*` — split (map, cards, format+test); **kept its own bespoke report header, did not force PageShell** — see note below                                                                                                     |
|                         | `Reports/ReportsPage.jsx` ✅ **no change needed**       | 120                          | Already small, and it's a sidebar+content shell (`ReportsSidebar` + a report switcher), not a list/form page — `PageShell` doesn't fit its shape any better than it fits a settings nav. Confirmed by reading it, not just measuring lines. |
| **Mileage A** ✅ done   | `MileageTracking/ModelComparisonPage.jsx`               | 164 (was 501)                | `modelComparison*` — logic+test, cells, two chart components, PageShell. Table stayed a plain `<table>` (see note)                                                                                                                          |
|                         | `MileageTracking/AdBlueTrackingPage.jsx` ✅ done        | 256 (was 440)                | `adblueTracking*` — wired onto PageShell/FilterBar/DataTable, logic+test, cells, columns, modals extracted                                                                                                                                  |
|                         | `MileageTracking/AdBlueLogPage.jsx` ✅ done             | 342 (was 339, +prettier)     | `adblueLog*` — form page onto PageShell (mirrors `FieldAgentFuelUploadPage`'s `mileage-form-page` pattern); vehicle/driver pickers unified into one reusable `SearchableEntityDropdown`                                                     |
| **Mileage B**           | `MileageTracking/MileageIntervalDetailPage.jsx` ✅ done | 332 (was 377, +prettier)     | `mileageInterval*` — detail view onto PageShell, format+test, cells extracted                                                                                                                                                               |
|                         | `MileageTracking/MileageTrackingPage.jsx` ✅ done       | 154 (was 214)                | `mileageTracking*` — wired onto PageShell/FilterBar/DataTable, logic+test, cells, columns                                                                                                                                                   |
|                         | `MileageTracking/MileageFuelLogPage.jsx` ✅ done        | 45 (was 42, light touch)     | Nothing to extract — just wired its existing header onto `PageShell` (same `mileage-form-page` pattern as `AdBlueLogPage`)                                                                                                                  |

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

**Second correction, found doing `TripReportDetailPage.jsx`:** a third category exists
besides "list page → PageShell" and "form page → PageHeader+FormFooter" — a page that
already has its own bespoke, intentionally-designed header (not a shared chassis
component at all). `TripReportDetailPage.jsx` had a custom `trip-detail-header` with its
own CSS, clearly meant to look like a report/printable view, distinct from the ops-page
look. I did **not** replace it with `PageShell` — that would be a visual redesign
decision nobody asked for, not a structural refactor. I only split it (map, cards,
format+test) to get under 400 lines, keeping its existing header pixel-for-pixel. Same
call for `ReportsPage.jsx`: it's a sidebar+content shell, and `PageShell` has no slot for
that shape either, so it got zero changes. **If you actually want the Reports section
visually unified with the rest of the app, that's a real decision to raise with
Devayan/the design workstream (H) — it's not implied by "convert this page."**

**Third instance, `ModelComparisonPage.jsx`'s summary table:** kept as a plain `<table>`
rather than `DataTable`. Its rows carry a "selected model" highlight driven by the charts
above it, and `DataTable` has no per-row className slot for that — using it would have
silently dropped that visual feedback. Same underlying rule as the other two notes: don't
let a structural refactor quietly delete a working interaction because the shared
component doesn't happen to support it yet. If `DataTable` grows a `rowClassName` prop
later, this table is the one to revisit.

## 4. Extra pages I found that aren't on anyone's list yet

Checking every route directly (not just the handoff's named batch) turned up pages
that also need conversion eventually but aren't mentioned in any doc. Flagging rather
than quietly deciding scope myself:

| Page                                              | Lines                            | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Vehicle360/Vehicle360Page.jsx` ✅ done           | 123 (was 350, split 5 ways)      | Already used a _fourth_ chassis family — `cluster-panel`/`PanelErrorBoundary`/`FreshnessBadge`/`DataArcGauge` (predates PageShell, added 2026-08-17). Its siblings `CompliancePage`/`AuditTrailPage`/`FuelSpendPage` already wrap that content in `PageShell`; this one hadn't been yet. Wrapped it the same way, then split the 8 panels into `vehicle360PanelsA/B.jsx` + `vehicle360Atoms.jsx` + `vehicle360Logic.js` (tested) once prettier pushed the merged file to 513 lines. |
| `FleetAlerts/FleetAlertsPage.jsx` ✅ done         | 237 (was 232)                    | Same `cluster-*` family as Vehicle360 — wrapped in `PageShell`, and its filter-chip row now uses the shared `FilterBar` (its true sibling `CompliancePage` already does this for the identical shape: single-select chips + a search box)                                                                                                                                                                                                                                           |
| `DailyDigest/DailyDigestPage.jsx` ✅ done         | 206 (was 369, was 548 pre-split) | Shares the `ov-*` (Overview) component family via `overview.primitives.jsx` — followed `OverviewPage`'s own precedent of dropping the old wrapper div once `PageShell` owns the container. Split into `dailyDigestLogic.js` (action/activity/upcoming assembly, tested) + `dailyDigestCards.jsx`                                                                                                                                                                                    |
| `Locations/AddLocationPage.jsx` ✅ done           | 226 (was 373, was 452 pre-split) | Form+map split-view, had no chassis at all — added `PageHeader` (matching every other `Add*Page`). Split into `addLocationLogic.js` (geocode-result parsing, tested), `AddLocationFormFields.jsx`, `AddLocationMap.jsx`                                                                                                                                                                                                                                                             |
| `Routes/AddRoutePage.jsx` ✅ **no change needed** | 185                              | Already on `PageHeader`+`FormFooter` (its own local copy), already under 400. Fourth instance of the "already-correct pattern" finding.                                                                                                                                                                                                                                                                                                                                             |
| `Contact/ContactPage.jsx`                         | 147                              | small, unclear if in scope (support/contact, not ops) — not done, still needs a scope decision                                                                                                                                                                                                                                                                                                                                                                                      |
| `AccessControl/AccessControlPage.jsx`             | 61                               | thin tab container over `EnterpriseRolesTab`/`BranchAccessTab` — needs scoping, not a simple wire-in                                                                                                                                                                                                                                                                                                                                                                                |
| `KhataLedger/KhataLedgerDriverDetailPage.jsx`     | 10                               | thin wrapper over shared `LedgerDetailView` — converting means touching the shared component, not the page                                                                                                                                                                                                                                                                                                                                                                          |
| `KhataLedger/KhataLedgerVehicleDetailPage.jsx`    | 10                               | same as above                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Correction to §5 below, found while converting Vehicle360:** the claim that no
"is this fresh or stale" component exists for workstream A is **wrong** —
`components/cluster/FreshnessBadge.jsx` has existed since 2026-08-17 (predates `PageShell`
itself) and is already used on `Vehicle360Page`, `OverspeedPage` and others. What's still
actually missing for workstream A is the SSE transport and the `setInterval`→push
migration, not a freshness-display primitive. Don't re-build `FreshnessBadge` — reuse it.

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
  fix landed. No SSE endpoint mounted on the frontend, and 13 files still poll on
  `setInterval`. **Correction:** a "fresh or stale" primitive does already exist —
  `components/cluster/FreshnessBadge.jsx` — and is used on `Vehicle360Page`,
  `OverspeedPage` and others. What's missing is the SSE transport and migrating the
  polling files onto it, not the freshness display itself.
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
