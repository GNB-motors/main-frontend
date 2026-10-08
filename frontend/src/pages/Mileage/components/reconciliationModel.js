/**
 * Reconciliation tab — pure helpers. Rows come from the existing fuel-comparison
 * API (GET /api/extension/comparisons): one row per refuel-to-refuel cycle, the
 * litres billed in that cycle against the litres FleetEdge measured.
 */

/**
 * Query params for /api/extension/comparisons. Its Joi schema rejects unknown keys
 * and an empty `search`, so only send what it accepts.
 */
export function comparisonParams({ page, limit, search, status }) {
  const q = (search || '').trim();
  return {
    page,
    limit,
    ...(q ? { search: q } : {}),
    ...(status === 'flagged' ? { flaggedOnly: 'true' } : {}),
  };
}

/** CLEAN | FLAGGED | REVIEW for a comparison task. */
export function rowStatus(task) {
  if (task?.isFlagged) return 'FLAGGED';
  if (task?.status === 'PENDING_REVIEW') return 'REVIEW';
  return 'CLEAN';
}

/**
 * A comparison task as a table row. The backend's variance is bill − telematics;
 * this table reads telematics − bill, so a negative number means more fuel was
 * billed than the tank measured.
 */
export function toReconciliationRow(task) {
  const bill = task?.billFuelConsumed ?? null;
  const telematics = task?.fleetEdgeFuelConsumed ?? null;
  let varianceL = null;
  if (task?.variance != null) varianceL = -task.variance;
  else if (bill != null && telematics != null) varianceL = telematics - bill;
  return {
    _id: task?._id,
    vehicleNumber: task?.vehicleNumber || task?.vehicleId?.registrationNumber || null,
    fromDate: task?.fromDate || null,
    billDate: task?.toDate || null,
    billLitres: bill,
    telemetryLitres: telematics,
    varianceL,
    variancePct: task?.variancePercent != null ? -task.variancePercent : null,
    status: rowStatus(task),
    flagReason: task?.flagReason || null,
    task,
  };
}

/** "−17.0 L (−17.9%)" — '—' when unknown. */
export function varianceText(row) {
  if (row?.varianceL == null) return '—';
  const sign = row.varianceL > 0 ? '+' : '';
  const pct =
    row.variancePct == null
      ? ''
      : ` (${row.variancePct > 0 ? '+' : ''}${row.variancePct.toFixed(1)}%)`;
  return `${sign}${row.varianceL.toFixed(1)} L${pct}`;
}
