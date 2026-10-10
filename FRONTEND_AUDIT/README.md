# Frontend Audit — GNB Motors `main-frontend`

**Date:** 2026-10-11
**Scope:** `frontend/` (the React SPA). Read-only audit — no application code was modified.
**Method:** Firsthand inspection of core infrastructure + six parallel module-depth passes, every finding grounded in `file:line` evidence and measured against the project's own 26 coding rules in `frontend/CLAUDE.md`.

> This audit is split into one file per area (the connective summary lives here). Open the file for the area you care about:

| # | File | What's in it |
|---|------|--------------|
| — | `README.md` (this file) | Executive summary, health scorecard, **scope**, **coverage & methodology**, prioritized roadmap, validation strategy, final recommendations |
| 01 | [`01-performance.md`](01-performance.md) | Re-renders, god components, context value churn, map/live-tick rendering, memoization |
| 02 | [`02-api-integration.md`](02-api-integration.md) | `useApi`/`useMutation` adoption, abort/cancel, typed errors, zod validation, races |
| 03 | [`03-frontend-backend-api-dependency.md`](03-frontend-backend-api-dependency.md) | Endpoint dependency map, **frontend-fixable vs backend-investigation** split |
| 04 | [`04-architecture-code-quality.md`](04-architecture-code-quality.md) | Folder/convention consistency, duplication, god files, dead code, styling systems |
| 05 | [`05-security-reliability.md`](05-security-reliability.md) | Token storage, tenant scoping, XSS, auth guard, error boundaries, PII logging |
| 06 | [`06-memory-resource-cleanup.md`](06-memory-resource-cleanup.md) | Timers, listeners, map/3D/SSE teardown (mostly clean — see inside) |
| 07 | [`07-testing.md`](07-testing.md) | Coverage distribution, untested finance math, CI gaps |
| 08 | [`08-dependencies-build.md`](08-dependencies-build.md) | Build config, bundle budget, a11y debt, heavy deps |
| 09 | [`09-unused-packages.md`](09-unused-packages.md) | **Packages safe to delete** + packages that only *look* unused |

---

## 1. Executive summary — current health

The frontend is a **large, feature-rich, and surprisingly well-architected-at-the-core codebase that has outgrown the discipline of its own rulebook at the edges.** It is ~1,043 JS/JSX files and ~209k LOC, React 19 + Vite 7, no TypeScript, no React Compiler, and no third-party state/data-cache library.

What is genuinely good — and should **not** be rewritten:

- **The data-fetching primitives** (`hooks/useApi.js`, `hooks/useMutation.js`) are correct: abortable, keep-last-data, cancellation-aware.
- **The axios layer** (`utils/axiosConfig.js`) normalizes every error to a typed `ApiError`, auto-handles 401s *scoped* (so an upstream provider's 401 no longer ejects the user), and grants heavy endpoints a wider timeout budget in one visible place.
- **Resource teardown is excellent.** Every `setInterval` is cleared; every Leaflet / Google Maps / deck.gl / three.js instance is disposed; observers disconnect; the SSE singleton (`lib/liveStream.js`) tears down cleanly with backoff + jitter. **No P0/P1 memory leaks were found.**
- **Routing is fully code-split** — 123 `React.lazy()` routes, zero eager page imports in the main chunk; the main bundle budget (600 KB) is enforced by a script.
- **`localStorage` access is centralized** behind `utils/session.js` and enforced by an ESLint rule.
- **The lightweight state model** (5 contexts + `useApi` + a disciplined storage gateway) is reasonable and is the best-governed part of the codebase.

Where it has drifted — the substance of this audit:

- **Adoption of the good primitives is uneven.** 40 page/component files call `apiClient` directly; ~57 service modules live colocated under `pages/` (vs 20 central); the service layer frequently **throws away the typed `ApiError`**; several auth/vehicle services use **raw `axios`** (no timeout, no 401 handling, no tenant headers); zod validation runs in only **~13 of ~77 data modules**.
- **Files have grown without being split.** 133 files exceed the 400-line cap; the worst is 2,052 lines; one file (`novaDigestComponents.jsx`) holds **15 components in 1,915 lines**.
- **Rendering hot spots exist.** Context values are passed unmemoized; the two Geofence pages re-render the entire page on every live position tick and render up to 5,000 map overlays declaratively; a branch switch **remounts the entire routed subtree** and re-fires every fetch on the page.
- **Security posture is "backend-trusting."** The JWT lives in `localStorage` with no enforced CSP; tenant scope (`X-Org-Id` / `X-Branch-Id`) is sent from client storage; there is **no client-side route guard** (the app relies on reactive 401s); a single root `ErrorBoundary` means any page crash blanks the whole app.
- **Testing is lopsided.** Pure-logic helpers are well tested, but **ERP finance / ledger money math is almost entirely untested**, and there is **no CI** — the test suite and bundle budget only run if a developer types `npm run build`.

**Overall grade: B-.** The foundation is a B+/A-; the erosion at the edges (god components, inconsistent data-layer adoption, finance test gap, security defaults) pulls it down. None of it requires a rewrite — the fixes are targeted and incremental, and the "good" patterns to copy already exist *in this repo*.

## 2. Health scorecard

| Area | Grade | One-line |
|------|-------|----------|
| Core data/fetch infra | A- | Correct, abortable, typed errors — just under-adopted |
| Resource cleanup / leaks | A | Disciplined teardown; no P0/P1 leaks |
| Routing / code-splitting | A- | Fully lazy; main-chunk budget enforced |
| API integration (adoption) | C+ | Raw axios, discarded `ApiError`, partial zod, races |
| Rendering performance | C+ | God components + live-tick full-page re-renders + context churn |
| Architecture / conventions | C+ | Services/schemas/models follow 3 different placement rules; god files |
| Security / reliability | C | localStorage JWT, no route guard, single ErrorBoundary, header-trust tenant scope |
| Testing | C | Great where logic is extracted; finance math + CI are gaps |
| Dependencies / build | B- | Clean main chunk; 3 map stacks, a11y warnings parked, 1 unused dep |

## 3. Scope (what was and wasn't audited)

**In scope — the shipped SPA under `frontend/src/`:**
- Application pages (`src/pages/**`), shared components (`src/components/**`), hooks (`src/hooks/**`), services (`src/services/**` + colocated `*Service.*`), contexts, utils, lib, schemas, error boundaries, app shell & routing.
- Build/test/lint config (`vite.config.js`, `vitest.config.js`, `eslint.config.js`, `scripts/check-bundle.mjs`, `package.json`, `.husky/`, `vercel.json`, `nginx.conf`).
- Marketing/landing pages under `src/pages/landing-page-v2/**` are **in scope but de-prioritized** (they inflate the god-file counts; flagged where relevant, not individually audited).

**Out of scope (by nature, not oversight):**
- **Backend implementation.** Where a problem originates server-side (slow endpoints, over-fetching, missing server-side pagination), it is *documented for the backend team* in [`03-frontend-backend-api-dependency.md`](03-frontend-backend-api-dependency.md) — no backend code was read or changed.
- `Design/`, `quarantine/`, `amitansu-handoff/`, `public/draco/`, `node_modules/`, `dist/` — vendored, generated, or recovery material (correctly excluded from lint/bundle already).
- Runtime profiling (Lighthouse, React Profiler flame charts) — findings are **static-analysis + code-reading** based; magnitude-dependent claims are labeled **Hypothesis**.

## 4. Coverage & methodology

**Rulebook-anchored.** The repo ships `frontend/CLAUDE.md` with 26 explicit rules (hooks, data boundaries, file size, lazy routes, logging, bundle budget). Rather than assert generic best practices, each finding is measured against these rules, so "a problem" means "a measurable deviation from the team's own standard."

**How the audit was run:**
1. **Firsthand infra read** — `useApi`, `useMutation`, `axiosConfig`, `session`, `authUtils`, `main.jsx`, `App.jsx` routing, `DashboardLayout`, contexts, `validate.js`.
2. **Quantitative sweeps** — countable compliance metrics (`grep`/`wc`): file sizes, `apiClient` imports outside the data layer, `console.*` calls, `key={index}`, memo-hook vs `React.memo` counts, inline-style counts, zod call sites, listener balance, dependency import counts.
3. **Six parallel module-depth passes**, each returning `file:line` evidence: (a) data-fetching/API, (b) rendering performance, (c) memory/cleanup, (d) architecture/code-quality, (e) security/reliability, (f) testing/deps/build — plus a dedicated endpoint-dependency pass.
4. **Verification of high-impact claims** before writing (e.g. Geofence dead-code confirmed by grep, context value memoization read directly, dependency usage double-checked against CSS `@import`s and peer deps).

**Confidence labels.** Every finding is tagged **Confirmed** (read in source) or **Hypothesis** (pattern is real; magnitude depends on data volume / infra not visible from the repo). Backend-origin items are labeled as **backend dependency**.

**Coverage level:** High on the core app and the largest/most-complex pages (LiveTracking, Geofence, Trip, PlaceHub, RouteIntelligence, ERP finance, Reports, Superadmin). Medium on long-tail small pages and the landing suite. The deliberately *clean* areas are documented too (see the "verified clean" lists in [`06-memory-resource-cleanup.md`](06-memory-resource-cleanup.md) and [`05-security-reliability.md`](05-security-reliability.md)) so effort isn't wasted re-checking them.

## 5. Prioritized roadmap

### Immediate (this/next sprint — low risk, high signal)
1. **Stop the service layer from discarding `ApiError`** (`throw error.response?.data` → let `apiClient`'s `ApiError` propagate, or `throw ApiError.from(error)`). [02 #1]
2. **Remove PII / API-key `console.log`s** that ship to prod (onboarding profile dump; Maps key log) and migrate stray `console.*` to `utils/logger.js`. [05 #3/#4/#11]
3. **Gate `CommandPalette`'s two heavy fetches behind `{ enabled: open }`** and **stop `RouteIntelligence` fetching 3 hidden tabs**. [01 #5, 03-A2] — removes several heavy requests from every session.
4. **Remove `shadcn` from runtime `dependencies`** (or move to dev). [09]
5. **`git rm` the committed `lint_output.txt` + `lint_report.json`** (1.8 MB stale cruft). [08 #4]
6. **Add a `RequireAuth` wrapper** around the dashboard route so protected chrome stops flashing for anonymous users. [05 #5]
7. **Add a route-level `ErrorBoundary`** around `<Outlet/>` so one page crash doesn't blank the app. [05 #6]

### Short-term (1–2 months — contained refactors)
8. **Convert raw-`axios` auth/vehicle services to `apiClient`** (gets them timeouts, 401 handling, tenant headers, abort). [02 #2]
9. **Memoize context values** (`FeatureFlagsContext`, `BranchContext`, `TripCreationContext`). [01 #3]
10. **Fix the Geofence live-tick re-render** (imperative markers like `AnimatedVehicleMarkers.jsx`) and split `fetchData` so pagination stops refetching stats/hotspots. [01 #1/#2]
11. **Unify the money formatter** (`formatters.js` wins; retire `formatMoney.js`/`dataFormatters.js`) and the **date layer** (extend `dateUtils`, drop `dayjs`). [04 #1/#7]
12. **Extract ERP finance math into pure `.js` modules with unit tests** (golden cases: zero/negative/rounding boundaries). [07 #1]
13. **Add CI** running `lint + test + check-bundle` on PRs; ratchet a11y warnings with `--max-warnings`. [07 #2, 08 #3]
14. **Debounce the Mileage per-keystroke search**; add a shared cached vehicle-options source. [02 #7, 03-A]

### Long-term (quarter+ — architectural)
15. **Adopt a shared request cache** (TanStack Query or a thin in-house equivalent) — removes most bespoke loading/error state inflating the god components, and kills the uncached vehicle-list refetch pattern.
16. **De-god the top pages** (LiveTracking, Geofence×2, RefuelLogs, PlaceHub) and **split `novaDigestComponents.jsx`** into one file per component. Use `lemu/graph/` and `Maintenance/` as the template. [04 #2/#3]
17. **Settle service/model placement conventions** and codemod to them; add `no-restricted-imports` to ban `apiClient`/`axios` outside the data layer. [04 #4]
18. **Consolidate the three map stacks** and gate the deck.gl/three 3D truck behind explicit opt-in (multi-MB lazy payload). [08 #3, 09]
19. **Rethink the branch-switch remount** — react to `branchId` in fetch deps instead of remounting the whole subtree. [01 #4, 03]
20. **Evaluate React Compiler** on a branch — it would retire most of the manual-memoization rule surface. [08 #6]

## 6. Validation strategy (how to prove a fix worked without regressing)

- **Before touching any flow, pin behavior with a test.** Rule 22 already mandates "a bugfix starts with a failing test." For the finance-math extractions (07 #1) write golden-value unit tests *first* against the current output, then refactor.
- **Data-layer changes** (02): rely on `hooks/useApi.test.js` / `useMutation.test.js` as the contract; add tests asserting abort-on-unmount and that errors arrive as `ApiError` (status/requestId present). Manually verify a 401 on a background poll no longer ejects the user, and that an endpoint 401 shows inline.
- **Re-render fixes** (01): verify with the React Profiler that a live SSE tick re-renders only the marker layer, not the page; confirm `CommandPalette`/`RouteIntelligence` network panels show the removed requests are gone.
- **Security** (05): add a `RequireAuth` test (anonymous → redirect, no protected chrome) and a route-error-boundary test (child throws → shell survives). The tenant-scope item is a **backend** integration test (foreign `X-Org-Id` + valid token → 403).
- **Dependencies** (08/09): after removing a package, `npm run build` must still pass lint + test + the 600 KB bundle check; diff `dist/assets` sizes to confirm the intended chunks shrank.
- **Guardrails to prevent backslide:** CI on PRs (07 #2), `--max-warnings` a11y ratchet (08 #3), and lint rules banning raw `apiClient`/`axios` outside the data layer and static `xlsx` imports.

## 7. Final recommendations — highest-impact first

1. **Make the good data-layer the *only* data-layer.** The single highest-leverage move is finishing adoption of `useApi`/`useMutation` + `ApiError` + `parseSafe` and deleting the raw-`axios`/`error.response.data` paths. It fixes error handling, cancellation, timeouts, and tenant scoping in one consistent sweep. (See 02.)
2. **Test the money.** The ERP finance/ledger math is the highest *financial-correctness* risk and is effectively untested. Extract + unit-test it. (See 07.)
3. **Stop the per-session and per-branch request storms.** Gate lazy/eager fetches, debounce search, cache the vehicle list, and rethink the branch remount. Big perceived-speed win for low risk. (See 01 & 03.)
4. **Close the two cheap security gaps** (`RequireAuth`, route-level `ErrorBoundary`) and remove PII/secret logging — small effort, outsized reliability/trust payoff. (See 05.)
5. **Put a CI gate in front of the existing checks.** The quality tooling already exists; it just isn't enforced automatically. (See 07.)

> Priorities are **P0** (critical) · **P1** (high) · **P2** (medium) · **P3** (low); effort is **S/M/L**. No confirmed **P0** frontend bug was found — the most urgent items are P1 and are all frontend-fixable.
