/**
 * Pure view-model for the read-only iALERT accounts page (iALERT F1).
 *
 * Source: GET api/extension/ialert/status (backend B4 getStatus). One row per
 * linked iALERT session of the signed-in user:
 *   { accountId, externalAccountId, friendlyName, accountStatus, status,
 *     expiresAt, canSelfRenew, vehicleCount, lastDataAt,
 *     plan: { expired, next15, next30, pulledAt, fleetCount: { ialert, nonialert, total } } | null,
 *     lastErrorMessage, … }
 * `plan.expired/next15/next30` are VEHICLE COUNTS per subscription bucket, not flags.
 */

/** Unwrap the API envelope ({ status, data: [...] }); anything else → []. */
export function statusRows(responseBody) {
  const rows = responseBody?.data ?? responseBody;
  return Array.isArray(rows) ? rows : [];
}

/** One badge per row. The account's admin state wins over the session state. */
export function connectionBadge(row) {
  if (row?.accountStatus === 'DISABLED') return { label: 'Disabled by admin', tone: 'grey' };
  if (row?.accountStatus === 'AUTH_FAILED') return { label: 'Reconnect needed', tone: 'crit' };
  if (row?.status === 'NEEDS_REAUTH') {
    return row.canSelfRenew
      ? { label: 'Renewing', tone: 'warn' }
      : { label: 'Reconnect needed', tone: 'crit' };
  }
  if (row?.status === 'ACTIVE') return { label: 'Connected', tone: 'ok' };
  return { label: row?.status || 'Unknown', tone: 'grey' };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Subscription buckets as short phrases, most urgent first; empty when the
 * plan is unknown or nothing is expiring. Zeros are omitted, nulls ignored.
 */
export function planPhrases(plan) {
  if (!plan) return [];
  const out = [];
  if (plan.expired > 0)
    out.push({ text: `${plural(plan.expired, 'vehicle')} expired`, tone: 'crit' });
  if (plan.next15 > 0)
    out.push({ text: `${plural(plan.next15, 'vehicle')} expire within 15 days`, tone: 'warn' });
  if (plan.next30 > 0)
    out.push({ text: `${plural(plan.next30, 'vehicle')} expire within 30 days`, tone: 'warn' });
  return out;
}

/** Total vehicles iALERT reports for the fleet, or null. */
export function planFleetTotal(plan) {
  const total = plan?.fleetCount?.total;
  return Number.isFinite(total) ? total : null;
}
