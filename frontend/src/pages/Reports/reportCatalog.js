/**
 * Reports rendered inside the Reports hub. Fuel Management owns its standalone
 * Mileage, Fuel Integrity and DEF Ledger pages; they do not belong in this catalog.
 * Entries retain their feature flags so reports with gated APIs stay hidden
 * when the organization cannot open them.
 */

export const DEFAULT_REPORT = 'driver';

export const REPORT_GROUPS = [
  {
    id: 'fuel',
    label: 'FUEL & MILEAGE',
    children: [
      { id: 'vehicle', label: 'Vehicle Report' },
      { id: 'driver', label: 'Driver Report' },
      { id: 'mileageIntervals', label: 'Mileage Report' },
      { id: 'modelComparison', label: 'Model Comparison', flag: 'vehicleActivity' },
      { id: 'dieselReport', label: 'Diesel Report' },
      { id: 'adblueReport', label: 'AdBlue Report', flag: 'fuelIntegrity' },
    ],
  },
  {
    id: 'trips',
    label: 'TRIPS & ECONOMICS',
    children: [
      // Oil & Average's API (/api/auto-trips/oil-average) sits on the Auto Trips
      // router, which is gated by requireFeature('autoTrips') like this group.
      { id: 'oilAverage', label: 'Oil & Average Report', flag: 'autoTrips' },
      { id: 'fuelCycles', label: 'Fuel Cycles', flag: 'autoTrips' },
      { id: 'nonBusiness', label: 'Non-Business', flag: 'autoTrips' },
      { id: 'runningCost', label: 'Running Cost', flag: 'autoTrips' },
      { id: 'registerMatch', label: 'Trip Register Match', flag: 'autoTrips' },
      // SAP per route (/api/sap is gated by requireFeature('sapV2')). The id stays laneKm so
      // existing links keep working.
      { id: 'laneKm', label: 'SAP routes', flag: 'sapV2' },
    ],
  },
];

/** Groups with only the entries this org can open; empty groups are dropped. */
export function visibleReportGroups(isEnabled, groups = REPORT_GROUPS) {
  return groups
    .map((group) => ({
      ...group,
      children: group.children.filter((report) => !report.flag || isEnabled(report.flag)),
    }))
    .filter((group) => group.children.length > 0);
}

/** The route a catalog row navigates to, or null when it renders in this page. */
export function reportDestination(id, groups = REPORT_GROUPS) {
  const entry = groups.flatMap((group) => group.children).find((report) => report.id === id);
  return entry?.to || null;
}

/**
 * The report a given location is showing, so the rail highlights the right row
 * in the Reports hub (`?report=`). Standalone Fuel Management routes are not
 * report screens and have no active report.
 */
export function activeReportId(pathname, search, groups = REPORT_GROUPS) {
  if (pathname === '/reports') {
    return new URLSearchParams(search || '').get('report') || DEFAULT_REPORT;
  }
  const entry = groups
    .flatMap((group) => group.children)
    .find((report) => report.to && report.to.split('?')[0] === pathname);
  return entry?.id || null;
}

/** True when the row renders inside this page instead of linking out. */
export function isInlineReport(id, groups = REPORT_GROUPS) {
  return groups.some((group) => group.children.some((r) => r.id === id && !r.to));
}

/**
 * The report to show for a requested id — the request when the org can open
 * it, otherwise the default (always visible: it needs only `reports`). Rows
 * that link out are not answers here: they have no table on this page, so a
 * `?report=` naming one falls back rather than rendering the wrong report.
 */
export function resolveReport(requestedId, isEnabled, groups = REPORT_GROUPS) {
  const visible = visibleReportGroups(isEnabled, groups)
    .flatMap((g) => g.children)
    .filter((report) => !report.to);
  return visible.some((r) => r.id === requestedId) ? requestedId : DEFAULT_REPORT;
}
