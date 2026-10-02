/**
 * The Reports page's report list and the org feature flag each report's API
 * is gated behind. The page itself needs `reports`; a report whose own flag
 * the org lacks answers 404 (requireFeature), so it is hidden rather than
 * shown as a tab that can only error.
 *
 * Pure: unit tests live next to it.
 */

export const DEFAULT_REPORT = 'driver';

export const REPORT_GROUPS = [
  {
    id: 'fleet',
    label: 'FLEET REPORTS',
    children: [
      { id: 'driver', label: 'Driver Report' },
      { id: 'vehicle', label: 'Vehicle Report' },
      { id: 'mileageIntervals', label: 'Mileage Report' },
      { id: 'modelComparison', label: 'Model Comparison', flag: 'vehicleActivity' },
      { id: 'dieselReport', label: 'Diesel Report' },
      { id: 'adblueReport', label: 'AdBlue Report', flag: 'fuelIntegrity' },
    ],
  },
];

/** Groups with only the reports this org can open; empty groups are dropped. */
export function visibleReportGroups(isEnabled, groups = REPORT_GROUPS) {
  return groups
    .map((group) => ({
      ...group,
      children: group.children.filter((report) => !report.flag || isEnabled(report.flag)),
    }))
    .filter((group) => group.children.length > 0);
}

/**
 * The report to show for a requested id — the request when the org can open
 * it, otherwise the default (always visible: it needs only `reports`).
 */
export function resolveReport(requestedId, isEnabled, groups = REPORT_GROUPS) {
  const visible = visibleReportGroups(isEnabled, groups).flatMap((g) => g.children);
  return visible.some((r) => r.id === requestedId) ? requestedId : DEFAULT_REPORT;
}
