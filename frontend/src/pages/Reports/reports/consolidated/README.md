# Consolidated reports frontend

This directory adds **Fuel & Mileage** and **Trips & Running Cost** to `/reports`. Legacy reports remain accessible through **All reports**.

The backend's [feature README](https://github.com/GNB-motors/main-backend/blob/feat/consolidated-fuel-trip-reports/docs/consolidated-reports/README.md) documents source data, calculations, access control, worked examples, limits and the seeded audit.

## Views and URLs

| UI                                    | Query parameters                                      |
| ------------------------------------- | ----------------------------------------------------- |
| Daily engine report                   | `report=fuelMileage` (default `fuelView=day`)         |
| Confirmed full-to-full                | `report=fuelMileage&fuelView=bill&billView=full`      |
| Engine slip intervals / tank estimate | `report=fuelMileage&fuelView=bill&billView=slips`     |
| Purchases / retained cycle statistics | `report=fuelMileage&fuelView=bill&billView=purchases` |
| Running-cost groups                   | `report=tripsRunningCost&view=summary`                |
| Completed trip register               | `report=tripsRunningCost&view=trips`                  |
| Approved / deviation movement         | `report=tripsRunningCost&view=movements`              |

Add `from=YYYY-MM-DD&to=YYYY-MM-DD` for inclusive IST dates. The default period is 30 days. Search, truck/driver/manufacturer scope, grouping, sorting and view state are kept in the URL. `loc=all` selects owner-wide location context; manager scope remains enforced by the backend.

## Reading the numbers

- **Known fuel cost** includes supported portions of partial days. It is not automatically the complete fleet cost.
- **Distinct trucks** and **truck-days** are different counts. Reported zero-use days are counted separately from positively priced trucks.
- Mileage uses matched usable fuel/distance windows. Small zero-fuel movements stay visible without invalidating otherwise usable cost; the allowance is 0.2 km per original engine window / 0.5 km per truck-day.
- Day-wise and trip valuation use Daily Digest historical state diesel pricing. Actual bills and full-to-full refill spend retain their bill amounts; slip consumption uses earlier slip rates.
- Full-to-full excludes the opening fill and requires explicit full-tank confirmation. `MAIN` does not mean a confirmed full tank.
- Tank stock needs a stored capacity and a confirmed full baseline. Missing engine coverage or impossible stock stops the estimate until a new full anchor.
- Completed trips exclude replaced/open/review candidates. Partial role fuel cannot establish full mileage. A conflicting saved role reading is labelled when direct fuel drives mileage and valuation.
- Unknown prices/consumption are shown as unavailable, not free running. Capped reports disclose that totals and exports are partial.

## Code map

| File                           | Responsibility                                                    |
| ------------------------------ | ----------------------------------------------------------------- |
| `FuelReportPage.jsx`           | Fuel mode navigation, daily evidence and strict full cycles       |
| `SlipToSlipReport.jsx`         | Engine slip intervals, stock and reconciliation                   |
| `FuelMileageReport.jsx`        | Retained purchase/cycle grouped view and details                  |
| `TripsRunningCostReport.jsx`   | Cost groups, trip/movement registers and source links             |
| `ConsolidatedReportService.js` | Report API adapters and daily/full/slip query shaping             |
| `useConsolidatedReport.js`     | URL scope, IST dates, branch synchronization and debounced search |
| `consolidatedReportModel.js`   | Sorting, grouping and CSV/XLSX column definitions                 |
| `ConsolidatedReportParts.jsx`  | Shared filters, evidence controls, cost coverage and links        |

`useApi` uses a scope key to prevent old filter results appearing under a new scope. Sorting occurs before pagination. Exports include all rows returned for the selected view, with coverage fields, rather than only the visible page. Login preserves a safe internal report return path.

## Seeded browser preview

In the matching backend checkout, start a local test Redis on 6398 and run:

```sh
node tests/helpers/consolidatedReportsPreview.js
```

Then from this repository's `frontend` directory:

```sh
VITE_API_BASE_URL=http://127.0.0.1:6412 npm run dev -- --host 127.0.0.1 --port 6511 --strictPort
```

Open <http://127.0.0.1:6511/reports?report=fuelMileage&from=2026-11-05&to=2026-11-05>. Login `reports@local.test` / `LocalReports17!`. The synthetic truck `QA11A1234` has 40 L engine fuel, 120 km, 3 km/L and ₹4,040 daily valuation. Full-to-full refill spend is ₹6,200; slip consumption cost is ₹4,200; purchases are ₹46,200. These deliberately different totals test the different business meanings.

This preview uses a fresh disposable database and synthetic login/shell metadata. It does not validate production login, provider ingestion or real fleet freshness. The separate BD copy preview can continue on 6509.

## Checks

From `frontend`:

```sh
npx vitest run src/pages/Reports/reports/consolidated src/components/RequireAuth.test.jsx src/pages/Login/loginReturnPath.test.js src/pages/Reports/reportCatalog.test.js src/pages/Reports/reports/reportFilterParams.test.js
npm run build
```

Manual checks: switch each mode, inspect opening/closing evidence, change scope, enter/reverse dates, clear search, group/sort, page through records, export CSV/XLSX, inspect price/conflict notices, and horizontally scroll wide tables on a phone. Check both light and dark themes.
