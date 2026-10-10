# 04 — Architecture & Code Quality

Scope: folder/convention consistency, duplication, god files, dead code, styling, state management — measured against CLAUDE.md (one component per file; files < 400 lines; one export per file; UI from `components/ui/`; logic in pure `.js` with tests).

**State-management note (not a defect):** No Redux/Zustand/react-query. Cross-cutting state = 5 React contexts (`BranchContext`, `FeatureFlagsContext`, `TripCreationContext`, `Profile/ProfileContext`, `ui/confirmContext`) + server-cache-via-`useApi` + a disciplined `utils/session.js` localStorage gateway (ESLint-enforced). This is reasonable and is the **best-governed** part of the codebase. The one real limitation — `useApi` has no cross-component request cache — is what inflates the bespoke loading/error state inside the god components below; a shared cache (long-term) would shrink them.

---

## P1

### ARCH-1 — Two competing "canonical" money/number formatters that overlap function-for-function
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `utils/formatMoney.js` (82 LOC, 13 importers), `utils/formatters.js` (111 LOC, 64 importers), `utils/dataFormatters.js` (19 LOC, 1 importer)
- **Evidence:** Both headers claim to be the single source of truth (`formatMoney.js:2`, `formatters.js:1`). Overlapping pairs: `inr()` vs `formatINR()`; `compactInr()` vs `formatInrCompact()`; `num()` vs `formatNum()`; `pct()` vs `formatPct()`. The two compact formatters **disagree on output** (`₹4.20 Cr` with a space vs `₹3.4Cr` with a Unicode minus, no space) — so the same amount renders differently depending on which a screen imported.
- **Root cause:** `formatMoney.js` was lifted from a deleted `CommandCenterPage`; `formatters.js` written independently; neither retired.
- **Impact:** Inconsistent currency across screens; new code picks by coin-flip; `dataFormatters.js` is near-dead yet its `getDriverName`/`getVehicleRegistration` logic is re-implemented inline elsewhere.
- **Fix:** Keep `formatters.js` (64 importers); temporarily re-export its names as aliases from `formatMoney.js`, codemod the 13 importers, delete `formatMoney.js`, fold in `dataFormatters.js`'s 3 helpers.

### ARCH-2 — God components: 108 app files over the 400-line cap (rule 14), several mixing 4+ concerns
- **Priority:** P1 · **Effort:** L · **Confidence:** Confirmed
- **Worst offenders (all a single `export`, so the bulk is private sub-structure):**
  - `pages/LiveTracking/LiveTrackingPage.jsx` — 2,052 LOC, 21 `useState`, 12 `useEffect`, inline sub-components, raw `apiClient`
  - `pages/Geofence/GeofenceZonesPage.jsx` — 1,542 LOC, 23 `useState`
  - `pages/Trip/RefuelLogsPage.jsx` — 1,516 LOC, 18 `useState`, 5 raw `apiClient`, uses *both* `dayjs` and `dateUtils`
  - `components/FuelLogForm/FuelLogForm.jsx` — 863 LOC, 19 `useState`, 10 `useEffect`, 5 raw `apiClient`
  - Also > 1,000 LOC: `GeofencePage.jsx` (1,417), `WhatsAppAuditPage.jsx` (1,404), `ReceiptApprovalPage.jsx` (1,359), `RouteIntelligencePage.jsx` (1,172), `PlaceHubPage.jsx` (1,081), `ErpPlacement/PlacementBoardPage.jsx` (1,001)
- **Evidence:** 23 `useState` in one component also breaks rule 5 (> 8 → `useReducer`). These files co-locate data fetching, derived state, business logic, inline sub-components, and modal/drawer JSX.
- **Impact:** Unreviewable diffs, merge conflicts, no unit-test seam for logic buried in JSX (feeds the testing gap, [`07-testing.md`](07-testing.md)).
- **Fix:** Extract pure logic to `.js` + tests (rule 21), lift inline sub-components to their own files, move fetching behind `useApi`, model modal state as the rule-6 discriminated union. **Template already in-repo:** `pages/Maintenance/serviceIntelligence*` and `lemu/graph/` (Page.jsx + Logic.js + Cells.jsx + Columns.jsx + tests).

### ARCH-3 — `novaDigestComponents.jsx`: 15 exported components in one 1,915-line file (rules 14 + 15)
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/DailyDigest/novaDigestComponents.jsx` (imported only by `DailyDigestPage.jsx`)
- **Evidence:** 15 `export function` components in one file — `NdKpiStrip` (225), `NdAttentionCard` (299), `NdImpactCard` (487), `NdCalendarCard` (649), `NdRefuelCard` (1019), `NdWasteTable` (1137), `NdMorningBrief` (1327), `NdUpcomingCard` (1394), `NdOpsRow` (1561), `NdLeaderboardCard` (1682), `NdVehicleDrawer` (1705), + 4 skeletons. Clearest violation of both one-component-per-file and one-export-per-file.
- **Impact:** 1,900-line file re-parsed as a unit; impossible to lazy-split; cards un-testable in isolation.
- **Fix:** One file per `Nd*` component under `pages/DailyDigest/components/`, re-export via an index if a barrel is wanted.

### ARCH-4 — Service/model placement follows three different, unenforced conventions
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed
- **Evidence:**
  - **Services:** `services/` (21 central) vs ~66 colocated `*Service.*` in page folders; extension split is **43 `*Service.jsx` vs 42 `*Service.js`**. A third pattern exists: `pages/Trip/services/TripService.js` (a `services/` subfolder inside a page). Central even has a `.jsx` service (`services/GeofenceService.jsx`).
  - The `.jsx` services contain **zero JSX and zero React imports** — verified `ErpCallService.jsx` (178 LOC, 0/0), `DriverService.jsx` (261 LOC, 0/0), `AdvanceService.jsx` (184 LOC, 0/0). Pure logic modules mislabeled `.jsx`, contravening rule 21.
  - **Schemas** are fully centralized (`schemas/`, 23 files, zero colocated); **models** are fully colocated (`autoTripModel.js`, `placeHubModel.js`, `ownerAlertsModel.js`, `lemu/graph/drawerModel.js`, …) — `models/` doesn't exist. So three sibling concepts follow three different placement rules.
- **Impact:** Readers can't predict where a service lives or what an extension means; fast-refresh/lint presets that key off `.jsx` misfire on non-component files.
- **Fix:** Pick one home (recommend colocated-by-feature — already the majority), rename logic-only `*Service.jsx` → `.js`, document the rule, add `no-restricted-imports` banning `apiClient`/`axios` outside the data layer.

---

## P2

### ARCH-5 — ERP module sprawl: 24 `Erp*` dirs with a shared kit that's only half-adopted
- **Priority:** P2 · **Effort:** L · **Confidence:** Confirmed
- **Files:** 24 dirs `pages/ErpAccounts … pages/ErpVendorPayments`; shared kit `components/Erp/` (24 files: `PageShell`, `ErpTable`, `RegisterTable`, `DateRangeFilter`, `StatTile`, `StatusBadge`, `MoneyCell`, …)
- **Evidence:** `PageShell` imported by 27 files (healthy), but `ErpTable` by only **4** and `RegisterTable` by **1** — most ERP list pages hand-roll their table. `ErpAdvances/AdvancesPage.jsx` (656 LOC) imports nothing from `components/Erp/` and defines its own pagination (`:47`, `:300-305`); `ErpSaleBills/SaleBillsPage.jsx` (656) imports only `PageShell`+`StatusBadge` and paginates differently (`limit:50`, no `meta`); `ErpSupplierPayments/SupplierPaymentsPage.jsx` (648) mirrors SaleBills. Three near-identical ~650-LOC "fetch list → filter by status → table → drawer" pages re-implement filter + pagination + status-tone maps independently; `useListQuery`/`useErpList` exist but aren't used here.
- **Impact:** ~15× duplicated list scaffolding; a pagination/status change must be made per page; the kit's `ErpTable`/`RegisterTable` are near-dead.
- **Fix:** One `ErpListPage` scaffold (header + filter + `ErpTable` + pagination + drawer slot) driven by a column/filter config; migrate register-style pages onto it; retire per-page pagination state. **Highest-leverage architecture change** — it shrinks the most code and is the template for de-godding ARCH-2.

### ARCH-6 — Three parallel styling systems with no boundary
- **Priority:** P2 · **Effort:** L · **Confidence:** Confirmed
- **Evidence:** 116 `.css` files; 201 `import '…css'` statements; Tailwind `className` in 477 files; inline `style={{…}}` **5,515 times across 387 files**; `index.css` alone is 89 KB. Many files mix all three.
- **Impact:** No single place to change a token; theming/dark-mode (`colorTheme.js` + `erpChartTheme.js`) must be chased across CSS, classes, and inline literals; inline styles defeat Tailwind's purge/consistency (and cause re-render churn — see 01 PERF-9).
- **Fix:** Declare Tailwind + `components/ui` the default; allow CSS files only for global/vendor styles; lint against `style={{}}` except for computed values.

### ARCH-7 — Two date/time systems coexist
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `utils/dateUtils.js` (native `Intl` + `Asia/Kolkata`, 47 importers) vs **28** files importing `dayjs`
- **Evidence:** `dateUtils.js:2` mandates "ALL display formatting… should go through this file… Never use `new Date(x).toLocaleDateString()` directly", yet 28 files use `dayjs`, and `RefuelLogsPage.jsx` + `PlaceHub/PlaceHubDrawer.jsx` import **both**. `dateUtils` has no parse/arithmetic helpers — which is why pages reach for `dayjs`. So the two aren't redundant, they're an incomplete split.
- **Impact:** Timezone bugs (dayjs defaults to browser-local unless `.tz()`) on the surfaces `dateUtils` exists to protect; a dependency carried for what `Intl`/`dateUtils` could do.
- **Fix:** Extend `dateUtils` with IST-pinned parse/add/diff helpers, codemod `dayjs` call sites, drop the dep (rules 25/26).

### ARCH-8 — Raw `apiClient`/`axios` in ~39–40 non-service components (rule 8)
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Evidence:** 40 real page/component files (excluding `*Service*`) import `apiClient`/`axios` directly, e.g. `CallSchedulesPage.jsx`, `MileageTrackingPage.jsx`, `settingsWhatsApp.jsx`, `ReceiptApprovalPage.jsx`, `LoginPage.jsx`, and the god components (`RefuelLogsPage`, `FuelLogForm`, `LiveTrackingPage`). Bypasses abort (rule 9), typed `ApiError` (rule 12), likely zod (rule 10).
- **Fix:** Route through `useApi`/`useMutation`; add `no-restricted-imports` banning `apiClient`/`axios` outside `services/` + `*Service.*`. (Full behavioral detail in [`02-api-integration.md`](02-api-integration.md).)

### ARCH-9 — Dead code: the entire Geofence feature is orphaned (~4,072 LOC) but still in `src/`
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/Geofence/GeofencePage.jsx` (1,417), `GeofenceZonesPage.jsx` (1,542), `AddZoneDrawer.jsx` (670), `UnknownTerritoryDrawer.jsx` (443) + 3 CSS; plus `services/GeofenceService.jsx` (only referenced by these pages).
- **Evidence:** In `App.jsx` the imports are **commented out** (`:168-169`) and the routes **redirect away** (`/geofence`, `/geofence/zones`, `/geofence-zones`, `/geofence/alerts` → `/live-tracking`, `:462-465`). A grep for live (non-commented) imports of `GeofencePage`/`GeofenceZonesPage` returns **none** — the only references are the commented imports + doc-comment mentions in `GeofenceService.jsx`. So the feature is unreachable but still linted/parsed and sitting in the tree. (Note: these files still consume the two Geofence perf findings in [`01-performance.md`](01-performance.md) — those apply if the feature is ever re-enabled; if it's truly dead, delete instead of fixing.)
- **Impact:** ~4k LOC of confusing dead code; two of the heaviest rendering problems in the audit live in code that doesn't ship.
- **Fix:** Decide — re-enable (then fix PERF-1/2) or delete the `pages/Geofence/` dir + `GeofenceService.jsx` + the redirect routes. (`quarantine/` is the existing home for recovery-kept pages and is already ESLint-ignored — move them there if unsure.)

---

## P3

### ARCH-10 — Near-dead utilities
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed (usage) / Hypothesis (dead-ness)
- **Evidence:** `utils/dataFormatters.js` (1 importer — folds into ARCH-1); `utils/bulkEmployees.js` (1 importer). No `src/` `quarantine/` and no `mockdata` references remain (both already cleaned). `TODO/FIXME/HACK/DEPRECATED` total only **8** across the tree — markedly clean.
- **Fix:** Fold `dataFormatters` into the unified formatter; confirm `bulkEmployees` is still wired to a live screen or remove.

### ARCH-11 — Minor rule leaks
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Evidence:** `console.log` in ~10 non-test files (rule 24 — build strips it, but should be `utils/logger.js`; see also [`05-security-reliability.md`](05-security-reliability.md) SEC-11 for the ~246 total `console.*` incl. PII). `components/ui/DataTable.jsx` touches `localStorage` directly (rule 11 — the single real violation outside `session.js` + tests).
- **Fix:** `console.*` → `logger`; route `DataTable`'s column/pref persistence through `session.js` `getPref`/`setPref` (which already exist, `session.js:136-138`).

---

## Summary

| # | Finding | Pri | Effort |
|---|---------|-----|--------|
| ARCH-1 | Duplicate money formatters (inconsistent ₹ output) | P1 | M |
| ARCH-2 | 108 files > 400 LOC; god components, 4+ concerns | P1 | L |
| ARCH-3 | `novaDigestComponents.jsx` — 15 components / 1 file | P1 | M |
| ARCH-4 | Service/model placement = 3 conventions; `.jsx` logic files | P1 | M |
| ARCH-5 | 24 ERP dirs; shared kit half-adopted, scaffolding duplicated | P2 | L |
| ARCH-6 | 3 styling systems (5,515 inline styles) | P2 | L |
| ARCH-7 | Two date systems (`dateUtils` vs `dayjs`×28) | P2 | M |
| ARCH-8 | Raw `apiClient` in ~40 components | P2 | M |
| ARCH-9 | Orphaned Geofence feature (~4,072 LOC) in `src/` | P2 | S |
| ARCH-10 | Near-dead utils | P3 | S |
| ARCH-11 | `console.log`×10; `DataTable` direct localStorage | P3 | S |

**Highest-leverage sequence:** ARCH-4 + ARCH-1 (set conventions, kill the formatter fork) → ARCH-5 (build the `ErpListPage` scaffold — the single abstraction that shrinks the most code and is the de-godding template for ARCH-2).
