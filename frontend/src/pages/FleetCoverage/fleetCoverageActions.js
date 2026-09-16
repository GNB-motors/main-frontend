/**
 * Pure logic behind the "Add to fleet" actions on /fleet-coverage — split out
 * of FleetCoveragePage.jsx so it can be unit tested without rendering the
 * connected page (this repo tests page logic as plain functions, not via
 * full component render — see e.g. mileageIntervalReportUtils.js).
 */

export const ADD_TO_FLEET_ROLES = ['OWNER', 'MANAGER'];

/**
 * FleetEdge sometimes reports no registration at all ("NA"/blank). These rows
 * can't be added: registrationNumber is globally unique on Vehicle, so a
 * second blank/"NA" row would 409 against whichever one got created first.
 */
export const isAddableRegistration = (reg) => {
  const r = String(reg || '')
    .trim()
    .toUpperCase();
  return r !== '' && r !== 'NA' && r !== 'N/A';
};

/**
 * Row -> the payload createVehiclesBulk / addVehicle expect. VIN stands in
 * for chassisNumber — FleetEdge coverage rows carry no chassis number of
 * their own (same compromise as the existing bulk-upload/import flows).
 */
export const toVehiclePayload = (row) => ({
  registrationNumber: row.registrationNumber,
  model: row.vehicleModel || undefined,
  manufacturer: row.manufacturer || undefined,
  chassisNumber: row.vin || undefined,
});

/**
 * registrationNumber can be null/blank — fall back to the row's position so
 * every row still gets a stable, unique DataTable/selection key.
 */
export const edgeRowKey = (row, i) => row.registrationNumber || `_no-reg-${i}`;

/** Which rows a selection Set (of edgeRowKey values) resolves to, in order. */
export const selectedRowsFrom = (rows, selectedKeys) =>
  rows.filter((row, i) => selectedKeys.has(edgeRowKey(row, i)));
