# 02 — API Integration & Data-Fetching

Scope: data-fetching quality against CLAUDE.md rules 8–13. The primitives are strong (`useApi`, `useMutation`, `useErpList`/`useListQuery`, `useLiveData`, `liveStream`, `ApiError`, `schemas/validate`) and correct — the problem is **uneven adoption**: ~40 components and ~30 service files route around them.

**Baseline facts:**
- `hooks/useApi.js` creates an `AbortController` per run and aborts on dep-change/unmount — but only cancels the request the fetcher makes *with the signal it is handed*. If the fetcher ignores the signal, nothing is cancelled (API-5).
- `utils/axiosConfig.js:89-145` already normalizes every rejection to a typed `ApiError` (preserving `.response/.config/.code` and adding `.status/.requestId/.body` + `is*Error` helpers). So any call that lets its rejection propagate yields a proper `ApiError`. The service layer that unwraps and discards it is the problem (API-1).
- `useMutation` is imported by only **15** files; `useApi` by **75**. Nearly all mutations bypass `useMutation`.
- zod validation (`parseSafe`/`parseWith`) is called in **13 files / 15 sites** across ~77 data modules (~17%). `parseSafe` degrades safely (passes raw data through + one Sentry report on drift), so this is a coverage gap, not a breakage.

---

## P1

### API-1 — Service layer discards the typed `ApiError`, returning bare response bodies (rule 12)
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/Reports/ReportsService.jsx` (lines 23–27, 76–81, 103–108, 146–148, 165–173, 193–200, 214–216, 231–233, 251, 269, 281, 318); `pages/Login/LoginPageService.jsx:25`; `pages/LiveTracking/LiveTrackingService.jsx:22,41,58`; **23 service files total** use `throw error.response?.data || {...}`.
- **Evidence** (`ReportsService.jsx:20-28`):
  ```js
  } catch (error) {
    if (error?.name === 'CanceledError') throw error;
    console.error('API Error fetching vehicle reports:', error.response?.data || error.message);
    throw ( error.response?.data || { detail: 'Network error or server unavailable...' } );
  }
  ```
- **Root cause:** The interceptor rejects an `ApiError` (which preserves `.response`), but the catch reads `error.response?.data` (the raw body) and throws *that*, or a hand-made `{ detail }` on network errors — throwing away the `ApiError`.
- **Impact:** Pages never receive an `ApiError`: `error.status`, `error.requestId`, `error.body`, `error.displayMessage`, and the `is*Error` helpers are all unavailable. Error UIs calling `error.message` get `undefined` for `{ detail }`-shaped throws. The entire `ApiError` design is defeated for service-wrapped paths, while direct-`apiClient` paths *do* get real `ApiError`s — so error shape is inconsistent app-wide.
- **Fix:** In services, either don't catch (let `ApiError` propagate) or `throw ApiError.from(error)`. Never throw `error.response?.data`.

### API-2 — Auth/login/vehicle services use raw `axios`, bypassing interceptors, 401 handling, and the request timeout (rules 8, 9, 12)
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/Profile/VehicleService.jsx` (imports `axios` at `:1`; `getAllVehicles` 47–51, `addVehicle` 95, `addBulkVehicles` 139, `importVehicle` 161, `removeVehicle` 180, `updateVehicle` 217, document methods 298/317/349); `pages/Login/LoginPageService.jsx:9`; `pages/SignUp/SignUpPageService.jsx`; `pages/Onboarding/OnboardingService.jsx`; `pages/Maintenance/MaintenanceService.jsx`; `pages/Profile/FleetEdgeAccountService.jsx`; `services/ShareService.js`.
- **Evidence** (`VehicleService.jsx:47-51`): `const response = await axios.get(url, { headers: { Authorization: 'Bearer ' + token } });`
- **Root cause:** These modules `import axios from 'axios'` and build URLs/headers by hand instead of using the shared `apiClient`.
- **Impact:** (a) **No request timeout** — bare `axios` defaults to `0` (infinite), so a hung `getAllVehicles`/login spins forever (the shared client sets `DEFAULT_TIMEOUT`/`SLOW_TIMEOUT`). (b) **No 401 auto-logout** and no Sentry capture. (c) **No `X-Org-Id`/`X-Branch-Id`** — VehicleService re-implements branch scoping by hand (`:43-46`); any method that forgets (e.g. `addVehicle`) silently loses tenant scoping. (d) Rejections are raw axios errors, never `ApiError`. (e) No `AbortSignal`, so `useApi` cannot cancel them (API-5). `getAllVehicles` is the dropdown fetcher at ~24 sites.
- **Fix:** Replace raw `axios` with `apiClient`; drop the manual auth/branch header code; thread `{ signal }` through each method.

### API-3 — Mutations bypass `useMutation`, hitting raw `apiClient`/services in components (rules 8, 9)
- **Priority:** P1 · **Effort:** L (systemic) · **Confidence:** Confirmed
- **Files (representative):** `pages/Trip/RefuelLogsPage.jsx` — module-level `updateFuelLog` (281–285) / `deleteFuelLog` (287–291) call `apiClient.put/delete`; `pages/Superadmin/components/ReceiptApprovalPage.jsx` — `apiClient.post` for publish (402), bulk-publish (418), reject (456), bulk-reject (455); `pages/Settings/settingsIdling.jsx:48` (`apiClient.patch`); `pages/Settings/settingsWhatsApp.jsx:51`; `pages/ErpAdvances/AdvanceMastersPage.jsx` via `AdvanceService.save*/delete*` (92–113, 128–130).
- **Evidence** (`RefuelLogsPage.jsx:281-285`): `const response = await apiClient.put('api/mileage/fuel-log/' + cleanId, data);`
- **Root cause:** `useMutation` exists and is correct (abortable, loading/error/data, reset) but is adopted by only 15 files.
- **Impact:** Mutations carry **no `AbortSignal`** (an in-flight PATCH/POST survives unmount and can `setState`/toast afterwards), duplicate ad-hoc `submitting` booleans, and surface errors via `err.response?.data?.message` rather than `ApiError`.
- **Fix:** Route writes through `useMutation` with service fns that accept `{ signal }`.

### API-4 — Live-positions REST fetch (initial + polling fallback) is non-abortable and unvalidated (rules 9, 10)
- **Priority:** P1 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/LiveTracking/LiveTrackingService.jsx:16-24` (`getPositions` takes `params`, no `signal`); `hooks/useLivePositions.js:29` (`initialFetch = () => LiveTrackingService.getPositions()`); `hooks/useLiveData.js:64` (`const rows = await fetcher();`); fallback poll `useLivePositions.js:50-56`.
- **Evidence** (`useLiveData.js:59-68`): `const rows = await fetcher();  // no signal ever passed`
- **Root cause:** `useLiveData`'s `runFetch` never creates/passes an `AbortSignal`, and `getPositions` doesn't accept one. (Contrast `getIntents` at `:51`, which *does* accept `{ signal }`.)
- **Impact:** On the live map, the positions REST read — including the 45s degraded-mode poll and the resync-on-reconnect fetch (`useLiveData.js:98`) — cannot be cancelled. Overlapping polls/reconnect fetches race with no cancellation; a slow response can resolve into an unmounted page. Positions are never zod-parsed before feeding the map.
- **Fix:** Have `runFetch` create an `AbortController`, pass `signal` to `fetcher(signal)`, abort the prior run on refetch/unmount; add `signal` + `parseSafe` to `getPositions`.

---

## P2

### API-5 — `useApi` fetchers whose underlying service ignores the signal → no abort, requests race (rule 9)
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/ErpAdvances/AdvanceMastersPage.jsx:44-48` (`useApi(() => AdvanceService.getMileage(...))` — signal dropped; `AdvanceService.jsx:102-181` methods take no signal); `pages/Trip/RefuelLogsPage.jsx:442-447` (vehicles via `VehicleService.getAllVehicles`, API-2).
- **Impact:** Rapid tab switching on Advance Masters fires overlapping requests with last-to-resolve winning — the table can show rows for the wrong tab. The abort contract of `useApi` is silently void wherever the service drops the signal.
- **Fix:** Thread `(params, { signal })` through every service method used inside `useApi`, and pass it: `(signal) => AdvanceService.getMileage({ limit: 200 }, { signal })`.

### API-6 — ReceiptApprovalPage: manual loading/error state, no AbortSignal, status-switch race (rules 8, 9, 10, 12)
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/Superadmin/components/ReceiptApprovalPage.jsx` — state 183–187, `fetchData` 243–268, effect 270–273.
- **Evidence** (`:243-254`): `const [draftsRes, countsRes] = await Promise.all([ apiClient.get('/api/whatsapp/admin/drafts', { params: { status, limit: 200 } }), apiClient.get('/api/whatsapp/admin/drafts/counts').catch(() => null) ]);`
- **Impact:** Switching status tabs quickly issues concurrent `/drafts` requests with no cancellation — the last to resolve wins, so the table can show a tab's data that no longer matches the active tab. No zod validation before rendering money/litres fields. (See also 03-B for the client-side-filtering-over-200-cap issue.)
- **Fix:** Move the two reads into `useApi` (or a service passing `signal`), keyed on `status`; drop the mirror state.

### API-7 — MileageTrackingPage fires a request per keystroke to a 90s heavy endpoint (no debounce)
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/MileageTracking/MileageTrackingPage.jsx:67-79` (useApi dep includes `searchQuery`), `handleSearchChange` 47–50.
- **Evidence** (`:72-79`): `useApi((signal) => apiClient.get('/api/mileage/fleet-overview', { params: { page, limit, search: searchQuery }, signal }), [JSON.stringify({ page, search: searchQuery })])`
- **Root cause:** `searchQuery` enters the `useApi` dep key with no debounce; `/api/mileage/fleet-overview` is in `SLOW_PATH_PREFIXES` so each call gets a 90s budget.
- **Impact:** Every character triggers a new fleet-overview aggregation. `useApi` aborts the prior one, but this still floods a known-heavy endpoint. (RefuelLogsPage does this right — debounces 400ms at `:479-485` — so the pattern is known in-repo.)
- **Fix:** Debounce `searchQuery` with the existing `hooks/useDebouncedValue.js` before it enters the dep key.

### API-8 — Settings pages: manual fetch state, no AbortSignal, no zod, empty catch hides load failure (rules 8, 9, 10, 13)
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/Settings/settingsIdling.jsx:23-38` (load) and `:34` empty catch; `pages/Settings/settingsWhatsApp.jsx:30-43`.
- **Evidence** (`settingsIdling.jsx:24-38`): `apiClient.get('api/fuel-settings').then(...).catch(() => {});`
- **Impact:** If `GET /api/fuel-settings` fails, `saved` stays `null` forever, so the card is stuck on `<Skeleton>` (`:69`) with **no error state and no retry** — it looks like a permanent load. No abort on unmount; no schema validation.
- **Fix:** Use `useApi`; render an error/retry branch; remove or justify the empty catch.

### API-9 — LoginPage calls `apiClient` directly in the component and swallows the error (rules 8, 9, 13)
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/Login/LoginPage.jsx:115-122`
- **Evidence:** `try { const orgsRes = await apiClient.get('/api/me/orgs'); ... } catch (err) { console.error('Failed to fetch orgs for field agent', err); }`
- **Impact:** If `/api/me/orgs` fails, a FIELD_AGENT is navigated to `/field-agent-fuel` with **no org id set**, so the destination loads unscoped/empty with no user-visible error. Also `console.error` in committed code (rule 24).
- **Fix:** Move to `LoginPageService`/`useMutation`; surface the failure and/or block navigation when org resolution fails.

### API-10 — LiveTrackingPage master-data effects fetch without AbortSignal and without zod (rules 9, 10)
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/LiveTracking/LiveTrackingPage.jsx` — vehicles meta 297–323 (`apiClient.get('/api/vehicles', { params: { limit: 500 } })`, no signal, `:315` `console.warn`), driver-assignments 326–356 (`DriverVehicleAssignmentService.getAssignments()`, no signal), trail fetches `toggleTrail` 677–688 / `enterReplay` 723–731 (`LiveTrackingService.getTrail` — no signal, sets state after `await` with no mounted check).
- **Impact:** On a page that mounts/unmounts as users navigate, these requests run to completion after unmount; trail fetches can `setTrailPoints/setRoadTrail` after unmount.
- **Fix:** Use `useApi` for the meta/assignment reads; add `{ signal }` to `getTrail`/`getAssignments`; `parseSafe` responses.

---

## P3

### API-11 — "Mirror fetched data into local state" effects across list pages (rule 3)
- **Priority:** P3 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/Trip/RefuelLogsPage.jsx` 448–450, 541–547, 549–558; `pages/MileageTracking/MileageTrackingPage.jsx:81-86`; `pages/ErpAdvances/AdvanceMastersPage.jsx:50-56`.
- **Evidence** (`RefuelLogsPage.jsx:541-547`): `useEffect(() => { if (logsData) { setLogs(logsData.logs); setTotals(logsData.totals); setPagination((p) => ({ ...p, total: logsData.total })); } }, [logsData]);`
- **Root cause:** `useApi` already returns `{ data }`; copying it into a second `useState` via an effect is the "effect that only calls setters" rule 3 forbids.
- **Impact:** Extra render per fetch + a one-render window where derived values lag `logsData`; more surface for stale-state bugs.
- **Fix:** Derive directly from `useApi().data` (as `VehicleReport.jsx:62-63` already does).

### API-12 — `useErpList` and `useListQuery` are near-identical copies
- **Priority:** P3 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `hooks/useErpList.js` (265 lines) vs `hooks/useListQuery.js` (276 lines).
- **Evidence:** `useListQuery.js:7-9` — "This is a copy of hooks/useErpList.js for FMS pages." `cleanParams`, `unwrapList`, hydration, debounce, abort, URL-sync and pagination are duplicated verbatim; `useListQuery` only adds array/multi-select + `facets`.
- **Impact:** Two copies of subtle abort/race/URL-sync logic must be fixed in parallel; fixes can silently drift.
- **Fix:** Make `useErpList` a thin wrapper over `useListQuery` (or extract a shared core), keeping the ERP export surface.

### API-13 — No shared cache: the full vehicle list is independently re-fetched (limit 500/1000) on many pages
- **Priority:** P3 · **Effort:** M · **Confidence:** Confirmed (duplication) / Hypothesis (latency severity)
- **Files:** `pages/Reports/reports/VehicleReport.jsx:36` (1000), `pages/MileageTracking/...`, `pages/FieldAgentFuel/FieldAgentFuelService.js:34` (500), `pages/Overspeed/OverspeedService.js:26` (500), `pages/LiveTracking/LiveTrackingPage.jsx:301` (500), `pages/Mileage/mileageApi.js:43` (1000), `pages/AutoTrips/MovementApprovalsPage.jsx:56` (500); `getAllVehicles`/`extractVehicleOptions` used at ~24 sites.
- **Impact:** Each report/tracking page refetches up to 1,000 vehicles for a dropdown; navigating between reports repeats it. See 03 for the endpoint-level view and the backend over-fetch note.
- **Fix:** A cached vehicle-options source (context or a small cached hook) shared by dropdowns.

### API-14 — Widespread empty `.catch(() => {})` on data fetches (rule 13)
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `settingsIdling.jsx:34`, `ReceiptApprovalPage.jsx:219`, `WhatsAppAuditPage.jsx:127`, `lemu/graph/LemuGraphTab.jsx:206`, `ErpApprovals/ApprovalReviewDrawer.jsx:57`, `PlaceHub/PlaceHubMap.jsx:436`, `Profile/AddVehiclePage.jsx:81`, `Maintenance/AddMaintenancePage.jsx:92`, `RouteHub/RouteHubPage.jsx:66,81`, `RouteHub/views/ReplayView.jsx:309`, `RouteHub/views/OverspeedView.jsx:160`, `components/NotificationBell.jsx:101`. (The two in `LiveTrackingPage` 863/2028 are `navigator.clipboard` — acceptable.)
- **Impact:** Load failures of these reads are invisible (no error state, no log, no Sentry at the call site).
- **Fix:** Add a justifying comment where ignoring is truly safe; otherwise surface or log via `utils/logger.js`.

---

## Correct patterns already in the repo (copy these, avoid false positives)
- `VehicleReport.jsx` uses `apiClient` **inside a `useApi` fetcher with `signal`** and derives render data directly from `response.data` (no mirror state) — the right pattern; its only real defect is inheriting ReportsService's `ApiError` loss (API-1).
- `useErpList`/`useListQuery` are the **good** list pattern: per-render abort of superseded pages (`useErpList.js:173, 202-205`), debounced `q`, page-reset-on-filter.
- `lib/liveStream.js` (SSE) is well-built: exponential backoff + full jitter, single-use tickets re-minted per attempt, grace-period teardown, hidden-tab shutdown, 404 degradation with cooldown, malformed-frame isolation.
- `schemas/validate.js` `parseSafe` is a sound non-fatal validation design — the gap is **adoption**, not design.
