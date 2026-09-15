# quarantine/

Source files that are **unreachable from the running app** but kept rather than
deleted, so they can be restored if the analysis was wrong or the feature returns.

Nothing here is built or linted:

- It sits outside `src/`, so Vite never bundles it.
- `quarantine` is in `globalIgnores` in `eslint.config.js`, alongside `Design` and
  `amitansu-handoff`.

Restoring any file is one `git mv` back to its original path, listed below.

Before quarantining anything, prove it is unreachable — check all four: static
imports, dynamic `import()`, barrel re-exports, and route path strings.

---

## 2026-09-06

Both were superseded by live replacements that already ship. Both were last touched
only by `38cf488`, a bulk lint-cleanup sweep — changed mechanically, not authored.

### `FuelComparisonReport.jsx` (586 lines)

- **Original path:** `src/pages/Reports/reports/FuelComparisonReport.jsx`
- **Restore:** `git mv quarantine/2026-09-06/FuelComparisonReport.jsx src/pages/Reports/reports/FuelComparisonReport.jsx`
- **Live replacement:** `src/pages/FuelComparison/FuelComparisonPage.jsx`
- **How it became unreachable:** added in `821f9f5` _with_ sidebar navigation, so it
  was reachable at the time. `1539788` ("Fuel Comparison page UI revamp") removed the
  import from `ReportsPage.jsx` when the new page took over. `ReportsSidebar.jsx` has
  no fuel-comparison entry, so no nav path remains.

### `RefuelLogsReport.jsx` (501 lines)

- **Original path:** `src/pages/Reports/reports/RefuelLogsReport.jsx`
- **Restore:** `git mv quarantine/2026-09-06/RefuelLogsReport.jsx src/pages/Reports/reports/RefuelLogsReport.jsx`
- **Live replacement:** `src/pages/Trip/RefuelLogsPage.jsx`
- **How it became unreachable:** added in `12a13b4`; the reference was later dropped.
  `ReportsPage.jsx:91` renders `Trip/RefuelLogsPage` for the `dieselReport` case, and
  `ReportsSidebar.jsx:22` lists only `{ id: 'dieselReport' }` — which points at the
  replacement, not at this file.
