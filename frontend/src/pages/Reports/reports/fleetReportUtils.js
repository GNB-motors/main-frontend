/**
 * Shared pieces of the Driver and Vehicle reports — both come from the same
 * backend rules: litres/₹ are every bill in range, distance/km/L/₹ per km
 * only from completed cycles inside the plausible km/L band.
 *
 * Pure: unit tests live next to it.
 */

export const FLEET_REPORT_PAGE_SIZE = 10;

/** "2 cycles · 1 excluded" — what a km/L figure is based on. */
export function cycleNote(cycleCount = 0, excludedCycleCount = 0) {
  const used = cycleCount === 1 ? '1 cycle' : `${cycleCount} cycles`;
  if (!cycleCount && !excludedCycleCount) return 'No completed cycle';
  if (!excludedCycleCount) return used;
  return `${used} · ${excludedCycleCount} excluded`;
}

/** Tooltip explaining why cycles were left out of the ratios. */
export function excludedCycleHint(plausible) {
  const band = plausible ? ` (${plausible.min}–${plausible.max} km/L)` : '';
  return `Cycles with no distance or an impossible km/L${band} are left out of km/L and ₹/km — usually a mistyped odometer.`;
}

/** Filter labels written into the exported sheet's preamble. */
export function exportFilterMeta({ from, to, entityLabel }) {
  return [
    from || to ? { label: 'Period', value: `${from || '…'} → ${to || '…'}` } : null,
    entityLabel ? { label: 'Filter', value: entityLabel } : null,
  ].filter(Boolean);
}

export const DRIVER_EXPORT_COLUMNS = [
  { key: 'driverName', label: 'Driver' },
  { key: 'mobileNumber', label: 'Mobile' },
  { key: 'totalRefuels', label: 'Bills', type: 'number' },
  { key: 'totalDieselLiters', label: 'Diesel (L)', type: 'number' },
  { key: 'totalAdBlueLiters', label: 'AdBlue (L)', type: 'number' },
  { key: 'totalFuelCost', label: 'Fuel spend (₹)', type: 'currency' },
  { key: 'totalDistanceKm', label: 'Distance in cycles (km)', type: 'number' },
  { key: 'cycleCount', label: 'Cycles used', type: 'number' },
  { key: 'excludedCycleCount', label: 'Cycles excluded', type: 'number' },
  { key: 'avgMileageKmPerL', label: 'km/L', type: 'number' },
  { key: 'costPerKm', label: '₹/km', type: 'currency' },
  { key: 'lastRefuelAt', label: 'Last bill', type: 'date' },
];

export const VEHICLE_EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'vehicleType', label: 'Type' },
  { key: 'model', label: 'Model' },
  { key: 'totalRefuels', label: 'Bills', type: 'number' },
  { key: 'totalDieselLiters', label: 'Diesel (L)', type: 'number' },
  { key: 'totalDieselCost', label: 'Diesel (₹)', type: 'currency' },
  { key: 'totalAdBlueLiters', label: 'AdBlue (L)', type: 'number' },
  { key: 'totalAdBlueCost', label: 'AdBlue (₹)', type: 'currency' },
  { key: 'totalFuelCost', label: 'Fuel spend (₹)', type: 'currency' },
  { key: 'totalDistanceKm', label: 'Distance in cycles (km)', type: 'number' },
  { key: 'cycleCount', label: 'Cycles used', type: 'number' },
  { key: 'excludedCycleCount', label: 'Cycles excluded', type: 'number' },
  { key: 'averageEfficiencyKmpl', label: 'km/L', type: 'number' },
  { key: 'costPerKm', label: '₹/km', type: 'currency' },
  { key: 'lastRefuelAt', label: 'Last bill', type: 'date' },
];
