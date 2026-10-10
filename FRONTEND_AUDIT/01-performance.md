# 01 — Performance & Rendering

Scope: wasted re-renders, god components, context churn, map/live-tick rendering, memoization. React 19 + Vite, **no React Compiler** (`vite.config.js:27` plugins = `[react(), tailwindcss()]`; `grep react-compiler` = 0 hits), so memoization is fully manual and placement matters.

**Systemic signal:** `React.memo` is used in **exactly one file** (`pages/PlaceHub/PlaceHubMap.jsx`, 7 subcomponents) against **~518 `useMemo` + ~458 `useCallback`** calls. Per CLAUDE.md rule 7 (`useMemo`/`useCallback` only pay off under a `React.memo` boundary), most `useCallback`s that exist to "stabilize" props for non-memoized children are inert.

---

## P1

### PERF-1 — GeofenceZonesPage renders up to 5,000 map overlays declaratively and re-renders the whole page on every live tick
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed (pattern) / Hypothesis (magnitude depends on live zone count)
- **Files:** `pages/Geofence/GeofenceZonesPage.jsx:379`, `:509`, `:1036-1086`, `:355-367`
- **Evidence:**
  - Fetch cap: `const params = { isActive: ..., limit: 5000 };` (`:379`)
  - Render: `{memoizedZones.map((zone) => (<React.Fragment key={zone._id}><MarkerF/> <CircleF/> <PolygonF/></React.Fragment>))}` (`:1036-1058`) — every zone becomes 2–3 `@react-google-maps/api` overlay components, no clustering.
  - Live source: `useLivePositions({ ... fallbackPollMs: 15_000 })` (`:355`); `validLiveVehicles` recomputes on each stream diff (`:363`) → the whole 1,542-line component re-renders.
- **Root cause:** Declarative `MarkerF/CircleF/PolygonF` per zone means React reconciles up to 5,000 overlay element trees. Because the page subscribes to the SSE `positions` stream at the page level, **every position diff re-renders the whole page**, walking all those overlay elements plus the tab/table/list JSX. `memoizedZones` keeps prop objects stable (so native overlays mostly don't churn), but element reconciliation + `validLiveVehicles` marker rebuild still run each tick.
- **Impact:** On fleets with many zones, map interaction and every ~15s (or streamed) tick cause large reconciliation passes and jank. Single worst rendering risk found.
- **Fix:** (a) Render live vehicle markers imperatively like `LiveTracking/AnimatedVehicleMarkers.jsx` already does, so SSE ticks don't re-render the page. (b) Cap/paginate or cluster zones (`MarkerClusterer`, or render only viewport zones). (c) Isolate the map into a `React.memo` child so list/table state changes don't re-render overlays.

---

## P2

### PERF-2 — GeofencePage re-renders the whole page on every live SSE tick; pagination refetches unrelated endpoints
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `pages/Geofence/GeofencePage.jsx:300-312`, `:323-345`, `:868`
- **Evidence:** `const { positions: liveVehicles } = useLivePositions({...})` (`:300`) drives `validLiveVehicles` (`:308`) used in declarative `{validLiveVehicles.map(... <MarkerF position={{lat,lng}}/>)}` (`:868`) — a new `position` object literal per marker per render. `fetchData` (`:323`) `Promise.all`s `getAnomalyLocations`, `getAnomalyStats`, `getHotspots` with deps `[page, severityFilter, showResolved]` (`:345`), so **changing the page number refetches stats and hotspots too** though neither depends on pagination.
- **Impact:** Periodic full-page re-render; redundant `getAnomalyStats`/`getHotspots` on every pagination click.
- **Fix:** Imperative markers (as PERF-1); split `fetchData` so `stats`/`hotspots` load once and only `getAnomalyLocations` refetches on page/filter change.

### PERF-3 — Context values are recreated unmemoized on every provider render
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `contexts/BranchContext.jsx:86`, `:88-91`; `contexts/FeatureFlagsContext.jsx:90-106`; `contexts/TripCreationContext.jsx:17`
- **Evidence:**
  - Branch: `const activeBranch = branches.find(...)` recomputed every render (`:86`); `value={{ businessRefId, branchId, branches, activeBranch, loading, setBranch, refresh }}` inline (`:89-91`).
  - FeatureFlags: `value={{ flags, permissions, organization, profile, loading, ready, isEnabled, hasPermission, canAccess, refresh }}` inline (`:90-106`) — inner callbacks are `useCallback`-wrapped but the wrapping object is not.
  - TripCreation: `value={{ stepName, setStepName }}` inline (`:17`).
- **Impact (with nuance):** `FeatureFlagsProvider`/`BranchProvider` sit at a stable position (`DashboardLayout.jsx:77-83`) and re-render only on their own (infrequent) state changes, so today's blast radius is limited — but every such change force-re-renders **all** consumers, and these hooks are consumed broadly (Sidebar, Navbar, LocationSwitcher, CommandPalette, many pages). `TripCreationContext.stepName` changes on each wizard step, re-rendering all consumers. Latent trap: any added provider state (or moving the provider under a re-rendering parent) turns this into a tree-wide storm.
- **Fix:** Wrap each value in `useMemo([...deps])`; for TripCreation, split `stepName` from the stable `setStepName`.

### PERF-4 — "God component" state sprawl: 14–23 `useState` per page drives whole-component re-renders
- **Priority:** P2 · **Effort:** M (per page) · **Confidence:** Confirmed
- **Files/counts:** `GeofenceZonesPage.jsx` (23), `GeofencePage.jsx` (22), `PlaceHub/PlaceHubPage.jsx` (22), `LiveTracking/LiveTrackingPage.jsx` (21), `Trip/RefuelLogsPage.jsx` (18), `RouteIntelligence/RouteIntelligencePage.jsx` (14). Rule 5 caps at 8.
- **Impact:** Every filter toggle, keystroke, selection, or dialog open re-evaluates the whole 1,000–2,000-line render function. Mitigated where derived data is memoized (LiveTracking is good), amplified where it isn't (PERF-8).
- **Fix:** Consolidate related slices into `useReducer` (rule 5); extract map/table/panel into separate components so state localizes; dialog booleans → discriminated union (rule 6). See [`04-architecture-code-quality.md`](04-architecture-code-quality.md) ARCH-2.

### PERF-5 — CommandPalette eagerly fetches two fleet-wide endpoints on every session load
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `components/cluster/CommandPalette.jsx:53-60`; mounted at `components/DashboardLayout.jsx:72`
- **Evidence:** `useApi((signal) => FleetDataService.getFleetHealth(signal), [])` and `useApi((signal) => VehicleService.getFleetDashboard(null, '', { signal }), [])` — no `enabled` gate. CommandPalette is always mounted.
- **Impact:** Two extra (one fleet-dashboard-sized) requests on every app load that most users never trigger; `deps: []` also means the data goes stale after a branch switch.
- **Fix:** `useApi(..., [...], { enabled: open })` so it fetches on first open; key on `branchId` if it should follow branch scope.

---

## P3

### PERF-6 — `useCallback`/`useMemo` used purely to stabilize props for non-memoized children = inert (rule 7)
- **Priority:** P3 · **Effort:** M (cleanup) · **Confidence:** Confirmed
- **Evidence:** Only `pages/PlaceHub/PlaceHubMap.jsx` wraps children in `React.memo`. Elsewhere, e.g. `LiveTrackingPage.jsx` has 14 `useCallback`s (`handleRefresh`, `handleZoomIn`, `toggleTrail`, …) passed to plain children that re-render regardless. **The inverse is fine:** `useMemo` for genuinely expensive derived data (`vehicles`, `filteredVehicles`, `memoizedZones`, `useCalendarEvents`) is valuable even without a memo boundary and should stay.
- **Impact:** No runtime speedup, added allocation + complexity, misleads reviewers, violates rule 7.
- **Fix:** Either add `React.memo` to the heavy child (map layers, table rows) and keep the stabilized callbacks, or drop the `useCallback` wrappers. Prefer the former for map/list children; the latter for leaf handlers.

### PERF-7 — LiveTracking re-renders the full 2,052-line page on a 15s clock tick and a telemetry-rotation timer
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/LiveTracking/LiveTrackingPage.jsx:282-292` (`setInterval(updateClock, 15000)` → `setClockTime`), `:813-816` (`setTelemetryIndex` rotation)
- **Impact:** Whole-page re-render every 15s purely to repaint a clock string (and periodically rotate a telemetry card). Derived data is memoized so each pass is cheap-ish, but the entire tree reconciles on a timer regardless of data change.
- **Fix:** Move the clock and the rotating telemetry card into small isolated components that own their own timer/state. **Positive note:** the live vehicle layer in `AnimatedVehicleMarkers.jsx` is excellent (imperative `google.maps.Marker`, single rAF glide loop, icon-signature caching) — do **not** "React-ify" it.

### PERF-8 — LiveTracking `counts` does 9 separate array scans per tick
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/LiveTracking/LiveTrackingPage.jsx:423-439` — nine `vehicles.filter(...).length` passes, recomputed each time `vehicles` changes (every SSE tick).
- **Fix:** One `reduce` building all counts in a single pass. Negligible unless the fleet is large.

### PERF-9 — 5,515 inline `style={{…}}` objects across 387 files
- **Priority:** P3 · **Effort:** L · **Confidence:** Confirmed
- **Evidence:** `grep "style={{"` = 5,515 across 387 files (alongside 116 CSS files + Tailwind — see ARCH-6).
- **Impact:** Each inline style literal is a new object identity every render, so it defeats `React.memo`/prop-equality on any child it's passed to and adds allocation churn in hot lists/maps.
- **Fix:** Prefer Tailwind classes / CSS for static styling; reserve inline styles for genuinely dynamic values (transforms, computed map positions). Lint against `style={{}}` except for computed values.

---

## Checked and found healthy (no action)
- `novaDigestComponents.jsx` derived data is memoized (`useCalendarEvents`); framer-motion limited to 2–3 transitions (not overuse).
- `RouteIntelligencePage` client-side filters operate on one server-paginated page (~25 rows).
- `GeofenceZonesPage.inZoneVehicleIdSet` (`:556`) is bounding-box-optimized.
- deck.gl/three usage is confined to `RouteReplay/truck3d` and `VehicleMarker` — not in hot list paths.
- `useApi` stores the fetcher in a ref (`hooks/useApi.js:19-20`), so inline-lambda fetchers do **not** cause refetch loops.
