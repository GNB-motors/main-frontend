# Coworker handoff — GNB frontend chassis batch — 2026-09-06

**Shareable copy** — passwords removed; ask Devayan for the two logins.

Written for a human picking this up cold. Everything below was measured, not copied
from an earlier doc. Where a number came out different from what a previous note
claimed, the difference is called out rather than smoothed over.

---

## 1. Where things are

| | |
|---|---|
| Frontend repo | `f:\gnb\frontend\main-frontend` (app lives in the nested `frontend/` dir) |
| Branch | `revamp/frontend-audit-fixes` |
| HEAD | `f29cc4a`, pushed, level with origin, working tree clean |
| Backend repo | `f:\gnb\backend\main-backend`, branch `staging`, `443bcb7` |
| Dev API | `https://43.205.43.18.nip.io/v1` — live, and `443bcb7` is deployed to it |
| Dev server | `npm run dev` in `frontend/`, serves on `http://localhost:5173` |

**Logins**

- `test@gmail.com` / `<ask Devayan>` — normal user, org has 10 vehicles
- `superadmin@gnbedge.in` / `<ask Devayan>` — super admin

**Vercel** deploys this branch automatically. `VITE_API_BASE_URL` is already set correctly
in the Vercel project (`https://43.205.43.18.nip.io/v1`) — it is *not* read from the local
`.env`, which is gitignored.

## 2. Verified state right now

```text
eslint  0 errors / 886 warnings
vitest  619 passed (49 files)     ← run as TZ=UTC, see §6
build   ok
bundle  590,706 B <= 600,000 B    (9,294 B headroom)
```

The working tree is **clean and fully green**, and everything is pushed. You are
starting from a good state, not a broken one.

WS0.7 chassis: **28 of 70** non-ERP pages converted → **42 left**.
WS0.10: **43** non-ERP files still over 400 lines.
The 38 `Erp*` page directories are out of scope entirely — do not touch them.

## 2a. The whole project, and where it actually stands

**Read this before planning anything.** The chassis batch is one slice of one workstream.
`OVERHAUL_MASTER_PLAN_2026-09-06.md` §2 defines eight workstreams, A–H, and states plainly:

> The order is deliberate and is the user's own: make the data correct and reachable first,
> then compute what is missing, then build visual features on top, then optimise, and only
> then redesign. **Do not reorder** — redesigning screens whose data is still wrong is
> thrown-away work.

Verified state of each, measured on this branch today rather than read off a plan:

| WS | Scope | State |
|---|---|---|
| **A** | Transport & liveness (SSE, kill cold calls, freshness truth) | **Barely started.** Only the §A.6 compression blocker is fixed (`9dfffff`, backend). No SSE endpoint is mounted, no `DataEnvelope`, no `DataState` component, and **13 files still poll with `setInterval`** |
| **B** | Ungate the 9 stranded backend prefixes | Not started (not re-verified today) |
| **C** | Filters, sorting, saved views | **Primitives done** — `DataTable`, `FilterBar`, `useListQuery` all exist. This batch is its rollout: **28 of 70** pages |
| **D** | Telematics compute (overspeed, idling, ETA, geomapping) | **Partial.** overspeed, corridor-ETA and places/resolve were built and deployed to dev today; idling and geomapping not verified |
| **E** | Routes: persist geometry, replay, 3-D truck | Not started |
| **F** | Driver app background tracking + manager app | Not started |
| **G** | Query & bundle optimisation | Bundle guard in place, 9,294 B headroom. Otherwise not started |
| **H** | Redesign | Steps 1–2 done (tokens `44b4cc3`, neutral nav rail `30753f9`). Steps 3–6 remain |

**The tension you are inheriting, stated plainly:** C and H are being worked ahead of A, B
and D, which is the opposite of the documented order. That was the owner's call under
presentation pressure and it is not yours to silently reverse — but you should know that the
chassis and design work is being layered onto a data layer that still polls, still cannot tell
"no data" from "fresh data" (§1.2 of the master plan), and has no realtime transport at all.
If you finish the chassis rollout and the design and nothing else, the product will look
consistent and still mislead the person reading it. **Workstream A's truth model (A.7–A.9) is
the highest-value thing not currently being worked on**, and the master plan says it must be
done even if SSE itself slips.

Raise it with Devayan before you commit to an order. Don't just carry on down the batch
because the batch is what was handed to you.

## 3. What happened today

A 9-way parallel batch of chassis conversions was dispatched. **Seven of the nine died**
on a provider quota limit (`403 ... reached your 5-hour usage limit`) before touching
their page files. Two finished and are committed and pushed as `46d7c4c`:

- `Settings/FleetEdgeAccountsPage` 490 → 247 lines, six components + one tested pure module
- `Profile/BulkUploadVehiclesPage` 530 → 329 lines, three components + two pure modules

Everything before that is also pushed. Nothing is lost.

## 4. Groundwork that is committed but NOT yet wired

The seven dead agents left extracted modules behind without ever converting their page
files. That work is committed (`f29cc4a`) so it is not lost, but **nothing imports any of
it yet** — Vite tree-shakes it out, so the bundle is unaffected. Each still needs its page
converted before it does anything:

| Module | Waiting on |
|---|---|
| `Trip/tripManagementColumns` + `Cells` + `Utils` | `TripManagementPage.jsx` |
| `Maintenance/serviceIntelligenceFormat` + `Kpi` | `ServiceIntelligencePage.jsx` |
| `OwnerAlerts/ownerAlertsModel` | `OwnerAlertsPage` |
| `FieldAgentFuel/fieldAgentFuelLogUtils` | `FieldAgentFuelLogPage` |

The Trip set is the most complete and the best place to start: `buildTripManagementColumns`
already mirrors both of that page's column sets (weight-slip trips and refuel journeys)
faithfully. `TripManagementPage.jsx` currently renders its own `<Table>` markup inline and
duplicates the status-badge cell twice; wiring the columns module in is most of that
conversion.

One fix was needed on the way in, worth knowing because it is easy to repeat:
`tripManagementColumns.jsx` defined `StatusBadge` and `DateCell` while exporting only
`buildTripManagementColumns`, a plain function. `react-refresh/only-export-components`
rejects that mix, and it was the sole reason the repo sat at 2 lint errors. The components
now live in `tripManagementCells.jsx` — a file exports components or non-components, never
both (rule 15).

## 5. The remaining batch — what was asked for, minus what got done

Still to convert, each to end under 400 lines. Prefix any new module files distinctly so
parallel agents don't collide (this is why the prefixes are specified):

| Group | Files | Prefix |
|---|---|---|
| Profile | `ProfilePage.jsx` (445), `VehicleDashboardPage.jsx` (443), `AddVehiclePage.jsx` (415) | `profile*`, `vehicleDashboard*`, `addVehicle*` |
| Reports | `reports/FuelComparisonReport.jsx` (586), `reports/RefuelLogsReport.jsx` (501), `reports/MileageIntervalReport.jsx` (474), `reports/TripReportDetailPage.jsx` (426), `ReportsPage.jsx` (120) | `fuelComparisonReport*` etc. |
| Mileage A | `ModelComparisonPage.jsx` (501), `AdBlueTrackingPage.jsx` (440), `AdBlueLogPage.jsx` (339) | `modelComparison*`, `adblueTracking*`, `adblueLog*` |
| Mileage B | `MileageIntervalDetailPage.jsx` (377), `MileageTrackingVehicleDetail.jsx` (328), `MileageTrackingPage.jsx` (214), `MileageFuelLogPage.jsx` (42) | `mileageInterval*`, `mileageVehicleDetail*`, `mileageTracking*`, `mileageFuelLog*` |
| Maintenance | `ServiceIntelligencePage.jsx` (468), `AddMaintenancePage.jsx` (289) | `serviceIntelligence*`, `addMaintenance*` |
| Trip | `TripManagementPage.jsx` (330), `TripDetailPage.jsx` (202) | `tripManagement*`, `tripDetail*` |

Do **not** touch `reports/TripLedgerReport.jsx` (already converted),
`Trip/TripCreationFlow.jsx`, `Trip/RefuelLogsPage.jsx`, `Trip/TripDetailSections.jsx`, or
`MileageTracking/MileageTracking.css` (shared).

`BulkUploadDriversPage.jsx` in `pages/Drivers/` is the reference implementation for a
wizard-style conversion. `FleetEdgeAccountsPage.jsx` is the reference for a dense
settings page.

**Also still over the cap and not on the original list** — the biggest offenders are
`Superadmin/components/lemu/graph/LemuGraphTab.jsx` (1035), `Trip/TripDetailSections.jsx`
(961), `RouteIntelligence/RouteIntelligencePage.jsx` (831).

## 6. ⚠️ Four landmines that will cost you hours

**1. Run tests as `TZ=UTC npx vitest run`.** This laptop is IST; Vercel builds in UTC.
Anything that renders a wall clock through bare `dayjs` passes locally and fails the
Vercel build. That happened today — `etaBand.test.js` failed with a 5h30m offset and
blocked the deploy. Fixed in `472e85b` by pinning `Asia/Kolkata`, matching the existing
pattern in `pages/FuelComparison/formatIST.js` and `pages/FuelIntegrity/fiDates.js`.
If you add date formatting, pin IST the same way.

**2. Measure line counts AFTER committing, not before.** The husky/lint-staged hook runs
`prettier --write`, which re-wraps long lines and *increases* line count. It bit us:
`FieldAgentFuelUploadPage.jsx` measured 329 lines before commit and landed at **492** —
still over the 400 cap, even though commit `813c5b1` claims it satisfies rule 14. **That
page still needs splitting.** Verify with `git show HEAD:<path> | wc -l`.

**3. The Mongo database is `test`, not `express-msc-db`.** `docker-compose.yml` defaults
`MONGO_URI` to `express-msc-db`; that database exists and is completely empty, so every
collection returns 0 and it looks like the feature is broken. Cross-check against a
collection you know has data — `vehicles` is 0 in `express-msc-db` and 27 in `test`.

**4. The demo org has zero telemetry.** `livevehiclepositionhistories` holds 77,141
breadcrumbs, but all 10 vehicles under `test@gmail.com` return 0 trail points across all
of 2026 — the data belongs to a different org. `trips` and `arrivalevents` are 0 org-wide.
So live tracking, overspeed, corridor ETA and anything replay-shaped render **empty** on
that login. That is the data, not the CSS. Don't "fix" it in the frontend.

## 7. Rules that are actually enforced

Read `f:\gnb\WORKING_RULES_2026-09-06.md` and `frontend/CLAUDE.md` (26 numbered rules).
The ones that bite most often:

- **20** — `npm run lint` at 0 errors before any commit.
- **14** — files under 400 lines. **26** — the bundle budget only goes down, never raise it.
- **19** — every route is `React.lazy()`.
- **21/22** — new logic goes in a pure `.js` module with tests beside it; a bugfix starts
  with a failing test.
- **Never `git add -A`.** Multiple agents share this working tree; a broad add sweeps up
  someone else's half-written files. Stage explicit paths, and check
  `git diff --cached --stat` before every commit.
- **No `Co-Authored-By` or AI attribution** in commit messages. Standing owner preference.

**The gate, run all of it before every commit:**

```bash
cd f:\gnb\frontend\main-frontend\frontend
npm run lint              # MUST be 0 errors; ~886 warnings are expected
TZ=UTC npx vitest run     # 619 passing as of this handoff
npx vite build
node scripts/check-bundle.mjs
```

## 8. Bundle budget — where the headroom actually goes

`check-bundle.mjs` fails the build above **600,000 B** on the entry chunk. Measured costs:

- Converting an existing page: **+49 B**. A brand-new page with route and nav: **+382 B**.
- Shell-level work (command palette, sidebar gradient, dialog provider) cost **+8,056 B**
  in one session.
- **CSS costs zero** against this budget — Vite emits stylesheets separately
  (`index-*.css` alone is 187 KB and sits outside the guard).

So page conversions are effectively free; the 9,294 B of headroom is there for shell and
design work, not for this batch.

## 9. Open items not covered above

- `main-frontend-wine.vercel.app/login` was showing an older design (dark maroon panel).
  Confirm the Vercel project tracks `revamp/frontend-audit-fixes` before pointing anyone
  at that URL.
- Two stale worktrees: `backend/main-backend-wa` and `backend/wt-p0` track remote branches
  marked `[gone]`, each with a dirty file. Unrelated to this batch.
- Design workstream H (steps 3–6: primitives, dashboard widgets, list template, settings)
  is untouched and documented separately in
  `HANDOFF_WORKSTREAM_H_2026-09-06_SESSION2.md`. Step 5 — restyle
  `PageShell`/`FilterBar`/`DataTable` once — is the highest-leverage remaining design task
  because every converted page inherits it.
