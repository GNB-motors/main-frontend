/**
 * Pure helpers for the FleetEdge drift-log tab (WS0.7): flatten the API drift
 * records into table rows and apply the client-side text filter. The endpoint
 * has no text filter and paginates at 50/page, so the search runs over the
 * loaded page. Extracted from the tab so the mapping/filter is unit-testable.
 */

export function flattenDriftRows(rows) {
  return rows.map((row) => ({
    ...row,
    vehicleReg: row.vehicleId?.registrationNumber || row.vehicleId?.fleetEdgeRegistration || '',
    fromLabel: row.fromAccount?.friendlyName || row.fromAccount?.externalAccountId || '',
    toLabel: row.toAccount?.friendlyName || row.toAccount?.externalAccountId || '',
    detectedAt: row.createdAt,
  }));
}

export function filterDriftRows(rows, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) =>
    [r.vehicleReg, r.fromLabel, r.toLabel].some((value) => value.toLowerCase().includes(needle)),
  );
}

export function searchDriftRows(rows, q) {
  return filterDriftRows(flattenDriftRows(rows), q);
}
