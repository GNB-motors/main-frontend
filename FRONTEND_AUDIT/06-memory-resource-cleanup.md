# 06 — Memory Leaks & Resource Cleanup

Scope: `setInterval`/`setTimeout`, `addEventListener`, map/3D/deck.gl instances, SSE streams, observers, async setState, stale closures.

**Headline: this is the most disciplined part of the codebase.** Every `setInterval` has a matching `clearInterval`; every Leaflet / three.js / deck.gl / Google Maps instance is disposed; every observer disconnects; the shared SSE singleton tears down cleanly. The global 78-vs-76 `addEventListener`/`removeEventListener` gap resolves to exactly two sites, **both verified benign**. **No P0/P1 leaks.** Remaining items are low-severity setState-after-unmount / missing-`AbortSignal` nits.

---

## P2

### MEM-1 — Two `addEventListener` calls have no `removeEventListener` — both benign
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **(a) `lib/liveStream.js:156-158`** — named SSE listeners:
  ```js
  ['hello', 'positions', 'alerts', 'freshness'].forEach((type) => {
    es.addEventListener(type, (ev) => dispatch(type, ev.data));
  });
  ```
  Safe: `closeSource()` (`:86-93`) nulls handlers, calls `es.close()`, drops the reference (`source = null`); a reconnect builds a fresh `es`. The old `EventSource` + listener closures become unreachable and are GC'd. No accumulation across reconnects.
- **(b) `pages/Vehicle360/VehicleModel3D.jsx:131-133`** — OrbitControls `'start'` listener. Safe: `controls` is a local `const`; after `controls.dispose()` (`:156`) + renderer/scene teardown the whole object (its `_listeners` map and the closure) is unreachable and GC'd.
- **Fix (optional, defensive):** hoist the handler to a named `const` and `controls.removeEventListener('start', onStart)` in cleanup so the audit count balances. No functional action required.

---

## P3

### MEM-2 — LiveTrackingPage toast timer has no unmount cleanup
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/LiveTracking/LiveTrackingPage.jsx:270-279`
- **Evidence:** `showToast` clears the *previous* timer (`:275`) but there is no `useEffect(() => () => clearTimeout(toastTimerRef.current), [])`.
- **Impact:** Navigating away within 2.4s of a toast fires `setToastMsg(null)` on an unmounted component. Harmless in React 19, but inconsistent with the correct pattern elsewhere.
- **Reference (correct):** `ErpHome/ErpHomePage.jsx:414`, `RouteHub/useRouteHubToast.jsx:15`.
- **Fix:** Add `useEffect(() => () => clearTimeout(toastTimerRef.current), []);`

### MEM-3 — LiveTrackingPage `handleRefresh` fire-once `setTimeout` not tracked
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/LiveTracking/LiveTrackingPage.jsx:854-857` — `setTimeout(() => { setIsRefreshing(false); showToast(...); }, 600)` neither stored nor cleared.
- **Impact:** Negligible (one-shot in an action handler); chains into MEM-2's untracked toast timer.
- **Fix:** Store in a ref cleared on unmount, or guard with a `mounted` ref.

### MEM-4 — PlaceHubPage live-idling interval does async `setData` with no unmount guard
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/PlaceHub/PlaceHubPage.jsx:434-441`
- **Evidence:** The interval is cleared correctly, but a request in flight at clear-time resolves afterward and calls `setData`. No `AbortSignal` passed (rules 8/9), no `cancelled` flag.
- **Impact:** Possible setState on an unmounted component on the last tick; stale state isn't a concern (functional updater). No runtime error.
- **Fix:** `let cancelled = false` in the effect, set in cleanup, skip `setData` when cancelled; ideally thread an `AbortController` through `loadLiveIdling`.

### MEM-5 — Sidebar 30s poll uses raw `fetch()` without `AbortSignal`
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `components/Sidebar.jsx:88-105`
- **Evidence:** Polls `/api/app/v1/bills?...` with raw `fetch` (bypassing `apiClient`/`useApi`) and no `AbortSignal`; the interval *is* cleared.
- **Impact:** Not a timer leak. Sidebar is session-long so the poll is by design; the concern is unaborted in-flight requests + setState after unmount on logout, plus rules 8/9/11 violations (raw `fetch`, direct-`localStorage` auth headers, no `X-Branch-Id` — see [`03-frontend-backend-api-dependency.md`](03-frontend-backend-api-dependency.md) A10).
- **Fix:** Route through `apiClient`/`useApi` with an `AbortController` tied to the effect.

---

## Verified clean (checked, no action needed)
- **SSE / EventSource** — `lib/liveStream.js`: shared singleton, full teardown (`clearTimers()` `:79-84`, `closeSource()`, `visibility.removeEventListener('visibilitychange', …)` on `dispose()` `:252`), grace period + backoff-with-jitter cancelled on last unsubscribe. `useLiveData.js`/`useLivePositions.js` unsubscribe handlers and clear the fallback poll; lazy import guarded by a `cancelled` flag.
- **three.js** — `Vehicle360/VehicleModel3D.jsx:153-163`: cancels RAF, disconnects `ResizeObserver`, disposes controls, group geometries/materials (`vehicleModel.js:160-179`), ground, renderer, removes `renderer.domElement`, disposes `dracoLoader`; `cancelled` guards every async step.
- **deck.gl** — `RouteReplay/truck3d/Truck3DLayer.jsx:60-64`: `overlay.finalize()` on unmount and on map change; `cancelled` guard around GLTF load.
- **Leaflet** — all instances via `RouteHub/routeHubMap.js` `useLeafletMap` (`ResizeObserver` disconnect + `map.remove()` in try/catch, ref nulled first). No stray `L.map(` elsewhere.
- **Google Maps** — `PlaceHubMap`, `LiveTrackingPage`, `RouteReplayPage`, `AutoTripReplay` `setMap(null)` on unmount; `MarkerClustererF` explicit `detachClusterer`; POI fetch aborts via `AbortController` (`PlaceHubMap:429-445`).
- **Observers** — all `Mutation/Resize/IntersectionObserver` disconnect (`LiveTrackingPage:225`, `PlaceHubPage:101`, `ReportsPage:79`, `KgCanvas:449`, `GnbPage:58`, `routeHubMap:94`, `VehicleModel3D:155`).
- **Intervals** — all 19–22 `setInterval` sites have a matching `clearInterval`; bodies use functional `setState` / re-fetch → **no stale-closure captures**.
- **requestAnimationFrame** — all playback loops `cancelAnimationFrame` in cleanup (`RouteReplayPage:260`, `AutoTripReplay:132`, `ReplayView:516`, `KgCanvas:418`, `VehicleModel3D:154`).
- **Event listeners** — Navbar, KgCanvas, StepInstallExtension, ErpDrawer/SlideOver, GnbPage all pair add/remove correctly (incl. capture-flag matches).
- **No** `WebSocket`, `geolocation.watchPosition`, or other un-torn-down subscriptions in the tree.

**Bottom line:** No high-severity resource leaks. MEM-2 is a one-line consistency fix; MEM-3–5 are optional hardening. Spend effort elsewhere.
