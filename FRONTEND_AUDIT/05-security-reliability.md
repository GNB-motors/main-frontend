# 05 — Security & Reliability

Scope: token/session handling, multi-tenant scoping, secret/PII exposure, XSS, public/share routes, error boundaries, input/upload validation, open redirects. Frontend-only issues are separated from **backend dependencies**. Read-only.

**Verified SAFE (no action):**
- **XSS via `dangerouslySetInnerHTML` — all 4 usages clean.** `ErpHome/commandCenterIcons.jsx:35`, `RouteHub/routeHubIcons.jsx:18`, `LiveTrackingPage.jsx:141`, `PublicTrackingPage.jsx:46` each inject `DICT[name] || ''` where `DICT` is a module-level constant of hardcoded SVG path strings keyed by a caller-supplied *name* (not content). No user/server data reaches `__html`.
- **No dangerous JS sinks** — zero `eval` / `new Function` / `.innerHTML =` / `document.write`.
- **No open redirects** — every `window.location.*` target is a hardcoded internal path or an `encodeURIComponent`-built internal URL; no `redirect`/`returnUrl`/`next` param is read and navigated to.
- **All `target="_blank"` anchors carry `rel="noopener"/"noreferrer"`** (manual inspection; the line-based grep false-positived).
- **Scoped 401 handling** is well-designed — no redirect loop (see Strengths).

---

## P1

### SEC-1 — Tenant scope (org/branch) is fully client-controlled via localStorage headers
- **Priority:** P1 · **Effort:** M (backend) / S (frontend) · **Confidence:** Confirmed (frontend behavior); backend enforcement unverifiable here
- **Files:** `utils/axiosConfig.js:63-72`; `utils/session.js:65-66, 103-111`; writer `contexts/BranchContext.jsx` (branch switcher)
- **Evidence:** `const orgId = getOrgId(); if (orgId && ...) config.headers['X-Org-Id'] = orgId;` … `const branchId = getBranchId(); ... config.headers['X-Branch-Id'] = branchId;` — both come straight from `localStorage` (`user_orgId`, `user_branchId`) and attach to every request.
- **Root cause:** Active tenant/branch is held in client storage and echoed in headers. Any user can set `localStorage.user_orgId`/`user_branchId` to another tenant's id in DevTools; the interceptor sends it verbatim with their valid JWT.
- **Impact:** Classic IDOR / horizontal privilege escalation **if the backend trusts these headers** instead of deriving/authorizing org+branch from the JWT. Cross-tenant read/write across a multi-tenant fleet+finance app.
- **Backend dependency (label):** The frontend itself does **not** leak cross-tenant data — it only renders what the API returns. Security hinges on the backend validating that the JWT's user belongs to the header's `X-Org-Id`/`X-Branch-Id`.
- **Fix:** **Backend** must authorize org/branch from the authenticated principal, treating the header as a hint. Add a backend integration test: foreign `X-Org-Id`/`X-Branch-Id` + valid token → **403**. Frontend: nothing required; this is the single most important thing to confirm.

### SEC-2 — JWT stored in localStorage + no enforced CSP → any XSS = full session takeover
- **Priority:** P1 · **Effort:** L · **Confidence:** Confirmed (storage) / Hypothesis (exploitability depends on a future XSS)
- **Files:** `utils/session.js:10, 30-36, 56` (`authToken` in `localStorage`); `utils/axiosConfig.js:59-61`; `index.html` (no CSP meta); `vercel.json` (CSP is **Report-Only**)
- **Evidence:** `KEYS = { token: 'authToken', ... }`, `getToken = () => get(KEYS.token)` via `localStorage.getItem`; `index.html` has only charset + viewport metas; `vercel.json` sets `Content-Security-Policy-Report-Only` (logs, does not block).
- **Root cause:** Bearer token + all user/profile PII live in `localStorage`, readable by any JS on the origin; CSP is not enforcing.
- **Impact:** Today's in-app XSS surface is low (the 4 `dangerouslySetInnerHTML` are static; no `eval`). But localStorage storage means *any* future XSS — a vulnerable dependency, one reflected value — exfiltrates the JWT and every PII field instantly. An `httpOnly` cookie would make the token unreadable to JS.
- **Fix:** Prefer `httpOnly; Secure; SameSite` cookie for the JWT (backend-coordinated; add CSRF protection if adopting cookies). If localStorage stays, promote CSP from Report-Only to enforced (at the hosting/CDN layer) and add `Referrer-Policy: strict-origin-when-cross-origin`. Defense-in-depth, since one XSS otherwise fully compromises sessions.

---

## P2

### SEC-3 — PII logged to the browser console in production (onboarding)
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/Onboarding/components/StepProfile.jsx:41-49`
- **Evidence:** `console.log('Loading user data from session storage:', { firstName, lastName, email, mobileNumber, userId, orgId });`
- **Root cause:** Raw `console.log` (not DEV-gated `utils/logger.js`) prints identity + contact PII; runs in production builds.

  > Note: `vite.config.js:34` strips `console.log/warn/info/debug` at build via esbuild `pure`. That *mitigates* the prod exposure for `.log`, but (a) it is a build-time crutch, not a code fix, (b) `console.error` is intentionally kept and some PII dumps use other sinks, and (c) rule 24 forbids committed `console.log` regardless. Treat as real.
- **Impact:** PII (name, email, mobile, ids) in dev/shared-machine consoles, support screen-shares, session-replay tools, browser extensions. Violates rule 24.
- **Fix:** Delete the log or route through `logger.info` (no-ops outside DEV).

### SEC-4 — Google Maps API key printed to console (and must be domain-restricted)
- **Priority:** P2 · **Effort:** S · **Confidence:** Confirmed (log) / Hypothesis (restriction state)
- **Files:** `components/GoogleMapsModal/GoogleMapsModal.jsx:43` (key bundled client-side at `:9`, also `PublicTrackingPage.jsx:17`)
- **Evidence:** `console.log('API Key being used:', GOOGLE_MAPS_API_KEY);` inside the `loadError` effect.
- **Root cause:** `VITE_GOOGLE_MAPS_API_KEY` is (correctly) embedded in the client bundle for Maps JS, but also echoed to console on error.
- **Impact:** The key is already extractable from the bundle, so the log is marginal — the real exposure is whether the key is **HTTP-referrer-restricted** in Google Cloud. The component's own error text ("the API key has no domain restrictions…", `:300-302`) suggests restrictions may be loose. Unrestricted key = quota theft / billing abuse. Restriction not verifiable from the repo — **infra risk**.
- **Fix:** Remove the `:43` log. Confirm the key is HTTP-referrer-restricted to prod/staging domains and limited to Maps JS + Places + Geocoding APIs. Ensure `frontend/.env` stays git-ignored (it is — confirmed).

### SEC-5 — No client-side route guard: the authenticated shell renders for anonymous users
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `App.jsx:393-399` (protected block is just `<DashboardLayout/>`); `components/DashboardLayout.jsx:14-53`; `contexts/FeatureFlagsContext.jsx:39-41, 70`; `hooks/useApi.js:15-17`
- **Evidence:** Protected routes mount `<TripCreationProvider><DashboardLayout/></TripCreationProvider>` with no `isAuthenticated` check; `DashboardLayout` gates only on `ready`. For an anonymous user, `useApi` is `enabled: isAuthenticated()` → `loading=false`, `meResponse=null` → `ready = (!loading && !meResponse) = true`, so the full Sidebar/Navbar/`<Outlet/>` render immediately. `grep ProtectedRoute|RequireAuth|PrivateRoute` → none; `isAuthenticated` is imported only in `session.js` + `FeatureFlagsContext.jsx`.
- **Root cause:** No guard component; access control is purely reactive (child page API call → backend 401 → `handleAuthError` → redirect).
- **Impact:** Reliability/UX + defense-in-depth gap. An anonymous/expired user hitting `/profile`, `/erp/*` briefly renders the authenticated chrome before an API 401 bounces them. No data leak (backend enforces, no token = 401s), but the app relies 100% on backend 401s and flashes protected UI.
- **Fix:** Add a `<RequireAuth>` around the `DashboardLayout` route that checks `isAuthenticated()` (and ideally `!isTokenExpired(getToken())`) and `<Navigate to="/login" replace/>` otherwise.

### SEC-6 — Single root ErrorBoundary: any render crash blanks the entire app
- **Priority:** P2 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `main.jsx:18-27` (only boundary); `App.jsx:216-666` (no route-level boundaries); `errors/ErrorBoundary.jsx`, `ErrorFallback.jsx`
- **Evidence:** The only `<ErrorBoundary>` wraps the whole tree in `main.jsx`. `App.jsx` uses `<Suspense>` for lazy routes but Suspense does **not** catch render errors; no `<ErrorBoundary>` inside the router/layout.
- **Impact:** A render exception in any single page (e.g. one ERP finance page) unmounts the *entire* SPA to the full-screen fallback — sidebar, navbar, every other working page included.
- **Fix:** Add a route-level `<ErrorBoundary>` around `<Outlet/>` inside `DashboardLayout` (and optionally per heavy page) so a crash degrades to an in-page error while the shell survives. Root boundary + Sentry wiring is otherwise good.

---

## P3

### SEC-7 — No proactive client-side token-expiry enforcement
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `utils/axiosConfig.js:59-61`; `utils/authUtils.js:131-151` (`validateTokenBeforeRequest`, only caller `ProfileContext.jsx:22`)
- **Evidence:** The request interceptor attaches the token with `if (token)` only — never checks `isTokenExpired`; `validateTokenBeforeRequest`/`isTokenExpired` are essentially unused app-wide.
- **Impact:** Minor — an expired token is still sent, backend 401s, then `isSessionInvalid401` detects expiry and logs out. One wasted request + 401 round-trip. Functionally safe.
- **Fix:** In the request interceptor, short-circuit to logout if `isTokenExpired(token)` before sending.

### SEC-8 — Public share token travels in the URL with no Referrer-Policy
- **Priority:** P3 · **Effort:** S · **Confidence:** Hypothesis
- **Files:** `pages/PublicTracking/PublicTrackingPage.jsx:17,78,93`; `services/ShareService.js:52-66`; `App.jsx:240` (`/track/:token`); `index.html` (no `Referrer-Policy`)
- **Evidence:** `getPublicShare(token)` → `/api/public/share/${token}`; the public page loads Google Maps JS/tiles and OSM links. With no `Referrer-Policy`, the `Referer` on those cross-origin requests carries the full `/track/<token>` URL.
- **Impact:** A live-location share token can leak to Google/OSM via `Referer` and lands in browser history / intermediary logs. Token entropy/expiry/single-resource projection are **backend dependencies**. The frontend correctly uses a token-less `publicClient` (no JWT/org/branch headers leak on public reads) and renders only the one returned resource — no frontend bypass/enumeration found.
- **Fix:** Add `Referrer-Policy: no-referrer` (at least for the public route); confirm backend tokens are high-entropy with enforced expiry/revocation.

### SEC-9 — `window.open` without `noopener` (same-origin document)
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `pages/Trip/RefuelComparisonDrawer.jsx:209` (`window.open('/documents/' + docId, '_blank')` — no `'noopener'`; the other call in `ConsignmentsPage.jsx:160` is correct).
- **Impact:** Minimal — same-origin relative URL, internal id. Fix for consistency: pass `'noopener,noreferrer'`.

### SEC-10 — Onboarding PII (incl. GSTIN) in sessionStorage outside the session gateway
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Files:** `Onboarding/components/StepProfile.jsx:58-65,132`; `StepCompanyTheme.jsx:27,82`; `StepVehicles.jsx:98-140`; `OnboardingPage.jsx:52-89`; `StepFinish.jsx:13`
- **Evidence:** Direct `sessionStorage.getItem/setItem('onboardingProfile'|'onboardingCompany'|…)` holding name/email/mobile + company GSTIN as JSON.
- **Impact:** Low — user's own data, tab-scoped, cleared at `StepVehicles.jsx:136-140`. Consistency/governance gap (rule 11) + the same XSS-readability caveat as SEC-2.
- **Fix:** Route through the sanctioned storage module, or also clear on abandonment.

### SEC-11 — ~246 `console.*` calls in committed code, several dumping API responses/PII
- **Priority:** P3 · **Effort:** M · **Confidence:** Confirmed
- **Files (examples):** `Trip/services/TripService.js:17-76`; `Trip/phases/Intake-components/VehicleDriverSelection.jsx:32-82` (dumps vehicle/driver API responses); `Drivers/AddDriverPage.jsx:109-115`; `Profile/ProfileContext.jsx:43`; `utils/authUtils.js:47,135,142`; `utils/profileStorage.js:80`
- **Evidence:** `grep` counts ~246 `console.*`; many are plain `console.log(...response...)` not DEV-gated. (`.log/.warn/.info/.debug` are stripped at build per `vite.config.js:34`, but `console.error` is kept and the rule forbids committed `console.log` regardless.)
- **Impact:** Production console noise + incidental data/PII disclosure where non-stripped sinks are used; broad in aggregate.
- **Fix:** Migrate to `logger.*` (DEV-gated) and add an ESLint `no-console` rule to enforce rule 24.

### SEC-12 — Revoked-but-unexpired token can leave the user on a broken page (by design)
- **Priority:** P3 · **Effort:** S · **Confidence:** Hypothesis
- **Files:** `utils/authUtils.js:59-95, 110-124`
- **Evidence:** `isSessionInvalid401` returns true only for no/expired token or an exact-match message in `SESSION_INVALID_MESSAGES`. A structurally-valid, unexpired-but-server-revoked token with an unrecognized 401 message falls through → no logout.
- **Impact:** Deliberate trade-off (it's what prevents the upstream-proxy 401 redirect-loop). Edge case: a server-revoked session whose message isn't in the set keeps hitting inline 401s instead of logging out.
- **Fix:** Ensure the backend returns a recognized session-level message on revocation, or add it to `SESSION_INVALID_MESSAGES`.

---

## Strengths (defensive design that is working — don't undo)
- **Scoped 401 handling, no redirect loop** — `handleAuthError` (`authUtils.js:110-124`) guards on `skipAuthRedirect`, `isOnAuthPage()`, and `isSessionInvalid401`, navigates with `replace:true`. Upstream-provider 401s no longer eject the user.
- **Response validation degrades safely** — `schemas/validate.js` `parseSafe` validates with zod but never fails a request over schema drift (passes data through + one Sentry report).
- **Public reads are token-less** — `ShareService.publicClient` is a bare axios instance; no JWT/`X-Org-Id`/`X-Branch-Id` leak on anonymous share reads.
- **Abortable fetches** (`useApi.js:22-46`) cancel in-flight requests on unmount/dep-change.
- **Root ErrorBoundary + global handlers installed before first paint** (`main.jsx:12,18-27`) with Sentry forwarding.
