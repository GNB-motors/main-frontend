# 07 — Testing & Error Handling

Scope: coverage distribution/quality, untested critical areas, CI gates. 1,043 js/jsx files, **146 test files** (vitest + `@testing-library/react`).

**Posture:**
- **Pure-logic tests are genuinely good** — e.g. `hooks/useApi.test.js` exercises abort/cancel/unmount/refetch; `KhataLedger/components/ledgerDetailLogic.test.js` tests money math well. The problem is **distribution**: tests cluster on extracted `.js` helpers; page/component rendering and ERP finance math are nearly uncovered.
- **Lint is clean of errors** (`eslint .` → 0 errors, 892 warnings) — but 842 warnings are jsx-a11y, deliberately downgraded and non-blocking (see [`08-dependencies-build.md`](08-dependencies-build.md)).
- **No CI, no test gate in git hooks** — the 146-test suite and the bundle budget only run if someone types `npm run build`.

---

## P1

### TEST-1 — ERP finance money/ledger logic is almost entirely untested
- **Priority:** P1 · **Effort:** L · **Confidence:** Confirmed
- **Files:** `ErpAccounts/FinanceHubService.js` (104), `ErpAdvances/AdvanceService.jsx` (184), `ErpLedger/LedgerService.jsx` (97), `ErpReceipts/ReceiptService.jsx` (103), `ErpSupplierPayments/SupplierPaymentService.jsx` (95), `ErpVendorPayments/VendorPaymentService.jsx` (86), `ErpOutstanding/OutstandingService.jsx` (58); `ErpAccounts/Account360Page.jsx` + 10 other Erp/Ledger JSX files doing `.reduce/.toFixed/parseFloat` arithmetic inline.
- **Evidence:** 28 `Erp*`/`*Ledger`/`Khata*` directories contain only **4** test files total — `ErpTrips/gpsDrop.test.js`, `ErpDeliveryOrders/doPlaces.test.js` (neither is money), and `KhataLedger/components/ledgerDetailLogic.test.js` (the one money test, and it's good). ~727 LOC of payment/ledger service code has **zero** tests; 11 JSX files do money arithmetic inline. (The leaf `formatMoney` *is* tested — the gap is the aggregation layer, not formatting.)
- **Root cause:** Rule 21 ("new logic in a pure module with unit tests") was applied to tracking/trip features but not the newer ERP finance surface; much math still lives inside `.jsx`, where it's hard to unit-test.
- **Impact:** Rounding/aggregation/sign errors in advances, receipts, payables, outstanding balances can ship undetected. **Highest financial-correctness risk in the app.**
- **Fix:** Extract reduce/rounding/balance logic from the ERP service `.jsx` files into pure `.js` modules and unit-test them (golden cases: zero, negatives, mixed signs, large sums, rounding boundaries), mirroring `ledgerDetailLogic`. Pin current output with tests *before* refactoring (rule 22).

### TEST-2 — No CI; tests never run in git hooks
- **Priority:** P1 · **Effort:** M · **Confidence:** Confirmed
- **Files:** `.husky/pre-commit` (only hook), no `.husky/pre-push`, no `.github/workflows/` (absent at repo root and in `frontend/`).
- **Evidence:** `.husky/pre-commit` = `cd frontend && npx lint-staged` → `eslint --fix` + `prettier --write` on *staged files only*. `package.json` `build` = `lint && test && vite build && check-bundle`, but nothing invokes it automatically.
- **Impact:** The 146-test suite, full-repo lint, and the 600 KB bundle budget are enforced only by developer discipline. A broken test or a bundle regression merges freely; `eslint --fix` with no `--max-warnings` means the 842 a11y warnings never block.
- **Fix:** Add a CI workflow running `npm run build` (or at least `lint` + `test` + `check-bundle`) on PRs, and/or a `pre-push` hook running `vitest run`. Add `--max-warnings` to ratchet a11y.

---

## P2

### TEST-3 — The page/component rendering layer is largely untested
- **Priority:** P2 · **Effort:** L · **Confidence:** Confirmed
- **Evidence:** `src/pages` has 566 non-test files but only 101 test files, and 126 `*Page.jsx` have only **7** sibling `*Page.test`; `src/components` has 101 files / **6** tests. 27 of 146 test files live in one feature (`Superadmin/components/lemu/graph`); next clusters are `utils/tests` (13), `lib` (11). Named tests are logic helpers (`tripDetail`, `tripCreationSubmit`, `liveTrackingNova`), not the page components. Big pages: LiveTracking 1 test, Geofence 1, Trip 7 (mostly logic).
- **Root cause:** Testing convention targets extracted pure modules; rendering/integration deliberately not covered — works where logic is extracted, leaves a hole where it isn't (TEST-1).
- **Impact:** Rendering regressions, prop/state wiring bugs, and JSX-embedded calculations have no safety net. The 146-file count overstates behavioral UI coverage.
- **Fix:** Add a thin layer of `@testing-library/react` interaction tests for the highest-traffic/highest-risk pages (LiveTracking, Trip create, ERP finance), and keep extracting logic so it's unit-testable.

---

## P3

### TEST-4 — No test-coverage measurement at all
- **Priority:** P3 · **Effort:** S · **Confidence:** Confirmed
- **Evidence:** `vitest.config.js` has no `coverage` block; no `@vitest/coverage-*` in `package.json`.
- **Impact:** Coverage is invisible — no way to track the TEST-1/TEST-3 gaps objectively or prevent regression.
- **Fix:** Add `@vitest/coverage-v8`, report coverage in CI (measure before thresholding).

---

## Error-handling cross-references (detailed in other files)
- Empty `.catch(() => {})` swallowing load failures → [`02-api-integration.md`](02-api-integration.md) API-8/API-14.
- Service layer discarding typed `ApiError` → API-1.
- Single root ErrorBoundary (no route-level containment) → [`05-security-reliability.md`](05-security-reliability.md) SEC-6.
- `parseSafe` zod validation adoption gap (13/77 modules) → API baseline.
