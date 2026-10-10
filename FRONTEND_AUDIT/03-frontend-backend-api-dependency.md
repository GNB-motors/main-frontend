# 03 — Frontend ↔ Backend API Dependency Audit

Purpose (per request): identify where the frontend makes **excessive, duplicate, unnecessary, or inefficient API calls**, map which endpoints are called and how often, and **cleanly separate**:
- **Bucket A — Frontend-fixable** (duplicate requests, unnecessary refetching, missing debounce, eager/hidden fetches, over-broad refetch).
- **Bucket B — Backend-investigation** (slow responses, over-fetching, missing server-side pagination/filtering). **These are documented only — no backend code was read or changed, and no backend refactoring is prescribed beyond "what to investigate."**

> **Slow-path signal:** `utils/axiosConfig.js:26-46` lists `SLOW_PATH_PREFIXES` — endpoints the frontend already grants a **90s** timeout (`SLOW_TIMEOUT`) instead of the 30s default. That list is the frontend's own admission these reads are heavy; it seeds Bucket B.

---

## Endpoint dependency map

Trigger legend: **M** on-mount · **P** interval poll · **A** user-action · **K** per-keystroke · **BR** re-fires on branch switch (remount).

| Endpoint (prefix) | Triggered by (file:line) | Trigger | Slow-path? | Redundancy / note |
|---|---|---|---|---|
| `GET /api/auth/me` | `contexts/FeatureFlagsContext.jsx:39` (primary) | M (gated `isAuthenticated()`) + on `branchChange` (`:74-78`) | no | **Single source of truth** — `DashboardLayout.jsx:40-44` reuses the payload (good). **But duplicated** by `Profile/ProfileService.jsx:6,27` (ProfilePage/ProfileContext) and by the **unused** `utils/featureFlagRoutes.js:53`. |
| `GET /api/vehicles?limit=500/1000` | `VehicleReport.jsx:36`; `LiveTrackingPage.jsx:301`; `Mileage/mileageApi.js:43`; `FieldAgentFuelService.js:34`; `OverspeedService.js:26`; `MovementApprovalsPage.jsx:56`; `RefuelLogsPage.jsx:446`; +~24 sites | M **BR** | no | **Biggest redundant-fetch pattern** — full fleet pulled for `{id, registrationNumber}` dropdowns, no shared cache. |
| `positions` SSE + `GET /api/livetracking/positions` (REST) | `useLivePositions`→`useLiveData.js:85-99`; consumers `LiveTrackingPage`, `GeofencePage:300`, `GeofenceZonesPage:355`, `PublicTrackingPage:116` | M (stream) + P 45s (degraded) + on reconnect | **yes** | Stream transport is a singleton (no duplicate sockets), but each consumer runs its own REST `initialFetch`; not abortable (02 API-4). |
| `GET /api/owner-value/*` (money, downtime-risk, utilization, fuel-efficiency, refuelling-today, fleet-calendar, health-score, morning-brief) | `DailyDigest/DailyDigestPage.jsx:49-62` via `OwnerValueService` | M (8 parallel) **BR** | **yes** | **8 slow requests fan out on one dashboard mount**, all re-fire on branch switch. |
| `GET /api/mileage/fleet-overview` | `MileageTrackingPage.jsx:74` | M + **K (no debounce)** + page **BR** | **yes** | Request storm per keystroke to a 90s endpoint (02 API-7). |
| `GET /api/route-intelligence/*` (sites, corridors, deviations, arrivals) | `RouteIntelligencePage.jsx:607,613,623,636` | M (all 4) **BR**; pagination A | **yes** | All 4 tabs fetch on mount though only one is visible → 3 slow requests for hidden tabs. |
| `GET /api/reports/*` | `Reports/reports/*` + `Mileage/mileageApi.js` via `ReportsService` | M + filter A **BR** | **yes** | Each report page *also* fires its own `/api/vehicles?limit=1000` dropdown. |
| `GET /api/whatsapp/admin/drafts` (+ `/counts`) | `ReceiptApprovalPage.jsx:250,253` | M + status-tab A + manual refresh **BR** | no | No abort; status-switch race (02 API-6); client filters over a 200-cap (Bucket B). |
| `GET /api/whatsapp/settings` | `settingsWhatsApp.jsx:33` **and** `ReceiptApprovalPage.jsx:215` | M | no | Two components fetch the same settings doc independently; also already on `organization.whatsappSettings` from `/api/auth/me`. |
| Fleet health + fleet dashboard | `components/cluster/CommandPalette.jsx:53-60` | M (always, ungated) | heavy | Eager on every session for a palette most users never open (01 PERF-5). |
| `GET /api/fuel-logs`, `/unified` | `RefuelLogsPage.jsx:97,178` | M + A + **K (400ms debounce ✓)** **BR** | no | Correct — debounced + server-paginated. |
| PlaceHub loaders (warehouses, zones, sites, summary, liveIdling, idleHistory, hotspots, drainMap, breaks) | `PlaceHubPage.jsx:304-307,326-328,345-346,356,437` | M (grouped parallel) + P (idling, tab-scoped ✓) **BR** | `/api/warehouse`, `/api/hotspots` **yes** | ~9 requests fan out on mount; idling poll correctly gated to active tab (good). |
| Geofence anomaly set (locations, stats, hotspots) | `GeofencePage.jsx:328-334` | M + pagination A **BR** | `/api/hotspots` **yes** | stats+hotspots refetch on every page change (01 PERF-2). |
| Geofence zones+alerts (`getZones limit:5000`, alerts, counts) + alert poll | `GeofenceZonesPage.jsx:381-386`, `:424` | M **BR** + P 30s | no | zones `limit:5000`, no viewport filter (01 PERF-1, Bucket B). |
| `GET /api/app/v1/bills?status=PENDING&limit=1` + approvals count | `components/Sidebar.jsx:88-104` (raw `fetch`, not `apiClient`) | M + **P 30s** | no | Always-mounted session-long poll; bypasses interceptor (no `X-Branch-Id`). |
| `IdlingConsoleService.getLive` | `IdlingConsole/LiveIdlingPanel.jsx:68,74` | M + P | no | |
| `FuelIntegrityService.getSummary/getFills/getWindows` | `FuelIntegrityPage.jsx:116-118` | M + **P 45s** **BR** | no | `getSummary` also used by DailyDigest. |
| `GET /api/routes?limit=200` | `AdvanceMastersPage.jsx:35` + ERP masters | M (dropdown) | no | Full list pulled for a `<select>`. |

### `/api/auth/me` — single-fetch confirmed, with stray duplicate callers
- **Correct:** `FeatureFlagsContext.jsx:34-41` fetches once via `useApi`, gated `enabled: isAuthenticated()`, refetches on branch switch; `DashboardLayout.jsx:40-44` reuses that payload (documented at `:37-39`).
- **Duplicate callers to remove:** `Profile/ProfileService.jsx:6` (`getProfile`) and `:27` (`getUserInfo`) — ProfilePage/ProfileContext re-fetch data already in `FeatureFlagsContext.profile`; `utils/featureFlagRoutes.js:53` (`fetchAndResolveLandingRoute`) is **exported but unused** (LoginPage uses the sync `resolveLandingRoute`, `LoginPage.jsx:129`) — remove to avoid a future accidental duplicate.

### Branch-switch blast radius (confirmed)
`DashboardLayout.jsx:66` `key={branchId || 'all-locations'}` re-keys `.page-content`, so **every routed page unmounts + remounts and re-runs all fetch effects** on every branch switch; simultaneously `BranchContext.setBranch` dispatches `branchChange` (`BranchContext.jsx:81`) which makes `FeatureFlagsContext` re-fetch `/api/auth/me`. Providers sit above the keyed node, so only page content remounts (intentional). **Hit hardest:** DailyDigest (8 slow `/api/owner-value` + ~5 more re-fire), RouteIntelligence (4 slow calls), PlaceHub (~9), both Geofence pages. CommandPalette & Sidebar sit *outside* the keyed subtree, so they do **not** refresh on branch switch (stale-data smell, not a perf cost).

---

## Bucket A — FRONTEND-FIXABLE

| # | Issue | File:line | Fix |
|---|-------|-----------|-----|
| A1 | CommandPalette eagerly fetches fleet-health + fleet-dashboard on every session | `CommandPalette.jsx:53-60` | Gate both with `{ enabled: open }` → load only when palette opens. |
| A2 | RouteIntelligence fetches 3 hidden tabs on mount | `RouteIntelligencePage.jsx:607-638` | `enabled: activeTab === 'sites'` etc. → only the visible tab. |
| A3 | GeofencePage pagination refetches stats + hotspots | `GeofencePage.jsx:323-345` | Split `fetchData`; `stats`/`hotspots` load once, only `getAnomalyLocations` depends on `[page, filter]`. |
| A4 | Branch-switch remounts whole subtree → refetch storm | `DashboardLayout.jsx:66` | Have pages react to `branchId` in fetch deps (interceptor already injects `X-Branch-Id`) instead of remounting; keep one mechanism (also redundant with `branchChange`→`/api/auth/me`). |
| A5 | Live SSE tick re-renders entire Geofence pages | `GeofenceZonesPage`, `GeofencePage` | Imperative markers (model `AnimatedVehicleMarkers.jsx`) so diffs don't re-render the page (01 PERF-1/2). |
| A6 | Mileage search fires per keystroke | `MileageTrackingPage.jsx:67-79` | Debounce via `hooks/useDebouncedValue.js` before the dep key. |
| A7 | Vehicle list re-fetched ~24× uncached | ~24 sites (see map) | One cached vehicle-options source (context/cached hook). |
| A8 | ProfilePage duplicate `/api/auth/me` | `ProfileService.jsx:6,27` | Read `profile` from `FeatureFlagsContext`. |
| A9 | `/api/whatsapp/settings` fetched by two components + already on `/auth/me` | `settingsWhatsApp.jsx:33`, `ReceiptApprovalPage.jsx:215` | Read from the context payload / fetch once. |
| A10 | Sidebar raw `fetch` poll (no `X-Branch-Id`, no abort) | `Sidebar.jsx:88-104` | Route through `apiClient`/`useApi`; keep 30s cadence. |
| A11 | Clock/telemetry timers re-render giant LiveTracking page | `LiveTrackingPage.jsx:282-292, 813-816` | Isolate into small components (01 PERF-7). |
| A12 | Dead `fetchAndResolveLandingRoute` (future duplicate risk) | `featureFlagRoutes.js:51` | Remove the unused export. |

*Already correct (no fix):* RefuelLogs search debounced; LiveTracking/RouteIntelligence filters are client-side over one server-paginated page; `useApi` ref-stores the fetcher so inline lambdas don't loop; PlaceHub idling poll is tab-scoped.

---

## Bucket B — BACKEND-INVESTIGATION (document only; share with backend team)

*No backend code was read. Each row says what the frontend observes and what the backend team should look into. The 90s client timeouts in `axiosConfig.js:26-46` are empirical evidence these reads are heavy.*

| # | Endpoint | Affected page/component | Observed problem | Frontend-perf impact | Backend team should investigate |
|---|----------|------------------------|------------------|---------------------|---------------------------------|
| B1 | `/api/owner-value/*` (8 routes) | `DailyDigestPage.jsx:49-62` | All 8 on the 90s slow-path; fan out together on dashboard mount | Dashboard TTI gated on 8 concurrent heavy aggregations; slowest dominates; re-fires per branch switch | Why owner-value aggregations need up to 90s; a single pre-aggregated/cached dashboard payload so the client makes ~1 call, not 8. |
| B2 | `/api/vehicles?limit=1000` (and 500) | `VehicleReport.jsx:36`, `Mileage/mileageApi.js:43`, `LiveTrackingPage.jsx:301`, +~24 sites | Full vehicle documents returned for `{id, registrationNumber}` dropdowns | Large payloads downloaded repeatedly, parsed, reduced client-side | A lightweight typeahead/options endpoint (`id`+`registrationNumber`, server-filtered by query). **Clearest over-fetch.** |
| B3 | `GeofenceService.getZones(limit:5000)` | `GeofenceZonesPage.jsx:379` | No server-side viewport/bbox filter; client requests up to 5,000 zones and renders them all | Drives the P1 overlay-reconciliation jank (01 PERF-1) | Spatial/bbox + pagination filtering so the client fetches only zones in view. **Missing server-side filtering.** |
| B4 | `/api/whatsapp/admin/drafts?limit=200` | `ReceiptApprovalPage.jsx:250` | Server filters by `status` only; **date, odometer, anomaly, text-search, sort all done client-side** over a 200-row cap (`:276-341`) | Filtering/search operate on a truncated window — rows beyond 200 silently invisible; all filter work on main thread | Server-side date/odometer/anomaly/search filters + sort + real pagination. |
| B5 | `/api/mileage/fleet-overview` | `MileageTrackingPage.jsx:74` | On 90s slow-path **and** fired per keystroke | Many concurrent 90s aggregations while typing | A fast indexed search/typeahead path distinct from the full aggregation; confirm `search` is indexed. |
| B6 | `/api/route-intelligence/*` | `RouteIntelligencePage.jsx:607-638` | On 90s slow-path; 4 list calls on mount | 4 slow requests (3 for hidden tabs) | Confirm server-side pagination/filter is indexed, not full scans. |
| B7 | `/api/livetracking/positions` | `LiveTracking`, both Geofence pages | On 90s slow-path; REST initial per page + on every SSE reconnect | Slow initial map paint; reconnect re-fetches the full set | Why a "latest-per-vehicle" read needs 90s; index on org/branch; ensure the REST snapshot is a cheap cached read. |
| B8 | `/api/reports/*` export | `ReportsService.fetchAllReportRows` (38-49), `RefuelLogsPage.fetchAllLogsForExport` (692-727) | Export walks pages at `limit:1000`/200 to pull every row to the browser | Long multi-request export stalls; browser memory pressure for large fleets | A server-side export/streaming endpoint returning the file directly. |
| B9 | `FuelIntegrityService.getSummary/getFills/getWindows` | `FuelIntegrityPage.jsx:116-118` | Polled every 45s; `getSummary` also used by DailyDigest | Repeated heavy reads every 45s per open tab | Whether these are cheap enough to poll at 45s, or support conditional/delta responses (ETag / If-Modified-Since). |
| B10 | `/api/hotspots`, `/api/warehouse` | PlaceHub, Geofence* | On 90s slow-path | Contribute to PlaceHub's ~9-request mount fan-out | Aggregation cost; whether PlaceHub's layer loads can be combined into fewer endpoints. |
| B11 | `/api/reports`, `/api/mileage/*`, `/api/adblue-logs/comparison`, `/api/fleet-coverage`, `/api/road`, `/api/audit`, `/api/owner-value`, `/api/lemu`, `/api/admin/*` | respective report/console pages | All carry a 90s client budget | Slow tables/consoles throughout | Per-endpoint aggregation cost + indexes on date/vehicle/driver/org; `/api/admin/*` org drill-downs do cross-collection aggregates (per `axiosConfig.js:45`). |

**Top three for the backend team:** **B2** (1,000 vehicles for a dropdown — over-fetch), **B3** (5,000 zones, no viewport filter — missing server-side filtering), **B1** (owner-value: legitimately slow *and* fanned out 8-wide on one screen).
